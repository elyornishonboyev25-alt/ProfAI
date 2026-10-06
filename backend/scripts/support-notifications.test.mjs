import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

// Real HTTP routes and owner middleware; in-memory storage prevents live notifications.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/support_test'
process.env.ACCESS_TOKEN_SECRET = 'support-test-access-secret-at-least-24'
process.env.REFRESH_TOKEN_SECRET = 'support-test-refresh-secret-at-least-24'
const { default: express } = await import('express')
const { default: router } = await import('../dist/routes/support.routes.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { signAccessToken } = await import('../dist/utils/jwt.js')
const reports = new Map([
  ['r1', { id: 'r1', userId: 'learner-a', status: 'OPEN', category: 'BUG', description: 'Cannot review SAT mistakes', name: 'Learner A', email: 'a@example.test', pagePath: '/sat/question-bank' }],
  ['r2', { id: 'r2', userId: 'learner-a', status: 'OPEN', category: 'BUG', description: 'Review page is not opening', name: 'Learner A', email: 'a@example.test', pagePath: '/sat/question-bank' }],
  ['r3', { id: 'r3', userId: 'learner-b', status: 'OPEN', category: 'BUG', description: 'Cannot review SAT mistakes', name: 'Learner B', email: 'b@example.test', pagePath: '/sat/question-bank' }],
])
const notifications = new Map()
const owner = signAccessToken({ sub: 'owner', role: 'USER' })
const other = signAccessToken({ sub: 'other', role: 'ADMIN' })
const original = { user: prisma.user.findUnique, findMany: prisma.issueReport.findMany, findUnique: prisma.issueReport.findUnique, updateMany: prisma.issueReport.updateMany, count: prisma.issueReport.count, users: prisma.user.findMany, userCount: prisma.user.count, createNotifications: prisma.notification.createMany, notifications: prisma.notification.findMany, transaction: prisma.$transaction }
let server, base, failWrite = false, lastReportWhere
function matches(report, where = {}) {
  if (where.id?.in && !where.id.in.includes(report.id)) return false
  if (where.status && report.status !== where.status) return false
  if (where.category && report.category !== where.category) return false
  if (where.OR && !where.OR.some(clause => Object.entries(clause).some(([key, value]) => String(report[key]).toLowerCase().includes(value.contains.toLowerCase())))) return false
  return true
}
before(async () => {
  prisma.user.findUnique = async ({ where }) => ({ email: where.id === 'owner' ? 'elyornishonboyev000@gmail.com' : 'other@example.test' })
  prisma.user.findMany = async () => []
  prisma.user.count = async () => 2
  prisma.issueReport.findUnique = async ({ where }) => reports.get(where.id) ?? null
  prisma.issueReport.findMany = async ({ where, skip = 0, take = 100 }) => { lastReportWhere = where; return [...reports.values()].filter(report => matches(report, where)).slice(skip, skip + take) }
  prisma.issueReport.count = async ({ where } = {}) => [...reports.values()].filter(report => matches(report, where)).length
  prisma.issueReport.updateMany = async ({ where, data }) => {
    const entries = [...reports.values()].filter(report => matches(report, where))
    entries.forEach(report => Object.assign(report, data))
    return { count: entries.length }
  }
  prisma.notification.createMany = async ({ data, skipDuplicates }) => {
    if (failWrite) throw new Error('Simulated storage failure')
    assert.equal(skipDuplicates, true)
    let count = 0
    for (const item of data) if (!notifications.has(item.id)) { notifications.set(item.id, { ...item, readAt: null, createdAt: new Date().toISOString() }); count++ }
    return { count }
  }
  prisma.notification.findMany = async ({ where }) => [...notifications.values()].filter(item => item.userId === where.userId && item.metadata.kind === where.AND[0].metadata.equals && item.metadata.reportIds.includes(where.AND[1].metadata.array_contains[0]))
  prisma.$transaction = async fn => fn(prisma)
  const app = express()
  app.use(express.json()); app.use('/support', router)
  app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }))
  server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  base = `http://127.0.0.1:${server.address().port}/support`
})
after(async () => {
  prisma.user.findUnique = original.user; prisma.user.findMany = original.users; prisma.user.count = original.userCount
  Object.assign(prisma.issueReport, { findMany: original.findMany, findUnique: original.findUnique, updateMany: original.updateMany, count: original.count })
  Object.assign(prisma.notification, { createMany: original.createNotifications, findMany: original.notifications })
  prisma.$transaction = original.transaction
  await new Promise(resolve => server.close(resolve))
})
const draft = (overrides = {}) => ({ reportIds: ['r1'], title: 'Report update', message: 'The issue is fixed. Please try reviewing your mistakes again.', requestId: randomUUID(), ...overrides })
const request = (path, { token = owner, method = 'GET', body } = {}) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
const send = (body, token = owner) => request('/owner/reports/notify', { token, method: 'POST', body })

test('only the owner can notify reporters or inspect their reply history', async () => {
  for (const [token, expected] of [[null, 401], [other, 403]]) {
    assert.equal((await send(draft(), token)).status, expected)
    assert.equal((await request('/owner/reports/r1/replies', { token })).status, expected)
  }
  assert.equal(notifications.size, 0)
})
test('invalid input and missing reports produce no partial delivery or resolution', async () => {
  for (const overrides of [{ reportIds: [] }, { reportIds: Array(101).fill('r1') }, { title: '  ' }, { title: 'x'.repeat(121) }, { message: 'short' }, { message: 'x'.repeat(3001) }, { requestId: 'invalid' }, { resolve: 'yes' }]) assert.equal((await send(draft(overrides))).status, 400)
  assert.equal((await send(draft({ reportIds: ['r1', 'missing'], resolve: true }))).status, 404)
  assert.equal(reports.get('r1').status, 'OPEN')
  assert.equal(notifications.size, 0)
})
test('multiple reports and duplicate IDs send once to each distinct account; retries stay idempotent', async () => {
  const body = draft({ reportIds: ['r1', 'r1', 'r2', 'r3'], resolve: true })
  const response = await send(body)
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { sentCount: 2, recipientCount: 2, reportCount: 3 })
  assert.equal(notifications.size, 2)
  assert.equal(new Set([...notifications.values()].map(item => item.userId)).size, 2)
  for (const item of notifications.values()) {
    assert.equal(item.type, 'SYSTEM'); assert.equal(item.readAt, null)
    assert.equal(item.metadata.kind, 'ISSUE_REPORT_REPLY')
    assert.equal(item.message, body.message)
    assert.deepEqual(item.metadata.reportIds.sort(), item.userId === 'learner-a' ? ['r1', 'r2'] : ['r3'])
  }
  assert.ok([...reports.values()].every(report => report.status === 'RESOLVED'))
  reports.get('r1').status = 'OPEN'
  const retries = await Promise.all([send(body), send(body)])
  for (const retry of retries) assert.equal((await retry.json()).sentCount, 0)
  assert.equal(notifications.size, 2)
  assert.equal(reports.get('r1').status, 'OPEN', 'retry must not close a reopened report')
})
test('reply history is scoped to the reporter and requested report', async () => {
  const first = await (await request('/owner/reports/r1/replies')).json()
  const second = await (await request('/owner/reports/r3/replies')).json()
  assert.equal(first.items.length, 1); assert.equal(second.items.length, 1)
  assert.notEqual(first.items[0].id, second.items[0].id)
  assert.equal((await request('/owner/reports/missing/replies')).status, 404)
})
test('failed writes leave selected reports open and a successful retry works', async () => {
  const body = draft({ resolve: true })
  const count = notifications.size
  failWrite = true
  assert.equal((await send(body)).status, 500)
  assert.equal(reports.get('r1').status, 'OPEN'); assert.equal(notifications.size, count)
  failWrite = false
  assert.equal((await send(body)).status, 201)
  assert.equal(reports.get('r1').status, 'RESOLVED'); assert.equal(notifications.size, count + 1)
})
test('search and category filters apply across the catalog, and malformed filters are rejected', async () => {
  const response = await request('/owner/overview?q=mistakes&category=BUG&status=RESOLVED')
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.reports.total, 2)
  assert.equal(lastReportWhere.OR[0].name.mode, 'insensitive')
  assert.equal(data.reports.items[0].userId, 'learner-a')
  for (const query of ['category=INVALID', 'q=' + 'x'.repeat(201), 'reportPage=0']) assert.equal((await request('/owner/overview?' + query)).status, 400)
})
