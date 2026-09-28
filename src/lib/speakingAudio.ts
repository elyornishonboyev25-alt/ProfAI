import { apiClient } from '@/lib/apiClient'

export async function examinerAudio(text: string): Promise<string> {
  const response = await apiClient.post<{ audioBase64: string }>('/ai/speaking-audio/voice', { text })
  const bytes = Uint8Array.from(atob(response.audioBase64), (character) => character.charCodeAt(0))
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
}

export async function transcribeAnswer(blob: Blob): Promise<string> {
  const audioBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the recording.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(blob)
  })
  const mimeType = blob.type.split(';')[0]
  if (!['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'].includes(mimeType)) throw new Error('Unsupported recording format.')
  const response = await apiClient.post<{ text: string }>('/ai/speaking-audio/transcribe', { audioBase64, mimeType })
  return response.text.trim()
}
