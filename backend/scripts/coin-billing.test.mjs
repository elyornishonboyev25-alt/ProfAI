import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { BILLING_PRODUCTS, billingProduct, extendBillingExpiry } from '../dist/utils/billingCatalog.js'

process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET ||= 'billing-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET ||= 'billing-test-refresh-secret-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { env } = await import('../dist/config/env.js')
const { unlockResource, accessStatus, withCoinCharge, fulfillPayment, requireTeacherPlan } = await import('../dist/services/coinBilling.service.js')
const { describeAccess, FREE_TRIAL_DAYS } = await import('../dist/utils/accessEntitlement.js')
const { clickSignature, verifyStripeSignature } = await import('../dist/services/paymentProviders.service.js')
const { paymentCallbacks, stripeCallback } = await import('../dist/routes/paymentCallbacks.routes.js')
const { default: express } = await import('express')
const { parseDollarRate, createPaymentQuote, verifyPaymentQuote, dollarRate } = await import('../dist/services/billingQuote.service.js')

let state
function reset() { state = { wallet: null, entries: [], access: [], subscription: null, order: null, role: 'USER', email: 'ordinary@example.com', grant: null } }
reset()
const active = access => !access.expiresAt || access.expiresAt > new Date()
const tx = {
  $queryRaw: async () => [],
  user: { findUniqueOrThrow: async () => ({ role: state.role, email: state.email, nickname: null }) },
  premiumGrant: { findUnique: async () => state.grant },
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
prisma.premiumGrant.findUnique = tx.premiumGrant.findUnique
prisma.billingSubscription.findUnique = tx.billingSubscription.findUnique

test('selected unlimited grants keep test, media and AI access free with a zero balance', async () => {
  for (const email of ['aysunabbaszad0@gmail.com', 'oguzmemmedli123@gmail.com', 'wiynsara@gmail.com', 'bahadyrazat@gmail.com']) {
    reset(); state.email = email; state.wallet = { userId: 'u', balance: 0 }
    state.grant = { plan: 'UNLIMITED', source: 'SELECTED_ACCESS', startsAt: new Date(Date.now() - 1000), expiresAt: null }
    for (const [feature, resource] of [['test', 'test:reading:sample'], ['mock', 'mock:ielts:1'], ['podcast', 'podcast:abcdefghijk'], ['shadowing', 'shadowing:abcdefghijk']]) {
      assert.equal((await accessStatus('u', feature, resource)).unlocked, true)
      assert.equal((await unlockResource('u', feature, resource)).charged, 0)
    }
    for (const feature of ['writing', 'speaking', 'voice', 'ai']) assert.equal(await withCoinCharge('u', feature, async () => 'included'), 'included')
    await requireTeacherPlan('u')
    assert.equal(state.wallet.balance, 0)
    assert.equal(state.entries.length, 0)
    assert.equal(state.role, 'USER')
  }
})

test('14-day trial ends exactly at expiry and cannot inherit permanent nickname access', () => {
  const startsAt = new Date('2026-10-06T09:00:00Z')
  const expiresAt = new Date(startsAt.getTime() + FREE_TRIAL_DAYS * 86400000)
  const grant = { plan: 'TRIAL_14', source: 'SELECTED_ACCESS', startsAt, expiresAt }
  assert.equal(describeAccess(grant, false, startsAt).daysRemaining, 14)
  assert.equal(describeAccess(grant, false, new Date(expiresAt.getTime() - 1)).active, true)
  assert.deepEqual(describeAccess(grant, true, expiresAt), { kind: 'TRIAL', active: false, startsAt: startsAt.toISOString(), expiresAt: expiresAt.toISOString(), trialDays: 14, daysRemaining: 0 })
  assert.equal(describeAccess(grant, false, new Date(startsAt.getTime() - 1)).active, false)
  assert.equal(grant.expiresAt.toISOString(), '2026-10-20T09:00:00.000Z')
})

test('trial use preserves its dates and coins; expired trials restore paid access checks', async () => {
  reset(); state.email = 'usarovajasmin@gmail.com'; state.wallet = { userId: 'u', balance: 0 }
  state.grant = { plan: 'TRIAL_14', source: 'SELECTED_ACCESS', startsAt: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + 86400000) }
  const initialDates = [state.grant.startsAt.toISOString(), state.grant.expiresAt.toISOString()]
  for (let i = 0; i < 3; i++) {
    const status = await accessStatus('u', 'mock', 'mock:ielts:1')
    assert.equal(status.unlocked, true)
    assert.equal(status.expiresAt, state.grant.expiresAt.toISOString())
    await withCoinCharge('u', 'writing', async () => 'included')
  }
  await requireTeacherPlan('u')
  assert.deepEqual([state.grant.startsAt.toISOString(), state.grant.expiresAt.toISOString()], initialDates)
  assert.equal(state.wallet.balance, 0)
  state.grant.expiresAt = new Date(Date.now() - 1)
  assert.equal((await accessStatus('u', 'mock', 'mock:ielts:1')).unlocked, false)
  let called = false
  await assert.rejects(withCoinCharge('u', 'speaking', async () => { called = true }), error => error.code === 'INSUFFICIENT_COINS')
  assert.equal(called, false)
  await assert.rejects(requireTeacherPlan('u'), error => error.code === 'TEACHER_PLAN_REQUIRED')
  assert.equal(state.wallet.balance, 0)
})

test('Individual, Classes and Teacher have distinct USD prices and exact period totals', () => {
  assert.equal(billingProduct('CENTER_STUDENT_1').amountUsd, 400)
  assert.equal(billingProduct('LEARNER_1').amountUsd, 600)
  assert.equal(billingProduct('TEACHER_1').amountUsd, 800)
  assert.equal(billingProduct('LEARNER_12').amountUsd, 5760)
  assert.equal(billingProduct('TEACHER_12').amountUsd, 7680)
  assert.equal(billingProduct('CENTER_STUDENT_12').amountUsd, 3840)
  assert.equal(billingProduct('LEARNER_3').amountUsd, 1620)
  assert.equal(billingProduct('TEACHER_3').amountUsd, 2160)
  assert.equal(billingProduct('CENTER_STUDENT_3').amountUsd, 1080)
  assert.equal(new Set(BILLING_PRODUCTS.map(p => p.code)).size, BILLING_PRODUCTS.length)
  for (const product of BILLING_PRODUCTS) {
    assert.ok(Number.isSafeInteger(product.amountUsd) && product.amountUsd > 0)
    if (product.months > 1) {
      const monthly = billingProduct(`${product.audience}_1`)
      assert.ok(product.amountUsd / product.months < monthly.amountUsd)
      assert.equal(product.coins, monthly.coins * product.months)
    }
  }
  assert.equal(extendBillingExpiry(1, null, new Date('2027-01-31T12:00:00Z')).toISOString(), '2027-02-28T12:00:00.000Z')
})
test('UZS checkout converts the complete USD invoice and binds the displayed amount for 15 minutes', () => {
  const now = Date.parse('2026-10-06T09:00:00Z')
  const rate = parseDollarRate([{ Ccy: 'USD', Nominal: '1', Rate: '13100.00', Date: '06.10.2026' }], now)
  for (const product of BILLING_PRODUCTS) {
    const quote = createPaymentQuote(product, rate, now)
    assert.equal(quote.amountUzs, Math.round(product.amountUsd * 13100 / 100))
    assert.equal(verifyPaymentQuote(quote.token, product, now + 899999).amountUzs, quote.amountUzs)
    assert.throws(() => verifyPaymentQuote(quote.token, product, now + 900000), error => error.code === 'QUOTE_EXPIRED')
    assert.throws(() => verifyPaymentQuote(quote.token, { ...product, amountUsd: product.amountUsd + 1 }, now), error => error.code === 'QUOTE_EXPIRED')
    assert.throws(() => verifyPaymentQuote(quote.token + 'x', product, now), error => error.code === 'QUOTE_EXPIRED')
  }
  const teacher = billingProduct('TEACHER_1')
  const quote = createPaymentQuote(teacher, rate, now)
  assert.equal(quote.amountUzs, 104800)
  assert.throws(() => verifyPaymentQuote(quote.token, billingProduct('CENTER_STUDENT_1'), now), error => error.code === 'QUOTE_EXPIRED')
  const [payload, signature] = quote.token.split('.')
  const forged = JSON.parse(Buffer.from(payload, 'base64url').toString()); forged.amountUzs = 1
  assert.throws(() => verifyPaymentQuote(Buffer.from(JSON.stringify(forged)).toString('base64url') + '.' + signature, teacher, now), error => error.code === 'QUOTE_EXPIRED')
  for (const change of [{ Rate: 'NaN' }, { Nominal: '0' }, { Date: '01.09.2026' }, { Date: '07.10.2026' }, { Date: '31.02.2026' }]) {
    assert.throws(() => parseDollarRate([{ Ccy: 'USD', Nominal: '1', Rate: '13100', Date: '06.10.2026', ...change }], now))
  }
})
test('rate fetches share one request, refresh after an hour and block UZS when the official source fails', async () => {
  const originalFetch = globalThis.fetch, originalNow = Date.now
  let now = Date.parse('2026-10-06T09:00:00Z'), calls = 0, unavailable = false
  Date.now = () => now
  globalThis.fetch = async url => {
    assert.equal(url, 'https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/')
    calls++
    if (unavailable) throw new Error('Offline')
    return { ok: true, json: async () => [{ Ccy: 'USD', Nominal: '1', Rate: '11778.45', Date: '06.10.2026' }] }
  }
  try {
    const values = await Promise.all(Array.from({ length: 4 }, () => dollarRate()))
    assert.ok(values.every(rate => rate.rate === 11778.45))
    assert.equal(calls, 1)
    await dollarRate(); assert.equal(calls, 1)
    now += 3600001
    await dollarRate(); assert.equal(calls, 2)
    now += 3600001; unavailable = true
    await assert.rejects(dollarRate(), error => error.code === 'RATE_UNAVAILABLE')
    await assert.rejects(dollarRate(), error => error.code === 'RATE_UNAVAILABLE')
    assert.equal(calls, 3, 'failure cooldown prevents repeat requests and stale prices')
    now += 30001; unavailable = false
    assert.equal((await dollarRate()).rate, 11778.45)
    assert.equal(calls, 4)
  } finally { globalThis.fetch = originalFetch; Date.now = originalNow }
})
test('welcome coins are granted once; simultaneous opens charge only once', async () => {
  reset()
  await Promise.all(Array.from({ length: 6 }, () => unlockResource('u', 'test', 'test:reading:sample')))
  assert.equal(state.wallet.balance, 145)
  assert.equal(state.entries.filter(e => e.reason === 'WELCOME').length, 1)
  assert.equal(state.entries.filter(e => e.amount < 0).length, 1)
  assert.ok(Math.abs(state.access[0].expiresAt.getTime() - Date.now() - 7 * 86400000) < 1000)
  state.access[0].expiresAt = new Date(Date.now() - 1)
  await unlockResource('u', 'test', 'test:reading:sample')
  assert.equal(state.wallet.balance, 140)
})
test('media replay is permanent and failed AI returns its reserved coins', async () => {
  reset()
  await unlockResource('u', 'podcast', 'podcast:abcdefghijk')
  assert.equal(state.access[0].expiresAt, null)
  await unlockResource('u', 'podcast', 'podcast:abcdefghijk')
  assert.equal(state.wallet.balance, 148)
  await assert.rejects(withCoinCharge('u', 'writing', async () => { throw new Error('Provider unavailable') }), /Provider unavailable/)
  assert.equal(state.wallet.balance, 148)
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
  assert.equal(state.wallet.balance, 125)
  await withCoinCharge('u', 'writing', async () => 'OK')
  assert.equal(state.wallet.balance, 125)
  await withCoinCharge('u', 'writing', async () => 'OK')
  assert.equal(state.wallet.balance, 115)
})
test('student subscriptions and expired teacher subscriptions cannot create classes', async () => {
  reset(); state.subscription = { audience: 'CENTER_STUDENT', expiresAt: new Date(Date.now() + 60000) }
  await assert.rejects(requireTeacherPlan('u'), error => error.code === 'TEACHER_PLAN_REQUIRED')
  state.subscription = { audience: 'TEACHER', expiresAt: new Date(Date.now() - 1) }
  await assert.rejects(requireTeacherPlan('u'), error => error.code === 'TEACHER_PLAN_REQUIRED')
  state.subscription.expiresAt = new Date(Date.now() + 60000)
  await requireTeacherPlan('u')
  state.subscription.audience = 'LEARNER'
  await assert.rejects(requireTeacherPlan('u'), error => error.code === 'TEACHER_PLAN_REQUIRED')
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
