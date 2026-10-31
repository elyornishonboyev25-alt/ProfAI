import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/owner_dashboard_test'
process.env.ACCESS_TOKEN_SECRET = 'owner-dashboard-access-secret-at-least-24'
process.env.REFRESH_TOKEN_SECRET = 'owner-dashboard-refresh-secret-at-least-24'
const { default: express } = await import('express')
const { default: support } = await import('../dist/routes/support.routes.js')
const { default: billing } = await import('../dist/routes/billing.routes.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { fixtureAccessToken, installSessionFixtures } = await import('./helpers/authSessions.mjs')
const now = new Date()
const local = new Date(now.getTime() + 5 * 3600000)
const today = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 5 * 3600000)
const week = new Date(today.getTime() - 6 * 86400000)
const previous = date => new Date(date.getTime() - 1)
const promo = { code: 'IVYEXAMPLE', days: 7, redeemedAt: today }
const makeUser = (id, createdAt, extra = {}) => ({ id, fullName: id, email: `${id}@example.test`, createdAt, authSessions: [], promoCode: null, referralReceived: null, wheelSpin: null, paymentRequests: [], ...extra })
const users = [
  ...Array.from({ length: 22 }, (_, i) => makeUser(`today-${String(i).padStart(2, '0')}`, today)),
  makeUser('yesterday', previous(today)), makeUser('week-start', week), makeUser('before-week', previous(week)),
  makeUser('returning', new Date('2020-01-01'), { authSessions: [{ lastSeenAt: today }, { lastSeenAt: now }] }),
  makeUser('older-activity', new Date('2020-01-01'), { authSessions: [{ lastSeenAt: week }] }),
  makeUser('redeemed-promo', new Date('2020-01-01'), { promoCode: promo }),
  makeUser('issued-only', new Date('2020-01-01'), { promoCode: { ...promo, redeemedAt: null } }),
  makeUser('referral', new Date('2020-01-01'), { referralReceived: { inviter: { fullName: 'Inviter', referralCode: 'IVYFRIEND' } } }),
  makeUser('wheel', new Date('2020-01-01'), { wheelSpin: { id: 'spin-50', percent: 50, expiresAt: new Date(now.getTime() + 600000), usedAt: null } }),
]
const order = (id, extra = {}) => ({ id, userId: 'wheel', user: { id: 'wheel', fullName: 'Wheel winner', email: 'wheel@example.test', promoCode: { code: 'IVYEXAMPLE', redeemedAt: today } }, plan: 'PRO_1', status: 'PENDING', method: 'PAYME', currency: 'UZS', amountUzs: 39000, amountMinor: 3900000, discountPercent: 50, wheelSpinId: 'spin-50', createdAt: previous(today), updatedAt: today, ...extra })
const orders = [order('discount-pending'), order('discount-paid', { currency: 'USD', amountMinor: 300, amountUzs: 0, status: 'APPROVED' }), order('regular', { discountPercent: 0, wheelSpinId: null, status: 'PROCESSING', updatedAt: previous(today) })]
users.find(user => user.id === 'wheel').paymentRequests = orders.slice(0, 2)
const reports = [{ id: 'old', status: 'OPEN', createdAt: previous(today) }, { id: 'new', status: 'OPEN', createdAt: today }]
const reviews = [{ id: 'new-review', createdAt: today }]
const logins = [{ method: 'PASSWORD', loginAt: today }, { method: 'RESTORED', loginAt: today }]
const ownerToken = fixtureAccessToken({ sub: 'owner', role: 'USER' })
const otherToken = fixtureAccessToken({ sub: 'other', role: 'ADMIN' })
let server, base, restoreSessions
const original = []
function replace(target, key, value) { original.push(() => { target[key] = value }); target[key] = value }
function match(row, where = {}) {
  if (where.OR && !where.OR.some(clause => match(row, clause))) return false
  return Object.entries(where).filter(([key]) => key !== 'OR').every(([key, value]) => {
    const actual = row[key]
    if (value === null || typeof value !== 'object' || value instanceof Date) return actual === value
    if ('some' in value) return actual?.some(item => match(item, value.some)) ?? false
    if ('is' in value) return actual != null && match(actual, value.is)
    if ('isNot' in value) return actual != null
    if ('not' in value && actual === value.not) return false
    if ('gt' in value && !(actual > value.gt)) return false
    if ('gte' in value && !(actual >= value.gte)) return false
    if ('lte' in value && !(actual <= value.lte)) return false
    if ('in' in value && !value.in.includes(actual)) return false
    return true
  })
}
const count = rows => async ({ where = {} } = {}) => rows.filter(row => match(row, where)).length
const list = rows => async ({ where = {}, orderBy = [], skip = 0, take = 100 } = {}) => rows.filter(row => match(row, where)).sort((a, b) => {
  for (const clause of orderBy) {
    const [key, direction] = Object.entries(clause)[0]
    const comparison = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0
    if (comparison) return direction === 'desc' ? -comparison : comparison
  }
  return 0
}).slice(skip, skip + take).map(row => ({ ...row, ...(row.authSessions ? { authSessions: [...row.authSessions].sort((a, b) => b.lastSeenAt - a.lastSeenAt).slice(0, 1) } : {}) }))
before(async () => {
  replace(prisma.user, 'findUnique', async ({ where }) => ({ id: where.id, role: 'USER', email: where.id === 'owner' ? 'elyornishonboyev000@gmail.com' : 'other@example.test' }))
  replace(prisma.user, 'count', count(users)); replace(prisma.user, 'findMany', list(users))
  for (const [model, rows] of [[prisma.paymentRequest, orders], [prisma.issueReport, reports], [prisma.review, reviews]]) {
    replace(model, 'count', count(rows)); replace(model, 'findMany', list(rows))
  }
  replace(prisma.authSession, 'count', count(logins))
  replace(prisma, '$transaction', async operation => operation(prisma))
  restoreSessions = installSessionFixtures(prisma)
  const app = express(); app.use(express.json()); app.use('/support', support); app.use('/billing', billing)
  app.use((error, _req, res, next) => { if (res.headersSent) return next(error); return res.status(500).json({ message: error.message }) })
  server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  base = `http://127.0.0.1:${server.address().port}`
})
after(async () => { restoreSessions(); original.reverse().forEach(restore => restore()); await new Promise(resolve => server.close(resolve)) })
const request = (path, token = ownerToken) => fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
const get = async path => { const response = await request(path); assert.equal(response.status, 200); return response.json() }

test('today and last seven calendar days filter the entire user catalog before pagination, including Tashkent midnight', async () => {
  const all = await get('/support/owner/overview')
  assert.equal(all.users.total, users.length)
  const first = await get('/support/owner/overview?userPeriod=TODAY')
  assert.equal(first.users.total, 22); assert.equal(first.metrics.todayUsers, 22); assert.equal(first.users.items.length, 20)
  assert.ok(first.users.items.every(row => row.id.startsWith('today-')))
  const second = await get('/support/owner/overview?userPeriod=TODAY&userPage=2')
  assert.equal(second.users.items.length, 2)
  assert.equal(new Set([...first.users.items, ...second.users.items].map(user => user.id)).size, 22)
  const recent = await get('/support/owner/overview?userPeriod=WEEK&userPage=2')
  assert.equal(recent.users.total, 24); assert.equal(recent.metrics.weekUsers, 24)
  assert.ok(recent.users.items.some(row => row.id === 'week-start'))
  assert.ok(!recent.users.items.some(row => row.id === 'before-week'))
})
test('active users include returning accounts, use last activity, and count an account with two sessions only once', async () => {
  const data = await get('/support/owner/overview?userKind=ACTIVE&userPeriod=TODAY')
  assert.equal(data.users.total, 1); assert.equal(data.metrics.todayUsers, 1); assert.equal(data.metrics.totalUsers, 2)
  assert.equal(data.users.items[0].id, 'returning'); assert.equal(data.users.items[0].lastSeenAt, now.toISOString())
  assert.equal((await get('/support/owner/overview?userKind=ACTIVE&userPeriod=WEEK')).users.total, 2)
})
test('new event badges use independent read cursors and include a newly approved older order', async () => {
  const cursor = previous(today).toISOString()
  const params = new URLSearchParams(Object.fromEntries(['activity', 'users', 'payments', 'reports', 'reviews'].map(key => [key, cursor])))
  const data = await get('/support/owner/updates?' + params)
  assert.deepEqual(data.counts, { activity: 1, users: 22, payments: 2, reports: 1, reviews: 1 })
  assert.ok(data.checkedAt); params.set('payments', data.checkedAt)
  const seen = await get('/support/owner/updates?' + params)
  assert.equal(seen.counts.payments, 0); assert.equal(seen.counts.reports, 1)
})
test('payments expose the recorded discount source and charged amounts in both currencies, with catalog-wide discount and status filters', async () => {
  const data = await get('/billing/owner/requests?promotion=DISCOUNTED')
  assert.equal(data.total, 2)
  const uzs = data.items.find(order => order.currency === 'UZS')
  const usd = data.items.find(order => order.currency === 'USD')
  assert.equal(uzs.discountPercent, 50); assert.equal(uzs.wheelSpinId, 'spin-50'); assert.equal(uzs.amountUzs, 39000)
  assert.equal(usd.amountMinor, 300); assert.equal(usd.status, 'APPROVED'); assert.equal(usd.user.promoCode.code, 'IVYEXAMPLE')
  assert.equal((await get('/billing/owner/requests?status=PROCESSING')).items[0].id, 'regular')
  assert.equal((await get('/billing/owner/requests?status=APPROVED&promotion=DISCOUNTED')).total, 1)
})
test('promotion users distinguish redeemed codes, referrals and wheel discounts and exclude unredeemed codes', async () => {
  const data = await get('/billing/owner/promotions')
  assert.deepEqual(data.items.map(user => user.id).sort(), ['redeemed-promo', 'referral', 'wheel'])
  assert.equal(data.total, 3)
  assert.equal(data.items.find(user => user.id === 'redeemed-promo').promoCode.code, 'IVYEXAMPLE')
  assert.equal(data.items.find(user => user.id === 'wheel').paymentRequests[0].discountPercent, 50)
})
test('new owner routes reject other accounts, unauthenticated requests, and malformed filters', async () => {
  for (const path of ['/support/owner/overview?userPeriod=TODAY', '/support/owner/updates', '/billing/owner/requests', '/billing/owner/promotions']) {
    assert.equal((await request(path, null)).status, 401)
    assert.equal((await request(path, otherToken)).status, 403)
  }
  for (const path of ['/support/owner/overview?userPeriod=INVALID', '/support/owner/overview?userKind=INVALID', '/support/owner/updates?users=invalid', '/billing/owner/requests?promotion=INVALID', '/billing/owner/promotions?page=0']) assert.equal((await request(path)).status, 400)
})
