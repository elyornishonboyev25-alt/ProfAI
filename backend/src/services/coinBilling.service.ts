import { randomUUID } from 'node:crypto'
import { Prisma, type PaymentRequest } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { COIN_COSTS, WELCOME_COINS, PRACTICE_ACCESS_DAYS, extendBillingExpiry, resourceCoinCost, type CoinFeature } from '../utils/billingCatalog.js'
import { describeAccess, hasSelectedFullAccess } from '../utils/accessEntitlement.js'
import { isPremiumUser } from '../utils/premium.js'

type Tx = Prisma.TransactionClient
export class BillingError extends Error {
  constructor(public code: string, message: string, public statusCode = 402) { super(message) }
}
export async function lockWallet(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended(${`billing:${userId}`}, 0))`
  const existing = await tx.coinWallet.findUnique({ where: { userId } })
  if (existing) return existing
  const wallet = await tx.coinWallet.create({ data: { userId, balance: WELCOME_COINS } })
  await tx.coinEntry.create({ data: { userId, key: `welcome:${userId}`, amount: WELCOME_COINS, reason: 'WELCOME' } })
  return wallet
}
export async function walletOverview(userId: string) {
  return prisma.$transaction(async tx => {
    const wallet = await lockWallet(tx, userId)
    const [subscriptions, entries, member, user, legacy] = await Promise.all([
      tx.billingSubscription.findMany({ where: { userId, expiresAt: { gt: new Date() } } }),
      tx.coinEntry.findMany({ where: { userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 30 }),
      tx.learningCenterMember.findFirst({ where: { userId, role: 'STUDENT', status: 'ACTIVE' }, select: { id: true } }),
      tx.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, email: true, nickname: true } }),
      tx.premiumGrant.findUnique({ where: { userId } }),
    ])
    const access = describeAccess(legacy, isPremiumUser(user))
    return { balance: wallet.balance, subscriptions, entries, centerEligible: Boolean(member), access,
      canCreateClass: user.role === 'ADMIN' || hasSelectedFullAccess(legacy) || subscriptions.some(s => s.audience === 'TEACHER'),
      legacyAccess: access.active }
  })
}
async function fullAccessStatus(tx: Tx, userId: string) {
  const [user, grant] = await Promise.all([
    tx.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true, email: true, nickname: true } }),
    tx.premiumGrant.findUnique({ where: { userId } }),
  ])
  return describeAccess(grant, isPremiumUser(user))
}
export async function requireTeacherPlan(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { role: true } })
  if (user.role === 'ADMIN') return
  const grant = await prisma.premiumGrant.findUnique({ where: { userId } })
  if (hasSelectedFullAccess(grant)) return
  const subscription = await prisma.billingSubscription.findUnique({ where: { userId_audience: { userId, audience: 'TEACHER' } } })
  if (!subscription || subscription.expiresAt <= new Date()) {
    throw new BillingError('TEACHER_PLAN_REQUIRED', 'Class creation requires an active Teacher plan ($8/month).', 403)
  }
}
export function validateResource(feature: CoinFeature, resource: string) {
  const patterns: Partial<Record<CoinFeature, RegExp>> = {
    test: /^test:(?:reading|listening|sat|database):[A-Za-z0-9_:-]{1,120}$/,
    mock: /^mock:(?:ielts|sat):[A-Za-z0-9_-]{1,100}$/,
    shadowing: /^shadowing:[A-Za-z0-9_-]{11}$/, podcast: /^podcast:[A-Za-z0-9_-]{11}$/,
  }
  if (!patterns[feature]?.test(resource)) throw new BillingError('INVALID_RESOURCE', 'Choose a valid test or lesson.', 400)
}
export async function accessStatus(userId: string, feature: CoinFeature, resource: string) {
  validateResource(feature, resource)
  return prisma.$transaction(async tx => {
    const wallet = await lockWallet(tx, userId)
    const [access, legacy] = await Promise.all([
      tx.coinAccess.findUnique({ where: { userId_resource: { userId, resource } } }), fullAccessStatus(tx, userId),
    ])
    return { unlocked: legacy.active || Boolean(access && (!access.expiresAt || access.expiresAt > new Date())),
      balance: wallet.balance, cost: resourceCoinCost(feature, resource), expiresAt: legacy.active ? legacy.expiresAt : access?.expiresAt ?? null }
  })
}
export async function unlockResource(userId: string, feature: CoinFeature, resource: string) {
  validateResource(feature, resource)
  return prisma.$transaction(async tx => {
    const wallet = await lockWallet(tx, userId)
    const access = await tx.coinAccess.findUnique({ where: { userId_resource: { userId, resource } } })
    if ((await fullAccessStatus(tx, userId)).active || (access && (!access.expiresAt || access.expiresAt > new Date()))) return { balance: wallet.balance, charged: 0 }
    const cost = resourceCoinCost(feature, resource)
    if (wallet.balance < cost) throw new BillingError('INSUFFICIENT_COINS', 'Your balance is too low. Add coins or continue with free activities.')
    const updated = await tx.coinWallet.update({ where: { userId }, data: { balance: { decrement: cost } } })
    await tx.coinEntry.create({ data: { userId, key: `unlock:${randomUUID()}`, amount: -cost, reason: resource } })
    const data = { feature, expiresAt: feature === 'podcast' || feature === 'shadowing' ? null : new Date(Date.now() + PRACTICE_ACCESS_DAYS * 86400000),
      writingLeft: feature === 'mock' ? 2 : 0, speakingLeft: feature === 'mock' ? 1 : 0 }
    await tx.coinAccess.upsert({ where: { userId_resource: { userId, resource } }, create: { userId, resource, ...data }, update: data })
    return { balance: updated.balance, charged: cost }
  })
}
// Reserve before calling a paid provider; restore on any failure. No database
// transaction is held open during network/AI work.
export async function withCoinCharge<T>(userId: string, feature: CoinFeature, operation: () => Promise<T>) {
  const key = `usage:${randomUUID()}`
  const reservation = await prisma.$transaction(async tx => {
    const wallet = await lockWallet(tx, userId)
    if ((await fullAccessStatus(tx, userId)).active) return { charged: 0, allowanceId: null as string | null }
    if (feature === 'writing' || feature === 'speaking') {
      const field = feature === 'writing' ? 'writingLeft' : 'speakingLeft'
      const allowance = await tx.coinAccess.findFirst({ where: { userId, feature: 'mock', expiresAt: { gt: new Date() }, [field]: { gt: 0 } }, orderBy: { createdAt: 'asc' } })
      if (allowance) {
        await tx.coinAccess.update({ where: { id: allowance.id }, data: { [field]: { decrement: 1 } } })
        return { charged: 0, allowanceId: allowance.id }
      }
    }
    const cost = COIN_COSTS[feature]
    if (wallet.balance < cost) throw new BillingError('INSUFFICIENT_COINS', `This action needs ${cost} coins. Add coins to continue.`)
    await tx.coinWallet.update({ where: { userId }, data: { balance: { decrement: cost } } })
    await tx.coinEntry.create({ data: { userId, key, amount: -cost, reason: feature } })
    return { charged: cost, allowanceId: null as string | null }
  })
  try { return await operation() }
  catch (error) {
    await prisma.$transaction(async tx => {
      await lockWallet(tx, userId)
      if (reservation.charged) {
        await tx.coinWallet.update({ where: { userId }, data: { balance: { increment: reservation.charged } } })
        await tx.coinEntry.create({ data: { userId, key: `refund:${key}`, amount: reservation.charged, reason: `REFUND:${feature}` } })
      }
      if (reservation.allowanceId) await tx.coinAccess.updateMany({ where: { id: reservation.allowanceId },
        data: { [feature === 'writing' ? 'writingLeft' : 'speakingLeft']: { increment: 1 } } })
    })
    throw error
  }
}
export async function fulfillPayment(tx: Tx, order: PaymentRequest, source: string) {
  await lockWallet(tx, order.userId)
  const claimed = await tx.paymentRequest.updateMany({ where: { id: order.id, status: { in: ['PENDING', 'SUBMITTED', 'PROCESSING'] } },
    data: { status: 'APPROVED', reviewedAt: new Date(), performedAt: new Date(), reviewedBy: source } })
  if (!claimed.count) return false
  if (!order.audience) return true // Legacy orders are handled by the billing route.
  await tx.coinWallet.update({ where: { userId: order.userId }, data: { balance: { increment: order.coins } } })
  await tx.coinEntry.create({ data: { userId: order.userId, key: `payment:${order.id}`, amount: order.coins, reason: order.plan } })
  if (order.months && order.audience !== 'TOPUP') {
    const current = await tx.billingSubscription.findUnique({ where: { userId_audience: { userId: order.userId, audience: order.audience } } })
    const expiresAt = extendBillingExpiry(order.months, current?.expiresAt)
    await tx.billingSubscription.upsert({ where: { userId_audience: { userId: order.userId, audience: order.audience } },
      create: { userId: order.userId, audience: order.audience, plan: order.plan, expiresAt }, update: { plan: order.plan, expiresAt } })
  }
  return true
}
