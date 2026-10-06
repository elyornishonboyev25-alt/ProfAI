export const FREE_TRIAL_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000
export type AccessEntitlement = {
  kind: 'COINS' | 'UNLIMITED' | 'TRIAL' | 'PREMIUM'
  active: boolean
  startsAt: string | null
  expiresAt: string | null
  trialDays: number | null
  daysRemaining: number | null
}
export type AccessGrant = { plan: string; source: string; startsAt: Date; expiresAt: Date | null }
export function describeAccess(grant: AccessGrant | null, permanent = false, now = new Date()): AccessEntitlement {
  if (permanent && !(grant?.source === 'SELECTED_ACCESS' && grant.plan === 'TRIAL_14')) return { kind: 'UNLIMITED', active: true, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
  if (!grant) return { kind: 'COINS', active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
  const trial = grant.plan === 'TRIAL_14'
  const active = grant.startsAt <= now && (!grant.expiresAt || grant.expiresAt > now)
  return { kind: trial ? 'TRIAL' : grant.expiresAt === null ? 'UNLIMITED' : 'PREMIUM', active,
    startsAt: grant.startsAt.toISOString(), expiresAt: grant.expiresAt?.toISOString() ?? null,
    trialDays: trial ? FREE_TRIAL_DAYS : null,
    daysRemaining: trial ? Math.max(0, Math.ceil(((grant.expiresAt?.getTime() ?? now.getTime()) - now.getTime()) / DAY_MS)) : null }
}
export function hasSelectedFullAccess(grant: AccessGrant | null, now = new Date()) {
  return Boolean(grant?.source === 'SELECTED_ACCESS' && ['UNLIMITED', 'TRIAL_14'].includes(grant.plan) && describeAccess(grant, false, now).active)
}
