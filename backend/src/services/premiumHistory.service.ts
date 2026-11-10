import type { Prisma, PremiumEvent } from '@prisma/client'
import { resolveAccountAccess } from '../utils/accessEntitlement.js'
import { isPremiumUser } from '../utils/premium.js'

export const ownerPremiumSelect = {
  id: true, fullName: true, email: true, nickname: true, role: true, createdAt: true,
  billingSubscriptions: { select: { audience: true, plan: true, startsAt: true, expiresAt: true } },
  premiumGrant: true,
  premiumEvents: { orderBy: { createdAt: 'desc' } },
  launchGift: true,
  promoCode: true,
  campaignRedemptions: true,
  referralRewards: true,
  referralReceived: { select: { inviter: { select: { referralCode: true } } } },
  paymentRequests: { where: { status: 'APPROVED' }, select: {
    id: true, plan: true, months: true, reviewedAt: true, performedAt: true, createdAt: true,
    reviewedBy: true, reference: true, discountPercent: true, promoDiscountMinor: true, wheelSpinId: true, method: true, currency: true, amountMinor: true, amountUzs: true,
  } },
} satisfies Prisma.UserSelect

type OwnerUser = Prisma.UserGetPayload<{ select: typeof ownerPremiumSelect }>
type Actor = { id: string; fullName: string; email: string }
type HistoryEvent = Omit<PremiumEvent, 'userId' | 'startsAt'> & { startsAt: Date | null; expiryKnown: boolean; historical: boolean }

export function ownerPremiumSummary(user: OwnerUser, actors: Map<string, Actor>, now = new Date()) {
  const events: HistoryEvent[] = (user.premiumEvents ?? []).map(event => ({ ...event, expiryKnown: true, historical: false }))
  const keys = new Set(events.map(event => event.originKey))
  function legacy(originKey: string, data: Partial<HistoryEvent> & Pick<HistoryEvent, 'source' | 'plan' | 'createdAt'>) {
    if (keys.has(originKey)) return
    const actor = data.actorId ? actors.get(data.actorId) : null
    events.push({ id: originKey, originKey, months: null, days: null, startsAt: null, expiresAt: null,
      actorId: null, actorName: actor?.fullName ?? null, actorEmail: actor?.email ?? null, promoCode: null,
      giftRank: null, discountPercent: null, promoDiscountMinor: null, wheelSpinId: null, currency: null, amountMinor: null, method: null, revokedAt: null,
      expiryKnown: false, historical: true, ...data })
  }
  const gift = user.launchGift
  if (gift?.claimedAt) legacy(`launch:${user.id}`, { source: 'LAUNCH_GIFT', plan: 'PRO_1', months: 1,
    giftRank: gift.rank, createdAt: gift.claimedAt, expiresAt: gift.expiresAt, expiryKnown: Boolean(gift.expiresAt) })
  if (user.promoCode?.redeemedAt) legacy(`promo:${user.promoCode.code}`, { source: 'PROMO', plan: 'PRO',
    days: user.promoCode.days, promoCode: user.promoCode.code, createdAt: user.promoCode.redeemedAt })
  for (const reward of user.campaignRedemptions ?? []) legacy(`campaign:${user.id}:${reward.code}`, {
    source: 'PROMO', plan: 'PRO', months: reward.months, promoCode: reward.code,
    createdAt: reward.createdAt, startsAt: reward.startsAt, expiresAt: reward.expiresAt, expiryKnown: true })
  for (const reward of user.referralRewards ?? []) legacy(`referral:${reward.id}`, { source: 'REFERRAL', plan: 'PRO',
    days: reward.days, promoCode: reward.kind === 'INVITEE' ? user.referralReceived?.inviter.referralCode ?? null : null,
    createdAt: reward.createdAt })
  for (const order of user.paymentRequests ?? []) legacy(`payment:${order.id}`, {
    source: order.method === 'PROMO' ? 'PROMO' : 'PAYMENT', plan: order.plan, months: order.months || null,
    actorId: actors.has(order.reviewedBy ?? '') ? order.reviewedBy : null,
    promoCode: order.reference?.startsWith('promo:') ? order.reference.slice(6) : null,
    discountPercent: order.discountPercent, promoDiscountMinor: order.promoDiscountMinor ?? null, wheelSpinId: order.wheelSpinId ?? null, method: order.method, currency: order.currency,
    amountMinor: order.currency === 'UZS' && !order.amountMinor ? order.amountUzs * 100 : order.amountMinor,
    createdAt: order.performedAt ?? order.reviewedAt ?? order.createdAt })
  const grant = user.premiumGrant ?? null
  if (grant && !grant.plan.startsWith('TRIAL_') && !events.some(event => event.plan === grant.plan && event.createdAt.getTime() === grant.startsAt.getTime())) {
    // The legacy row is overwritten on renewal; show only the facts it still contains.
    if (grant.source !== 'PAYMENT' || !(user.paymentRequests?.length)) legacy(`grant:${user.id}`, {
      source: grant.source === 'OWNER' ? 'OWNER' : grant.source === 'PAYMENT' ? 'PAYMENT' : 'LEGACY',
      plan: grant.plan, actorId: grant.grantedBy, createdAt: grant.startsAt,
      startsAt: grant.startsAt, expiresAt: grant.expiresAt, expiryKnown: true })
  }
  events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
  for (const event of events.filter(event => event.historical && !event.revokedAt)) {
    const revocation = events.filter(row => row.source === 'REVOKED' && row.createdAt >= event.createdAt)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
    if (revocation && (!event.expiresAt || event.expiresAt > revocation.createdAt)) event.revokedAt = revocation.createdAt
  }
  const subscriptions = user.billingSubscriptions ?? []
  const access = resolveAccountAccess(grant, isPremiumUser(user), subscriptions, now)
  const periods = [
    ...(grant && !grant.plan.startsWith('TRIAL_') ? [grant] : []), ...subscriptions,
  ]
  const scheduled = !access.active && periods.some(period => period.startsAt > now && (!period.expiresAt || period.expiresAt > period.startsAt))
  return {
    id: user.id, fullName: user.fullName, email: user.email, nickname: user.nickname, role: user.role, createdAt: user.createdAt,
    fixedPremium: isPremiumUser(user) && access.kind === 'UNLIMITED', access,
    premiumStatus: access.active ? 'ACTIVE' : scheduled ? 'SCHEDULED' : periods.some(period => period.expiresAt && period.expiresAt <= now) ? 'EXPIRED' : 'NONE',
    premiumPeriods: periods.map(period => ({ plan: period.plan, startsAt: period.startsAt, expiresAt: period.expiresAt })),
    premiumHistory: events,
    launchGift: gift && !gift.claimedAt ? { rank: gift.rank, claimedAt: null } : null,
  }
}

export async function recordPremiumEvent(tx: Prisma.TransactionClient, data: Prisma.PremiumEventUncheckedCreateInput) {
  // Snapshot the actor now, so later account edits or deletion cannot rewrite history.
  if (data.actorId) {
    const actor = await tx.user.findUnique({ where: { id: data.actorId }, select: { fullName: true, email: true } })
    data = { ...data, actorName: actor?.fullName ?? null, actorEmail: actor?.email ?? null }
  }
  return tx.premiumEvent.create({ data })
}
