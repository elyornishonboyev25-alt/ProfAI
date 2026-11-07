import { accountStorageFor } from '@/utils/accountStorage'
import { getSATReviewTests, isSATTestComplete } from '@/features/sat/catalog'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import { scoreSATModules } from '@/features/sat/practiceTest4'
import { useSpeakingStore } from '@/store/speakingStore'
import type { Difficulty, ProfileOverview, TestCategory } from '@/types/platform'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { loadActivityLog, type ActivityLog } from '@/utils/weeklyPlanner'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import { isXpActivitySynced } from '@/lib/xpApi'

type TrackKey = ProfileOverview['skillAnalytics']['trackBreakdown'][number]['key']

export type LocalDashboardAttempt = {
  id: string
  sourceKey: string
  title: string
  category: TestCategory
  difficulty: Difficulty
  completedAt: string
  accuracy: number
  finalScore: number
  xpEarned: number
  durationSec: number
  timeSpentSec: number
  totalQuestions: number
  tracks: TrackKey[]
  synced: boolean
  xpSynced?: boolean
  /** Native exam scale when available: IELTS band or full SAT score. */
  examScore?: number
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0))
}

function earnedXp(accuracy: number, explicitXp?: number) {
  if (typeof explicitXp === 'number' && explicitXp > 0) return Math.round(explicitXp)
  const ratio = clamp(accuracy) / 100
  return Math.round(100 * ratio * ratio)
}

function safeRead<T>(reader: () => T[], fallback: T[] = []): T[] {
  try {
    return reader()
  } catch {
    return fallback
  }
}

function uniqueBy<T>(values: T[], keyOf: (value: T) => string): T[] {
  return [...new Map(values.map((value) => [keyOf(value), value])).values()]
}

export function getCombinedActivityLog(userId: string): ActivityLog {
  const accountLog = safeRead(() => [loadActivityLog(userId)])[0] ?? {}
  return accountLog
}

function isReadingAttemptSynced(userId: string, scope: 'reading' | 'listening', sourceKey: string) {
  if (typeof window === 'undefined') return false
  try {
    return accountStorageFor(userId ?? 'guest').getItem(`smarttest-${scope}-sync:${userId}:${sourceKey}`) === 'ok'
  } catch {
    return false
  }
}

export function getLocalDashboardAttempts(userId: string): LocalDashboardAttempt[] {
  if (typeof window === 'undefined') return []

  const readingHistory = uniqueBy([
    ...safeRead(() => getReadingAnalysisHistory(userId)),
  ], (entry) => entry.attemptKey)
  const readingAttempts: LocalDashboardAttempt[] = readingHistory
    .filter((entry) => entry.totalQuestions > 0)
    .map((entry) => {
      const test = resolveIeltsTestById(entry.testId)
      const isListening = test?.module === 'Listening' || entry.testTitle.toLowerCase().includes('listening')
      const scope = isListening ? 'listening' : 'reading'
      const durationSec = Math.max(600, (test?.duration ?? (isListening ? 30 : 60)) * 60)
      return {
        id: `local-${scope}-${entry.attemptKey}`,
        sourceKey: entry.attemptKey,
        title: entry.testTitle,
        category: 'IELTS',
        difficulty: entry.isPartial ? 'MEDIUM' : 'HARD',
        completedAt: entry.savedAt,
        accuracy: clamp(entry.accuracy),
        finalScore: clamp(entry.accuracy),
        xpEarned: earnedXp(entry.accuracy),
        durationSec,
        timeSpentSec: Math.max(1, entry.timeSpent),
        totalQuestions: entry.totalQuestions,
        tracks: [isListening ? 'IELTS_LISTENING' : 'IELTS_READING'],
        synced: isReadingAttemptSynced(userId, scope, entry.attemptKey),
        examScore: entry.bandScore,
      }
    })

  const writingHistory = uniqueBy([
    ...safeRead(() => getWritingAnalysisHistory(userId)),
  ], (entry) => entry.attemptKey)
  const writingAttempts: LocalDashboardAttempt[] = writingHistory.map((entry) => {
    const accuracy = clamp((entry.overallBand / 9) * 100)
    const durationSec = entry.taskType === 'task1' ? 20 * 60 : 40 * 60
    return {
      id: `local-writing-${entry.attemptKey}`,
      sourceKey: entry.attemptKey,
      title: `IELTS Writing ${entry.testTitle}`,
      category: 'IELTS',
      difficulty: 'HARD',
      completedAt: entry.savedAt,
      accuracy,
      finalScore: accuracy,
      xpEarned: earnedXp(accuracy, entry.xpAwarded),
      durationSec,
      timeSpentSec: Math.max(1, entry.timeSpent || durationSec),
      totalQuestions: 1,
      tracks: ['IELTS_WRITING'],
      synced: false,
      xpSynced: isXpActivitySynced(userId, entry.attemptKey),
      examScore: entry.overallBand,
    }
  })

  const speakingAttempts: LocalDashboardAttempt[] = safeRead(() => useSpeakingStore.getState().sessions)
    .filter((session) => session.userId === userId)
    .map((session) => {
      const accuracy = clamp((session.overallBand / 9) * 100)
      return {
        id: `local-speaking-${session.id}`,
        sourceKey: session.id,
        title: session.modeLabel,
        category: 'IELTS',
        difficulty: 'MEDIUM',
        completedAt: session.date,
        accuracy,
        finalScore: accuracy,
        xpEarned: earnedXp(accuracy),
        durationSec: 14 * 60,
        timeSpentSec: Math.max(1, session.durationSec),
        totalQuestions: 1,
        tracks: ['IELTS_SPEAKING'],
        synced: false,
        xpSynced: isXpActivitySynced(userId, session.id),
        examScore: session.overallBand,
      }
    })

  const satDefinitions = getSATReviewTests()
  const satAttempts: LocalDashboardAttempt[] = satDefinitions.flatMap((test) => {
    const attempt = loadSATAttempt(test.id)
    if (!attempt || attempt.status !== 'submitted') return []
    const report = scoreSATModules(test.modules, attempt.answers)
    const endedAt = attempt.submittedAt ?? attempt.updatedAt
    const completedAt = new Date(endedAt).toISOString()
    const timeSpentSec = Math.max(
      1,
      Math.min(test.totalDurationSeconds, Math.round((endedAt - attempt.startedAt) / 1000)),
    )
    const sections = new Set(test.modules.map((module) => module.section))
    const tracks: TrackKey[] = []
    if (sections.has('math')) tracks.push('SAT_MATH')
    if (sections.has('reading-writing')) tracks.push('SAT_READING_WRITING')
    return [{
      id: `local-sat-${test.id}-${endedAt}`,
      sourceKey: `${test.id}-${endedAt}`,
      title: test.title,
      category: 'SAT' as const,
      difficulty: 'HARD' as const,
      completedAt,
      accuracy: report.percent,
      finalScore: report.percent,
      xpEarned: earnedXp(report.percent),
      durationSec: test.totalDurationSeconds,
      timeSpentSec,
      totalQuestions: test.questionCount,
      tracks,
      synced: false,
      xpSynced: isXpActivitySynced(userId, `${test.id}-${endedAt}`),
      ...(isSATTestComplete(test) ? { examScore: report.midpoint } : {}),
    }]
  })

  return uniqueBy(
    [...readingAttempts, ...writingAttempts, ...speakingAttempts, ...satAttempts],
    (attempt) => `${attempt.category}:${attempt.sourceKey}`,
  )
    .sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime())
}
