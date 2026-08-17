import { getSATSectionTest, SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import { scoreSATModules } from '@/features/sat/practiceTest4'
import { useSpeakingStore } from '@/store/speakingStore'
import type { DashboardOverview, Difficulty, ProfileOverview, TestCategory } from '@/types/platform'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { loadActivityLog } from '@/utils/weeklyPlanner'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'

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
  /** Native exam scale when available: IELTS band or full SAT score. */
  examScore?: number
}

const TRACKS: Array<{
  key: TrackKey
  label: string
  radarLabel: string
  group: 'IELTS' | 'SAT'
}> = [
  { key: 'IELTS_READING', label: 'IELTS Reading', radarLabel: 'Reading', group: 'IELTS' },
  { key: 'IELTS_LISTENING', label: 'IELTS Listening', radarLabel: 'Listening', group: 'IELTS' },
  { key: 'IELTS_WRITING', label: 'IELTS Writing', radarLabel: 'Writing', group: 'IELTS' },
  { key: 'IELTS_SPEAKING', label: 'IELTS Speaking', radarLabel: 'Speaking', group: 'IELTS' },
  { key: 'SAT_MATH', label: 'SAT Math', radarLabel: 'SAT Math', group: 'SAT' },
  { key: 'SAT_READING_WRITING', label: 'SAT Reading/Writing', radarLabel: 'SAT R/W', group: 'SAT' },
]

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0))
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) return 0
  const mean = average(values)
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)))
}

function speedEfficiency(durationSec: number, timeSpentSec: number) {
  const ratio = Math.max(1, durationSec) / Math.max(1, timeSpentSec)
  return clamp(50 + (ratio - 1) * 50)
}

function consistency(scores: number[]) {
  if (!scores.length) return 0
  if (scores.length === 1) return clamp(scores[0])
  return clamp(clamp(100 - standardDeviation(scores) * 2) * 0.7 + clamp(average(scores)) * 0.3)
}

function skillPower(accuracy: number, speed: number, stable: number) {
  return clamp(accuracy * 0.6 + speed * 0.2 + stable * 0.2)
}

function earnedXp(accuracy: number, explicitXp?: number) {
  if (typeof explicitXp === 'number' && explicitXp > 0) return Math.round(explicitXp)
  const ratio = clamp(accuracy) / 100
  return Math.round(100 * ratio * ratio)
}

function isReadingAttemptSynced(userId: string, scope: 'reading' | 'listening', sourceKey: string) {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(`smarttest-${scope}-sync:${userId}:${sourceKey}`) === 'ok'
}

export function getLocalDashboardAttempts(userId: string): LocalDashboardAttempt[] {
  if (typeof window === 'undefined') return []

  const readingAttempts: LocalDashboardAttempt[] = getReadingAnalysisHistory(userId)
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

  const writingAttempts: LocalDashboardAttempt[] = getWritingAnalysisHistory(userId).map((entry) => {
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
      examScore: entry.overallBand,
    }
  })

  const speakingAttempts: LocalDashboardAttempt[] = useSpeakingStore.getState().sessions
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
        examScore: session.overallBand,
      }
    })

  const satDefinitions = Object.values(SAT_TEST_CATALOG).flatMap((test) => [
    test,
    getSATSectionTest(test.mockId, 'math'),
    getSATSectionTest(test.mockId, 'reading-writing'),
  ])
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
      examScore: report.midpoint,
    }]
  })

  return [...readingAttempts, ...writingAttempts, ...speakingAttempts, ...satAttempts]
    .sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime())
}

function localDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function calculateActivityStreak(activeDates: Iterable<string>, now = new Date()) {
  const dates = new Set(activeDates)
  const cursor = new Date(now)
  cursor.setHours(12, 0, 0, 0)

  // A streak remains current throughout the following day, matching the
  // learner-facing grace period used by Speaking analytics.
  if (!dates.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!dates.has(localDateKey(cursor))) return 0
  }

  let streak = 0
  while (dates.has(localDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function dashboardAttemptAlreadySynced(attempt: LocalDashboardAttempt, overview: DashboardOverview) {
  if (attempt.synced) return true
  const normalizedTitle = attempt.title.trim().toLowerCase()
  return overview.activityTimeline.some((item) => (
    item.type === 'attempt' &&
    item.title.trim().toLowerCase().includes(normalizedTitle) &&
    Math.abs(new Date(item.date).getTime() - new Date(attempt.completedAt).getTime()) <= 120_000
  ))
}

export function mergeLocalDashboardPerformance(overview: DashboardOverview, userId: string): DashboardOverview {
  const localAttempts = getLocalDashboardAttempts(userId)
  const hasServerHistory = overview.metrics.totalTests > 0
  const unsyncedAttempts = localAttempts.filter((attempt) => (
    !hasServerHistory || !dashboardAttemptAlreadySynced(attempt, overview)
  ))
  const activityLog = loadActivityLog(userId)

  const serverCount = overview.metrics.totalTests
  const totalTests = serverCount + unsyncedAttempts.length
  const localScoreTotal = unsyncedAttempts.reduce((total, attempt) => total + attempt.finalScore, 0)
  const averageScore = totalTests > 0
    ? (overview.metrics.averageScore * serverCount + localScoreTotal) / totalTests
    : 0

  const weeklyProgress = overview.weeklyProgress.map((day) => {
    const dateKey = day.date.slice(0, 10)
    const dailyAttempts = unsyncedAttempts.filter((attempt) => localDateKey(attempt.completedAt) === dateKey)
    const trackedMinutes = Object.values(activityLog[dateKey] ?? {}).reduce(
      (total, minutes) => total + (minutes ?? 0),
      0,
    )
    const localAttemptSeconds = dailyAttempts.reduce((total, attempt) => total + attempt.timeSpentSec, 0)
    const studyTimeSec = Math.max(day.studyTimeSec ?? 0, trackedMinutes * 60, localAttemptSeconds)

    return {
      ...day,
      testsCompleted: day.testsCompleted + dailyAttempts.length,
      questionsAnswered: day.questionsAnswered + dailyAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0),
      studyTimeSec,
      active: day.active || dailyAttempts.length > 0 || studyTimeSec > 0,
    }
  })
  const weeklyStudySeconds = weeklyProgress.reduce((total, day) => total + day.studyTimeSec, 0)
  const activeDates = new Set<string>()
  localAttempts.forEach((attempt) => {
    const dateKey = localDateKey(attempt.completedAt)
    if (dateKey) activeDates.add(dateKey)
  })
  Object.entries(activityLog).forEach(([dateKey, activity]) => {
    const minutes = Object.values(activity).reduce((total, value) => total + (value ?? 0), 0)
    if (minutes > 0) activeDates.add(dateKey)
  })
  weeklyProgress.forEach((day) => {
    if (day.active || day.studyTimeSec > 0) activeDates.add(day.date.slice(0, 10))
  })

  const currentStreak = calculateActivityStreak(activeDates)

  return {
    ...overview,
    metrics: {
      ...overview.metrics,
      totalTests,
      averageScore: Number(averageScore.toFixed(2)),
      weeklyStudySeconds,
      currentStreak: Math.max(overview.metrics.currentStreak, currentStreak),
    },
    weeklyProgress,
  }
}

function isRepresentedByBackend(attempt: LocalDashboardAttempt, overview: ProfileOverview) {
  return overview.recentAttempts.some((serverAttempt) => (
    serverAttempt.test.category === attempt.category &&
    serverAttempt.test.title.trim().toLowerCase() === attempt.title.trim().toLowerCase() &&
    Math.abs(new Date(serverAttempt.completedAt).getTime() - new Date(attempt.completedAt).getTime()) <= 120_000
  ))
}

function combineMetric(
  serverMetric: ProfileOverview['skillAnalytics']['trackBreakdown'][number],
  localAttempts: LocalDashboardAttempt[],
) {
  const matching = localAttempts.filter((attempt) => attempt.tracks.includes(serverMetric.key))
  if (!matching.length) return serverMetric

  const localCount = matching.length
  const total = serverMetric.attempts + localCount
  const weighted = (serverValue: number, localValues: number[]) => (
    (serverValue * serverMetric.attempts + localValues.reduce((sum, value) => sum + value, 0)) / Math.max(1, total)
  )
  const accuracy = weighted(serverMetric.accuracy, matching.map((attempt) => attempt.accuracy))
  const speed = weighted(serverMetric.speed, matching.map((attempt) => speedEfficiency(attempt.durationSec, attempt.timeSpentSec)))
  const localConsistency = consistency(matching.map((attempt) => attempt.finalScore))
  const stable = weighted(serverMetric.consistency, Array.from({ length: localCount }, () => localConsistency))

  return {
    ...serverMetric,
    attempts: total,
    accuracy: Number(accuracy.toFixed(2)),
    speed: Number(speed.toFixed(2)),
    consistency: Number(stable.toFixed(2)),
    skillPower: Number(skillPower(accuracy, speed, stable).toFixed(2)),
  }
}

export function mergeLocalProfilePerformance(overview: ProfileOverview, userId: string): ProfileOverview {
  const localAttempts = getLocalDashboardAttempts(userId)
  if (!localAttempts.length) return overview

  const hasServerHistory = overview.stats.totalAttempts > 0
  const unsyncedAttempts = localAttempts.filter((attempt) => (
    !hasServerHistory || (!attempt.synced && !isRepresentedByBackend(attempt, overview))
  ))
  if (!unsyncedAttempts.length) return overview

  const serverCount = overview.stats.totalAttempts
  const totalAttempts = serverCount + unsyncedAttempts.length
  const localAccuracyTotal = unsyncedAttempts.reduce((total, attempt) => total + attempt.accuracy, 0)
  const localScoreTotal = unsyncedAttempts.reduce((total, attempt) => total + attempt.finalScore, 0)
  const localXp = unsyncedAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0)
  const averageAccuracy = (overview.stats.averageAccuracy * serverCount + localAccuracyTotal) / totalAttempts
  const averageScore = (overview.stats.averageScore * serverCount + localScoreTotal) / totalAttempts
  const trackBreakdown = TRACKS.map((definition) => {
    const serverMetric = overview.skillAnalytics.trackBreakdown.find((metric) => metric.key === definition.key) ?? {
      key: definition.key,
      label: definition.label,
      group: definition.group,
      attempts: 0,
      accuracy: 0,
      speed: 0,
      consistency: 0,
      skillPower: 0,
    }
    return combineMetric(serverMetric, unsyncedAttempts)
  })
  const radar = TRACKS.map((definition) => {
    const metric = trackBreakdown.find((entry) => entry.key === definition.key)!
    return {
      category: definition.group as TestCategory,
      label: definition.radarLabel,
      attempts: metric.attempts,
      accuracy: metric.accuracy,
      speed: metric.speed,
      consistency: metric.consistency,
      skillPower: metric.skillPower,
    }
  })
  const localRecent = unsyncedAttempts.map((attempt) => ({
    id: attempt.id,
    finalScore: attempt.finalScore,
    percentage: attempt.accuracy,
    xpEarned: attempt.xpEarned,
    completedAt: attempt.completedAt,
    test: {
      id: attempt.sourceKey,
      title: attempt.title,
      category: attempt.category,
      difficulty: attempt.difficulty,
    },
  }))
  const recentAttempts = [...overview.recentAttempts, ...localRecent]
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())
    .slice(0, 8)

  const momentumSource = [...overview.recentAttempts, ...localRecent]
    .sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime())
    .slice(-10)
  let cumulativeXp = 0
  const xpMomentum = momentumSource.map((attempt, index) => {
    cumulativeXp += attempt.xpEarned
    return {
      label: momentumSource.length <= 5
        ? new Date(attempt.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `T${index + 1}`,
      xp: cumulativeXp,
      score: Number(attempt.finalScore.toFixed(2)),
      accuracy: Number(attempt.percentage.toFixed(2)),
    }
  })
  const weeklyActivity = overview.weeklyActivity.map((day) => {
    const dateKey = day.date.slice(0, 10)
    const dailyAttempts = unsyncedAttempts.filter((attempt) => attempt.completedAt.slice(0, 10) === dateKey)
    return {
      ...day,
      testsCompleted: day.testsCompleted + dailyAttempts.length,
      questionsAnswered: day.questionsAnswered + dailyAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0),
      xpEarned: day.xpEarned + dailyAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0),
      active: day.active || dailyAttempts.length > 0,
    }
  })

  const totalXp = Math.max(overview.profile.xp, overview.profile.xp + localXp)
  const level = Math.max(overview.profile.level, Math.floor(totalXp / 200) + 1)
  const levelStart = (level - 1) * 200

  return {
    ...overview,
    profile: { ...overview.profile, xp: totalXp, level },
    stats: {
      totalAttempts,
      averageScore: Number(averageScore.toFixed(2)),
      averageAccuracy: Number(averageAccuracy.toFixed(2)),
      totalXpFromAttempts: overview.stats.totalXpFromAttempts + localXp,
    },
    levelProgress: {
      currentLevelThreshold: levelStart,
      nextLevelThreshold: level * 200,
      xpIntoCurrent: totalXp - levelStart,
      levelSpan: 200,
      progressPercent: clamp(((totalXp - levelStart) / 200) * 100),
    },
    skillAnalytics: {
      ...overview.skillAnalytics,
      overall: {
        ...overview.skillAnalytics.overall,
        skillPower: Number(average(trackBreakdown.filter((metric) => metric.attempts > 0).map((metric) => metric.skillPower)).toFixed(2)),
      },
      radar,
      trackBreakdown,
      xpMomentum,
      insights: [{
        id: 'local-history-restored',
        type: 'success',
        title: 'Saved activity restored',
        message: 'Your locally saved IELTS and SAT attempts are included together with synced account results.',
      }, ...overview.skillAnalytics.insights.filter((insight) => insight.id !== 'guest-tip-register')],
    },
    weeklyActivity,
    recentAttempts,
  }
}
