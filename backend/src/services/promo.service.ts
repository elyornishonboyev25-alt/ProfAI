import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { claimReferral, grantAccessDays, normalizeReferralCode } from './referral.service.js'
import { CAMPAIGN_PROMO_CODE, redeemCampaignPromo, type CampaignRedeemResult } from './campaignPromo.service.js'

const PROMO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PROMO_PREFIX = 'IVY'

export function normalizePromoCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function randomPromo() {
  const bytes = crypto.randomBytes(6)
  return `${PROMO_PREFIX}${Array.from(bytes, byte => PROMO_ALPHABET[byte % PROMO_ALPHABET.length]).join('')}`
}

/** One promo code per account; asking again returns the same code. */
export async function issuePromoCode(userId: string) {
  const existing = await prisma.promoCode.findUnique({ where: { userId } })
  if (existing) return existing
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.promoCode.create({ data: { code: randomPromo(), userId, days: env.TELEGRAM_PROMO_DAYS } })
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'P2002')) throw error
      const raced = await prisma.promoCode.findUnique({ where: { userId } })
      if (raced) return raced
    }
  }
  throw new Error('Could not allocate a promo code.')
}

export type RedeemResult =
  | CampaignRedeemResult
  | { ok: true; kind: 'PROMO' | 'REFERRAL'; days: number }
  | { ok: false; code: 'INVALID_CODE' | 'ALREADY_USED' | 'SELF_REFERRAL' | 'ALREADY_CLAIMED' | 'TOO_LATE' }

/**
 * The single code box accepts campaign promos, Telegram rewards and invitations.
 */
export async function redeemCode(userId: string, rawCode: string): Promise<RedeemResult> {
  const normalized = normalizePromoCode(rawCode)
  if (normalized.length < 4) return { ok: false, code: 'INVALID_CODE' }
  if (normalized === CAMPAIGN_PROMO_CODE) return redeemCampaignPromo(userId)

  const promo = await prisma.promoCode.findUnique({ where: { code: normalized } })
  if (promo) {
    if (promo.userId !== userId) return { ok: false, code: 'INVALID_CODE' }
    if (promo.redeemedAt) return { ok: false, code: 'ALREADY_USED' }
    const redeemed = await prisma.$transaction(async tx => {
      const claimed = await tx.promoCode.updateMany({ where: { code: promo.code, redeemedAt: null }, data: { redeemedAt: new Date() } })
      if (!claimed.count) return false
      await grantAccessDays(tx, userId, promo.days)
      return true
    })
    return redeemed ? { ok: true, kind: 'PROMO', days: promo.days } : { ok: false, code: 'ALREADY_USED' }
  }

  const referral = await claimReferral(userId, normalizeReferralCode(rawCode))
  if (referral.ok) return { ok: true, kind: 'REFERRAL', days: referral.bonusDays }
  return { ok: false, code: referral.code === 'INVALID_CODE' ? 'INVALID_CODE' : referral.code }
}
