import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const origin = env.OPENAI_API_BASE.replace(/\/$/, '')

router.post('/voice', asyncHandler(async (req, res) => {
  const { text } = z.object({ text: z.string().trim().min(1).max(1500) }).strict().parse(req.body)
  if (!env.OPENAI_API_KEY) return res.status(503).json({ message: 'Examiner voice is unavailable.' })
  const response = await fetch(`${origin}/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts', voice: 'marin', response_format: 'mp3', input: text,
      instructions: 'Use a clear, natural British English accent. Sound like a calm, experienced IELTS Speaking examiner in a quiet room: professional, attentive, and conversational, with measured pacing and realistic pauses. Ask questions with natural intonation. No theatrical emphasis, no preamble, and no added words.',
    }),
    signal: AbortSignal.timeout(Math.min(25_000, 8_000 + text.length * 45)),
  })
  if (!response.ok) return res.status(503).json({ message: 'Examiner voice is temporarily unavailable.' })
  const bytes = Buffer.from(await response.arrayBuffer())
  return res.json({ audioBase64: bytes.toString('base64') })
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
    return fetch(`${origin}/audio/transcriptions`, {
      method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: form,
      signal: AbortSignal.timeout(35_000),
    })
  }
  let response = await transcribe('gpt-transcribe')
  if (response.status === 400 || response.status === 404) response = await transcribe('gpt-4o-transcribe')
  if (!response.ok) return res.status(503).json({ message: 'Speech transcription is temporarily unavailable.' })
  const payload = await response.json() as { text?: string }
  return res.json({ text: String(payload.text ?? '').trim() })
}))

export default router
