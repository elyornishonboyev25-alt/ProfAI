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
    create: async ({ data }) => {
      const row = { id: crypto.randomUUID(), role: 'USER', xp: 0, level: 1, currentStreak: 0, profile: null, ...data }
      users.push(row)
      return row
    },
    upsert: async ({ where, create }) => users.find((row) => matches(row, where)) ?? globalThis.prisma.user.create({ data: create }),
    update: async ({ where, data }) => Object.assign(users.find((row) => matches(row, where)), data),
  },
  refreshToken: {
    create: async ({ data }) => { tokens.push(data); return data },
    updateMany: async () => { revoked = true; return { count: tokens.length } },
  },
  $transaction: async (queries) => Promise.all(queries),
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
async function post(path, body) {
  const response = await realFetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return { status: response.status, body: await response.json() }
}
async function request(purpose = 'SIGN_IN') {
  return post('/verification/request', { email, purpose })
}
const deliveredCode = () => sent.at(-1).subject.match(/^\d{6}/)[0]
beforeEach(() => {
  codes = []; users = []; sent = []; tokens = []; revoked = false; providerFails = false
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
