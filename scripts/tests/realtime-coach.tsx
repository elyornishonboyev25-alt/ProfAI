import assert from 'node:assert/strict'
import { RealtimeCoach } from '@/lib/realtimeCoach'
import { analyseTranscript, estimateBandsFromStats } from '@/lib/speakingScoring'
import { evaluateSpeaking } from '@/services/speakingAI'
import { useAuthStore } from '@/store/authStore'

export async function run() {
  const originalFetch = globalThis.fetch
  const states: string[] = [], messages: any[] = [], captions: string[] = [], results: any[] = [], sent: any[] = []
  let micStops = 0, peerCloses = 0, ends = 0
  let currentPeer: FakePeer
  const levels: number[] = []
  let nextFrame: FrameRequestCallback | null = null
  const originalFrame = globalThis.requestAnimationFrame
  const originalCancelFrame = globalThis.cancelAnimationFrame
  const originalAudioContext = globalThis.AudioContext
  globalThis.requestAnimationFrame = (callback) => { nextFrame = callback; return 1 }
  globalThis.cancelAnimationFrame = () => { nextFrame = null }
  const track = { enabled: true, onended: null, stop() { micStops++ } }
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] }
  class FakeAudioContext {
    async resume() {} async close() {}
    createAnalyser() { return { fftSize: 512, remote: false, getByteTimeDomainData(bytes: Uint8Array) { bytes.fill(this.remote ? 170 : 128) }, disconnect() {} } }
    createMediaStreamSource(input: unknown) { return { connect(analyser: any) { analyser.remote = input !== stream }, disconnect() {} } }
  }
  Object.defineProperty(globalThis, 'AudioContext', { value: FakeAudioContext, configurable: true })
  const channel: any = { readyState: 'connecting', onopen: null, onmessage: null, onclose: null, send: (value: string) => sent.push(JSON.parse(value)), close() { this.readyState = 'closed'; this.onclose?.() } }
  class FakePeer {
    localDescription: any = null
    connectionState = 'new'
    onconnectionstatechange: (() => void) | null = null
    ontrack: ((event: any) => void) | null = null
    constructor() { currentPeer = this }
    addTrack() {}
    createDataChannel() { return channel }
    async createOffer() { return { type: 'offer', sdp: 'v=0\r\ns=local-offer\r\n' } }
    async setLocalDescription(value: any) { this.localDescription = value }
    async setRemoteDescription() { channel.readyState = 'open'; channel.onopen?.() }
    close() { peerCloses++; this.connectionState = 'closed'; this.onconnectionstatechange?.() }
  }
  class FakeAudio { autoplay = false; srcObject: any = null; setAttribute() {} async play() {} pause() {} }
  Object.defineProperty(globalThis, 'RTCPeerConnection', { value: FakePeer, configurable: true })
  Object.defineProperty(globalThis, 'Audio', { value: FakeAudio, configurable: true })
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => stream }, configurable: true })
  useAuthStore.setState({ user: { id: 'realtime-test-user', fullName: 'Test Learner', email: 'test@example.invalid', role: 'USER' } as any, accessToken: 'fake-access-token', refreshToken: 'fake-refresh-token' })
  globalThis.fetch = async (url, options) => {
    if (String(url).endsWith('/ai/voice/connect')) {
      const request = JSON.parse(String(options?.body))
      assert.equal(request.context.language, 'uz')
      assert.ok(request.history.reduce((total: number, turn: { content: string }) => total + turn.content.length, 0) <= 26000, 'Voice history stays bounded even after a long written conversation')
      return new Response(JSON.stringify({ id: 'test-session', sdp: 'v=0\r\ns=server-answer\r\n', maxMinutes: 20 }), { status: 201 })
    }
    if (String(url).endsWith('/ai/voice/end')) { ends++; return new Response(null, { status: 204 }) }
    if (String(url).endsWith('/ai/generate')) return new Response(JSON.stringify({ text: JSON.stringify({ fluencyBand: 6, lexicalBand: 7, grammarBand: 6, pronunciationBand: 8, summary: 'Text feedback.', strengths: ['Clear idea.'], weaknesses: ['Develop reasons.'], improvementPriorities: [{ area: 'Grammar', target: 7, action: 'Use a relative clause.' }] }) }))
    throw new Error(`Unexpected request ${url}`)
  }
  const options: any = { context: { pathname: '/ai-tutor', workspace: 'ielts', language: 'uz', mode: 'coach', studyContext: '', screenContext: '', siteKnowledge: '' }, history: [...Array.from({ length: 24 }, () => ({ role: 'assistant', content: 'Long previous explanation. '.repeat(300) })), { role: 'user', content: 'Earlier question.' }],
    state: (value: string) => states.push(value), level: (value: number) => levels.push(value), caption: (value: string) => captions.push(value),
    message: (...args: any[]) => messages.push(args), coachResult: (...args: any[]) => results.push(args), error: (issue: Error) => assert.fail(issue.message) }
  try {
    const voice = new RealtimeCoach(options)
    await voice.start()
    assert.ok(sent.some((event) => event.item?.content?.[0]?.text === 'Earlier question.'))
    const emit = (value: unknown) => channel.onmessage({ data: JSON.stringify(value) })
    emit({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'u1', transcript: 'Salom.' })
    emit({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'u1', transcript: 'Salom.' })
    assert.equal(messages.length, 1, 'Duplicate transcript events are saved only once')
    emit({ type: 'response.created', response: { id: 'r1' } })
    emit({ type: 'output_audio_buffer.started', response_id: 'r1' })
    currentPeer!.ontrack?.({ streams: [{ getTracks: () => [] }] })
    ;(nextFrame as FrameRequestCallback | null)?.(0)
    assert.ok(levels.at(-1)! > .1, 'Speaking animation follows remote output, even when the microphone is silent')
    voice.mute(true)
    ;(nextFrame as FrameRequestCallback | null)?.(16)
    assert.ok(levels.at(-1)! > .1, 'Muting the microphone never freezes the tutor speaking mouth')
    voice.mute(false)
    emit({ type: 'response.output_audio_transcript.delta', item_id: 'a1', response_id: 'r1', delta: 'Salom, ' })
    emit({ type: 'response.output_audio_transcript.done', item_id: 'a1', response_id: 'r1', transcript: 'Salom, boshlaymiz.' })
    assert.equal(messages.length, 1, 'Generated speech is not marked heard before playback finishes')
    emit({ type: 'output_audio_buffer.stopped', response_id: 'r1' })
    assert.equal(messages[1][1], 'Salom, boshlaymiz.')
    emit({ type: 'response.created', response: { id: 'r2' } })
    emit({ type: 'output_audio_buffer.started', response_id: 'r2' })
    emit({ type: 'response.output_audio_transcript.delta', item_id: 'a2', response_id: 'r2', delta: 'A partial answer' })
    emit({ type: 'input_audio_buffer.speech_started' })
    emit({ type: 'response.output_audio_transcript.done', item_id: 'a2', response_id: 'r2', transcript: 'A partial answer with unheard additional text.' })
    assert.equal(messages.length, 3)
    assert.equal(messages[2][3], true)
    assert.ok(!messages.some((item) => item[1].includes('unheard additional')))
    const result = { profai_coach_result: true, reply: 'Written feedback.', actions: [], memoryUpdates: [] }
    for (const type of ['conversation.item.added', 'conversation.item.created']) emit({ type, item: { type: 'function_call_output', id: 'tool-item', call_id: 'tool-1', output: JSON.stringify(result) } })
    assert.equal(results.length, 1, 'Mirrored tool results cannot duplicate a saved report')
    voice.mute(true); assert.equal(track.enabled, false)
    voice.mute(false); assert.equal(track.enabled, true)
    voice.stop(); voice.stop()
    await new Promise((resolve) => setTimeout(resolve, 10))
    assert.equal(micStops, 1); assert.equal(peerCloses, 1); assert.equal(ends, 1)
    assert.equal(states.at(-1), 'idle')
    console.log('PASS: natural voice restores history, deduplicates transcripts/tools, waits for playback, handles interruption, mutes and cleans up exactly once')

    let release: (stream: any) => void = () => {}
    navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => { release = resolve as any })
    const cancelled = new RealtimeCoach(options)
    const pending = cancelled.start()
    cancelled.stop(); release(stream as any); await pending
    assert.equal(micStops, 2, 'Late microphone grants are released after cancellation')
    assert.equal(peerCloses, 1, 'No peer is created for a cancelled microphone request')
    const sample = 'I enjoy reading books because they help me learn about different cultures and understand people. For example, I recently read an interesting novel about friendship.'
    const stats = analyseTranscript(sample, 15)
    assert.equal(estimateBandsFromStats(stats).pronunciationBand, 0)
    const textEvaluation = await evaluateSpeaking({ modeLabel: 'Practice', history: [{ role: 'candidate', text: sample }], stats })
    assert.equal(textEvaluation.assessmentMode, 'transcript')
    assert.equal(textEvaluation.pronunciationBand, 0, 'Text feedback never imports the model’s invented pronunciation band')
    assert.equal(textEvaluation.overallBand, 6.5)
    console.log('PASS: cancellation releases late microphone access; transcript scoring withholds pronunciation')
  } finally {
    globalThis.fetch = originalFetch
    globalThis.requestAnimationFrame = originalFrame; globalThis.cancelAnimationFrame = originalCancelFrame
    Object.defineProperty(globalThis, 'AudioContext', { value: originalAudioContext, configurable: true })
  }
}
