import { useAuthStore } from '@/store/authStore'
import { useSpeakingStore } from '@/store/speakingStore'
import { accountStorageFor } from './accountStorage'
import { getReadingAnalysisHistory } from './readingAnalysisStorage'
import { getWritingAnalysisHistory } from './writingAnalysisStorage'
import { resolveIeltsTestById } from './ieltsTestCatalog'
import { learningCenterApi } from '@/features/learningCenter/api'
import { syncIeltsClassResult } from '@/features/learningCenter/ieltsResultSync'
import { syncSavedSATAttemptResults } from '@/features/sat/resultSync'

const running = new Map<string, Promise<void>>()

/** Repair historical saves through the original server endpoints and keys.
 * Public totals are never calculated from this device and no XP is estimated.
 */
export function syncSavedPerformance(userId: string): Promise<void> {
  const existing = running.get(userId)
  if (existing) return existing
  const current = () => useAuthStore.getState().user?.id === userId
  const sync = async () => {
    if (!current()) return
    const storage = accountStorageFor(userId)
    for (const entry of getReadingAnalysisHistory(userId)) {
      if (!current()) return
      if (entry.isPartial || entry.resultPayload.leaderboardEligible === false) continue
      const test = resolveIeltsTestById(entry.testId, entry.resultPayload)
      if (!test) continue
      const type = test.module === 'Listening' ? 'listening' : 'reading'
      const key = `smarttest-${type}-sync:${userId}:${entry.attemptKey}`
      if (storage.getItem(key) === 'ok') continue
      await syncIeltsClassResult(type, test, entry.resultPayload).catch(() => {})
    }
    const inputs: Parameters<typeof learningCenterApi.syncResult>[0][] = []
    for (const entry of getWritingAnalysisHistory(userId)) {
      // A full Writing paper is one result. Its Task 2 report is a review of
      // the same submission; the original sync key is based on Task 1.
      if (entry.fullTest && entry.taskType !== 'task1') continue
      inputs.push({
        sourceKey: entry.fullTest ? `writing-full-${entry.fullTest.id}-${entry.attemptKey}` : entry.attemptKey,
        sourceType: entry.fullTest ? 'IELTS_WRITING_FULL_TEST' : 'IELTS_WRITING_AI_EVALUATION',
        examType: 'IELTS', skill: 'IELTS_WRITING',
        title: entry.fullTest ? entry.testTitle.replace(/ · Task [12]$/, '') : entry.testTitle,
        score: entry.fullTest?.overallBand ?? entry.overallBand, maxScore: 9,
        durationSec: Math.max(0, Math.round(entry.timeSpent)), completedAt: entry.savedAt,
        breakdown: { testId: entry.fullTest?.id ?? entry.testId, taskType: entry.taskType, wordCount: entry.wordCount },
      })
    }
    for (const session of useSpeakingStore.getState().sessions) {
      if (session.userId !== userId || session.kind !== 'examiner') continue
      inputs.push({
        sourceKey: `speaking-${session.id}`, sourceType: 'IELTS_SPEAKING_MOCK',
        examType: 'IELTS', skill: 'IELTS_SPEAKING', title: session.modeLabel,
        score: session.overallBand, maxScore: 9, durationSec: Math.max(0, Math.round(session.durationSec)),
        completedAt: session.date,
        breakdown: { testId: session.testId ?? '', fluency: session.fluencyBand, lexical: session.lexicalBand, grammar: session.grammarBand, pronunciation: session.pronunciationBand },
      })
    }
    for (const input of inputs) {
      if (!current()) return
      const key = `smarttest-performance-sync:${input.sourceKey}`
      const signature = JSON.stringify(input)
      if (storage.getItem(key) === signature) continue
      try {
        await learningCenterApi.syncResult({ ...input, preserveExisting: true })
        if (current()) storage.setItem(key, signature)
      } catch { /* Retain the history and retry on the next account sync. */ }
    }
    if (current()) await syncSavedSATAttemptResults(userId)
  }
  const request = sync().finally(() => running.delete(userId))
  running.set(userId, request)
  return request
}
