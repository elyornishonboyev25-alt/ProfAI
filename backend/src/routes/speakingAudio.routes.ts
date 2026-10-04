import { Router } from 'express'
import { z } from 'zod'
import { generateExaminerAudio, transcribeSpeakingAudio, type VoiceAudio } from '../services/speakingAudio.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const voiceCache = new Map<string, { audio: VoiceAudio; expires: number }>()

router.post('/voice', asyncHandler(async (req, res) => {
  const { text, voice } = z.object({
    text: z.string().trim().min(1).max(1500),
    voice: z.enum(['marin', 'cedar']).default('marin'),
  }).strict().parse(req.body)
  const cacheKey = JSON.stringify([req.user!.id, voice, text])
  const cached = voiceCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) return res.json(cached.audio)
  const audio = await generateExaminerAudio(text, voice)
  if (!audio) return res.status(503).json({ message: 'Examiner voice is temporarily unavailable.' })
  if (voiceCache.size >= 24) voiceCache.delete(voiceCache.keys().next().value!)
  voiceCache.set(cacheKey, { audio, expires: Date.now() + 10 * 60_000 })
  return res.json(audio)
}))

router.post('/transcribe', asyncHandler(async (req, res) => {
  const { audioBase64, mimeType } = z.object({
    audioBase64: z.string().min(100).max(7_500_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
    mimeType: z.enum(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']),
  }).strict().parse(req.body)
  if (Buffer.from(audioBase64, 'base64').length > 5_500_000) return res.status(413).json({ message: 'Recording is too large.' })
  const text = await transcribeSpeakingAudio(audioBase64, mimeType)
  if (text === null) return res.status(503).json({ message: 'Speech transcription is temporarily unavailable. Your recording can be retried.' })
  return res.json({ text })
}))

export default router
