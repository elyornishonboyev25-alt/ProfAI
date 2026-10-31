import { prisma } from '../lib/prisma.js'
import { extendBillingExpiry } from '../utils/billingCatalog.js'
import { lockBilling } from './billing.service.js'
import { claimLaunchGift } from './launchGift.service.js'

export const CAMPAIGN_PROMO_CODE = 'FIRDAVSS7'
export const CAMPAIGN_PROMO_MONTHS = 3

export type CampaignRedeemResult =
  | { ok: true; kind: 'CAMPAIGN'; months: number; startsAt: string; expiresAt: string; deferred: boolean; afterLaunchGift: boolean }
  | { ok: false; code: 'ALREADY_USED' }

/** Save the reward once and append three calendar months after existing access. */
export async function redeemCampaignPromo(userId: string): Promise<CampaignRedeemResult> {
  // The launch dialog may still be loading when a new account enters the code.
  // Claim its reserved month first, so the two rewards always run in this order.
  await claimLaunchGift(userId)
  return prisma.$transaction(async tx => {
    await lockBilling(tx, userId)
    const where = { userId_code: { userId, code: CAMPAIGN_PROMO_CODE } }
    if (await tx.campaignRedemption.findUnique({ where })) return { ok: false, code: 'ALREADY_USED' }
    const now = new Date()
    const [subscriptions, grant, gift] = await Promise.all([
      tx.billingSubscription.findMany({ where: { userId, expiresAt: { gt: now } } }),
      tx.premiumGrant.findUnique({ where: { userId } }),
      tx.launchGift.findUnique({ where: { userId } }),
    ])
    const grantExpiry = grant && !grant.plan.startsWith('TRIAL_') ? grant.expiresAt?.getTime() ?? 0 : 0
    const startsAt = new Date(Math.max(now.getTime(), grantExpiry, ...subscriptions.map(item => item.expiresAt.getTime())))
    const expiresAt = extendBillingExpiry(CAMPAIGN_PROMO_MONTHS, startsAt, now)
    const currentPro = subscriptions.find(item => item.audience === 'PRO')
    await tx.billingSubscription.upsert({
      where: { userId_audience: { userId, audience: 'PRO' } },
      create: { userId, audience: 'PRO', plan: 'PRO_3', startsAt, expiresAt },
      update: currentPro ? { expiresAt } : { plan: 'PRO_3', startsAt, expiresAt },
    })
    await tx.campaignRedemption.create({ data: { userId, code: CAMPAIGN_PROMO_CODE, months: CAMPAIGN_PROMO_MONTHS, startsAt, expiresAt } })
    return { ok: true, kind: 'CAMPAIGN', months: CAMPAIGN_PROMO_MONTHS,
      startsAt: startsAt.toISOString(), expiresAt: expiresAt.toISOString(), deferred: startsAt > now,
      afterLaunchGift: Boolean(gift?.claimedAt && gift.expiresAt && gift.expiresAt > now && startsAt >= gift.expiresAt) }
  })
}
