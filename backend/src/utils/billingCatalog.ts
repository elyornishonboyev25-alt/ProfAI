// Monetary amounts are integer USD cents.
export type BillingCurrency = 'UZS' | 'USD'
// PRO and MAX are sold today; STUDENT and TEACHER remain for subscriptions bought earlier.
export type BillingAudience = 'PRO' | 'MAX' | 'STUDENT' | 'TEACHER'
export type PlanTier = 'FREE' | 'PRO' | 'MAX'
export type AccessFeature = 'test' | 'mock' | 'writing' | 'speaking' | 'voice' | 'shadowing' | 'podcast' | 'ai'
export const BILLING_PERIODS = [1, 3, 12] as const
export type BillingProduct = { code: string; audience: BillingAudience; months: number; amountUsd: number; discount: number }

export const PLAN_MONTHLY_USD: Record<'PRO' | 'MAX', number> = { PRO: 599, MAX: 1199 }
const PLAN_PRICES_USD = {
  PRO: { 1: PLAN_MONTHLY_USD.PRO, 3: 1599, 12: 5499 },
  MAX: { 1: PLAN_MONTHLY_USD.MAX, 3: 2999, 12: 10999 },
} as const
// Groups of five or more people pay this per person for one month.
export const GROUP_MONTHLY_USD: Record<'PRO' | 'MAX', number> = { PRO: 499, MAX: 999 }
export const GROUP_MIN_SIZE = 5
export const GROUP_MAX_SIZE = 20

export const BILLING_PRODUCTS: BillingProduct[] = (['PRO', 'MAX'] as const).flatMap(audience => BILLING_PERIODS.map(months => {
  const amountUsd = PLAN_PRICES_USD[audience][months]
  // Display savings against paying the current monthly price, rounded to one decimal.
  const discount = Math.round((1 - amountUsd / (PLAN_MONTHLY_USD[audience] * months)) * 1000) / 10
  return { code: `${audience}_${months}`, audience, months, amountUsd, discount }
}))

/** Monthly allowance per plan; `null` means no monthly limit. */
export const PLAN_QUOTAS: Record<PlanTier, Record<AccessFeature, number | null>> = {
  FREE: { test: 4, mock: 1, writing: 2, speaking: 2, ai: 15, voice: 0, shadowing: 3, podcast: 3 },
  PRO: { test: null, mock: 4, writing: 30, speaking: 30, ai: 300, voice: 10, shadowing: null, podcast: null },
  MAX: { test: null, mock: null, writing: 150, speaking: 150, ai: 1500, voice: 60, shadowing: null, podcast: null },
}

export function tierOfAudience(audience: string): PlanTier {
  return audience === 'MAX' || audience === 'TEACHER' ? 'MAX' : 'PRO'
}

export const TIER_RANK: Record<PlanTier, number> = { FREE: 0, PRO: 1, MAX: 2 }

export function billingProduct(code: string) { return BILLING_PRODUCTS.find(product => product.code === code) }

export function discountedAmount(amountUsd: number, percent: number) {
  return Math.round(amountUsd * (100 - percent) / 100)
}

export function extendBillingExpiry(months: number, current: Date | null | undefined, now = new Date()) {
  const base = current && current > now ? new Date(current) : new Date(now)
  const day = base.getUTCDate()
  base.setUTCDate(1); base.setUTCMonth(base.getUTCMonth() + months)
  base.setUTCDate(Math.min(day, new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()))
  return base
}
