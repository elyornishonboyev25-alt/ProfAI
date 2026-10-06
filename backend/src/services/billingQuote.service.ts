import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { env } from '../config/env.js'
import type { BillingProduct } from '../utils/billingCatalog.js'
import { BillingError } from './coinBilling.service.js'

const RATE_URL = 'https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/'
const QUOTE_TTL = 15 * 60_000
type DollarRate = { rate: number; date: string }
let cached: { value: DollarRate; until: number } | null = null
let pending: Promise<DollarRate> | null = null
let retryAfter = 0

export function parseDollarRate(data: unknown, now = Date.now()): DollarRate {
  const records = z.array(z.object({ Ccy: z.string(), Nominal: z.string(), Rate: z.string(), Date: z.string() })).parse(data)
  const usd = records.find(record => record.Ccy === 'USD')
  if (!usd || !/^\d{2}\.\d{2}\.\d{4}$/.test(usd.Date)) throw new Error('Invalid dollar rate')
  const [day, month, year] = usd.Date.split('.')
  const date = `${year}-${month}-${day}`
  const effectiveAt = Date.parse(`${date}T00:00:00+05:00`)
  const nominal = Number(usd.Nominal)
  const rate = Number(usd.Rate) / nominal
  if (!Number.isFinite(effectiveAt) || new Date(effectiveAt + 5 * 3600000).toISOString().slice(0, 10) !== date ||
      effectiveAt > now || now - effectiveAt > 7 * 86400000 || !Number.isFinite(rate) || nominal <= 0 || rate <= 0 || rate > 1_000_000) {
    throw new Error('Unavailable dollar rate')
  }
  return { rate, date }
}

export async function dollarRate(): Promise<DollarRate> {
  if (cached && cached.until > Date.now()) return cached.value
  if (pending) return pending
  if (Date.now() < retryAfter) throw new BillingError('RATE_UNAVAILABLE', 'The exchange rate is temporarily unavailable. Please retry or pay in USD.', 503)
  pending = (async () => {
    try {
      const response = await fetch(RATE_URL, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Rate request failed')
      const value = parseDollarRate(await response.json())
      cached = { value, until: Math.min(Date.now() + 3600000, Date.parse(`${value.date}T00:00:00+05:00`) + 7 * 86400000) }
      return value
    } catch {
      retryAfter = Date.now() + 30000
      throw new BillingError('RATE_UNAVAILABLE', 'The exchange rate is temporarily unavailable. Please retry or pay in USD.', 503)
    } finally { pending = null }
  })()
  return pending
}

const quoteSchema = z.object({ product: z.string(), amountUsd: z.number().int().positive(), amountUzs: z.number().int().positive(),
  rate: z.number().positive(), date: z.string(), expiresAt: z.number().int().positive() })
const sign = (payload: string) => createHmac('sha256', env.ACCESS_TOKEN_SECRET).update(`billing-quote:${payload}`).digest()

export function createPaymentQuote(product: BillingProduct, rate: DollarRate, now = Date.now()) {
  // Round the complete invoice once to whole soum; Payme/Click receive its exact tiyin value.
  const quote = { product: product.code, amountUsd: product.amountUsd, amountUzs: Math.round(product.amountUsd * rate.rate / 100),
    ...rate, expiresAt: now + QUOTE_TTL }
  const payload = Buffer.from(JSON.stringify(quote)).toString('base64url')
  return { ...quote, token: `${payload}.${sign(payload).toString('base64url')}` }
}

export function verifyPaymentQuote(token: string | undefined, product: BillingProduct, now = Date.now()) {
  try {
    const [payload, signature, extra] = (token ?? '').split('.')
    const actual = Buffer.from(signature ?? '', 'base64url')
    const expected = sign(payload ?? '')
    if (extra || actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid signature')
    const quote = quoteSchema.parse(JSON.parse(Buffer.from(payload, 'base64url').toString()))
    if (quote.product !== product.code || quote.amountUsd !== product.amountUsd || quote.expiresAt <= now || quote.expiresAt > now + QUOTE_TTL) throw new Error('Expired quote')
    return quote
  } catch { throw new BillingError('QUOTE_EXPIRED', 'Please refresh the payment amount before continuing.', 409) }
}
