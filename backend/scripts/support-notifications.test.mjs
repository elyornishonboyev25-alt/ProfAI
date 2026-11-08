import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

// Real HTTP routes and owner middleware, isolated from live accounts/storage.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/support_test'
process.env.ACCESS_TOKEN_SECRET = 'support-test-access-secret-at-least-24'
process.env.REFRESH_TOKEN_SECRET = 'support-test-refresh-secret-at-least-24'
const { default: express } = await import('express')
const { default: router } = await import('../dist/routes/support.routes.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { fixtureAccessToken: signAccessToken, installSessionFixtures } = await import('./helpers/authSessions.mjs')
const reports = new Map([
  ['r1', { id: 'r1', userId: 'learner-a', description: 'Cannot review SAT mistakes' }],
  ['r2', { id: 'r2', userId: 'learner-a', description: 'Review page is not opening' }],
  ['r3', { id: 'r3', userId: 'learner-b', description: 'Cannot review SAT mistakes' }],
].map(([id, report]) => [id, { ...report, status: 'OPEN', needsReply: true, category: 'BUG', name: report.userId, email: `${report.userId}@example.test`, pagePath: '/sat/question-bank', createdAt: new Date('2020-01-01'), lastActivityAt: new Date('2020-01-01') }]))
const notifications = new Map(), messages = new Map()
const owner = signAccessToken({ sub: 'owner', role: 'USER' })
const additionalOwner = signAccessToken({ sub: 'additional-owner', role: 'USER' })
const nicknameOwner = signAccessToken({ sub: 'nickname-owner', role: 'USER' })
const lookalike = signAccessToken({ sub: 'lookalike', role: 'USER' })
const other = signAccessToken({ sub: 'other', role: 'ADMIN' })
const learnerA = signAccessToken({ sub: 'learner-a', role: 'USER' })
const learnerB = signAccessToken({ sub: 'learner-b', role: 'USER' })
let server, base, failWrite = false, failMessageWrite = false, lastReportWhere, lastReportOrder, restoreSessions
let ownerName = 'First Admin'
const restores = []
function replace(target, key, value) { const original = target[key]; restores.push(() => { target[key] = original }); target[key] = value }
function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(clause => matches(row, clause))
    if (key === 'AND') return value.every(clause => matches(row, clause))
    const actual = row[key]
    if (value === null || typeof value !== 'object' || value instanceof Date) return actual === value
    if ('in' in value && !value.in.includes(actual)) return false
    if ('contains' in value && !String(actual).toLowerCase().includes(value.contains.toLowerCase())) return false
    if ('gt' in value && !(actual > value.gt)) return false
    if ('gte' in value && !(actual >= value.gte)) return false
    if ('lte' in value && !(actual <= value.lte)) return false
    return true
  })
}
function list(rows, { where = {}, orderBy = [], skip = 0, take = 100, cursor } = {}) {
  let sorted = [...rows.values()].filter(row => matches(row, where)).sort((a, b) => {
    for (const clause of orderBy) {
      const [key, direction] = Object.entries(clause)[0]
      const result = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0
      if (result) return direction === 'desc' ? -result : result
    }
    return 0
  })
  if (cursor) sorted = sorted.slice(sorted.findIndex(row => row.id === cursor.id))
  return sorted.slice(skip, skip + take).map(row => ({ ...row }))
}
function createMessages({ data, skipDuplicates }) {
  if (failMessageWrite) throw new Error('Simulated history failure')
  let count = 0
  for (const entry of data) {
    const item = { authorId: null, authorName: null, authorEmail: null, title: null, notificationId: null, createdAt: new Date(), ...entry, id: entry.id ?? randomUUID() }
    if (messages.has(item.id)) { if (skipDuplicates) continue; throw new Error('Duplicate message') }
    messages.set(item.id, item); count++
  }
  return { count }
}
before(async () => {
  const getUser = async ({ where }) => ({ id: where.id, role: 'USER', fullName: where.id === 'owner' ? ownerName : where.id === 'additional-owner' ? 'Second Admin' : 'Learner', email: where.id === 'owner' ? 'elyornishonboyev000@gmail.com' : where.id === 'additional-owner' ? ' Firdavsalimqulov998@Gmail.com ' : `${where.id}@example.test`, nickname: where.id === 'nickname-owner' ? ' ERKINOV ' : where.id === 'lookalike' ? 'erkinov7' : null })
  replace(prisma.user, 'findUnique', getUser); replace(prisma.user, 'findUniqueOrThrow', getUser)
  replace(prisma.user, 'findMany', async () => []); replace(prisma.user, 'count', async () => 2)
  replace(prisma.issueReport, 'findUnique', async ({ where }) => reports.get(where.id) ? { ...reports.get(where.id) } : null)
  replace(prisma.issueReport, 'findFirst', async args => list(reports, args)[0] ?? null)
  replace(prisma.issueReport, 'findMany', async args => { lastReportWhere = args.where; lastReportOrder = args.orderBy; return list(reports, args) })
  replace(prisma.issueReport, 'count', async ({ where } = {}) => [...reports.values()].filter(row => matches(row, where)).length)
  replace(prisma.issueReport, 'updateMany', async ({ where, data }) => { const entries = [...reports.values()].filter(row => matches(row, where)); entries.forEach(row => Object.assign(row, data)); return { count: entries.length } })
  replace(prisma.issueReport, 'update', async ({ where, data }) => { Object.assign(reports.get(where.id), data); return { ...reports.get(where.id) } })
  replace(prisma.notification, 'createManyAndReturn', async ({ data, skipDuplicates }) => {
    if (failWrite) throw new Error('Simulated delivery failure')
    assert.equal(skipDuplicates, true)
    const result = []
    for (const item of data) if (!notifications.has(item.id)) { notifications.set(item.id, { ...item, readAt: null }); result.push({ id: item.id, userId: item.userId }) }
    return result
  })
  replace(prisma.notification, 'findMany', async args => list(notifications, args))
  replace(prisma.notification, 'findFirst', async args => list(notifications, args)[0] ?? null)
  replace(prisma.issueReportMessage, 'createMany', async args => createMessages(args))
  replace(prisma.issueReportMessage, 'create', async ({ data }) => { const id = randomUUID(); createMessages({ data: [{ ...data, id }] }); return messages.get(id) })
  replace(prisma.issueReportMessage, 'findMany', async args => list(messages, args))
  replace(prisma.issueReportMessage, 'findFirst', async args => list(messages, args)[0] ?? null)
  replace(prisma.authSession, 'count', async () => 0); replace(prisma.paymentRequest, 'count', async () => 0); replace(prisma.review, 'count', async () => 0)
  replace(prisma, '$queryRaw', async () => [])
  // Emulate transaction isolation/rollback; no partial delivery or acknowledgement.
  let queue = Promise.resolve()
  replace(prisma, '$transaction', fn => {
    const result = queue.then(async () => {
      const snapshots = [reports, notifications, messages].map(map => structuredClone([...map]))
      try { return await fn(prisma) } catch (error) {
        ;[reports, notifications, messages].forEach((map, i) => { map.clear(); snapshots[i].forEach(([id, value]) => map.set(id, value)) })
        throw error
      }
    })
    queue = result.catch(() => {})
    return result
  })
  restoreSessions = installSessionFixtures(prisma)
  const app = express(); app.use(express.json()); app.use('/support', router)
  app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }))
  server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  base = `http://127.0.0.1:${server.address().port}/support`
})
after(async () => { restoreSessions(); restores.reverse().forEach(restore => restore()); await new Promise(resolve => server.close(resolve)) })
const draft = (overrides = {}) => ({ reportIds: ['r1'], title: 'Report update', message: 'The issue is fixed. Please try reviewing your mistakes again.', requestId: randomUUID(), ...overrides })
const request = (path, { token = owner, method = 'GET', body } = {}) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
const send = (body, token = owner) => request('/owner/reports/notify', { token, method: 'POST', body })
const status = (id, status, token = owner) => request(`/owner/reports/${id}`, { token, method: 'PATCH', body: { status } })
const followUp = (id, token = learnerA, body = { message: 'Can I review the same test again?', requestId: randomUUID() }) => request(`/reports/${id}/replies`, { token, method: 'POST', body })
const get = async (path, token = owner) => { const response = await request(path, { token }); assert.equal(response.status, 200); return response.json() }

test('email owners and @erkinov can access overview/history; other accounts cannot manage reports', async () => {
  for (const token of [owner, additionalOwner, nicknameOwner]) {
    assert.equal((await request('/owner/overview', { token })).status, 200)
    assert.equal((await request('/owner/reports/r1/replies', { token })).status, 200)
  }
  for (const [token, expected] of [[null, 401], [other, 403], [learnerA, 403], [lookalike, 403]]) {
    assert.equal((await send(draft(), token)).status, expected)
    assert.equal((await request('/owner/reports/r1/replies', { token })).status, expected)
    assert.equal((await status('r1', 'IGNORED', token)).status, expected)
  }
  assert.equal(notifications.size, 0)
})
test('pending badges ignore read cursors, pending reports come first and cannot be silently resolved', async () => {
  const data = await get('/owner/updates?reports=2099-01-01T00:00:00.000Z')
  assert.equal(data.counts.reports, 3, 'old unanswered reports still require action')
  assert.equal((await status('r1', 'RESOLVED')).status, 409)
  assert.equal(reports.get('r1').needsReply, true)
  await get('/owner/overview?status=PENDING')
  assert.deepEqual(lastReportWhere, { needsReply: true })
  assert.deepEqual(lastReportOrder, [{ needsReply: 'desc' }, { lastActivityAt: 'desc' }, { id: 'desc' }])
})
test('invalid input and missing reports produce no partial delivery or resolution', async () => {
  for (const overrides of [{ reportIds: [] }, { reportIds: Array(101).fill('r1') }, { title: '  ' }, { title: 'x'.repeat(121) }, { message: '' }, { message: ' \n\t ' }, { message: 'x'.repeat(3001) }, { requestId: 'invalid' }, { resolve: 'yes' }]) assert.equal((await send(draft(overrides))).status, 400)
  assert.equal((await send(draft({ reportIds: ['r1', 'missing'], resolve: true }))).status, 404)
  assert.equal(reports.get('r1').status, 'OPEN'); assert.equal(notifications.size, 0)
})
test('batch replies deliver once per user, save admin snapshots per report and stay idempotent', async () => {
  const body = draft({ reportIds: ['r1', 'r1', 'r2', 'r3'], resolve: true })
  const response = await send(body)
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { sentCount: 2, recipientCount: 2, reportCount: 3 })
  assert.equal(notifications.size, 2); assert.equal(messages.size, 3)
  for (const item of messages.values()) { assert.equal(item.authorName, 'First Admin'); assert.equal(item.authorEmail, 'elyornishonboyev000@gmail.com'); assert.equal(item.authorId, 'owner') }
  assert.ok([...reports.values()].every(report => report.status === 'RESOLVED' && !report.needsReply))
  reports.get('r1').status = 'OPEN'; reports.get('r1').needsReply = true
  const retries = await Promise.all([send(body), send(body)])
  for (const retry of retries) assert.equal((await retry.json()).sentCount, 0)
  assert.equal(notifications.size, 2); assert.equal(messages.size, 3)
  assert.equal(reports.get('r1').needsReply, true, 'a retry cannot acknowledge a reopened report')
  ownerName = 'Renamed Admin'
  const history = await get('/owner/reports/r1/replies')
  assert.equal(history.items[0].authorName, 'First Admin', 'history preserves the name at send time')
})
test('ignore records the acting admin, clears pending without a notification and reopening restores it', async () => {
  const notificationCount = notifications.size
  assert.equal((await status('r1', 'IGNORED', additionalOwner)).status, 200)
  assert.equal(reports.get('r1').status, 'IGNORED'); assert.equal(reports.get('r1').needsReply, false)
  assert.equal(notifications.size, notificationCount)
  const history = await get('/owner/reports/r1/replies')
  assert.equal(history.items.at(-1).kind, 'IGNORED'); assert.equal(history.items.at(-1).authorName, 'Second Admin')
  const messageCount = messages.size
  assert.equal((await status('r1', 'IGNORED')).status, 200); assert.equal(messages.size, messageCount)
  assert.equal((await get('/owner/updates')).counts.reports, 0)
  assert.equal((await status('r1', 'OPEN')).status, 200)
  assert.equal(reports.get('r1').needsReply, true)
  assert.equal((await get('/owner/updates')).counts.reports, 1)
})
test('a reply acknowledges without marking resolved; later resolution still works', async () => {
  assert.equal((await send(draft(), additionalOwner)).status, 201)
  assert.equal(reports.get('r1').status, 'OPEN'); assert.equal(reports.get('r1').needsReply, false)
  assert.equal((await status('r1', 'RESOLVED')).status, 200)
})
test('user follow-ups stay in the selected report, reopen resolved reports and cannot access another account', async () => {
  const notification = [...notifications.values()].find(item => item.userId === 'learner-a')
  const linked = await get(`/notifications/${notification.id}/reports`, learnerA)
  assert.deepEqual(linked.items.map(item => item.id).sort(), ['r1', 'r2'])
  assert.equal((await request(`/notifications/${notification.id}/reports`, { token: learnerB })).status, 404)
  assert.equal((await request('/reports/r1/thread', { token: learnerB })).status, 404)
  assert.equal((await followUp('r1', learnerB)).status, 404)
  assert.equal((await followUp('r1', null)).status, 401)
  for (const body of [{ message: ' ', requestId: randomUUID() }, { message: 'x'.repeat(3001), requestId: randomUUID() }, { message: 'Hello', requestId: 'bad' }]) assert.equal((await followUp('r1', learnerA, body)).status, 400)
  const body = { message: 'What about my saved attempts?', requestId: randomUUID(), authorId: 'owner' }
  assert.equal((await followUp('r1', learnerA, body)).status, 201)
  assert.equal(reports.get('r1').status, 'OPEN'); assert.equal(reports.get('r1').needsReply, true)
  assert.equal(reports.get('r2').status, 'RESOLVED'); assert.equal(reports.get('r2').needsReply, false)
  const userThread = await get('/reports/r1/thread', learnerA)
  assert.ok(userThread.items.every(item => ['ADMIN_REPLY', 'USER_REPLY'].includes(item.kind)))
  assert.ok(userThread.items.every(item => !('authorEmail' in item) && !('authorId' in item)))
  assert.equal(userThread.items.at(-1).authorName, 'Learner')
  const history = await get('/owner/reports/r1/replies')
  assert.equal(history.items.at(-1).kind, 'USER_REPLY'); assert.equal(history.items.at(-1).authorId, 'learner-a')
  assert.equal((await send(draft(), additionalOwner)).status, 201)
  assert.equal(reports.get('r1').needsReply, false)
  const count = messages.size
  assert.equal((await followUp('r1', learnerA, body)).status, 201)
  assert.equal(messages.size, count); assert.equal(reports.get('r1').needsReply, false, 'retry after an admin answer must not reopen the report')
})
test('history pagination retains the full conversation and rejects cursors from other reports', async () => {
  for (let i = 0; i < 55; i++) createMessages({ data: [{ id: `older-${i}`, reportId: 'r1', kind: 'USER_REPLY', message: `Message ${i}`, createdAt: new Date(2021, 0, 1, 0, i) }] })
  const first = await get('/owner/reports/r1/replies')
  assert.equal(first.items.length, 50); assert.ok(first.nextCursor)
  const second = await get(`/owner/reports/r1/replies?before=${first.nextCursor}`)
  assert.ok(second.items.length > 0); assert.equal(second.nextCursor, null)
  assert.equal(new Set([...first.items, ...second.items].map(item => item.id)).size, [...messages.values()].filter(item => item.reportId === 'r1').length)
  assert.equal((await request(`/reports/r2/thread?before=${first.items[0].id}`, { token: learnerA })).status, 400)
  assert.equal((await request('/owner/reports/missing/replies')).status, 404)
})
test('delivery/history failures roll back notifications and pending state; retries work', async () => {
  await status('r1', 'IGNORED'); await status('r1', 'OPEN')
  const body = draft({ resolve: true }), count = notifications.size
  failWrite = true
  assert.equal((await send(body)).status, 500)
  assert.equal(reports.get('r1').needsReply, true); assert.equal(notifications.size, count)
  failWrite = false; failMessageWrite = true
  assert.equal((await send(body)).status, 500)
  assert.equal(reports.get('r1').needsReply, true); assert.equal(notifications.size, count)
  failMessageWrite = false
  assert.equal((await send(body)).status, 201)
  assert.equal(reports.get('r1').status, 'RESOLVED'); assert.equal(reports.get('r1').needsReply, false)
})
test('search/category/status filters apply across the catalog and malformed filters are rejected', async () => {
  const data = await get('/owner/overview?q=mistakes&category=BUG&status=RESOLVED')
  assert.equal(data.reports.total, 2); assert.equal(lastReportWhere.OR[0].name.mode, 'insensitive')
  for (const query of ['category=INVALID', 'q=' + 'x'.repeat(201), 'reportPage=0', 'status=INVALID']) assert.equal((await request('/owner/overview?' + query)).status, 400)
})


test('@erkinov can send short report replies without an owner email or admin role', async () => {
  const count = notifications.size
  const response = await send(draft({ message: ' Tuzatildi ' }), nicknameOwner)
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), { sentCount: 1, recipientCount: 1, reportCount: 1 })
  assert.equal(notifications.size, count + 1)
  assert.equal([...notifications.values()].at(-1).message, 'Tuzatildi')
})
