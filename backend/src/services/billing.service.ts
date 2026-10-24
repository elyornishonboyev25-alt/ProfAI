import { Prisma, type PaymentRequest } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { PLAN_QUOTAS, extendBillingExpiry, type AccessFeature, type PlanTier } from '../utils/billingCatalog.js'
import { resolveAccountAccess } from '../utils/accessEntitlement.js'
import { isPremiumUser } from '../utils/premium.js'
type Tx = Prisma.TransactionClient
export class BillingError extends Error {
  constructor(public code: string, message: string, public statusCode = 402) { super(message) }
}
export async function lockBilling(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`billing:${userId}`}, 0))`
}
/** Usage resets on the first day of every UTC month. */
export function usagePeriod(now = new Date()) {
  return now.toISOString().slice(0, 7)
}
const FEATURES = Object.keys(PLAN_QUOTAS.FREE) as AccessFeature[]
export async function usageSnapshot(userId: string, tier: PlanTier, tx: Tx = prisma, now = new Date()) {
  const rows = await tx.featureUsage.findMany({ where: { userId, period: usagePeriod(now) }, select: { feature: true, count: true } })
  const used = new Map(rows.map(row => [row.feature, row.count]))
  return Object.fromEntries(FEATURES.map(feature => [feature, { used: used.get(feature) ?? 0, limit: PLAN_QUOTAS[tier][feature] }])) as
    Record<AccessFeature, { used: number; limit: number | null }>
}
export async function accountOverview(userId: string, tx: Tx = prisma, now = new Date()) {
  const [user, grant, subscriptions] = await Promise.all([
    tx.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, email: true, nickname: true } }),
    tx.premiumGrant.findUnique({ where: { userId } }),
    tx.billingSubscription.findMany({ where: { userId, startsAt: { lte: now }, expiresAt: { gt: now } } }),
  ])
  const access = resolveAccountAccess(grant, isPremiumUser(user), subscriptions, now)
  return { access, tier: access.tier, subscriptions, canJoinClass: access.active, canCreateClass: access.tier === 'MAX' }
}
function limitMessage(feature: AccessFeature, tier: PlanTier) {
  if (tier === 'FREE') return `You have used this month's free ${feature} allowance. Upgrade to Pro ($5.99/month) or Max ($11.99/month) to continue.`
  return `You have reached this month's ${feature} limit on your plan. Upgrade to Max for more.`
}
/** Spends one unit of a monthly allowance, or refuses when it is used up. */
export async function consumeQuota(userId: string, feature: AccessFeature) {
  const { access, tier } = await accountOverview(userId)
  // Owners, admins and unlimited grants are never metered.
  const limit = access.kind === 'UNLIMITED' ? null : PLAN_QUOTAS[tier][feature]
  if (limit === null) return { tier, limit, used: 0 }
  const period = usagePeriod()
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`usage:${userId}:${feature}`}, 0))`
    const current = await tx.featureUsage.findUnique({ where: { userId_feature_period: { userId, feature, period } } })
    if ((current?.count ?? 0) >= limit) throw new BillingError('PREMIUM_REQUIRED', limitMessage(feature, tier))
    const row = await tx.featureUsage.upsert({ where: { userId_feature_period: { userId, feature, period } },
      create: { userId, feature, period, count: 1 }, update: { count: { increment: 1 } } })
    return { tier, limit, used: row.count }
  })
}
async function refundQuota(userId: string, feature: AccessFeature) {
  await prisma.featureUsage.updateMany({ where: { userId, feature, period: usagePeriod(), count: { gt: 0 } }, data: { count: { decrement: 1 } } })
}
// Every plan, including Free, may reach AI endpoints; each request is metered by withStudyAccess.
export async function requireStudyAccess(userId: string) {
  await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true } })
}
export async function requireClassPlan(userId: string) {
  if (!(await accountOverview(userId)).canJoinClass) throw new BillingError('CLASS_PLAN_REQUIRED', 'Joining classes requires an active Pro ($5.99/month) or Max ($11.99/month) plan.', 403)
}
export async function requireTeacherPlan(userId: string) {
  if (!(await accountOverview(userId)).canCreateClass) throw new BillingError('TEACHER_PLAN_REQUIRED', 'Class creation requires an active Max plan ($11.99/month).', 403)
}
export function validateResource(feature: AccessFeature, resource: string) {
  const patterns: Partial<Record<AccessFeature, RegExp>> = {
    test: /^test:(?:reading|listening|sat|database):[A-Za-z0-9_:-]{1,120}$/,
    mock: /^mock:(?:ielts|sat):[A-Za-z0-9_-]{1,100}$/,
    shadowing: /^shadowing:[A-Za-z0-9_-]{11}$/, podcast: /^podcast:[A-Za-z0-9_-]{11}$/,
  }
  if (!patterns[feature]?.test(resource)) throw new BillingError('INVALID_RESOURCE', 'Choose a valid test or lesson.', 400)
}
export async function accessStatus(userId: string, feature: AccessFeature, resource: string) {
  validateResource(feature, resource)
  const { access } = await accountOverview(userId)
  const limit = access.kind === 'UNLIMITED' ? null : PLAN_QUOTAS[access.tier][feature]
  const period = usagePeriod()
  const [row, unlock] = limit === null ? [null, null] : await Promise.all([
    prisma.featureUsage.findUnique({ where: { userId_feature_period: { userId, feature, period } } }),
    prisma.resourceUnlock.findUnique({ where: { userId_resource_period: { userId, resource, period } } }),
  ])
  const used = row?.count ?? 0
  const opened = limit === null || Boolean(unlock)
  return { unlocked: opened, expiresAt: access.expiresAt, tier: access.tier, used, limit, remaining: limit === null ? null : Math.max(0, limit - used) }
}
/** Opening the same test or lesson again in the same month does not spend another start. */
export async function unlockResource(userId: string, feature: AccessFeature, resource: string) {
  validateResource(feature, resource)
  const period = usagePeriod()
  const existing = await prisma.resourceUnlock.findUnique({ where: { userId_resource_period: { userId, resource, period } } })
  if (existing) return { unlocked: true }
  const { limit } = await consumeQuota(userId, feature)
  if (limit !== null) await prisma.resourceUnlock.upsert({ where: { userId_resource_period: { userId, resource, period } }, create: { userId, resource, period }, update: {} })
  return { unlocked: true }
}
export async function withStudyAccess<T>(userId: string, feature: AccessFeature, operation: () => Promise<T>) {
  await consumeQuota(userId, feature)
  try {
    return await operation()
  } catch (error) {
    await refundQuota(userId, feature).catch(() => undefined)
    throw error
  }
}
export async function fulfillPayment(tx: Tx, order: PaymentRequest, source: string) {
  await lockBilling(tx, order.userId)
  if (order.audience === 'TOPUP') throw new BillingError('RETIRED_PRODUCT', 'This old order cannot activate a subscription. Contact support.', 409)
  const claimed = await tx.paymentRequest.updateMany({ where: { id: order.id, status: { in: ['PENDING', 'SUBMITTED', 'PROCESSING'] } },
    data: { status: 'APPROVED', reviewedAt: new Date(), performedAt: new Date(), reviewedBy: source } })
  if (!claimed.count) return false
  if (order.wheelSpinId) await tx.wheelSpin.updateMany({ where: { id: order.wheelSpinId, usedAt: null }, data: { usedAt: new Date() } })
  if (!order.audience || !order.months) return true
  const current = await tx.billingSubscription.findUnique({ where: { userId_audience: { userId: order.userId, audience: order.audience } } })
  const expiresAt = extendBillingExpiry(order.months, current?.expiresAt)
  await tx.billingSubscription.upsert({ where: { userId_audience: { userId: order.userId, audience: order.audience } },
    create: { userId: order.userId, audience: order.audience, plan: order.plan, expiresAt }, update: { plan: order.plan, expiresAt } })
  return true
}
