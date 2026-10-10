import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import express from 'express'

Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost:1/test',
  ACCESS_TOKEN_SECRET: 'test-access-secret-at-least-24-characters', REFRESH_TOKEN_SECRET: 'test-refresh-secret-at-least-24-characters' })
const calls = []
const owner = { id: 'owner', role: 'USER', email: 'elyornishonboyev000@gmail.com' }
const learner = { id: 'learner', role: 'ADMIN', email: 'learner@gmail.com' }
let sessions = []
let tokens = []
globalThis.prisma = {
  user: { findUnique: async ({ where }) => [owner, learner].find(row => row.id === where.id) },
  refreshToken: {
    findUnique: async ({ where }) => tokens.find(row => row.tokenHash === where.tokenHash || row.id === where.id),
    updateMany: async ({ where, data }) => { const row = tokens.find(row => row.id === where.id && row.sessionId === null); if (!row) return { count: 0 }; Object.assign(row, data); return { count: 1 } },
  },
  authSession: {
    create: async ({ data }) => { const row = { id: `session-${sessions.length}`, endedAt: null, ...data }; sessions.push(row); return row },
    delete: async () => {},
    updateMany: async ({ where, data }) => { calls.push({ where, data }); const row = sessions.find(row => row.id === where.id && row.userId === where.userId && !row.endedAt && row.expiresAt > new Date()); if (row) Object.assign(row, data); return { count: row ? 1 : 0 } },
    count: async ({ where }) => { calls.push({ countWhere: where }); return 3 },
    findFirst: async () => ({ loginAt: new Date('2026-10-10T01:00:00Z') }),
    findMany: async (args) => { calls.push(args); return [{ id: 's1', user: learner, method: 'EMAIL_CODE' }] },
  },
  $queryRaw: async (query) => {
    calls.push(query)
    if (query.sql.includes('SELECT u.id')) return [{ id: 'learner', fullName: 'Learner', email: 'learner@gmail.com', deviceCount: 2n, onlineDevices: 1n, loginCount: 5n, lastSeenAt: new Date() }]
    return [{ count: 1n }]
  },
  $transaction: async callback => callback(globalThis.prisma),
}
const { default: router } = await import('../dist/routes/authActivity.routes.js')
const { signAccessToken, signRefreshToken, hashToken } = await import('../dist/utils/jwt.js')
const { describeDevice, requestDeviceId, onlineWhere } = await import('../dist/services/authActivity.service.js')
const app = express(); app.use(express.json(), router)
app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }))
const server = await new Promise(resolve => { const value = app.listen(0, '127.0.0.1', () => resolve(value)); })
after(() => new Promise(resolve => server.close(resolve)))
const base = `http://127.0.0.1:${server.address().port}`
async function request(path, user, body, sid) {
  const response = await fetch(`${base}${path}`, { method: body ? 'POST' : 'GET', headers: {
    'Content-Type': 'application/json', 'X-Device-Id': '11111111-1111-4111-8111-111111111111',
    ...(user ? { Authorization: `Bearer ${signAccessToken({ sub: user.id, role: user.role, sid })}` } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) })
  return { response, body: response.status === 204 ? null : await response.json() }
}
test('activity and device details require an authenticated owner, even for ADMIN users', async () => {
  for (const path of ['/owner/activity', '/owner/activity/users/learner/devices']) {
    assert.equal((await request(path)).response.status, 401)
    assert.equal((await request(path, learner)).response.status, 403)
  }
  assert.equal(calls.length, 0, 'Unauthorized requests never query activity')
})
test('owner pagination is bounded, counts serialize and search remains parameterized', async () => {
  const invalid = await request('/owner/activity?page=-1', owner)
  assert.equal(invalid.response.status, 400)
  const query = "x%' OR 1=1 --"
  const { response, body } = await request(`/owner/activity?q=${encodeURIComponent(query)}&filter=multiple&page=2`, owner)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(body.items[0].deviceCount, 2)
  assert.equal(body.items[0].onlineDevices, 1)
  assert.equal(body.metrics.onlineUsers, 1)
  assert.equal(body.pageSize, 20)
  const sql = calls.filter(call => call.sql?.includes('SELECT u.id')).at(-1)
  assert.ok(!sql.sql.includes(query))
  assert.ok(sql.values.includes("%x\\%' OR 1=1 --%"))
  assert.ok(sql.sql.includes('COUNT(DISTINCT "deviceId")'))
  assert.ok(sql.sql.includes('a."deviceCount" > 1'))
  assert.equal(sql.values.at(-1), 20, 'Second page uses a bounded offset')
})
test('history uses date and user filters and never returns token material', async () => {
  const { body } = await request('/owner/activity?view=history&days=1&q=learner', owner)
  assert.equal(body.items[0].method, 'EMAIL_CODE')
  const args = calls.filter(call => call.select?.method).at(-1)
  assert.ok(args.where.loginAt.gte instanceof Date)
  assert.equal(args.where.user.OR[0].email.contains, 'learner')
  assert.equal(args.select.tokenHash, undefined)
  assert.ok(calls.some(call => call.countWhere?.method?.not === 'RESTORED'))
})
test('legacy sessions adopt tracking once; heartbeat cannot touch other or ended sessions', async () => {
  const refreshToken = signRefreshToken({ sub: learner.id, tokenId: 'legacy' })
  tokens = [{ id: 'token', userId: learner.id, sessionId: null, revokedAt: null, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + 86400000) }]
  assert.equal((await request('/activity/heartbeat', learner, { refreshToken })).response.status, 204)
  assert.equal(sessions.length, 1)
  assert.equal(sessions[0].method, 'RESTORED')
  await request('/activity/heartbeat', learner, { refreshToken })
  assert.equal(sessions.length, 1)
  const seen = sessions[0].lastSeenAt
  await request('/activity/heartbeat', owner, {}, sessions[0].id)
  assert.equal(sessions[0].lastSeenAt, seen)
  sessions[0].endedAt = new Date()
  await request('/activity/heartbeat', learner, {}, sessions[0].id)
  assert.equal(sessions[0].lastSeenAt, seen)
})
test('device descriptions distinguish mobile, tablet and browser; online expires after 2 minutes', () => {
  assert.deepEqual(describeDevice('Mozilla/5.0 (iPhone) Mobile Safari/600'), { os: 'iOS', browser: 'Safari', deviceType: 'PHONE' })
  assert.equal(describeDevice('Mozilla/5.0 (Android 13) Chrome/120').deviceType, 'TABLET')
  assert.equal(describeDevice('Windows Chrome/120 Edg/120').browser, 'Edge')
  const now = new Date(); assert.equal(now - onlineWhere(now).lastSeenAt.gte, 120000)
  assert.equal(onlineWhere(now).endedAt, null)
  const fake = { get: () => '11111111-1111-4111-8111-111111111111' }
  assert.equal(requestDeviceId(fake), fake.get())
  assert.notEqual(requestDeviceId({ get: () => 'invalid' }), 'invalid')
})
