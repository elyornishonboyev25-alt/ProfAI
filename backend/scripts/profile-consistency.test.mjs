import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import { build } from '../../node_modules/esbuild/lib/main.js'

const require = createRequire(import.meta.url)
const express = require('express')
const now = new Date()
const user = {
  id: 'owner', fullName: 'Private Full Name', email: 'private@example.test', nickname: 'learner',
  role: 'USER', premiumGrant: null, billingSubscriptions: [], xp: 781, level: 4,
  currentStreak: 1, longestStreak: 17, createdAt: now, lastActiveDate: now, avatarUrl: null,
  profile: { isPublic: true, showResults: true, showBadges: true, showLeaderboard: true, showUniversity: true, timezone: 'Asia/Tashkent' },
}
const native = [{
  id: 'native', userId: user.id, testId: 'listening', percentage: 62.5, finalScore: 62.5, xpEarned: 20,
  totalQuestions: 40, correctAnswers: 25, timeSpentSec: 1800, completedAt: now,
  test: { id: 'listening', title: 'Listening', category: 'IELTS', difficulty: 'HARD', durationSec: 1800, subjects: ['Listening'] },
}]
const assessment = (id, skill, score, maxScore, accuracy = null, durationSec = 1800) => ({
  id, userId: user.id, sourceKey: id, sourceType: skill.startsWith('SAT') ? 'SAT_BLUEBOOK_MOCK' : skill.includes('WRITING') ? 'IELTS_WRITING_FULL_TEST' : 'IELTS_SPEAKING_MOCK',
  title: skill, skill, examType: skill.startsWith('SAT') ? 'SAT' : 'IELTS', score, maxScore, accuracy, durationSec, completedAt: now, breakdown: {},
})
const assessments = [assessment('writing', 'IELTS_WRITING', 6, 9), assessment('speaking', 'IELTS_SPEAKING', 7.5, 9),
  assessment('sat', 'SAT_OVERALL', 1200, 1600, 40), assessment('too-fast', 'SAT_OVERALL', 1600, 1600, 100, 120)]
let failHistory = false
const events = [{ userId: user.id, source: 'DAILY_LOGIN', earnedAt: now, amount: 761 }]
const prisma = {
  user: { findFirst: async () => user, findUnique: async () => user, findMany: async () => [user] },
  testAttempt: { findMany: async () => [...native] },
  assessmentResult: {
    findMany: async ({ where }) => {
      if (failHistory) throw new Error('History temporarily unavailable')
      return assessments.filter((entry) => !where.sourceType || where.sourceType.in.includes(entry.sourceType))
    },
    upsert: async ({ where, create, update }) => {
      const existing = assessments.find((entry) => entry.sourceKey === where.userId_sourceKey.sourceKey)
      if (existing) { Object.assign(existing, update); return existing }
      const entry = { ...create, id: create.sourceKey }; assessments.push(entry); return entry
    },
  },
  xpEvent: { groupBy: async ({ by }) => by[0] === 'source' ? [{ source: 'DAILY_LOGIN', _sum: { amount: 761 } }] : [], findMany: async () => events },
  speakingSession: { findMany: async () => [] }, skillBadge: { findMany: async () => [] },
  userAchievement: { findMany: async () => [] }, focusDailyAnalytics: { findMany: async () => [] },
  leaderboardState: { findMany: async () => [], upsert: async (query) => query.create },
  notification: { findMany: async () => [] }, test: { findMany: async () => [] },
  $transaction: async (writes) => Promise.all(writes),
}
const bundle = await build({
  stdin: { contents: `export { default as profile } from './backend/src/routes/profile.routes.ts';
    export { default as dashboard } from './backend/src/routes/dashboard.routes.ts';
    export { default as centers } from './backend/src/routes/learningCenters.routes.ts';
    export { default as tests } from './backend/src/routes/tests.routes.ts';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  plugins: [{ name: 'test-dependencies', setup(builder) {
    builder.onResolve({ filter: /\/lib\/prisma\.js$/ }, () => ({ path: 'prisma', namespace: 'test' }))
    builder.onResolve({ filter: /\/config\/env\.js$/ }, () => ({ path: 'env', namespace: 'test' }))
    builder.onResolve({ filter: /\/services\/aiCoach\.service\.js$/ }, () => ({ path: 'coach', namespace: 'test' }))
    builder.onResolve({ filter: /\/middleware\/auth\.js$/ }, () => ({ path: 'auth', namespace: 'test' }))
    builder.onLoad({ filter: /.*/, namespace: 'test' }, ({ path }) => ({ contents: path === 'prisma'
      ? 'export const prisma = globalThis.prisma'
      : path === 'env' ? 'export const env = {}'
        : path === 'coach' ? 'export async function generateAiCoachReport() {}; export function invalidateAiCoachCache() {}; export async function precomputeAiCoachReport() {}; export function isAiCoachProviderError() { return false }'
        : `export const requireAuth = (req, res, next) => { const id = req.get('X-Test-Viewer'); if (!id) return res.sendStatus(401); req.user = { id, role: 'USER' }; next() }; export const requireRole = () => requireAuth` }))
  } }],
})
const module = { exports: {} }
vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require, prisma, console, Date, Buffer, URL, AbortSignal, fetch, setTimeout, clearTimeout })
const app = express()
app.use(express.json())
for (const [path, router] of [['profile', module.exports.profile], ['dashboard', module.exports.dashboard], ['learning-centers', module.exports.centers], ['tests', module.exports.tests]]) app.use(`/${path}`, router)
app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }))
const server = app.listen(0, '127.0.0.1')
await new Promise((resolve) => server.once('listening', resolve))
const base = `http://127.0.0.1:${server.address().port}`
async function get(path, viewer = 'owner') {
  const response = await fetch(`${base}${path}`, { headers: viewer ? { 'X-Test-Viewer': viewer } : {} })
  return { response, body: response.ok ? await response.json() : null }
}
async function save(input) {
  const response = await fetch(`${base}/learning-centers/results/${input.preserveExisting ? 'recover' : 'sync'}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Test-Viewer': 'owner' }, body: JSON.stringify(input) })
  assert.equal(response.status, 201, await response.clone().text())
}
try {
  assert.equal((await get('/profile/public/learner', null)).response.status, 401)
  const owner = await get('/profile/public/learner')
  const visitor = await get('/profile/public/learner', 'visitor')
  assert.equal(owner.response.headers.get('cache-control'), 'no-store')
  assert.equal(owner.body.profile.isSelf, true)
  assert.equal(visitor.body.profile.isSelf, false)
  owner.body.profile.isSelf = false
  assert.deepEqual(owner.body, visitor.body, 'All public facts are independent of the viewer')
  assert.equal(JSON.stringify(visitor.body).includes(user.email), false)
  assert.equal(JSON.stringify(visitor.body).includes(user.fullName), false)
  assert.equal(visitor.body.profile.xp, 781)
  assert.equal(visitor.body.competitive.rankingScore, 781)
  assert.equal(visitor.body.xpBreakdown.reduce((sum, row) => sum + row.amount, 0), 781)
  assert.deepEqual(visitor.body.stats, { totalAttempts: 4, averageScore: 63.13, averageAccuracy: 63.13 })
  assert.equal(visitor.body.skillAnalytics.trackBreakdown.find((row) => row.key === 'IELTS_WRITING').accuracy, 66.67)
  for (const key of ['SAT_MATH', 'SAT_READING_WRITING']) assert.equal(visitor.body.skillAnalytics.trackBreakdown.find((row) => row.key === key).attempts, 1)
  const privateProfile = (await get('/profile/overview')).body
  const dashboard = (await get('/dashboard/overview')).body
  assert.equal(privateProfile.stats.totalAttempts, visitor.body.stats.totalAttempts)
  assert.equal(privateProfile.stats.averageAccuracy, visitor.body.stats.averageAccuracy)
  assert.equal(dashboard.metrics.totalTests, visitor.body.stats.totalAttempts)
  assert.equal(dashboard.metrics.averageScore, visitor.body.stats.averageScore)
  assert.equal(dashboard.miniLeaderboard[0].testsCompleted, visitor.body.stats.totalAttempts)
  assert.equal(dashboard.miniLeaderboard[0].accuracy, visitor.body.stats.averageAccuracy)
  assert.equal(dashboard.weeklyProgress.reduce((sum, day) => sum + day.testsCompleted, 0), 4)
  assert.equal(privateProfile.weeklyActivity.reduce((sum, day) => sum + day.testsCompleted, 0), 4)

  const correction = { sourceKey: 'writing', sourceType: 'IELTS_WRITING_FULL_TEST', examType: 'IELTS', skill: 'IELTS_WRITING', title: 'Writing', score: 9, maxScore: 9, durationSec: 1800, completedAt: now.toISOString(), breakdown: { tasks: [{ score: 9 }] } }
  // The endpoint requires source keys of at least six characters.
  await save(correction)
  assert.equal((await get('/profile/public/learner', 'visitor')).body.skillAnalytics.trackBreakdown.find((row) => row.key === 'IELTS_WRITING').accuracy, 100, 'Assessment updates invalidate analytics as well as rank caches')
  await save({ ...correction, score: 6, breakdown: {}, preserveExisting: true })
  assert.equal(assessments.find((row) => row.id === 'writing').score, 9, 'Recovery cannot overwrite a newer result')
  assert.deepEqual(assessments.find((row) => row.id === 'writing').breakdown, { tasks: [{ score: 9 }] })
  assert.equal((await get('/profile/public/learner')).body.stats.totalAttempts, 4, 'Retrying an assessment never creates another attempt')
  assert.equal(user.xp, 781, 'Reading history never awards assessment XP a second time')

  user.profile.showResults = false; user.profile.showBadges = false
  const hidden = (await get('/profile/public/learner', 'visitor')).body
  assert.equal(hidden.stats, null); assert.equal(hidden.skillAnalytics, null); assert.deepEqual(hidden.recentAttempts, []); assert.deepEqual(hidden.badges, [])
  user.profile.isPublic = false
  assert.equal((await get('/profile/public/learner', 'visitor')).response.status, 403)
  assert.equal((await get('/profile/public/learner')).response.status, 200)
  user.profile.isPublic = true; user.profile.showResults = true
  // Simulate both devices passing the optimistic duplicate lookup before either
  // transaction commits. The transaction's row lock and second check are required.
  const beforeXp = user.xp
  let creates = 0, locks = 0
  let transactionQueue = Promise.resolve()
  const syncTest = { id: 'recovered-test', title: 'Listening recovery', category: 'IELTS', difficulty: 'HARD', durationSec: 1800, xpReward: 105, subjects: ['Listening'] }
  prisma.test.upsert = async () => syncTest
  prisma.testAttempt.findFirst = async () => null
  const tx = {
    ...prisma,
    $queryRaw: async () => { locks += 1 },
    testAttempt: {
      ...prisma.testAttempt,
      findFirst: async ({ where }) => native.find((row) => row.testId === where.testId && row.correctAnswers === where.correctAnswers && row.timeSpentSec === where.timeSpentSec) ?? null,
      create: async ({ data }) => { creates += 1; const row = { ...data, id: 'recovered', test: syncTest }; native.push(row); return row },
    },
    user: { ...prisma.user, update: async ({ data }) => { Object.assign(user, data); return user } },
    dailyActivity: { findUnique: async () => null, create: async () => ({}) },
    notification: { create: async () => ({}) },
  }
  prisma.$transaction = (operation) => {
    if (typeof operation !== 'function') return Promise.all(operation)
    const next = transactionQueue.then(() => operation(tx))
    transactionQueue = next.catch(() => {})
    return next
  }
  const submit = () => fetch(`${base}/tests/listening-sync`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Test-Viewer': 'owner' }, body: JSON.stringify({
    externalAttemptKey: 'same-recovered-attempt', externalTestId: 'listening-recovery', title: syncTest.title,
    completedAt: now.toISOString(), durationSec: 1800, timeSpentSec: 1800, totalQuestions: 40, correctAnswers: 30,
  }) })
  const responses = await Promise.all([submit(), submit()])
  for (const response of responses) assert.equal(response.status, 201, await response.clone().text())
  const saved = await Promise.all(responses.map((response) => response.json()))
  assert.equal(creates, 1, 'Two devices cannot create the same completed test twice')
  assert.equal(locks, 2, 'Every concurrent save acquires the account row lock')
  assert.equal(saved.filter((row) => row.duplicate).length, 1)
  assert.equal(user.xp - beforeXp, saved.reduce((sum, row) => sum + row.xpEarned, 0), 'XP is awarded exactly once')
  assert.equal((await get('/profile/public/learner')).body.stats.totalAttempts, 5)

  failHistory = true
  assert.equal((await get('/profile/public/learner')).response.status, 500, 'A failed history query must not display fabricated zero statistics')
  console.log('PASS: owner/visitor parity, shared SAT/IELTS statistics, XP, skills, privacy, cache refresh, recovery and failure handling')
} finally { await new Promise((resolve) => server.close(resolve)) }
