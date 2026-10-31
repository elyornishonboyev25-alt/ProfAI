import assert from 'node:assert/strict'
import { test } from 'node:test'

const records = []
globalThis.prisma = {
  testAttempt: { findMany: async () => records },
  assessmentResult: { findMany: async () => [] },
  user: { findMany: async () => [
    { id: 'viewer', fullName: 'My name', nickname: 'me', profile: { showLeaderboard: false }, avatarUrl: null },
    { id: 'private', fullName: 'Secret name', nickname: 'secret', profile: { showLeaderboard: false }, avatarUrl: 'private-avatar' },
  ] },
}
const { getIeltsStanding, rankFirstIeltsAttempts, ieltsBandForCorrect, assessmentBelongsToTest } = await import('../dist/services/ieltsStanding.service.js')
const attempt = (userId, total, durationSec, date = '2026-10-30T10:00:00Z', correct = 30) => ({ userId, total, durationSec, correct, completedAt: new Date(date) })

test('IELTS leaderboard ranks the first attempt, with stable time ties', () => {
  const ranked = rankFirstIeltsAttempts([
    attempt('retaker', 9, 500, '2026-10-31T10:00:00Z'), attempt('retaker', 6, 600),
    attempt('faster', 7, 500), attempt('slower', 7, 700),
  ])
  assert.deepEqual(ranked.map(row => row.userId), ['faster', 'slower', 'retaker'])
  assert.equal(ranked[2].total, 6)
  for (const [correct, band] of [[40,9],[37,8.5],[32,7.5],[12,4.5],[9,4],[3,2.5],[1,2],[0,0]]) assert.equal(ieltsBandForCorrect(correct), band)
})
test('Legacy writing results match only their exact test', () => {
  assert.equal(assessmentBelongsToTest({ sourceKey: 'writing-writing-test-1-1790000000000', breakdown: {} }, 'writing-test-1'), true)
  assert.equal(assessmentBelongsToTest({ sourceKey: 'writing-writing-test-10-1790000000000', breakdown: {} }, 'writing-test-1'), false)
  assert.equal(assessmentBelongsToTest({ sourceKey: 'writing-writing-test-1-task2-1790000000000', breakdown: {} }, 'writing-test-1'), false)
  assert.equal(assessmentBelongsToTest({ sourceKey: 'writing-writing-test-1-1790000000000', breakdown: { testId: 'different-test' } }, 'writing-test-1'), false)
})
test('IELTS test leaderboard respects hidden profiles and preserves the viewer row', async () => {
  records.push(...['viewer', 'private'].map((userId, index) => ({ userId, correctAnswers: 35 - index, totalQuestions: 40, timeSpentSec: 1800, completedAt: new Date('2026-10-30T10:00:00Z') })))
  const result = await getIeltsStanding('ielts-reading-1', 'viewer')
  assert.equal(result.participants, 2)
  assert.equal(result.me.name, 'My name')
  assert.equal(result.me.total, 8)
  assert.equal(result.rows[1].name, 'Private learner')
  assert.equal(result.rows[1].nickname, null)
  assert.equal(result.rows[1].avatarUrl, null)
})
