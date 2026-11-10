import { randomUUID } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { accountOverview, BillingError, usagePeriod } from './billing.service.js'
import { PLAN_QUOTAS } from '../utils/billingCatalog.js'
import { VOICE_DAILY_SECONDS } from '../utils/studyAccess.js'
import type { Prisma } from '@prisma/client'

export const VOICE_LEASE_MS = 45000
const releaseHandlers: Array<(userId: string, id: string) => Promise<unknown>> = []
export function onVoiceReservationReplaced(handler: (userId: string, id: string) => Promise<unknown>) { releaseHandlers.push(handler) }

async function settleInTransaction(tx: Prisma.TransactionClient, userId: string, id: string, failed: boolean, now: Date) {
  const session = await tx.voiceAllowanceSession.findFirst({ where: { id, userId, endedAt: null } })
  if (!session) return
  await tx.voiceAllowanceSession.update({ where: { id }, data: { endedAt: now } })
  const until = session.leaseExpiresAt && session.leaseExpiresAt < now ? session.leaseExpiresAt : now
  const used = failed ? 0 : Math.min(session.reservedSeconds, Math.max(0, Math.ceil((until.getTime() - session.startedAt.getTime()) / 1000)))
  const refund = session.reservedSeconds - used
  if (session.metered && refund) for (const [feature, period] of [['voice', session.month], ['voice_daily', session.day]]) await tx.featureUsage.updateMany({
    where: { userId, feature, period, count: { gte: refund } }, data: { count: { decrement: refund } },
  })
}

export function voiceWindow(tier: keyof typeof VOICE_DAILY_SECONDS, monthUsed: number, dayUsed: number, now = new Date(), capSeconds = 3600) {
  const daily = VOICE_DAILY_SECONDS[tier]
  const monthly = PLAN_QUOTAS[tier].voice ?? 0
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.max(0, Math.min(daily - dayUsed, monthly - monthUsed, capSeconds, Math.floor((midnight - now.getTime()) / 1000)))
}

export async function voiceUsageSnapshot(userId: string, now = new Date()) {
  const { access, tier } = await accountOverview(userId, prisma, now)
  const month = usagePeriod(now), day = now.toISOString().slice(0, 10)
  const rows = await prisma.featureUsage.findMany({ where: { userId, OR: [{ feature: 'voice', period: month }, { feature: 'voice_daily', period: day }] } })
  const active = await prisma.voiceAllowanceSession.findMany({ where: { userId, endedAt: null, expiresAt: { gt: now } } })
  // Reservations protect against concurrent tabs; show actual elapsed time in the UI.
  const unused = active.filter(row => row.metered).reduce((sum, row) => {
    const until = row.leaseExpiresAt && row.leaseExpiresAt < now ? row.leaseExpiresAt : now
    return sum + Math.max(0, row.reservedSeconds - Math.ceil((until.getTime() - row.startedAt.getTime()) / 1000))
  }, 0)
  return { daily: { used: Math.max(0, (rows.find(row => row.feature === 'voice_daily')?.count ?? 0) - unused), limit: access.kind === 'UNLIMITED' ? null : VOICE_DAILY_SECONDS[tier] },
    monthly: { used: Math.max(0, (rows.find(row => row.feature === 'voice')?.count ?? 0) - unused), limit: access.kind === 'UNLIMITED' ? null : PLAN_QUOTAS[tier].voice },
    activeUntil: active.find(row => row.leaseExpiresAt && row.leaseExpiresAt > now)?.expiresAt.toISOString() ?? null }
}

/** Reserve time atomically before opening a provider connection. */
export async function reserveVoiceTime(userId: string, capSeconds: number, now = new Date(), clientId?: string) {
  const replaced: string[] = []
  const reservation = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`voice:${userId}`}, 0))`
    const { access, tier } = await accountOverview(userId, tx, now)
    if (!access.active) throw new BillingError('PREMIUM_REQUIRED', 'Live AI is available with IvyGoo Pro and IvyGoo Elite.')
    const active = await tx.voiceAllowanceSession.findFirst({ where: { userId, endedAt: null, expiresAt: { gt: now } } })
    if (active) {
      const abandoned = !active.leaseExpiresAt || active.leaseExpiresAt <= now
      if (!clientId || (!abandoned && active.clientId !== clientId)) throw new BillingError('VOICE_ALREADY_ACTIVE', 'Live voice is active in another tab or device. End it there before starting a second call.', 409)
      // Replacing this tab's old call and refunding its unused allowance happens
      // under the same account lock as the new reservation.
      await settleInTransaction(tx, userId, active.id, false, now)
      replaced.push(active.id)
    }
    const month = usagePeriod(now), day = now.toISOString().slice(0, 10)
    const metered = access.kind !== 'UNLIMITED'
    const [monthly, daily] = await Promise.all([
      tx.featureUsage.findUnique({ where: { userId_feature_period: { userId, feature: 'voice', period: month } } }),
      tx.featureUsage.findUnique({ where: { userId_feature_period: { userId, feature: 'voice_daily', period: day } } }),
    ])
    let seconds = metered ? voiceWindow(tier, monthly?.count ?? 0, daily?.count ?? 0, now, capSeconds) : capSeconds
    if (access.expiresAt) seconds = Math.min(seconds, Math.floor((Date.parse(access.expiresAt) - now.getTime()) / 1000))
    if (seconds < 1) {
      const dailyReached = (daily?.count ?? 0) >= VOICE_DAILY_SECONDS[tier]
      throw new BillingError('PREMIUM_REQUIRED', tier === 'PRO' ? 'Your Live AI time is used up. IvyGoo Elite includes 4 hours a day and 120 hours a month.' : dailyReached ? 'Your daily Live AI time is used up. It renews at 00:00 UTC.' : 'Your monthly Live AI time is used up. It renews on the first day of next month.')
    }
    if (metered) for (const [feature, period] of [['voice', month], ['voice_daily', day]]) await tx.featureUsage.upsert({
      where: { userId_feature_period: { userId, feature, period } }, create: { userId, feature, period, count: seconds }, update: { count: { increment: seconds } },
    })
    return tx.voiceAllowanceSession.create({ data: { id: randomUUID(), userId, clientId: clientId ?? null, leaseExpiresAt: new Date(now.getTime() + 90000), month, day, startedAt: now, expiresAt: new Date(now.getTime() + seconds * 1000), reservedSeconds: seconds, metered } })
  })
  await Promise.allSettled(replaced.flatMap(id => releaseHandlers.map(handler => handler(userId, id))))
  return reservation
}

/** Release unused reserved seconds once; failure before connection refunds everything. */
export async function settleVoiceTime(userId: string, id: string, failed = false, now = new Date()) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`voice:${userId}`}, 0))`
    await settleInTransaction(tx, userId, id, failed, now)
  })
}

export async function heartbeatVoiceSession(userId: string, id: string, clientId: string, now = new Date()) {
  const updated = await prisma.voiceAllowanceSession.updateMany({ where: { id, userId, clientId, endedAt: null, expiresAt: { gt: now }, leaseExpiresAt: { gt: now } },
    data: { leaseExpiresAt: new Date(now.getTime() + VOICE_LEASE_MS) } })
  return updated.count === 1
}

export async function requireVoiceReservation(userId: string, id: string) {
  const now = new Date()
  const session = await prisma.voiceAllowanceSession.findFirst({ where: { id, userId, endedAt: null, expiresAt: { gt: now }, leaseExpiresAt: { gt: now } } })
  if (!session) throw new BillingError('VOICE_SESSION_REPLACED', 'This voice connection was replaced by a newer one.', 409)
  return session
}

export async function requireLiveSession(userId: string) {
  const now = new Date()
  if (!await prisma.voiceAllowanceSession.findFirst({ where: { userId, endedAt: null, expiresAt: { gt: now }, leaseExpiresAt: { gt: now } } })) throw new BillingError('PREMIUM_REQUIRED', 'Start a Live AI session with IvyGoo Pro or IvyGoo Elite.')
}
