import crypto from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { lockBilling } from './billing.service.js'

const DAY_MS = 86_400_000
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CLAIM_WINDOW_DAYS = 7

export const INVITEE_BONUS_DAYS = 3
// Each tier is paid once, when the inviter reaches `count` qualified friends.
export const REFERRAL_TIERS = [
  { count: 1, days: 3 },
  { count: 3, days: 14 },
  { count: 5, days: 30 },
  { count: 10, days: 90 },
  { count: 25, days: 365 },
] as const

function randomCode() {
  const bytes = crypto.randomBytes(8)
  return Array.from(bytes, byte => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('')
}

export function normalizeReferralCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export async function ensureReferralCode(userId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } })
  if (!existing) return null
  if (existing.referralCode) return existing.referralCode
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode()
    try {
      const updated = await prisma.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } })
      if (updated.count) return code
      return (await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }))?.referralCode ?? null
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'P2002')) throw error
    }
  }
  return null
}

/** Adds free access days on top of whatever the account already has (trial, paid or earlier rewards). */
export async function grantAccessDays(tx: Prisma.TransactionClient, userId: string, days: number, now = new Date()) {
  await lockBilling(tx, userId)
  const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!user) return null
  const [subscription, trial] = await Promise.all([
    tx.billingSubscription.findUnique({ where: { userId_audience: { userId, audience: 'STUDENT' } } }),
    tx.freeTrial.findUnique({ where: { email: user.email } }),
  ])
  const base = Math.max(now.getTime(), subscription?.expiresAt.getTime() ?? 0, trial?.expiresAt.getTime() ?? 0)
  const expiresAt = new Date(base + days * DAY_MS)
  await tx.billingSubscription.upsert({
    where: { userId_audience: { userId, audience: 'STUDENT' } },
    create: { userId, audience: 'STUDENT', plan: 'REFERRAL', expiresAt },
    update: { expiresAt },
  })
  return expiresAt
}

export type ClaimResult =
  | { ok: true; bonusDays: number }
  | { ok: false; code: 'INVALID_CODE' | 'SELF_REFERRAL' | 'ALREADY_CLAIMED' | 'TOO_LATE' }

export async function claimReferral(inviteeId: string, rawCode: string): Promise<ClaimResult> {
  const code = normalizeReferralCode(rawCode)
  if (code.length < 6) return { ok: false, code: 'INVALID_CODE' }
  const [inviter, invitee] = await Promise.all([
    prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: inviteeId }, select: { id: true, createdAt: true, referralReceived: { select: { id: true } } } }),
  ])
  if (!inviter || !invitee) return { ok: false, code: 'INVALID_CODE' }
  if (inviter.id === invitee.id) return { ok: false, code: 'SELF_REFERRAL' }
  if (invitee.referralReceived) return { ok: false, code: 'ALREADY_CLAIMED' }
  if (Date.now() - invitee.createdAt.getTime() > CLAIM_WINDOW_DAYS * DAY_MS) return { ok: false, code: 'TOO_LATE' }
  // A reward chain loop (A invited B, B invites A) is not a real invitation.
  const reverse = await prisma.referral.findFirst({ where: { inviterId: invitee.id, inviteeId: inviter.id }, select: { id: true } })
  if (reverse) return { ok: false, code: 'INVALID_CODE' }
  try {
    await prisma.$transaction(async tx => {
      await tx.referral.create({ data: { inviterId: inviter.id, inviteeId: invitee.id } })
      await tx.referralReward.create({ data: { userId: invitee.id, kind: 'INVITEE', tier: 0, days: INVITEE_BONUS_DAYS } })
      await grantAccessDays(tx, invitee.id, INVITEE_BONUS_DAYS)
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return { ok: false, code: 'ALREADY_CLAIMED' }
    throw error
  }
  return { ok: true, bonusDays: INVITEE_BONUS_DAYS }
}

export type TierPayout = { inviterId: string; days: number; count: number }

/**
 * A friend counts once they finished at least one test or speaking session.
 * Safe to call often: qualification and each reward tier are written once.
 */
export async function settleReferrals(inviterId?: string): Promise<TierPayout[]> {
  const pending = await prisma.referral.findMany({
    where: { qualifiedAt: null, ...(inviterId ? { inviterId } : {}) },
    select: { id: true, inviterId: true, inviteeId: true },
    take: 500,
  })
  const touched = new Set<string>()
  for (const referral of pending) {
    const [attempt, speaking] = await Promise.all([
      prisma.testAttempt.findFirst({ where: { userId: referral.inviteeId }, select: { id: true } }),
      prisma.speakingSession.findFirst({ where: { userId: referral.inviteeId }, select: { id: true } }),
    ])
    if (!attempt && !speaking) continue
    const done = await prisma.referral.updateMany({ where: { id: referral.id, qualifiedAt: null }, data: { qualifiedAt: new Date() } })
    if (done.count) touched.add(referral.inviterId)
  }
  const payouts: TierPayout[] = []
  const inviters = inviterId ? [inviterId] : [...touched]
  for (const id of inviters) payouts.push(...await payTiers(id))
  return payouts
}

async function payTiers(inviterId: string): Promise<TierPayout[]> {
  const count = await prisma.referral.count({ where: { inviterId, qualifiedAt: { not: null } } })
  const payouts: TierPayout[] = []
  for (const tier of REFERRAL_TIERS) {
    if (count < tier.count) break
    try {
      await prisma.$transaction(async tx => {
        await tx.referralReward.create({ data: { userId: inviterId, kind: 'INVITER', tier: tier.count, days: tier.days } })
        await grantAccessDays(tx, inviterId, tier.days)
      })
      payouts.push({ inviterId, days: tier.days, count: tier.count })
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'P2002')) throw error
    }
  }
  return payouts
}

export async function referralSummary(userId: string) {
  const [code, referrals] = await Promise.all([
    ensureReferralCode(userId),
    prisma.referral.findMany({ where: { inviterId: userId }, select: { qualifiedAt: true } }),
  ])
  const qualified = referrals.filter(item => item.qualifiedAt).length
  const next = REFERRAL_TIERS.find(tier => tier.count > qualified) ?? null
  const earnedDays = (await prisma.referralReward.aggregate({ where: { userId, kind: 'INVITER' }, _sum: { days: true } }))._sum.days ?? 0
  return {
    code,
    invited: referrals.length,
    qualified,
    pending: referrals.length - qualified,
    earnedDays,
    inviteeBonusDays: INVITEE_BONUS_DAYS,
    next: next ? { count: next.count, days: next.days, remaining: next.count - qualified } : null,
    tiers: REFERRAL_TIERS.map(tier => ({ ...tier, reached: qualified >= tier.count })),
  }
}
