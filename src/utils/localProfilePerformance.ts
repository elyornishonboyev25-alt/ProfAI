import { getSATSectionTest, SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import { scoreSATModules } from '@/features/sat/practiceTest4'
import { useSpeakingStore } from '@/store/speakingStore'
import type { DashboardOverview, Difficulty, ProfileOverview, TestCategory } from '@/types/platform'
import type { PublicProfilePayload } from '@/lib/profileApi'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { loadActivityLog, type ActivityKey, type ActivityLog } from '@/utils/weeklyPlanner'
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

const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
  4000, 5000, 6200, 7600, 9200, 11000, 13000, 15200, 17600, 20200,
]

const INDEPENDENT_STUDY_KEYS = new Set<ActivityKey>([
  'vocabulary',
  'articles',
  'podcast',
  'shadowing',
  'admission',
])

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

function mergeActivityLogs(...logs: ActivityLog[]): ActivityLog {
  const merged: ActivityLog = {}

  logs.forEach((log) => {
    Object.entries(log).forEach(([dateKey, activity]) => {
      const current = merged[dateKey] ?? {}
      Object.entries(activity).forEach(([key, value]) => {
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return
        const activityKey = key as ActivityKey
        current[activityKey] = (current[activityKey] ?? 0) + value
      })
      merged[dateKey] = current
    })
  })

  return merged
}

export function getCombinedActivityLog(userId: string): ActivityLog {
  const accountLog = safeRead(() => [loadActivityLog(userId)])[0] ?? {}
  const deviceLog = safeRead(() => [loadActivityLog(undefined)])[0] ?? {}
  return mergeActivityLogs(accountLog, deviceLog)
}

function trackedMinutes(activity: ActivityLog[string], keys?: Set<ActivityKey>) {
  return Object.entries(activity ?? {}).reduce((total, [key, value]) => (
    !keys || keys.has(key as ActivityKey) ? total + (value ?? 0) : total
  ), 0)
}

/** Independent learning earns a small, deterministic 2 XP per five active minutes. */
export function calculateTrackedStudyXp(minutes: number) {
  return Math.floor(Math.max(0, minutes) / 5) * 2
}

function resolveLocalLevelProgress(xp: number) {
  let level = 1
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (xp >= threshold) level = index + 1
  })
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextLevelThreshold = LEVEL_THRESHOLDS[level] ?? currentLevelThreshold + 3000
  const levelSpan = Math.max(1, nextLevelThreshold - currentLevelThreshold)
  const xpIntoCurrent = Math.max(0, xp - currentLevelThreshold)

  return {
    level,
    currentLevelThreshold,
    nextLevelThreshold,
    xpIntoCurrent,
    levelSpan,
    progressPercent: clamp((xpIntoCurrent / levelSpan) * 100),
  }
}

function isReadingAttemptSynced(userId: string, scope: 'reading' | 'listening', sourceKey: string) {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(`smarttest-${scope}-sync:${userId}:${sourceKey}`) === 'ok'
  } catch {
    return false
  }
}

export function getLocalDashboardAttempts(userId: string): LocalDashboardAttempt[] {
  if (typeof window === 'undefined') return []

  const readingHistory = uniqueBy([
    ...safeRead(() => getReadingAnalysisHistory(userId)),
    ...safeRead(() => getReadingAnalysisHistory()),
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
        synced: isReadingAttemptSynced(userId, scope, entry.attemptKey) || isReadingAttemptSynced('guest', scope, entry.attemptKey),
        examScore: entry.bandScore,
      }
    })

  const writingHistory = uniqueBy([
    ...safeRead(() => getWritingAnalysisHistory(userId)),
    ...safeRead(() => getWritingAnalysisHistory()),
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
      examScore: entry.overallBand,
    }
  })

  const speakingAttempts: LocalDashboardAttempt[] = safeRead(() => useSpeakingStore.getState().sessions)
    .filter((session) => session.userId === userId || session.userId === null)
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

  return uniqueBy(
    [...readingAttempts, ...writingAttempts, ...speakingAttempts, ...satAttempts],
    (attempt) => `${attempt.category}:${attempt.sourceKey}`,
  )
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
  const activityLog = getCombinedActivityLog(userId)

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
  const hasServerHistory = overview.stats.totalAttempts > 0
  const unsyncedAttempts = localAttempts.filter((attempt) => (
    !hasServerHistory || (!attempt.synced && !isRepresentedByBackend(attempt, overview))
  ))
  const activityLog = getCombinedActivityLog(userId)

  const serverCount = overview.stats.totalAttempts
  const totalAttempts = serverCount + unsyncedAttempts.length
  const localAccuracyTotal = unsyncedAttempts.reduce((total, attempt) => total + attempt.accuracy, 0)
  const localScoreTotal = unsyncedAttempts.reduce((total, attempt) => total + attempt.finalScore, 0)
  const localXp = unsyncedAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0)
  const averageAccuracy = totalAttempts
    ? (overview.stats.averageAccuracy * serverCount + localAccuracyTotal) / totalAttempts
    : 0
  const averageScore = totalAttempts
    ? (overview.stats.averageScore * serverCount + localScoreTotal) / totalAttempts
    : 0
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

  const activityEvents = Object.entries(activityLog).flatMap(([dateKey, activity]) => {
    const xpEarned = calculateTrackedStudyXp(trackedMinutes(activity, INDEPENDENT_STUDY_KEYS))
    return xpEarned > 0
      ? [{ completedAt: `${dateKey}T12:00:00`, xpEarned, finalScore: 0, percentage: 0 }]
      : []
  })
  const momentumSource = [...overview.recentAttempts, ...localRecent, ...activityEvents]
    .sort((left, right) => new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime())
    .slice(-10)
  let cumulativeXp = 0
  const xpMomentum = momentumSource.map((attempt, index) => {
    cumulativeXp += attempt.xpEarned
    return {
      label: momentumSource.length <= 5
        ? new Date(attempt.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `A${index + 1}`,
      xp: cumulativeXp,
      score: Number(attempt.finalScore.toFixed(2)),
      accuracy: Number(attempt.percentage.toFixed(2)),
    }
  })
  const weeklyActivity = overview.weeklyActivity.map((day) => {
    const dateKey = day.date.slice(0, 10)
    const dailyAttempts = unsyncedAttempts.filter((attempt) => localDateKey(attempt.completedAt) === dateKey)
    const dayLog = activityLog[dateKey] ?? {}
    const studyMinutes = Math.round(trackedMinutes(dayLog))
    const studyXp = calculateTrackedStudyXp(trackedMinutes(dayLog, INDEPENDENT_STUDY_KEYS))
    return {
      ...day,
      testsCompleted: day.testsCompleted + dailyAttempts.length,
      questionsAnswered: day.questionsAnswered + dailyAttempts.reduce((total, attempt) => total + attempt.totalQuestions, 0),
      xpEarned: day.xpEarned + dailyAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0) + studyXp,
      studyMinutes,
      active: day.active || dailyAttempts.length > 0 || studyMinutes > 0,
    }
  })

  const totalStudyMinutes = Object.values(activityLog).reduce(
    (total, activity) => total + trackedMinutes(activity),
    0,
  )
  const studyXp = Object.values(activityLog).reduce(
    (total, activity) => total + calculateTrackedStudyXp(trackedMinutes(activity, INDEPENDENT_STUDY_KEYS)),
    0,
  )
  const totalXp = overview.profile.xp + localXp + studyXp
  const levelProgress = resolveLocalLevelProgress(totalXp)
  const activeDates = new Set<string>()
  localAttempts.forEach((attempt) => {
    const dateKey = localDateKey(attempt.completedAt)
    if (dateKey) activeDates.add(dateKey)
  })
  Object.entries(activityLog).forEach(([dateKey, activity]) => {
    if (trackedMinutes(activity) > 0) activeDates.add(dateKey)
  })
  weeklyActivity.forEach((day) => {
    if (day.active) activeDates.add(day.date.slice(0, 10))
  })
  const currentStreak = Math.max(overview.profile.currentStreak, calculateActivityStreak(activeDates))

  const localAchievements: ProfileOverview['achievements'] = [
    totalAttempts >= 1
      ? {
          unlockedAt: recentAttempts[0]?.completedAt ?? new Date().toISOString(),
          achievement: {
            id: 'local-first-practice',
            slug: 'first-practice',
            title: 'First scored practice',
            description: 'Completed the first scored IELTS or SAT practice.',
            icon: 'activity',
            xpReward: 0,
          },
        }
      : null,
    totalAttempts >= 5
      ? {
          unlockedAt: recentAttempts[0]?.completedAt ?? new Date().toISOString(),
          achievement: {
            id: 'local-five-practices',
            slug: 'five-practices',
            title: 'Practice momentum',
            description: 'Completed five scored practice sessions.',
            icon: 'target',
            xpReward: 0,
          },
        }
      : null,
    totalStudyMinutes >= 60
      ? {
          unlockedAt: new Date().toISOString(),
          achievement: {
            id: 'local-study-hour',
            slug: 'study-hour',
            title: 'Focused learner',
            description: 'Recorded at least one hour of focused learning activity.',
            icon: 'clock',
            xpReward: 0,
          },
        }
      : null,
    currentStreak >= 3
      ? {
          unlockedAt: new Date().toISOString(),
          achievement: {
            id: 'local-three-day-streak',
            slug: 'three-day-streak',
            title: 'Consistency builder',
            description: 'Built a three-day learning streak.',
            icon: 'flame',
            xpReward: 0,
          },
        }
      : null,
  ].filter((entry): entry is ProfileOverview['achievements'][number] => entry !== null)
  const serverAchievementSlugs = new Set(overview.achievements.map((entry) => entry.achievement.slug))
  const achievements = [
    ...overview.achievements,
    ...localAchievements.filter((entry) => !serverAchievementSlugs.has(entry.achievement.slug)),
  ]

  return {
    ...overview,
    profile: {
      ...overview.profile,
      xp: totalXp,
      level: Math.max(overview.profile.level, levelProgress.level),
      currentStreak,
      longestStreak: Math.max(overview.profile.longestStreak, currentStreak),
    },
    stats: {
      totalAttempts,
      averageScore: Number(averageScore.toFixed(2)),
      averageAccuracy: Number(averageAccuracy.toFixed(2)),
      totalXpFromAttempts: overview.stats.totalXpFromAttempts + localXp,
    },
    levelProgress: {
      currentLevelThreshold: levelProgress.currentLevelThreshold,
      nextLevelThreshold: levelProgress.nextLevelThreshold,
      xpIntoCurrent: levelProgress.xpIntoCurrent,
      levelSpan: levelProgress.levelSpan,
      progressPercent: levelProgress.progressPercent,
    },
    skillAnalytics: {
      ...overview.skillAnalytics,
      overall: {
        ...overview.skillAnalytics.overall,
        skillPower: Number(average(trackBreakdown.filter((metric) => metric.attempts > 0).map((metric) => metric.skillPower)).toFixed(2)),
      },
      radar,
      trackBreakdown,
      xpMomentum: xpMomentum.length ? xpMomentum : overview.skillAnalytics.xpMomentum,
      insights: localAttempts.length || totalStudyMinutes > 0
        ? [{
            id: 'local-history-restored',
            type: 'success',
            title: 'Saved activity restored',
            message: 'Your account, device and older guest learning history are included together.',
          }, ...overview.skillAnalytics.insights.filter((insight) => insight.id !== 'guest-tip-register')]
        : overview.skillAnalytics.insights,
    },
    weeklyActivity,
    achievements,
    recentAttempts,
  }
}

/**
 * Public-profile responses come from the shared database, while several legacy
 * exam runners still keep their result on this device. For the profile owner we
 * merge those unsynced records so the public preview never contradicts the main
 * dashboard. Other learners continue to see server-verified data only.
 */
export function mergeLocalPublicProfilePerformance(
  payload: PublicProfilePayload,
  userId: string,
): PublicProfilePayload {
  if (!payload.profile.isSelf) return payload

  const localAttempts = getLocalDashboardAttempts(userId).filter((attempt) => !attempt.synced)
  const activityLog = getCombinedActivityLog(userId)
  const localXp = localAttempts.reduce((total, attempt) => total + attempt.xpEarned, 0)
  const studyXp = Object.values(activityLog).reduce(
    (total, activity) => total + calculateTrackedStudyXp(trackedMinutes(activity, INDEPENDENT_STUDY_KEYS)),
    0,
  )
  const totalXp = payload.profile.xp + localXp + studyXp
  const levelProgress = resolveLocalLevelProgress(totalXp)

  const activeDates = new Set<string>()
  localAttempts.forEach((attempt) => {
    const key = localDateKey(attempt.completedAt)
    if (key) activeDates.add(key)
  })
  Object.entries(activityLog).forEach(([key, activity]) => {
    if (trackedMinutes(activity) > 0) activeDates.add(key)
  })
  const localStreak = calculateActivityStreak(activeDates)

  const stats = payload.stats
    ? (() => {
        const serverCount = payload.stats!.totalAttempts
        const localCount = localAttempts.length
        const totalAttempts = serverCount + localCount
        const localScore = localAttempts.reduce((total, attempt) => total + attempt.finalScore, 0)
        const localAccuracy = localAttempts.reduce((total, attempt) => total + attempt.accuracy, 0)
        return {
          totalAttempts,
          averageScore: totalAttempts
            ? Number(((payload.stats!.averageScore * serverCount + localScore) / totalAttempts).toFixed(1))
            : 0,
          averageAccuracy: totalAttempts
            ? Number(((payload.stats!.averageAccuracy * serverCount + localAccuracy) / totalAttempts).toFixed(1))
            : 0,
        }
      })()
    : null

  const serverTracks = payload.skillAnalytics?.trackBreakdown ?? []
  const trackBreakdown = TRACKS.map((definition) => {
    const serverMetric = serverTracks.find((metric) => metric.key === definition.key) ?? {
      key: definition.key,
      label: definition.label,
      group: definition.group,
      attempts: 0,
      accuracy: 0,
      speed: 0,
      consistency: 0,
      skillPower: 0,
    }
    return combineMetric(serverMetric, localAttempts)
  })
  const radar = TRACKS.map((definition) => {
    const metric = trackBreakdown.find((entry) => entry.key === definition.key)!
    return {
      category: definition.group,
      label: definition.radarLabel,
      attempts: metric.attempts,
      accuracy: metric.accuracy,
      speed: metric.speed,
      consistency: metric.consistency,
      skillPower: metric.skillPower,
    }
  })
  const activeSkillPowers = trackBreakdown.filter((metric) => metric.attempts > 0).map((metric) => metric.skillPower)

  return {
    ...payload,
    profile: {
      ...payload.profile,
      xp: totalXp,
      level: Math.max(payload.profile.level, levelProgress.level),
      streak: Math.max(payload.profile.streak, localStreak),
      longestStreak: Math.max(payload.profile.longestStreak, localStreak),
    },
    stats,
    skillAnalytics: payload.visibility.showResults
      ? {
          overall: {
            skillPower: Number(average(activeSkillPowers).toFixed(2)),
            percentile: payload.skillAnalytics?.overall?.percentile ?? 0,
          },
          radar,
          trackBreakdown,
        }
      : null,
  }
}
