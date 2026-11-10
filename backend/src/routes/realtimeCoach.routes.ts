import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { assistantContextSchema, endVoiceCall, startVoiceCall, updateVoiceContext } from '../services/realtimeCoach.service.js'
import { AiGenerationError } from '../services/aiProvider.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { reserveVoiceTime, voiceUsageSnapshot } from '../services/voiceAllowance.service.js'
import { naturalVoiceProvider } from '../services/voiceProvider.js'
import { startGeminiVoiceCall } from '../services/geminiLive.service.js'
const router = Router()
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
router.get('/capabilities', (_req, res) => {
  const provider = naturalVoiceProvider()
  res.json({ textChat: Boolean(env.OPENAI_API_KEY || env.HF_ACCESS_TOKEN || env.GEMINI_API_KEY || env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_3 || env.GEMINI_API_KEY_4 || env.GEMINI_API_KEY_5), naturalVoice: Boolean(provider), voiceProvider: provider, voiceModel: provider === 'gemini' ? env.GEMINI_LIVE_MODEL : provider === 'openai' ? env.AI_VOICE_MODEL : null, spokenReplies: Boolean(env.OPENAI_API_KEY || env.GEMINI_API_KEY || env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_3 || env.GEMINI_API_KEY_4 || env.GEMINI_API_KEY_5), currentResearch: Boolean(env.OPENAI_API_KEY && env.AI_WEB_SEARCH_ENABLED), audioAssessment: Boolean(env.GEMINI_API_KEY || env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_3 || env.GEMINI_API_KEY_4 || env.GEMINI_API_KEY_5), maxMinutes: env.AI_VOICE_MAX_MINUTES })
})
router.post('/gemini/connect', asyncHandler(async (req, res) => {
  const payload = z.object({ context: assistantContextSchema,
    history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(12000) })).max(24).default([]) }).strict().parse(req.body)
  const controller = new AbortController()
  res.on('close', () => { if (!res.writableEnded) controller.abort() })
  try {
    const call = await startGeminiVoiceCall(req.user!.id, payload.context, payload.history, controller.signal)
    if (controller.signal.aborted) { await endVoiceCall(req.user!.id, call.id); return }
    res.status(201).json(call)
  } catch (error) {
    if (controller.signal.aborted) return
    if (error instanceof AiGenerationError) return res.status(error.statusCode).json({ message: error.message, code: error.code })
    throw error
  }
}))
router.post('/connect', asyncHandler(async (req, res) => {
  const payload = z.object({ sdp: z.string().min(20).max(40000).startsWith('v='), context: assistantContextSchema,
    history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(12000) })).max(24).default([]) }).strict().parse(req.body)
  const controller = new AbortController()
  res.on('close', () => { if (!res.writableEnded) controller.abort() })
  try {
    const call = await startVoiceCall(req.user!.id, payload.sdp, payload.context, payload.history, controller.signal)
    if (controller.signal.aborted) { await endVoiceCall(req.user!.id, call.id); return }
    res.setHeader('Server-Timing', `voice_preparation;dur=${call.timings.preparationMs}, voice_provider;dur=${call.timings.providerMs}, voice_control;dur=${call.timings.controlMs}, voice_total;dur=${call.timings.totalMs}`)
    return res.status(201).json(call)
  }
  catch (error) {
    if (controller.signal.aborted) return
    if (error instanceof AiGenerationError) return res.status(error.statusCode).json({ message: error.message, code: error.code })
    throw error
  }
}))
router.post('/end', asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().uuid() }).strict().parse(req.body)
  await endVoiceCall(req.user!.id, id)
  res.status(204).send()
}))
router.get('/allowance', asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.json(await voiceUsageSnapshot(req.user!.id))
}))
router.post('/standard/connect', asyncHandler(async (req, res) => {
  const reservation = await reserveVoiceTime(req.user!.id, env.AI_VOICE_MAX_MINUTES * 60)
  res.status(201).json({ id: reservation.id, expiresAt: reservation.expiresAt.toISOString() })
}))
router.post('/context', asyncHandler(async (req, res) => {
  const { id, context } = z.object({ id: z.string().uuid(), context: assistantContextSchema }).strict().parse(req.body)
  try {
    if (!await updateVoiceContext(req.user!.id, id, context)) return res.status(404).json({ message: 'Voice session not found.' })
    res.status(204).send()
  } catch (error) {
    if (error instanceof AiGenerationError) return res.status(error.statusCode).json({ message: error.message, code: error.code })
    throw error
  }
}))
export default router
