import test from 'node:test'
import assert from 'node:assert/strict'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET ||= 'checkout-promo-test-access-secret'
process.env.REFRESH_TOKEN_SECRET ||= 'checkout-promo-test-refresh-secret'
process.env.AUTOMATED_BILLING_ENABLED = 'true'
process.env.PAYME_MERCHANT_ID = 'promo-test-merchant'
process.env.PAYME_SECRET_KEY = 'promo-test-key'
process.env.BILLING_PROMO_CODES = JSON.stringify({
  SAVE20: { percent: 20 }, SOUM50: { amountUzs: 50000 }, USD5: { amountUsd: 500 },
  FREE100: { percent: 100 }, EXPIRED: { percent: 10, expiresAt: '2000-01-01T00:00:00Z' },
  PROONLY: { percent: 10, products: ['PRO_12'] },
})

const { prisma } = await import('../dist/lib/prisma.js')
const { env } = await import('../dist/config/env.js')
const { checkoutAmounts, checkoutPromotion, parseCheckoutPromotions } = await import('../dist/services/checkoutPromo.service.js')
const { billingProduct } = await import('../dist/utils/billingCatalog.js')
const { default: router } = await import('../dist/routes/billing.routes.js')
let spin = null, orders = [], subscriptions = []
prisma.telegramLink.findUnique = async () => null
prisma.wheelSpin.findFirst = async () => spin
const tx = {
  premiumEvent: { create: async ({ data }) => data },
  $queryRaw: async () => [],
  paymentRequest: {
    findFirst: async () => orders.find(order => order.status === 'PENDING') ?? null,
    create: async ({ data }) => { const order = { id: `order-${orders.length}`, status: 'PENDING', ...data }; orders.push(order); return order },
    updateMany: async ({ where, data }) => { const order = orders.find(order => order.id === where.id && (where.status.in ?? [where.status]).includes(order.status)); if (!order) return { count: 0 }; Object.assign(order, data); return { count: 1 } },
  },
  billingSubscription: {
    findUnique: async () => subscriptions[0] ?? null,
    upsert: async ({ create, update }) => { if (subscriptions.length) Object.assign(subscriptions[0], update); else subscriptions.push(create) },
  },
  wheelSpin: { updateMany: async () => ({ count: 1 }) },
}
prisma.$transaction = async work => work(tx)
prisma.paymentRequest.updateMany = tx.paymentRequest.updateMany
const call = (path, data, userId = 'u') => new Promise((resolve, reject) => {
  const layer = router.stack.find(layer => layer.route?.path === path && layer.route.methods[path === '/quote' ? 'get' : 'post'])
  let status = 200
  layer.route.stack.at(-1).handle({ user: { id: userId }, query: data, body: data }, {
    setHeader() {}, status(value) { status = value; return this }, json(body) { resolve({ status, body }) },
  }, reject)
})
const quote = async (promoCode, currency = 'UZS', product = 'PRO_12') => (await call('/quote', { product, currency, promoCode })).body
const checkout = (value, overrides = {}) => call('/checkout', {
  product: value.product, currency: value.currency, provider: value.currency === 'USD' ? 'STRIPE' : 'PAYME',
  promoCode: value.promoCode, quote: value.token, ...overrides,
})

test('promo configuration accepts one explicit discount and rejects ambiguous or malformed rules', () => {
  assert.throws(() => parseCheckoutPromotions('{'))
  for (const rule of [{}, { percent: 101 }, { percent: 0 }, { percent: 20, amountUsd: 50 }, { amountUzs: -1 }]) {
    assert.throws(() => parseCheckoutPromotions(JSON.stringify({ CODE: rule })))
  }
  assert.throws(() => parseCheckoutPromotions('{"lowercase":{"percent":20}}'))
  assert.equal(checkoutPromotion(' save-20 ', billingProduct('PRO_12')).percent, 20)
  assert.throws(() => checkoutPromotion('UNKNOWN', billingProduct('PRO_12')), error => error.code === 'INVALID_PROMO_CODE')
  assert.throws(() => checkoutPromotion('PROONLY', billingProduct('MAX_12')), error => error.code === 'INVALID_PROMO_CODE')
  assert.throws(() => checkoutPromotion('EXPIRED', billingProduct('PRO_12')), error => error.code === 'PROMO_EXPIRED')
})

test('percentage and fixed discounts subtract from the full invoice after the wheel; totals never go negative', () => {
  const product = billingProduct('PRO_12')
  assert.deepEqual(checkoutAmounts(product, 10, { percent: 20 }, 13100), {
    subtotalUsd: 4949, subtotalUzs: 648319, amountUsd: 3959, amountUzs: 518629, promoDiscountUsd: 990, promoDiscountUzs: 129690,
  })
  assert.equal(checkoutAmounts(product, 0, { amountUzs: 50000 }, 13100).amountUzs, 670369)
  assert.equal(checkoutAmounts(product, 0, { amountUsd: 500 }, 13100).amountUsd, 4999)
  for (const promotion of [{ percent: 100 }, { amountUsd: 999999 }, { amountUzs: 999999999 }]) {
    const amounts = checkoutAmounts(product, 0, promotion, 13100)
    assert.equal(amounts.amountUsd, 0); assert.equal(amounts.amountUzs, 0)
  }
})

test('quote and checkout use the same discounted amount; altered codes, accounts, currencies and stale wheel prices fail', async t => {
  const date = new Date().toISOString().slice(0, 10).split('-').reverse().join('.')
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => [{ Ccy: 'USD', Nominal: '1', Rate: '13100', Date: date }] }))
  orders = []; spin = null
  const value = await quote('SAVE20')
  assert.equal(value.amountUsd, 4399); assert.equal(value.amountUzs, 576269)
  await assert.rejects(checkout(value, { promoCode: '' }), error => error.code === 'QUOTE_EXPIRED')
  await assert.rejects(checkout(value, { promoCode: 'USD5' }), error => error.code === 'QUOTE_EXPIRED')
  await assert.rejects(checkout(value, { currency: 'USD', provider: 'STRIPE' }), error => error.code === 'QUOTE_EXPIRED')
  await assert.rejects(call('/checkout', { product: 'PRO_12', currency: 'UZS', provider: 'PAYME', promoCode: 'SAVE20', quote: value.token }, 'other-user'), error => error.code === 'QUOTE_EXPIRED')
  assert.equal(orders.length, 0)
  const result = await checkout(value)
  assert.equal(result.status, 201)
  assert.equal(orders[0].amountMinor, value.amountUzs * 100)
  assert.equal(orders[0].reference, 'promo:SAVE20')
  assert.equal(orders[0].discountPercent, 20)
  orders = []
  spin = { id: 'spin', percent: 10, expiresAt: new Date(Date.now() + 60000), usedAt: null }
  const wheelQuote = await quote('SAVE20')
  assert.equal(wheelQuote.amountUsd, 3959)
  spin = null
  await assert.rejects(checkout(wheelQuote), error => error.code === 'QUOTE_EXPIRED')
  assert.equal(orders.length, 0)
  const fixed = await quote('SOUM50')
  assert.equal(fixed.amountUzs, 670369)
  await checkout(fixed)
  assert.equal(orders[0].amountMinor, 67036900)
})

test('USD percentage promos do not need a rate; a zero invoice activates once without a payment provider', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('USD percentage codes must not fetch an exchange rate') })
  orders = []; subscriptions = []; spin = null
  const value = await quote('SAVE20', 'USD')
  assert.equal(value.amountUsd, 4399); assert.equal(value.rate, 0)
  const free = await quote('FREE100', 'USD')
  const billingEnabled = env.AUTOMATED_BILLING_ENABLED
  env.AUTOMATED_BILLING_ENABLED = false
  try {
    assert.equal((await checkout(free)).body.status, 'APPROVED')
    assert.equal(orders[0].status, 'APPROVED'); assert.equal(orders[0].amountMinor, 0)
    assert.equal(subscriptions.length, 1)
    const expiry = subscriptions[0].expiresAt.getTime()
    // Repeated provider fulfillment cannot grant the same order twice.
    const { fulfillPayment } = await import('../dist/services/billing.service.js')
    assert.equal(await fulfillPayment(tx, orders[0], 'PROMO'), false)
    assert.equal(subscriptions[0].expiresAt.getTime(), expiry)
  } finally { env.AUTOMATED_BILLING_ENABLED = billingEnabled }
})
