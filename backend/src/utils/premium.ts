const PREMIUM_EMAIL_ALLOWLIST = new Set<string>([
  'elyornishonboyev000@gmail.com',
  'nishonboyv7@gmail.com',
  'erkiinov09@gmail.com',
  'assasinhnur2000@gmail.com',
])

const PREMIUM_NICKNAME_ALLOWLIST = new Set<string>(['firdavs', 'erkinov7', 'erkinov', 'ali'])

export function isPremiumUser(input: { role: 'USER' | 'ADMIN'; email: string; nickname?: string | null }) {
  if (input.role === 'ADMIN') return true
  const normalizedEmail = input.email.trim().toLowerCase()
  const normalizedNickname = input.nickname?.trim().toLowerCase()
  return (
    PREMIUM_EMAIL_ALLOWLIST.has(normalizedEmail) ||
    Boolean(normalizedNickname && PREMIUM_NICKNAME_ALLOWLIST.has(normalizedNickname))
  )
}
import { prisma } from '../lib/prisma.js'
import { describeAccess } from './accessEntitlement.js'


export async function hasPremiumAccess(input: { id: string; role: 'USER' | 'ADMIN'; email: string; nickname?: string | null }) {
  const grant = await prisma.premiumGrant.findUnique({
    where: { userId: input.id },
    select: { plan: true, source: true, startsAt: true, expiresAt: true },
  })
  if (describeAccess(grant, isPremiumUser(input)).active) return true
  return Boolean(await prisma.billingSubscription.findFirst({ where: { userId: input.id, expiresAt: { gt: new Date() } } }))
}
