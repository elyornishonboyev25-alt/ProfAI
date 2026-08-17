import { getSATSectionTest, SAT_TEST_CATALOG } from '@/features/sat/catalog'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import { selectUserSessions, useSpeakingStore } from '@/store/speakingStore'
import type { DashboardOverview } from '@/types/platform'
import { getCompletedLessons } from '@/utils/admissionProgressStore'
import { getLocalDashboardAttempts } from '@/utils/localProfilePerformance'

const IELTS_MOCK_COUNT = 30
const IELTS_MOCK_SECTIONS = 4
const ADMISSION_LESSON_COUNT = 30
const SPEAKING_SESSION_GOAL = 30
const VOCABULARY_WORD_GOAL = 50

const FULL_MOCK_PROGRESS_STORAGE_KEY = 'smarttest:full-mock-progress:v1'
const VOCABULARY_MASTERY_STORAGE_KEY = 'smarttest_vocab_mastery_v1'
const VOCABULARY_MATCHING_STORAGE_KEY = 'smarttest_vocab_matching_rewards_v2'

type JsonRecord = Record<string, unknown>

export type DashboardLearningKey = 'ielts' | 'sat' | 'admission' | 'speaking' | 'vocabulary'

export type DashboardLearningMetric = {
  progress: number
  completed: number
  total: number
  detail: string
}

export type DashboardAchievement = {
  description: string
  current: number
  target: number
  progress: number
  unit: 'count' | 'days' | 'minutes' | 'percent'
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)))
}

function progress(completed: number, total: number) {
  return clampProgress((completed / Math.max(1, total)) * 100)
}

function readRecord(key: string): JsonRecord {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}') as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonRecord : {}
  } catch {
    return {}
  }
}

function submitted(testId: string) {
  return loadSATAttempt(testId)?.status === 'submitted'
}

function getIeltsMockMetric(): DashboardLearningMetric & { completedMocks: number } {
  const store = readRecord(FULL_MOCK_PROGRESS_STORAGE_KEY)
  let completedSections = 0
  let completedMocks = 0

  for (let index = 1; index <= IELTS_MOCK_COUNT; index += 1) {
    const value = store[`full-mock-${index}`]
    const sections = new Set(
      Array.isArray(value)
        ? value.filter((item): item is string => (
            item === 'listening' || item === 'reading' || item === 'writing' || item === 'speaking'
          ))
        : [],
    )
    completedSections += sections.size
    if (sections.size === IELTS_MOCK_SECTIONS) completedMocks += 1
  }

  const total = IELTS_MOCK_COUNT * IELTS_MOCK_SECTIONS
  return {
    progress: progress(completedSections, total),
    completed: completedSections,
    total,
    completedMocks,
    detail: `${completedSections} of ${total} mock sections`,
  }
}

function getSatMetric(): DashboardLearningMetric & { completedMocks: number } {
  const tests = Object.values(SAT_TEST_CATALOG)
  let completedSections = 0
  let completedMocks = 0

  tests.forEach((test) => {
    if (submitted(test.id)) {
      completedSections += 2
      completedMocks += 1
      return
    }
    if (submitted(getSATSectionTest(test.mockId, 'math').id)) completedSections += 1
    if (submitted(getSATSectionTest(test.mockId, 'reading-writing').id)) completedSections += 1
  })

  const total = tests.length * 2
  return {
    progress: progress(completedSections, total),
    completed: completedSections,
    total,
    completedMocks,
    detail: `${completedSections} of ${total} SAT sections`,
  }
}

function getVocabularyMetric(): DashboardLearningMetric {
  const mastery = readRecord(VOCABULARY_MASTERY_STORAGE_KEY)
  const matching = readRecord(VOCABULARY_MATCHING_STORAGE_KEY)
  const keys = new Set([...Object.keys(mastery), ...Object.keys(matching)])
  let masteredWords = 0

  keys.forEach((key) => {
    const masteryValue = mastery[key]
    const knownCount = masteryValue && typeof masteryValue === 'object' && !Array.isArray(masteryValue)
      ? Object.values(masteryValue as JsonRecord).filter(Boolean).length
      : 0
    const matchingValue = matching[key]
    const groups = matchingValue && typeof matchingValue === 'object' && !Array.isArray(matchingValue)
      ? (matchingValue as JsonRecord).awardedGroups
      : null
    const matchedCount = Array.isArray(groups) ? groups.length * 6 : 0
    masteredWords += Math.max(knownCount, matchedCount)
  })

  return {
    progress: progress(masteredWords, VOCABULARY_WORD_GOAL),
    completed: masteredWords,
    total: VOCABULARY_WORD_GOAL,
    detail: `${masteredWords} words mastered`,
  }
}

export function getDashboardLearningMetrics(userId: string) {
  const ielts = getIeltsMockMetric()
  const sat = getSatMetric()
  const admissionCompleted = Math.min(ADMISSION_LESSON_COUNT, getCompletedLessons().size)
  const speakingSessions = selectUserSessions(useSpeakingStore.getState().sessions, userId)
  const speakingCompleted = Math.min(SPEAKING_SESSION_GOAL, speakingSessions.length)

  const learning: Record<DashboardLearningKey, DashboardLearningMetric> = {
    ielts,
    sat,
    admission: {
      progress: progress(admissionCompleted, ADMISSION_LESSON_COUNT),
      completed: admissionCompleted,
      total: ADMISSION_LESSON_COUNT,
      detail: `${admissionCompleted} of ${ADMISSION_LESSON_COUNT} lessons`,
    },
    speaking: {
      progress: progress(speakingCompleted, SPEAKING_SESSION_GOAL),
      completed: speakingCompleted,
      total: SPEAKING_SESSION_GOAL,
      detail: `${speakingSessions.length} speaking sessions`,
    },
    vocabulary: getVocabularyMetric(),
  }

  return {
    learning,
    completedMocks: ielts.completedMocks + sat.completedMocks,
  }
}

export function getDashboardExamScores(userId: string) {
  const attempts = getLocalDashboardAttempts(userId)
  const bestIeltsByTrack = new Map<string, number>()

  attempts.forEach((attempt) => {
    if (attempt.category !== 'IELTS' || typeof attempt.examScore !== 'number') return
    attempt.tracks.forEach((track) => {
      bestIeltsByTrack.set(track, Math.max(bestIeltsByTrack.get(track) ?? 0, attempt.examScore!))
    })
  })

  const ieltsScores = [...bestIeltsByTrack.values()].filter((value) => value > 0)
  const ielts = ieltsScores.length
    ? Math.round((ieltsScores.reduce((sum, value) => sum + value, 0) / ieltsScores.length) * 2) / 2
    : null

  const satScores = attempts
    .filter((attempt) => (
      attempt.category === 'SAT' &&
      attempt.tracks.includes('SAT_MATH') &&
      attempt.tracks.includes('SAT_READING_WRITING') &&
      typeof attempt.examScore === 'number'
    ))
    .map((attempt) => attempt.examScore!)

  return {
    ielts,
    sat: satScores.length ? Math.max(...satScores) : null,
  }
}

export function getNextDashboardAchievement(overview: DashboardOverview): DashboardAchievement {
  const attempts = overview.metrics.totalTests
  const streak = overview.metrics.currentStreak
  const weeklyMinutes = Math.round(overview.metrics.weeklyStudySeconds / 60)
  const averageScore = Math.round(overview.metrics.averageScore)
  const milestones: Array<Omit<DashboardAchievement, 'progress'>> = [
    { description: 'Complete your first scored practice', current: attempts, target: 1, unit: 'count' },
    { description: 'Complete 3 scored practice sessions', current: attempts, target: 3, unit: 'count' },
    { description: 'Build a 3-day learning streak', current: streak, target: 3, unit: 'days' },
    { description: 'Study for 5 hours this week', current: weeklyMinutes, target: 300, unit: 'minutes' },
    { description: 'Complete 10 scored practice sessions', current: attempts, target: 10, unit: 'count' },
    { description: 'Build a 7-day learning streak', current: streak, target: 7, unit: 'days' },
    { description: 'Reach a 70% practice average', current: averageScore, target: 70, unit: 'percent' },
    { description: 'Complete 25 scored practice sessions', current: attempts, target: 25, unit: 'count' },
  ]
  const next = milestones.find((milestone) => milestone.current < milestone.target) ?? {
    description: 'Complete 50 scored practice sessions',
    current: attempts,
    target: 50,
    unit: 'count' as const,
  }

  return {
    ...next,
    current: Math.min(next.current, next.target),
    progress: progress(next.current, next.target),
  }
}
