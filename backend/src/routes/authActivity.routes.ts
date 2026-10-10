import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOwner } from '../middleware/owner.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { hashToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js'
import { createAuthSession, onlineWhere, requestDeviceId, ONLINE_WINDOW_MS } from '../services/authActivity.service.js'

const router = Router()
const heartbeatSchema = z.object({ refreshToken: z.string().min(1).max(4096).nullable().optional() })

router.post('/activity/heartbeat', requireAuth, validateBody(heartbeatSchema), asyncHandler(async (req, res) => {
  const payload = verifyAccessToken(req.headers.authorization!.slice(7))
  let sessionId = payload.sid
  // Existing signed-in clients can adopt tracking without signing out.
  if (!sessionId && req.body.refreshToken) {
    let token
    try { token = verifyRefreshToken(req.body.refreshToken) } catch { return res.status(204).send() }
    if (token.sub !== req.user!.id) return res.status(204).send()
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(req.body.refreshToken) } })
    if (!stored || stored.userId !== req.user!.id || stored.revokedAt || stored.expiresAt <= new Date()) return res.status(204).send()
    sessionId = stored.sessionId ?? undefined
    if (!sessionId) {
      sessionId = await prisma.$transaction(async (tx) => {
        const session = await createAuthSession({ userId: req.user!.id, deviceId: requestDeviceId(req),
          userAgent: req.get('user-agent'), ipAddress: req.ip, method: 'RESTORED', expiresAt: stored.expiresAt }, tx)
        const claim = await tx.refreshToken.updateMany({ where: { id: stored.id, sessionId: null, revokedAt: null }, data: { sessionId: session.id } })
        if (claim.count) return session.id
        await tx.authSession.delete({ where: { id: session.id } })
        return (await tx.refreshToken.findUnique({ where: { id: stored.id } }))?.sessionId ?? undefined
      })
    }
  }
  if (sessionId) await prisma.authSession.updateMany({
    where: { id: sessionId, userId: req.user!.id, endedAt: null, expiresAt: { gt: new Date() } },
    data: { lastSeenAt: new Date() },
  })
  return res.status(204).send()
}))

const querySchema = z.object({
  q: z.string().trim().max(160).default(''),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  view: z.enum(['accounts', 'history']).default('accounts'),
  filter: z.enum(['all', 'online', 'multiple']).default('all'),
  days: z.enum(['1', '7', '30', 'all']).default('7'),
})
type Count = { count: bigint }
type AccountRow = { id: string; fullName: string; email: string; deviceCount: bigint; onlineDevices: bigint; loginCount: bigint; lastSeenAt: Date }

router.get('/owner/activity', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid activity filters.' })
  const { q, page, view, filter, days } = parsed.data
  const now = new Date()
  const onlineSince = new Date(now.getTime() - ONLINE_WINDOW_MS)
  const pageSize = 20
  const since = days === 'all' ? undefined : new Date(now.getTime() - Number(days) * 86400000)
  const activeSql = Prisma.sql`"endedAt" IS NULL AND "expiresAt" > ${now} AND "lastSeenAt" >= ${onlineSince}`
  const aggregate = Prisma.sql`WITH accounts AS (
    SELECT "userId", COUNT(DISTINCT "deviceId") AS "deviceCount", COUNT(*) AS "loginCount",
      COUNT(DISTINCT CASE WHEN ${activeSql} THEN "deviceId" END) AS "onlineDevices", MAX("lastSeenAt") AS "lastSeenAt"
    FROM "AuthSession" GROUP BY "userId"
  )`
  const search = `%${q.replace(/[\\%_]/g, '\\$&')}%`
  const conditions = Prisma.sql`(u."email" ILIKE ${search} OR u."fullName" ILIKE ${search})
    AND ${filter === 'online' ? Prisma.sql`a."onlineDevices" > 0` : filter === 'multiple' ? Prisma.sql`a."deviceCount" > 1` : Prisma.sql`TRUE`}`
  const [online, multi, deviceTotal, logins, firstSeen] = await Promise.all([
    prisma.$queryRaw<Count[]>(Prisma.sql`SELECT COUNT(DISTINCT "userId") AS count FROM "AuthSession" WHERE ${activeSql}`),
    prisma.$queryRaw<Count[]>(Prisma.sql`${aggregate} SELECT COUNT(*) AS count FROM accounts WHERE "deviceCount" > 1`),
    prisma.$queryRaw<Count[]>(Prisma.sql`SELECT COUNT(DISTINCT ("userId", "deviceId")) AS count FROM "AuthSession"`),
    prisma.authSession.count({ where: { method: { not: 'RESTORED' }, ...(since ? { loginAt: { gte: since } } : {}) } }),
    prisma.authSession.findFirst({ orderBy: { loginAt: 'asc' }, select: { loginAt: true } }),
  ])
  let items: unknown[]
  let total: number
  if (view === 'accounts') {
    const [rows, count] = await Promise.all([
      prisma.$queryRaw<AccountRow[]>(Prisma.sql`${aggregate} SELECT u.id, u."fullName", u.email, a."deviceCount", a."onlineDevices", a."loginCount", a."lastSeenAt"
        FROM accounts a JOIN "User" u ON u.id = a."userId" WHERE ${conditions}
        ORDER BY a."lastSeenAt" DESC, u.id ASC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`),
      prisma.$queryRaw<Count[]>(Prisma.sql`${aggregate} SELECT COUNT(*) AS count FROM accounts a JOIN "User" u ON u.id = a."userId" WHERE ${conditions}`),
    ])
    items = rows.map(row => ({ ...row, deviceCount: Number(row.deviceCount), onlineDevices: Number(row.onlineDevices), loginCount: Number(row.loginCount) }))
    total = Number(count[0].count)
  } else {
    const where: Prisma.AuthSessionWhereInput = {
      ...(since ? { loginAt: { gte: since } } : {}),
      user: { OR: [{ email: { contains: q, mode: 'insensitive' } }, { fullName: { contains: q, mode: 'insensitive' } }] },
    }
    const [rows, count] = await Promise.all([
      prisma.authSession.findMany({ where, orderBy: [{ loginAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize,
        select: { id: true, deviceType: true, browser: true, os: true, method: true, ipAddress: true, loginAt: true, lastSeenAt: true,
          user: { select: { id: true, fullName: true, email: true } } } }),
      prisma.authSession.count({ where }),
    ])
    items = rows; total = count
  }
  return res.json({ items, total, page, pageSize, updatedAt: now,
    metrics: { onlineUsers: Number(online[0].count), multipleDeviceAccounts: Number(multi[0].count), totalDevices: Number(deviceTotal[0].count), logins },
    trackingSince: firstSeen?.loginAt ?? null,
  })
}))

router.get('/owner/activity/users/:id/devices', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  // One row per browser profile, even after repeated logins and token rotation.
  const userId = req.params.id
  const [devices, active] = await Promise.all([
    prisma.authSession.findMany({ where: { userId }, orderBy: { loginAt: 'desc' }, distinct: ['deviceId'],
      select: { deviceId: true, deviceType: true, browser: true, os: true, ipAddress: true, loginAt: true } }),
    prisma.authSession.groupBy({ by: ['deviceId'], where: { userId, ...onlineWhere() }, _count: true }),
  ])
  const seen = await prisma.authSession.groupBy({ by: ['deviceId'], where: { userId }, _max: { lastSeenAt: true }, _min: { loginAt: true }, _count: true })
  const onlineIds = new Set(active.map(row => row.deviceId))
  const history = new Map(seen.map(row => [row.deviceId, row]))
  return res.json({ items: devices.map(device => ({ ...device, online: onlineIds.has(device.deviceId),
    firstSeenAt: history.get(device.deviceId)?._min.loginAt, lastSeenAt: history.get(device.deviceId)?._max.lastSeenAt, loginCount: history.get(device.deviceId)?._count,
  })) })
}))

export default router
