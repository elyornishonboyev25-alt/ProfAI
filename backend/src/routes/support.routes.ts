import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireOwner } from '../middleware/owner.js'

const router = Router()
const PAGE_SIZE = 20
const threadQuery = z.object({ before: z.string().min(1).max(500).optional() })

// Serialize replies, follow-ups and status changes on the same report. A retry
// must never clear a newer user message's pending flag.
async function lockReports(tx: Prisma.TransactionClient, ids: string[]) {
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "IssueReport" WHERE "id" IN (${Prisma.join(ids)}) ORDER BY "id" FOR UPDATE`)
}

async function readThread(reportId: string, userId: string, before: string | undefined, owner: boolean) {
  if (before && !await prisma.issueReportMessage.findFirst({ where: { id: before, reportId } })) return null
  const rows = await prisma.issueReportMessage.findMany({
    where: { reportId, ...(owner ? {} : { kind: { in: ['ADMIN_REPLY', 'USER_REPLY'] } }) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 51,
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
  })
  const page = rows.slice(0, 50)
  const notifications = owner ? await prisma.notification.findMany({
    where: { userId, id: { in: page.flatMap(item => item.notificationId ? [item.notificationId] : []) } },
    select: { id: true, readAt: true },
  }) : []
  return {
    items: page.reverse().map(({ authorEmail, authorId, notificationId, ...item }) => ({
      ...item, ...(owner ? { authorEmail, authorId, readAt: notifications.find(notification => notification.id === notificationId)?.readAt ?? null } : {}),
    })),
    nextCursor: rows.length > 50 ? rows[49].id : null,
  }
}
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

router.get('/notifications/:id/reports', requireAuth, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const notification = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user!.id }, select: { metadata: true } })
  const metadata = notification?.metadata as Record<string, unknown> | null
  if (metadata?.kind !== 'ISSUE_REPORT_REPLY' || !Array.isArray(metadata.reportIds)) return res.status(404).json({ message: 'Report reply not found.' })
  const ids = metadata.reportIds.filter((id): id is string => typeof id === 'string')
  const items = await prisma.issueReport.findMany({ where: { id: { in: ids }, userId: req.user!.id }, select: { id: true, description: true } })
  return res.json({ items })
}))

router.get('/reports/:id/thread', requireAuth, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const parsed = threadQuery.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid conversation cursor.' })
  const report = await prisma.issueReport.findFirst({ where: { id: req.params.id, userId: req.user!.id }, select: { id: true, description: true, status: true, needsReply: true, createdAt: true } })
  if (!report) return res.status(404).json({ message: 'Report not found.' })
  const thread = await readThread(report.id, req.user!.id, parsed.data.before, false)
  if (!thread) return res.status(400).json({ message: 'Invalid conversation cursor.' })
  return res.json({ report, ...thread })
}))

router.post('/reports/:id/replies', requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({ message: z.string().trim().min(1).max(3000), requestId: z.string().uuid() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Write a reply of 1–3000 characters.' })
  const { message, requestId } = parsed.data
  const result = await prisma.$transaction(async tx => {
    // Check ownership before taking a row lock on a user-supplied report ID.
    if (!await tx.issueReport.findFirst({ where: { id: req.params.id, userId: req.user!.id }, select: { id: true } })) return null
    await lockReports(tx, [req.params.id])
    const author = await tx.user.findUnique({ where: { id: req.user!.id }, select: { fullName: true, email: true } })
    if (!author) return null
    const created = await tx.issueReportMessage.createMany({ data: [{
      id: `support_user_${requestId}_${req.params.id}`, reportId: req.params.id, kind: 'USER_REPLY',
      authorId: req.user!.id, authorName: author.fullName, authorEmail: author.email, message,
    }], skipDuplicates: true })
    if (created.count) await tx.issueReport.update({ where: { id: req.params.id }, data: { status: 'OPEN', needsReply: true, lastActivityAt: new Date() } })
    return { sent: true }
  })
  if (!result) return res.status(404).json({ message: 'Report not found.' })
  return res.status(201).json(result)
}))

router.get('/owner/overview', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const query = z.object({
    userPeriod: z.enum(['ALL', 'TODAY', 'WEEK']).default('ALL'),
    userKind: z.enum(['JOINED', 'ACTIVE']).default('JOINED'),
    userPage: z.coerce.number().int().min(1).max(10000).default(1),
    reportPage: z.coerce.number().int().min(1).max(10000).default(1),
    status: z.enum(['ALL', 'PENDING', 'OPEN', 'RESOLVED', 'IGNORED']).default('ALL'),
    category: z.enum(['ALL', 'BUG', 'BILLING', 'FEATURE', 'OTHER']).default('ALL'),
    q: z.string().trim().max(200).default(''),
  }).safeParse(req.query)
  if (!query.success) return res.status(400).json({ message: 'Invalid page or report filter.' })

  const { userPage, userPeriod, userKind, reportPage, status, category, q } = query.data
  const now = new Date()
  const tashkentNow = new Date(now.getTime() + 5 * 60 * 60 * 1000)
  const today = new Date(Date.UTC(tashkentNow.getUTCFullYear(), tashkentNow.getUTCMonth(), tashkentNow.getUTCDate()) - 5 * 60 * 60 * 1000)
  const lastSevenDays = new Date(today)
  lastSevenDays.setUTCDate(lastSevenDays.getUTCDate() - 6)
  const usersSince = userPeriod === 'TODAY' ? today : userPeriod === 'WEEK' ? lastSevenDays : undefined
  const userWhere = (since?: Date): Prisma.UserWhereInput => userKind === 'ACTIVE'
    ? { authSessions: { some: since ? { lastSeenAt: { gte: since, lte: now } } : {} } }
    : since ? { createdAt: { gte: since, lte: now } } : {}
  const reportWhere: Prisma.IssueReportWhereInput = {
    ...(status === 'PENDING' ? { needsReply: true } : status === 'ALL' ? {} : { status }),
    ...(category === 'ALL' ? {} : { category }),
    ...(q ? { OR: ['name', 'email', 'description', 'pagePath'].map(field => ({ [field]: { contains: q, mode: 'insensitive' } })) } : {}),
  }
  const [totalUsers, todayUsers, weekUsers, totalReports, openReports, filteredReports, users, reports, filteredUsers] = await Promise.all([
    prisma.user.count({ where: userWhere() }),
    prisma.user.count({ where: userWhere(today) }),
    prisma.user.count({ where: userWhere(lastSevenDays) }),
    prisma.issueReport.count(),
    prisma.issueReport.count({ where: { status: 'OPEN' } }),
    prisma.issueReport.count({ where: reportWhere }),
    prisma.user.findMany({
      where: userWhere(usersSince),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (userPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, fullName: true, email: true, createdAt: true,
        authSessions: { orderBy: { lastSeenAt: 'desc' }, take: 1, select: { lastSeenAt: true } } },
    }),
    prisma.issueReport.findMany({
      where: reportWhere,
      orderBy: [{ needsReply: 'desc' }, { lastActivityAt: 'desc' }, { id: 'desc' }],
      skip: (reportPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, userId: true, name: true, email: true, category: true, description: true, pagePath: true, status: true, needsReply: true, lastActivityAt: true, createdAt: true,
        messages: { where: { kind: 'USER_REPLY' }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1, select: { message: true, createdAt: true } } },
    }),
    prisma.user.count({ where: userWhere(usersSince) }),
  ])

  return res.json({
    metrics: { totalUsers, todayUsers, weekUsers, totalReports, openReports },
    users: { items: users.map(({ authSessions, ...user }) => ({ ...user, lastSeenAt: authSessions?.[0]?.lastSeenAt ?? null })), total: filteredUsers, page: userPage, pageSize: PAGE_SIZE },
    reports: { items: reports, total: filteredReports, page: reportPage, pageSize: PAGE_SIZE },
  })
}))

// Report badges represent work awaiting an explicit reply/ignore, independently
// of the browser's read cursors. Opening the inbox cannot dismiss them.
router.get('/owner/updates', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const cursor = z.string().datetime().default('1970-01-01T00:00:00.000Z')
  const parsed = z.object({ activity: cursor, users: cursor, payments: cursor, reports: cursor, reviews: cursor }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid update cursors.' })
  res.setHeader('Cache-Control', 'no-store')
  const checkedAt = new Date()
  const since = (key: keyof typeof parsed.data) => ({ gt: new Date(parsed.data[key]), lte: checkedAt })
  const [activity, users, payments, reports, reviews] = await Promise.all([
    prisma.authSession.count({ where: { loginAt: since('activity'), method: { not: 'RESTORED' } } }),
    prisma.user.count({ where: { createdAt: since('users') } }),
    prisma.paymentRequest.count({ where: { updatedAt: since('payments'), status: { in: ['PENDING', 'SUBMITTED', 'PROCESSING', 'APPROVED'] } } }),
    prisma.issueReport.count({ where: { needsReply: true } }),
    prisma.review.count({ where: { createdAt: since('reviews') } }),
  ])
  return res.json({ checkedAt, counts: { activity, users, payments, reports, reviews } })
}))

// Recipient accounts come only from existing reports, never from client-supplied user IDs.
router.post('/owner/reports/notify', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = z.object({
    reportIds: z.array(z.string().min(1).max(100)).min(1).max(100),
    requestId: z.string().uuid(),
    title: z.string().trim().min(3).max(120),
    message: z.string().trim().min(1).max(3000),
    resolve: z.boolean().default(false),
  }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Select up to 100 reports, add a title (3–120 characters) and a message (1–3000 characters).' })
  const { requestId, title, message, resolve } = parsed.data
  const reportIds = [...new Set(parsed.data.reportIds)]
  const result = await prisma.$transaction(async tx => {
    await lockReports(tx, reportIds)
    const reports = await tx.issueReport.findMany({ where: { id: { in: reportIds } }, select: { id: true, userId: true } })
    if (reports.length !== reportIds.length) return null
    const author = await tx.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { fullName: true, email: true } })
    const now = new Date()
    const recipients = new Map<string, string[]>()
    for (const report of reports) recipients.set(report.userId, [...(recipients.get(report.userId) ?? []), report.id])
    const created = await tx.notification.createManyAndReturn({
      data: [...recipients].map(([userId, ids]) => ({
        // Primary-key deduplication also covers concurrent requests and retries after a timeout.
        id: `support_${requestId}_${userId}`, userId, type: 'SYSTEM' as const, title, message,
        metadata: { kind: 'ISSUE_REPORT_REPLY', reportIds: ids, resolved: resolve, authorId: req.user!.id, authorName: author.fullName },
        createdAt: now,
      })),
      skipDuplicates: true, select: { id: true, userId: true },
    })
    // Only a newly delivered reply may acknowledge reports. Duplicate deliveries
    // cannot close a report reopened by a later follow-up.
    const delivered = new Map(created.map(item => [item.userId, item.id]))
    const repliedReports = reports.filter(report => delivered.has(report.userId))
    if (repliedReports.length) {
      await tx.issueReportMessage.createMany({ data: repliedReports.map(report => ({
        id: `${delivered.get(report.userId)}_${report.id}`, reportId: report.id, kind: 'ADMIN_REPLY',
        authorId: req.user!.id, authorName: author.fullName, authorEmail: author.email,
        title, message, notificationId: delivered.get(report.userId)!, createdAt: now,
      })) })
      const ids = repliedReports.map(report => report.id)
      await tx.issueReport.updateMany({ where: { id: { in: ids } }, data: { needsReply: false, lastActivityAt: now, ...(resolve ? { status: 'RESOLVED' } : {}) } })
      if (!resolve) await tx.issueReport.updateMany({ where: { id: { in: ids }, status: 'IGNORED' }, data: { status: 'OPEN' } })
    }
    return { sentCount: created.length, recipientCount: recipients.size, reportCount: reports.length }
  })
  if (!result) return res.status(404).json({ message: 'One or more reports no longer exist. Refresh and select the reports again.' })
  return res.status(201).json(result)
}))

router.get('/owner/reports/:id/replies', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = threadQuery.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid conversation cursor.' })
  const report = await prisma.issueReport.findUnique({ where: { id: req.params.id }, select: { userId: true } })
  if (!report) return res.status(404).json({ message: 'Report not found.' })
  const thread = await readThread(req.params.id, report.userId, parsed.data.before, true)
  if (!thread) return res.status(400).json({ message: 'Invalid conversation cursor.' })
  return res.json(thread)
}))

router.patch('/owner/reports/:id', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = z.object({ status: z.enum(['OPEN', 'RESOLVED', 'IGNORED']) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid report status.' })
  const result = await prisma.$transaction(async tx => {
    await lockReports(tx, [req.params.id])
    const existing = await tx.issueReport.findUnique({ where: { id: req.params.id } })
    if (!existing) return { code: 404, body: { message: 'Report not found.' } }
    const status = parsed.data.status
    if (status === 'RESOLVED' && existing.needsReply) return { code: 409, body: { message: 'Reply to the user or explicitly ignore this report first.' } }
    if (existing.status === status) return { code: 200, body: existing }
    const author = await tx.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { fullName: true, email: true } })
    const now = new Date()
    const report = await tx.issueReport.update({ where: { id: existing.id }, data: { status, needsReply: status === 'OPEN', lastActivityAt: now } })
    await tx.issueReportMessage.create({ data: {
      reportId: existing.id, kind: status === 'IGNORED' ? 'IGNORED' : status === 'OPEN' ? 'REOPENED' : 'RESOLVED',
      authorId: req.user!.id, authorName: author.fullName, authorEmail: author.email, message: '', createdAt: now,
    } })
    return { code: 200, body: report }
  })
  return res.status(result.code).json(result.body)
}))

export default router
