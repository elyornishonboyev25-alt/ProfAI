import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { useRealtimeCoach } from '@/components/ai/useRealtimeCoach'
import LiveVoiceTranscript from '@/components/ai/LiveVoiceTranscript'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import type { AiTutorController } from '@/components/ai/useAiTutor'

export async function run() {
  const originalPost = apiClient.post
  const host = document.getElementById('root')!
  const root = createRoot(host)
  const user = { id: 'streaming-user', fullName: 'Learner', email: 'test@example.invalid', role: 'USER' } as any
  const owner = `user:${user.id}`
  const now = new Date().toISOString()
  const initial = { id: 'thread-stream', title: 'Voice chat', createdAt: now, updatedAt: now, synced: true, messages: [] }
  useAuthStore.setState({ user })
  useAiAssistantStore.setState({ threadsByOwner: { [owner]: [initial] } })
  let channel: any
  let peers = 0
  let micStops = 0
  let ended = 0
  const contexts: any[] = []
  const sent: any[] = []
  const saved: any[] = []
  class Peer {
    localDescription: any
    connectionState = 'connected'
    ontrack: any
    onconnectionstatechange: any
    constructor() { peers++ }
    addTrack() {}
    createDataChannel() {
      channel = { readyState: 'connecting', onopen: null, onmessage: null, onclose: null,
        send: (text: string) => sent.push(JSON.parse(text)), close() { this.readyState = 'closed' } }
      return channel
    }
    async createOffer() { return { type: 'offer', sdp: 'v=0\r\ns=voice-stream\r\n' } }
    async setLocalDescription(value: any) { this.localDescription = value }
    async setRemoteDescription() { channel.readyState = 'open'; channel.onopen?.() }
    close() {}
  }
  class Audio { autoplay = false; srcObject: any; setAttribute() {} async play() {} pause() {} }
  Object.defineProperty(globalThis, 'RTCPeerConnection', { value: Peer, configurable: true })
  Object.defineProperty(globalThis, 'Audio', { value: Audio, configurable: true })
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => {
    const track = { enabled: true, onended: null, stop() { micStops++ } }
    return { getTracks: () => [track], getAudioTracks: () => [track] }
  } }, configurable: true })
  apiClient.post = (async (path: string, body: any) => {
    if (path === '/ai/voice/connect') return { id: 'stream-session', sdp: 'v=0\r\ns=answer\r\n', maxMinutes: 20 }
    if (path === '/ai/voice/end') { ended++; return {} }
    if (path === '/ai/voice/context') { contexts.push(body.context); return {} }
    if (path.endsWith('/messages')) { saved.push(body); return {} }
    throw new Error(`Unexpected request: ${path}`)
  }) as typeof apiClient.post
  let controls: ReturnType<typeof useRealtimeCoach>
  function Harness({ workspace = 'general' }: { workspace?: 'general' | 'ielts' }) {
    const thread = useAiAssistantStore(state => state.threadsByOwner[owner][0])
    controls = useRealtimeCoach({ user, hasPremium: true, threadsLoaded: true, activeThread: thread, activeThreadId: thread.id,
      activeWorkspace: workspace, voiceLang: 'uz', cancelVoice() {}, cancelSend() {}, acceptCoachResult() {} } as unknown as AiTutorController, true, 'coach')
    return <LiveVoiceTranscript messages={thread.messages} caption={controls.caption} language="uz" />
  }
  const wait = (ms = 110) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) })
  const emit = async (event: unknown) => { await act(async () => channel.onmessage({ data: JSON.stringify(event) })); await wait() }
  const messages = () => useAiAssistantStore.getState().threadsByOwner[owner][0].messages
  try {
    await act(async () => root.render(<MemoryRouter><Harness /></MemoryRouter>))
    await wait()
    await wait(650)
    assert.equal(contexts.length, 0, 'Startup and the initial context effect do not resend the SDP context')
    await emit({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'u1', delta: 'Salom' })
    assert.match(host.textContent!, /SizSalom/)
    assert.equal(saved.length, 0, 'Partial input is visible but not sent to durable history')
    await emit({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'u1', transcript: 'Salom.' })
    assert.equal(messages().length, 1)
    assert.equal(messages()[0].status, undefined)
    assert.equal(saved.length, 1)
    await emit({ type: 'response.created', response: { id: 'r1' } })
    await emit({ type: 'output_audio_buffer.started', response_id: 'r1' })
    await emit({ type: 'response.output_audio_transcript.delta', item_id: 'a1', response_id: 'r1', delta: 'Salom, ' })
    await emit({ type: 'response.output_audio_transcript.delta', item_id: 'a1', response_id: 'r1', delta: 'boshlaymiz.' })
    assert.match(host.textContent!, /NovaSalom, boshlaymiz\./)
    assert.equal(messages()[1].status, 'streaming')
    assert.equal(saved.length, 1, 'Live assistant drafts do not count as heard or finalized messages')
    await emit({ type: 'response.output_audio_transcript.done', item_id: 'a1', response_id: 'r1', transcript: 'Salom, boshlaymiz.' })
    await emit({ type: 'response.done', response: { id: 'r1', status: 'completed' } })
    await emit({ type: 'output_audio_buffer.stopped', response_id: 'r1' })
    assert.equal(messages().length, 2, 'Completion replaces the draft without duplicating the answer')
    assert.equal(messages()[1].status, undefined)
    assert.equal(saved.length, 2)
    await act(async () => controls!.setSpeechSpeed(1.25))
    assert.equal(sent.at(-1).session.audio.output.speed, 1.25)
    await act(async () => root.render(<MemoryRouter><Harness workspace="ielts" /></MemoryRouter>))
    await wait(650)
    assert.equal(peers, 1, 'Changing the study workspace updates context without ending a live call')
    assert.equal(contexts.length, 1, 'A workspace change sends exactly one changed context')
    assert.equal(contexts[0].threadId, initial.id, 'Page updates retain the chat bound at connection time')
    await emit({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'unfinished', delta: 'Partial input' })
    await act(async () => root.unmount())
    assert.equal(messages().some(message => message.id === 'voice-unfinished'), false, 'Closing the call removes unfinished input previews')
    assert.equal(saved.length, 2)
    assert.equal(micStops, 1)
    assert.equal(ended, 1)
    console.log('PASS: live input/output text streams into chat, finalizes once after playback, changes speed and survives workspace changes')
  } finally {
    apiClient.post = originalPost
  }
}
