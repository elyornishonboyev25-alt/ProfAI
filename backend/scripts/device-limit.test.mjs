import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost:1/test',
  ACCESS_TOKEN_SECRET: 'test-access-secret-at-least-24-characters',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret-at-least-24-characters',
})
let sessions = []
const locks = new Map()
globalThis.prisma = {
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
const { createAuthSession, AuthSessionError } = await import('../dist/services/authActivity.service.js')
const args = (deviceId, userId = 'learner') => ({ userId, deviceId, method: 'PASSWORD', expiresAt: new Date(Date.now() + 86400000) })
beforeEach(() => { sessions = []; locks.clear() })

test('concurrent admission never admits a fourth distinct device', async () => {
  const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => createAuthSession(args(`device-${i}`))))
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 3)
  assert.equal(sessions.length, 3)
  for (const result of results.filter(result => result.status === 'rejected')) {
    assert.ok(result.reason instanceof AuthSessionError)
    assert.equal(result.reason.statusCode, 403)
    assert.equal(result.reason.code, 'DEVICE_LIMIT_REACHED')
  }
})

test('repeated sign-ins count once, offline devices count, ended and expired devices release capacity', async () => {
  for (const deviceId of ['one', 'one', 'two', 'three']) await createAuthSession(args(deviceId))
  sessions.forEach(row => { row.lastSeenAt = new Date(0) })
  await assert.rejects(createAuthSession(args('four')), { code: 'DEVICE_LIMIT_REACHED' })
  sessions.filter(row => row.deviceId === 'one').forEach(row => { row.endedAt = new Date() })
  await createAuthSession(args('four'))
  sessions.find(row => row.deviceId === 'two').expiresAt = new Date(0)
  await createAuthSession(args('five'))
  await createAuthSession(args('six', 'another-learner'))
  await assert.rejects(createAuthSession(args('six')), { code: 'DEVICE_LIMIT_REACHED' })
})
