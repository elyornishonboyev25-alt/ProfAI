import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'

// Inject a database double before loading the service; no database is contacted.
const unexpectedQuery = () => { throw new Error('Unexpected database query') }
const prisma = {
  testAttempt: { findMany: unexpectedQuery },
  xpEvent: { groupBy: unexpectedQuery },
  assessmentResult: { findMany: unexpectedQuery },
  user: { findMany: unexpectedQuery },
  focusDailyAnalytics: { findMany: unexpectedQuery },
  leaderboardState: { findMany: unexpectedQuery, upsert: unexpectedQuery },
  $transaction: unexpectedQuery,
}
globalThis.prisma = prisma
const { generateLeaderboard, invalidateLeaderboardCache } = await import('../dist/services/leaderboard.service.js')

const learner = (id, xp) => ({ id, xp, fullName: id, nickname: null, avatarUrl: null, currentStreak: 0 })
const attempt = (userId, testId, xpEarned, percentage = 80) => ({
  userId, testId, xpEarned, percentage, finalScore: percentage,
  totalQuestions: 10, correctAnswers: percentage / 10, timeSpentSec: 600,
  completedAt: new Date(), test: { difficulty: 'MEDIUM', durationSec: 600 },
})

function mockDatabase(users, attempts = [], assessments = [], xpEvents = []) {
  mock.method(prisma.testAttempt, 'findMany', async () => attempts)
  mock.method(prisma.xpEvent, 'groupBy', async () => xpEvents.map(({ userId, amount }) => ({ userId, _sum: { amount } })))
  const assessmentQuery = mock.method(prisma.assessmentResult, 'findMany', async () => assessments)
  const userQuery = mock.method(prisma.user, 'findMany', async ({ where }) => (
    where.id ? users.filter((user) => where.id.in.includes(user.id)) : users
  ))
  mock.method(prisma.focusDailyAnalytics, 'findMany', async () => [])
  mock.method(prisma.leaderboardState, 'findMany', async () => [])
  mock.method(prisma.leaderboardState, 'upsert', async (query) => query.create)
  mock.method(prisma, '$transaction', async (writes) => Promise.all(writes))
  return { userQuery, assessmentQuery }
}

afterEach(() => {
  mock.restoreAll()
  invalidateLeaderboardCache()
})

test('profile XP ranks every learner even when nobody has completed a test', async () => {
  mockDatabase([learner('zero', 0), learner('second', 261), learner('first', 398)])
  const board = await generateLeaderboard({ period: 'all', currentUserId: 'second' })
  assert.deepEqual(board.rows.map(({ userId, totalXp, rank }) => [userId, totalXp, rank]), [
    ['first', 398, 1], ['second', 261, 2], ['zero', 0, 3],
  ])
  assert.equal(board.currentUserRank, 2)
  assert.equal(board.rows[1].isCurrentUser, true)
  for (const row of board.rows) {
    assert.equal(row.rankingScore, row.totalXp)
    assert.equal(row.testsCompleted, 0)
    for (const value of Object.values(row.breakdown)) assert.ok(Number.isFinite(value))
  }
})

test('all-time ranking uses profile totals including activity and repeat-test rewards', async () => {
  mockDatabase([learner('tests', 150), learner('activities', 261)], [
    attempt('tests', 'test-1', 100), attempt('tests', 'test-1', 50),
  ])
  const board = await generateLeaderboard({ period: 'all', currentUserId: 'tests' })
  assert.deepEqual(board.rows.map(({ userId, totalXp }) => [userId, totalXp]), [
    ['activities', 261], ['tests', 150],
  ])
  assert.equal(board.currentUserRank, 2)
  assert.equal(board.rows[1].testsCompleted, 2)
})

test('SAT and IELTS assessments contribute test statistics without changing profile XP', async () => {
  const assessment = (id, userId, examType, accuracy, score = 0, maxScore = 1600) => ({
    id, userId, examType, accuracy, score, maxScore, durationSec: 1200, completedAt: new Date(),
  })
  mockDatabase([learner('sat', 324), learner('ielts', 398)], [attempt('sat', 'native', 20, 50)], [
    assessment('old-sat', 'sat', 'SAT', 80),
    assessment('repeat-sat', 'sat', 'SAT', 20),
    assessment('zero-sat', 'sat', 'SAT', 0),
    assessment('unknown-accuracy', 'sat', 'SAT', null, 1200),
    assessment('writing', 'ielts', 'IELTS', null, 6, 9),
  ])
  const board = await generateLeaderboard({ period: 'all', currentUserId: 'sat' })
  const sat = board.rows.find((row) => row.userId === 'sat')
  assert.equal(sat.totalXp, 324)
  assert.equal(sat.testsCompleted, 4)
  assert.equal(sat.accuracy, 37.5)
  assert.equal(sat.breakdown.accuracy, 37.5)
  assert.equal(board.rows[0].testsCompleted, 1)
  assert.equal(board.rows[0].accuracy, 66.67)
})

test('assessment sync cache invalidation refreshes statistics even when XP is unchanged', async () => {
  const assessments = []
  mockDatabase([learner('sat', 324)], [], assessments)
  assert.equal((await generateLeaderboard({ period: 'all' })).rows[0].testsCompleted, 0)
  assessments.push({ id: 'saved', userId: 'sat', examType: 'SAT', accuracy: 45, score: 900, maxScore: 1600, durationSec: 100, completedAt: new Date() })
  invalidateLeaderboardCache()
  const board = await generateLeaderboard({ period: 'all' })
  assert.equal(board.rows[0].testsCompleted, 1)
  assert.equal(board.rows[0].accuracy, 45)
  assert.equal(board.rows[0].totalXp, 324)
})

test('equal XP has stable ordering regardless of database order', async () => {
  mockDatabase([learner('b', 6), learner('a', 6), learner('accurate', 6)], [
    attempt('accurate', 'test-1', 6, 100),
  ])
  const board = await generateLeaderboard({ period: 'all' })
  assert.deepEqual(board.rows.map((row) => row.userId), ['accurate', 'a', 'b'])
})

test('cached dashboard and full-board results keep the same ranks with per-user context', async () => {
  const { userQuery } = mockDatabase([learner('a', 398), learner('b', 261)])
  const dashboard = await generateLeaderboard({ period: 'all', currentUserId: 'a' })
  const fullBoard = await generateLeaderboard({ period: 'all', currentUserId: 'b' })
  assert.equal(userQuery.mock.callCount(), 1)
  assert.deepEqual(dashboard.rows.map((row) => row.totalXp), fullBoard.rows.map((row) => row.totalXp))
  assert.equal(dashboard.currentUserRank, 1)
  assert.equal(fullBoard.currentUserRank, 2)
  assert.deepEqual(fullBoard.rows.map((row) => row.isCurrentUser), [false, true])
})

test('XP cache invalidation updates totals and rank after a new reward', async () => {
  const users = [learner('a', 398), learner('b', 261)]
  mockDatabase(users)
  assert.equal((await generateLeaderboard({ period: 'all', currentUserId: 'b' })).currentUserRank, 2)
  users[1].xp = 500
  invalidateLeaderboardCache()
  const updated = await generateLeaderboard({ period: 'all', currentUserId: 'b' })
  assert.equal(updated.currentUserRank, 1)
  assert.equal(updated.rows[0].totalXp, 500)
})

test('rolling and category boards retain first-attempt test XP; category excludes assessments', async () => {
  const { assessmentQuery } = mockDatabase([learner('tests', 500), learner('activities', 1000)], [
    attempt('tests', 'test-1', 40), attempt('tests', 'test-1', 20),
  ])
  for (const params of [{ period: 'week' }, { period: 'all', category: 'IELTS' }]) {
    const board = await generateLeaderboard(params)
    assert.equal(board.rows.length, 1)
    assert.equal(board.rows[0].totalXp, 40)
  }
  assert.equal(assessmentQuery.mock.callCount(), 1)
})

test('weekly leaderboard includes learners who earned XP outside tests', async () => {
  mockDatabase([learner('practice', 80), learner('tests', 40)], [attempt('tests', 'test-1', 40)], [], [
    { userId: 'practice', amount: 80 },
  ])
  const board = await generateLeaderboard({ period: 'week', currentUserId: 'practice' })
  assert.deepEqual(board.rows.map(({ userId, totalXp }) => [userId, totalXp]), [
    ['practice', 80], ['tests', 40],
  ])
  assert.equal(board.currentUserRank, 1)
})

test('SAT and IELTS results count in rolling windows without double-counting awarded activity XP', async () => {
  const { assessmentQuery } = mockDatabase([learner('sat', 900), learner('ielts', 800)], [], [
    { id: 'sat-result', userId: 'sat', examType: 'SAT', accuracy: 90, score: 1400, maxScore: 1600, durationSec: 1200, completedAt: new Date() },
    { id: 'ielts-result', userId: 'ielts', examType: 'IELTS', accuracy: null, score: 7.5, maxScore: 9, durationSec: 1200, completedAt: new Date() },
  ], [{ userId: 'sat', amount: 81 }, { userId: 'ielts', amount: 81 }])
  for (const period of ['week', 'month']) {
    const board = await generateLeaderboard({ period })
    assert.deepEqual(board.rows.map((row) => [row.userId, row.totalXp, row.testsCompleted]), [['sat', 81, 1], ['ielts', 81, 1]])
    assert.equal(board.rows[1].accuracy, 83.33)
    assert.ok(board.antiCheatRules.some((rule) => rule.includes('activity XP')))
  }
  for (const call of assessmentQuery.mock.calls) {
    assert.ok(call.arguments[0].where.completedAt.gte instanceof Date)
    assert.equal(call.arguments[0].where.sourceType.in.length, 4)
  }
})

test('rolling boards count the earliest repeat once and add other activity XP once', async () => {
  const first = attempt('a', 'repeat', 20, 50)
  first.completedAt = new Date(Date.now() - 60_000)
  mockDatabase([learner('a', 999)], [attempt('a', 'repeat', 70, 100), first], [], [{ userId: 'a', amount: 30 }])
  const board = await generateLeaderboard({ period: 'month' })
  assert.equal(board.rows[0].totalXp, 50)
  assert.equal(board.rows[0].testsCompleted, 1)
  assert.equal(board.rows[0].discardedAttempts, 1)
  assert.equal(board.rows[0].accuracy, 50)
})

test('rolling cache expires when its UTC window changes even inside the TTL', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-06T23:59:59Z').getTime() })
  const { userQuery } = mockDatabase([learner('a', 20)], [attempt('a', 'test', 20)])
  await generateLeaderboard({ period: 'week' })
  t.mock.timers.tick(2_000)
  await generateLeaderboard({ period: 'week' })
  assert.equal(userQuery.mock.callCount(), 2)
})

test('a calculation spanning UTC midnight is not cached under the next rolling window', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-06T23:59:59Z').getTime() })
  mockDatabase([learner('a', 20)], [attempt('a', 'test', 20)])
  let userQueries = 0
  mock.method(prisma.user, 'findMany', async () => {
    if (++userQueries === 1) t.mock.timers.tick(2_000)
    return [learner('a', 20)]
  })
  await generateLeaderboard({ period: 'week' })
  await generateLeaderboard({ period: 'week' })
  assert.equal(userQueries, 2)
})
