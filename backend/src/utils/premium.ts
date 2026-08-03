const PREMIUM_EMAIL_ALLOWLIST = new Set<string>([
  'elyornishonboyev000@gmail.com',
  'nishonboyv7@gmail.com',
])

const PREMIUM_NICKNAME_ALLOWLIST = new Set<string>(['firdavs'])

export function isPremiumUser(input: { role: 'USER' | 'ADMIN'; email: string; nickname?: string | null }) {
  if (input.role === 'ADMIN') return true
  const normalizedEmail = input.email.trim().toLowerCase()
  const normalizedNickname = input.nickname?.trim().toLowerCase()
  return (
    PREMIUM_EMAIL_ALLOWLIST.has(normalizedEmail) ||
    Boolean(normalizedNickname && PREMIUM_NICKNAME_ALLOWLIST.has(normalizedNickname))
  )
}
