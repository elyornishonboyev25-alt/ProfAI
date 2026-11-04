import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/launch_gift_fixture'
process.env.ACCESS_TOKEN_SECRET = 'launch-gift-test-access-secret-only'
process.env.REFRESH_TOKEN_SECRET = 'launch-gift-test-refresh-secret-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { launchGiftStats, launchGiftFor, reserveLaunchGiftAtSignup } = await import('../dist/services/launchGift.service.js')

let gifts
function reset(count = 75) {
  gifts = new Map(Array.from({ length: count }, (_, index) => {
    const userId = `existing-${index + 1}`
    return [userId, { userId, rank: index + 1, claimedAt: null, expiresAt: null, extended: false }]
  }))
}
const tx = {
  $queryRaw: async () => [],
  launchGift: {
    count: async () => gifts.size,
    aggregate: async () => ({ _max: { rank: gifts.size ? Math.max(...Array.from(gifts.values(), gift => gift.rank)) : null } }),
    findUnique: async ({ where }) => gifts.get(where.userId) ?? null,
    create: async ({ data }) => {
      assert.ok(!gifts.has(data.userId))
      assert.ok(!Array.from(gifts.values()).some(gift => gift.rank === data.rank))
      const gift = { ...data, claimedAt: null, expiresAt: null, extended: false }
      gifts.set(data.userId, gift)
      return gift
    },
  },
}
Object.assign(prisma.launchGift, tx.launchGift)
prisma.user.findUnique = async () => ({ referralCode: 'FRIENDCODE' })
let queue = Promise.resolve()
prisma.$transaction = work => {
  const result = queue.then(() => work(tx))
  queue = result.catch(() => {})
  return result
}

test('guest statistics resume at 180 issued and 20 remaining, including an empty catalog', async () => {
  for (const count of [0, 75, 180]) {
    reset(count)
    assert.deepEqual(await launchGiftStats(), { capacity: 200, issued: 180, remaining: 20, valueUsd: 6, months: 1 })
    assert.equal(gifts.size, count, 'reading the counter does not create gifts')
  }
})

test('new reservations advance to 181/19 and 182/18 and revisits keep their original place', async () => {
  reset()
  const first = await launchGiftFor('new-1')
  assert.equal(first.rank, 181)
  assert.equal(first.issued, 181)
  assert.equal(first.remaining, 19)
  assert.equal(first.referralCode, 'FRIENDCODE')
  const second = await launchGiftFor('new-2')
  assert.equal(second.rank, 182)
  assert.equal(second.issued, 182)
  assert.equal(second.remaining, 18)
  const revisit = await launchGiftFor('new-1')
  assert.equal(revisit.rank, 181)
  assert.equal(revisit.issued, 182)
  assert.equal(revisit.remaining, 18)
  assert.equal(gifts.size, 77)
})

test('only 20 further signup reservations fit and the counter stops at 200/0', async () => {
  reset()
  await Promise.all(Array.from({ length: 25 }, (_, index) => reserveLaunchGiftAtSignup(`new-${index}`)))
  assert.equal(gifts.size, 95)
  assert.equal(gifts.get('new-19').rank, 200)
  assert.deepEqual(await launchGiftStats(), { capacity: 200, issued: 200, remaining: 0, valueUsd: 6, months: 1 })
  const unavailable = await launchGiftFor('too-late')
  assert.equal(unavailable.eligible, false)
  assert.equal(unavailable.rank, null)
  assert.equal(unavailable.remaining, 0)
  assert.equal(gifts.size, 95)
  assert.equal((await launchGiftFor('new-0')).rank, 181)
})

test('existing unclaimed gifts retain their eligibility and rank after all new places fill', async () => {
  reset()
  const original = structuredClone(gifts.get('existing-1'))
  gifts.set('last-place', { userId: 'last-place', rank: 200, claimedAt: null, expiresAt: null, extended: false })
  const result = await launchGiftFor('existing-1')
  assert.equal(result.eligible, true)
  assert.equal(result.rank, 1)
  assert.equal(result.claimedAt, null)
  assert.equal(result.remaining, 0)
  assert.deepEqual(gifts.get('existing-1'), original)
})

test('existing progress above the baseline is preserved, including historical ranks beyond the cap', async () => {
  for (const count of [181, 199, 200, 205]) {
    reset(count)
    assert.deepEqual(await launchGiftStats(), { capacity: Math.max(200, count), issued: count,
      remaining: Math.max(0, 200 - count), valueUsd: 6, months: 1 })
  }
})
