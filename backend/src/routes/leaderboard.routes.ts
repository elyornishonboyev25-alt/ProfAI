import { TestCategory } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { validateQuery } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { generateLeaderboard } from '../services/leaderboard.service.js'

const router = Router()
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })

const querySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('all'),
  category: z.nativeEnum(TestCategory).optional(),
})

router.get(
  '/',
  requireAuth,
  validateQuery(querySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof querySchema>

    const data = await generateLeaderboard({
      period: query.period,
      category: query.category,
      currentUserId: req.user!.id,
    })

    const podium = data.rows.slice(0, 3)

    return res.json({
      ...data,
      podium,
    })
  }),
)

export default router
