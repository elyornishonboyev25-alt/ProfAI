import { Difficulty, LeaderboardPeriod, type Prisma, type TestCategory } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { addUtcDays, getPeriodStart, startOfUtcDay } from '../utils/date.js'

type PeriodInput = 'today' | 'week' | 'month' | 'all'

export type RankTrend = 'up' | 'down' | 'same'

export type DivisionTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'ELITE'

export type RankBreakdown = {
  accuracy: number
  speedEfficiency: number
  consistencyScore: number
  engagementScore: number
  focusConsistency: number
  dailyCompletionRate: number
  inactivityDays: number
  inactivityPenalty: number
  activityDecay: number
  difficultyMultiplier: number
  normalizedDifficulty: number
  improvementDelta: number
  validatedAttempts: number
  discardedAttempts: number
  integrityScore: number
  rankScore: number
}

type LeaderboardRowCore = {
  rank: number
  previousRank: number
  rankDelta: number
  rankTrend: RankTrend
  userId: string
  fullName: string
  avatarUrl: string | null
  totalXp: number
  testsCompleted: number
  accuracy: number
  streak: number
  rankingScore: number
  division: DivisionTier
  divisionLabel: string
  uniqueTests: number
  validatedAttempts: number
  discardedAttempts: number
  integrityScore: number
  speedEfficiency: number
  consistencyScore: number
  focusConsistency: number
  dailyCompletionRate: number
  improvementDelta: number
  difficultyMultiplier: number
  breakdown: RankBreakdown
}

type LeaderboardCacheEntry = {
  expiresAt: number
  payload: {
    period: PeriodInput
    category: TestCategory | null
    weeklyPremiumWinner: {
      userId: string
      fullName: string
      rankingScore: number
      testsCompleted: number
    } | null
    weeklyPerformanceBoard: LeaderboardRowCore[]
    antiCheatRules: string[]
    rows: LeaderboardRowCore[]
  }
}

type UserAttemptSnapshot = {
  testId: string
  userId: string
  percentage: number
  finalScore: number
  totalQuestions: number
  correctAnswers: number
  timeSpentSec: number
  xpEarned: number
  completedAt: Date
  test: {
    difficulty: Difficulty
    durationSec: number
  }
}

type UserAggregateRow = {
  userId: string
  fullName: string
  avatarUrl: string | null
  totalXp: number
  testsCompleted: number
  accuracy: number
  streak: number
  rankingScore: number
  division: DivisionTier
  uniqueTests: number
  validatedAttempts: number
  discardedAttempts: number
  integrityScore: number
  speedEfficiency: number
  consistencyScore: number
  focusConsistency: number
  dailyCompletionRate: number
  improvementDelta: number
  difficultyMultiplier: number
  breakdown: RankBreakdown
}

const LEADERBOARD_CACHE_TTL_MS = 45_000

const leaderboardCache = new Map<string, LeaderboardCacheEntry>()

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  EASY: 1.0,
  MEDIUM: 1.2,
  HARD: 1.5,
}

const DIVISION_THRESHOLDS: Array<{ tier: DivisionTier; min: number; maxExclusive: number }> = [
  { tier: 'BRONZE', min: 0, maxExclusive: 55 },
  { tier: 'SILVER', min: 55, maxExclusive: 68 },
  { tier: 'GOLD', min: 68, maxExclusive: 80 },
  { tier: 'PLATINUM', min: 80, maxExclusive: 90 },
  { tier: 'ELITE', min: 90, maxExclusive: Number.POSITIVE_INFINITY },
]

function toPeriodEnum(period: PeriodInput): LeaderboardPeriod {
  if (period === 'today') return LeaderboardPeriod.TODAY
  if (period === 'week') return LeaderboardPeriod.WEEK
  if (period === 'month') return LeaderboardPeriod.MONTH
  return LeaderboardPeriod.ALL_TIME
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) return 0
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  return Math.sqrt(variance)
}

function normalizeDifficulty(difficultyMultiplier: number) {
  // Multipliers (1.0-2.0) are normalized so this factor contributes fairly inside a 0-100 formula.
  return clamp((difficultyMultiplier / 2) * 100, 0, 100)
}

function fullDaysBetween(later: Date, earlier: Date) {
  const diff = later.getTime() - earlier.getTime()
  return Math.max(0, Math.floor(diff / 86_400_000))
}

export function calculateInactivityPenalty(inactivityDays: number) {
  if (inactivityDays <= 1) return 0
  const rawPenalty = (inactivityDays - 1) * 1.75
  return clamp(rawPenalty, 0, 35)
}

export function calculateActivityDecay(inactivityDays: number) {
  const penalty = calculateInactivityPenalty(inactivityDays)
  return clamp(1 - penalty / 100, 0.65, 1)
}

export function calculateEngagementScore(input: {
  testsCompleted: number
  streak: number
  period: PeriodInput
}) {
  const targetLoad =
    input.period === 'today'
      ? 1
      : input.period === 'week'
        ? 5
        : input.period === 'month'
          ? 16
          : 24

  const volumeScore = clamp((input.testsCompleted / targetLoad) * 100, 0, 100)
  const streakScore = clamp(input.streak * 8, 0, 100)

  return clamp(volumeScore * 0.72 + streakScore * 0.28, 0, 100)
}

export function calculateSpeedEfficiency(durationSec: number, timeSpentSec: number) {
  const safeDuration = Math.max(1, durationSec)
  const safeTimeSpent = Math.max(1, timeSpentSec)
  const ratio = safeDuration / safeTimeSpent
  return clamp(50 + (ratio - 1) * 50, 0, 100)
}

export function calculateConsistencyScore(scores: number[]) {
  if (scores.length === 0) return 0
  if (scores.length === 1) return clamp(scores[0], 0, 100)

  const deviation = standardDeviation(scores)
  const stabilityScore = clamp(100 - deviation * 2, 0, 100)
  const meanScore = clamp(average(scores), 0, 100)

  return clamp(stabilityScore * 0.7 + meanScore * 0.3, 0, 100)
}

export function calculateImprovementDelta(currentScore: number, previousScores: number[]) {
  if (previousScores.length === 0) {
    return 50
  }

  const previousAverage = average(previousScores)
  const base = Math.max(1, previousAverage)
  const growthPercent = ((currentScore - previousAverage) / base) * 100

  let improvementScore = 50 + growthPercent * 2

  if (growthPercent > 10) {
    const bonus = 10 + (growthPercent - 10) * 0.6
    improvementScore += bonus
  }

  return clamp(improvementScore, 0, 100)
}

export function calculateRankScore(input: {
  accuracy: number
  speedEfficiency: number
  consistencyScore: number
  engagementScore: number
  focusConsistency: number
  dailyCompletionRate: number
  inactivityDays: number
  difficultyMultiplier: number
  improvementDelta: number
}) {
  const normalizedDifficulty = normalizeDifficulty(input.difficultyMultiplier)
  const activityDecay = calculateActivityDecay(input.inactivityDays)

  const weightedBase =
    input.accuracy * 0.3 +
    input.speedEfficiency * 0.15 +
    input.consistencyScore * 0.17 +
    normalizedDifficulty * 0.1 +
    input.improvementDelta * 0.1 +
    input.engagementScore * 0.08 +
    input.focusConsistency * 0.06 +
    input.dailyCompletionRate * 0.04

  return clamp(weightedBase * activityDecay, 0, 100)
}

export function resolveDivision(rankScore: number): DivisionTier {
  const boundedScore = clamp(rankScore, 0, 100)
  const resolved = DIVISION_THRESHOLDS.find(
    (division) => boundedScore >= division.min && boundedScore < division.maxExclusive,
  )

  return resolved?.tier ?? 'BRONZE'
}

export function getDivisionLabel(division: DivisionTier) {
  if (division === 'BRONZE') return 'Bronze'
  if (division === 'SILVER') return 'Silver'
  if (division === 'GOLD') return 'Gold'
  if (division === 'PLATINUM') return 'Platinum'
  return 'Elite'
}

function getCacheKey(period: PeriodInput, category?: TestCategory) {
  return `${period}:${category ?? 'ALL'}`
}

function withCurrentUserContext(
  rows: LeaderboardRowCore[],
  currentUserId?: string,
) {
  return rows.map((row) => ({
    ...row,
    isCurrentUser: row.userId === currentUserId,
  }))
}

function resolveWeeklyPremiumWinner(period: PeriodInput, rows: LeaderboardRowCore[]) {
  if (period !== 'week' || rows.length === 0) return null
  const top =
    rows.find((row) => row.testsCompleted >= 2 && row.integrityScore >= 85) ??
    rows.find((row) => row.testsCompleted >= 1) ??
    rows[0]

  if (!top) return null

  return {
    userId: top.userId,
    fullName: top.fullName,
    rankingScore: top.rankingScore,
    testsCompleted: top.testsCompleted,
  }
}

function resolveWeeklyPerformanceBoard(period: PeriodInput, rows: LeaderboardRowCore[]) {
  if (period !== 'week' || rows.length === 0) return []
  return rows
    .filter((row) => row.testsCompleted >= 2 && row.integrityScore >= 80)
    .slice(0, 5)
}

function resolveAntiCheatRules() {
  return [
    'Ranking is the sum of XP earned across all tests — higher scores on harder tests rank higher.',
    'Only one validated attempt per test counts in each leaderboard period — repeats are discarded.',
    'XP per attempt = max XP for the difficulty × (score%)² + small streak/perfect bonuses.',
    'Difficulty caps: Easy 40 XP · Medium 70 XP · Hard 100 XP.',
    'Ties are broken first by average accuracy, then by attempts completed.',
  ]
}

function readCache(period: PeriodInput, category?: TestCategory) {
  const key = getCacheKey(period, category)
  const cached = leaderboardCache.get(key)
  if (!cached) return null

  if (cached.expiresAt <= Date.now()) {
    leaderboardCache.delete(key)
    return null
  }

  return cached.payload
}

function writeCache(period: PeriodInput, category: TestCategory | undefined, payload: LeaderboardCacheEntry['payload']) {
  const key = getCacheKey(period, category)
  leaderboardCache.set(key, {
    expiresAt: Date.now() + LEADERBOARD_CACHE_TTL_MS,
    payload,
  })
}

export function invalidateLeaderboardCache() {
  leaderboardCache.clear()
}

function buildUserAggregates(params: {
  attempts: UserAttemptSnapshot[]
  period: PeriodInput
  useCanonicalXp: boolean
  usersById: Map<string, { fullName: string; nickname?: string | null; avatarUrl: string | null; xp: number; currentStreak: number }>
  focusStatsByUser: Map<string, { focusConsistency: number; dailyCompletionRate: number }>
}) {
  const attemptsByUser = new Map<string, UserAttemptSnapshot[]>()

  for (const attempt of params.attempts) {
    const existing = attemptsByUser.get(attempt.userId)
    if (existing) {
      existing.push(attempt)
      continue
    }
    attemptsByUser.set(attempt.userId, [attempt])
  }

  const rows: UserAggregateRow[] = []

  for (const [userId, userAttempts] of attemptsByUser.entries()) {
    const user = params.usersById.get(userId)
    if (!user || userAttempts.length === 0) continue

    userAttempts.sort((left, right) => left.completedAt.getTime() - right.completedAt.getTime())
    const seenTests = new Set<string>()
    const validatedAttempts: UserAttemptSnapshot[] = []
    let discardedAttempts = 0

    for (const attempt of userAttempts) {
      if (seenTests.has(attempt.testId)) {
        discardedAttempts += 1
        continue
      }

      seenTests.add(attempt.testId)
      validatedAttempts.push(attempt)
    }

    if (validatedAttempts.length === 0) continue

    const lastAttemptAt =
      validatedAttempts[validatedAttempts.length - 1]?.completedAt ?? validatedAttempts[0].completedAt
    const inactivityDays = fullDaysBetween(new Date(), lastAttemptAt)
    const inactivityPenalty = calculateInactivityPenalty(inactivityDays)
    const activityDecay = calculateActivityDecay(inactivityDays)
    const focusStats = params.focusStatsByUser.get(userId) ?? {
      focusConsistency: 50,
      dailyCompletionRate: 0,
    }
    const engagementScore = calculateEngagementScore({
      testsCompleted: validatedAttempts.length,
      streak: user.currentStreak,
      period: params.period,
    })

    const rollingScores: number[] = []

    let accuracyTotal = 0
    let speedTotal = 0
    let consistencyTotal = 0
    let improvementTotal = 0
    let difficultyTotal = 0
    // Period/category boards use XP earned by their matching test attempts.
    // The all-time board uses User.xp, the same canonical total shown on every
    // profile and dashboard.
    let xpTotal = 0

    for (let index = 0; index < validatedAttempts.length; index += 1) {
      const attempt = validatedAttempts[index]
      const previousFiveScores = rollingScores.slice(-5)
      const consistencyWindow = [...rollingScores.slice(-4), attempt.finalScore]

      const accuracy = clamp(attempt.percentage, 0, 100)
      const speedEfficiency = calculateSpeedEfficiency(attempt.test.durationSec, attempt.timeSpentSec)
      const consistencyScore = calculateConsistencyScore(consistencyWindow)
      const improvementDelta = calculateImprovementDelta(attempt.finalScore, previousFiveScores)
      const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[attempt.test.difficulty]
      accuracyTotal += accuracy
      speedTotal += speedEfficiency
      consistencyTotal += consistencyScore
      improvementTotal += improvementDelta
      difficultyTotal += difficultyMultiplier
      xpTotal += Math.max(0, attempt.xpEarned)

      rollingScores.push(attempt.finalScore)
    }

    if (params.useCanonicalXp) xpTotal = Math.max(0, user.xp)

    const testsCompleted = validatedAttempts.length
    const integrityScore = clamp((testsCompleted / Math.max(1, userAttempts.length)) * 100, 0, 100)
    // Ranking is now driven by pure earned XP. The integrity score still feeds
    // the breakdown drawer so reviewers can audit a row, but it no longer
    // multiplies the visible ranking number.
    const rankingScore = xpTotal
    const avgAccuracy = accuracyTotal / testsCompleted
    const avgSpeed = speedTotal / testsCompleted
    const avgConsistency = consistencyTotal / testsCompleted
    const avgImprovement = improvementTotal / testsCompleted
    const avgDifficulty = difficultyTotal / testsCompleted
    const avgEngagement = engagementScore
    const division = resolveDivision(avgAccuracy)

    rows.push({
      userId,
      fullName: user.nickname ?? user.fullName,
      avatarUrl: user.avatarUrl,
      totalXp: Math.round(xpTotal),
      testsCompleted,
      accuracy: Number(avgAccuracy.toFixed(2)),
      streak: user.currentStreak,
      rankingScore: Number(rankingScore.toFixed(2)),
      division,
      uniqueTests: seenTests.size,
      validatedAttempts: testsCompleted,
      discardedAttempts,
      integrityScore: Number(integrityScore.toFixed(2)),
      speedEfficiency: Number(avgSpeed.toFixed(2)),
      consistencyScore: Number(avgConsistency.toFixed(2)),
      focusConsistency: Number(focusStats.focusConsistency.toFixed(2)),
      dailyCompletionRate: Number(focusStats.dailyCompletionRate.toFixed(2)),
      improvementDelta: Number(avgImprovement.toFixed(2)),
      difficultyMultiplier: Number(avgDifficulty.toFixed(2)),
      breakdown: {
        accuracy: Number(avgAccuracy.toFixed(2)),
        speedEfficiency: Number(avgSpeed.toFixed(2)),
        consistencyScore: Number(avgConsistency.toFixed(2)),
        engagementScore: Number(avgEngagement.toFixed(2)),
        focusConsistency: Number(focusStats.focusConsistency.toFixed(2)),
        dailyCompletionRate: Number(focusStats.dailyCompletionRate.toFixed(2)),
        inactivityDays,
        inactivityPenalty: Number(inactivityPenalty.toFixed(2)),
        activityDecay: Number((activityDecay * 100).toFixed(2)),
        difficultyMultiplier: Number(avgDifficulty.toFixed(2)),
        normalizedDifficulty: Number(normalizeDifficulty(avgDifficulty).toFixed(2)),
        improvementDelta: Number(avgImprovement.toFixed(2)),
        validatedAttempts: testsCompleted,
        discardedAttempts,
        integrityScore: Number(integrityScore.toFixed(2)),
        rankScore: Number(rankingScore.toFixed(2)),
      },
    })
  }

  // Pure XP ranking — user request. Ties broken by accuracy then attempts.
  rows.sort((left, right) => {
    if (right.totalXp !== left.totalXp) return right.totalXp - left.totalXp
    if (right.accuracy !== left.accuracy) return right.accuracy - left.accuracy
    return right.testsCompleted - left.testsCompleted
  })

  return rows
}

export async function generateLeaderboard(params: {
  period: PeriodInput
  category?: TestCategory
  currentUserId?: string
}) {
  const cached = readCache(params.period, params.category)
  if (cached) {
    const rows = withCurrentUserContext(cached.rows, params.currentUserId)
    const weeklyPerformanceBoard = withCurrentUserContext(
      cached.weeklyPerformanceBoard,
      params.currentUserId,
    )
    const currentUserEntry = rows.find((row) => row.userId === params.currentUserId) ?? null

    return {
      period: cached.period,
      category: cached.category,
      weeklyPremiumWinner: cached.weeklyPremiumWinner,
      weeklyPerformanceBoard,
      antiCheatRules: cached.antiCheatRules,
      rows,
      currentUserRank: currentUserEntry?.rank ?? null,
    }
  }

  const startDate = getPeriodStart(params.period)
  const categoryFilter = params.category

  const where: Prisma.TestAttemptWhereInput = {
    ...(startDate ? { completedAt: { gte: startDate } } : {}),
    ...(categoryFilter ? { test: { category: categoryFilter } } : {}),
  }

  const attempts = await prisma.testAttempt.findMany({
    where,
    orderBy: [{ userId: 'asc' }, { completedAt: 'asc' }],
    select: {
      userId: true,
      percentage: true,
      finalScore: true,
      timeSpentSec: true,
      xpEarned: true,
      testId: true,
      totalQuestions: true,
      correctAnswers: true,
      completedAt: true,
      test: {
        select: {
          difficulty: true,
          durationSec: true,
        },
      },
    },
  })

  if (attempts.length === 0) {
    return {
      period: params.period,
      category: params.category ?? null,
      weeklyPremiumWinner: null,
      weeklyPerformanceBoard: [],
      antiCheatRules: resolveAntiCheatRules(),
      rows: [],
      currentUserRank: null,
    }
  }

  const userIds = [...new Set(attempts.map((attempt) => attempt.userId))]

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      avatarUrl: true,
      xp: true,
      currentStreak: true,
    },
  })

  const userMap = new Map(users.map((user) => [user.id, user]))
  const focusWindowStart = addUtcDays(startOfUtcDay(new Date()), -13)
  const focusRows = await prisma.focusDailyAnalytics.findMany({
    where: {
      userId: { in: userIds },
      activityDate: { gte: focusWindowStart },
    },
    select: {
      userId: true,
      completionRate: true,
      focusConsistency: true,
    },
  })

  const focusBuckets = new Map<string, Array<{ completionRate: number; focusConsistency: number }>>()
  for (const row of focusRows) {
    const existing = focusBuckets.get(row.userId) ?? []
    existing.push({
      completionRate: row.completionRate,
      focusConsistency: row.focusConsistency,
    })
    focusBuckets.set(row.userId, existing)
  }

  const focusStatsByUser = new Map<string, { focusConsistency: number; dailyCompletionRate: number }>()
  for (const userId of userIds) {
    const bucket = focusBuckets.get(userId) ?? []
    focusStatsByUser.set(userId, {
      focusConsistency: bucket.length > 0 ? average(bucket.map((item) => item.focusConsistency)) : 50,
      dailyCompletionRate: bucket.length > 0 ? average(bucket.map((item) => item.completionRate)) : 0,
    })
  }

  const aggregatedRows = buildUserAggregates({
    attempts: attempts as UserAttemptSnapshot[],
    period: params.period,
    useCanonicalXp: params.period === 'all' && !params.category,
    usersById: userMap,
    focusStatsByUser,
  })

  const periodEnum = toPeriodEnum(params.period)
  const categoryKey = params.category ?? 'ALL'

  const existingStates = await prisma.leaderboardState.findMany({
    where: {
      period: periodEnum,
      categoryKey,
      userId: { in: aggregatedRows.map((row) => row.userId) },
    },
    select: {
      userId: true,
      rank: true,
    },
  })

  const previousRankMap = new Map(existingStates.map((state) => [state.userId, state.rank]))

  await prisma.$transaction(
    aggregatedRows.map((row, index) => {
      const nextRank = index + 1
      const previousRank = previousRankMap.get(row.userId)

      return prisma.leaderboardState.upsert({
        where: {
          userId_period_categoryKey: {
            userId: row.userId,
            period: periodEnum,
            categoryKey,
          },
        },
        update: {
          previousRank,
          rank: nextRank,
          score: row.rankingScore,
        },
        create: {
          userId: row.userId,
          period: periodEnum,
          categoryKey,
          previousRank,
          rank: nextRank,
          score: row.rankingScore,
        },
      })
    }),
  )

  const stableRows: LeaderboardRowCore[] = aggregatedRows.map((row, index) => {
    const rank = index + 1
    const previousRank = previousRankMap.get(row.userId) ?? rank
    const rankDelta = previousRank - rank

    return {
      rank,
      previousRank,
      rankDelta,
      rankTrend: rankDelta > 0 ? 'up' : rankDelta < 0 ? 'down' : 'same',
      userId: row.userId,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      totalXp: row.totalXp,
      testsCompleted: row.testsCompleted,
      accuracy: row.accuracy,
      streak: row.streak,
      rankingScore: row.rankingScore,
      division: row.division,
      divisionLabel: getDivisionLabel(row.division),
      uniqueTests: row.uniqueTests,
      validatedAttempts: row.validatedAttempts,
      discardedAttempts: row.discardedAttempts,
      integrityScore: row.integrityScore,
      speedEfficiency: row.speedEfficiency,
      consistencyScore: row.consistencyScore,
      focusConsistency: row.focusConsistency,
      dailyCompletionRate: row.dailyCompletionRate,
      improvementDelta: row.improvementDelta,
      difficultyMultiplier: row.difficultyMultiplier,
      breakdown: row.breakdown,
    }
  })

  const cachePayload: LeaderboardCacheEntry['payload'] = {
    period: params.period,
    category: params.category ?? null,
    weeklyPremiumWinner: resolveWeeklyPremiumWinner(params.period, stableRows),
    weeklyPerformanceBoard: resolveWeeklyPerformanceBoard(params.period, stableRows),
    antiCheatRules: resolveAntiCheatRules(),
    rows: stableRows,
  }

  writeCache(params.period, params.category, cachePayload)

  const rows = withCurrentUserContext(stableRows, params.currentUserId)
  const currentUserEntry = rows.find((entry) => entry.userId === params.currentUserId) ?? null

  return {
    period: params.period,
    category: params.category ?? null,
    weeklyPremiumWinner: cachePayload.weeklyPremiumWinner,
    weeklyPerformanceBoard: withCurrentUserContext(
      cachePayload.weeklyPerformanceBoard,
      params.currentUserId,
    ),
    antiCheatRules: cachePayload.antiCheatRules,
    rows,
    currentUserRank: currentUserEntry?.rank ?? null,
  }
}
