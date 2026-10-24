import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import express from 'express'

Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost:1/test',
  ACCESS_TOKEN_SECRET: 'test-access-secret-at-least-24-characters',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret-at-least-24-characters',
})
let sessions = []
const locks = new Map()
const matches = (row, where = {}) => Object.entries(where).every(([key, condition]) => {
  if (key === 'OR') return condition.some(option => matches(row, option))
  if (condition === null) return row[key] == null
  if (condition instanceof Date || typeof condition !== 'object') return row[key] === condition
  if ('gt' in condition) return row[key] > condition.gt
  if ('gte' in condition) return row[key] >= condition.gte
  if ('in' in condition) return condition.in.includes(row[key])
  return true
})
globalThis.prisma = {
  user: { findUnique: async ({ where }) => ({ id: where.id, role: 'USER' }) },
  authSession: { updateMany: async ({ where, data }) => ({ count: sessions.filter(row => matches(row, where)).map(row => Object.assign(row, data)).length }) },
  $transaction: async callback => {
    let release
    let lockedUser
    const db = {
      $queryRaw: async (_sql, userId) => {
        assert.equal(lockedUser, undefined, 'Admission acquires one account lock')
        lockedUser = userId
        const previous = locks.get(userId) ?? Promise.resolve()
        const pending = new Promise(resolve => { release = resolve })
        locks.set(userId, previous.then(() => pending))
        await previous
        return [{ id: userId }]
      },
      authSession: {
        findUnique: async ({ where }) => sessions.find(row => row.id === where.id),
        update: async ({ where, data }) => Object.assign(sessions.find(row => row.id === where.id), data),
        updateMany: async ({ where, data }) => {
          assert.equal(lockedUser, where.userId, 'Device grouping changes occur inside the account lock')
          return globalThis.prisma.authSession.updateMany({ where, data })
        },
        findMany: async ({ where }) => {
          assert.equal(lockedUser, where.userId, 'Device lookups occur inside the account lock')
          return sessions.filter(row => matches(row, where))
        },
        create: async ({ data }) => {
          const session = { id: `session-${sessions.length}`, endedAt: null, lastSeenAt: new Date(), ...data }
          sessions.push(session)
          return session
        },
      },
    }
    try { return await callback(db) } finally { release?.() }
  },
}
const { createAuthSession, acquireSessionUsage, releaseSessionUsage, deviceSignals, networkKey, AuthSessionError } = await import('../dist/services/authActivity.service.js')
const args = (deviceId, userId = 'learner', signals) => ({ userId, deviceId, signals, method: 'PASSWORD', expiresAt: new Date(Date.now() + 86400000) })
const windowsChrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'
const windowsEdge = `${windowsChrome} Edg/130.0`
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1'
const laptop = 'v1|1920x1080|24|12|Asia/Tashkent|0|nvidia|geforce rtx 3060'
const phone = 'v1|852x393|24|6|Asia/Tashkent|5|apple|apple gpu'
const signals = (hints, ip, userAgent = windowsChrome) => deviceSignals({ ip, get: name => ({ 'X-Device-Hints': hints && encodeURIComponent(hints), 'user-agent': userAgent })[name] })
const expire = () => sessions.forEach(row => { row.usageUntil = new Date(0) })
beforeEach(() => { sessions = []; locks.clear() })

test('concurrent admission never admits a fourth distinct device when usage leases have expired', async () => {
  // Simulate each preceding device going offline while retaining its sign-in.
  const create = globalThis.prisma.$transaction
  globalThis.prisma.$transaction = callback => create(async db => {
    const result = await callback(db)
    result.usageUntil = new Date(0)
    return result
  })
  const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => createAuthSession(args(`device-${i}`))))
  globalThis.prisma.$transaction = create
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 3)
  assert.equal(sessions.length, 3)
  for (const result of results.filter(result => result.status === 'rejected')) {
    assert.ok(result.reason instanceof AuthSessionError)
    assert.equal(result.reason.statusCode, 403)
    assert.equal(result.reason.code, 'DEVICE_LIMIT_REACHED')
    assert.equal(result.reason.details.devices.length, 3)
    assert.ok(result.reason.details.devices.every(device => !JSON.stringify(device).includes('device-')), 'Browser identifiers stay private')
  }
})

test('repeated sign-ins count once, offline devices count, ended and expired devices release capacity', async () => {
  for (const deviceId of ['one', 'one', 'two', 'three']) {
    await createAuthSession(args(deviceId))
    expire()
  }
  sessions.forEach(row => { row.lastSeenAt = new Date(0) })
  await assert.rejects(createAuthSession(args('four')), { code: 'DEVICE_LIMIT_REACHED' })
  sessions.filter(row => row.deviceId === 'one').forEach(row => { row.endedAt = new Date() })
  await createAuthSession(args('four'))
  expire()
  sessions.find(row => row.deviceId === 'two').expiresAt = new Date(0)
  await createAuthSession(args('five'))
  await createAuthSession(args('six', 'another-learner'))
  await assert.rejects(createAuthSession(args('six')), { code: 'DEVICE_LIMIT_REACHED' })
})

test('Chrome and Edge on one computer are one device: no extra slot and no lockout', async () => {
  const chrome = await createAuthSession(args('chrome', 'learner', signals(laptop, '84.54.70.12')))
  // Chrome still holds the usage lease while Edge opens on the same computer.
  const edge = await createAuthSession(args('edge', 'learner', signals(laptop, '84.54.70.40', windowsEdge)))
  assert.equal(edge.deviceKey, chrome.deviceKey)
  await acquireSessionUsage('learner', chrome.id, 'chrome')
  await acquireSessionUsage('learner', edge.id, 'edge')
  // A cleared browser profile on the same computer is also recognised.
  await createAuthSession(args('firefox-after-clearing', 'learner', signals(laptop, '84.54.70.12')))
  expire()
  await createAuthSession(args('phone', 'learner', signals(phone, '84.54.70.12', iphone)))
  expire()
  await createAuthSession(args('tablet', 'learner', signals('v1|1180x820|24|8|Asia/Tashkent|5|apple|apple gpu', '10.0.0.1', iphone)))
  expire()
  assert.equal(new Set(sessions.map(row => row.deviceKey)).size, 3)
  await assert.rejects(createAuthSession(args('fourth', 'learner', signals('v1|1366x768|24|4|Asia/Tashkent|0|intel|uhd graphics 620', '84.54.70.12'))), { code: 'DEVICE_LIMIT_REACHED' })
})

test('identical hardware elsewhere, or other hardware on the same network, stays a separate device', async () => {
  const first = await createAuthSession(args('phone-a', 'learner', signals(phone, '84.54.70.12', iphone)))
  expire()
  const twinElsewhere = await createAuthSession(args('phone-b', 'learner', signals(phone, '213.230.90.5', iphone)))
  expire()
  const neighbour = await createAuthSession(args('laptop', 'learner', signals(laptop, '84.54.70.12')))
  assert.equal(new Set([first.deviceKey, twinElsewhere.deviceKey, neighbour.deviceKey]).size, 3)
  // While one device is in use, any other device is refused with who holds the account.
  const denied = await createAuthSession(args('phone-a', 'learner', signals(phone, '84.54.70.12', iphone))).catch(error => error)
  assert.equal(denied.code, 'ACCOUNT_IN_USE')
  assert.equal(denied.details.activeDevice.deviceType, 'DESKTOP')
  assert.ok(denied.details.retryAfterSec > 0 && denied.details.retryAfterSec <= 120)
})

test('a named desktop GPU recognises the same computer on another network', async () => {
  const home = await createAuthSession(args('chrome', 'learner', signals(laptop, '84.54.70.12')))
  expire()
  const campus = await createAuthSession(args('edge', 'learner', signals(laptop, '2001:db8:85a3::8a2e:370:7334', windowsEdge)))
  assert.equal(campus.deviceKey, home.deviceKey)
  assert.equal(networkKey('2001:db8:85a3:0:1::1'), networkKey('2001:0db8:85a3:0000:ffff::2'))
  assert.notEqual(networkKey('84.54.70.12'), networkKey('84.54.71.12'))
  assert.equal(networkKey('::ffff:84.54.70.12'), networkKey('84.54.70.99'))
})

test('sessions created before device signals merge once they report them', async () => {
  const chrome = await createAuthSession(args('chrome'))
  expire()
  const edge = await createAuthSession(args('edge'))
  expire()
  assert.notEqual(chrome.deviceKey, edge.deviceKey)
  await acquireSessionUsage('learner', chrome.id, 'chrome', { signals: signals(laptop, '84.54.70.12') })
  await acquireSessionUsage('learner', edge.id, 'edge', { signals: signals(laptop, '84.54.70.12', windowsEdge) })
  assert.equal(edge.deviceKey, chrome.deviceKey)
  assert.equal(new Set(sessions.map(row => row.deviceKey)).size, 1)
})

test('idle tabs do not hold the account and closing the last tab releases it at once', async () => {
  const pc = await createAuthSession(args('pc'))
  expire()
  await acquireSessionUsage('learner', pc.id, 'pc', { renew: false })
  assert.ok(pc.usageUntil <= new Date(), 'Idle requests keep the session but do not renew usage')
  const phoneSession = await createAuthSession(args('phone'))
  await assert.rejects(acquireSessionUsage('learner', pc.id, 'pc', { renew: false }), { code: 'ACCOUNT_IN_USE' })
  await releaseSessionUsage('learner', phoneSession.id)
  assert.equal(phoneSession.usageUntil, null)
  await acquireSessionUsage('learner', pc.id, 'pc')
  assert.ok(pc.usageUntil > new Date())
})

test('simultaneous sign-ins admit only one active device and cannot displace it', async () => {
  const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => createAuthSession(args(`device-${i}`))))
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  const winner = sessions[0]
  for (const result of results.filter(result => result.status === 'rejected')) {
    assert.ok(result.reason instanceof AuthSessionError)
    assert.equal(result.reason.statusCode, 409)
    assert.equal(result.reason.code, 'ACCOUNT_IN_USE')
  }
  await createAuthSession(args(winner.deviceId))
  await createAuthSession(args('separate', 'another-learner'))
  assert.equal(sessions.filter(row => row.userId === 'learner').length, 2)
})

test('restored devices compete atomically; denied requests do not renew their lease', async () => {
  for (const device of ['one', 'two', 'three']) {
    await createAuthSession(args(device))
    expire()
  }
  const results = await Promise.allSettled(sessions.map(row => acquireSessionUsage(row.userId, row.id, row.deviceId)))
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(sessions.filter(row => row.usageUntil > new Date()).length, 1)
  const winner = sessions.find(row => row.usageUntil > new Date())
  await assert.rejects(acquireSessionUsage('learner', winner.id, 'copied-token-device'), { code: 'SESSION_DEVICE_MISMATCH' })
  await assert.rejects(acquireSessionUsage('someone-else', winner.id), { code: 'SESSION_EXPIRED' })
  expire()
  await acquireSessionUsage('learner', sessions[0].id, 'one')
  sessions[0].usageUntil = new Date(0)
  await acquireSessionUsage('learner', sessions[1].id, 'two')
  sessions[1].endedAt = new Date()
  await acquireSessionUsage('learner', sessions[2].id, 'three')
  sessions[2].expiresAt = new Date(0)
  await acquireSessionUsage('learner', sessions[0].id, 'one')
  await assert.rejects(acquireSessionUsage('learner', sessions[1].id), { code: 'SESSION_EXPIRED' })
})

test('ordinary protected endpoints enforce usage and reject untracked or copied sessions', async () => {
  const { requireAuth } = await import('../dist/middleware/auth.js')
  const { errorHandler } = await import('../dist/middleware/error.js')
  const { signAccessToken } = await import('../dist/utils/jwt.js')
  const app = express()
  app.get('/saved-results', requireAuth, (_req, res) => res.json({ allowed: true }))
  app.use(errorHandler)
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)) })
  const one = '11111111-1111-4111-8111-111111111111'
  const two = '22222222-2222-4222-8222-222222222222'
  const first = await createAuthSession(args(one))
  first.usageUntil = new Date(0)
  const second = await createAuthSession(args(two))
  const request = async (sid, deviceId, extra = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/saved-results`, { headers: {
      Authorization: `Bearer ${signAccessToken({ sub: 'learner', role: 'USER', sid })}`,
      ...(deviceId ? { 'X-Device-Id': deviceId } : {}), ...extra,
    } })
    return { status: response.status, body: await response.json() }
  }
  try {
    const blocked = await request(first.id, one)
    assert.equal(blocked.body.code, 'ACCOUNT_IN_USE')
    assert.ok(blocked.body.details.retryAfterSec > 0, 'The client learns when to retry')
    assert.equal((await request(second.id, two)).status, 200)
    assert.equal((await request(undefined, one)).status, 401, 'Legacy access tokens must refresh before using protected APIs')
    assert.equal((await request(second.id, one)).body.code, 'SESSION_DEVICE_MISMATCH')
    assert.equal((await request(second.id)).body.code, 'SESSION_DEVICE_MISMATCH')
    second.usageUntil = new Date(0)
    assert.equal((await request(first.id, one, { 'X-Device-Activity': 'idle' })).status, 200)
    assert.ok(first.usageUntil <= new Date(), 'An idle tab does not claim the account')
    assert.equal((await request(first.id, one)).status, 200, 'Offline lease expires without removing the saved sign-in')
    assert.equal((await request(second.id, two)).body.code, 'ACCOUNT_IN_USE')
  } finally { await new Promise(resolve => server.close(resolve)) }
})
