import assert from 'node:assert/strict'
import test from 'node:test'
import {
  guestDiagnosticAnswersSchema,
  scoreGuestDiagnostic,
} from '../dist/services/guestDiagnostic.service.js'

const baseline = {
  applicantCountry: 'Uzbekistan',
  intendedMajor: 'Computer Science',
  destinations: ['United States', 'Canada'],
  intakeYear: new Date().getUTCFullYear() + 1,
  curriculum: 'NATIONAL',
  academicBand: 'BETWEEN_80_89',
  testPlan: 'BOTH',
  currentIeltsScore: 6,
  targetIeltsScore: 7.5,
  currentSatScore: 1200,
  targetSatScore: 1450,
  budgetRange: 'BETWEEN_10K_25K',
  needsAid: true,
  applicationStage: 'RESEARCHING',
  weeklyHours: 8,
}

test('scoring is deterministic and bounded', () => {
  const answers = guestDiagnosticAnswersSchema.parse(baseline)
  const first = scoreGuestDiagnostic(answers)
  const second = scoreGuestDiagnostic(answers)
  assert.deepEqual(first, second)
  assert.ok(first.overallScore >= 0 && first.overallScore <= 100)
  assert.equal(first.categories.length, 4)
  assert.equal(first.priorities.length, 3)
  for (const category of first.categories) assert.ok(category.score >= 0 && category.score <= 100)
})

test('a closer verified test baseline improves exam readiness', () => {
  const developing = scoreGuestDiagnostic(guestDiagnosticAnswersSchema.parse(baseline))
  const ready = scoreGuestDiagnostic(guestDiagnosticAnswersSchema.parse({
    ...baseline,
    currentIeltsScore: 7.5,
    currentSatScore: 1450,
  }))
  const developingExam = developing.categories.find((category) => category.key === 'tests')
  const readyExam = ready.categories.find((category) => category.key === 'tests')
  assert.ok(readyExam.score > developingExam.score)
})

test('required test targets are enforced', () => {
  const parsed = guestDiagnosticAnswersSchema.safeParse({ ...baseline, targetIeltsScore: null })
  assert.equal(parsed.success, false)
})
