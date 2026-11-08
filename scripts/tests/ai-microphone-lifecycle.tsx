import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { useAiTutor, type AiTutorController } from '@/components/ai/useAiTutor'
import { createMicMeter } from '@/lib/audioMeter'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import i18n from '@/i18n'

export async function run() {
  const originalFetch = globalThis.fetch
  const originalMedia = navigator.mediaDevices
  const originalRecognition = (window as any).SpeechRecognition
  const originalContext = window.AudioContext
  const host = document.getElementById('root')!
  const root = createRoot(host)
  const tracks: Array<{ readyState: string; stops: number; stop(): void }> = []
  const grants: Array<() => void> = []
  const recognizers: Recognition[] = []
  let contextCloses = 0, brokenAnalyser = false, sent = 0, brokenRecognition = false
  let tutor: AiTutorController
  let navigate: ReturnType<typeof useNavigate>
  class Recognition {
    onresult: any; onerror: any; onend: any; onstart: any
    active = false; starts = 0; aborts = 0
    constructor() { recognizers.push(this) }
    start() { this.active = true; this.starts++; if (brokenRecognition) throw new Error('Recognition failed to start') }
    stop() {} // Deliberately withhold onend to exercise cancellation of a pending stop.
    abort() { this.active = false; this.aborts++ }
  }
  class Context {
    createMediaStreamSource() { return { connect() { if (brokenAnalyser) throw new Error('Audio graph failed') }, disconnect() {} } }
    createAnalyser() { return { fftSize: 512, smoothingTimeConstant: 0, frequencyBinCount: 256, getByteTimeDomainData(bytes: Uint8Array) { bytes.fill(128) } } }
    async close() { contextCloses++ }
  }
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: Context })
  ;(window as any).SpeechRecognition = Recognition
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: () => {
    const track = { readyState: 'live', stops: 0, stop() { this.readyState = 'ended'; this.stops++ } }
    tracks.push(track)
    return new Promise(resolve => grants.push(() => resolve({ getTracks: () => [track], getAudioTracks: () => [track] })))
  } } })
  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/ai/assistant/stream')) { sent++; return new Response('event: done\ndata: {"reply":"","actions":[],"memoryUpdates":[]}\n\n', { headers: { 'Content-Type': 'text/event-stream' } }) }
    if (String(url).endsWith('/profile/ai-preferences')) return Response.json({ preferredLocale: 'en' })
    return Response.json({ items: [] })
  }
  const user = { id: 'mic-lifecycle', role: 'ADMIN', fullName: 'Learner' } as any
  const owner = `user:${user.id}`
  const now = new Date().toISOString()
  useAuthStore.setState({ user, accessToken: 'fixture-token' })
  useAiAssistantStore.setState({ talkOpen: true, isOpen: false, threadsLoaded: { [owner]: true },
    activeThreadIds: { [owner]: 'saved-chat' }, threadsByOwner: { [owner]: [{ id: 'saved-chat', title: 'Voice', synced: true, createdAt: now, updatedAt: now, messages: [] }] } })
  function Harness({ surface }: { surface: 'talk' | 'floating' | 'workspace' }) {
    tutor = useAiTutor(surface)
    navigate = useNavigate()
    return null
  }
  let generation = 0
  const mount = async (surface: 'talk' | 'floating' | 'workspace' = 'talk') => {
    await act(async () => root.render(<MemoryRouter key={++generation}><Harness surface={surface} /></MemoryRouter>))
  }
  const start = async () => {
    let pending!: Promise<void>
    await act(async () => { pending = tutor!.startVoice() })
    return { pending, grant: grants.at(-1)!, track: tracks.at(-1)! }
  }
  const finishStart = async (capture: Awaited<ReturnType<typeof start>>) => {
    await act(async () => { capture.grant(); await capture.pending })
  }
  const released = () => assert.ok(tracks.every(track => track.readyState === 'ended'), 'Every acquired microphone track is ended')
  try {
    await i18n.changeLanguage('en')
    await mount()
    const late = await start()
    await act(async () => useAiAssistantStore.getState().closeTalk())
    await finishStart(late)
    assert.equal(late.track.stops, 1)
    assert.equal(recognizers.length, 0, 'Closing before permission resolves cannot start speech recognition')
    assert.equal(tutor!.voiceState, 'idle')

    await act(async () => useAiAssistantStore.getState().openTalk())
    const first = await start(), second = await start()
    await finishStart(second)
    const active = recognizers.at(-1)!
    await finishStart(first)
    assert.equal(first.track.readyState, 'ended', 'A superseded permission grant is released')
    assert.equal(second.track.readyState, 'live')
    assert.equal(active.starts, 1)
    const lateEnd = active.onend, lateResult = active.onresult
    await act(async () => useAiAssistantStore.getState().closeTalk())
    assert.equal(second.track.readyState, 'ended', 'Store-driven close releases the meter synchronously')
    assert.equal(active.active, false, 'Store-driven close aborts recognition without waiting for final text')
    await act(async () => { lateEnd?.(); lateResult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'Late discarded words' } }] }); await new Promise(resolve => setTimeout(resolve, 180)) })
    assert.equal(active.starts, 1, 'Late onend cannot restart a closed recognizer')
    assert.equal(sent, 0)

    await act(async () => useAiAssistantStore.getState().openTalk())
    const errored = await start()
    await finishStart(errored)
    await act(async () => recognizers.at(-1)!.onerror({ error: 'network' }))
    assert.equal(errored.track.readyState, 'ended')
    assert.equal(recognizers.at(-1)!.active, false, 'A fatal recognition error releases its independent capture')
    await act(async () => useAiAssistantStore.getState().closeTalk())
    assert.equal(tutor!.voiceError, null, 'Closing clears the old failure so a new conversation can auto-listen')
    await act(async () => useAiAssistantStore.getState().openTalk())
    brokenRecognition = true
    const failedStart = await start()
    await finishStart(failedStart)
    assert.equal(failedStart.track.readyState, 'ended', 'A recognizer start failure releases the already-open meter')
    assert.equal(recognizers.at(-1)!.active, false)
    brokenRecognition = false

    const stopping = await start()
    await finishStart(stopping)
    let finishing!: Promise<void>
    await act(async () => { finishing = tutor!.stopVoice(); tutor!.cancelVoice(); await finishing })
    assert.equal(sent, 0, 'Closing during a pending final transcript never sends stale speech')
    assert.equal(tutor!.voiceState, 'idle')
    assert.equal(tutor!.voiceError, null, 'A cancelled final transcript cannot leave an error in the next conversation')

    const silentStop = await start()
    await finishStart(silentStop)
    const nativeTimeout = window.setTimeout
    let stopDeadline: (() => void) | undefined
    try {
      window.setTimeout = ((callback: () => void, milliseconds?: number) => {
        if (milliseconds === 2500) { stopDeadline = callback; return 999997 }
        return nativeTimeout(callback, milliseconds)
      }) as typeof window.setTimeout
      await act(async () => { finishing = tutor!.stopVoice() })
      assert.ok(stopDeadline)
      await act(async () => { stopDeadline!(); await finishing })
      assert.equal(recognizers.at(-1)!.active, false, 'A missing onend cannot keep recognition capturing past its stop deadline')
    } finally { window.setTimeout = nativeTimeout }

    const route = await start()
    await finishStart(route)
    await act(async () => navigate!('/outside-ai'))
    assert.equal(route.track.readyState, 'ended')
    assert.equal(useAiAssistantStore.getState().talkOpen, false, 'Leaving the AI page closes the voice session')

    await mount('floating')
    await act(async () => useAiAssistantStore.getState().open())
    const floating = await start()
    await finishStart(floating)
    await act(async () => useAiAssistantStore.getState().close())
    assert.equal(floating.track.readyState, 'ended', 'Floating chat close does not wait for exit animation/unmount')

    const account = await start()
    await finishStart(account)
    await act(async () => useAuthStore.setState({ user: { ...user, id: 'next-owner' } }))
    assert.equal(account.track.readyState, 'ended', 'Changing accounts releases the old microphone')

    const unmounted = await start()
    await act(async () => root.render(null))
    await finishStart(unmounted)
    assert.equal(unmounted.track.readyState, 'ended', 'A permission grant arriving after unmount is stopped')

    brokenAnalyser = true
    const closesBeforeFailure = contextCloses
    const broken = createMicMeter()
    grants.at(-1)!()
    await assert.rejects(broken, /Audio graph failed/)
    assert.equal(tracks.at(-1)!.readyState, 'ended', 'Audio setup failure cannot leak a microphone')
    assert.equal(contextCloses, closesBeforeFailure + 1)
    released()
    console.log('PASS: microphone cleanup on close, delayed permission, overlapping starts, recognition failure, pending stop, navigation, account change, unmount and audio setup failure')
  } finally {
    await act(async () => root.unmount())
    globalThis.fetch = originalFetch
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: originalMedia })
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: originalContext })
    ;(window as any).SpeechRecognition = originalRecognition
  }
}
