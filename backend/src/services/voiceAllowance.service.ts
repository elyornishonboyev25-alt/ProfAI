import { randomUUID } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { accountOverview, BillingError, usagePeriod } from './billing.service.js'
import { PLAN_QUOTAS } from '../utils/billingCatalog.js'
import { VOICE_DAILY_SECONDS } from '../utils/studyAccess.js'

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
  const unused = active.filter(row => row.metered).reduce((sum, row) => sum + Math.max(0, row.reservedSeconds - Math.ceil((now.getTime() - row.startedAt.getTime()) / 1000)), 0)
  return { daily: { used: Math.max(0, (rows.find(row => row.feature === 'voice_daily')?.count ?? 0) - unused), limit: access.kind === 'UNLIMITED' ? null : VOICE_DAILY_SECONDS[tier] },
    monthly: { used: Math.max(0, (rows.find(row => row.feature === 'voice')?.count ?? 0) - unused), limit: access.kind === 'UNLIMITED' ? null : PLAN_QUOTAS[tier].voice },
    activeUntil: active[0]?.expiresAt.toISOString() ?? null }
}

/** Reserve time atomically before opening a provider connection. */
export async function reserveVoiceTime(userId: string, capSeconds: number, now = new Date()) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`voice:${userId}`}, 0))`
    const { access, tier } = await accountOverview(userId, tx, now)
    if (!access.active) throw new BillingError('PREMIUM_REQUIRED', 'Live AI is available with IvyGoo Pro and IvyGoo Elite.')
    if (await tx.voiceAllowanceSession.findFirst({ where: { userId, endedAt: null, expiresAt: { gt: now } } })) throw new BillingError('VOICE_ALREADY_ACTIVE', 'End your current Live AI session before starting another.', 409)
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
    return tx.voiceAllowanceSession.create({ data: { id: randomUUID(), userId, month, day, startedAt: now, expiresAt: new Date(now.getTime() + seconds * 1000), reservedSeconds: seconds, metered } })
  })
}

/** Release unused reserved seconds once; failure before connection refunds everything. */
export async function settleVoiceTime(userId: string, id: string, failed = false, now = new Date()) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`voice:${userId}`}, 0))`
    const session = await tx.voiceAllowanceSession.findFirst({ where: { id, userId, endedAt: null } })
    if (!session) return
    await tx.voiceAllowanceSession.update({ where: { id }, data: { endedAt: now } })
    const used = failed ? 0 : Math.min(session.reservedSeconds, Math.max(0, Math.ceil((now.getTime() - session.startedAt.getTime()) / 1000)))
    const refund = session.reservedSeconds - used
    if (session.metered && refund) for (const [feature, period] of [['voice', session.month], ['voice_daily', session.day]]) await tx.featureUsage.updateMany({
      where: { userId, feature, period, count: { gte: refund } }, data: { count: { decrement: refund } },
    })
  })
}

export async function requireLiveSession(userId: string) {
  if (!await prisma.voiceAllowanceSession.findFirst({ where: { userId, endedAt: null, expiresAt: { gt: new Date() } } })) throw new BillingError('PREMIUM_REQUIRED', 'Start a Live AI session with IvyGoo Pro or IvyGoo Elite.')
}
