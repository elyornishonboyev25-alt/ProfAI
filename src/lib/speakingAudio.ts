import { apiClient, ApiError } from '@/lib/apiClient'
import { waitForSpeakingRateLimit } from './speakingRateLimit'

export type ExaminerVoice = 'marin' | 'cedar'

export async function examinerAudio(text: string, voice: ExaminerVoice = 'marin', signal?: AbortSignal, language: 'en' | 'uz' | 'ru' = 'en', retryTransient = false): Promise<string> {
  return withTimeout(signal, 45_000, async (bounded) => {
    const generate = () => apiClient.post<{ audioBase64: string; mimeType?: string }>('/ai/speaking-audio/voice', { text, voice, ...(language !== 'en' ? { language } : {}) }, { signal: bounded })
    const response = await generate().catch((error: unknown) => {
      // One retry covers a dropped request or transient gateway failure. Both
      // attempts share the deadline and cancellation; never retry auth errors.
      if (!retryTransient || bounded.aborted || (error instanceof ApiError && ![502, 503, 504].includes(error.status))) throw error
      return generate()
    })
    if (!response.audioBase64) throw new Error('Examiner audio was empty.')
    const bytes = Uint8Array.from(atob(response.audioBase64), (character) => character.charCodeAt(0))
    return URL.createObjectURL(new Blob([bytes], { type: response.mimeType === 'audio/wav' ? 'audio/wav' : 'audio/mpeg' }))
  })
}

async function withTimeout<T>(signal: AbortSignal | undefined, milliseconds: number, operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), milliseconds)
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', abort, { once: true })
  try { return await operation(controller.signal) }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}

export async function transcribeAnswer(blob: Blob, signal?: AbortSignal): Promise<string> {
  if (!blob.size) throw new Error('The recording is empty.')
  if (blob.size > 5_500_000) throw new Error('Recording is too large. Record a shorter answer.')
  const audioBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the recording.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(blob)
  })
  const mimeType = blob.type.split(';')[0].toLowerCase().replace('audio/x-m4a', 'audio/mp4').replace('audio/m4a', 'audio/mp4').replace('audio/x-wav', 'audio/wav')
  if (!['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'].includes(mimeType)) throw new Error('Unsupported recording format.')
  return withTimeout(signal, 80_000, async (bounded) => {
    const transcribe = () => {
      bounded.throwIfAborted()
      return apiClient.post<{ text: string }>('/ai/speaking-audio/transcribe', { audioBase64, mimeType }, { signal: bounded })
    }
    const response = await transcribe().catch(async (error: unknown) => {
      // Recover once from a dropped connection or unavailable provider using
      // the saved file. Both attempts share cancellation and the same deadline.
      if (bounded.aborted) throw error
      const rateLimitReset = await waitForSpeakingRateLimit(error, 'SPEAKING_MEDIA_RATE_LIMIT', bounded)
      if (!rateLimitReset && error instanceof ApiError && ![502, 503, 504].includes(error.status)) throw error
      return transcribe()
    })
    return response.text.trim()
  })
}

export function transcriptionError(error: unknown): string {
  const saved = 'Your recording is saved.'
  if (error instanceof ApiError) {
    if ([401, 403, 409].includes(error.status)) return `${saved} ${error.message}`
    if (error.status === 429) return `${saved} Too many processing requests. Wait a moment, then retry processing.`
    if (error.status === 413) return `${saved} This answer is too large to process. Record a shorter answer.`
    if ([400, 415, 422].includes(error.status)) return `${saved} The audio could not be processed. Listen to it, then record again.`
  }
  if (error instanceof Error && error.name === 'AbortError') return `${saved} Processing timed out. Retry processing your saved answer.`
  return `${saved} Transcription is temporarily unavailable. Check your connection and retry processing, or record again.`
}
