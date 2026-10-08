import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { BILLING_PRODUCTS, billingProduct, extendBillingExpiry } from '../dist/utils/billingCatalog.js'
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET ||= 'billing-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET ||= 'billing-test-refresh-secret-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { env } = await import('../dist/config/env.js')
const { accountOverview, unlockResource, accessStatus, withStudyAccess, fulfillPayment, requireTeacherPlan, requireClassPlan } = await import('../dist/services/billing.service.js')
const { describeAccess, resolveAccountAccess, FREE_TRIAL_DAYS } = await import('../dist/utils/accessEntitlement.js')
const { clickSignature, verifyStripeSignature } = await import('../dist/services/paymentProviders.service.js')
const { paymentCallbacks, stripeCallback } = await import('../dist/routes/paymentCallbacks.routes.js')
const { default: express } = await import('express')
const { parseDollarRate, createPaymentQuote, verifyPaymentQuote, dollarRate } = await import('../dist/services/billingQuote.service.js')
let state
function reset() { state = { subscription: null, order: null, role: 'USER', email: 'ordinary@example.com', nickname: null, grant: null,
  trial: { startsAt: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + FREE_TRIAL_DAYS * 86400000 - 1000) } } }
reset()
const tx = {
  $queryRaw: async () => [],
  user: { findUniqueOrThrow: async () => ({ role: state.role, email: state.email, nickname: state.nickname }) },
  premiumGrant: { findUnique: async () => state.grant },
  freeTrial: { findUnique: async ({ where }) => { assert.equal(where.email, state.email.trim().toLowerCase()); return state.trial } },
  billingSubscription: {
    findMany: async ({ where }) => state.subscription && state.subscription.startsAt <= where.startsAt.lte && state.subscription.expiresAt > where.expiresAt.gt ? [state.subscription] : [],
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
for (const model of ['user', 'premiumGrant', 'freeTrial', 'billingSubscription']) Object.assign(prisma[model], tx[model])

test('one student price and teacher price, with no individual or coin products', () => {
  assert.equal(billingProduct('STUDENT_1').amountUsd, 300)
  assert.equal(billingProduct('TEACHER_1').amountUsd, 500)
  assert.equal(billingProduct('STUDENT_3').amountUsd, 810)
  assert.equal(billingProduct('TEACHER_3').amountUsd, 1350)
  assert.equal(billingProduct('STUDENT_12').amountUsd, 2880)
  assert.equal(billingProduct('TEACHER_12').amountUsd, 4800)
  for (const retired of ['LEARNER_1', 'CENTER_STUDENT_1', 'COINS_150']) assert.equal(billingProduct(retired), undefined)
  assert.equal(BILLING_PRODUCTS.length, 6)
  assert.equal(extendBillingExpiry(1, null, new Date('2027-01-31T12:00:00Z')).toISOString(), '2027-02-28T12:00:00.000Z')
})
test('trial expires exactly after seven days and remains expired on repeated logins', async () => {
  reset()
  const startsAt = new Date('2026-10-08T09:00:00Z'), expiresAt = new Date('2026-10-15T09:00:00Z')
  state.trial = { startsAt, expiresAt }
  const grant = { ...state.trial, plan: 'TRIAL_7', source: 'WELCOME' }
  assert.equal(describeAccess(grant, false, startsAt).daysRemaining, 7)
  assert.equal(describeAccess(grant, false, new Date(expiresAt.getTime() - 1)).active, true)
  assert.equal(describeAccess(grant, false, expiresAt).active, false)
  for (let i = 0; i < 4; i++) {
    const overview = await accountOverview('u', tx, expiresAt)
    assert.equal(overview.access.active, false)
    assert.equal(overview.access.expiresAt, expiresAt.toISOString())
  }
  assert.equal(state.trial.startsAt, startsAt)
  assert.equal(state.trial.expiresAt, expiresAt)
})
test('active trial includes tests, mocks and AI but cannot join or create classes', async () => {
  reset()
  for (const [feature, resource] of [['test', 'test:listening:sample'], ['test', 'test:reading:sample'], ['mock', 'mock:sat:1']]) {
    assert.equal((await accessStatus('u', feature, resource)).unlocked, true)
    await unlockResource('u', feature, resource)
  }
  for (const feature of ['writing', 'speaking', 'voice', 'ai']) assert.equal(await withStudyAccess('u', feature, async () => 'included'), 'included')
  await assert.rejects(requireClassPlan('u'), e => e.code === 'CLASS_PLAN_REQUIRED')
  await assert.rejects(requireTeacherPlan('u'), e => e.code === 'TEACHER_PLAN_REQUIRED')
})
test('expired trial blocks every AI provider and tests without invoking providers', async () => {
  reset(); state.trial.expiresAt = new Date(Date.now() - 1)
  assert.equal((await accessStatus('u', 'mock', 'mock:ielts:1')).unlocked, false)
  await assert.rejects(unlockResource('u', 'test', 'test:listening:sample'), e => e.code === 'PREMIUM_REQUIRED')
  for (const feature of ['writing', 'speaking', 'voice', 'ai']) {
    let called = false
    await assert.rejects(withStudyAccess('u', feature, async () => { called = true }), e => e.code === 'PREMIUM_REQUIRED')
    assert.equal(called, false)
  }
})
test('paid student access survives trial expiry, joins classes and cannot create them', async () => {
  reset(); state.trial.expiresAt = new Date(Date.now() - 1)
  state.subscription = { audience: 'STUDENT', startsAt: new Date(Date.now() - 60000), expiresAt: new Date(Date.now() + 60000) }
  assert.equal((await accountOverview('u')).access.kind, 'PREMIUM')
  assert.equal((await accessStatus('u', 'test', 'test:sat:1')).unlocked, true)
  await requireClassPlan('u')
  await assert.rejects(requireTeacherPlan('u'), e => e.code === 'TEACHER_PLAN_REQUIRED')
  state.subscription.audience = 'TEACHER'; await requireTeacherPlan('u')
  state.subscription.expiresAt = new Date(Date.now() - 1)
  await assert.rejects(requireClassPlan('u'), e => e.code === 'CLASS_PLAN_REQUIRED')
  assert.equal((await accountOverview('u')).access.active, false)
})
test('existing premium and legacy subscriptions retain full access', async () => {
  reset(); state.trial = null
  state.grant = { plan: 'UNLIMITED', source: 'SELECTED_ACCESS', startsAt: new Date(Date.now() - 1000), expiresAt: null }
  assert.equal((await accountOverview('u')).access.kind, 'UNLIMITED')
  await requireTeacherPlan('u'); await requireClassPlan('u')
  for (const audience of ['LEARNER', 'CENTER_STUDENT', 'TEACHER']) {
    state.grant = null
    state.subscription = { audience, startsAt: new Date(Date.now() - 1000), expiresAt: new Date(Date.now() + 60000) }
    assert.equal((await accountOverview('u')).access.active, true)
    await requireClassPlan('u')
  }
})
test('paid subscription takes priority over a trial without changing trial dates', () => {
  const now = new Date('2026-10-08T09:00:00Z'), expiresAt = new Date('2026-10-15T09:00:00Z')
  const trial = { startsAt: now, expiresAt }
  const paid = { startsAt: now, expiresAt: new Date('2026-11-08T09:00:00Z') }
  assert.equal(resolveAccountAccess(null, false, [paid], trial, now).kind, 'PREMIUM')
  assert.equal(resolveAccountAccess(null, false, [], trial, expiresAt).active, false)
  assert.equal(trial.expiresAt, expiresAt)
})
test('replayed payment fulfillment extends a subscription exactly once', async () => {
  reset()
  const product = billingProduct('TEACHER_1')
  state.order = { id: 'order-1', userId: 'u', ...product, plan: product.code, status: 'PENDING' }
  const stale = { ...state.order }
  const results = await Promise.all(Array.from({ length: 4 }, () => prisma.$transaction(tx => fulfillPayment(tx, stale, 'TEST'))))
  assert.equal(results.filter(Boolean).length, 1)
  assert.equal(state.subscription.audience, 'TEACHER')
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
  assert.equal(quote.amountUzs, 65500)
  assert.throws(() => verifyPaymentQuote(quote.token, billingProduct('STUDENT_1'), now), error => error.code === 'QUOTE_EXPIRED')
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
  const product = billingProduct('STUDENT_1')
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
    assert.equal(state.subscription.audience, product.audience)
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
    assert.equal(state.subscription.audience, product.audience)
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
    assert.equal(state.subscription, null)
    assert.equal((await send(1)).status, 500)
    assert.equal((await send()).status, 200)
    assert.equal((await send()).status, 200)
    assert.equal(state.subscription.audience, product.audience)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
