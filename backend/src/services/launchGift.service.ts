import type { LaunchGift } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { extendBillingExpiry } from '../utils/billingCatalog.js'
import { accountOverview, lockBilling } from './billing.service.js'
import { ensureReferralCode } from './referral.service.js'

/** The first 1,000 accounts receive one month of Pro ($6), $6,000 in total. */
export const LAUNCH_GIFT_CAPACITY = 1000
export const LAUNCH_GIFT_MONTHS = 1
export const LAUNCH_GIFT_VALUE_USD = 6

export async function launchGiftStats() {
  const [reserved, top] = await Promise.all([
    prisma.launchGift.count(),
    prisma.launchGift.aggregate({ _max: { rank: true } }),
  ])
  // Accounts that existed before the launch are all included, even beyond the cap.
  const capacity = Math.max(LAUNCH_GIFT_CAPACITY, top._max.rank ?? 0)
  const issued = Math.max(reserved, top._max.rank ?? 0)
  return { capacity, issued, remaining: Math.max(0, LAUNCH_GIFT_CAPACITY - issued), valueUsd: LAUNCH_GIFT_VALUE_USD, months: LAUNCH_GIFT_MONTHS }
}

/** Reserves the next place for an account created after the launch, while places remain. */
async function reserve(userId: string) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended('launch-gift', 0))`
    const existing = await tx.launchGift.findUnique({ where: { userId } })
    if (existing) return existing
    const top = await tx.launchGift.aggregate({ _max: { rank: true } })
    const rank = (top._max.rank ?? 0) + 1
    if (rank > LAUNCH_GIFT_CAPACITY) return null
    return tx.launchGift.create({ data: { userId, rank } })
  })
}

/**
 * Numbers a new account at sign-up, so places follow registration order (the
 * accounts that existed at launch hold 1..N). Sign-up never fails because of it;
 * a missed reservation is retried when the gift is first shown.
 */
export async function reserveLaunchGiftAtSignup(userId: string) {
  await reserve(userId).catch(error => console.error('Launch gift reservation failed:', error))
}

async function describe(gift: LaunchGift | null, userId: string) {
  const stats = await launchGiftStats()
  if (!gift) return { eligible: false, ...stats, rank: null, claimedAt: null, expiresAt: null, extended: false, referralCode: null }
  const referralCode = await ensureReferralCode(userId).catch(() => null)
  return { eligible: true, ...stats, rank: gift.rank, claimedAt: gift.claimedAt?.toISOString() ?? null,
    expiresAt: gift.expiresAt?.toISOString() ?? null, extended: gift.extended, referralCode }
}

export async function launchGiftFor(userId: string) {
  const gift = await prisma.launchGift.findUnique({ where: { userId } }) ?? await reserve(userId)
  return describe(gift, userId)
}

/**
 * Adds one month of Pro after whatever paid access the account already has, so
 * an existing plan is extended rather than overlapped. Claiming twice is a no-op.
 */
export async function claimLaunchGift(userId: string) {
  const reserved = await prisma.launchGift.findUnique({ where: { userId } }) ?? await reserve(userId)
  if (!reserved) return describe(null, userId)
  const gift = await prisma.$transaction(async tx => {
    await lockBilling(tx, userId)
    const current = await tx.launchGift.findUniqueOrThrow({ where: { userId } })
    if (current.claimedAt) return current
    const now = new Date()
    const { access, subscriptions } = await accountOverview(userId, tx, now)
    // Owners and unlimited grants already have everything; record the gift without a new plan.
    if (access.kind === 'UNLIMITED') return tx.launchGift.update({ where: { userId }, data: { claimedAt: now, extended: true } })
    const paidUntil = new Date(Math.max(now.getTime(), ...subscriptions.map(s => s.expiresAt.getTime()),
      access.active && access.expiresAt ? Date.parse(access.expiresAt) : 0))
    const expiresAt = extendBillingExpiry(LAUNCH_GIFT_MONTHS, paidUntil, now)
    const pro = await tx.billingSubscription.findUnique({ where: { userId_audience: { userId, audience: 'PRO' } } })
    if (pro && pro.expiresAt > now) {
      await tx.billingSubscription.update({ where: { id: pro.id }, data: { expiresAt } })
    } else {
      await tx.billingSubscription.upsert({ where: { userId_audience: { userId, audience: 'PRO' } },
        create: { userId, audience: 'PRO', plan: 'PRO_1', startsAt: paidUntil, expiresAt },
        update: { plan: 'PRO_1', startsAt: paidUntil, expiresAt } })
    }
    return tx.launchGift.update({ where: { userId }, data: { claimedAt: now, expiresAt, extended: paidUntil > now } })
  })
  return describe(gift, userId)
}
