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

test('guest statistics include the eight manual gifts and resume at 208 issued and 92 remaining', async () => {
  for (const count of [0, 75, 180, 200, 207, 208]) {
    reset(count)
    assert.deepEqual(await launchGiftStats(), { capacity: 300, issued: 208, remaining: 92, valueUsd: 6, months: 1 })
    assert.equal(gifts.size, count, 'reading the counter does not create gifts')
  }
})

test('new reservations start at 209 after the manual gifts and revisits keep their original place', async () => {
  reset(200)
  const first = await launchGiftFor('new-1')
  assert.equal(first.rank, 209)
  assert.equal(first.issued, 209)
  assert.equal(first.remaining, 91)
  assert.equal(first.referralCode, 'FRIENDCODE')
  const second = await launchGiftFor('new-2')
  assert.equal(second.rank, 210)
  assert.equal(second.issued, 210)
  assert.equal(second.remaining, 90)
  const revisit = await launchGiftFor('new-1')
  assert.equal(revisit.rank, 209)
  assert.equal(revisit.issued, 210)
  assert.equal(revisit.remaining, 90)
  assert.equal((await launchGiftFor('existing-200')).rank, 200)
  assert.equal(gifts.size, 202)
})

test('the next signup starts at 209 even when earlier gift records are missing', async () => {
  reset()
  await reserveLaunchGiftAtSignup('new-signup')
  assert.equal(gifts.get('new-signup').rank, 209)
  assert.deepEqual(await launchGiftStats(), { capacity: 300, issued: 209, remaining: 91, valueUsd: 6, months: 1 })
})

test('only 92 further signup reservations fit and the counter stops at 300/0', async () => {
  reset(200)
  await Promise.all(Array.from({ length: 97 }, (_, index) => reserveLaunchGiftAtSignup(`new-${index}`)))
  assert.equal(gifts.size, 292)
  assert.equal(gifts.get('new-0').rank, 209)
  assert.equal(gifts.get('new-91').rank, 300)
  assert.equal(gifts.has('new-92'), false)
  assert.deepEqual(await launchGiftStats(), { capacity: 300, issued: 300, remaining: 0, valueUsd: 6, months: 1 })
  const unavailable = await launchGiftFor('too-late')
  assert.equal(unavailable.eligible, false)
  assert.equal(unavailable.rank, null)
  assert.equal(unavailable.remaining, 0)
  assert.equal(gifts.size, 292)
  assert.equal((await launchGiftFor('new-0')).rank, 209)
})

test('existing unclaimed gifts retain their eligibility and rank after all new places fill', async () => {
  reset()
  const original = structuredClone(gifts.get('existing-1'))
  gifts.set('last-place', { userId: 'last-place', rank: 300, claimedAt: null, expiresAt: null, extended: false })
  const result = await launchGiftFor('existing-1')
  assert.equal(result.eligible, true)
  assert.equal(result.rank, 1)
  assert.equal(result.claimedAt, null)
  assert.equal(result.remaining, 0)
  assert.deepEqual(gifts.get('existing-1'), original)
})

test('existing progress above the baseline is preserved, including historical ranks beyond the cap', async () => {
  for (const count of [209, 299, 300, 305]) {
    reset(count)
    assert.deepEqual(await launchGiftStats(), { capacity: Math.max(300, count), issued: count,
      remaining: Math.max(0, 300 - count), valueUsd: 6, months: 1 })
  }
})
