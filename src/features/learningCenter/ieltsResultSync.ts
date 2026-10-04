import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import { learningCenterApi } from './api'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

const pending = new Map<string, Promise<unknown>>()
export function waitForIeltsClassSync(testId: string, date: string) {
  return pending.get(`${testId}-${date}`)?.catch(() => {}) ?? Promise.resolve()
}

export function syncIeltsClassResult(type: 'reading' | 'listening', test: IELTSTest, result: TestResult, assignmentId?: string) {
  if (!result.isPartial) {
    // Use the same idempotent attempt endpoint as Results, so class work and
    // review represent one attempt and award XP only once.
    const accuracy = result.totalQuestions ? result.correctAnswers / result.totalQuestions * 100 : 0
    const key = `${result.testId}-${result.date}`
    const existing = pending.get(key)
    if (existing) return existing
    const userId = useAuthStore.getState().user?.id
    const request = apiClient.post(`/tests/${type}-sync`, {
      externalAttemptKey: `${result.testId}-${result.date}`,
      externalTestId: result.testId, title: test.title, completedAt: result.date,
      durationSec: Math.max(600, test.duration * 60),
      timeSpentSec: Math.max(60, Math.round(result.timeSpent || 0)),
      totalQuestions: result.totalQuestions, correctAnswers: result.correctAnswers,
      accuracy, finalScore: accuracy, difficulty: 'HARD', isPartial: false,
      subjects: type === 'listening' ? ['IELTS Listening', 'Listening', 'Audio', 'Comprehension'] : ['IELTS Reading', 'Reading', 'Passage', 'Comprehension'],
      assignmentId,
    }).then((response) => {
      try { window.localStorage.setItem(`smarttest-${type}-sync:${userId ?? 'guest'}:${key}`, 'ok') } catch { /* Server sync succeeded even if storage is unavailable. */ }
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
    score: result.isPartial ? (result.totalQuestions ? result.correctAnswers / result.totalQuestions * 100 : 0) : result.score,
    maxScore: result.isPartial ? 100 : 9,
    accuracy: result.totalQuestions ? result.correctAnswers / result.totalQuestions * 100 : 0,
    durationSec: Math.min(28_800, Math.max(0, Math.round(result.timeSpent))),
    completedAt: result.date,
    // A partial section does not finish an assigned full test.
    assignmentId: result.isPartial ? undefined : assignmentId,
    breakdown: { correct: result.correctAnswers, total: result.totalQuestions, partial: Boolean(result.isPartial) },
  })
}
