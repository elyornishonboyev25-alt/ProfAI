import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { TalkOverlay } from '@/components/ai/TalkOverlay'
import { useAiTutor, type AiTutorController } from '@/components/ai/useAiTutor'
import { RealtimeCoach } from '@/lib/realtimeCoach'
import { cancelCoachAudio } from '@/lib/coachAudio'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAuthStore } from '@/store/authStore'

export async function run() {
  const nativeFetch = globalThis.fetch
  const originalAudio = globalThis.Audio
  const originalPeer = globalThis.RTCPeerConnection
  const originalMedia = navigator.mediaDevices
  const originalRecognition = (window as any).SpeechRecognition
  const originalStart = RealtimeCoach.prototype.start
  const originalStop = RealtimeCoach.prototype.stop
  const originalUpdate = RealtimeCoach.prototype.updateContext
  const root = createRoot(document.getElementById('root')!)
  const date = new Date().toISOString()
  const releases: Array<() => void> = []
  let blockPersistence = false, blockReply = false, audioRequests = 0, liveStarts = 0, liveStops = 0
  let liveOptions: any
  let releaseReply: (() => void) | undefined
  let tutor: AiTutorController
  function Harness() { tutor = useAiTutor(); return null }
  class FakeAudio {
    src = ''; onplaying: (() => void) | null = null; onended: (() => void) | null = null
    setAttribute() {} pause() {}
    async play() { this.onplaying?.() }
  }
  class FakeRecognition { start() {} stop() {} abort() {} }
  Object.defineProperty(globalThis, 'Audio', { configurable: true, value: FakeAudio })
  Object.defineProperty(globalThis, 'RTCPeerConnection', { configurable: true, value: class {} })
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [] }) } })
  ;(window as any).SpeechRecognition = FakeRecognition
  RealtimeCoach.prototype.start = async function () { liveStarts++; liveOptions = (this as any).options; liveOptions.state('listening') }
  RealtimeCoach.prototype.stop = function () { liveStops++ }
  RealtimeCoach.prototype.updateContext = async () => {}
  useAuthStore.setState({ user: { id: 'voice-reliability', role: 'ADMIN', fullName: 'Learner' } as any, accessToken: 'test-token' })
  const reply = () => new Response(`event: done\ndata: ${JSON.stringify({ reply: 'A clear natural reply.', replyLanguage: 'en', actions: [], memoryUpdates: [{ key: 'goal', value: 'Speaking practice' }] })}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } })
  globalThis.fetch = async (url, options) => {
    const path = String(url), method = options?.method ?? 'GET'
    let result: unknown = { items: [] }
    if (path.endsWith('/ai-workspace/threads') && method === 'GET') result = { items: [{ id: 'saved-voice', title: 'Voice', createdAt: date, updatedAt: date, synced: true, messages: [{ id: 'old', role: 'user', content: 'Earlier question.', createdAt: date }] }] }
    if (path.endsWith('/profile/ai-preferences')) result = { preferredLocale: 'en', preferredName: null }
    if (path.endsWith('/ai/voice/capabilities')) result = { naturalVoice: true, spokenReplies: true }
    if (path.endsWith('/ai/speaking-audio/voice')) { audioRequests++; result = { audioBase64: btoa('audio'), mimeType: 'audio/mpeg' } }
    if (path.endsWith('/ai/assistant/stream')) {
      if (blockReply) return new Promise((resolve) => { releaseReply = () => resolve(reply()) })
      return reply()
    }
    if (blockPersistence && ((method === 'POST' && path.endsWith('/messages')) || (method === 'PUT' && path.endsWith('/memories')))) {
      return new Promise((resolve) => releases.push(() => resolve(Response.json({ items: [] }))))
    }
    return Response.json(result)
  }
  const settle = async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 25)) }) }
  try {
    await act(async () => { await i18n.changeLanguage('en'); root.render(<MemoryRouter><Harness /></MemoryRouter>) })
    await settle()
    blockPersistence = true
    let sent = false
    await act(async () => { void tutor!.send({ text: 'Start speaking promptly.', speak: true }).then(() => { sent = true }) })
    await settle()
    assert.ok(releases.length >= 2, 'User-message and memory persistence are deliberately held pending')
    assert.equal(audioRequests, 1, 'Natural audio starts before chat and memory persistence finishes')
    assert.equal(sent, true, 'Slow persistence cannot hold the conversation sending state')
    assert.equal(tutor!.voiceState, 'speaking')
    await act(async () => { tutor!.cancelVoice(); releases.splice(0).forEach((release) => release()) })
    blockPersistence = false; blockReply = true
    await act(async () => { void tutor!.send({ text: 'A delayed reply.', speak: true }) })
    await settle()
    assert.ok(releaseReply)
    await act(async () => { tutor!.cancelVoice(); releaseReply!() })
    await settle()
    assert.equal(audioRequests, 1, 'Closing voice while an answer is pending cannot start late audio')
    blockReply = false
    await act(async () => { root.render(<MemoryRouter><Harness /><TalkOverlay /></MemoryRouter>); useAiAssistantStore.getState().openTalk() })
    await settle()
    assert.equal(liveStarts, 1, 'Available streamed voice is preferred even when Speaking TTS is also available')
    assert.ok(document.body.textContent?.includes('IELTS examiner'))
    await act(async () => { liveOptions.error(new Error('Temporary connection failure')); liveOptions.state('idle') })
    await settle()
    assert.ok(document.querySelector('[role="dialog"][aria-label="Speak"]'), 'Connection failure switches automatically to natural Speaking audio')
    assert.equal(liveStops, 1)
    await act(async () => useAiAssistantStore.getState().closeTalk())
    await act(async () => useAiAssistantStore.getState().openTalk())
    await settle()
    assert.equal(liveStarts, 2, 'A new call retries streamed voice rather than retaining the previous error')
    console.log('PASS: prompt audio despite slow persistence, no late audio after cancellation, streamed voice priority and automatic natural fallback')
  } finally {
    releases.splice(0).forEach((release) => release())
    releaseReply?.()
    await act(async () => { useAiAssistantStore.getState().closeTalk(); root.unmount() })
    cancelCoachAudio()
    globalThis.fetch = nativeFetch
    Object.defineProperty(globalThis, 'Audio', { configurable: true, value: originalAudio })
    Object.defineProperty(globalThis, 'RTCPeerConnection', { configurable: true, value: originalPeer })
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: originalMedia })
    ;(window as any).SpeechRecognition = originalRecognition
    RealtimeCoach.prototype.start = originalStart; RealtimeCoach.prototype.stop = originalStop; RealtimeCoach.prototype.updateContext = originalUpdate
  }
}
