import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { PaymentRequest } from '@prisma/client'
import { env } from '../config/env.js'
import { BillingError } from './billing.service.js'

export type PaymentProvider = 'PAYME' | 'CLICK' | 'STRIPE'
export function paymentProviders() {
  return [
    { code: 'PAYME' as const, currency: 'UZS' as const, enabled: env.AUTOMATED_BILLING_ENABLED && Boolean(env.PAYME_MERCHANT_ID && env.PAYME_SECRET_KEY) },
    { code: 'CLICK' as const, currency: 'UZS' as const, enabled: env.AUTOMATED_BILLING_ENABLED && Boolean(env.CLICK_MERCHANT_ID && env.CLICK_SERVICE_ID && env.CLICK_SECRET_KEY) },
    { code: 'STRIPE' as const, currency: 'USD' as const, enabled: env.AUTOMATED_BILLING_ENABLED && Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET) },
  ]
}
export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a); const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
export function clickSignature(body: { click_trans_id: string; service_id: string; merchant_trans_id: string; merchant_prepare_id?: string; amount: string; action: string; sign_time: string }, secret = env.CLICK_SECRET_KEY) {
  const parts = [body.click_trans_id, body.service_id, secret, body.merchant_trans_id]
  if (body.action === '1') parts.push(body.merchant_prepare_id ?? '')
  parts.push(body.amount, body.action, body.sign_time)
  return createHash('md5').update(parts.join('')).digest('hex')
}
export function verifyStripeSignature(raw: Buffer, header: string, secret = env.STRIPE_WEBHOOK_SECRET, now = Date.now()) {
  const parts = header.split(',').map(part => part.split('='))
  const timestamp = parts.find(([key]) => key === 't')?.[1]
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) return false
  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(raw).digest('hex')
  return parts.some(([key, value]) => key === 'v1' && safeEqual(value, expected))
}
export async function checkoutUrl(order: PaymentRequest) {
  const provider = paymentProviders().find(item => item.code === order.method)
  if (!provider?.enabled || provider.currency !== order.currency) throw new BillingError('PAYMENTS_UNAVAILABLE', 'This payment method is not available yet.', 503)
  const returnUrl = `${env.BILLING_SITE_URL}/premium?order=${encodeURIComponent(order.id)}`
  if (order.method === 'PAYME') {
    const params = `m=${env.PAYME_MERCHANT_ID};ac.order_id=${order.id};a=${order.amountMinor};l=uz;c=${returnUrl}`
    return { url: `${env.PAYME_CHECKOUT_URL}/${Buffer.from(params).toString('base64')}`, providerId: null }
  }
  if (order.method === 'CLICK') {
    const params = new URLSearchParams({ service_id: env.CLICK_SERVICE_ID, merchant_id: env.CLICK_MERCHANT_ID,
      amount: (order.amountMinor / 100).toFixed(2), transaction_param: order.id, return_url: returnUrl })
    return { url: `https://my.click.uz/services/pay?${params}`, providerId: null }
  }
  const form = new URLSearchParams({ mode: 'payment', success_url: `${returnUrl}&payment=returned`, cancel_url: `${returnUrl}&payment=canceled`,
    client_reference_id: order.id, 'metadata[order_id]': order.id,
    'line_items[0][price_data][currency]': 'usd', 'line_items[0][price_data][unit_amount]': String(order.amountMinor),
    'line_items[0][price_data][product_data][name]': `ProfAI ${order.plan}`, 'line_items[0][quantity]': '1' })
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': order.id },
    body: form, signal: AbortSignal.timeout(20000) })
  const result = await response.json() as { id?: string; url?: string }
  if (!response.ok || !result.id || !result.url?.startsWith('https://checkout.stripe.com/')) {
    throw new BillingError('CHECKOUT_FAILED', 'The payment page could not be opened. Please retry.', 502)
  }
  return { url: result.url, providerId: `STRIPE:${result.id}` }
}
export async function expireStripeCheckout(sessionId: string) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/expire`, {
    method: 'POST', headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }, signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new BillingError('PAYMENT_IN_PROGRESS', 'This checkout cannot be canceled. Refresh its payment status.', 409)
}
