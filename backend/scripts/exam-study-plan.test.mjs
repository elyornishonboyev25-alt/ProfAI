import test from 'node:test'
import assert from 'node:assert/strict'
import { applyEvidence, buildExamWeek, summarize } from '../dist/services/examStudyPlan.service.js'

const week = '2026-09-28'
const base = {
  examTrack: 'BOTH', ieltsExamDate: '2026-10-10', satExamDate: '2026-11-10',
  currentIeltsScore: 6, currentSatScore: 1200, targetIeltsScore: 7.5, targetSatScore: 1450,
  weeklyAvailability: [120, 120, 30, 0, 120, 210, 0],
}

test('both exams appear every active day and the nearer exam comes first', () => {
  const { days } = buildExamWeek(base, [], week, week, null)
  for (const [index, day] of days.entries()) {
    const minutes = day.tasks.reduce((total, task) => total + task.minutes, 0)
    assert.ok(minutes <= base.weeklyAvailability[index])
    if (!base.weeklyAvailability[index]) { assert.equal(day.tasks.length, 0); continue }
    assert.ok(day.tasks.some(task => task.category === 'IELTS'), day.date)
    assert.ok(day.tasks.some(task => task.category === 'SAT'), day.date)
    assert.equal(day.tasks[0].category, 'IELTS')
  }
  const satFirst = buildExamWeek({ ...base, satExamDate: '2026-10-01' }, [], week, week, null)
  assert.equal(satFirst.days[0].tasks[0].category, 'SAT')
})

test('an assessment completes only its exact task on the scheduled day', () => {
  const days = buildExamWeek({ ...base, examTrack: 'IELTS' }, [], week, week, null).days
  const target = days[0].tasks.find(task => task.completionMode === 'ASSESSMENT')
  assert.ok(target)
  const wrong = applyEvidence(days, [{ id: 'wrong', contentKey: 'another-test', skill: target.skill, percent: 95, completedAt: new Date('2026-09-28T10:00:00Z') }], 'UTC')
  assert.equal(wrong.changed, false)
  const late = applyEvidence(days, [{ id: 'late', contentKey: target.contentKey, skill: target.skill, percent: 95, completedAt: new Date('2026-09-29T10:00:00Z') }], 'UTC')
  assert.equal(late.changed, false)
  const matched = applyEvidence(days, [{ id: 'match', contentKey: target.contentKey, skill: target.skill, percent: 75, completedAt: new Date('2026-09-28T10:00:00Z') }], 'UTC')
  assert.equal(matched.changed, true)
  assert.equal(summarize(matched.days).completed, 1)
})

test('unfinished test replaces the next IELTS practice while the original day stays missed', () => {
  const answers = { ...base, examTrack: 'IELTS', weeklyAvailability: [120, 120, 0, 0, 0, 0, 0] }
  const first = buildExamWeek(answers, [], week, week, null)
  const firstKey = first.days[0].tasks.find(task => task.kind === 'PRACTICE')?.contentKey
  assert.ok(firstKey)
  const next = buildExamWeek(answers, [], week, '2026-09-29', null, first.days)
  assert.equal(next.days[0].tasks.find(task => task.kind === 'PRACTICE')?.contentKey, firstKey)
  assert.equal(next.days[1].tasks.find(task => task.kind === 'PRACTICE')?.contentKey, firstKey)
  assert.equal(next.days[0].tasks.find(task => task.contentKey === firstKey)?.status, 'TODO')
})

test('a full SAT mock and analysis are only placed in a long enough block', () => {
  const sat = { ...base, examTrack: 'SAT', weeklyAvailability: [30, 30, 30, 30, 30, 200, 0] }
  const days = buildExamWeek(sat, [], week, week, null).days
  assert.ok(days[5].tasks.some(task => task.contentKey.startsWith('sat:full:')))
  assert.ok(days[5].tasks.some(task => task.kind === 'REVIEW'))
  const short = buildExamWeek({ ...sat, weeklyAvailability: [30, 30, 30, 30, 30, 60, 0] }, [], week, week, null).days
  assert.equal(short[5].tasks.some(task => task.contentKey.startsWith('sat:full:')), false)
})

test('recent weak skills shape the next week', () => {
  const evidence = [
    { id: 'r', contentKey: 'ielts:reading:reading-roadmap-full-1', skill: 'IELTS_READING', percent: 42, completedAt: new Date('2026-09-27T10:00:00Z') },
    { id: 'l', contentKey: 'ielts:listening:ielts-listening-1', skill: 'IELTS_LISTENING', percent: 85, completedAt: new Date('2026-09-27T10:00:00Z') },
  ]
  const result = buildExamWeek({ ...base, examTrack: 'IELTS' }, evidence, week, week, null)
  assert.equal(result.review.focusSkill, 'IELTS_READING')
  assert.ok(result.days[0].tasks.some(task => task.contentKey === 'ielts:reading:reading-roadmap-full-2'))
})

test('unfinished analysis and enrichment return tomorrow without rewriting yesterday', () => {
  const answers = { ...base, examTrack: 'IELTS', weeklyAvailability: [120, 120, 0, 0, 0, 0, 0] }
  const first = buildExamWeek(answers, [], week, week, null)
  const practice = first.days[0].tasks.find(task => task.kind === 'PRACTICE')
  const review = first.days[0].tasks.find(task => task.reviewOf === practice?.contentKey)
  const enrichment = first.days[0].tasks.find(task => task.kind === 'ENRICHMENT')
  assert.ok(practice && review && enrichment)
  const completed = applyEvidence(first.days, [{ id: 'completed', contentKey: practice.contentKey, skill: practice.skill, percent: 71, completedAt: new Date('2026-09-28T10:00:00Z') }], 'UTC').days
  const next = buildExamWeek(answers, [], week, '2026-09-29', null, completed)
  assert.equal(next.days[0].tasks.find(task => task.contentKey === review.contentKey)?.status, 'TODO')
  assert.ok(next.days[1].tasks.some(task => task.contentKey === review.contentKey))
  assert.ok(next.days[1].tasks.some(task => task.contentKey === enrichment.contentKey))
})
