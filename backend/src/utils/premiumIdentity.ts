import type { Prisma } from '@prisma/client'
import { resolveAccountAccess } from './accessEntitlement.js'
import { isPremiumUser } from './premium.js'

// Select billing data in the same query as identities, avoiding one query per learner.
// Only the derived boolean is returned publicly; email and billing data stay private.
export const premiumIdentitySelect = {
  role: true,
  email: true,
  premiumGrant: { select: { plan: true, source: true, startsAt: true, expiresAt: true } },
  billingSubscriptions: { select: { startsAt: true, expiresAt: true } },
} satisfies Prisma.UserSelect

type PremiumIdentity = Prisma.UserGetPayload<{ select: typeof premiumIdentitySelect & { nickname: true } }>

export function hasPremiumIdentity(user: PremiumIdentity, now = new Date()) {
  const access = resolveAccountAccess(user.premiumGrant, isPremiumUser(user), user.billingSubscriptions, null, now)
  return access.active && access.kind !== 'TRIAL'
}
