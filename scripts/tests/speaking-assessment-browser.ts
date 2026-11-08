import { apiClient, ApiError } from '@/lib/apiClient'
import { prepareSpeakingAssessmentAudio } from '@/lib/speakingAssessmentAudio'
import { evaluateSpeaking, type SpeakingEvaluation } from '@/services/speakingAI'
import { regradeFullMockSpeaking } from '@/services/fullMockSpeakingReview'
import { analyseTranscript } from '@/lib/speakingScoring'
import { accountStorageFor } from '@/utils/accountStorage'
import { readTestAudio, saveTestAudio } from '@/utils/testAudioStorage'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function wave(duration: number, sampleRate = 8000): Blob {
  const samples = duration * sampleRate
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)
  const write = (offset: number, text: string) => [...text].forEach((letter, index) => view.setUint8(offset + index, letter.charCodeAt(0)))
  write(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); write(8, 'WAVEfmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data')
  view.setUint32(40, samples * 2, true)
  for (let i = 0; i < samples; i++) view.setInt16(44 + i * 2, Math.round(Math.sin(i * 2 * Math.PI * 440 / sampleRate) * 16000), true)
  return new Blob([buffer], { type: 'audio/wav' })
}

export async function run() {
  const nativePost = apiClient.post
  const durations = [60, 60, 120, 180, 180, 240]
  const audio = durations.map((duration, answerIndex) => ({ answerIndex, blob: wave(duration) }))
  const originalBytes = audio.reduce((sum, clip) => sum + clip.blob.size, 0)
  check(originalBytes > 8_000_000, 'Fixture must exceed the original assessment limit')
  const history = durations.map(() => ({ role: 'candidate' as const, text: 'I enjoy learning English because it helps me communicate with other people.' }))
  const stats = analyseTranscript(history.map(turn => turn.text).join(' '), 840)
  const evaluation: SpeakingEvaluation = { overallBand: 7, fluencyBand: 7, lexicalBand: 7, grammarBand: 7, pronunciationBand: 7,
    summary: 'Complete audio assessment.', strengths: [], weaknesses: [], improvementPriorities: [], stats, source: 'ai', assessmentMode: 'audio' }
  let calls = 0
  let uploadedBytes = 0
  let retryBody: unknown
  apiClient.post = (async (path, body: any) => {
    calls++
    check(path === '/ai/speaking-audio/assess', 'Audio must never fall through to transcript grading')
    check(body.audio.length === audio.length, 'Every saved answer must reach the assessor')
    check(JSON.stringify(body.history) === JSON.stringify(history), 'The complete transcript must reach the assessor')
    uploadedBytes = 0
    for (const [index, clip] of body.audio.entries()) {
      check(clip.answerIndex === index, 'Answer indices and order must be preserved')
      check(clip.mimeType === 'audio/mpeg', 'Large saved recordings must be compressed')
      const bytes = Uint8Array.from(atob(clip.data), letter => letter.charCodeAt(0))
      uploadedBytes += bytes.length
      const decoded = await new OfflineAudioContext(1, 1, 24000).decodeAudioData(bytes.buffer)
      check(Math.abs(decoded.duration - durations[index]) < 0.15, 'Compression must preserve the entire answer duration')
      const end = decoded.getChannelData(0).subarray(decoded.length - 12000, decoded.length - 6000)
      check(end.some(sample => Math.abs(sample) > 0.1), 'The end of the answer must still contain audible samples')
    }
    check(uploadedBytes <= 8_000_000, 'Compressed audio must fit the existing server limit')
    if (calls === 1) { retryBody = body; throw new ApiError('Temporary provider outage.', 502) }
    check(body === retryBody, 'A transient retry must reuse exactly the same prepared audio')
    return evaluation
  }) as typeof apiClient.post
  try {
    const key = 'speaking-oversized-saved-attempt'
    accountStorageFor('guest').setItem(key, JSON.stringify({ history, audioKey: key }))
    await Promise.all(audio.map(clip => saveTestAudio('guest', `${key}:answer:${clip.answerIndex}`, clip.blob)))
    const started = performance.now()
    const result = await regradeFullMockSpeaking('guest', { band: 0, assessmentStatus: 'pending', testId: 'speaking-full-11', completedAt: '2026-11-03',
      speaking: { sessionKey: key, transcript: history, evaluation: { ...evaluation, source: 'offline', assessmentMode: 'offline' } } })
    check(result.source === 'ai' && result.assessmentMode === 'audio' && result.overallBand === 7, 'A saved oversized attempt must recover its audio band without a retake')
    check(calls === 2, 'Transient recovery must be bounded to one retry')
    for (const clip of audio) {
      const saved = await readTestAudio('guest', `${key}:answer:${clip.answerIndex}`)
      check(saved?.size === clip.blob.size && saved.type === 'audio/wav', 'Saved originals must remain intact')
    }
    console.log(`PASS: saved 14-minute mock, ${originalBytes} -> ${uploadedBytes} bytes, all six complete answers, retry and original recordings (${Math.round(performance.now() - started)} ms)`)

    const controller = new AbortController()
    const small = wave(1)
    const untouched = await prepareSpeakingAssessmentAudio([{ answerIndex: 3, blob: small }], controller.signal)
    check(untouched[0].blob === small && untouched[0].answerIndex === 3, 'Small recordings must pass through unchanged')
    const largeAnswer = wave(120, 24000)
    check(largeAnswer.size > 5_500_000 && largeAnswer.size < 8_000_000, 'Fixture must exercise the per-answer limit')
    const single = await prepareSpeakingAssessmentAudio([{ answerIndex: 4, blob: largeAnswer }], controller.signal)
    check(single[0].blob.size < 5_500_000 && single[0].blob.type === 'audio/mpeg' && single[0].answerIndex === 4, 'One oversized answer must fit server schema limits too')
    controller.abort()
    let cancelled = false
    try { await prepareSpeakingAssessmentAudio(audio, controller.signal) } catch { cancelled = true }
    check(cancelled, 'Cancelled assessments must not continue audio preparation')

    const interrupted = new AbortController()
    const pending = prepareSpeakingAssessmentAudio([{ answerIndex: 0, blob: wave(120, 24000) }], interrupted.signal)
    setTimeout(() => interrupted.abort(), 10)
    cancelled = false
    try { await pending } catch { cancelled = true }
    check(cancelled, 'Cancellation must interrupt audio preparation already in progress')

    calls = 0
    const corrupt = await evaluateSpeaking({ modeLabel: 'Corrupt saved audio', history, stats,
      audio: [{ answerIndex: 0, blob: new Blob([new Uint8Array(8_000_001)], { type: 'audio/mp4' }) }] })
    check(corrupt.source === 'offline' && calls === 0, 'Undecodable audio must remain unassessed without submitting a text score')
    console.log('PASS: small recordings, per-answer limit, cancellation and honest decode failures')
  } finally { apiClient.post = nativePost; localStorage.clear() }
}
