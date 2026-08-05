import { env } from '../config/env.js'
import { downloadYouTubeAudio, YouTubeAudioError } from './youtubeInnertube.js'

export type TranscriptionCue = { start: number; end: number; text: string }

export class VideoTranscriptionError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 502) {
    super(message)
    this.name = 'VideoTranscriptionError'
    this.statusCode = statusCode
  }
}

// OpenAI accepts files up to 25 MB. Keep margin for multipart overhead and
// reject before buffering more data than a small server instance can handle.
const MAX_AUDIO_BYTES = 24 * 1024 * 1024
const TRANSCRIPTION_TIMEOUT_MS = 4 * 60 * 1000

type AudioUpload = Awaited<ReturnType<typeof downloadYouTubeAudio>>

function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function timedFallback(text: string, durationSec: number): TranscriptionCue[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(cleanText)
    .filter(Boolean)
  if (sentences.length === 0) return []

  const safeDuration = Math.max(durationSec, sentences.length)
  const totalWords = sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0)
  let cursor = 0
  return sentences.map((sentence, index) => {
    const words = sentence.split(/\s+/).length
    const start = cursor
    const proportional = totalWords > 0 ? (words / totalWords) * safeDuration : safeDuration / sentences.length
    const end = index === sentences.length - 1
      ? safeDuration
      : Math.min(safeDuration, start + Math.max(1, proportional))
    cursor = end
    return { start, end: Math.max(start + 0.5, end), text: sentence }
  })
}

function parseProviderCues(payload: any): TranscriptionCue[] {
  const rows = Array.isArray(payload?.segments)
    ? payload.segments
    : Array.isArray(payload?.chunks)
      ? payload.chunks
      : []
  return rows
    .map((segment: any) => {
      const timestamp = Array.isArray(segment?.timestamp) ? segment.timestamp : []
      return {
        start: Number(segment?.start ?? timestamp[0] ?? 0),
        end: Number(segment?.end ?? timestamp[1] ?? 0),
        text: cleanText(segment?.text),
      }
    })
    .filter((segment: TranscriptionCue) =>
      Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.end > segment.start && segment.text,
    )
}

async function transcribeWithOpenAi(audio: AudioUpload, signal: AbortSignal): Promise<any> {
  const form = new FormData()
  const uploadBytes = audio.bytes.slice().buffer as ArrayBuffer
  form.append('file', new Blob([uploadBytes], { type: audio.mimeType }), audio.fileName)
  form.append('model', env.OPENAI_TRANSCRIBE_MODEL)
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'segment')
  form.append('prompt', 'Accurate English podcast transcript with punctuation and natural sentence boundaries.')

  const response = await fetch(`${env.OPENAI_API_BASE.replace(/\/$/, '')}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
    signal,
  })
  const payload: any = await response.json().catch(() => null)
  if (!response.ok) {
    console.warn('[video-import] OpenAI transcription rejected audio', response.status, payload?.error?.code ?? '')
    if (response.status === 401 || response.status === 403) {
      throw new VideoTranscriptionError('OpenAI transcription credentials are invalid or expired.', 503)
    }
    throw new VideoTranscriptionError('Automatic subtitle generation failed. Please retry shortly.')
  }
  return payload
}

async function transcribeWithHuggingFace(audio: AudioUpload, signal: AbortSignal): Promise<any> {
  const uploadBytes = audio.bytes.slice().buffer as ArrayBuffer
  const response = await fetch(env.HF_ASR_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.HF_ACCESS_TOKEN}`,
      'Content-Type': audio.mimeType,
      Accept: 'application/json',
    },
    body: uploadBytes,
    signal,
  })
  const payload: any = await response.json().catch(() => null)
  if (!response.ok) {
    console.warn('[video-import] Hugging Face transcription rejected audio', response.status, payload?.error ?? '')
    if (response.status === 401 || response.status === 403) {
      throw new VideoTranscriptionError('Hugging Face transcription credentials are invalid or expired.', 503)
    }
    throw new VideoTranscriptionError('Automatic subtitle generation failed. Please retry shortly.')
  }
  return payload
}

export async function transcribeYouTubeVideo(videoId: string, durationSec: number): Promise<TranscriptionCue[]> {
  const providers: Array<(audio: AudioUpload, signal: AbortSignal) => Promise<any>> = []
  if (env.OPENAI_API_KEY.trim()) providers.push(transcribeWithOpenAi)
  if (env.HF_ACCESS_TOKEN.trim()) providers.push(transcribeWithHuggingFace)
  if (providers.length === 0) {
    throw new VideoTranscriptionError(
      'This video has no YouTube captions, and automatic subtitles are not configured on the server yet.',
      503,
    )
  }

  let audio
  try {
    audio = await downloadYouTubeAudio(videoId, MAX_AUDIO_BYTES)
  } catch (error) {
    if (error instanceof YouTubeAudioError && error.code === 'AUDIO_TOO_LARGE') {
      throw new VideoTranscriptionError(
        'This caption-free video is too large for automatic subtitles. Choose a shorter video or one with YouTube captions.',
        422,
      )
    }
    throw new VideoTranscriptionError('Could not retrieve this video audio for automatic subtitles. Please retry shortly.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS)
  try {
    let payload: any = null
    let providerError: VideoTranscriptionError | null = null
    for (const provider of providers) {
      try {
        payload = await provider(audio, controller.signal)
        break
      } catch (error) {
        if (error instanceof VideoTranscriptionError) {
          providerError = error
          continue
        }
        throw error
      }
    }
    if (!payload) {
      throw providerError ?? new VideoTranscriptionError('Automatic subtitle generation is temporarily unavailable.')
    }

    const detectedLanguage = cleanText(payload?.language).toLowerCase()
    if (detectedLanguage && detectedLanguage !== 'en' && detectedLanguage !== 'english') {
      throw new VideoTranscriptionError('Only English spoken videos can be added to the podcast library.', 422)
    }

    const segments = parseProviderCues(payload)

    if (segments.length > 0) return segments
    const fallback = timedFallback(cleanText(payload?.text), durationSec)
    if (fallback.length > 0) return fallback
    throw new VideoTranscriptionError('The video audio did not contain enough clear English speech.', 422)
  } catch (error) {
    if (error instanceof VideoTranscriptionError) throw error
    if ((error as Error)?.name === 'AbortError') {
      throw new VideoTranscriptionError('Automatic subtitles took too long to generate. Please try a shorter video.', 504)
    }
    throw new VideoTranscriptionError('Automatic subtitle generation is temporarily unavailable.')
  } finally {
    clearTimeout(timeout)
  }
}
