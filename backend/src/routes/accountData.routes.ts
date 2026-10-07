import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { mergeAccountData } from '../services/accountDataMerge.js'

const router = Router()
router.use(requireAuth, (_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
router.get('/', asyncHandler(async (req, res) => {
  const entries = await prisma.accountLearningData.findMany({ where: { userId: req.user!.id }, select: { key: true, value: true } })
  res.json({ entries })
}))
router.put('/', validateBody(z.object({
  key: z.string().min(1).max(300),
  base: z.string().max(3_000_000).nullable(),
  value: z.string().max(3_000_000).nullable(),
}).strict()), asyncHandler(async (req, res) => {
  const { key, base, value } = req.body as { key: string; base: string | null; value: string | null }
  const userId = req.user!.id
  const entry = await prisma.$transaction(async (tx) => {
    // Serialize read/merge/write for this account across devices.
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
    const current = await tx.accountLearningData.findUnique({ where: { userId_key: { userId, key } } })
    const merged = mergeAccountData(current?.value ?? null, base, value)
    return tx.accountLearningData.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, value: merged }, update: { value: merged }, select: { key: true, value: true },
    })
  })
  res.json(entry)
}))
export default router
