import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assessmentCountsForLeaderboard } from '../dist/services/examLeaderboardEligibility.js'

test('SAT leaderboard accepts only complete scaled runs above their time minimum', () => {
  const full = { examType:'SAT', maxScore:1600, durationSec:1799 }
  assert.equal(assessmentCountsForLeaderboard(full), false)
  assert.equal(assessmentCountsForLeaderboard({ ...full, durationSec:1800 }), true)
  assert.equal(assessmentCountsForLeaderboard({ ...full, durationSec:3600, breakdown:{ leaderboardEligible:false } }), false)
  assert.equal(assessmentCountsForLeaderboard({ ...full, maxScore:800, durationSec:599 }), false)
  assert.equal(assessmentCountsForLeaderboard({ ...full, maxScore:800, durationSec:600 }), true)
  assert.equal(assessmentCountsForLeaderboard({ ...full, maxScore:100, durationSec:3600 }), false)
})
test('Explicit leaderboard exclusion applies across exam families without deleting the score', () => {
  const score = { examType:'IELTS', maxScore:9, durationSec:1800, breakdown:{ leaderboardEligible:false } }
  assert.equal(assessmentCountsForLeaderboard(score), false)
  assert.equal(score.maxScore, 9)
  assert.equal(assessmentCountsForLeaderboard({ ...score, breakdown:{} }), true)
})
