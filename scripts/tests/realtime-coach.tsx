import assert from 'node:assert/strict'
import { RealtimeCoach } from '@/lib/realtimeCoach'
import { analyseTranscript, estimateBandsFromStats } from '@/lib/speakingScoring'
import { evaluateSpeaking } from '@/services/speakingAI'
import { useAuthStore } from '@/store/authStore'

export async function run() {
  const originalFetch = globalThis.fetch
  const states: string[] = [], messages: any[] = [], captions: string[] = [], results: any[] = [], sent: any[] = []
  const previews: any[] = []
  const measurements: Array<{ stage: string; durationMs: number }> = []
  const contexts: any[] = []
  let failContext = false
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
    if (String(url).endsWith('/ai/voice/context')) {
      contexts.push(JSON.parse(String(options?.body)).context)
      if (failContext) { failContext = false; throw new Error('Temporary context connection failure') }
      return new Response(null, { status: 204 })
    }
    if (String(url).endsWith('/ai/speaking-audio/assess-transcript')) return new Response(JSON.stringify({ source: 'ai', assessmentMode: 'transcript', improvedAnswers: [{ answerIndex: 0, original: JSON.parse(String(options?.body)).history[0].text, improved: JSON.parse(String(options?.body)).history[0].text }], fluencyBand: 6, lexicalBand: 7, grammarBand: 6, pronunciationBand: 8, summary: 'Text feedback.', strengths: ['Clear idea.'], weaknesses: ['Develop reasons.'], improvementPriorities: [{ area: 'Grammar', target: 7, action: 'Use a relative clause.' }] }))
    throw new Error(`Unexpected request ${url}`)
  }
  const options: any = { context: { pathname: '/ai-tutor', workspace: 'ielts', language: 'uz', mode: 'coach', studyContext: '', screenContext: '', siteKnowledge: '' }, history: [...Array.from({ length: 24 }, () => ({ role: 'assistant', content: 'Long previous explanation. '.repeat(300) })), { role: 'user', content: 'Earlier question.' }],
    state: (value: string) => states.push(value), level: (value: number) => levels.push(value), caption: (value: string) => captions.push(value),
    message: (...args: any[]) => messages.push(args), preview: (...args: any[]) => previews.push(args), performance: (value: any) => measurements.push(value), coachResult: (...args: any[]) => results.push(args), error: (issue: Error) => assert.fail(issue.message) }
  try {
    const voice = new RealtimeCoach(options)
    await voice.start()
    assert.deepEqual(measurements.map(value => value.stage), ['microphone', 'negotiation', 'connection'])
    await voice.updateContext({ ...options.context })
    assert.equal(contexts.length, 0, 'An unchanged context never issues an extra request')
    await Promise.all([
      voice.updateContext({ ...options.context, pathname: '/vocabulary' }),
      voice.updateContext({ ...options.context, pathname: '/reading' }),
      voice.updateContext({ ...options.context, pathname: '/writing' }),
    ])
    assert.deepEqual(contexts.map(value => value.pathname), ['/writing'], 'Rapid page changes coalesce into the latest context')
    await voice.updateContext({ ...options.context, pathname: '/writing', threadId: 'saved-thread' })
    await voice.updateContext({ ...options.context, pathname: '/ielts' })
    assert.equal(contexts.at(-1).threadId, 'saved-thread', 'A saved chat ID survives later page updates')
    const retryContext = { ...options.context, pathname: '/retry' }
    failContext = true
    await assert.rejects(voice.updateContext(retryContext))
    await voice.updateContext(retryContext)
    assert.equal(contexts.at(-1).pathname, '/retry', 'A failed update is retryable and does not poison the queue')
    currentPeer!.connectionState = 'disconnected'
    currentPeer!.onconnectionstatechange?.()
    assert.equal(peerCloses, 0, 'Brief network changes do not immediately kill a natural voice call')
    currentPeer!.connectionState = 'connected'
    currentPeer!.onconnectionstatechange?.()
    assert.ok(sent.some((event) => event.item?.content?.[0]?.text === 'Earlier question.'))
    const emit = (value: unknown) => channel.onmessage({ data: JSON.stringify(value) })
    emit({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'u1', transcript: 'Salom.' })
    emit({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'u1', transcript: 'Salom.' })
    assert.equal(messages.length, 1, 'Duplicate transcript events are saved only once')
    emit({ type: 'conversation.item.input_audio_transcription.delta', item_id: 'u1', delta: 'late duplicate' })
    assert.equal(previews.length, 0, 'A late input delta cannot turn a finalized user message back into a draft')
    emit({ type: 'response.created', response: { id: 'r1' } })
    emit({ type: 'output_audio_buffer.started', response_id: 'r1' })
    assert.equal(measurements.filter(value => value.stage === 'first_audio').length, 1)
    emit({ type: 'output_audio_buffer.started', response_id: 'r1' })
    assert.equal(measurements.filter(value => value.stage === 'first_audio').length, 1, 'Repeated audio events cannot duplicate latency measurements')
    currentPeer!.ontrack?.({ streams: [{ getTracks: () => [] }] })
    ;(nextFrame as FrameRequestCallback | null)?.(0)
    assert.ok(levels.at(-1)! > .1, 'Speaking animation follows remote output, even when the microphone is silent')
    voice.mute(true)
    ;(nextFrame as FrameRequestCallback | null)?.(16)
    assert.ok(levels.at(-1)! > .1, 'Muting the microphone never freezes the tutor speaking mouth')
    voice.mute(false)
    emit({ type: 'response.output_audio_transcript.delta', item_id: 'a1', response_id: 'r1', delta: 'Salom, ' })
    assert.deepEqual(previews.at(-1), ['assistant', 'Salom, ', 'a1'], 'Live text is visible before speech completes')
    voice.setSpeechSpeed(1.25)
    assert.equal(sent.filter(event => event.type === 'session.update').length, 0, 'Speed changes wait while audio is playing')
    emit({ type: 'response.output_audio_transcript.done', item_id: 'a1', response_id: 'r1', transcript: 'Salom, boshlaymiz.' })
    emit({ type: 'response.done', response: { id: 'r1', status: 'completed' } })
    assert.equal(sent.filter(event => event.type === 'session.update').length, 0, 'Generation completion alone cannot change buffered playback speed')
    assert.equal(messages.length, 1, 'Generated speech is not marked heard before playback finishes')
    emit({ type: 'output_audio_buffer.stopped', response_id: 'r1' })
    assert.equal(sent.at(-1).session.audio.output.speed, 1.25, 'The selected speed applies between turns without reconnecting')
    assert.equal(messages[1][1], 'Salom, boshlaymiz.')
    emit({ type: 'input_audio_buffer.speech_started' })
    emit({ type: 'input_audio_buffer.speech_stopped' })
    emit({ type: 'response.created', response: { id: 'r2' } })
    emit({ type: 'output_audio_buffer.started', response_id: 'r2' })
    assert.equal(measurements.filter(value => value.stage === 'reply').length, 1)
    assert.ok(measurements.every(value => Number.isFinite(value.durationMs) && value.durationMs >= 0))
    emit({ type: 'output_audio_buffer.stopped', response_id: 'r1' })
    assert.equal(states.at(-1), 'speaking', 'A late stop from a previous turn cannot stop the new speaking state')
    emit({ type: 'response.output_audio_transcript.delta', item_id: 'a2', response_id: 'r2', delta: 'A partial answer' })
    emit({ type: 'input_audio_buffer.speech_started' })
    const previewCount = previews.length
    emit({ type: 'response.output_audio_transcript.done', item_id: 'a2', response_id: 'r2', transcript: 'A partial answer with unheard additional text.' })
    assert.equal(messages.length, 3)
    assert.equal(messages[2][3], true)
    assert.ok(!messages.some((item) => item[1].includes('unheard additional')))
    assert.equal(previews.length, previewCount, 'Interrupted speech cannot reappear as a live draft')
    emit({ type: 'response.created', response: { id: 'r3' } })
    emit({ type: 'output_audio_buffer.started', response_id: 'r3' })
    voice.interrupt()
    assert.deepEqual(sent.slice(-2).map(event => event.type), ['response.cancel', 'output_audio_buffer.clear'], 'Stop cancels generation and clears queued WebRTC audio immediately')
    assert.equal(captions.at(-1), '')
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
    const mutedDuringPermission = new RealtimeCoach(options)
    const permissionPending = mutedDuringPermission.start()
    mutedDuringPermission.mute(true)
    release(stream as any)
    await permissionPending
    assert.equal(track.enabled, false, 'Muting while permission is pending also mutes the track acquired later')
    mutedDuringPermission.stop()
    navigator.mediaDevices.getUserMedia = async () => stream as any
    const nativeWindowTimeout = window.setTimeout
    let connectionTimeout: (() => void) | undefined
    let replyTimeout: (() => void) | undefined
    window.setTimeout = ((callback: () => void, milliseconds?: number) => {
      if (milliseconds === 35000) { connectionTimeout = callback; return 999998 }
      if (milliseconds === 45000) { replyTimeout = callback; return 999999 }
      return nativeWindowTimeout(callback, milliseconds)
    }) as typeof window.setTimeout
    const workingFetch = globalThis.fetch
    const issues: string[] = []
    try {
      let negotiating: (() => void) | undefined
      const entered = new Promise<void>((resolve) => { negotiating = resolve })
      globalThis.fetch = async (url, request) => {
        if (!String(url).endsWith('/ai/voice/connect')) return workingFetch(url, request)
        negotiating!()
        return new Promise((_resolve, reject) => request!.signal!.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true }))
      }
      const timedOut = new RealtimeCoach({ ...options, error: (issue: Error) => issues.push(issue.message) })
      const connecting = timedOut.start()
      await entered
      connectionTimeout!()
      await connecting
      assert.equal(issues.length, 1, 'A hung SDP request fails once and releases its microphone')
      assert.match(issues[0], /connection timed out/)
      globalThis.fetch = workingFetch
      const silent = new RealtimeCoach({ ...options, error: (issue: Error) => issues.push(issue.message) })
      await silent.start()
      replyTimeout!()
      assert.equal(issues.length, 2)
      assert.match(issues[1], /reply timed out/, 'A silent initial response cannot leave the voice screen stuck thinking')
    } finally { window.setTimeout = nativeWindowTimeout; globalThis.fetch = workingFetch }
    const beforeLeaving = micStops
    const leaving = new RealtimeCoach({ ...options, message: () => { throw new Error('Chat callback failed') } })
    await leaving.start()
    channel.onmessage({ data: JSON.stringify({ type: 'response.output_audio_transcript.delta', item_id: 'last', response_id: 'last-response', delta: 'Unfinished speech' }) })
    window.dispatchEvent(new Event('pagehide'))
    assert.equal(micStops, beforeLeaving + 1, 'Leaving the page releases microphone hardware even when transcript cleanup throws')
    leaving.stop()
    assert.equal(micStops, beforeLeaving + 1, 'Repeated cleanup releases the same track only once')
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
