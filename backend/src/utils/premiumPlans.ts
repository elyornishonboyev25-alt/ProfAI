export const PREMIUM_PLANS = {
  MONTHLY: { name: '1 oy', months: 1, amountUzs: 39000 },
  QUARTERLY: { name: '3 oy', months: 3, amountUzs: 89000 },
  YEARLY: { name: '12 oy', months: 12, amountUzs: 299000 },
} as const

export type PaidPlan = keyof typeof PREMIUM_PLANS

export function extendPremiumExpiry(plan: PaidPlan, currentExpiry: Date | null | undefined, now = new Date()) {
  const base = currentExpiry && currentExpiry > now ? new Date(currentExpiry) : new Date(now)
  const day = base.getUTCDate()
  base.setUTCDate(1)
  base.setUTCMonth(base.getUTCMonth() + PREMIUM_PLANS[plan].months)
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()
  base.setUTCDate(Math.min(day, lastDay))
  return base
}
