import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateLearningStreak,
  dailyLoginDayKey,
  resolveLearnerTimeZone,
  getLearningStreakSnapshot,
  recordLearningVisit,
} from '../dist/services/activityStreak.service.js'

// 40 consecutive Tashkent evenings, except that on one day the learner only
// studied at 01:30 local time (20:30 UTC on the previous calendar day).
function lateNightHistory() {
  const dates = []
  for (let offset = 39; offset >= 0; offset -= 1) {
    const day = new Date(Date.UTC(2026, 10, 6 - offset))
    if (offset === 8) {
      dates.push(new Date(day.getTime() - 3.5 * 60 * 60 * 1000)) // 01:30 Tashkent
    } else {
      dates.push(new Date(day.getTime() + 15 * 60 * 60 * 1000)) // 20:00 Tashkent
    }
  }
  return dates
}

const now = new Date('2026-11-06T16:00:00.000Z') // 21:00 in Tashkent

test('a learner without a saved time zone is counted on Tashkent days, not UTC days', () => {
  assert.equal(resolveLearnerTimeZone(null), 'Asia/Tashkent')
  assert.equal(resolveLearnerTimeZone(undefined), 'Asia/Tashkent')
  assert.equal(resolveLearnerTimeZone('Not/AZone'), 'Asia/Tashkent')
  assert.equal(resolveLearnerTimeZone('Europe/Moscow'), 'Europe/Moscow')
  assert.equal(resolveLearnerTimeZone('UTC'), 'UTC')

  const history = lateNightHistory()
  assert.equal(calculateLearningStreak(history, now, null).currentStreak, 40)
  assert.equal(calculateLearningStreak(history, now, 'Asia/Tashkent').currentStreak, 40)
  // The previous behaviour: the same history read in UTC broke after 8 days.
  assert.equal(calculateLearningStreak(history, now, 'UTC').currentStreak, 8)
})

test('daily-login dates from the learner device always count as active days', () => {
  assert.equal(dailyLoginDayKey('DAILY_LOGIN:2026-10-29'), '2026-10-29')
  assert.equal(dailyLoginDayKey('DAILY_LOGIN:2026-02-30'), null)
  assert.equal(dailyLoginDayKey('STUDY_VOCABULARY:/vocabulary:1'), null)
  assert.equal(dailyLoginDayKey(null), null)

  // UTC timestamps would leave a gap on 2026-10-29; the device date closes it.
  const history = lateNightHistory()
  const snapshot = calculateLearningStreak(history, now, 'UTC', ['2026-10-29'])
  assert.equal(snapshot.currentStreak, 40)
  assert.equal(snapshot.longestStreak, 40)
})

test('the separate consecutive-day calculation still detects a genuinely missed day', () => {
  const history = lateNightHistory().filter((_, index) => index !== 31)
  assert.equal(calculateLearningStreak(history, now, 'Asia/Tashkent').currentStreak, 8)
})

test('the separate consecutive count allows today until a whole local day is missed', () => {
  const history = lateNightHistory().slice(0, -1)
  assert.equal(calculateLearningStreak(history, now, 'Asia/Tashkent').currentStreak, 39)
  const dayAfter = new Date('2026-11-07T18:00:00.000Z')
  assert.equal(calculateLearningStreak(history, dayAfter, 'Asia/Tashkent').currentStreak, 0)
})

test('saved streaks survive calendar gaps, historical recalculation and an old reduced counter', async () => {
  const db = {
    user: { findUnique: async () => ({ currentStreak: 2, longestStreak: 37 }) },
    testAttempt: { findMany: async () => [] },
    speakingSession: { findMany: async () => [] },
    xpEvent: { findMany: async () => [25, 26].map(day => ({ earnedAt: new Date(`2026-11-${day}T12:00:00Z`), eventKey: `STREAK_DAY:2026-11-${day}` })) },
  }
  const snapshot = await getLearningStreakSnapshot(db, 'learner', 'Asia/Tashkent', new Date('2026-11-26T16:00:00Z'))
  assert.equal(snapshot.currentStreak, 37)
  assert.equal(snapshot.longestStreak, 37)
  assert.equal(snapshot.consecutiveStreak, 2)
  const afterAbsence = await getLearningStreakSnapshot(db, 'learner', 'Asia/Tashkent', new Date('2027-01-10T16:00:00Z'))
  assert.equal(afterAbsence.currentStreak, 37)
  assert.equal(afterAbsence.consecutiveStreak, 0)
  db.user.findUnique = async () => ({ currentStreak: 45, longestStreak: 45 })
  assert.equal((await getLearningStreakSnapshot(db, 'learner', 'Asia/Tashkent')).currentStreak, 45)
})

test('a failed day save is retried; confirmed visits use server calendar days across midnight', async () => {
  let failed = true
  const writes = []
  const db = { xpEvent: { createMany: async input => {
    writes.push(input)
    if (failed) { failed = false; throw new Error('Temporary outage') }
    return { count: 1 }
  } } }
  const before = new Date('2026-11-26T18:59:59Z')
  await assert.rejects(recordLearningVisit(db, 'retry-learner', 'Asia/Tashkent', before), /Temporary outage/)
  await recordLearningVisit(db, 'retry-learner', 'Asia/Tashkent', before)
  await recordLearningVisit(db, 'retry-learner', 'Asia/Tashkent', before)
  await recordLearningVisit(db, 'retry-learner', 'Asia/Tashkent', new Date('2026-11-26T19:00:01Z'))
  assert.equal(writes.length, 3, 'Failed writes remain retryable, repeated confirmed requests do not write again')
  assert.equal(writes[1].data[0].eventKey, 'STREAK_DAY:2026-11-26')
  assert.equal(writes[2].data[0].eventKey, 'STREAK_DAY:2026-11-27')
  assert.ok(writes.every(input => input.skipDuplicates && input.data[0].amount === 0))
  assert.equal(dailyLoginDayKey('STREAK_DAY:2026-11-26'), '2026-11-26')
  assert.equal(dailyLoginDayKey('STREAK_DAY:2026-02-30'), null)
})
