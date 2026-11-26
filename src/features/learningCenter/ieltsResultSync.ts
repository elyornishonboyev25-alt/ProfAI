import { accountStorageFor } from '@/utils/accountStorage'
import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import { learningCenterApi } from './api'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { ieltsDetailsSyncKey, ieltsResultDetails, type IeltsClassPart } from './ieltsResultDetails'

const pending = new Map<string, Promise<unknown>>()
export function waitForIeltsClassSync(testId: string, date: string) {
  return pending.get(`${useAuthStore.getState().user?.id ?? 'guest'}:${testId}-${date}`)?.catch(() => {}) ?? Promise.resolve()
}

export function syncIeltsClassResult(type: 'reading' | 'listening', test: IELTSTest, result: TestResult, assignmentId?: string, savedParts?: IeltsClassPart[]) {
  if (result.leaderboardEligible === false) return Promise.resolve()
  const details = ieltsResultDetails(test, result, savedParts)
  const partial = Boolean(result.isPartial) || result.totalQuestions !== 40
  const userId = useAuthStore.getState().user?.id
  const acknowledgeResult = () => { if (useAuthStore.getState().user?.id === userId) { try { accountStorageFor(userId ?? 'guest').setItem(`smarttest-${type}-sync:${userId ?? 'guest'}:${result.testId}-${result.date}`, 'ok') } catch { /* The idempotent server save can be retried without storage. */ } } }
  const acknowledgeDetails = () => { if (details && useAuthStore.getState().user?.id === userId) { try { accountStorageFor(userId ?? 'guest').setItem(ieltsDetailsSyncKey(type, result), JSON.stringify(details)) } catch { /* Retry safely when storage is unavailable. */ } } }
  if (!partial) {
    // Use the same idempotent attempt endpoint as Results, so class work and
    // review represent one attempt and award XP only once.
    const accuracy = result.totalQuestions ? result.correctAnswers / result.totalQuestions * 100 : 0
    const key = `${userId ?? 'guest'}:${result.testId}-${result.date}`
    const existing = pending.get(key)
    if (existing) return existing
    const request = apiClient.post<{ classBreakdownSaved?: boolean }>(`/tests/${type}-sync`, {
      externalAttemptKey: `${result.testId}-${result.date}`,
      externalTestId: result.testId, title: test.title, completedAt: result.date,
      durationSec: Math.max(600, test.duration * 60),
      timeSpentSec: Math.max(60, Math.round(result.timeSpent || 0)),
      totalQuestions: result.totalQuestions, correctAnswers: result.correctAnswers,
      accuracy, finalScore: accuracy, difficulty: 'HARD', isPartial: false,
      subjects: type === 'listening' ? ['IELTS Listening', 'Listening', 'Audio', 'Comprehension'] : ['IELTS Reading', 'Reading', 'Passage', 'Comprehension'],
      assignmentId,
      breakdown: details,
    }, { expectedUserId: userId }).then((response) => {
      if (response.classBreakdownSaved) acknowledgeDetails()
      acknowledgeResult()
      window.dispatchEvent(new Event('smarttest:attempt-submitted'))
      return response
    }).finally(() => pending.delete(key))
    pending.set(key, request)
    return request
  }
  return learningCenterApi.syncResult({
    sourceKey: `ielts-${type}-${result.testId}-${result.date}`,
    sourceType: 'IELTS_LOCAL_TEST',
    examType: 'IELTS',
    skill: type === 'reading' ? 'IELTS_READING' : 'IELTS_LISTENING',
    title: test.title,
    score: result.totalQuestions ? result.correctAnswers / result.totalQuestions * 100 : 0,
    maxScore: 100,
    accuracy: result.totalQuestions ? result.correctAnswers / result.totalQuestions * 100 : 0,
    durationSec: Math.min(28_800, Math.max(0, Math.round(result.timeSpent))),
    completedAt: result.date,
    // A partial section does not finish an assigned full test.
    assignmentId: undefined,
    breakdown: details ?? { testId: test.id, correct: result.correctAnswers, total: result.totalQuestions, partial: true },
  }).then(response => { acknowledgeResult(); acknowledgeDetails(); return response })
}
