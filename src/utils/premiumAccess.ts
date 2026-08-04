/**
 * Premium access model.
 *
 * IMPORTANT: `ENFORCE_PREMIUM` is the master switch. While it is `false`,
 * every feature stays fully open for ALL users (current product state) —
 * nothing is ever locked, so no one can be accidentally shut out. The tier
 * logic, free-attempt counter and upgrade overlay are all wired and ready,
 * but stay dormant until paid tiers are connected on the backend and this
 * flag is flipped to `true`.
 */
export const ENFORCE_PREMIUM = false

/**
 * Gate the premium-only content sections (Admission, Shadowing, Podcast,
 * Articles, Vocabulary, …) behind the PremiumGate teaser for non-premium
 * accounts. Independent of ENFORCE_PREMIUM (which drives the older
 * attempt-based gate). Flip to `false` to instantly reopen every section.
 */
export const ENFORCE_CONTENT_PREMIUM = true

/** Free users get this many test attempts before the upgrade prompt appears. */
export const FREE_ATTEMPT_LIMIT = 4

export type PremiumTier = 'FREE' | 'BASIC' | 'STANDARD' | 'PRO' | 'UNLIMITED'

// Accounts treated as genuine premium owners. The owner activates a paying
// learner by adding their Gmail here, OR by setting their DB role to ADMIN
// (no redeploy needed).
const PREMIUM_EMAIL_ALLOWLIST = new Set<string>([
  'elyornishonboyev000@gmail.com',
  'nishonboyv7@gmail.com',
  'erkiinov09@gmail.com',
])

const PREMIUM_NICKNAME_ALLOWLIST = new Set<string>(['firdavs', 'erkinov7'])

type PremiumInput = {
  email?: string | null
  nickname?: string | null
  premium?: boolean | null
  role?: string | null
} | null | undefined

/**
 * Whether the account is a genuine premium owner (allowlist or admin).
 * Used for the Crown badge — independent of the global feature gate, so it
 * does NOT light up for every user just because features are currently open.
 */
export function isPremiumUser(input?: PremiumInput) {
  if (!input) return false
  if (input.role === 'ADMIN') return true
  if (input.email && PREMIUM_EMAIL_ALLOWLIST.has(input.email.trim().toLowerCase())) return true
  if (input.nickname && PREMIUM_NICKNAME_ALLOWLIST.has(input.nickname.trim().toLowerCase())) return true
  return false
}

/**
 * Whether the user can access premium-gated features. AI stays unlimited for
 * everyone. While `ENFORCE_PREMIUM` is false this is always `true`.
 */
export function hasPremiumAccess(input?: PremiumInput) {
  if (!ENFORCE_PREMIUM) return true
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
  const unlimited = !ENFORCE_PREMIUM || isPremiumUser(input)
  const safeUsed = Math.max(0, Math.floor(Number.isFinite(used) ? used : 0))
  return {
    used: safeUsed,
    limit: FREE_ATTEMPT_LIMIT,
    remaining: unlimited ? Number.POSITIVE_INFINITY : Math.max(0, FREE_ATTEMPT_LIMIT - safeUsed),
    reached: unlimited ? false : safeUsed >= FREE_ATTEMPT_LIMIT,
    unlimited,
  }
}
