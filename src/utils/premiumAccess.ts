/** Study access comes from the server's one-time trial or active subscription. */
export const ENFORCE_PREMIUM = true
// General vocabulary, articles and saved results remain open.
export const ENFORCE_CONTENT_PREMIUM = false
// Access is time-based; there is no separate allowance of test attempts.
export const FREE_ATTEMPT_LIMIT = 0

export type PremiumTier = 'FREE' | 'BASIC' | 'STANDARD' | 'PRO' | 'UNLIMITED'

// Legacy fixed premium accounts. New grants are stored in the database and
// returned by the API as `premium`.
const PREMIUM_EMAIL_ALLOWLIST = new Set<string>([
  'elyornishonboyev000@gmail.com',
  'nishonboyv7@gmail.com',
  'erkiinov09@gmail.com',
  'assasinhnur2000@gmail.com',
])

const PREMIUM_NICKNAME_ALLOWLIST = new Set<string>(['firdavs', 'erkinov7', 'erkinov', 'ali'])

type PremiumInput = {
  email?: string | null
  nickname?: string | null
  access?: { active: boolean; kind: string; expiresAt: string | null }
  premium?: boolean | null
  premiumExpiresAt?: string | null
  role?: string | null
} | null | undefined

/**
 * Whether the account currently has premium access.
 * Used for the Crown badge — independent of the global feature gate, so it
 * does NOT light up for every user just because features are currently open.
 */
export function isPremiumUser(input?: PremiumInput) {
  if (!input) return false
  if (input.access) return input.access.active && input.access.kind !== 'TRIAL' && (!input.access.expiresAt || new Date(input.access.expiresAt).getTime() > Date.now())
  if (input.role === 'ADMIN') return true
  if (input.email && PREMIUM_EMAIL_ALLOWLIST.has(input.email.trim().toLowerCase())) return true
  if (input.nickname && PREMIUM_NICKNAME_ALLOWLIST.has(input.nickname.trim().toLowerCase())) return true
  if (input.premiumExpiresAt && new Date(input.premiumExpiresAt).getTime() <= Date.now()) return false
  if (input.premium === true) return true
  return false
}

/** Whether an active subscription or unexpired welcome trial allows study. */
export function hasPremiumAccess(input?: PremiumInput) {
  if (input?.access) return input.access.active && (!input.access.expiresAt || new Date(input.access.expiresAt).getTime() > Date.now())
  return isPremiumUser(input)
}

export type FreeAttemptInfo = {
  used: number
  limit: number
  remaining: number
  reached: boolean
  unlimited: boolean
}

/** Derive the free-attempt status for a given used-count and user. */
export function getFreeAttemptInfo(used: number, input?: PremiumInput): FreeAttemptInfo {
  const unlimited = hasPremiumAccess(input)
  const safeUsed = Math.max(0, Math.floor(Number.isFinite(used) ? used : 0))
  return {
    used: safeUsed,
    limit: FREE_ATTEMPT_LIMIT,
    remaining: unlimited ? Number.POSITIVE_INFINITY : Math.max(0, FREE_ATTEMPT_LIMIT - safeUsed),
    reached: !unlimited,
    unlimited,
  }
}
