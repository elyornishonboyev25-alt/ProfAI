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
globalThis.prisma = {
  user: { findUnique: async ({ where }) => ({ id: where.id, role: 'USER' }) },
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
        findMany: async ({ where }) => {
          assert.equal(lockedUser, where.userId, 'Count occurs inside the account lock')
          return sessions.filter(row => row.userId === where.userId && row.endedAt === null && row.expiresAt > where.expiresAt.gt)
        },
        create: async ({ data }) => {
          const session = { id: `session-${sessions.length}`, endedAt: null, ...data }
          sessions.push(session)
          return session
        },
      },
    }
    try { return await callback(db) } finally { release?.() }
  },
}
const { createAuthSession, acquireSessionUsage, AuthSessionError } = await import('../dist/services/authActivity.service.js')
const args = (deviceId, userId = 'learner') => ({ userId, deviceId, method: 'PASSWORD', expiresAt: new Date(Date.now() + 86400000) })
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
  }
})

test('repeated sign-ins count once, offline devices count, ended and expired devices release capacity', async () => {
  for (const deviceId of ['one', 'one', 'two', 'three']) {
    await createAuthSession(args(deviceId))
    sessions.forEach(row => { row.usageUntil = new Date(0) })
  }
  sessions.forEach(row => { row.lastSeenAt = new Date(0) })
  await assert.rejects(createAuthSession(args('four')), { code: 'DEVICE_LIMIT_REACHED' })
  sessions.filter(row => row.deviceId === 'one').forEach(row => { row.endedAt = new Date() })
  await createAuthSession(args('four'))
  sessions.forEach(row => { row.usageUntil = new Date(0) })
  sessions.find(row => row.deviceId === 'two').expiresAt = new Date(0)
  await createAuthSession(args('five'))
  await createAuthSession(args('six', 'another-learner'))
  await assert.rejects(createAuthSession(args('six')), { code: 'DEVICE_LIMIT_REACHED' })
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
    sessions.forEach(row => { row.usageUntil = new Date(0) })
  }
  const results = await Promise.allSettled(sessions.map(row => acquireSessionUsage(row.userId, row.id, row.deviceId)))
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  assert.equal(sessions.filter(row => row.usageUntil > new Date()).length, 1)
  await assert.rejects(acquireSessionUsage('learner', sessions[0].id, 'copied-token-device'), { code: 'SESSION_DEVICE_MISMATCH' })
  await assert.rejects(acquireSessionUsage('someone-else', sessions[0].id), { code: 'SESSION_EXPIRED' })
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
  const request = async (sid, deviceId) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/saved-results`, { headers: {
      Authorization: `Bearer ${signAccessToken({ sub: 'learner', role: 'USER', sid })}`,
      ...(deviceId ? { 'X-Device-Id': deviceId } : {}),
    } })
    return { status: response.status, body: await response.json() }
  }
  try {
    assert.equal((await request(first.id, one)).body.code, 'ACCOUNT_IN_USE')
    assert.equal((await request(second.id, two)).status, 200)
    assert.equal((await request(undefined, one)).status, 401, 'Legacy access tokens must refresh before using protected APIs')
    assert.equal((await request(second.id, one)).body.code, 'SESSION_DEVICE_MISMATCH')
    assert.equal((await request(second.id)).body.code, 'SESSION_DEVICE_MISMATCH')
    second.usageUntil = new Date(0)
    assert.equal((await request(first.id, one)).status, 200, 'Offline lease expires without removing the saved sign-in')
    assert.equal((await request(second.id, two)).body.code, 'ACCOUNT_IN_USE')
  } finally { await new Promise(resolve => server.close(resolve)) }
})
