import test from 'node:test'
import assert from 'node:assert/strict'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/product_release_fixture'
process.env.ACCESS_TOKEN_SECRET = 'product-release-access-fixture-only'
process.env.REFRESH_TOKEN_SECRET = 'product-release-refresh-fixture-only'
const { prisma } = await import('../dist/lib/prisma.js')
const { NOVA_EXISTING_ACCOUNT_CUTOFF, novaReleaseFor, recordNovaReleaseShown } = await import('../dist/services/productRelease.service.js')
const cutoff = NOVA_EXISTING_ACCOUNT_CUTOFF.getTime()
const accounts = new Map([
  ['existing', { createdAt: new Date(cutoff - 1) }],
  ['another-existing', { createdAt: new Date(cutoff - 86_400_000) }],
  ['at-cutoff', { createdAt: new Date(cutoff) }],
  ['new', { createdAt: new Date(cutoff + 1) }],
])
const receipts = new Map()
prisma.user.findUnique = async ({ where }) => accounts.get(where.id) ?? null
prisma.accountLearningData.findUnique = async ({ where }) => receipts.get(JSON.stringify(where.userId_key)) ?? null
prisma.accountLearningData.upsert = async ({ where, create, update }) => {
  assert.deepEqual(update, {}, 'Repeated receipts preserve the first impression timestamp')
  const key = JSON.stringify(where.userId_key)
  if (!receipts.has(key)) receipts.set(key, create)
  return receipts.get(key)
}

test('the audience is fixed at request time and excludes new, boundary and deleted accounts', async () => {
  for (const id of ['at-cutoff', 'new', 'deleted']) {
    assert.equal((await novaReleaseFor(id)).eligible, false)
    assert.deepEqual(await recordNovaReleaseShown(id), { recorded: false })
  }
  assert.equal(receipts.size, 0)
  assert.equal((await novaReleaseFor('existing')).eligible, true)
  assert.equal((await novaReleaseFor('existing')).eligible, true)
  assert.equal(receipts.size, 0, 'Checking the audience never consumes an unseen announcement')
})

test('a visible impression persists across devices, is idempotent, and belongs only to that account', async () => {
  assert.deepEqual(await recordNovaReleaseShown('existing'), { recorded: true })
  const first = structuredClone([...receipts.values()][0])
  assert.equal((await novaReleaseFor('existing')).eligible, false)
  assert.equal((await novaReleaseFor('another-existing')).eligible, true)
  await Promise.all([recordNovaReleaseShown('existing'), recordNovaReleaseShown('existing')])
  assert.equal(receipts.size, 1)
  assert.deepEqual([...receipts.values()][0], first)
})
