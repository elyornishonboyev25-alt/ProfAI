import { TIER_RANK, tierOfAudience, type PlanTier } from './billingCatalog.js'

export type AccessEntitlement = {
  // TRIAL is no longer issued; it stays in the type for clients that still check it.
  kind: 'FREE' | 'UNLIMITED' | 'TRIAL' | 'PREMIUM'
  tier: PlanTier
  active: boolean
  startsAt: string | null
  expiresAt: string | null
  trialDays: number | null
  daysRemaining: number | null
}
export type AccessGrant = { plan: string; source: string; startsAt: Date; expiresAt: Date | null }

const FREE_ACCESS: AccessEntitlement = { kind: 'FREE', tier: 'FREE', active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }

export function describeAccess(grant: AccessGrant | null, permanent = false, now = new Date()): AccessEntitlement {
  // An owner-selected trial grant overrides the fixed premium allowlist.
  if (permanent && !(grant?.source === 'SELECTED_ACCESS' && grant.plan.startsWith('TRIAL_'))) return { kind: 'UNLIMITED', tier: 'MAX', active: true, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
  // Welcome trials were retired in favour of the permanent Free plan.
  if (!grant || grant.plan.startsWith('TRIAL_')) return FREE_ACCESS
  const active = grant.startsAt <= now && (!grant.expiresAt || grant.expiresAt > now)
  if (!active) return FREE_ACCESS
  const tier: PlanTier = grant.plan === 'UNLIMITED' || grant.plan.startsWith('MAX') ? 'MAX' : 'PRO'
  return { kind: grant.expiresAt === null ? 'UNLIMITED' : 'PREMIUM', tier, active,
    startsAt: grant.startsAt.toISOString(), expiresAt: grant.expiresAt?.toISOString() ?? null, trialDays: null, daysRemaining: null }
}

export function resolveAccountAccess(grant: AccessGrant | null, permanent: boolean,
  subscriptions: Array<{ audience: string; startsAt: Date; expiresAt: Date }>, now = new Date()): AccessEntitlement {
  const legacy = describeAccess(grant, permanent, now)
  const subscription = subscriptions
    .filter(s => s.startsAt <= now && s.expiresAt > now)
    .sort((a, b) => TIER_RANK[tierOfAudience(b.audience)] - TIER_RANK[tierOfAudience(a.audience)] || b.expiresAt.getTime() - a.expiresAt.getTime())[0]
  if (!subscription) return legacy
  const tier = tierOfAudience(subscription.audience)
  if (legacy.active && TIER_RANK[legacy.tier] >= TIER_RANK[tier]) return legacy
  return { kind: 'PREMIUM', tier, active: true, startsAt: subscription.startsAt.toISOString(), expiresAt: subscription.expiresAt.toISOString(),
    trialDays: null, daysRemaining: Math.max(0, Math.ceil((subscription.expiresAt.getTime() - now.getTime()) / 86_400_000)) }
}
