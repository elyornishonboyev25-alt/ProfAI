import { ApiError } from './apiClient'

/** Wait only for our short Speaking throttle, within the caller's original deadline. */
export async function waitForSpeakingRateLimit(error: unknown, code: 'SPEAKING_MEDIA_RATE_LIMIT' | 'SPEAKING_ASSESSMENT_RATE_LIMIT', signal: AbortSignal): Promise<boolean> {
  if (!(error instanceof ApiError) || error.status !== 429 || error.code !== code) return false
  const delay = error.details?.retryAfterMs
  if (typeof delay !== 'number' || !Number.isFinite(delay) || delay <= 0 || delay > 60_000) return false
  signal.throwIfAborted()
  await new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason ?? new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, delay)
    signal.addEventListener('abort', abort, { once: true })
  })
  signal.throwIfAborted()
  return true
}
