import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const reportSchema = z.object({
  category: z.enum(['BUG', 'BILLING', 'FEATURE', 'OTHER']),
  description: z.string().trim().min(20).max(5000),
  pagePath: z.string().max(500).optional(),
})

router.post('/reports', requireAuth, asyncHandler(async (req, res) => {
  const parsed = reportSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Choose a type and describe the issue in at least 20 characters.' })
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { fullName: true, email: true } })
  if (!user) return res.status(404).json({ message: 'Account not found.' })
  const report = await prisma.issueReport.create({ data: { userId: req.user!.id, name: user.fullName, email: user.email, ...parsed.data } })
  return res.status(201).json({ id: report.id, message: 'Your report has been submitted.' })
}))

export default router
