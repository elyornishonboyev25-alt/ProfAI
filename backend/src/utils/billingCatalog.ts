// Shared with the web client. Monetary amounts are integer minor units.
export type BillingCurrency = 'UZS' | 'USD'
export type BillingAudience = 'LEARNER' | 'CENTER_STUDENT' | 'TEACHER' | 'TOPUP'
export const WELCOME_COINS = 150
export const BILLING_PERIODS = [1, 3, 12] as const
export const PRACTICE_ACCESS_DAYS = 7
export const COIN_COSTS = { test: 5, mock: 25, writing: 10, speaking: 10, voice: 10, shadowing: 2, podcast: 2, ai: 1 } as const
export const LISTENING_TEST_COST = 10
export type CoinFeature = keyof typeof COIN_COSTS
export function resourceCoinCost(feature: CoinFeature, resource: string) {
  return feature === 'test' && resource.startsWith('test:listening:') ? LISTENING_TEST_COST : COIN_COSTS[feature]
}
export type BillingProduct = { code: string; audience: BillingAudience; months: number; coins: number; amountUsd: number; discount: number }
const tiers = [
  { audience: 'LEARNER', usd: 600, coins: 1000 },
  { audience: 'CENTER_STUDENT', usd: 400, coins: 600 },
  { audience: 'TEACHER', usd: 800, coins: 1000 },
] as const
export const BILLING_PRODUCTS: BillingProduct[] = tiers.flatMap<BillingProduct>(tier => BILLING_PERIODS.map(months => {
  const discount = months === 12 ? 20 : months === 3 ? 10 : 0
  return { code: `${tier.audience}_${months}`, audience: tier.audience, months, coins: tier.coins * months,
    amountUsd: Math.round(tier.usd * months * (100 - discount) / 100), discount }
})).concat([
  { code: 'COINS_150', audience: 'TOPUP', months: 0, coins: 150, amountUsd: 199, discount: 0 },
  { code: 'COINS_400', audience: 'TOPUP', months: 0, coins: 400, amountUsd: 349, discount: 0 },
  { code: 'COINS_900', audience: 'TOPUP', months: 0, coins: 900, amountUsd: 699, discount: 0 },
] as BillingProduct[])
export function billingProduct(code: string) { return BILLING_PRODUCTS.find(product => product.code === code) }
export function extendBillingExpiry(months: number, current: Date | null | undefined, now = new Date()) {
  const base = current && current > now ? new Date(current) : new Date(now)
  const day = base.getUTCDate()
  base.setUTCDate(1); base.setUTCMonth(base.getUTCMonth() + months)
  base.setUTCDate(Math.min(day, new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()))
  return base
}
