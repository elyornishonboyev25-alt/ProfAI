import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const origin = env.OPENAI_API_BASE.replace(/\/$/, '')
const voiceCache = new Map<string, { audioBase64: string; expires: number }>()

async function audioRequest(url: string, options: RequestInit): Promise<Response | null> {
  try { return await fetch(url, options) } catch { return null }
}

router.post('/voice', asyncHandler(async (req, res) => {
  const { text, voice } = z.object({
    text: z.string().trim().min(1).max(1500),
    voice: z.enum(['marin', 'cedar']).default('marin'),
  }).strict().parse(req.body)
  if (!env.OPENAI_API_KEY) return res.status(503).json({ message: 'Examiner voice is unavailable.' })
  const cacheKey = JSON.stringify([req.user!.id, voice, text])
  const cached = voiceCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) return res.json({ audioBase64: cached.audioBase64 })
  const response = await audioRequest(`${origin}/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts', voice, response_format: 'mp3', input: text,
      instructions: `Use a clear, natural British English accent and a ${voice === 'cedar' ? 'masculine adult male' : 'feminine adult female'} voice. Sound like a calm, experienced IELTS Speaking examiner in a quiet room: professional, attentive, and conversational. Use an even, natural speaking pace, short pauses between sentences, and gentle falling intonation for instructions. Questions should sound interested without exaggerated emphasis. Keep the same voice and accent throughout. No theatrical delivery, no preamble, and no added words.`,
    }),
    signal: AbortSignal.timeout(25_000),
  })
  if (!response?.ok) return res.status(503).json({ message: 'Examiner voice is temporarily unavailable.' })
  const buffer = await response.arrayBuffer().catch(() => null)
  if (!buffer || !buffer.byteLength) return res.status(503).json({ message: 'Examiner voice returned no audio.' })
  const audioBase64 = Buffer.from(buffer).toString('base64')
  // A small per-user cache makes retries immediate without caching candidate audio.
  if (voiceCache.size >= 24) voiceCache.delete(voiceCache.keys().next().value!)
  voiceCache.set(cacheKey, { audioBase64, expires: Date.now() + 10 * 60_000 })
  return res.json({ audioBase64 })
}))

router.post('/transcribe', asyncHandler(async (req, res) => {
  const { audioBase64, mimeType } = z.object({
    audioBase64: z.string().min(100).max(7_500_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
    mimeType: z.enum(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']),
  }).strict().parse(req.body)
  if (!env.OPENAI_API_KEY) return res.status(503).json({ message: 'Speech transcription is unavailable.' })
  const bytes = Buffer.from(audioBase64, 'base64')
  if (bytes.length > 5_500_000) return res.status(413).json({ message: 'Recording is too large.' })
  const extension = mimeType.split('/')[1]
  const transcribe = (model: string) => {
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: mimeType }), `answer.${extension}`)
    form.append('model', model)
    form.append('language', 'en')
    form.append('response_format', 'json')
    form.append('prompt', 'IELTS Speaking answer in English. Preserve the speaker’s exact words, including fillers, repetitions, and natural errors. Do not rewrite or invent any answer.')
    return audioRequest(`${origin}/audio/transcriptions`, {
      method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: form,
      signal: AbortSignal.timeout(35_000),
    })
  }
  let response = await transcribe('gpt-transcribe')
  if (response?.status === 400 || response?.status === 404) response = await transcribe('gpt-4o-transcribe')
  if (!response?.ok) return res.status(503).json({ message: 'Speech transcription is temporarily unavailable. Your recording can be retried.' })
  const payload = await response.json().catch(() => null) as { text?: unknown } | null
  if (!payload || typeof payload.text !== 'string') return res.status(503).json({ message: 'Speech transcription returned an invalid response.' })
  return res.json({ text: payload.text.trim() })
}))

export default router
