import { Prisma, type PaymentRequest } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { extendBillingExpiry, type AccessFeature } from '../utils/billingCatalog.js'
import { describeAccess, resolveAccountAccess } from '../utils/accessEntitlement.js'
import { isPremiumUser } from '../utils/premium.js'
type Tx = Prisma.TransactionClient
export class BillingError extends Error {
  constructor(public code: string, message: string, public statusCode = 402) { super(message) }
}
export async function lockBilling(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`billing:${userId}`}, 0))`
}
export async function accountOverview(userId: string, tx: Tx = prisma, now = new Date()) {
  const [user, grant, subscriptions] = await Promise.all([
    tx.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, email: true, nickname: true } }),
    tx.premiumGrant.findUnique({ where: { userId } }),
    tx.billingSubscription.findMany({ where: { userId, startsAt: { lte: now }, expiresAt: { gt: now } } }),
  ])
  const trial = await tx.freeTrial.findUnique({ where: { email: user.email.trim().toLowerCase() } })
  const access = resolveAccountAccess(grant, isPremiumUser(user), subscriptions, trial, now)
  const legacy = describeAccess(grant, isPremiumUser(user), now)
  const paidLegacy = legacy.active && legacy.kind !== 'TRIAL'
  return { access, subscriptions, canJoinClass: paidLegacy || subscriptions.length > 0,
    canCreateClass: paidLegacy || subscriptions.some(s => s.audience === 'TEACHER') }
}
export async function requireStudyAccess(userId: string) {
  if (!(await accountOverview(userId)).access.active) throw new BillingError('PREMIUM_REQUIRED', 'Your free trial has ended. Choose Student ($3/month) or Teacher ($5/month) to continue.')
}
export async function requireClassPlan(userId: string) {
  if (!(await accountOverview(userId)).canJoinClass) throw new BillingError('CLASS_PLAN_REQUIRED', 'Joining classes requires an active Student ($3/month) or Teacher ($5/month) plan.', 403)
}
export async function requireTeacherPlan(userId: string) {
  if (!(await accountOverview(userId)).canCreateClass) throw new BillingError('TEACHER_PLAN_REQUIRED', 'Class creation requires an active Teacher plan ($5/month).', 403)
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
  return { unlocked: access.active, expiresAt: access.expiresAt }
}
export async function unlockResource(userId: string, feature: AccessFeature, resource: string) {
  validateResource(feature, resource)
  await requireStudyAccess(userId)
  return { unlocked: true }
}
export async function withStudyAccess<T>(userId: string, _feature: AccessFeature, operation: () => Promise<T>) {
  await requireStudyAccess(userId)
  return operation()
}
export async function fulfillPayment(tx: Tx, order: PaymentRequest, source: string) {
  await lockBilling(tx, order.userId)
  if (order.audience === 'TOPUP') throw new BillingError('RETIRED_PRODUCT', 'This old order cannot activate a subscription. Contact support.', 409)
  const claimed = await tx.paymentRequest.updateMany({ where: { id: order.id, status: { in: ['PENDING', 'SUBMITTED', 'PROCESSING'] } },
    data: { status: 'APPROVED', reviewedAt: new Date(), performedAt: new Date(), reviewedBy: source } })
  if (!claimed.count) return false
  if (!order.audience || !order.months) return true
  const current = await tx.billingSubscription.findUnique({ where: { userId_audience: { userId: order.userId, audience: order.audience } } })
  const expiresAt = extendBillingExpiry(order.months, current?.expiresAt)
  await tx.billingSubscription.upsert({ where: { userId_audience: { userId: order.userId, audience: order.audience } },
    create: { userId: order.userId, audience: order.audience, plan: order.plan, expiresAt }, update: { plan: order.plan, expiresAt } })
  return true
}
