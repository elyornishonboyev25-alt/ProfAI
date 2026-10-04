import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'

// Test the real routes and JWT/owner middleware without touching a database.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/review_test'
process.env.ACCESS_TOKEN_SECRET = 'review-test-access-secret-at-least-24'
process.env.REFRESH_TOKEN_SECRET = 'review-test-refresh-secret-at-least-24'
const { default: express } = await import('express')
const { default: router } = await import('../dist/routes/reviews.routes.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { signAccessToken } = await import('../dist/utils/jwt.js')

const reviews = new Map()
let nextId = 0
let server, base
const owner = signAccessToken({ sub: 'owner', role: 'USER' })
const otherAdmin = signAccessToken({ sub: 'other', role: 'ADMIN' })
const input = { name: 'Test Learner', exam: 'IELTS', bandBefore: '5.5', bandAfter: '7.5', text: 'Focused practice helped me improve.' }
const matches = (review, where) => (where.approved === undefined || review.approved === where.approved) && (!where.id || review.id === where.id)
const originals = { create: prisma.review.create, findMany: prisma.review.findMany, count: prisma.review.count, updateMany: prisma.review.updateMany, deleteMany: prisma.review.deleteMany, user: prisma.user.findUnique, transaction: prisma.$transaction }

before(async () => {
  prisma.review.create = async ({ data }) => {
    const review = { id: `test-${++nextId}`, createdAt: new Date().toISOString(), ...data }
    reviews.set(review.id, review)
    return review
  }
  prisma.review.findMany = async ({ where, skip = 0, take }) => [...reviews.values()].filter(review => matches(review, where)).reverse().slice(skip, skip + take)
  prisma.review.count = async ({ where }) => [...reviews.values()].filter(review => matches(review, where)).length
  prisma.review.updateMany = async ({ where, data }) => {
    const review = reviews.get(where.id)
    if (review) Object.assign(review, data)
    return { count: review ? 1 : 0 }
  }
  prisma.review.deleteMany = async ({ where }) => ({ count: reviews.delete(where.id) ? 1 : 0 })
  prisma.user.findUnique = async ({ where }) => ({ email: where.id === 'owner' ? 'elyornishonboyev000@gmail.com' : 'other@example.com' })
  prisma.$transaction = async operations => Promise.all(operations)
  const app = express()
  app.use(express.json())
  app.use('/reviews', router)
  server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  base = `http://127.0.0.1:${server.address().port}/reviews`
})

after(async () => {
  Object.assign(prisma.review, { create: originals.create, findMany: originals.findMany, count: originals.count, updateMany: originals.updateMany, deleteMany: originals.deleteMany })
  prisma.user.findUnique = originals.user
  prisma.$transaction = originals.transaction
  await new Promise(resolve => server.close(resolve))
})

async function request(path = '', { token, method = 'GET', body } = {}) {
  return fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
}

test('new submissions stay private even if the caller requests approval', async () => {
  const response = await request('', { method: 'POST', body: { ...input, approved: true } })
  assert.equal(response.status, 201)
  const { review } = await response.json()
  assert.equal(review.approved, false)
  assert.equal(review.bandAfter, '7.5')
  assert.deepEqual((await (await request()).json()).reviews, [])
})

test('anonymous visitors and other admins cannot read, publish, hide or delete private reviews', async () => {
  for (const token of [undefined, otherAdmin]) {
    for (const [path, method, body] of [['/owner', 'GET'], ['/owner/test-1', 'PATCH', { approved: true }], ['/owner/test-1', 'PATCH', { approved: false }], ['/owner/test-1', 'DELETE']]) {
      assert.equal((await request(path, { token, method, body })).status, token ? 403 : 401)
    }
  }
  assert.equal(reviews.get('test-1').approved, false)
})

test('owner can read pending scores, publish them and hide the comment again', async () => {
  const pending = await (await request('/owner', { token: owner })).json()
  assert.equal(pending.items[0].bandBefore, '5.5')
  assert.equal(pending.total, 1)
  assert.equal((await request('/owner/test-1', { token: owner, method: 'PATCH', body: { approved: true } })).status, 200)
  assert.equal((await (await request()).json()).reviews[0].id, 'test-1')
  assert.equal((await (await request('/owner?status=PUBLISHED', { token: owner })).json()).total, 1)
  assert.equal((await (await request('/owner', { token: owner })).json()).total, 0)
  await request('/owner/test-1', { token: owner, method: 'PATCH', body: { approved: false } })
  assert.equal((await (await request()).json()).reviews.length, 0)
})

test('reject invalid or incomplete IELTS and SAT scores before storage', async () => {
  const count = reviews.size
  for (const scores of [
    { bandBefore: '6.2' }, { bandAfter: '10' }, { bandBefore: 'text' }, { bandAfter: '' },
    { exam: 'General' }, { exam: 'SAT', bandBefore: '390', bandAfter: '1500' },
    { exam: 'SAT', bandBefore: '1205', bandAfter: '1500' }, { exam: 'SAT', bandBefore: '1200', bandAfter: '1610' },
  ]) assert.equal((await request('', { method: 'POST', body: { ...input, ...scores } })).status, 400)
  assert.equal(reviews.size, count)
})

test('accept score boundaries and optional scores without publishing', async () => {
  for (const scores of [{ bandBefore: '0', bandAfter: '9' }, { exam: 'SAT', bandBefore: '400', bandAfter: '1600' }, { exam: 'General', bandBefore: '', bandAfter: '' }]) {
    const response = await request('', { method: 'POST', body: { ...input, ...scores } })
    assert.equal(response.status, 201)
    assert.equal((await response.json()).review.approved, false)
  }
})

test('owner pagination has no missing entries; invalid filters are rejected', async () => {
  for (let i = 0; i < 13; i++) await request('', { method: 'POST', body: input })
  const first = await (await request('/owner?status=ALL&page=1', { token: owner })).json()
  const second = await (await request('/owner?status=ALL&page=2', { token: owner })).json()
  assert.equal(first.items.length, 12)
  assert.equal(first.items.length + second.items.length, first.total)
  assert.equal(new Set([...first.items, ...second.items].map(review => review.id)).size, first.total)
  assert.equal((await request('/owner?status=INVALID', { token: owner })).status, 400)
  assert.equal((await request('/owner?page=0', { token: owner })).status, 400)
})

test('owner can delete a rejected comment and missing IDs return 404', async () => {
  assert.equal((await request('/owner/test-1', { token: owner, method: 'DELETE' })).status, 204)
  assert.equal(reviews.has('test-1'), false)
  assert.equal((await request('/owner/test-1', { token: owner, method: 'PATCH', body: { approved: true } })).status, 404)
  assert.equal((await request('/owner/test-1', { token: owner, method: 'DELETE' })).status, 404)
  assert.equal((await request('/owner/test-2', { token: owner, method: 'PATCH', body: { approved: 'true' } })).status, 400)
})
