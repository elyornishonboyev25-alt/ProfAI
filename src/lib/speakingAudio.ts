import { apiClient } from '@/lib/apiClient'

export type ExaminerVoice = 'marin' | 'cedar'

export async function examinerAudio(text: string, voice: ExaminerVoice = 'marin', signal?: AbortSignal, language: 'en' | 'uz' | 'ru' = 'en'): Promise<string> {
  return withTimeout(signal, 45_000, async (bounded) => {
    const response = await apiClient.post<{ audioBase64: string; mimeType?: string }>('/ai/speaking-audio/voice', { text, voice, ...(language !== 'en' ? { language } : {}) }, { signal: bounded })
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
    const response = await apiClient.post<{ text: string }>('/ai/speaking-audio/transcribe', { audioBase64, mimeType }, { signal: bounded })
    return response.text.trim()
  })
}
