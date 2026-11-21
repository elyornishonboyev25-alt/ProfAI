import assert from 'node:assert/strict'
import { apiClient, ApiError } from '@/lib/apiClient'
import { evaluateSpeaking } from '@/services/speakingAI'
import { analyseTranscript } from '@/lib/speakingScoring'
import { waitForSpeakingAssessmentRetry } from '@/lib/speakingRateLimit'

export async function run() {
  const originalPost = apiClient.post
  const nativeSetTimeout = globalThis.setTimeout
  const nativeClearTimeout = globalThis.clearTimeout
  const originalReader = globalThis.FileReader
  let now = 0, nextId = 0
  const timers = new Map<number, { at: number; run: () => void }>()
  globalThis.setTimeout = ((run: () => void, delay = 0) => {
    const id = ++nextId
    timers.set(id, { at: now + delay, run })
    return id
  }) as unknown as typeof setTimeout
  globalThis.clearTimeout = ((id: number) => { timers.delete(Number(id)) }) as unknown as typeof clearTimeout
  globalThis.FileReader = class {
    result = 'data:audio/webm;base64,' + btoa('saved-audio'.repeat(20))
    onload?: () => void
    readAsDataURL() { this.onload?.() }
  } as unknown as typeof FileReader
  const flush = async () => { for (let i = 0; i < 40; i++) await Promise.resolve() }
  const advance = async (milliseconds: number) => {
    const end = now + milliseconds
    while (true) {
      const pending = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!pending) break
      now = pending[1].at
      timers.delete(pending[0])
      pending[1].run()
      await flush()
    }
    now = end
    await flush()
  }
  try {
    const history = [{ role: 'candidate' as const, text: 'I enjoy learning new skills with my friends.' }]
    const stats = analyseTranscript(history[0].text, 30)
    for (const useAudio of [true, false]) {
      const requests: Array<{ path: string; body: any; signal: AbortSignal }> = []
      apiClient.post = ((path: string, body: any, { signal }: { signal: AbortSignal }) => {
        requests.push({ path, body, signal })
        return new Promise((resolve, reject) => setTimeout(() => {
          if (signal.aborted) { reject(signal.reason); return }
          if (requests.length === 1) reject(new ApiError('Overloaded', 503, 'GEMINI_503', { retryAfterMs: 60_000 }))
          else resolve({ source: 'ai', assessmentMode: useAudio ? 'audio' : 'transcript', fluencyBand: 7, lexicalBand: 7, grammarBand: 7, pronunciationBand: useAudio ? 7 : 0, summary: 'Grounded assessment.', strengths: [], weaknesses: [], improvementPriorities: [] })
        }, useAudio ? 104_000 : 79_000))
      }) as typeof apiClient.post
      let result: Awaited<ReturnType<typeof evaluateSpeaking>> | undefined
      const pending = evaluateSpeaking({ modeLabel: 'Full Mock', history, stats, ...(useAudio ? { audio: [{ answerIndex: 0, blob: new Blob(['saved-audio'.repeat(20)], { type: 'audio/webm' }) }] } : {}) }).then(value => { result = value })
      await flush()
      await advance(useAudio ? 104_000 : 79_000)
      await advance(59_999)
      assert.equal(requests.length, 1, 'No retry before the provider waiting period expires')
      await advance(1)
      assert.equal(requests.length, 2)
      assert.equal(requests[0].body, requests[1].body, 'Retry reuses every prepared recording and transcript')
      assert.equal(requests[0].signal, requests[1].signal, 'Both attempts share one bounded deadline')
      await advance(useAudio ? 104_000 : 79_000)
      await pending
      assert.equal(result?.source, 'ai', 'A complete second attempt survives the original premature browser timeout')
      assert.equal(result?.assessmentMode, useAudio ? 'audio' : 'transcript')
      assert.equal(requests.length, 2, 'Audio never falls back to a transcript score')
      assert.equal(timers.size, 0, 'Successful assessment clears the overall deadline')
    }
    for (const code of ['AI_NOT_CONFIGURED', 'GEMINI_QUOTA_UNAVAILABLE', 'GEMINI_400', 'GEMINI_401', 'GEMINI_403', 'GEMINI_404']) {
      let calls = 0
      apiClient.post = (async () => { calls++; throw new ApiError('Operator action required', 503, code) }) as typeof apiClient.post
      const result = await evaluateSpeaking({ modeLabel: 'Full Mock', history, stats })
      assert.equal(calls, 1)
      assert.equal(result.source, 'offline', 'No score is invented when provider configuration needs repair')
    }
    for (const retryAfterMs of [60_001, -1, Infinity, NaN, '1000']) {
      assert.equal(await waitForSpeakingAssessmentRetry(new ApiError('Wait', 503, 'GEMINI_429', { retryAfterMs }), new AbortController().signal), false)
    }
    const cancelled = new AbortController()
    const waiting = waitForSpeakingAssessmentRetry(new ApiError('Wait', 503, 'GEMINI_429', { retryAfterMs: 30_000 }), cancelled.signal)
    cancelled.abort()
    await assert.rejects(waiting)
    assert.equal(timers.size, 0, 'Cancellation clears the provider retry timer')
    console.log('PASS: complete audio/transcript retry budgets, provider backoff, permanent errors and cancellation')
  } finally {
    apiClient.post = originalPost
    globalThis.setTimeout = nativeSetTimeout
    globalThis.clearTimeout = nativeClearTimeout
    globalThis.FileReader = originalReader
  }
}
