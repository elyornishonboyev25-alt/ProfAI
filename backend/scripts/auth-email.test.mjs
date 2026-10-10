import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { after, beforeEach, test } from 'node:test'
import express from 'express'

// Set test configuration before loading env.ts. No real database or email calls.
Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost:1/test',
  ACCESS_TOKEN_SECRET: 'test-access-secret-at-least-24-characters',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret-at-least-24-characters',
  RESEND_API_KEY: 'test-email-provider-key',
})
let codes = []
let users = []
let sent = []
let tokens = []
let sessions = []
let providerFails = false
let revoked = false
const matches = (row, where) => Object.entries(where).every(([key, value]) => {
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return (!('gt' in value) || row[key] > value.gt) && (!('lt' in value) || row[key] < value.lt)
  }
  return row[key] === value
})
globalThis.prisma = {
  authVerificationCode: {
    findFirst: async ({ where }) => codes.filter((row) => matches(row, where)).at(-1) ?? null,
    create: async ({ data }) => {
      const row = { id: crypto.randomUUID(), attempts: 0, consumedAt: null, createdAt: new Date(), ...data }
      codes.push(row)
      return row
    },
    deleteMany: async ({ where }) => { codes = codes.filter((row) => !matches(row, where)); return { count: 1 } },
    delete: async ({ where }) => { codes = codes.filter((row) => row.id !== where.id) },
    updateMany: async ({ where, data }) => {
      const rows = codes.filter((row) => matches(row, where))
      for (const row of rows) {
        if (data.attempts) row.attempts += data.attempts.increment
        if (data.consumedAt) row.consumedAt = data.consumedAt
      }
      return { count: rows.length }
    },
  },
  user: {
    findUnique: async ({ where }) => users.find((row) => matches(row, where)) ?? null,
    findUniqueOrThrow: async ({ where }) => {
      const user = users.find((row) => matches(row, where))
      if (!user) throw new Error('Account not found')
      return user
    },
    create: async ({ data }) => {
      const row = { id: crypto.randomUUID(), role: 'USER', xp: 0, level: 1, currentStreak: 0, profile: null, ...data }
      users.push(row)
      return row
    },
    upsert: async ({ where, create }) => users.find((row) => matches(row, where)) ?? globalThis.prisma.user.create({ data: create }),
    update: async ({ where, data }) => Object.assign(users.find((row) => matches(row, where)), data),
  },
  refreshToken: {
    create: async ({ data }) => { const row = { id: crypto.randomUUID(), revokedAt: null, ...data }; tokens.push(row); return row },
    findUnique: async ({ where }) => { const token = tokens.find(row => matches(row, where)); return token ? { ...token, user: users.find(user => user.id === token.userId) } : null },
    update: async ({ where, data }) => Object.assign(tokens.find(row => matches(row, where)), data),
    updateMany: async () => { revoked = true; return { count: tokens.length } },
  },
  authSession: {
    create: async ({ data }) => { const row = { id: crypto.randomUUID(), loginAt: new Date(), lastSeenAt: new Date(), endedAt: null, ...data }; sessions.push(row); return row },
    update: async ({ where, data }) => Object.assign(sessions.find(row => matches(row, where)), data),
    updateMany: async ({ where, data }) => { const rows = sessions.filter(row => matches(row, where)); rows.forEach(row => Object.assign(row, data)); return { count: rows.length } },
  },
  premiumGrant: { findUnique: async () => null },
  billingSubscription: { findMany: async () => [] },
  freeTrial: { findUnique: async () => null },
  $transaction: async (queries) => typeof queries === 'function' ? queries(globalThis.prisma) : Promise.all(queries),
}
const realFetch = globalThis.fetch
globalThis.fetch = async (url, options) => {
  if (url === 'https://api.resend.com/emails') {
    sent.push(JSON.parse(options.body))
    return new Response('{}', { status: providerFails ? 403 : 200 })
  }
  return realFetch(url, options)
}
const { default: router } = await import('../dist/routes/auth.routes.js')
const { env } = await import('../dist/config/env.js')
const { authRateLimit } = await import('../dist/middleware/rateLimit.js')
const { verifyPassword } = await import('../dist/utils/password.js')
const app = express()
app.use(express.json(), router)
app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }))
const server = await new Promise((resolve) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)) })
const base = `http://127.0.0.1:${server.address().port}`
const email = 'learner@gmail.com'
async function post(path, body, headers = {}) {
  const response = await realFetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  return { status: response.status, body: response.status === 204 ? null : await response.json() }
}
async function request(purpose = 'SIGN_IN') {
  return post('/verification/request', { email, purpose })
}
const deliveredCode = () => sent.at(-1).subject.match(/^\d{6}/)[0]
beforeEach(() => {
  codes = []; users = []; sent = []; tokens = []; sessions = []; revoked = false; providerFails = false
  env.RESEND_API_KEY = 'test-email-provider-key'
  authRateLimit.resetKey('127.0.0.1')
})
after(async () => { globalThis.fetch = realFetch; await new Promise((resolve) => server.close(resolve)) })

test('email is delivered through provider, stored hashed, and never returned to browser', async () => {
  await globalThis.prisma.user.create({ data: { email, fullName: 'Learner' } })
  const result = await request()
  assert.equal(result.status, 202)
  assert.equal(result.body.delivered, true)
  assert.equal(result.body.developmentCode, undefined)
  assert.deepEqual(sent[0].to, [email])
  assert.notEqual(codes[0].codeHash, deliveredCode())
  assert.equal(codes[0].codeHash.length, 64)
  assert.equal((await request()).status, 429)
})

test('verified new Gmail creates one account through the create-account flow', async () => {
  await request('REGISTER')
  const body = { email, verificationCode: deliveredCode() }
  const result = await post('/email/register', body)
  assert.equal(result.status, 201)
  assert.equal(users.length, 1)
  assert.equal(result.body.user.onboardingCompleted, false)
  assert.ok(result.body.accessToken)
  assert.ok(result.body.refreshToken)
  assert.equal(result.body.user.passwordHash, undefined)
  assert.equal((await post('/email/register', body)).status, 409)
  assert.equal(tokens.length, 1)
})

test('sign-in cannot create an account or send a sign-in code to an unknown Gmail', async () => {
  const response = await request()
  assert.equal(response.status, 404)
  assert.equal(response.body.code, 'ACCOUNT_NOT_FOUND')
  assert.equal(sent.length, 0)
  assert.equal(users.length, 0)
})

test('existing account identity and progress survive code sign-in', async () => {
  const user = await globalThis.prisma.user.create({ data: { email, fullName: 'Learner', xp: 450, profile: { onboardingCompletedAt: new Date() } } })
  await request()
  const result = await post('/email/login', { email, verificationCode: deliveredCode() })
  assert.equal(result.status, 200)
  assert.equal(result.body.user.id, user.id)
  assert.equal(result.body.user.xp, 450)
  assert.equal(result.body.user.onboardingCompleted, true)
  assert.equal(users.length, 1)
})

test('concurrent verification admits only one session', async () => {
  await globalThis.prisma.user.create({ data: { email, fullName: 'Learner' } })
  await request()
  const body = { email, verificationCode: deliveredCode() }
  const results = await Promise.all([post('/email/login', body), post('/email/login', body)])
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 400])
  assert.equal(tokens.length, 1)
})

test('five wrong codes lock the challenge, including a subsequent correct code', async () => {
  await globalThis.prisma.user.create({ data: { email, fullName: 'Learner' } })
  await request()
  const correct = deliveredCode()
  const wrong = correct === '000000' ? '000001' : '000000'
  for (let index = 0; index < 5; index++) assert.equal((await post('/email/login', { email, verificationCode: wrong })).status, 400)
  const result = await post('/email/login', { email, verificationCode: correct })
  assert.equal(result.body.code, 'CODE_LOCKED')
  assert.equal(users.length, 1)
})

test('expired and wrong-purpose codes are rejected', async () => {
  await request('REGISTER')
  await globalThis.prisma.user.create({ data: { email, fullName: 'Learner' } })
  assert.equal((await post('/email/login', { email, verificationCode: deliveredCode() })).status, 400)
  codes[0].purpose = 'SIGN_IN'
  codes[0].expiresAt = new Date(0)
  const result = await post('/email/login', { email, verificationCode: deliveredCode() })
  assert.equal(result.body.code, 'CODE_EXPIRED')
})

test('resending invalidates the previous challenge', async () => {
  await globalThis.prisma.user.create({ data: { email, fullName: 'Learner' } })
  await request()
  const previousId = codes[0].id
  codes[0].createdAt = new Date(Date.now() - 61_000)
  assert.equal((await request()).status, 202)
  assert.equal(codes.length, 1)
  assert.notEqual(codes[0].id, previousId)
})

test('missing configuration and provider failures never report success', async () => {
  env.RESEND_API_KEY = ''
  assert.equal((await request()).body.code, 'EMAIL_NOT_CONFIGURED')
  assert.equal(sent.length, 0)
  env.RESEND_API_KEY = 'test-email-provider-key'
  providerFails = true
  await globalThis.prisma.user.create({ data: { email, fullName: 'Learner' } })
  assert.equal((await request()).body.code, 'EMAIL_DELIVERY_FAILED')
  assert.equal(codes.length, 0)
})

test('registration requires its emailed code and creates a usable password', async () => {
  await request('REGISTER')
  const result = await post('/register', { email, verificationCode: deliveredCode(), password: 'new-password-123' })
  assert.equal(result.status, 201)
  assert.equal(await verifyPassword('new-password-123', users[0].passwordHash), true)
  assert.equal(result.body.user.nickname, null)
  const login = await post('/login', { email, password: 'new-password-123' })
  assert.equal(login.status, 200)
  assert.equal(login.body.user.id, result.body.user.id)
  assert.ok(login.body.accessToken)
  assert.equal((await post('/login', { email, password: 'wrong-password-123' })).status, 401)
  assert.equal((await request('REGISTER')).body.code, 'ACCOUNT_EXISTS')
})

test('password recovery changes password, revokes refresh sessions, and rejects replay', async () => {
  await globalThis.prisma.user.create({ data: { email, fullName: 'Learner' } })
  await request('RESET_PASSWORD')
  const body = { email, verificationCode: deliveredCode(), newPassword: 'replacement-password-123' }
  assert.equal((await post('/password/reset', body)).status, 200)
  assert.equal(await verifyPassword(body.newPassword, users[0].passwordHash), true)
  assert.equal(revoked, true)
  assert.equal((await post('/password/reset', body)).status, 400)
})

test('unknown recovery email has a generic response and creates no account', async () => {
  assert.equal((await request('RESET_PASSWORD')).status, 200)
  assert.equal(sent.length, 0)
  assert.equal(users.length, 0)
})

test('successful sign-ins track browser profiles; rotations and heartbeat do not add sign-ins', async () => {
  const device = '11111111-1111-4111-8111-111111111111'
  const headers = { 'X-Device-Id': device, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0' }
  await request('REGISTER')
  const registered = await post('/register', { email, verificationCode: deliveredCode(), password: 'new-password-123' }, headers)
  assert.equal(registered.status, 201)
  const login = await post('/login', { email, password: 'new-password-123' }, headers)
  assert.equal(login.status, 200)
  assert.equal(sessions.length, 2)
  assert.equal(new Set(sessions.map(row => row.deviceId)).size, 1)
  assert.equal(sessions[1].method, 'PASSWORD')
  const rotated = await post('/refresh', { refreshToken: login.body.refreshToken }, headers)
  assert.equal(rotated.status, 200)
  assert.equal(sessions.length, 2)
  assert.equal(tokens.at(-1).sessionId, sessions[1].id)
  assert.equal((await post('/refresh', { refreshToken: login.body.refreshToken }, headers)).status, 401)
  sessions[1].lastSeenAt = new Date(0)
  const auth = { ...headers, Authorization: `Bearer ${rotated.body.accessToken}` }
  assert.equal((await post('/activity/heartbeat', {}, auth)).status, 204)
  assert.ok(sessions[1].lastSeenAt.getTime() > 0)
  assert.equal(sessions.length, 2)
  assert.equal((await post('/logout', { refreshToken: rotated.body.refreshToken }, auth)).status, 204)
  assert.ok(sessions[1].endedAt)
  const ended = sessions[1].lastSeenAt
  await post('/activity/heartbeat', {}, auth)
  assert.equal(sessions[1].lastSeenAt, ended, 'Logged-out sessions cannot become online again')
  await post('/login', { email, password: 'new-password-123' }, { ...headers, 'X-Device-Id': '22222222-2222-4222-8222-222222222222' })
  assert.equal(new Set(sessions.map(row => row.deviceId)).size, 2)
  const before = sessions.length
  await post('/login', { email, password: 'wrong-password-123' }, headers)
  assert.equal(sessions.length, before, 'Failed sign-ins do not create history')
  codes = []
  await request('RESET_PASSWORD')
  await post('/password/reset', { email, verificationCode: deliveredCode(), newPassword: 'replacement-password-123' })
  assert.ok(sessions.every(row => row.endedAt), 'Password reset marks every device session offline')
})
