import { Router } from 'express'
import type { Prisma } from '@prisma/client'
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
    category: z.enum(['ALL', 'BUG', 'BILLING', 'FEATURE', 'OTHER']).default('ALL'),
    q: z.string().trim().max(200).default(''),
  }).safeParse(req.query)
  if (!query.success) return res.status(400).json({ message: 'Invalid page or report filter.' })

  const { userPage, reportPage, status, category, q } = query.data
  const now = new Date()
  const tashkentNow = new Date(now.getTime() + 5 * 60 * 60 * 1000)
  const today = new Date(Date.UTC(tashkentNow.getUTCFullYear(), tashkentNow.getUTCMonth(), tashkentNow.getUTCDate()) - 5 * 60 * 60 * 1000)
  const lastSevenDays = new Date(today)
  lastSevenDays.setUTCDate(lastSevenDays.getUTCDate() - 6)
  const reportWhere: Prisma.IssueReportWhereInput = {
    ...(status === 'ALL' ? {} : { status }),
    ...(category === 'ALL' ? {} : { category }),
    ...(q ? { OR: ['name', 'email', 'description', 'pagePath'].map(field => ({ [field]: { contains: q, mode: 'insensitive' } })) } : {}),
  }
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
      select: { id: true, userId: true, name: true, email: true, category: true, description: true, pagePath: true, status: true, createdAt: true },
    }),
  ])

  return res.json({
    metrics: { totalUsers, todayUsers, weekUsers, totalReports, openReports },
    users: { items: users, total: totalUsers, page: userPage, pageSize: PAGE_SIZE },
    reports: { items: reports, total: filteredReports, page: reportPage, pageSize: PAGE_SIZE },
  })
}))

// Recipient accounts come only from existing reports, never from client-supplied user IDs.
router.post('/owner/reports/notify', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = z.object({
    reportIds: z.array(z.string().min(1).max(100)).min(1).max(100),
    requestId: z.string().uuid(),
    title: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(3000),
    resolve: z.boolean().default(false),
  }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Select up to 100 reports, add a title (3–120 characters) and a message (10–3000 characters).' })
  const { requestId, title, message, resolve } = parsed.data
  const reportIds = [...new Set(parsed.data.reportIds)]
  const result = await prisma.$transaction(async tx => {
    const reports = await tx.issueReport.findMany({ where: { id: { in: reportIds } }, select: { id: true, userId: true } })
    if (reports.length !== reportIds.length) return null
    const recipients = new Map<string, string[]>()
    for (const report of reports) recipients.set(report.userId, [...(recipients.get(report.userId) ?? []), report.id])
    const created = await tx.notification.createMany({
      data: [...recipients].map(([userId, ids]) => ({
        // Primary-key deduplication also covers concurrent requests and retries after a timeout.
        id: `support_${requestId}_${userId}`, userId, type: 'SYSTEM' as const, title, message,
        metadata: { kind: 'ISSUE_REPORT_REPLY', reportIds: ids, resolved: resolve },
      })),
      skipDuplicates: true,
    })
    if (resolve && created.count > 0) await tx.issueReport.updateMany({ where: { id: { in: reportIds } }, data: { status: 'RESOLVED' } })
    return { sentCount: created.count, recipientCount: recipients.size, reportCount: reports.length }
  })
  if (!result) return res.status(404).json({ message: 'One or more reports no longer exist. Refresh and select the reports again.' })
  return res.status(201).json(result)
}))

router.get('/owner/reports/:id/replies', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const report = await prisma.issueReport.findUnique({ where: { id: req.params.id }, select: { userId: true } })
  if (!report) return res.status(404).json({ message: 'Report not found.' })
  const items = await prisma.notification.findMany({
    where: { userId: report.userId, AND: [
      { metadata: { path: ['kind'], equals: 'ISSUE_REPORT_REPLY' } },
      { metadata: { path: ['reportIds'], array_contains: [req.params.id] } },
    ] },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20,
    select: { id: true, title: true, message: true, createdAt: true, readAt: true },
  })
  return res.json({ items })
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
