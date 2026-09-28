import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireOwner } from '../middleware/owner.js'

const router = Router()
const PAGE_SIZE = 20
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

router.get('/owner/overview', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const query = z.object({
    userPage: z.coerce.number().int().min(1).max(10000).default(1),
    reportPage: z.coerce.number().int().min(1).max(10000).default(1),
    status: z.enum(['ALL', 'OPEN', 'RESOLVED']).default('ALL'),
  }).safeParse(req.query)
  if (!query.success) return res.status(400).json({ message: 'Invalid page or report filter.' })

  const { userPage, reportPage, status } = query.data
  const now = new Date()
  const tashkentNow = new Date(now.getTime() + 5 * 60 * 60 * 1000)
  const today = new Date(Date.UTC(tashkentNow.getUTCFullYear(), tashkentNow.getUTCMonth(), tashkentNow.getUTCDate()) - 5 * 60 * 60 * 1000)
  const lastSevenDays = new Date(today)
  lastSevenDays.setUTCDate(lastSevenDays.getUTCDate() - 6)
  const reportWhere = status === 'ALL' ? {} : { status }
  const [totalUsers, todayUsers, weekUsers, totalReports, openReports, filteredReports, users, reports] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: lastSevenDays } } }),
    prisma.issueReport.count(),
    prisma.issueReport.count({ where: { status: 'OPEN' } }),
    prisma.issueReport.count({ where: reportWhere }),
    prisma.user.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (userPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, fullName: true, email: true, createdAt: true },
    }),
    prisma.issueReport.findMany({
      where: reportWhere,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (reportPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, category: true, description: true, pagePath: true, status: true, createdAt: true },
    }),
  ])

  return res.json({
    metrics: { totalUsers, todayUsers, weekUsers, totalReports, openReports },
    users: { items: users, total: totalUsers, page: userPage, pageSize: PAGE_SIZE },
    reports: { items: reports, total: filteredReports, page: reportPage, pageSize: PAGE_SIZE },
  })
}))

router.patch('/owner/reports/:id', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = z.object({ status: z.enum(['OPEN', 'RESOLVED']) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid report status.' })
  const existing = await prisma.issueReport.findUnique({ where: { id: req.params.id }, select: { id: true } })
  if (!existing) return res.status(404).json({ message: 'Report not found.' })
  const report = await prisma.issueReport.update({ where: { id: existing.id }, data: parsed.data, select: { id: true, status: true } })
  return res.json(report)
}))

export default router
