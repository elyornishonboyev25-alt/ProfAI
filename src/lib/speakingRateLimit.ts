import { ApiError } from './apiClient'

/** Wait only for our short Speaking throttle, within the caller's original deadline. */
export async function waitForSpeakingRateLimit(error: unknown, code: 'SPEAKING_MEDIA_RATE_LIMIT' | 'SPEAKING_ASSESSMENT_RATE_LIMIT', signal: AbortSignal): Promise<boolean> {
  if (!(error instanceof ApiError) || error.status !== 429 || error.code !== code) return false
  const delay = error.details?.retryAfterMs
  if (typeof delay !== 'number' || !Number.isFinite(delay) || delay <= 0 || delay > 60_000) return false
  await waitForRetry(delay, signal)
  return true
}

/** Respect provider backoff as well as the application's short assessment throttle. */
export async function waitForSpeakingAssessmentRetry(error: unknown, signal: AbortSignal): Promise<boolean> {
  if (!(error instanceof ApiError)) return false
  if (error.status === 429) return waitForSpeakingRateLimit(error, 'SPEAKING_ASSESSMENT_RATE_LIMIT', signal)
  if (![502, 503, 504].includes(error.status)) return false
  // Another request cannot repair credentials, zero quota or model access.
  if (['AI_NOT_CONFIGURED', 'GEMINI_QUOTA_UNAVAILABLE', 'GEMINI_400', 'GEMINI_401', 'GEMINI_403', 'GEMINI_404', 'OPENAI_401', 'OPENAI_402', 'OPENAI_403', 'HF_401', 'HF_402', 'HF_403'].includes(error.code ?? '')) return false
  const delay = error.details?.retryAfterMs ?? 1000
  if (typeof delay !== 'number' || !Number.isFinite(delay) || delay < 0 || delay > 60_000) return false
  await waitForRetry(Math.max(1000, delay), signal)
  return true
}

async function waitForRetry(delay: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason ?? new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, delay)
    signal.addEventListener('abort', abort, { once: true })
  })
  signal.throwIfAborted()
}
