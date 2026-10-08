export const FREE_TRIAL_DAYS = 7
const DAY_MS = 86400000
export type AccessEntitlement = {
  kind: 'FREE' | 'UNLIMITED' | 'TRIAL' | 'PREMIUM'
  active: boolean
  startsAt: string | null
  expiresAt: string | null
  trialDays: number | null
  daysRemaining: number | null
}
export type AccessGrant = { plan: string; source: string; startsAt: Date; expiresAt: Date | null }
export function describeAccess(grant: AccessGrant | null, permanent = false, now = new Date()): AccessEntitlement {
  if (permanent && !(grant?.source === 'SELECTED_ACCESS' && grant.plan.startsWith('TRIAL_'))) return { kind: 'UNLIMITED', active: true, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
  if (!grant) return { kind: 'FREE', active: false, startsAt: null, expiresAt: null, trialDays: null, daysRemaining: null }
  const trial = grant.plan.startsWith('TRIAL_')
  const active = grant.startsAt <= now && (!grant.expiresAt || grant.expiresAt > now)
  return { kind: trial ? 'TRIAL' : grant.expiresAt === null ? 'UNLIMITED' : 'PREMIUM', active,
    startsAt: grant.startsAt.toISOString(), expiresAt: grant.expiresAt?.toISOString() ?? null,
    trialDays: trial ? FREE_TRIAL_DAYS : null,
    daysRemaining: trial ? Math.max(0, Math.ceil(((grant.expiresAt?.getTime() ?? now.getTime()) - now.getTime()) / DAY_MS)) : null }
}
export function resolveAccountAccess(grant: AccessGrant | null, permanent: boolean,
  subscriptions: Array<{ startsAt: Date; expiresAt: Date }>, trial: { startsAt: Date; expiresAt: Date } | null, now = new Date()) {
  const legacy = describeAccess(grant, permanent, now)
  if (legacy.active && legacy.kind !== 'TRIAL') return legacy
  const subscription = subscriptions.filter(s => s.startsAt <= now && s.expiresAt > now).sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0]
  if (subscription) return describeAccess({ ...subscription, plan: 'SUBSCRIPTION', source: 'PAYMENT' }, false, now)
  return describeAccess(trial ? { ...trial, plan: 'TRIAL_7', source: 'WELCOME' } : null, false, now)
}
