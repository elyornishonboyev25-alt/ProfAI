import { learningCenterApi } from '@/features/learningCenter/api'
import { useAuthStore } from '@/store/authStore'
import { loadSATAttempt, loadSATAttemptHistory } from './attemptStorage'
import { getSATReviewTests, isSATTestComplete, type SATTestDefinition } from './catalog'
import { isSATAnswerCorrect, scoreSATModules, type SATAttempt } from './practiceTest4'

const pending = new Map<string, Promise<void>>()

export async function syncSATAttemptResult(
  userId: string,
  test: SATTestDefinition,
  attempt: SATAttempt,
  assignmentId?: string,
): Promise<void> {
  if (attempt.status !== 'submitted' || useAuthStore.getState().user?.id !== userId) return
  const endedAt = attempt.submittedAt ?? attempt.updatedAt
  if (!Number.isFinite(endedAt)) return
  // Match the existing submission key so backfills update, never duplicate, results.
  const sourceKey = `sat-${test.id}-${endedAt}`
  const syncKey = `smarttest-sat-result-sync:${userId}:${sourceKey}`
  try {
    if (!assignmentId && window.localStorage.getItem(syncKey) === 'ok') return
  } catch { /* The server upsert still makes retries safe without local storage. */ }
  const pendingKey = `${syncKey}:${assignmentId ?? ''}`
  const existing = pending.get(pendingKey)
  if (existing) return existing

  const report = scoreSATModules(test.modules, attempt.answers)
  const onlySection = test.modules.every((module) => module.section === test.modules[0]?.section)
  const section = onlySection ? test.modules[0]?.section : null
  const complete = isSATTestComplete(test)
  const range = section === 'math' ? report.mathRange : report.readingWritingRange
  const topicStats = new Map<string, { correct: number; total: number }>()
  for (const question of test.modules.flatMap((module) => module.questions)) {
    const stats = topicStats.get(question.domain) ?? { correct: 0, total: 0 }
    stats.total++
    if (isSATAnswerCorrect(question, attempt.answers[question.id])) stats.correct++
    topicStats.set(question.domain, stats)
  }
  const request = learningCenterApi.syncResult({
    sourceKey,
    sourceType: 'SAT_BLUEBOOK_MOCK',
    examType: 'SAT',
    skill: section === 'math' ? 'SAT_MATH' : section === 'reading-writing' ? 'SAT_READING_WRITING' : 'SAT_OVERALL',
    title: test.title,
    score: !complete ? report.percent : section ? Math.round((range[0] + range[1]) / 20) * 10 : report.midpoint,
    maxScore: !complete ? 100 : section ? 800 : 1600,
    accuracy: report.percent,
    durationSec: Math.min(8 * 60 * 60, Math.max(0, Math.round((endedAt - attempt.startedAt) / 1000))),
    completedAt: new Date(endedAt).toISOString(),
    assignmentId,
    breakdown: {
      readingWritingRange: report.readingWritingRange,
      mathRange: report.mathRange,
      correct: report.correct,
      incorrect: report.incorrect,
      unanswered: report.unanswered,
      topics: [...topicStats].map(([topic, stats]) => ({
        topic, ...stats, accuracy: Math.round(stats.correct / Math.max(1, stats.total) * 100),
      })),
    },
  }).then(() => {
    try { window.localStorage.setItem(syncKey, 'ok') } catch { /* Already persisted on the server. */ }
  }).finally(() => { pending.delete(pendingKey) })
  pending.set(pendingKey, request)
  return request
}

export async function syncSavedSATAttemptResults(userId: string): Promise<{ failed: number }> {
  const tests = getSATReviewTests()
  // Migrate completed attempts from the old per-test slots into history first.
  tests.forEach((test) => loadSATAttempt(test.id))
  const byId = new Map(tests.map((test) => [test.id, test]))
  const entries = loadSATAttemptHistory().filter((entry) => entry.attempt.status === 'submitted')
  let failed = 0
  // Bound requests even when the learner has a long history.
  for (let index = 0; index < entries.length; index += 3) {
    if (useAuthStore.getState().user?.id !== userId) break
    const results = await Promise.allSettled(entries.slice(index, index + 3).map(({ attempt }) => {
      const test = byId.get(attempt.testId)
      return test ? syncSATAttemptResult(userId, test, attempt) : Promise.resolve()
    }))
    failed += results.filter((result) => result.status === 'rejected').length
  }
  return { failed }
}
