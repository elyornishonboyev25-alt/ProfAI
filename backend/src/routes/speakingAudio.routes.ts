import { Router } from 'express'
import { z } from 'zod'
import { generateExaminerAudio, transcribeSpeakingAudio, type VoiceAudio } from '../services/speakingAudio.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { assessSpeakingAudio, speakingAssessmentSchema } from '../services/speakingAssessment.service.js'
import { AiGenerationError } from '../services/aiProvider.service.js'
import { withStudyAccess } from '../services/billing.service.js'

const router = Router()
const voiceCache = new Map<string, { audio: VoiceAudio; expires: number }>()
const voiceInFlight = new Map<string, Promise<VoiceAudio | null>>()

router.post('/assess', asyncHandler(async (req, res) => {
  const payload = speakingAssessmentSchema.parse(req.body)
  if (payload.audio.reduce((sum, clip) => sum + Buffer.from(clip.data, 'base64').length, 0) > 8000000) return res.status(413).json({ message: 'Audio samples are too large. Use shorter recordings.' })
  const controller = new AbortController()
  res.on('close', () => { if (!res.writableEnded) controller.abort() })
  try { return res.json(await withStudyAccess(req.user!.id, 'speaking', () => assessSpeakingAudio(req.user!.id, payload, controller.signal))) }
  catch (error) {
    if (controller.signal.aborted) return
    if (error instanceof AiGenerationError) return res.status(error.statusCode).json({ message: error.message, code: error.code })
    throw error
  }
}))

router.post('/voice', asyncHandler(async (req, res) => {
  const { text, voice, language } = z.object({
    text: z.string().trim().min(1).max(1500),
    voice: z.enum(['marin', 'cedar']).default('marin'),
    language: z.enum(['en', 'uz', 'ru']).default('en'),
  }).strict().parse(req.body)
  const cacheKey = JSON.stringify([req.user!.id, voice, language, text])
  const cached = voiceCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) return res.json(cached.audio)
  let pending = voiceInFlight.get(cacheKey)
  if (!pending) {
    pending = generateExaminerAudio(text, voice, language).then((audio) => {
      if (audio) {
        if (voiceCache.size >= 24) voiceCache.delete(voiceCache.keys().next().value!)
        voiceCache.set(cacheKey, { audio, expires: Date.now() + 10 * 60_000 })
      }
      return audio
    }).finally(() => voiceInFlight.delete(cacheKey))
    voiceInFlight.set(cacheKey, pending)
  }
  const audio = await pending
  if (!audio) return res.status(503).json({ message: 'Examiner voice is temporarily unavailable.' })
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
