import { Router } from 'express'
import { z } from 'zod'
import { AiGenerationError, generateAiText } from '../services/aiProvider.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

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
      result = await generateAiText({
        userId: req.user!.id,
        purpose: payload.purpose,
        systemPrompt: payload.systemPrompt,
        userMessage: payload.userMessage,
        maxOutputTokens: payload.maxOutputTokens,
        images: payload.images,
      })
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
