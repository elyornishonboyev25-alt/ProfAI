import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET ||= 'campaign-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET ||= 'campaign-test-refresh-secret-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { redeemCode } = await import('../dist/services/promo.service.js')
const { claimLaunchGift } = await import('../dist/services/launchGift.service.js')
const { accountOverview } = await import('../dist/services/billing.service.js')

const NOW = new Date('2026-10-31T10:00:00.000Z')
let state
function reset(t) {
  t.mock.timers.enable({ apis: ['Date'], now: NOW })
  state = { subscriptions: [], grant: null, gift: null, redemption: null, failSave: false }
}
const user = { id: 'u', role: 'USER', email: 'ordinary@example.com', nickname: null, referralCode: 'FRIENDCODE' }
const subscription = (audience, expiresAt, startsAt = '2026-10-01T10:00:00Z') => ({
  id: audience, userId: 'u', audience, plan: `${audience}_1`, startsAt: new Date(startsAt), expiresAt: new Date(expiresAt),
})
const tx = {
  $queryRaw: async () => [],
  user: { findUnique: async () => user, findUniqueOrThrow: async () => user },
  premiumGrant: { findUnique: async () => state.grant },
  billingSubscription: {
    findMany: async ({ where }) => state.subscriptions.filter(row => row.expiresAt > where.expiresAt.gt && (!where.startsAt || row.startsAt <= where.startsAt.lte)),
    findUnique: async ({ where }) => state.subscriptions.find(row => row.audience === where.userId_audience.audience) ?? null,
    update: async ({ where, data }) => Object.assign(state.subscriptions.find(row => row.id === where.id), data),
    upsert: async ({ where, create, update }) => {
      const row = state.subscriptions.find(row => row.audience === where.userId_audience.audience)
      if (row) return Object.assign(row, update)
      const created = { id: create.audience, ...create }; state.subscriptions.push(created); return created
    },
  },
  launchGift: {
    findUnique: async () => state.gift,
    findUniqueOrThrow: async () => { assert.ok(state.gift); return state.gift },
    update: async ({ data }) => Object.assign(state.gift, data),
    count: async () => 200,
    aggregate: async () => ({ _max: { rank: 200 } }),
  },
  campaignRedemption: {
    findUnique: async () => state.redemption,
    create: async ({ data }) => {
      if (state.failSave) throw new Error('Save failed')
      assert.equal(state.redemption, null)
      state.redemption = data; return data
    },
  },
}
for (const model of ['user', 'premiumGrant', 'billingSubscription', 'launchGift', 'campaignRedemption']) Object.assign(prisma[model], tx[model])
prisma.promoCode.findUnique = async () => null
let queue = Promise.resolve()
prisma.$transaction = work => {
  const result = queue.then(async () => {
    const before = structuredClone(state)
    try { return await work(tx) } catch (error) { state = before; throw error }
  })
  queue = result.catch(() => {})
  return result
}

test('Firdavss7 gives a Free account three calendar months of PRO, independent of letter case', async t => {
  reset(t)
  const result = await redeemCode('u', ' firdavss7 ')
  assert.deepEqual(result, { ok: true, kind: 'CAMPAIGN', months: 3, startsAt: NOW.toISOString(),
    expiresAt: '2027-01-31T10:00:00.000Z', deferred: false, afterLaunchGift: false })
  assert.equal((await accountOverview('u')).tier, 'PRO')
  assert.equal(state.subscriptions.length, 1)
  assert.equal(state.subscriptions[0].audience, 'PRO')
  assert.equal(state.redemption.code, 'FIRDAVSS7')
})

test('an active launch month stays active and the extra three months follow it without overlap', async t => {
  reset(t)
  state.subscriptions = [subscription('PRO', '2026-11-30T10:00:00Z')]
  state.gift = { userId: 'u', rank: 1, claimedAt: NOW, expiresAt: new Date('2026-11-30T10:00:00Z') }
  const result = await redeemCode('u', 'Firdavss7')
  assert.equal(result.startsAt, '2026-11-30T10:00:00.000Z')
  assert.equal(result.expiresAt, '2027-02-28T10:00:00.000Z')
  assert.equal(result.deferred, true)
  assert.equal(result.afterLaunchGift, true)
  assert.equal(state.subscriptions[0].startsAt.toISOString(), '2026-10-01T10:00:00.000Z')
  const { resolveAccountAccess } = await import('../dist/utils/accessEntitlement.js')
  assert.equal(resolveAccountAccess(null, false, state.subscriptions, new Date('2026-11-30T10:00:00Z')).tier, 'PRO')
  assert.equal(resolveAccountAccess(null, false, state.subscriptions, new Date(result.expiresAt)).tier, 'FREE')
})

test('entering the code before the launch dialog claims the free month still gives one month then three', async t => {
  reset(t)
  state.gift = { userId: 'u', rank: 2, claimedAt: null, expiresAt: null, extended: false }
  const result = await redeemCode('u', 'FIRDAVSS7')
  assert.equal(result.afterLaunchGift, true)
  assert.equal(state.gift.expiresAt.toISOString(), '2026-11-30T10:00:00.000Z')
  assert.equal(result.startsAt, state.gift.expiresAt.toISOString())
  assert.equal(result.expiresAt, '2027-02-28T10:00:00.000Z')
  assert.equal(state.subscriptions[0].startsAt.toISOString(), NOW.toISOString())
  await claimLaunchGift('u')
  assert.equal(state.subscriptions[0].expiresAt.toISOString(), result.expiresAt, 'the delayed launch dialog cannot award another month')
})

test('concurrent or repeated submissions award the campaign only once', async t => {
  reset(t)
  const results = await Promise.all([redeemCode('u', 'FIRDAVSS7'), redeemCode('u', 'Firdavss7')])
  assert.equal(results.filter(result => result.ok).length, 1)
  assert.deepEqual(results.find(result => !result.ok), { ok: false, code: 'ALREADY_USED' })
  assert.equal(state.subscriptions[0].expiresAt.toISOString(), '2027-01-31T10:00:00.000Z')
  assert.deepEqual(await redeemCode('u', 'FIRDAVSS7'), { ok: false, code: 'ALREADY_USED' })
})

test('the reward follows MAX, legacy subscriptions and finite grants without downgrading access', async t => {
  reset(t)
  state.subscriptions = [subscription('PRO', '2026-11-15T10:00:00Z'), subscription('MAX', '2026-12-31T10:00:00Z'), subscription('STUDENT', '2027-01-01T10:00:00Z')]
  state.grant = { plan: 'MAX_3', source: 'OWNER', startsAt: NOW, expiresAt: new Date('2027-02-28T10:00:00Z') }
  const result = await redeemCode('u', 'FIRDAVSS7')
  assert.equal(result.startsAt, '2027-02-28T10:00:00.000Z')
  assert.equal(result.expiresAt, '2027-05-28T10:00:00.000Z')
  assert.equal(result.deferred, true)
  assert.equal(result.afterLaunchGift, false)
  assert.equal((await accountOverview('u')).tier, 'MAX')
  assert.equal(state.subscriptions.find(row => row.audience === 'MAX').expiresAt.toISOString(), '2026-12-31T10:00:00.000Z')
})

test('expired subscriptions restart now and retired welcome trials do not delay PRO', async t => {
  reset(t)
  state.subscriptions = [subscription('PRO', '2026-10-01T10:00:00Z')]
  state.grant = { plan: 'TRIAL_7', source: 'WELCOME', startsAt: NOW, expiresAt: new Date('2027-02-28T10:00:00Z') }
  const result = await redeemCode('u', 'FIRDAVSS7')
  assert.equal(result.deferred, false)
  assert.equal(state.subscriptions[0].startsAt.toISOString(), NOW.toISOString())
  assert.equal((await accountOverview('u')).tier, 'PRO')
})

test('future subscriptions are kept and the campaign follows their full duration', async t => {
  reset(t)
  state.subscriptions = [subscription('PRO', '2027-01-31T10:00:00Z', '2026-12-31T10:00:00Z')]
  const result = await redeemCode('u', 'FIRDAVSS7')
  assert.equal(result.startsAt, '2027-01-31T10:00:00.000Z')
  assert.equal(result.expiresAt, '2027-04-30T10:00:00.000Z')
  assert.equal(state.subscriptions[0].startsAt.toISOString(), '2026-12-31T10:00:00.000Z')
  assert.equal((await accountOverview('u')).tier, 'FREE', 'scheduled paid access must not start early')
})

test('unlimited access remains unlimited', async t => {
  reset(t)
  state.grant = { plan: 'UNLIMITED', source: 'OWNER', startsAt: NOW, expiresAt: null }
  await redeemCode('u', 'FIRDAVSS7')
  assert.equal((await accountOverview('u')).access.kind, 'UNLIMITED')
})

test('a failed redemption save rolls back the subscription extension', async t => {
  reset(t)
  state.failSave = true
  await assert.rejects(redeemCode('u', 'FIRDAVSS7'), /Save failed/)
  assert.equal(state.redemption, null)
  assert.equal(state.subscriptions.length, 0)
})

test('unknown codes still fail validation', async t => {
  reset(t)
  prisma.user.findUnique = async ({ where }) => where.referralCode ? null : user
  assert.deepEqual(await redeemCode('u', 'NONEXISTENT'), { ok: false, code: 'INVALID_CODE' })
  assert.deepEqual(await redeemCode('u', 'BAD'), { ok: false, code: 'INVALID_CODE' })
  assert.equal(state.redemption, null)
})
