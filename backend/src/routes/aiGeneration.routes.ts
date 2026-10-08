import { Router } from 'express'
import { z } from 'zod'
import { AiGenerationError, generateAiText } from '../services/aiProvider.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { withStudyAccess } from '../services/billing.service.js'
import { assessWriting, writingRequestSchema } from '../services/writingAssessment.service.js'

const router = Router()

router.post('/writing/evaluate', asyncHandler(async (req, res) => {
  const payload = writingRequestSchema.parse(req.body)
  const controller = new AbortController()
  const close = () => { if (!res.writableEnded) controller.abort() }
  res.on('close', close)
  try { return res.json(await withStudyAccess(req.user!.id, 'writing', () => assessWriting(req.user!.id, payload, controller.signal))) }
  catch (error) {
    if (controller.signal.aborted) return
    if (error instanceof AiGenerationError) return res.status(error.statusCode).json({ message: error.message, code: error.code })
    throw error
  } finally { res.off('close', close) }
}))

const imageDataUrlSchema = z
  .string()
  .max(1_300_000)
  .regex(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)

const generateBodySchema = z
  .object({
    purpose: z.enum([
      'assistant_chat',
      'writing_evaluation',
      'word_explanation',
      'speaking_examiner',
      'speaking_evaluation',
      'speaking_response_analysis',
      'weekly_plan',
    ]),
    systemPrompt: z.string().trim().min(1).max(50_000),
    userMessage: z.string().trim().min(1).max(40_000),
    maxOutputTokens: z.number().int().min(64).max(8192).default(2048),
    images: z.array(imageDataUrlSchema).max(4).default([]),
  })
  .strict()

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = generateBodySchema.parse(req.body ?? {})
    let result
    try {
      result = await withStudyAccess(req.user!.id, payload.purpose === 'writing_evaluation' ? 'writing' : ['speaking_evaluation', 'speaking_response_analysis'].includes(payload.purpose) ? 'speaking' : 'ai', () => generateAiText({
        userId: req.user!.id,
        purpose: payload.purpose,
        systemPrompt: payload.systemPrompt,
        userMessage: payload.userMessage,
        maxOutputTokens: payload.maxOutputTokens,
        images: payload.images,
      }))
    } catch (error) {
      if (error instanceof AiGenerationError) {
        return res.status(error.statusCode).json({ message: error.message, code: error.code })
      }
      throw error
    }

    return res.json({
      text: result.text,
      provider: result.provider,
      model: result.model,
      fallbackUsed: result.fallbackUsed,
    })
  }),
)

export default router
