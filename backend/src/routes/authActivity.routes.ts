import { Router, type Request } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOwner } from '../middleware/owner.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { hashToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js'
import { acquireSessionUsage, AuthSessionError, createAuthSession, deviceSignals, onlineWhere, publicDeviceId, releaseSessionUsage, requestDevice, sessionDeviceKey, summarizeDevices, MAX_ACCOUNT_DEVICES, ONLINE_WINDOW_MS } from '../services/authActivity.service.js'

const router = Router()
const heartbeatSchema = z.object({ refreshToken: z.string().min(1).max(4096).nullable().optional() })

router.post('/activity/heartbeat', requireAuth, validateBody(heartbeatSchema), asyncHandler(async (req, res) => {
  const payload = verifyAccessToken(req.headers.authorization!.slice(7))
  let sessionId = payload.sid
  // Existing signed-in clients can adopt tracking without signing out.
  if (!sessionId && req.body.refreshToken) {
    let token
    try { token = verifyRefreshToken(req.body.refreshToken) } catch { throw new AuthSessionError(401, 'SESSION_EXPIRED', 'Please sign in again.') }
    if (token.sub !== req.user!.id) throw new AuthSessionError(401, 'SESSION_EXPIRED', 'Please sign in again.')
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(req.body.refreshToken) } })
    if (!stored || stored.userId !== req.user!.id || stored.revokedAt || stored.expiresAt <= new Date()) throw new AuthSessionError(401, 'SESSION_EXPIRED', 'Please sign in again.')
    sessionId = stored.sessionId ?? undefined
    if (!sessionId) {
      sessionId = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${req.user!.id} FOR UPDATE`
        const latest = await tx.refreshToken.findUnique({ where: { id: stored.id } })
        if (latest?.sessionId) return latest.sessionId
        const session = await createAuthSession({ userId: req.user!.id, ...requestDevice(req),
          userAgent: req.get('user-agent'), ipAddress: req.ip, method: 'RESTORED', expiresAt: stored.expiresAt }, tx)
        const claim = await tx.refreshToken.updateMany({ where: { id: stored.id, sessionId: null, revokedAt: null }, data: { sessionId: session.id } })
        if (claim.count) return session.id
        throw new AuthSessionError(401, 'SESSION_EXPIRED', 'This session has ended. Please sign in again.')
      })
    }
  }
  if (!sessionId) throw new AuthSessionError(401, 'SESSION_EXPIRED', 'Please sign in again.')
  if (!payload.sid) await acquireSessionUsage(req.user!.id, sessionId, req.get('X-Device-Id')?.toLowerCase() ?? '', {
    renew: req.get('X-Device-Activity') !== 'idle', signals: deviceSignals(req),
  })
  return res.status(204).send()
}))

// Sent with keepalive when the last tab of a browser closes, so another device
// does not have to wait for the usage lease to expire.
router.post('/activity/release', requireAuth, asyncHandler(async (req, res) => {
  const { sid } = verifyAccessToken(req.headers.authorization!.slice(7))
  if (sid) await releaseSessionUsage(req.user!.id, sid)
  return res.status(204).send()
}))

async function currentDeviceKey(req: Request) {
  const { sid } = verifyAccessToken(req.headers.authorization!.slice(7))
  const session = sid ? await prisma.authSession.findUnique({ where: { id: sid }, select: { deviceId: true, deviceKey: true } }) : null
  return session ? sessionDeviceKey(session) : undefined
}

const activeDeviceWhere = (userId: string): Prisma.AuthSessionWhereInput => ({ userId, endedAt: null, expiresAt: { gt: new Date() } })
const deviceSelect = { deviceId: true, deviceKey: true, deviceType: true, browser: true, os: true, lastSeenAt: true } as const

router.get('/devices', requireAuth, asyncHandler(async (req, res) => {
  const [current, rows] = await Promise.all([
    currentDeviceKey(req),
    prisma.authSession.findMany({ where: activeDeviceWhere(req.user!.id), select: deviceSelect }),
  ])
  return res.json({ maxDevices: MAX_ACCOUNT_DEVICES, devices: summarizeDevices(rows, current) })
}))

// Signs a lost or replaced device out everywhere, freeing its slot.
router.delete('/devices/:id', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const current = await currentDeviceKey(req)
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
    const rows = await tx.authSession.findMany({ where: activeDeviceWhere(userId), select: { id: true, deviceId: true, deviceKey: true } })
    const target = rows.filter(row => publicDeviceId(sessionDeviceKey(row)) === req.params.id)
    if (!target.length) throw new AuthSessionError(404, 'DEVICE_NOT_FOUND', 'This device is no longer signed in.')
    if (sessionDeviceKey(target[0]) === current) throw new AuthSessionError(400, 'CURRENT_DEVICE', 'Use Sign out to leave this device.')
    const ids = target.map(row => row.id)
    const now = new Date()
    await tx.authSession.updateMany({ where: { id: { in: ids } }, data: { endedAt: now, usageUntil: null } })
    await tx.refreshToken.updateMany({ where: { sessionId: { in: ids }, revokedAt: null }, data: { revokedAt: now } })
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
    SELECT "userId", COUNT(DISTINCT COALESCE("deviceKey", "deviceId")) AS "deviceCount", COUNT(*) AS "loginCount",
      COUNT(DISTINCT CASE WHEN ${activeSql} THEN COALESCE("deviceKey", "deviceId") END) AS "onlineDevices", MAX("lastSeenAt") AS "lastSeenAt"
    FROM "AuthSession" GROUP BY "userId"
  )`
  const search = `%${q.replace(/[\\%_]/g, '\\$&')}%`
  const conditions = Prisma.sql`(u."email" ILIKE ${search} OR u."fullName" ILIKE ${search})
    AND ${filter === 'online' ? Prisma.sql`a."onlineDevices" > 0` : filter === 'multiple' ? Prisma.sql`a."deviceCount" > 1` : Prisma.sql`TRUE`}`
  const [online, multi, deviceTotal, logins, firstSeen] = await Promise.all([
    prisma.$queryRaw<Count[]>(Prisma.sql`SELECT COUNT(DISTINCT "userId") AS count FROM "AuthSession" WHERE ${activeSql}`),
    prisma.$queryRaw<Count[]>(Prisma.sql`${aggregate} SELECT COUNT(*) AS count FROM accounts WHERE "deviceCount" > 1`),
    prisma.$queryRaw<Count[]>(Prisma.sql`SELECT COUNT(DISTINCT ("userId", COALESCE("deviceKey", "deviceId"))) AS count FROM "AuthSession"`),
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
