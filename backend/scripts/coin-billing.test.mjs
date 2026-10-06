import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { BILLING_PRODUCTS, billingProduct, extendBillingExpiry } from '../dist/utils/billingCatalog.js'

process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET ||= 'billing-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET ||= 'billing-test-refresh-secret-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { env } = await import('../dist/config/env.js')
const { unlockResource, withCoinCharge, fulfillPayment, requireTeacherPlan } = await import('../dist/services/coinBilling.service.js')
const { clickSignature, verifyStripeSignature } = await import('../dist/services/paymentProviders.service.js')
const { paymentCallbacks, stripeCallback } = await import('../dist/routes/paymentCallbacks.routes.js')
const { default: express } = await import('express')

let state
function reset() { state = { wallet: null, entries: [], access: [], subscription: null, order: null, role: 'USER' } }
reset()
const active = access => !access.expiresAt || access.expiresAt > new Date()
const tx = {
  $queryRaw: async () => [],
  user: { findUniqueOrThrow: async () => ({ role: state.role }) },
  premiumGrant: { findUnique: async () => null },
  coinWallet: {
    findUnique: async () => state.wallet,
    create: async ({ data }) => state.wallet = { ...data },
    update: async ({ data }) => { state.wallet.balance += (data.balance.increment ?? 0) - (data.balance.decrement ?? 0); return { ...state.wallet } },
  },
  coinEntry: { create: async ({ data }) => { assert.ok(!state.entries.some(e => e.key === data.key)); state.entries.push(data); return data } },
  coinAccess: {
    findUnique: async ({ where }) => state.access.find(a => a.resource === where.userId_resource.resource) ?? null,
    findFirst: async ({ where }) => state.access.find(a => active(a) && a.feature === where.feature && (where.writingLeft ? a.writingLeft > 0 : a.speakingLeft > 0)) ?? null,
    upsert: async ({ where, create, update }) => {
      let item = state.access.find(a => a.resource === where.userId_resource.resource)
      if (item) Object.assign(item, update); else { item = { id: 'access-' + state.access.length, ...create }; state.access.push(item) }
      return item
    },
    update: async ({ where, data }) => { const item = state.access.find(a => a.id === where.id); for (const [key, value] of Object.entries(data)) item[key] += (value.increment ?? 0) - (value.decrement ?? 0); return item },
    updateMany: async args => { await tx.coinAccess.update(args); return { count: 1 } },
  },
  billingSubscription: {
    findUnique: async ({ where }) => state.subscription?.audience === where.userId_audience.audience ? state.subscription : null,
    upsert: async ({ create, update }) => state.subscription = state.subscription ? { ...state.subscription, ...update } : create,
  },
  paymentRequest: {
    findUnique: async ({ where }) => state.order && (where.id === state.order.id || where.providerId === state.order.providerId) ? { ...state.order } : null,
    findUniqueOrThrow: async args => { const order = await tx.paymentRequest.findUnique(args); assert.ok(order); return order },
    update: async ({ data }) => { Object.assign(state.order, data); return { ...state.order } },
    updateMany: async ({ where, data }) => { if (!where.status.in.includes(state.order.status)) return { count: 0 }; Object.assign(state.order, data); return { count: 1 } },
  },
}
let queue = Promise.resolve()
prisma.$transaction = work => {
  const result = queue.then(async () => { const before = structuredClone(state); try { return await work(tx) } catch (error) { state = before; throw error } })
  queue = result.catch(() => {}); return result
}
prisma.user.findUniqueOrThrow = tx.user.findUniqueOrThrow
prisma.billingSubscription.findUnique = tx.billingSubscription.findUnique

test('center and teacher prices, discounts and distinct currency amounts', () => {
  assert.equal(billingProduct('CENTER_STUDENT_1').amountUzs, 39999)
  assert.equal(billingProduct('TEACHER_1').amountUzs, 69999)
  assert.equal(billingProduct('TEACHER_1').amountUsd, 599)
  assert.equal(new Set(BILLING_PRODUCTS.map(p => p.code)).size, BILLING_PRODUCTS.length)
  for (const product of BILLING_PRODUCTS) {
    assert.ok(Number.isSafeInteger(product.amountUzs) && product.amountUzs > 0)
    assert.ok(Number.isSafeInteger(product.amountUsd) && product.amountUsd > 0)
    if (product.months > 1) {
      const monthly = billingProduct(`${product.audience}_1`)
      assert.ok(product.amountUzs / product.months < monthly.amountUzs)
      assert.equal(product.coins, monthly.coins * product.months)
    }
  }
  assert.equal(extendBillingExpiry(1, null, new Date('2027-01-31T12:00:00Z')).toISOString(), '2027-02-28T12:00:00.000Z')
})
test('welcome coins are granted once; simultaneous opens charge only once', async () => {
  reset()
  await Promise.all(Array.from({ length: 6 }, () => unlockResource('u', 'test', 'test:reading:sample')))
  assert.equal(state.wallet.balance, 140)
  assert.equal(state.entries.filter(e => e.reason === 'WELCOME').length, 1)
  assert.equal(state.entries.filter(e => e.amount < 0).length, 1)
  assert.ok(state.access[0].expiresAt > new Date())
})
test('media replay is permanent and failed AI returns its reserved coins', async () => {
  reset()
  await unlockResource('u', 'podcast', 'podcast:abcdefghijk')
  assert.equal(state.access[0].expiresAt, null)
  await unlockResource('u', 'podcast', 'podcast:abcdefghijk')
  assert.equal(state.wallet.balance, 145)
  await assert.rejects(withCoinCharge('u', 'writing', async () => { throw new Error('Provider unavailable') }), /Provider unavailable/)
  assert.equal(state.wallet.balance, 145)
  assert.equal(state.entries.reduce((sum, e) => sum + e.amount, 0), state.wallet.balance)
})
test('insufficient balance never invokes the provider or goes negative', async () => {
  reset(); state.wallet = { userId: 'u', balance: 5 }
  let called = false
  await assert.rejects(withCoinCharge('u', 'writing', async () => { called = true }), error => error.code === 'INSUFFICIENT_COINS')
  assert.equal(called, false); assert.equal(state.wallet.balance, 5)
})
test('mock assessments consume included allowances; errors restore allowances', async () => {
  reset(); await unlockResource('u', 'mock', 'mock:ielts:1')
  await assert.rejects(withCoinCharge('u', 'writing', async () => { throw new Error('Failure') }))
  assert.equal(state.access[0].writingLeft, 2)
  await withCoinCharge('u', 'writing', async () => 'OK')
  await withCoinCharge('u', 'speaking', async () => 'OK')
  assert.equal(state.wallet.balance, 100)
  await withCoinCharge('u', 'writing', async () => 'OK')
  assert.equal(state.wallet.balance, 100)
  await withCoinCharge('u', 'writing', async () => 'OK')
  assert.equal(state.wallet.balance, 80)
})
test('student subscriptions and expired teacher subscriptions cannot create classes', async () => {
  reset(); state.subscription = { audience: 'CENTER_STUDENT', expiresAt: new Date(Date.now() + 60000) }
  await assert.rejects(requireTeacherPlan('u'), error => error.code === 'TEACHER_PLAN_REQUIRED')
  state.subscription = { audience: 'TEACHER', expiresAt: new Date(Date.now() - 1) }
  await assert.rejects(requireTeacherPlan('u'), error => error.code === 'TEACHER_PLAN_REQUIRED')
  state.subscription.expiresAt = new Date(Date.now() + 60000)
  await requireTeacherPlan('u')
})
test('replayed payment fulfillment credits one purchase and extends a teacher plan once', async () => {
  reset()
  const product = billingProduct('TEACHER_1')
  state.order = { id: 'order-1', userId: 'u', ...product, plan: product.code, status: 'PENDING' }
  const stale = { ...state.order }
  await Promise.all(Array.from({ length: 4 }, () => prisma.$transaction(tx => fulfillPayment(tx, stale, 'TEST'))))
  assert.equal(state.wallet.balance, 1150)
  assert.equal(state.entries.filter(e => e.key === 'payment:order-1').length, 1)
  assert.equal(state.subscription.audience, 'TEACHER')
})
test('signatures bind amount, action and prepare ID; Stripe rejects tampering and old events', () => {
  const click = { click_trans_id: '1', service_id: '2', merchant_trans_id: 'order', amount: '39999.00', action: '1', merchant_prepare_id: '3', sign_time: 'time' }
  assert.equal(clickSignature(click, 'secret'), createHash('md5').update('12secretorder339999.001time').digest('hex'))
  assert.notEqual(clickSignature(click, 'secret'), clickSignature({ ...click, amount: '1.00' }, 'secret'))
  const raw = Buffer.from('{"amount":599}'); const now = Date.now(); const time = Math.floor(now / 1000)
  const signature = createHmac('sha256', 'secret').update(`${time}.`).update(raw).digest('hex')
  assert.equal(verifyStripeSignature(raw, `t=${time},v1=${signature}`, 'secret', now), true)
  assert.equal(verifyStripeSignature(Buffer.from('{"amount":1}'), `t=${time},v1=${signature}`, 'secret', now), false)
  assert.equal(verifyStripeSignature(raw, `t=${time},v1=${signature}`, 'secret', now + 301000), false)
})
test('Payme callback validates amount, processes once and handles duplicate perform', async () => {
  reset()
  env.AUTOMATED_BILLING_ENABLED = true; env.PAYME_MERCHANT_ID = 'test'; env.PAYME_SECRET_KEY = 'test-key'
  const product = billingProduct('CENTER_STUDENT_1')
  state.order = { id: 'order-1', userId: 'u', ...product, plan: product.code, currency: 'UZS', method: 'PAYME', amountMinor: 3999900,
    status: 'PENDING', providerId: null, providerTime: null, preparedAt: null, performedAt: null, canceledAt: null, cancelReason: null }
  const app = express(); app.post('/stripe', express.raw({ type: 'application/json' }), stripeCallback); app.use(express.json()); app.use(paymentCallbacks)
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve))
  const url = `http://127.0.0.1:${server.address().port}/payme`
  const rpc = async (method, params) => (await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from('Paycom:test-key').toString('base64')}` }, body: JSON.stringify({ id: 1, method, params }) })).json()
  try {
    const account = { order_id: 'order-1' }
    assert.equal((await rpc('CheckPerformTransaction', { account, amount: 1 })).error.code, -31001)
    assert.equal((await rpc('CreateTransaction', { account, amount: 3999900, id: 'tx-1', time: Date.now() })).result.state, 1)
    assert.equal(state.order.status, 'PROCESSING')
    const first = await rpc('PerformTransaction', { id: 'tx-1' }); const second = await rpc('PerformTransaction', { id: 'tx-1' })
    assert.deepEqual(second.result, first.result)
    assert.equal(state.wallet.balance, 750)
    assert.equal((await rpc('CheckTransaction', { id: 'tx-1' })).result.state, 2)
    assert.equal((await rpc('CancelTransaction', { id: 'tx-1', reason: 1 })).error.code, -31007)
  } finally { await new Promise(resolve => server.close(resolve)) }
})

test('Click rejects forged and unprepared callbacks and fulfills a signed order once', async () => {
  reset(); env.AUTOMATED_BILLING_ENABLED = true; env.CLICK_MERCHANT_ID = 'test'; env.CLICK_SERVICE_ID = 'test-service'; env.CLICK_SECRET_KEY = 'test-secret'
  const product = billingProduct('TEACHER_1')
  state.order = { id: 'click-order', userId: 'u', ...product, plan: product.code, currency: 'UZS', method: 'CLICK', amountMinor: 6999900,
    status: 'PENDING', providerId: null, preparedAt: null, providerSequence: 42 }
  const app = express(); app.use(express.json()); app.use(paymentCallbacks)
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve))
  const send = async (action, changes = {}, forged = false) => {
    const body = { click_trans_id: '100', service_id: 'test-service', merchant_trans_id: 'click-order', merchant_prepare_id: '42',
      amount: '69999.00', action, sign_time: '2026-10-06 12:00:00', error: 0, ...changes }
    body.sign_string = forged ? '0'.repeat(32) : clickSignature(body)
    return (await fetch(`http://127.0.0.1:${server.address().port}/click`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()
  }
  try {
    assert.equal((await send('0', {}, true)).error, -1)
    assert.equal((await send('1')).error, -6)
    assert.equal((await send('0', { amount: '1.00' })).error, -2)
    assert.equal((await send('0')).merchant_prepare_id, 42)
    assert.equal((await send('1')).error, 0)
    assert.equal((await send('1')).error, -4)
    assert.equal(state.wallet.balance, 1150)
    assert.equal(state.entries.filter(entry => entry.key === 'payment:click-order').length, 1)
  } finally { await new Promise(resolve => server.close(resolve)) }
})

test('Stripe requires a signed event with exact USD amount and credits replay only once', async () => {
  reset(); env.AUTOMATED_BILLING_ENABLED = true; env.STRIPE_SECRET_KEY = 'test-secret'; env.STRIPE_WEBHOOK_SECRET = 'test-webhook'
  const product = billingProduct('TEACHER_1')
  state.order = { id: 'stripe-order', userId: 'u', ...product, plan: product.code, currency: 'USD', method: 'STRIPE', amountMinor: 599,
    status: 'PENDING', providerId: 'STRIPE:cs_test_order' }
  const app = express(); app.post('/stripe', express.raw({ type: 'application/json' }), stripeCallback)
  app.use((error, req, res, next) => res.status(500).json({ message: error.message }))
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve))
  const send = async (amount = 599, signed = true, paid = true) => {
    const raw = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_order', client_reference_id: 'stripe-order',
      currency: 'usd', amount_total: amount, payment_status: paid ? 'paid' : 'unpaid' } } })
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = createHmac('sha256', 'test-webhook').update(`${timestamp}.${raw}`).digest('hex')
    return fetch(`http://127.0.0.1:${server.address().port}/stripe`, { method: 'POST', headers: { 'Content-Type': 'application/json',
      'Stripe-Signature': signed ? `t=${timestamp},v1=${signature}` : 'invalid' }, body: raw })
  }
  try {
    assert.equal((await send(599, false)).status, 400)
    assert.equal((await send(599, true, false)).status, 200)
    assert.equal(state.wallet, null)
    assert.equal((await send(1)).status, 500)
    assert.equal((await send()).status, 200)
    assert.equal((await send()).status, 200)
    assert.equal(state.wallet.balance, 1150)
    assert.equal(state.entries.filter(entry => entry.key === 'payment:stripe-order').length, 1)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
