import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyAssessmentEvidence,
  buildRoadmap,
  buildWeek,
  studyAnswersSchema,
  summarizeWeek,
} from '../dist/services/studyPlan.service.js'

const answers = {
  universities: ['University of Oxford'], destinationCountry: 'United Kingdom', intendedMajor: 'Computer Science',
  intakeYear: new Date().getUTCFullYear() + 1, applicationDeadline: '2026-12-01', examTrack: 'IELTS',
  ieltsExamDate: '2026-10-10', satExamDate: null, currentIeltsScore: 6, currentSatScore: null, targetIeltsScore: 7.5, targetSatScore: null,
  weeklyAvailability: [90, 0, 60, 0, 120, 0, 0],
  applicationProgress: { shortlist: 'NOT_STARTED', transcripts: 'NOT_STARTED', essay: 'IN_PROGRESS', recommendations: 'NOT_STARTED', activities: 'NOT_STARTED', funding: 'NOT_STARTED' },
  needsFunding: true,
}

test('a week respects every daily budget and excludes rest days', () => {
  const { days } = buildWeek(answers, [], '2026-09-21', '2026-09-21', null)
  assert.equal(days.length, 7)
  days.forEach((day, index) => assert.ok(day.tasks.reduce((total, item) => total + item.minutes, 0) <= answers.weeklyAvailability[index]))
  assert.deepEqual(days.filter((day) => day.tasks.length).map((day) => day.date), ['2026-09-21', '2026-09-23', '2026-09-25'])
})

test('measured weakness and an unfinished application task shape the next week', () => {
  const evidence = [
    { id: 'r', skill: 'IELTS_READING', percent: 42, completedAt: new Date('2026-09-20T12:00:00Z') },
    { id: 'l', skill: 'IELTS_LISTENING', percent: 81, completedAt: new Date('2026-09-20T12:00:00Z') },
  ]
  const first = buildWeek(answers, evidence, '2026-09-14', '2026-09-14', null)
  const next = buildWeek(answers, evidence, '2026-09-21', '2026-09-21', first.days)
  assert.equal(next.review.focusSkill, 'IELTS_READING')
  assert.ok(next.review.reasons.some((reason) => reason.includes('carried into this week')))
  assert.ok(next.days[0].tasks.some((item) => item.title.startsWith('Continue:')))
})

test('assessment completion requires a matching submitted skill on the scheduled date', () => {
  const generated = buildWeek(answers, [], '2026-09-21', '2026-09-21', null).days
  const practice = generated[0].tasks.find((item) => item.completionMode === 'ASSESSMENT')
  assert.ok(practice)
  const wrongDay = applyAssessmentEvidence(generated, [{ id: 'old', skill: practice.skill, percent: 75, completedAt: new Date('2026-09-20T12:00:00Z') }], 'UTC')
  assert.equal(wrongDay.changed, false)
  const match = applyAssessmentEvidence(generated, [{ id: 'new', skill: practice.skill, percent: 75, completedAt: new Date('2026-09-21T12:00:00Z') }], 'UTC')
  assert.equal(match.changed, true)
  assert.equal(summarizeWeek(match.days).completed, 1)
})

test('roadmap stays tied to the university and rejects incomplete exam goals', () => {
  assert.ok(buildRoadmap(answers)[0].detail.includes('University of Oxford'))
  assert.ok(buildRoadmap(answers).some((item) => item.key === 'funding'))
  assert.equal(studyAnswersSchema.safeParse({ ...answers, targetIeltsScore: null }).success, false)
})

test('a learner with no exam gets application work without unrelated exam tasks', () => {
  const applicationOnly = { ...answers, examTrack: 'NONE', targetIeltsScore: null }
  const { days } = buildWeek(applicationOnly, [], '2026-09-21', '2026-09-21', null)
  const tasks = days.flatMap((day) => day.tasks)
  assert.ok(tasks.length > 0)
  assert.ok(tasks.every((task) => task.category === 'APPLICATION'))
})
