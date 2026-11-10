import test from 'node:test'
import assert from 'node:assert/strict'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/premium_fixture'
process.env.ACCESS_TOKEN_SECRET = 'premium-fixture-access-secret-only'
process.env.REFRESH_TOKEN_SECRET = 'premium-fixture-refresh-secret-only'
const { ownerPremiumSummary } = await import('../dist/services/premiumHistory.service.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { default: router } = await import('../dist/routes/billing.routes.js')
const { fulfillPayment } = await import('../dist/services/billing.service.js')
const { grantAccessDays } = await import('../dist/services/referral.service.js')
const now = new Date('2026-11-10T14:00:00Z')
const past = new Date('2026-11-01T14:00:00Z')
const future = new Date('2026-12-01T14:00:00Z')
const actor = { id: 'admin-1', fullName: 'Premium Admin', email: 'premium-admin@example.test' }
const user = extra => ({ id: 'u', fullName: 'Learner', email: 'learner@example.test', nickname: null, role: 'USER', createdAt: past,
  premiumGrant: null, premiumEvents: [], billingSubscriptions: [], launchGift: null, promoCode: null, campaignRedemptions: [], referralRewards: [], referralReceived: null, paymentRequests: [], ...extra })
const subscription = extra => ({ id: 'sub', userId: 'u', audience: 'PRO', plan: 'PRO_1', startsAt: past, expiresAt: future, ...extra })
const summary = (extra, at = now) => ownerPremiumSummary(user(extra), new Map([[actor.id, actor]]), at)

test('owner status uses the same subscription dates and tier as actual access; scheduled, expired and fixed accounts stay distinct', () => {
  const active = summary({ billingSubscriptions: [subscription()] })
  assert.equal(active.access.active, true); assert.equal(active.access.tier, 'PRO'); assert.equal(active.premiumStatus, 'ACTIVE')
  assert.equal(active.access.expiresAt, future.toISOString()); assert.equal(active.premiumHistory.length, 0, 'a plan code alone cannot prove its source')
  assert.equal(summary({ billingSubscriptions: [subscription({ startsAt: future, expiresAt: new Date('2027-01-01') })] }).premiumStatus, 'SCHEDULED')
  assert.equal(summary({ billingSubscriptions: [subscription()] }, future).premiumStatus, 'EXPIRED', 'expiry is exclusive')
  assert.equal(summary({}).premiumStatus, 'NONE')
  assert.equal(summary({ role: 'ADMIN' }).fixedPremium, true)
  assert.equal(summary({ billingSubscriptions: [subscription(), subscription({ audience: 'MAX', plan: 'MAX_3' })] }).access.tier, 'MAX')
})

test('historical gifts retain their real rank, reserved gifts do not imply access, and campaign benefits have exact dates', () => {
  const gift = { rank: 181, claimedAt: past, expiresAt: future }
  const data = summary({ launchGift: gift, billingSubscriptions: [subscription()], campaignRedemptions: [{ code: 'FIRDAVSS7', months: 3, startsAt: future, expiresAt: new Date('2027-03-01'), createdAt: now }] })
  const launch = data.premiumHistory.find(event => event.source === 'LAUNCH_GIFT')
  assert.equal(launch.giftRank, 181); assert.equal(launch.months, 1); assert.equal(launch.createdAt, past)
  assert.equal(launch.startsAt, null, 'do not invent an old gift start time from its expiry')
  const campaign = data.premiumHistory.find(event => event.promoCode === 'FIRDAVSS7')
  assert.equal(campaign.months, 3); assert.equal(campaign.startsAt, future); assert.equal(campaign.expiryKnown, true)
  const reserved = summary({ launchGift: { ...gift, claimedAt: null } })
  assert.equal(reserved.access.active, false); assert.equal(reserved.premiumHistory.length, 0); assert.equal(reserved.launchGift.rank, 181)
})

test('approved orders show their own promo, charged amount and reviewer, without attributing the account promo to a payment', () => {
  const order = { id: 'paid', plan: 'MAX_3', months: 3, createdAt: past, performedAt: now, reviewedBy: actor.id,
    reference: 'promo:SAVE20', discountPercent: 28, promoDiscountMinor: 600, wheelSpinId: 'wheel-10', currency: 'USD', amountMinor: 2399, amountUzs: 0, method: 'CARD_TRANSFER' }
  const data = summary({ paymentRequests: [order], promoCode: { code: 'ACCOUNT7', days: 7, redeemedAt: past } })
  const paid = data.premiumHistory.find(event => event.source === 'PAYMENT')
  assert.equal(paid.promoCode, 'SAVE20'); assert.equal(paid.actorName, actor.fullName); assert.equal(paid.actorEmail, actor.email)
  assert.equal(paid.amountMinor, 2399); assert.equal(paid.promoDiscountMinor, 600); assert.equal(paid.discountPercent, 28); assert.equal(paid.wheelSpinId, 'wheel-10')
  assert.equal(paid.expiryKnown, false, 'a current subscription expiry is not the historic order expiry')
  assert.equal(data.premiumHistory.find(event => event.promoCode === 'ACCOUNT7').days, 7)
  assert.equal(summary({ paymentRequests: [{ ...order, reference: null }] }).premiumHistory[0].promoCode, null)
})

let events, subscriptions, grant, order, failAudit
function reset() { events = []; subscriptions = []; grant = null; order = null; failAudit = false }
const createEvent = async ({ data }) => {
  if (failAudit) throw new Error('History unavailable')
  const event = { id: `event-${events.length}`, createdAt: new Date(), originKey: null, expiresAt: null, actorId: null, actorName: null, actorEmail: null, revokedAt: null,
    months: null, days: null, promoCode: null, giftRank: null, currency: null, amountMinor: null, discountPercent: null, promoDiscountMinor: null, wheelSpinId: null, method: null, ...data }
  events.push(event); return event
}
const tx = {
  $queryRaw: async () => [],
  user: { findUnique: async ({ where }) => where.id === actor.id ? actor : user({}), findUniqueOrThrow: async () => user({}) },
  premiumEvent: { create: createEvent, findFirst: async ({ where }) => events.find(event => event.plan === where.plan && +event.createdAt === +where.createdAt) ?? null,
    updateMany: async ({ data }) => { events.filter(event => event.source !== 'REVOKED' && (!event.expiresAt || event.expiresAt > data.revokedAt)).forEach(event => Object.assign(event, data)); return { count: events.length } } },
  premiumGrant: { findUnique: async () => grant, upsert: async ({ create, update }) => grant = grant ? { ...grant, ...update } : create, deleteMany: async () => { grant = null } },
  billingSubscription: {
    findMany: async () => subscriptions,
    findUnique: async ({ where }) => subscriptions.find(row => row.audience === where.userId_audience.audience) ?? null,
    upsert: async ({ where, create, update }) => { const row = subscriptions.find(row => row.audience === where.userId_audience.audience); if (row) return Object.assign(row, update); subscriptions.push(create); return create },
    deleteMany: async () => { subscriptions = [] },
  },
  freeTrial: { findUnique: async () => null },
  wheelSpin: { updateMany: async () => ({ count: 1 }) },
  paymentRequest: { updateMany: async ({ data }) => { if (order.status === 'APPROVED') return { count: 0 }; Object.assign(order, data); return { count: 1 } } },
}
prisma.user.findUnique = tx.user.findUnique
prisma.$transaction = async work => { const saved = structuredClone({ events, subscriptions, grant, order }); try { return await work(tx) } catch (error) { ({ events, subscriptions, grant, order } = saved); throw error } }
const call = (method, path, body = {}) => new Promise((resolve, reject) => {
  const route = router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route
  let status = 200
  route.stack.at(-1).handle({ user: { id: actor.id }, params: { id: 'u' }, body, query: body }, { status(value) { status = value; return this }, json(body) { resolve({ status, body }) } }, reject)
})

test('admin grants record the actor and added duration, renew from expiry, and distinguish manual payments', async t => {
  reset(); t.mock.timers.enable({ apis: ['Date'], now })
  assert.equal((await call('put', '/owner/users/:id/grant', { plan: 'PRO_1' })).status, 200)
  assert.equal(events[0].source, 'OWNER'); assert.equal(events[0].actorName, actor.fullName); assert.equal(events[0].actorEmail, actor.email)
  assert.equal(events[0].months, 1); assert.equal(+events[0].createdAt, +now)
  const firstExpiry = subscriptions[0].expiresAt
  await call('put', '/owner/users/:id/grant', { plan: 'PRO_3', source: 'PAYMENT', amountUzs: 200000 })
  assert.equal(events.length, 2); assert.equal(events[1].source, 'PAYMENT'); assert.equal(events[1].amountMinor, 20000000)
  assert.equal(+events[1].startsAt, +firstExpiry); assert.equal(events[1].months, 3)
  assert.equal(events[1].method, 'CARD_TRANSFER'); assert.equal(+subscriptions[0].startsAt, +now)
  const data = summary({ billingSubscriptions: subscriptions, premiumEvents: events })
  assert.equal(data.premiumHistory.length, 2); assert.equal(data.access.active, true)
  for (const body of [{ plan: 'INVALID' }, { plan: 'PRO_1', source: 'PAYMENT' }, { plan: 'PRO_1', source: 'PAYMENT', amountUzs: 0 }]) assert.equal((await call('put', '/owner/users/:id/grant', body)).status, 400)
  assert.equal(events.length, 2)
})

test('unlimited and legacy alias grants remain supported and audit failure rolls access back', async t => {
  reset(); t.mock.timers.enable({ apis: ['Date'], now })
  await call('put', '/owner/users/:id/grant', { plan: 'MONTHLY' })
  assert.equal(subscriptions[0].plan, 'PRO_1')
  await call('put', '/owner/users/:id/grant', { plan: 'UNLIMITED' })
  assert.equal(grant.expiresAt, null); assert.equal(events[1].plan, 'UNLIMITED')
  reset(); failAudit = true
  await assert.rejects(call('put', '/owner/users/:id/grant', { plan: 'MAX_12' }), /History unavailable/)
  assert.equal(subscriptions.length, 0); assert.equal(events.length, 0)
})

test('revoke removes access but retains sources and records the revoking admin; old grant identity survives', async t => {
  reset(); t.mock.timers.enable({ apis: ['Date'], now })
  await call('put', '/owner/users/:id/grant', { plan: 'MAX_1' })
  assert.equal((await call('delete', '/owner/users/:id/grant')).status, 200)
  assert.equal(subscriptions.length, 0); assert.equal(events.length, 2)
  assert.equal(+events[0].revokedAt, +now); assert.equal(events[1].source, 'REVOKED'); assert.equal(events[1].actorEmail, actor.email)
  assert.equal(summary({ premiumEvents: events }).access.active, false)
  reset(); grant = { userId: 'u', plan: 'MONTHLY', source: 'OWNER', grantedBy: actor.id, startsAt: past, expiresAt: future }
  await call('delete', '/owner/users/:id/grant')
  assert.equal(grant, null); assert.equal(events.find(event => event.source === 'OWNER').actorName, actor.fullName)
})

test('provider fulfillment is audited once with exact checkout benefit, while free day codes keep their own origin', async t => {
  reset(); t.mock.timers.enable({ apis: ['Date'], now })
  order = { id: 'paid-order', userId: 'u', audience: 'MAX', plan: 'MAX_3', months: 3, status: 'PENDING', method: 'STRIPE', reference: 'promo:SAVE20', currency: 'USD', amountMinor: 2399, amountUzs: 0, discountPercent: 28, promoDiscountMinor: 600, wheelSpinId: 'wheel-10' }
  const stale = { ...order }
  assert.equal(await fulfillPayment(tx, stale, 'STRIPE'), true)
  assert.equal(await fulfillPayment(tx, stale, 'STRIPE'), false)
  assert.equal(events.length, 1); assert.equal(events[0].actorId, null); assert.equal(events[0].promoCode, 'SAVE20'); assert.equal(events[0].promoDiscountMinor, 600)
  await grantAccessDays(tx, 'u', 7, now, { source: 'PROMO', originKey: 'promo:ACCOUNT7', promoCode: 'ACCOUNT7' })
  assert.equal(events[1].source, 'PROMO'); assert.equal(events[1].days, 7); assert.equal(events[1].promoCode, 'ACCOUNT7')
})

test('admin renewals preserve the remaining time on legacy grants and subscriptions, and show the furthest expiry at the same tier', async t => {
  reset(); t.mock.timers.enable({ apis: ['Date'], now })
  grant = { userId: 'u', plan: 'MONTHLY', source: 'OWNER', grantedBy: actor.id, startsAt: past, expiresAt: future }
  await call('put', '/owner/users/:id/grant', { plan: 'PRO_1' })
  assert.equal(+events[0].startsAt, +future)
  assert.equal(subscriptions[0].expiresAt.toISOString(), '2027-01-01T14:00:00.000Z')
  assert.equal(summary({ premiumGrant: grant, premiumEvents: events, billingSubscriptions: subscriptions }).access.expiresAt, '2027-01-01T14:00:00.000Z')
  reset(); subscriptions = [subscription({ audience: 'STUDENT', plan: 'REFERRAL' })]
  await call('put', '/owner/users/:id/grant', { plan: 'PRO_1' })
  assert.equal(+events[0].startsAt, +future)
  assert.equal(summary({ billingSubscriptions: subscriptions, premiumEvents: events }).access.expiresAt, '2027-01-01T14:00:00.000Z')
})

test('owner list returns the resolved entitlement and source history without leaking unrelated account data', async () => {
  reset()
  const record = user({ billingSubscriptions: [subscription()], launchGift: { rank: 199, claimedAt: past, expiresAt: future } })
  prisma.user.count = async () => 1
  prisma.user.findMany = async args => {
    assert.ok(args.select.premiumEvents); assert.ok(args.select.launchGift)
    assert.equal(args.select.passwordHash, undefined)
    return [record]
  }
  const result = await call('get', '/owner/users')
  assert.equal(result.status, 200); assert.equal(result.body.items[0].access.active, true)
  assert.equal(result.body.items[0].premiumHistory[0].giftRank, 199)
  assert.equal(result.body.items[0].passwordHash, undefined); assert.equal(result.body.items[0].paymentRequests, undefined)
})
