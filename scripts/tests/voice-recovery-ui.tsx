import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { GeminiRealtimeCoach } from '@/lib/geminiRealtimeCoach'
import { VoiceStreamError, voiceSocketClosed } from '@/lib/voiceStreamError'
import { useRealtimeCoach } from '@/components/ai/useRealtimeCoach'
import { useAuthStore } from '@/store/authStore'
import type { AiTutorController } from '@/components/ai/useAiTutor'

export async function run() {
  assert.equal(voiceSocketClosed({ code: 1006, reason: '' }).retryable, true)
  assert.equal(voiceSocketClosed({ code: 1008, reason: 'Invalid ticket' }).retryable, false)
  assert.equal(voiceSocketClosed({ code: 1000, reason: 'Session ended' }).retryable, false)
  const prototype = GeminiRealtimeCoach.prototype
  const originals = { start: prototype.start, stop: prototype.stop, updateContext: prototype.updateContext }
  const sessions: any[] = []
  prototype.start = async function () { sessions.push(this); (this as any).options.state('listening') }
  prototype.stop = function () { (this as any).options.state('idle') }
  prototype.updateContext = async function () {}
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia() {} } })
  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, value: class {} })
  Object.defineProperty(globalThis, 'AudioWorkletNode', { configurable: true, value: class {} })
  Object.defineProperty(globalThis, 'WebSocket', { configurable: true, value: class {} })
  const user = { id: 'voice-recovery', role: 'USER' } as any
  useAuthStore.setState({ user })
  const thread = { id: 'owned', clientId: 'stable', messages: [] } as any
  let controls: ReturnType<typeof useRealtimeCoach>
  function Harness({ enabled = true }: { enabled?: boolean }) {
    controls = useRealtimeCoach({ user, activeThread: thread, activeThreadId: thread.id, threadsLoaded: true, hasPremium: true, cancelVoice() {}, cancelSend() {} } as unknown as AiTutorController, enabled, 'coach', 'gemini')
    return <span>{controls.reconnecting ? 'reconnecting' : controls.error ?? 'connected'}</span>
  }
  const root = createRoot(document.getElementById('root')!)
  const wait = (ms: number) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) })
  const fail = (retryable: boolean) => act(async () => { sessions.at(-1).options.error(new VoiceStreamError('Fixture disconnect', 'VOICE_TEST', retryable)) })
  try {
    await act(async () => root.render(<MemoryRouter><Harness /></MemoryRouter>))
    assert.equal(sessions.length, 1)
    await fail(true)
    assert.equal(controls!.reconnecting, true)
    assert.equal(controls!.error, null)
    await wait(1150)
    assert.equal(sessions.length, 2)
    await fail(true); await wait(2150)
    assert.equal(sessions.length, 3)
    await fail(true); await wait(1100)
    assert.equal(sessions.length, 3, 'Repeated failures stop after two automatic retries')
    assert.equal(controls!.error, 'Fixture disconnect')
    await act(async () => controls!.reconnect())
    assert.equal(sessions.length, 4, 'An explicit retry resets the bounded recovery budget')
    await fail(false); await wait(1100)
    assert.equal(sessions.length, 4, 'Rejected streams and quota errors never enter a retry loop')
    await act(async () => controls!.reconnect())
    await fail(true)
    await act(async () => root.render(<MemoryRouter><Harness enabled={false} /></MemoryRouter>))
    await wait(1150)
    assert.equal(sessions.length, 5, 'Closing voice cancels a pending reconnect')
    console.log('PASS: temporary disconnects recover automatically; retries are bounded, explicit rejections remain visible, and closing cancels recovery')
  } finally { await act(async () => root.unmount()); Object.assign(prototype, originals) }
}
