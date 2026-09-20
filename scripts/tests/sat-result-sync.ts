import assert from 'node:assert/strict'
import { syncSavedSATAttemptResults, syncSATAttemptResult } from '../../src/features/sat/resultSync'
import { learningCenterApi } from '../../src/features/learningCenter/api'
import { useAuthStore } from '../../src/store/authStore'
import { SAT_TEST_CATALOG, getSATSectionTest } from '../../src/features/sat/catalog'
import { createSATAttempt } from '../../src/features/sat/practiceTest4'
import { saveSATAttempt, saveSATAttemptToHistory } from '../../src/features/sat/attemptStorage'
import type { AuthUser } from '../../src/types/platform'

type ResultInput = Parameters<typeof learningCenterApi.syncResult>[0]
export async function run() {
  localStorage.clear()
  useAuthStore.setState({ user: { id: 'learner', xp: 324 } as AuthUser })
  const test = SAT_TEST_CATALOG[8]
  const old = { ...createSATAttempt(test.id, test.modules, 'practice'), attemptId: 'old', startedAt: 0, submittedAt: 1000, status: 'submitted' as const }
  saveSATAttemptToHistory(old, 'submitted')
  const questions = test.modules.flatMap((module) => module.questions)
  const recent = { ...old, attemptId: 'recent', submittedAt: 2000, answers: Object.fromEntries(questions.map((q) => [q.id, q.correctAnswer])) }
  saveSATAttempt(recent)
  saveSATAttemptToHistory({ ...old, attemptId: 'unfinished', status: 'active', submittedAt: undefined }, 'exit')
  const section = getSATSectionTest(8, 'math')
  saveSATAttemptToHistory({ ...old, attemptId: 'section', testId: section.id }, 'submitted')
  const partial = SAT_TEST_CATALOG[9]
  saveSATAttemptToHistory({ ...old, attemptId: 'partial', testId: partial.id }, 'submitted')
  const slotBefore = localStorage.getItem(`profai:sat:${test.id}:attempt:v1`)
  const calls: ResultInput[] = []
  let failures = 1
  learningCenterApi.syncResult = async (input) => {
    calls.push(input)
    if (input.sourceKey === `sat-${test.id}-1000` && failures-- > 0) throw new Error('offline')
    await Promise.resolve()
    return {}
  }
  const first = await syncSavedSATAttemptResults('learner')
  assert.equal(first.failed, 1)
  assert.equal(calls.length, 4, 'History, current slot, section and partial test count; unfinished does not')
  const latest = calls.find((call) => call.sourceKey === `sat-${test.id}-2000`)!
  assert.equal(latest.accuracy, 100)
  assert.equal(latest.maxScore, 1600)
  assert.equal(latest.completedAt, new Date(2000).toISOString())
  assert.equal(calls.find((call) => call.sourceKey === `sat-${section.id}-1000`)!.maxScore, 800)
  const partialResult = calls.find((call) => call.sourceKey === `sat-${partial.id}-1000`)!
  assert.equal(partialResult.maxScore, 100, 'Unavailable modules must not produce a full SAT estimate')
  assert.equal(partialResult.accuracy, 0)
  assert.equal((await syncSavedSATAttemptResults('learner')).failed, 0)
  assert.equal(calls.length, 5, 'Only the failed sync is retried')
  await syncSavedSATAttemptResults('learner')
  assert.equal(calls.length, 5, 'Successful backfills are remembered per account')
  assert.equal(localStorage.getItem(`profai:sat:${test.id}:attempt:v1`), slotBefore)
  assert.equal(useAuthStore.getState().user?.xp, 324, 'Backfills never award or modify XP')

  // A later submission and StrictMode effects share the same in-flight request.
  const next = { ...recent, attemptId: 'next', submittedAt: 3000 }
  await Promise.all([syncSATAttemptResult('learner', test, next), syncSATAttemptResult('learner', test, next)])
  assert.equal(calls.length, 6)
  await syncSATAttemptResult('learner', test, next, 'assignment-1')
  assert.equal(calls.length, 7, 'Assignment linkage is preserved for an already synced attempt')
  assert.equal(calls[6].assignmentId, 'assignment-1')

  useAuthStore.setState({ user: null })
  await syncSavedSATAttemptResults('learner')
  assert.equal(calls.length, 7, 'An account switch stops pending backfill work')

  // Legacy per-test slots are migrated and synced even without a history entry.
  localStorage.clear()
  useAuthStore.setState({ user: { id: 'learner', xp: 324 } as AuthUser })
  localStorage.setItem(`profai:sat:${test.id}:attempt:v1`, JSON.stringify({ ...old, attemptId: undefined }))
  await syncSavedSATAttemptResults('learner')
  assert.equal(calls.length, 8)
  assert.equal(calls[7].sourceKey, `sat-${test.id}-1000`)
  console.log('SAT result sync: history, legacy slots, retries, deduplication, incomplete attempts, account guards and unchanged XP passed.')
}
