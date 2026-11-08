import { z } from 'zod'
import { env } from '../config/env.js'
import { discountedAmount, type BillingProduct } from '../utils/billingCatalog.js'
import { BillingError } from './billing.service.js'

const promotionSchema = z.object({
  percent: z.number().int().min(1).max(100).optional(),
  amountUsd: z.number().int().positive().optional(),
  amountUzs: z.number().int().positive().optional(),
  products: z.array(z.string().min(1)).min(1).optional(),
  expiresAt: z.string().datetime().optional(),
}).refine(value => [value.percent, value.amountUsd, value.amountUzs].filter(value => value !== undefined).length === 1,
  'Specify exactly one discount: percent, amountUsd (cents), or amountUzs (soum).')

export type CheckoutPromotion = z.infer<typeof promotionSchema>
export const normalizeCheckoutCode = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

// Server-only configuration: reward codes that grant access days keep their existing meaning.
export function parseCheckoutPromotions(value: string) {
  const promotions = z.record(promotionSchema).parse(JSON.parse(value))
  if (Object.keys(promotions).some(code => code !== normalizeCheckoutCode(code) || code.length < 3 || code.length > 40)) {
    throw new Error('Checkout promo codes must contain 3–40 uppercase letters or numbers.')
  }
  return promotions
}

const promotions = parseCheckoutPromotions(env.BILLING_PROMO_CODES)

export function checkoutPromotion(rawCode: string | undefined, product: BillingProduct, now = Date.now()) {
  const code = normalizeCheckoutCode(rawCode ?? '')
  if (!code) return null
  const promotion = promotions[code]
  if (!promotion || (promotion.products && !promotion.products.includes(product.code))) {
    throw new BillingError('INVALID_PROMO_CODE', 'This promo code is not valid for the selected plan.', 400)
  }
  if (promotion.expiresAt && Date.parse(promotion.expiresAt) <= now) {
    throw new BillingError('PROMO_EXPIRED', 'This promo code has expired.', 400)
  }
  return { code, ...promotion }
}

/** Apply the promo to the invoice after any wheel discount, keeping integer money amounts. */
export function checkoutAmounts(product: BillingProduct, wheelPercent: number, promotion: CheckoutPromotion | null, rate: number) {
  const subtotalUsd = discountedAmount(product.amountUsd, wheelPercent)
  const subtotalUzs = Math.round(subtotalUsd * rate / 100)
  let amountUsd = subtotalUsd
  let amountUzs = subtotalUzs
  if (promotion?.amountUzs !== undefined) {
    if (rate <= 0) throw new BillingError('RATE_UNAVAILABLE', 'The exchange rate is required for this promo code.', 503)
    amountUzs = Math.max(0, subtotalUzs - promotion.amountUzs)
    amountUsd = Math.max(0, Math.round(amountUzs * 100 / rate))
  } else if (promotion) {
    amountUsd = promotion.percent !== undefined ? discountedAmount(subtotalUsd, promotion.percent) : Math.max(0, subtotalUsd - promotion.amountUsd!)
    amountUzs = Math.round(amountUsd * rate / 100)
  }
  return { subtotalUsd, subtotalUzs, amountUsd, amountUzs,
    promoDiscountUsd: subtotalUsd - amountUsd, promoDiscountUzs: subtotalUzs - amountUzs }
}
