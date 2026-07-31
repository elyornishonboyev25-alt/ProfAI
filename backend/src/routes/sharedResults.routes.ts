import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const sectionSummarySchema = z.object({
  title: z.string().trim().min(1).max(100),
  correctAnswers: z.number().int().min(0).max(100),
  totalQuestions: z.number().int().min(1).max(100),
  accuracy: z.number().min(0).max(100),
}).strict()

const shareResultSchema = z.object({
  attemptKey: z.string().trim().min(3).max(220),
  testId: z.string().trim().min(1).max(160),
  testTitle: z.string().trim().min(2).max(180),
  attemptedAt: z.string().datetime({ offset: true }),
  bandScore: z.number().min(0).max(9),
  accuracy: z.number().min(0).max(100),
  correctAnswers: z.number().int().min(0).max(200),
  incorrectAnswers: z.number().int().min(0).max(200),
  skippedAnswers: z.number().int().min(0).max(200),
  totalQuestions: z.number().int().min(1).max(200),
  timeSpentSec: z.number().int().min(0).max(86400),
  sectionSummaries: z.array(sectionSummarySchema).max(8),
  recommendations: z.array(z.string().trim().min(4).max(240)).min(1).max(5),
}).strict().superRefine((value, ctx) => {
  const represented = value.correctAnswers + value.incorrectAnswers + value.skippedAnswers
  if (represented !== value.totalQuestions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalQuestions'],
      message: 'Answer totals must match totalQuestions.',
    })
  }
})

const publicResultSelect = {
  id: true,
  testId: true,
  testTitle: true,
  attemptedAt: true,
  bandScore: true,
  accuracy: true,
  correctAnswers: true,
  incorrectAnswers: true,
  skippedAnswers: true,
  totalQuestions: true,
  timeSpentSec: true,
  sectionSummaries: true,
  recommendations: true,
  createdAt: true,
  user: {
    select: {
      fullName: true,
      nickname: true,
      avatarUrl: true,
    },
  },
} as const

router.post(
  '/',
  requireAuth,
  validateBody(shareResultSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof shareResultSchema>
    const userId = req.user!.id

    const result = await prisma.sharedResult.upsert({
      where: { userId_attemptKey: { userId, attemptKey: body.attemptKey } },
      create: {
        userId,
        ...body,
        attemptedAt: new Date(body.attemptedAt),
      },
      update: {
        testId: body.testId,
        testTitle: body.testTitle,
        attemptedAt: new Date(body.attemptedAt),
        bandScore: body.bandScore,
        accuracy: body.accuracy,
        correctAnswers: body.correctAnswers,
        incorrectAnswers: body.incorrectAnswers,
        skippedAnswers: body.skippedAnswers,
        totalQuestions: body.totalQuestions,
        timeSpentSec: body.timeSpentSec,
        sectionSummaries: body.sectionSummaries,
        recommendations: body.recommendations,
      },
      select: { id: true },
    })

    return res.status(201).json({
      shareId: result.id,
      path: `/shared/results/${result.id}`,
    })
  }),
)

// Public by design: the opaque ID is the share capability. Only sanitized
// score data and the learner's public display identity are returned.
router.get(
  '/:shareId',
  asyncHandler(async (req, res) => {
    const shareId = z.string().cuid().safeParse(req.params.shareId)
    if (!shareId.success) {
      return res.status(404).json({ message: 'Shared result not found.' })
    }

    const result = await prisma.sharedResult.findUnique({
      where: { id: shareId.data },
      select: publicResultSelect,
    })

    if (!result) {
      return res.status(404).json({ message: 'Shared result not found.' })
    }

    return res.json({ result })
  }),
)

export default router
