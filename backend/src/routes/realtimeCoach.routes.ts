import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { assistantContextSchema, endVoiceCall, startVoiceCall, updateVoiceContext } from '../services/realtimeCoach.service.js'
import { AiGenerationError } from '../services/aiProvider.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { withCoinCharge } from '../services/coinBilling.service.js'
const router = Router()
router.get('/capabilities', (_req, res) => res.json({ textChat: Boolean(env.OPENAI_API_KEY || env.HF_ACCESS_TOKEN || env.GEMINI_API_KEY || env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_3 || env.GEMINI_API_KEY_4 || env.GEMINI_API_KEY_5), naturalVoice: Boolean(env.OPENAI_API_KEY), currentResearch: Boolean(env.OPENAI_API_KEY && env.AI_WEB_SEARCH_ENABLED), audioAssessment: Boolean(env.GEMINI_API_KEY || env.GEMINI_API_KEY_2 || env.GEMINI_API_KEY_3 || env.GEMINI_API_KEY_4 || env.GEMINI_API_KEY_5), maxMinutes: env.AI_VOICE_MAX_MINUTES }))
router.post('/connect', asyncHandler(async (req, res) => {
  const payload = z.object({ sdp: z.string().min(20).max(40000).startsWith('v='), context: assistantContextSchema,
    history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(12000) })).max(24).default([]) }).strict().parse(req.body)
  const controller = new AbortController()
  res.on('close', () => { if (!res.writableEnded) controller.abort() })
  try {
    const call = await withCoinCharge(req.user!.id, 'voice', () => startVoiceCall(req.user!.id, payload.sdp, payload.context, payload.history, controller.signal))
    if (controller.signal.aborted) { await endVoiceCall(req.user!.id, call.id); return }
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
router.post('/context', asyncHandler(async (req, res) => {
  const { id, context } = z.object({ id: z.string().uuid(), context: assistantContextSchema }).strict().parse(req.body)
  if (!await updateVoiceContext(req.user!.id, id, context)) return res.status(404).json({ message: 'Voice session not found.' })
  res.status(204).send()
}))
export default router
