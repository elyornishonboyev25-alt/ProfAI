import { ApiError, apiClient } from '@/lib/apiClient'

let voiceRetryAfter = 0
let transcriptionRetryAfter = 0

function unavailable(error: unknown): boolean {
  return error instanceof ApiError && [401, 403, 503].includes(error.status)
}

export async function examinerAudio(text: string, signal?: AbortSignal): Promise<string> {
  if (Date.now() < voiceRetryAfter) throw new Error('Natural examiner voice is temporarily unavailable.')
  try {
    const response = await apiClient.post<{ audioBase64: string }>('/ai/speaking-audio/voice', { text }, { signal })
    const bytes = Uint8Array.from(atob(response.audioBase64), (character) => character.charCodeAt(0))
    return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
  } catch (error) {
    if (unavailable(error)) voiceRetryAfter = Date.now() + 60_000
    throw error
  }
}

export async function transcribeAnswer(blob: Blob): Promise<string> {
  if (Date.now() < transcriptionRetryAfter) throw new Error('Enhanced transcription is temporarily unavailable.')
  const audioBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the recording.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(blob)
  })
  const mimeType = blob.type.split(';')[0]
  if (!['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'].includes(mimeType)) throw new Error('Unsupported recording format.')
  try {
    const response = await apiClient.post<{ text: string }>('/ai/speaking-audio/transcribe', { audioBase64, mimeType })
    return response.text.trim()
  } catch (error) {
    if (unavailable(error)) transcriptionRetryAfter = Date.now() + 60_000
    throw error
  }
}
