import test, { before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'

// Real Express routes, validation and JWT middleware; every Prisma operation
// is intercepted. Neither the production database nor AI services are used.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/classes_fixture'
process.env.ACCESS_TOKEN_SECRET = 'classes-fixture-access-secret-at-least-24'
process.env.REFRESH_TOKEN_SECRET = 'classes-fixture-refresh-secret-at-least-24'
for (const key of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5', 'OPENAI_API_KEY', 'HF_ACCESS_TOKEN']) process.env[key] = ''
const { default: express } = await import('express')
const { default: router } = await import('../dist/routes/learningCenters.routes.js')
const { default: testsRouter } = await import('../dist/routes/tests.routes.js')
const { default: dashboardRouter } = await import('../dist/routes/dashboard.routes.js')
const { prisma } = await import('../dist/lib/prisma.js')
const { fixtureAccessToken: signAccessToken, installSessionFixtures } = await import('./helpers/authSessions.mjs')
const { summarizeStudent, normalizeTestAttempt, classifyResult, buildDataDrivenInsight } = await import('../dist/services/learningCenterAnalytics.service.js')

const center = { id: 'center', name: 'Academy', slug: 'academy', city: 'Tashkent', logoUrl: null, coverUrl: null, createdById: 'owner', _count: { members: 4, groups: 1 } }
const identity = { id: 'learner', fullName: 'Test Learner', nickname: 'learner', avatarUrl: null, currentStreak: 3, profile: { targetExam: 'SAT', targetSatScore: 1450 } }
const roles = { owner: 'OWNER', admin: 'ADMIN', teacher: 'TEACHER', learner: 'STUDENT', stranger: null }
const calls = []
const overrides = new Map()
const originals = []
let server, base, claimed
const members = Object.entries(roles).filter(([, role]) => role).map(([userId, role]) => ({ id: 'member-' + userId, userId, role, centerId: center.id, center, status: 'ACTIVE', joinedAt: new Date(), user: { id: userId, fullName: userId, email: userId + '@example.test' }, groups: [] }))
const assignment = { title: 'SAT practice', kind: 'TEST', examTrack: 'SAT', routePath: '/sat', dueAt: new Date(Date.now() + 86_400_000).toISOString() }
const defaults = {
  'learningCenterMember.findFirst': ({ where }) => where.userId ? members.find(m => m.userId === where.userId && (!where.role?.in || where.role.in.includes(m.role))) ?? null : members.find(m => m.id === where.id) ?? null,
  'learningCenterMember.findUnique': ({ where }) => members.find(m => m.userId === where.centerId_userId.userId) ?? null,
  'learningCenterMember.findMany': ({ where }) => where.role === 'STUDENT' ? members.filter(m => m.role === 'STUDENT') : members,
  'learningCenterMember.count': () => 0,
  'learningCenterMember.update': ({ where, data }) => ({ ...members.find(m => m.id === where.id), ...data }),
  'learningCenterMember.upsert': ({ create }) => ({ id: 'new-member', ...create }),
  'learningCenter.findFirst': () => null,
  'learningCenter.findUnique': () => null,
  'learningCenter.create': ({ data }) => ({ ...center, ...data }),
  'learningCenter.update': ({ data }) => ({ ...center, ...data }),
  'learningCenter.delete': () => center,
  'learningCenterGroup.findMany': () => [],
  'learningCenterGroup.findFirst': () => null,
  'learningCenterGroup.count': () => 0,
  'learningCenterGroup.groupBy': () => [],
  'learningCenterGroup.create': ({ data }) => ({ id: 'group', ...data }),
  'learningCenterGroup.updateMany': () => ({ count: 1 }),
  'learningCenterGroupMember.findMany': () => [{ member: { userId: 'learner' } }],
  'learningCenterGroupMember.upsert': ({ create }) => create,
  'learningCenterGroupMember.deleteMany': () => ({ count: 1 }),
  'learningCenterInvitation.findUnique': () => ({ id: 'invite', centerId: center.id, center, code: 'ABC123', role: 'STUDENT', email: null, groupId: null, acceptedAt: null, expiresAt: new Date(Date.now() + 86_400_000) }),
  'learningCenterInvitation.count': () => 0,
  'learningCenterInvitation.updateMany': () => ({ count: claimed ? 0 : (claimed = true, 1) }),
  'learningCenterInvitation.create': ({ data }) => ({ id: 'invite', ...data }),
  'learningCenterAssignment.findMany': () => [],
  'learningCenterAssignment.create': ({ data }) => ({ id: 'assignment', ...data }),
  'learningCenterAssignmentSubmission.findMany': () => [],
  'learningCenterAssignmentSubmission.findFirst': () => ({ id: 'submission', studentId: 'learner', startedAt: null }),
  'learningCenterAssignmentSubmission.update': ({ data }) => ({ id: 'submission', ...data }),
  'learningCenterAssignmentSubmission.updateMany': () => ({ count: 1 }),
  'learningCenterTeacherNote.findMany': () => [],
  'learningCenterTeacherNote.create': ({ data }) => ({ id: 'note', ...data, author: { id: data.authorId, fullName: 'Alex Teacher', avatarUrl: null } }),
  'user.findUnique': ({ where }) => where.email ? { id: 'new-user' } : { id: where.id, role: 'USER', email: where.id + '@example.test' },
  'user.findFirst': () => ({ id: 'new-user' }),
  'user.findUniqueOrThrow': () => ({ role: 'ADMIN', email: 'class@example.test', nickname: null }),
  'premiumGrant.findUnique': () => null,
  'billingSubscription.findMany': () => [],
  'freeTrial.findUnique': () => null,
  'user.count': () => 1,
  'user.findMany': ({ where }) => where.id.in.includes('learner') ? [identity] : [],
  'testAttempt.findMany': () => [],
  'testAttempt.findFirst': () => ({ id: 'existing-attempt' }),
  'test.upsert': () => ({ id: 'test', durationSec: 3600, difficulty: 'HARD', xpReward: 100 }),
  'assessmentResult.findMany': () => [],
  'assessmentResult.upsert': ({ create }) => ({ id: 'result', ...create }),
  'speakingSession.findMany': () => [],
  'xpEvent.findMany': () => [],
  'notification.createMany': () => ({ count: 1 }),
  'notification.create': ({ data }) => ({ id: 'notice', ...data, readAt: null, createdAt: new Date() }),
  'notification.findMany': () => [],
  'notification.count': () => 0,
}
before(async () => {
  for (const [model, delegate] of Object.entries(prisma)) {
    if (!delegate || typeof delegate !== 'object' || !('findMany' in delegate)) continue
    for (const method of ['findFirst', 'findUnique', 'findUniqueOrThrow', 'findMany', 'count', 'create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert', 'groupBy']) {
      originals.push([delegate, method, delegate[method]])
      delegate[method] = async args => {
        const key = `${model}.${method}`
        calls.push({ key, args })
        const handler = overrides.get(key) ?? defaults[key]
        if (!handler) throw new Error('Unmocked database operation: ' + key)
        return handler(args)
      }
    }
  }
  prisma.$transaction = async callback => { assert.equal(typeof callback, 'function'); return callback(prisma) }
  installSessionFixtures(prisma)
  prisma.$queryRaw = async () => []
  prisma.$connect = async () => { throw new Error('Database connections forbidden in fixtures') }
  const app = express()
  app.use(express.json({ limit: '1mb' }))
  app.use('/centers', router)
  app.use('/tests', testsRouter)
  app.use('/dashboard', dashboardRouter)
  app.use((error, _req, res, next) => { void next; res.status(500).json({ message: error.message }) })
  server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  base = `http://127.0.0.1:${server.address().port}/centers`
})
beforeEach(() => { calls.length = 0; overrides.clear(); claimed = false })
after(async () => { for (const [delegate, method, original] of originals) delegate[method] = original; await new Promise(resolve => server.close(resolve)) })
async function request(path, method = 'GET', body, user = 'owner') {
  const token = user ? signAccessToken({ sub: user, role: 'USER' }) : null
  return fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
}
const point = (score, skill = 'SAT_OVERALL', index = 0) => ({ id: 'r' + index, examType: skill.startsWith('SAT') ? 'SAT' : 'IELTS', skill, score, maxScore: skill.startsWith('SAT') ? 1600 : 9, completedAt: new Date(Date.now() - (10 - index) * 60_000), title: 'Fixture', source: 'ASSESSMENT_RESULT', durationSec: 60, accuracy: null })

test('every class section requires authentication and active membership', async () => {
  for (const section of ['overview', 'students', 'groups', 'team', 'assignments', 'leaderboard']) {
    assert.equal((await request('/academy/' + section, 'GET', undefined, null)).status, 401)
    assert.equal((await request('/academy/' + section, 'GET', undefined, 'stranger')).status, 404)
    assert.equal((await request('/academy/' + section)).status, 200, section)
  }
})
test('class creation trims its name, rejects duplicates and invalid photos', async () => {
  assert.equal((await request('/workspaces', 'POST', { name: '   ' })).status, 400)
  assert.equal((await request('/workspaces', 'POST', { name: 'Academy', coverUrl: 'https://untrusted.test/image' })).status, 400)
  const created = await request('/workspaces', 'POST', { name: '  Academy  ' })
  assert.equal(created.status, 201); assert.equal((await created.json()).workspace.name, 'Academy')
  overrides.set('learningCenter.findFirst', () => ({ id: 'duplicate' }))
  assert.equal((await request('/workspaces', 'POST', { name: 'Academy' })).status, 409)
})
test('only the owner can save or delete settings', async () => {
  const body = { name: 'Updated Academy', city: null, coverUrl: null }
  for (const user of ['admin', 'teacher', 'learner']) {
    assert.equal((await request('/academy/settings', 'PATCH', body, user)).status, 403)
    assert.equal((await request('/academy/settings', 'DELETE', undefined, user)).status, 403)
  }
  assert.equal((await request('/academy/settings', 'PATCH', body)).status, 200)
  assert.equal((await request('/academy/settings', 'DELETE')).status, 204)
})
test('invitations expire, enforce recipient and cannot downgrade a teacher', async () => {
  assert.equal((await request('/join/ABC123', 'POST', {}, 'teacher')).status, 409)
  const fixture = defaults['learningCenterInvitation.findUnique']()
  overrides.set('learningCenterInvitation.findUnique', () => ({ ...fixture, email: 'other@example.test' }))
  assert.equal((await request('/join/ABC123', 'POST', {}, 'learner')).status, 403)
  overrides.set('learningCenterInvitation.findUnique', () => ({ ...fixture, expiresAt: new Date(0) }))
  assert.equal((await request('/join/ABC123', 'POST', {}, 'learner')).status, 404)
})
test('invitation claiming happens before membership writes; a second claim fails', async () => {
  assert.equal((await request('/join/abc123', 'POST', {}, 'learner')).status, 200)
  assert.equal(calls.find(c => c.key === 'learningCenterInvitation.findUnique').args.where.code, 'ABC123')
  assert.equal((await request('/join/ABC123', 'POST', {}, 'learner')).status, 409)
  assert.equal(calls.filter(c => c.key === 'learningCenterMember.upsert').length, 1)
})
test('group creation enforces management role and validates lead teacher', async () => {
  const body = { name: 'Group A', examTrack: 'SAT', teacherId: 'stranger' }
  assert.equal((await request('/academy/groups', 'POST', body, 'teacher')).status, 403)
  assert.equal((await request('/academy/groups', 'POST', body)).status, 400)
  assert.equal((await request('/academy/groups', 'POST', { ...body, teacherId: 'teacher' }, 'admin')).status, 201)
})
test('student scope, notes and AI cannot access another learner', async () => {
  assert.equal((await request('/academy/students/other', 'GET', undefined, 'learner')).status, 404)
  assert.equal((await request('/academy/students/learner/notes', 'POST', { note: 'Valid note' }, 'learner')).status, 403)
  assert.equal((await request('/academy/students/other/notes', 'POST', { note: 'Valid note' }, 'teacher')).status, 404)
  assert.equal((await request('/academy/students/learner/ai-analysis', 'POST', {}, 'learner')).status, 403)
  assert.equal((await request('/academy/students/learner/notes', 'POST', { note: '  Coaching note  ' }, 'teacher')).status, 201)
  assert.equal(calls.find(c => c.key === 'learningCenterTeacherNote.create').args.data.note, 'Coaching note')
  const detail = await request('/academy/students/learner', 'GET', undefined, 'learner')
  assert.equal(detail.status, 200); assert.deepEqual((await detail.json()).notes, [])
})

test('new notes are persisted for only their recipient and readable after sign-in', async () => {
  const inbox = []
  overrides.set('notification.create', ({ data }) => { const item = { id: 'notice', ...data, readAt: null, createdAt: new Date() }; inbox.push(item); return item })
  overrides.set('notification.findMany', ({ where }) => inbox.filter(item => item.userId === where.userId))
  overrides.set('notification.count', ({ where }) => inbox.filter(item => item.userId === where.userId && !item.readAt).length)
  const sent = await request('/academy/students/learner/notes', 'POST', { note: '  Finish Full Mock Test 1.\nReview your mistakes.  ' }, 'teacher')
  assert.equal(sent.status, 201)
  assert.equal(inbox.length, 1)
  assert.equal(inbox[0].message, 'Finish Full Mock Test 1.\nReview your mistakes.')
  assert.deepEqual(inbox[0].metadata, { kind: 'TEACHER_NOTE', noteId: 'note', centerSlug: 'academy', centerName: 'Academy', authorName: 'Alex Teacher' })
  const inboxRequest = async (user, path = '', method = 'GET') => fetch(base.replace('/centers', '/dashboard/notifications') + path, { method, headers: { Authorization: 'Bearer ' + signAccessToken({ sub: user, role: 'USER' }) } })
  assert.deepEqual((await (await inboxRequest('stranger')).json()).notifications, [])
  const received = await (await inboxRequest('learner')).json()
  assert.equal(received.notifications[0].message, inbox[0].message)
  assert.equal(received.unreadCount, 1)
  overrides.set('notification.findFirst', ({ where }) => inbox.find(item => item.id === where.id && item.userId === where.userId) ?? null)
  overrides.set('notification.update', ({ where, data }) => Object.assign(inbox.find(item => item.id === where.id), data))
  assert.equal((await inboxRequest('stranger', '/notice/read', 'PATCH')).status, 404)
  assert.equal((await inboxRequest('learner', '/notice/read', 'PATCH')).status, 200)
  assert.equal((await (await inboxRequest('learner')).json()).unreadCount, 0)
  assert.ok((await (await inboxRequest('learner')).json()).notifications[0].readAt)
})

test('note delivery failures fail the transaction; invalid notes create no messages', async () => {
  const transaction = prisma.$transaction
  let failed = false
  prisma.$transaction = async callback => { try { return await callback(prisma) } catch (error) { failed = true; throw error } }
  overrides.set('notification.create', () => { throw new Error('Delivery unavailable') })
  try {
    assert.equal((await request('/academy/students/learner/notes', 'POST', { note: 'Valid note' }, 'teacher')).status, 500)
    assert.equal(failed, true)
  } finally { prisma.$transaction = transaction }
  calls.length = 0
  for (const note of [' ', 'a', 'x'.repeat(2001)]) assert.equal((await request('/academy/students/learner/notes', 'POST', { note }, 'teacher')).status, 400)
  assert.equal(calls.filter(c => c.key === 'notification.create').length, 0)
})

test('unread count includes messages outside the latest thirty notifications', async () => {
  overrides.set('notification.count', () => 41)
  const response = await fetch(base.replace('/centers', '/dashboard/notifications'), { headers: { Authorization: 'Bearer ' + signAccessToken({ sub: 'learner', role: 'USER' }) } })
  assert.equal((await response.json()).unreadCount, 41)
  assert.deepEqual(calls.find(c => c.key === 'notification.count').args.where, { userId: 'learner', readAt: null })
})
test('member emails are visible to managers; students only see public identity', async () => {
  const learner = await (await request('/academy/team', 'GET', undefined, 'learner')).json()
  assert.ok(learner.team.every(m => m.user.email === null))
  const owner = await (await request('/academy/team')).json()
  assert.equal(owner.team[0].user.email, 'owner@example.test')
})
test('owner member invitations, administrator cap and role cleanup work', async () => {
  assert.equal((await request('/academy/invitations', 'POST', { role: 'STUDENT' }, 'admin')).status, 403)
  assert.equal((await request('/academy/invitations', 'POST', { role: 'TEACHER' })).status, 400)
  assert.equal((await request('/academy/invitations', 'POST', { role: 'STUDENT' })).status, 201)
  assert.equal((await request('/academy/invitations', 'POST', { role: 'STUDENT', nickname: 'teacher' })).status, 201)
  assert.equal((await request('/academy/members/member-teacher/role', 'PATCH', { role: 'STUDENT' })).status, 200)
  assert.ok(calls.some(c => c.key === 'learningCenterGroup.updateMany' && c.args.where.teacherId === 'teacher' && c.args.data.teacherId === null))
  assert.equal((await request('/academy/members/member-learner/role', 'PATCH', { role: 'TEACHER' })).status, 200)
  assert.ok(calls.some(c => c.key === 'learningCenterGroupMember.deleteMany' && c.args.where.memberId === 'member-learner'))
  overrides.set('learningCenterMember.count', () => 2)
  assert.equal((await request('/academy/members/member-teacher/role', 'PATCH', { role: 'ADMIN' })).status, 409)
})
test('assignment validation rejects external routes, past deadlines and mixed audiences', async () => {
  for (const body of [{ routePath: '//outside.test' }, { routePath: '/\\outside.test' }, { dueAt: new Date(0).toISOString() }, { groupId: 'g', studentId: 'learner' }, { studentId: 'stranger' }, { kind: 'WRITING', examTrack: 'SAT' }]) {
    assert.equal((await request('/academy/assignments', 'POST', { ...assignment, ...body })).status, 400)
  }
  assert.equal(calls.filter(c => c.key === 'learningCenterAssignment.create').length, 0)
})
test('assignment creation writes scoped recipients and notifications together', async () => {
  assert.equal((await request('/academy/assignments', 'POST', assignment, 'learner')).status, 403)
  assert.equal((await request('/academy/assignments', 'POST', assignment, 'teacher')).status, 201)
  assert.deepEqual(calls.find(c => c.key === 'learningCenterAssignment.create').args.data.submissions.create, [{ studentId: 'learner' }])
  assert.equal(calls.find(c => c.key === 'notification.createMany').args.data[0].userId, 'learner')
})
test('submissions enforce ownership, reject derived overdue status and record completion', async () => {
  const body = { status: 'IN_PROGRESS', progress: 40 }
  assert.equal((await request('/academy/submissions/submission', 'PATCH', body, 'stranger')).status, 404)
  overrides.set('learningCenterAssignmentSubmission.findFirst', () => ({ id: 'submission', studentId: 'other', startedAt: null }))
  assert.equal((await request('/academy/submissions/submission', 'PATCH', body, 'learner')).status, 403)
  assert.equal((await request('/academy/submissions/submission', 'PATCH', body, 'teacher')).status, 403)
  overrides.delete('learningCenterAssignmentSubmission.findFirst')
  assert.equal((await request('/academy/submissions/submission', 'PATCH', { status: 'OVERDUE', progress: 40 }, 'learner')).status, 400)
  const complete = await request('/academy/submissions/submission', 'PATCH', { status: 'COMPLETED', progress: 0 }, 'learner')
  assert.equal(complete.status, 200)
  const { submission } = await complete.json(); assert.equal(submission.progress, 100); assert.ok(submission.submittedAt)
  assert.ok(submission.startedAt)
})
test('result sync validates score bounds and completes only the caller submission', async () => {
  const body = { sourceKey: 'sat-fixture-1', sourceType: 'SAT_MOCK', examType: 'SAT', skill: 'SAT_OVERALL', title: 'SAT fixture', score: 1400, maxScore: 1600, durationSec: 60, assignmentId: 'task' }
  assert.equal((await request('/results/sync', 'POST', { ...body, score: 1700 }, 'learner')).status, 400)
  for (let n = 0; n < 2; n++) assert.equal((await request('/results/sync', 'POST', body, 'learner')).status, 201)
  assert.deepEqual(calls.find(c => c.key === 'assessmentResult.upsert').args.where.userId_sourceKey, { userId: 'learner', sourceKey: 'sat-fixture-1' })
  assert.deepEqual(calls.find(c => c.key === 'learningCenterAssignmentSubmission.updateMany').args.where, { assignmentId: 'task', studentId: 'learner' })
})
test('Reading and Listening sync retries complete class work without adding a second attempt', async () => {
  const token = signAccessToken({ sub: 'learner', role: 'USER' })
  for (const type of ['reading', 'listening']) {
    const response = await fetch(base.replace('/centers', `/tests/${type}-sync`), {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ assignmentId: type + '-assignment', externalAttemptKey: type + '-fixture-1', externalTestId: 'ielts-' + type + '-1', title: 'IELTS ' + type + ' fixture', completedAt: new Date().toISOString(), totalQuestions: 40, correctAnswers: 32, timeSpentSec: 1800, durationSec: 3600 }),
    })
    assert.equal(response.status, 200)
    assert.equal((await response.json()).duplicate, true)
    assert.ok(calls.some(c => c.key === 'learningCenterAssignmentSubmission.updateMany' && c.args.where.assignmentId === type + '-assignment' && c.args.where.studentId === 'learner'))
  }
  assert.equal(calls.filter(c => c.key === 'testAttempt.create').length, 0)
})
test('growth reflects two and three attempts without mixing exam skills', () => {
  assert.equal(summarizeStudent(identity, [point(1000, 'SAT_OVERALL', 0), point(1400, 'SAT_OVERALL', 1)]).improvement, 25)
  assert.equal(summarizeStudent(identity, [point(1000, 'SAT_OVERALL', 0), point(1200, 'SAT_OVERALL', 1), point(1400, 'SAT_OVERALL', 2)]).improvement, 25)
  assert.equal(summarizeStudent(identity, [point(1400), point(5, 'IELTS_READING', 1)]).improvement, 0)
  assert.equal(summarizeStudent(identity, [point(1300), point(800, 'SAT_MATH', 1)]).highestSat, 1300)
  assert.equal(summarizeStudent(identity, [{ ...point(75), maxScore: 100 }]).currentSat, null, 'Practice percentages cannot masquerade as scaled SAT scores')
  assert.equal(summarizeStudent(identity, [{ ...point(700, 'SAT_MATH'), maxScore: 800 }]).currentSat, null, 'A single section is not an overall SAT score')
  assert.equal(summarizeStudent(identity, [{ ...point(700, 'SAT_MATH'), maxScore: 800 }, { ...point(650, 'SAT_READING_WRITING', 1), maxScore: 800 }]).currentSat, 1350)
})
test('a speaking mock saved through two APIs counts once by its original event identity', async () => {
  const time = new Date()
  overrides.set('assessmentResult.findMany', () => [{ ...point(7, 'IELTS_SPEAKING'), userId: 'learner', sourceKey: 'speaking-local-id', completedAt: time }])
  overrides.set('speakingSession.findMany', () => [{ id: 'server-session', userId: 'learner', createdAt: time, modeLabel: 'Speaking mock', overallBand: 7, durationSec: 900 }])
  overrides.set('xpEvent.findMany', () => [{ userId: 'learner', earnedAt: time, eventKey: 'SPEAKING:local-id' }])
  const detail = await (await request('/academy/students/learner')).json()
  assert.equal(detail.student.attempts, 1); assert.equal(detail.results.length, 1)
  overrides.set('xpEvent.findMany', () => [{ userId: 'learner', earnedAt: time, eventKey: 'SPEAKING:different-attempt' }])
  const different = await (await request('/academy/students/learner')).json()
  assert.equal(different.student.attempts, 2, 'Equal scores do not merge distinct attempts')
})
test('SAT sections use an 800-point scale; mixed subjects remain an overall result', () => {
  const attempt = { id: 'attempt', finalScore: 80, percentage: 80, timeSpentSec: 1800, completedAt: new Date(), test: { title: 'SAT Math', category: 'SAT', subjects: ['Math'] } }
  assert.equal(normalizeTestAttempt(attempt).maxScore, 800)
  assert.equal(normalizeTestAttempt(attempt).score, 680)
  const overall = normalizeTestAttempt({ ...attempt, test: { title: 'SAT full mock', category: 'SAT', subjects: ['Math', 'Reading and Writing'] } })
  assert.equal(overall.skill, 'SAT_OVERALL'); assert.equal(overall.maxScore, 1600)
})
test('leaderboard ranks best score and real improvement, and validates filters', async () => {
  overrides.set('assessmentResult.findMany', () => [point(1000, 'SAT_OVERALL', 0), point(1400, 'SAT_OVERALL', 1)].map(p => ({ ...p, userId: 'learner' })))
  const rows = (await (await request('/academy/leaderboard?exam=SAT&metric=IMPROVEMENT')).json()).rows
  assert.equal(rows[0].highest, 1400); assert.equal(rows[0].improvement, 25); assert.equal(rows[0].rank, 1)
  assert.equal((await request('/academy/leaderboard?exam=INVALID')).status, 400)
})


test('pending and unverified zero placeholders do not change measured progress, while graded zero remains a score', () => {
  const reading = point(7, 'IELTS_READING', 0)
  const pending = { ...point(0, 'IELTS_WRITING', 1), breakdown: { assessmentStatus: 'pending' } }
  const legacy = point(0, 'IELTS_WRITING', 2)
  const graded = { ...point(0, 'IELTS_WRITING', 3), breakdown: { taskAchievement: 0, wordCount: 0 } }
  assert.equal(classifyResult(pending).scoreStatus, 'PENDING')
  assert.equal(classifyResult(legacy).scoreStatus, 'UNVERIFIED')
  assert.equal(classifyResult(graded).scoreStatus, 'SCORED')
  const summary = summarizeStudent(identity, [reading, pending, legacy])
  assert.equal(summary.attempts, 3); assert.equal(summary.scoredAttempts, 1); assert.equal(summary.pendingAttempts, 2)
  assert.equal(summary.latestResult.scoreStatus, 'UNVERIFIED'); assert.equal(summary.improvement, 0)
  assert.equal(summary.skills.length, 1)
  assert.equal(buildDataDrivenInsight(summary, [reading, pending, legacy]).headline, 'A baseline is recorded')
  assert.equal(summarizeStudent(identity, [reading, pending, legacy, graded]).skills.find(skill => skill.label === 'IELTS Writing').score, 0)
})
test('IELTS overall needs four skills, rounds to half bands and tracks highest comparable overall', () => {
  const student = { ...identity, profile: { targetExam: 'IELTS' } }
  const results = ['IELTS_READING', 'IELTS_LISTENING', 'IELTS_WRITING', 'IELTS_SPEAKING'].map((skill, index) => point([7, 7, 6, 6.5][index], skill, index))
  const partial = summarizeStudent(student, results.slice(0, 3))
  assert.equal(partial.currentIelts, null); assert.equal(partial.highestIelts, null); assert.equal(partial.ieltsSkillCount, 3)
  const full = summarizeStudent(student, results)
  assert.equal(full.currentIelts, 6.5); assert.equal(full.highestIelts, 6.5); assert.equal(full.currentIeltsSource, 'FOUR_SKILLS')
  const next = summarizeStudent(student, [...results, point(4, 'IELTS_READING', 4)])
  assert.equal(next.currentIelts, 6); assert.equal(next.highestIelts, 6.5)
  assert.equal(next.latestResult.skill, 'IELTS_READING')
})
test('partial percentages and scaled results use separate skill rows and growth windows', () => {
  const results = [{ ...point(100, 'IELTS_READING', 0), maxScore: 100 }, point(6, 'IELTS_READING', 1)]
  const summary = summarizeStudent(identity, results)
  assert.equal(summary.improvement, 0); assert.equal(summary.skills.length, 2)
  assert.equal(classifyResult({ ...results[0], breakdown: { total: 40, correct: 30, partial: false } }).score, 7)
  assert.equal(classifyResult({ ...results[0], breakdown: { total: 13, correct: 13, partial: true } }).maxScore, 100)
})
test('Reading and Listening bands follow recorded raw answer counts and SAT estimates are labelled', () => {
  const attempt = { id: 'attempt', finalScore: 100, percentage: 75, totalQuestions: 40, correctAnswers: 30, timeSpentSec: 1800, completedAt: new Date(), test: { title: 'IELTS Reading', category: 'IELTS', subjects: ['Reading'] } }
  assert.equal(normalizeTestAttempt(attempt).score, 7)
  assert.equal(normalizeTestAttempt({ ...attempt, correctAnswers: 0, percentage: 0 }).score, 0)
  assert.equal(normalizeTestAttempt({ ...attempt, totalQuestions: 13, correctAnswers: 10 }).maxScore, 100)
  const estimated = normalizeTestAttempt({ ...attempt, test: { title: 'SAT Math', category: 'SAT', subjects: ['Math'] } })
  assert.equal(estimated.scoreKind, 'ESTIMATED'); assert.equal(summarizeStudent(identity, [estimated]).currentSat, null)
})
test('newer SAT sections update the combined estimate without losing highest full-test score', () => {
  const summary = summarizeStudent(identity, [point(1400, 'SAT_OVERALL', 0), { ...point(600, 'SAT_MATH', 1), maxScore: 800 }, { ...point(650, 'SAT_READING_WRITING', 2), maxScore: 800 }])
  assert.equal(summary.currentSat, 1250); assert.equal(summary.currentSatSource, 'COMBINED_SECTIONS'); assert.equal(summary.highestSat, 1400)
  const profile = summarizeStudent({ ...identity, profile: { currentSatScore: 1500, targetExam: 'SAT' } }, [])
  assert.equal(profile.currentSatSource, 'PROFILE'); assert.equal(profile.latestResult, null)
})
test('directory pagination reads histories for only its page, with stable ordering and no historical cutoff', async () => {
  const learners = Array.from({ length: 130 }, (_, index) => ({ ...identity, id: `learner-${String(index).padStart(3, '0')}`, fullName: `Learner ${String(index).padStart(3, '0')}`, email: `learner${index}@example.test` }))
  overrides.set('learningCenterMember.findMany', () => learners.map(student => ({ userId: student.id })))
  overrides.set('user.count', () => learners.length)
  overrides.set('user.findMany', ({ skip = 0, take }) => learners.slice(skip, take ? skip + take : undefined))
  overrides.set('assessmentResult.findMany', ({ where }) => where.userId.in.map(userId => ({ ...point(1300), userId, completedAt: new Date('2024-01-01') })))
  const response = await request('/academy/students?page=2&pageSize=25')
  assert.equal(response.status, 200)
  const directory = await response.json()
  assert.deepEqual(directory.pagination, { page: 2, pageSize: 25, total: 130, pages: 6 })
  assert.equal(directory.students.length, 25); assert.equal(directory.students[0].id, 'learner-025')
  assert.equal(directory.students[0].latestResult.score, 1300); assert.equal(directory.students[0].email, 'learner25@example.test')
  for (const call of calls.filter(call => ['testAttempt.findMany', 'assessmentResult.findMany', 'speakingSession.findMany'].includes(call.key))) {
    assert.equal(call.args.where.userId.in.length, 25); assert.equal(call.args.where.completedAt, undefined)
  }
  const identityQuery = calls.find(call => call.key === 'user.findMany').args
  assert.deepEqual(identityQuery.orderBy, [{ fullName: 'asc' }, { id: 'asc' }]); assert.equal(identityQuery.skip, 25)
  assert.equal((await request('/academy/students?page=0')).status, 400)
  assert.equal((await request('/academy/students?pageSize=1000')).status, 400)
})
test('status pagination filters before paging and public students never receive emails', async () => {
  overrides.set('assessmentResult.findMany', () => [{ ...point(1300), userId: 'learner' }])
  overrides.set('user.findMany', () => [{ ...identity, email: 'private@example.test' }])
  const directory = await (await request('/academy/students?page=1&status=ON_TRACK')).json()
  assert.equal(directory.pagination.total, 1); assert.equal(directory.students[0].status, 'ON_TRACK')
  const empty = await (await request('/academy/students?page=1&status=WATCH')).json()
  assert.equal(empty.pagination.total, 0); assert.deepEqual(empty.students, [])
  const own = await (await request('/academy/students?page=1', 'GET', undefined, 'learner')).json()
  assert.equal(Object.hasOwn(own.students[0], 'email'), false)
  const detail = await (await request('/academy/students/learner', 'GET', undefined, 'learner')).json()
  assert.equal(Object.hasOwn(detail.student, 'email'), false)
})
test('compact group filters skip all student histories and speaking queries exclude transcripts', async () => {
  assert.equal((await request('/academy/groups?compact=1')).status, 200)
  assert.equal(calls.some(call => call.key === 'testAttempt.findMany'), false)
  await request('/academy/students/learner')
  assert.equal(calls.find(call => call.key === 'speakingSession.findMany').args.select.transcript, undefined)
})

test('highest SAT combined estimate survives later lower section results', () => {
  const results = [{ ...point(750, 'SAT_MATH', 0), maxScore: 800 }, { ...point(750, 'SAT_READING_WRITING', 1), maxScore: 800 }, { ...point(500, 'SAT_MATH', 2), maxScore: 800 }]
  const summary = summarizeStudent(identity, results)
  assert.equal(summary.currentSat, 1250); assert.equal(summary.highestSat, 1500)
  assert.equal(summary.highestSatSource, 'COMBINED_SECTIONS')
})
test('profile scores cannot enter the leaderboard using practice-only attempts', async () => {
  overrides.set('user.findMany', () => [{ ...identity, profile: { currentSatScore: 1600, targetExam: 'SAT' } }])
  overrides.set('assessmentResult.findMany', () => [{ ...point(80), maxScore: 100, userId: 'learner' }])
  const leaderboard = await (await request('/academy/leaderboard?exam=SAT')).json()
  assert.deepEqual(leaderboard.rows, [])
})

test('full Reading and Listening results deduplicate only exact original identities', async () => {
  const completedAt = new Date('2026-11-20T10:00:00Z')
  overrides.set('testAttempt.findMany', () => [{ id: 'original-attempt', userId: 'learner', completedAt, percentage: 80, finalScore: 80, totalQuestions: 40, correctAnswers: 32, timeSpentSec: 1800, test: { title: 'Reading', category: 'IELTS', subjects: ['Reading'], description: 'Synced IELTS Reading attempt (paper-1)' } }])
  overrides.set('assessmentResult.findMany', () => [{ ...point(7.5, 'IELTS_READING'), userId: 'learner', sourceKey: `ielts-reading-paper-1-${completedAt.toISOString()}`, completedAt }])
  const detail = await (await request('/academy/students/learner')).json()
  assert.equal(detail.results.length, 1); assert.equal(detail.results[0].correctAnswers, 32); assert.equal(detail.results[0].totalQuestions, 40)
  overrides.set('assessmentResult.findMany', () => [{ ...point(7.5, 'IELTS_READING'), userId: 'learner', sourceKey: `ielts-reading-paper-2-${completedAt.toISOString()}`, completedAt }])
  const separate = await (await request('/academy/students/learner')).json()
  assert.equal(separate.results.length, 2, 'Different original papers must not be merged')
})
test('assignment recipient lookup reads names without loading histories', async () => {
  const response = await request('/academy/students?compact=1')
  assert.equal(response.status, 200)
  assert.equal(calls.some(call => call.key === 'testAttempt.findMany'), false)
  assert.deepEqual(calls.find(call => call.key === 'user.findMany').args.select, { id: true, fullName: true })
})

test('a verified server Speaking session replaces an ungraded duplicate placeholder', async () => {
  const time = new Date()
  overrides.set('assessmentResult.findMany', () => [{ ...point(0, 'IELTS_SPEAKING'), userId: 'learner', sourceKey: 'speaking-local-id', completedAt: time, breakdown: { assessmentStatus: 'pending' } }])
  overrides.set('speakingSession.findMany', () => [{ id: 'server-session', userId: 'learner', createdAt: time, modeLabel: 'Speaking mock', overallBand: 7, durationSec: 900 }])
  overrides.set('xpEvent.findMany', () => [{ userId: 'learner', earnedAt: time, eventKey: 'SPEAKING:local-id' }])
  const detail = await (await request('/academy/students/learner')).json()
  assert.equal(detail.results.length, 1); assert.equal(detail.results[0].score, 7); assert.equal(detail.student.scoredAttempts, 1)
})
test('missing data remains distinct from zero in class averages and track selection', async () => {
  assert.equal(summarizeStudent({ ...identity, profile: null }, []).targetExam, 'UNSET')
  const empty = await (await request('/academy/overview')).json()
  assert.equal(empty.metrics.averageIelts, null); assert.equal(empty.metrics.averageSat, null)
  overrides.set('assessmentResult.findMany', () => ['IELTS_READING', 'IELTS_LISTENING', 'IELTS_WRITING', 'IELTS_SPEAKING'].map((skill, index) => ({ ...point(0, skill, index), userId: 'learner', breakdown: { assessmentStatus: 'graded' } })))
  const zero = await (await request('/academy/overview')).json()
  assert.equal(zero.metrics.averageIelts, 0)
  assert.equal(classifyResult(point(0, 'SAT_OVERALL')).scoreStatus, 'UNVERIFIED')
})
