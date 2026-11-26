import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/launch_gift_fixture'
process.env.ACCESS_TOKEN_SECRET = 'launch-gift-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET = 'launch-gift-test-refresh-secret-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { launchGiftStats, launchGiftFor, claimLaunchGift } = await import('../dist/services/launchGift.service.js')
const { accountOverview } = await import('../dist/services/billing.service.js')

const NOW = new Date('2026-11-26T10:00:00.000Z')
let gifts, subscriptions, events, transactions
function reset(t, count = 75) {
  t.mock.timers.enable({ apis: ['Date'], now: NOW })
  subscriptions = []; events = []; transactions = 0
  gifts = new Map(Array.from({ length: count }, (_, index) => {
    const userId = `existing-${index + 1}`
    return [userId, { userId, rank: index + 1, claimedAt: null, expiresAt: null, extended: false }]
  }))
}
const tx = {
  $queryRaw: async () => [],
  user: {
    findUnique: async () => ({ referralCode: 'FRIENDCODE' }),
    findUniqueOrThrow: async () => ({ role: 'USER', email: 'learner@example.test', nickname: null }),
  },
  premiumGrant: { findUnique: async () => null },
  premiumEvent: { create: async ({ data }) => { events.push(data); return data } },
  billingSubscription: {
    findMany: async ({ where }) => subscriptions.filter(row => row.userId === where.userId && row.startsAt <= where.startsAt.lte && row.expiresAt > where.expiresAt.gt),
    findUnique: async ({ where: { userId_audience: key } }) => subscriptions.find(row => row.userId === key.userId && row.audience === key.audience) ?? null,
    update: async ({ where, data }) => Object.assign(subscriptions.find(row => row.id === where.id), data),
    upsert: async ({ where: { userId_audience: key }, create, update }) => {
      const current = subscriptions.find(row => row.userId === key.userId && row.audience === key.audience)
      if (current) return Object.assign(current, update)
      const row = { id: `subscription-${subscriptions.length}`, ...create }
      subscriptions.push(row)
      return row
    },
  },
  launchGift: {
    count: async () => gifts.size,
    aggregate: async () => ({ _max: { rank: gifts.size ? Math.max(...Array.from(gifts.values(), gift => gift.rank)) : null } }),
    findUnique: async ({ where }) => gifts.get(where.userId) ?? null,
    findUniqueOrThrow: async ({ where }) => { assert.ok(gifts.has(where.userId)); return gifts.get(where.userId) },
    create: async () => assert.fail('The closed launch campaign cannot issue new gifts'),
    update: async ({ where, data }) => Object.assign(gifts.get(where.userId), data),
  },
}
for (const model of ['launchGift', 'user', 'premiumGrant', 'billingSubscription']) Object.assign(prisma[model], tx[model])
let queue = Promise.resolve()
prisma.$transaction = work => {
  transactions += 1
  const result = queue.then(() => work(tx))
  queue = result.catch(() => {})
  return result
}

test('the closed campaign advertises no available gifts while preserving historical issued counts', async t => {
  reset(t, 208)
  const allGifts = new Map(gifts)
  for (const count of [0, 75, 180, 200, 207, 208]) {
    gifts = new Map(Array.from(allGifts).slice(0, count))
    assert.deepEqual(await launchGiftStats(), { capacity: 300, issued: 208, remaining: 0, valueUsd: 6, months: 1 })
    assert.equal(gifts.size, count, 'reading the counter does not create gifts')
  }
  assert.equal(transactions, 0)
})

test('new accounts remain ineligible on repeated visits even below the old capacity', async t => {
  reset(t, 200)
  const before = structuredClone(gifts)
  for (const userId of ['new-1', 'new-2', 'new-1']) {
    const result = await launchGiftFor(userId)
    assert.deepEqual(result, { capacity: 300, issued: 208, remaining: 0, valueUsd: 6, months: 1,
      eligible: false, rank: null, claimedAt: null, expiresAt: null, extended: false, referralCode: null })
  }
  assert.deepEqual(gifts, before)
  assert.equal(transactions, 0)
})

test('direct and concurrent claims cannot grant Premium to accounts without an existing gift', async t => {
  reset(t)
  const before = structuredClone(gifts)
  const results = await Promise.all(Array.from({ length: 10 }, () => claimLaunchGift('new-account')))
  assert.ok(results.every(result => !result.eligible && result.rank === null && result.remaining === 0))
  assert.deepEqual(gifts, before)
  assert.deepEqual(subscriptions, [])
  assert.deepEqual(events, [])
  assert.equal((await accountOverview('new-account')).tier, 'FREE')
  assert.equal(transactions, 0)
})

test('existing unclaimed gifts retain their eligibility and original rank after closure', async t => {
  reset(t)
  const original = structuredClone(gifts.get('existing-1'))
  const result = await launchGiftFor('existing-1')
  assert.equal(result.eligible, true)
  assert.equal(result.rank, 1)
  assert.equal(result.claimedAt, null)
  assert.equal(result.remaining, 0)
  assert.equal(result.referralCode, 'FRIENDCODE')
  assert.deepEqual(gifts.get('existing-1'), original)
})

test('an existing reservation still activates one month of PRO exactly once', async t => {
  reset(t)
  const results = await Promise.all([claimLaunchGift('existing-1'), claimLaunchGift('existing-1')])
  assert.ok(results.every(result => result.eligible && result.rank === 1 && result.claimedAt === NOW.toISOString()))
  assert.equal(results[0].expiresAt, '2026-12-26T10:00:00.000Z')
  assert.equal(subscriptions.length, 1)
  assert.equal((await accountOverview('existing-1')).tier, 'PRO')
  assert.equal(events.length, 1)
  assert.equal(events[0].source, 'LAUNCH_GIFT')
})

test('claimed gifts and their active Premium subscriptions keep their original expiry', async t => {
  reset(t)
  const claimedAt = new Date('2026-11-10T10:00:00.000Z')
  const expiresAt = new Date('2026-12-10T10:00:00.000Z')
  Object.assign(gifts.get('existing-1'), { claimedAt, expiresAt })
  subscriptions.push({ id: 'old-premium', userId: 'existing-1', audience: 'PRO', plan: 'PRO_1', startsAt: claimedAt, expiresAt })
  const before = structuredClone({ gifts, subscriptions })
  assert.equal((await launchGiftFor('existing-1')).expiresAt, expiresAt.toISOString())
  assert.equal((await claimLaunchGift('existing-1')).expiresAt, expiresAt.toISOString())
  assert.equal((await accountOverview('existing-1')).tier, 'PRO')
  assert.deepEqual({ gifts, subscriptions }, before)
  assert.deepEqual(events, [])
})

test('previously claimed expired gifts do not restart when revisited or claimed again', async t => {
  reset(t)
  const claimedAt = new Date('2026-10-01T10:00:00.000Z')
  const expiresAt = new Date('2026-11-01T10:00:00.000Z')
  Object.assign(gifts.get('existing-1'), { claimedAt, expiresAt })
  subscriptions.push({ id: 'expired-premium', userId: 'existing-1', audience: 'PRO', plan: 'PRO_1', startsAt: claimedAt, expiresAt })
  const before = structuredClone({ gifts, subscriptions })
  await launchGiftFor('existing-1')
  await claimLaunchGift('existing-1')
  assert.deepEqual({ gifts, subscriptions }, before)
  assert.equal((await accountOverview('existing-1')).tier, 'FREE')
  assert.deepEqual(events, [])
})

test('historical ranks beyond the old cap remain visible without reopening issuance', async t => {
  reset(t, 305)
  const allGifts = new Map(gifts)
  for (const count of [209, 299, 300, 305]) {
    gifts = new Map(Array.from(allGifts).slice(0, count))
    assert.deepEqual(await launchGiftStats(), { capacity: Math.max(300, count), issued: count,
      remaining: 0, valueUsd: 6, months: 1 })
  }
  assert.equal((await launchGiftFor('existing-305')).rank, 305)
})
