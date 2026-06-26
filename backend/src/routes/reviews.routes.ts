import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(60).default(24),
})

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  exam: z.enum(['IELTS', 'SAT', 'General']).default('IELTS'),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  bandBefore: z.string().trim().max(12).optional().or(z.literal('')),
  bandAfter: z.string().trim().max(12).optional().or(z.literal('')),
  text: z.string().trim().min(8).max(600),
})

// Public — anyone (even signed-out visitors) can read the shared testimonials.
router.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as unknown as z.infer<typeof listQuerySchema>

    const reviews = await prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        exam: true,
        rating: true,
        bandBefore: true,
        bandAfter: true,
        text: true,
        createdAt: true,
      },
    })

    return res.json({ reviews })
  }),
)

// Public — visitors can submit a success story without an account. The global
// API rate-limiter (mounted in app.ts) guards this against spam bursts.
router.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>

    const review = await prisma.review.create({
      data: {
        name: body.name,
        exam: body.exam,
        rating: body.rating,
        bandBefore: body.bandBefore ? body.bandBefore : null,
        bandAfter: body.bandAfter ? body.bandAfter : null,
        text: body.text,
      },
      select: {
        id: true,
        name: true,
        exam: true,
        rating: true,
        bandBefore: true,
        bandAfter: true,
        text: true,
        createdAt: true,
      },
    })

    return res.status(201).json({ review })
  }),
)

export default router
