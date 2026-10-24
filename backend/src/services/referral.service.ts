import crypto from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { lockBilling } from './billing.service.js'

const DAY_MS = 86_400_000
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CLAIM_WINDOW_DAYS = 7

export const INVITEE_BONUS_DAYS = 3
// Each friend who starts the Telegram bot and joins the channel adds FRIEND_DAYS.
export const FRIEND_DAYS = 3
// Milestone bonuses are paid once, on top of the per-friend days.
export const REFERRAL_TIERS = [
  { count: 5, days: 14 },
  { count: 10, days: 30 },
  { count: 25, days: 90 },
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

export type TierPayout = { inviterId: string; days: number; count: number; kind: 'FRIEND' | 'MILESTONE' }

/**
 * Called once the invited friend has started the bot and is a channel member.
 * Pays the inviter for this friend (once) and any milestone the friend completes.
 */
export async function qualifyInvitee(inviteeId: string): Promise<TierPayout[]> {
  const referral = await prisma.referral.findUnique({ where: { inviteeId }, select: { id: true, inviterId: true, qualifiedAt: true } })
  if (!referral || referral.qualifiedAt) return []
  const inviterId = referral.inviterId
  const friend = await prisma.$transaction(async tx => {
    await lockBilling(tx, inviterId)
    const done = await tx.referral.updateMany({ where: { id: referral.id, qualifiedAt: null }, data: { qualifiedAt: new Date() } })
    if (!done.count) return null
    const count = await tx.referral.count({ where: { inviterId, qualifiedAt: { not: null } } })
    await tx.referralReward.create({ data: { userId: inviterId, kind: 'FRIEND', tier: count, days: FRIEND_DAYS } })
    await grantAccessDays(tx, inviterId, FRIEND_DAYS)
    return { inviterId, days: FRIEND_DAYS, count, kind: 'FRIEND' as const }
  })
  if (!friend) return []
  return [friend, ...await payMilestones(inviterId)]
}

/** Pays any milestone an inviter has reached but not yet received. Safe to call often. */
export async function settleReferrals(inviterId?: string): Promise<TierPayout[]> {
  return inviterId ? payMilestones(inviterId) : []
}

async function payMilestones(inviterId: string): Promise<TierPayout[]> {
  const count = await prisma.referral.count({ where: { inviterId, qualifiedAt: { not: null } } })
  const payouts: TierPayout[] = []
  for (const tier of REFERRAL_TIERS) {
    if (count < tier.count) break
    try {
      await prisma.$transaction(async tx => {
        await tx.referralReward.create({ data: { userId: inviterId, kind: 'MILESTONE', tier: tier.count, days: tier.days } })
        await grantAccessDays(tx, inviterId, tier.days)
      })
      payouts.push({ inviterId, days: tier.days, count: tier.count, kind: 'MILESTONE' })
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'P2002')) throw error
    }
  }
  return payouts
}

export async function referralSummary(userId: string) {
  const [code, referrals, earned] = await Promise.all([
    ensureReferralCode(userId),
    prisma.referral.findMany({ where: { inviterId: userId }, select: { qualifiedAt: true } }),
    prisma.referralReward.aggregate({ where: { userId, kind: { in: ['FRIEND', 'MILESTONE', 'INVITER'] } }, _sum: { days: true } }),
  ])
  const qualified = referrals.filter(item => item.qualifiedAt).length
  const next = REFERRAL_TIERS.find(tier => tier.count > qualified) ?? null
  return {
    code,
    invited: referrals.length,
    qualified,
    pending: referrals.length - qualified,
    earnedDays: earned._sum.days ?? 0,
    friendDays: FRIEND_DAYS,
    inviteeBonusDays: INVITEE_BONUS_DAYS,
    next: next ? { count: next.count, days: next.days, remaining: next.count - qualified } : null,
    tiers: REFERRAL_TIERS.map(tier => ({ ...tier, reached: qualified >= tier.count })),
  }
}
