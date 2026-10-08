// Monetary amounts are integer USD cents. All students use the same plan.
export type BillingCurrency = 'UZS' | 'USD'
export type BillingAudience = 'STUDENT' | 'TEACHER'
export type AccessFeature = 'test' | 'mock' | 'writing' | 'speaking' | 'voice' | 'shadowing' | 'podcast' | 'ai'
export const BILLING_PERIODS = [1, 3, 12] as const
export type BillingProduct = { code: string; audience: BillingAudience; months: number; amountUsd: number; discount: number }
const tiers = [{ audience: 'STUDENT', usd: 300 }, { audience: 'TEACHER', usd: 500 }] as const
export const BILLING_PRODUCTS: BillingProduct[] = tiers.flatMap(tier => BILLING_PERIODS.map(months => {
  const discount = months === 12 ? 20 : months === 3 ? 10 : 0
  return { code: `${tier.audience}_${months}`, audience: tier.audience, months,
    amountUsd: Math.round(tier.usd * months * (100 - discount) / 100), discount }
}))
export function billingProduct(code: string) { return BILLING_PRODUCTS.find(product => product.code === code) }
export function extendBillingExpiry(months: number, current: Date | null | undefined, now = new Date()) {
  const base = current && current > now ? new Date(current) : new Date(now)
  const day = base.getUTCDate()
  base.setUTCDate(1); base.setUTCMonth(base.getUTCMonth() + months)
  base.setUTCDate(Math.min(day, new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()))
  return base
}
