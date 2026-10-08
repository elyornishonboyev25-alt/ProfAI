import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { build } from '../../node_modules/esbuild/lib/main.js'

const require = createRequire(import.meta.url)
const express = require('express')
const jwt = require('jsonwebtoken')
const { Prisma } = require('@prisma/client')
const models = Prisma.dmmf.datamodel.models
const names = new Map(models.map(model => [model.name, model.name[0].toLowerCase() + model.name.slice(1)]))
let rows = Object.fromEntries(models.map(model => [model.name, []]))
let failDeletion = false
const secret = 'account-deletion-regression-secret'
const email = 'learner@gmail.com'
const owner = { id: 'deleted-user', email, role: 'USER', xp: 900, level: 8, currentStreak: 7 }
const other = { id: 'other-user', email: 'other@gmail.com', role: 'USER', xp: 40 }
const matches = (row, where) => Object.entries(where).every(([key, value]) => {
  if (key === 'OR') return value.some(part => matches(row, part))
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    if ('equals' in value) return value.mode === 'insensitive'
      ? String(row[key]).toLowerCase() === value.equals.toLowerCase() : row[key] === value.equals
    return (!('gt' in value) || row[key] > value.gt) && (!('lt' in value) || row[key] < value.lt)
  }
  return row[key] === value
})

// Exercise the real route and transaction against the generated Prisma relation
// contract, including Restrict, SetNull and recursive personal-data cascades.
function remove(modelName, row) {
  for (const model of models) for (const relation of model.fields) {
    if (relation.type !== modelName || !relation.relationFromFields?.length) continue
    const field = relation.relationFromFields[0]
    const target = relation.relationToFields[0]
    const dependents = rows[model.name].filter(candidate => candidate[field] === row[target])
    for (const dependent of dependents) {
      if (relation.relationOnDelete === 'Cascade') remove(model.name, dependent)
      else if (relation.relationOnDelete === 'SetNull') dependent[field] = null
      else throw new Error(`Restricted by ${model.name}`)
    }
  }
  rows[modelName] = rows[modelName].filter(candidate => candidate !== row)
}
const prisma = Object.fromEntries(models.map(model => [names.get(model.name), {
  findUnique: async ({ where }) => rows[model.name].find(row => matches(row, where)) ?? null,
  findFirst: async ({ where }) => rows[model.name].filter(row => matches(row, where)).at(-1) ?? null,
  create: async ({ data }) => {
    const row = { id: crypto.randomUUID(), xp: 0, level: 1, currentStreak: 0, role: 'USER', profile: null,
      attempts: 0, consumedAt: null, createdAt: new Date(), ...data }
    rows[model.name].push(row)
    return row
  },
  delete: async ({ where }) => {
    if (model.name === 'User' && failDeletion) throw new Error('Simulated database failure')
    const row = rows[model.name].find(row => matches(row, where))
    if (!row) throw new Error('Record not found')
    remove(model.name, row)
    return row
  },
  deleteMany: async ({ where }) => {
    const selected = rows[model.name].filter(row => matches(row, where))
    for (const row of selected) remove(model.name, row)
    return { count: selected.length }
  },
  updateMany: async ({ where, data }) => {
    const selected = rows[model.name].filter(row => matches(row, where))
    for (const row of selected) Object.assign(row, data)
    return { count: selected.length }
  },
}]))
prisma.$transaction = async operation => {
  const snapshot = structuredClone(rows)
  try { return await operation(prisma) } catch (error) { rows = snapshot; throw error }
}
const bundled = await build({
  stdin: { contents: `export { default } from './backend/src/routes/auth.routes'; export { onAccountDeleted } from './backend/src/services/accountLifecycle';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  plugins: [{ name: 'isolated-account-deletion', setup(builder) {
    builder.onResolve({ filter: /\/lib\/prisma\.js$/ }, () => ({ path: 'prisma', namespace: 'test' }))
    builder.onResolve({ filter: /\/config\/env\.js$/ }, () => ({ path: 'env', namespace: 'test' }))
    builder.onResolve({ filter: /\/services\/billing\.service\.js$/ }, () => ({ path: 'billing', namespace: 'test' }))
    builder.onResolve({ filter: /\/services\/authEmail\.service\.js$/ }, () => ({ path: 'email', namespace: 'test' }))
    builder.onLoad({ filter: /.*/, namespace: 'test' }, ({ path }) => ({ contents: {
      prisma: 'export const prisma = globalThis.prisma',
      env: `export const env = { ACCESS_TOKEN_SECRET: '${secret}', REFRESH_TOKEN_SECRET: '${secret}', ACCESS_TOKEN_EXPIRES_IN: '15m', REFRESH_TOKEN_EXPIRES_IN: '30d', RESEND_API_KEY: 'test' }`,
      billing: "export async function accountOverview() { return { access: { active: false }, canCreateClass: false, canJoinClass: false } }",
      email: 'export const sendAuthCode = globalThis.sendAuthCode',
    }[path] }))
  } }],
})
let sentCode
const module = { exports: {} }
vm.runInNewContext(bundled.outputFiles[0].text, { module, exports: module.exports, require, prisma,
  sendAuthCode: async (_email, code) => { sentCode = code }, console, Buffer })
const cleaned = []
module.exports.onAccountDeleted(id => { cleaned.push(id) })
const app = express()
app.use(express.json(), module.exports.default)
app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }))
const server = app.listen(0, '127.0.0.1')
await new Promise(resolve => server.once('listening', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const token = jwt.sign({ sub: owner.id, role: 'ADMIN' }, secret)
async function call(path, method = 'GET', body, access = token) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json',
    ...(access ? { Authorization: `Bearer ${access}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: response.status, body: response.status === 204 ? null : await response.json() }
}
function seed() {
  rows = Object.fromEntries(models.map(model => [model.name, []]))
  rows.User = [{ ...owner }, { ...other }]
  // Populate every user-owned relation so a newly introduced Restrict or an
  // unhandled personal SetNull relation cannot silently escape this test.
  for (const model of models) for (const field of model.fields) {
    if (field.type !== 'User' || !field.relationFromFields?.length) continue
    const fk = field.relationFromFields[0]
    rows[model.name].push({ id: `${model.name}-${fk}`, [fk]: owner.id })
  }
  const attempt = rows.TestAttempt[0]
  const test = rows.Test[0]
  rows.TestQuestion.push({ id: 'question', testId: test.id })
  rows.AttemptAnswer.push({ id: 'answer', attemptId: attempt.id, questionId: 'question' })
  rows.AiConversationMessage.push({ id: 'message', threadId: rows.AiConversationThread[0].id })
  rows.VocabularyNotebookItem.push({ id: 'word', notebookId: rows.VocabularyNotebook[0].id })
  rows.GuestDiagnostic[0].claimedAt = new Date()
  rows.AuthVerificationCode.push({ id: 'old-code', email: email.toUpperCase(), purpose: 'REGISTER', consumedAt: new Date() })
  rows.FreeTrial.push({ email, expiresAt: new Date() })
  rows.AuthVerificationCode.push({ id: 'other-code', email: other.email })
  rows.FreeTrial.push({ email: other.email })
  rows.AssessmentResult.push({ id: 'other-result', userId: other.id, score: 8 })
  rows.LearningCenterInvitation.push({ id: 'invitation-to-deleted-user', invitedById: other.id, email: email.toUpperCase() })
  rows.PaymentRequest.push({ id: 'other-payment', userId: other.id, reviewedBy: owner.id })
  rows.PremiumGrant.push({ userId: other.id, grantedBy: owner.id })
}
try {
  seed()
  const before = structuredClone(rows)
  assert.equal((await call('/account', 'DELETE', { email: other.email, confirmation: 'DELETE' })).status, 400)
  assert.equal((await call('/account', 'DELETE', { email, confirmation: 'WRONG' })).status, 400)
  assert.deepEqual(rows, before, 'Invalid confirmation cannot remove any data')
  failDeletion = true
  assert.equal((await call('/account', 'DELETE', { email, confirmation: 'DELETE' })).status, 500)
  assert.deepEqual(rows, before, 'A failed deletion restores all data, including email-keyed records')
  assert.equal(cleaned.length, 0, 'Runtime data remains available after rollback')
  failDeletion = false
  assert.equal((await call('/account', 'DELETE', { email: email.toUpperCase(), confirmation: 'DELETE' })).status, 204)
  assert.deepEqual(cleaned, [owner.id])
  for (const model of models) for (const field of model.fields) {
    if (field.type !== 'User' || !field.relationFromFields?.length) continue
    assert.equal(rows[model.name].some(row => row[field.relationFromFields[0]] === owner.id), false, model.name)
  }
  for (const name of ['AttemptAnswer', 'AiConversationMessage', 'VocabularyNotebookItem', 'GuestDiagnostic']) assert.equal(rows[name].length, 0, name)
  assert.equal(rows.AuthVerificationCode.some(row => row.email.toLowerCase() === email), false)
  assert.equal(rows.FreeTrial.some(row => row.email === email), false)
  assert.equal(rows.AssessmentResult[0].id, 'other-result')
  assert.equal(rows.PaymentRequest[0].reviewedBy, null)
  assert.equal(rows.PremiumGrant[0].grantedBy, null)
  assert.equal(rows.Test.length, 1, 'Shared test catalog remains usable')
  assert.equal(rows.ShadowingVideo.length, 1, 'Shared media catalog remains usable')
  assert.equal((await call('/me')).body.code, 'ACCOUNT_DELETED', 'Old access tokens are rejected immediately')
  const oldRefresh = jwt.sign({ sub: owner.id, tokenId: 'old-refresh' }, secret)
  assert.equal((await call('/refresh', 'POST', { refreshToken: oldRefresh }, null)).body.code, 'ACCOUNT_DELETED', 'Expired access tokens cannot restore a deleted account through refresh')
  assert.equal((await call('/account', 'DELETE', { email, confirmation: 'DELETE' })).status, 401)
  assert.equal((await call('/verification/request', 'POST', { email, purpose: 'REGISTER' }, null)).status, 202)
  const registered = await call('/email/register', 'POST', { email, verificationCode: sentCode }, null)
  assert.equal(registered.status, 201)
  assert.notEqual(registered.body.user.id, owner.id)
  assert.equal(registered.body.user.xp, 0)
  assert.equal(registered.body.user.level, 1)
  assert.equal(registered.body.user.currentStreak, 0)
  assert.equal(registered.body.user.onboardingCompleted, false)
  assert.equal((await call('/me')).status, 401, 'Re-registering does not revive an old token')
  assert.equal((await call('/me', 'GET', undefined, registered.body.accessToken)).status, 200)
  const migration = await readFile('backend/prisma/migrations/20261008120000_permanent_account_deletion/migration.sql', 'utf8')
  assert.ok(migration.includes('"claimedById" IS NULL AND "claimedAt" IS NOT NULL'))
  console.log('Permanent deletion: confirmation, rollback, all personal relations, other-account isolation, immediate token rejection and fresh same-email registration passed.')
} finally {
  await new Promise(resolve => server.close(resolve))
}
