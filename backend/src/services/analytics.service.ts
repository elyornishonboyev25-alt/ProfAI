import { onAccountDeleted } from './accountLifecycle.js'
import { TestCategory } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { calculateConsistencyScore, calculateSpeedEfficiency } from './leaderboard.service.js'

type AnalyticsInsightType = 'warning' | 'tip' | 'success'

type RadarMetric = {
  category: TestCategory
  label: string
  attempts: number
  accuracy: number
  speed: number
  consistency: number
  skillPower: number
}

type DistributionPoint = {
  score: number
  density: number
}

type MomentumPoint = {
  label: string
  xp: number
  score: number
  accuracy: number
}

type AnalyticsInsight = {
  id: string
  type: AnalyticsInsightType
  title: string
  message: string
}

type TrackSkillKey =
  | 'IELTS_READING'
  | 'IELTS_LISTENING'
  | 'IELTS_WRITING'
  | 'IELTS_SPEAKING'
  | 'SAT_MATH'
  | 'SAT_READING_WRITING'

type TrackSkillMetric = {
  key: TrackSkillKey
  label: string
  group: 'IELTS' | 'SAT'
  attempts: number
  accuracy: number
  speed: number
  consistency: number
  skillPower: number
}

export type SkillAnalyticsPayload = {
  overall: {
    skillPower: number
    percentile: number
    projectedSatScore: number
    projectedPercentScore: number
    growthRate: number
    totalUsers: number
  }
  radar: RadarMetric[]
  trackBreakdown: TrackSkillMetric[]
  distribution: {
    mean: number
    standardDeviation: number
    userSkillPower: number
    curve: DistributionPoint[]
  }
  xpMomentum: MomentumPoint[]
  insights: AnalyticsInsight[]
}

type AttemptSnapshot = {
  userId: string
  percentage: number
  finalScore: number
  timeSpentSec: number
  xpEarned: number
  completedAt: Date
  test: {
    category: TestCategory
    durationSec: number
    subjects: string[]
  }
}

type SkillBuckets = {
  accuracyValues: number[]
  speedValues: number[]
  scoreValues: number[]
}

type TrackSkillDefinition = {
  key: TrackSkillKey
  label: string
  group: 'IELTS' | 'SAT'
  matcher: (attempt: AttemptSnapshot) => boolean
}

const ANALYTICS_CACHE_TTL_MS = 60_000

const analyticsCache = new Map<string, { expiresAt: number; payload: SkillAnalyticsPayload }>()
onAccountDeleted((userId) => { analyticsCache.delete(userId) })

const TRACKED_CATEGORIES: TestCategory[] = ['SAT', 'IELTS']

const TRACK_SKILL_DEFINITIONS: TrackSkillDefinition[] = [
  {
    key: 'IELTS_READING',
    label: 'IELTS Reading',
    group: 'IELTS',
    matcher: (attempt) =>
      attempt.test.category === 'IELTS' && subjectIncludes(attempt.test.subjects, ['reading', 'passage', 'comprehension']),
  },
  {
    key: 'IELTS_LISTENING',
    label: 'IELTS Listening',
    group: 'IELTS',
    matcher: (attempt) =>
      attempt.test.category === 'IELTS' && subjectIncludes(attempt.test.subjects, ['listening', 'audio']),
  },
  {
    key: 'IELTS_WRITING',
    label: 'IELTS Writing',
    group: 'IELTS',
    matcher: (attempt) =>
      attempt.test.category === 'IELTS' && subjectIncludes(attempt.test.subjects, ['writing', 'essay', 'task']),
  },
  {
    key: 'IELTS_SPEAKING',
    label: 'IELTS Speaking',
    group: 'IELTS',
    matcher: (attempt) =>
      attempt.test.category === 'IELTS' && subjectIncludes(attempt.test.subjects, ['speaking', 'oral', 'pronunciation']),
  },
  {
    key: 'SAT_MATH',
    label: 'SAT Math',
    group: 'SAT',
    matcher: (attempt) =>
      attempt.test.category === 'SAT' && subjectIncludes(attempt.test.subjects, ['math', 'algebra', 'geometry', 'problem solving', 'quant']),
  },
  {
    key: 'SAT_READING_WRITING',
    label: 'SAT Reading/Writing',
    group: 'SAT',
    matcher: (attempt) =>
      attempt.test.category === 'SAT' &&
      (subjectIncludes(attempt.test.subjects, ['reading', 'writing', 'grammar', 'english', 'verbal', 'critical'])
        || !subjectIncludes(attempt.test.subjects, ['math', 'algebra', 'geometry', 'problem solving', 'quant'])),
  },
]

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

function gaussianDensity(score: number, mean: number, standardDeviationValue: number) {
  const safeStd = Math.max(1, standardDeviationValue)
  const exponent = -((score - mean) ** 2) / (2 * safeStd * safeStd)
  return (1 / (safeStd * Math.sqrt(2 * Math.PI))) * Math.exp(exponent)
}

function categoryLabel(category: TestCategory) {
  if (category === 'SAT') return 'SAT'
  return 'IELTS'
}

function toSatScale(percentScore: number) {
  const bounded = clamp(percentScore, 0, 100)
  return Math.round(400 + bounded * 12)
}

function normalizeSubjects(subjects: string[]) {
  return subjects.map((subject) => subject.toLowerCase())
}

function subjectIncludes(subjects: string[], keywords: string[]) {
  const normalized = normalizeSubjects(subjects)
  return normalized.some((subject) => keywords.some((keyword) => subject.includes(keyword)))
}

export function invalidateSkillAnalyticsCache(userId?: string) {
  if (userId) {
    analyticsCache.delete(userId)
    return
  }

  analyticsCache.clear()
}

export function calculateSkillPower(params: { accuracy: number; speed: number; consistency: number }) {
  return clamp(params.accuracy * 0.6 + params.speed * 0.2 + params.consistency * 0.2, 0, 100)
}

function buildBuckets() {
  const buckets = new Map<TestCategory, SkillBuckets>()

  for (const category of TRACKED_CATEGORIES) {
    buckets.set(category, {
      accuracyValues: [],
      speedValues: [],
      scoreValues: [],
    })
  }

  return buckets
}

function linearRegressionProjection(scores: number[]) {
  if (scores.length === 0) {
    return {
      projected: 0,
      growthRate: 0,
    }
  }

  if (scores.length === 1) {
    return {
      projected: scores[0],
      growthRate: 0,
    }
  }

  const n = scores.length
  const indices = Array.from({ length: n }, (_, index) => index)

  const sumX = indices.reduce((sum, index) => sum + index, 0)
  const sumY = scores.reduce((sum, value) => sum + value, 0)
  const sumXY = indices.reduce((sum, index) => sum + index * scores[index], 0)
  const sumX2 = indices.reduce((sum, index) => sum + index * index, 0)

  const denominator = n * sumX2 - sumX * sumX
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  const projectedIndex = n - 1 + 4
  const projected = intercept + slope * projectedIndex

  return {
    projected,
    growthRate: slope,
  }
}

function computeUserSkillPower(attempts: AttemptSnapshot[]) {
  if (attempts.length === 0) return 0

  const accuracy = average(attempts.map((attempt) => attempt.percentage))
  const speed = average(attempts.map((attempt) => calculateSpeedEfficiency(attempt.test.durationSec, attempt.timeSpentSec)))
  const consistency = calculateConsistencyScore(attempts.map((attempt) => attempt.finalScore))

  return Number(calculateSkillPower({ accuracy, speed, consistency }).toFixed(2))
}

function aggregateSkillAttempts(skillAttempts: AttemptSnapshot[]) {
  const attempts = skillAttempts.length
  const accuracy = average(skillAttempts.map((attempt) => attempt.percentage))
  const speed = average(skillAttempts.map((attempt) => calculateSpeedEfficiency(attempt.test.durationSec, attempt.timeSpentSec)))
  const consistency = calculateConsistencyScore(skillAttempts.map((attempt) => attempt.finalScore))
  const skillPower = calculateSkillPower({ accuracy, speed, consistency })

  return {
    attempts,
    accuracy: Number(accuracy.toFixed(2)),
    speed: Number(speed.toFixed(2)),
    consistency: Number(consistency.toFixed(2)),
    skillPower: Number(skillPower.toFixed(2)),
  }
}

function buildTrackBreakdown(attempts: AttemptSnapshot[]): TrackSkillMetric[] {
  return TRACK_SKILL_DEFINITIONS.map((definition) => {
    const skillAttempts = attempts.filter((attempt) => definition.matcher(attempt))
    const aggregated = aggregateSkillAttempts(skillAttempts)

    return {
      key: definition.key,
      label: definition.label,
      group: definition.group,
      ...aggregated,
    }
  })
}

function buildInsights(params: {
  trackBreakdown: TrackSkillMetric[]
  recentAttempts: AttemptSnapshot[]
  growthRate: number
  overallDeviation: number
}): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = []

  const lowAccuracyCategories = params.trackBreakdown.filter((metric) => metric.attempts >= 2 && metric.accuracy < 60)
  for (const metric of lowAccuracyCategories.slice(0, 2)) {
    insights.push({
      id: `low_accuracy_${metric.key.toLowerCase()}`,
      type: 'warning',
      title: `${metric.label} accuracy is below target`,
      message: `Your ${metric.label} accuracy is ${metric.accuracy.toFixed(1)}%. Focus on timed review and error logs in this track.`,
    })
  }

  const recentSpeed = params.recentAttempts
    .slice(-3)
    .map((attempt) => calculateSpeedEfficiency(attempt.test.durationSec, attempt.timeSpentSec))

  if (
    recentSpeed.length === 3 &&
    recentSpeed[2] < recentSpeed[1] - 3 &&
    recentSpeed[1] < recentSpeed[0] - 3
  ) {
    insights.push({
      id: 'speed_downtrend',
      type: 'warning',
      title: 'Speed efficiency is trending down',
      message: 'Your last 3 attempts show slower pacing. Run one short timed drill before full tests.',
    })
  }

  if (params.overallDeviation > 14) {
    insights.push({
      id: 'high_variance',
      type: 'tip',
      title: 'Performance is inconsistent',
      message: 'Score volatility is high. Stabilize with medium-difficulty sets before switching to harder tracks.',
    })
  }

  if (params.growthRate > 1.2) {
    insights.push({
      id: 'positive_growth',
      type: 'success',
      title: 'Growth momentum detected',
      message: 'Your score trend is positive. Keep your current weekly cadence to sustain progress.',
    })
  }

  if (insights.length === 0) {
    insights.push({
      id: 'balanced_profile',
      type: 'success',
      title: 'Balanced skill profile',
      message: 'Your analytics are stable. Push one harder test per week to accelerate percentile gains.',
    })
  }

  return insights
}

export async function generateSkillAnalytics(userId: string): Promise<SkillAnalyticsPayload> {
  const cached = analyticsCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload
  }

  const [userAttemptsRaw, platformAttemptsRaw, allUsers] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: 'asc' },
      select: {
        userId: true,
        percentage: true,
        finalScore: true,
        timeSpentSec: true,
        xpEarned: true,
        completedAt: true,
        test: {
          select: {
            category: true,
            durationSec: true,
            subjects: true,
          },
        },
      },
    }),
    prisma.testAttempt.findMany({
      orderBy: { completedAt: 'asc' },
      select: {
        userId: true,
        percentage: true,
        finalScore: true,
        timeSpentSec: true,
        xpEarned: true,
        completedAt: true,
        test: {
          select: {
            category: true,
            durationSec: true,
            subjects: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true },
    }),
  ])

  const userAttempts = userAttemptsRaw as AttemptSnapshot[]
  const platformAttempts = platformAttemptsRaw as AttemptSnapshot[]

  const userBuckets = buildBuckets()

  for (const attempt of userAttempts) {
    const bucket = userBuckets.get(attempt.test.category)
    if (!bucket) continue

    bucket.accuracyValues.push(attempt.percentage)
    bucket.speedValues.push(calculateSpeedEfficiency(attempt.test.durationSec, attempt.timeSpentSec))
    bucket.scoreValues.push(attempt.finalScore)
  }

  const radar: RadarMetric[] = TRACKED_CATEGORIES.map((category) => {
    const bucket = userBuckets.get(category)
    const attempts = bucket?.scoreValues.length ?? 0
    const accuracy = average(bucket?.accuracyValues ?? [])
    const speed = average(bucket?.speedValues ?? [])
    const consistency = calculateConsistencyScore(bucket?.scoreValues ?? [])
    const skillPower = calculateSkillPower({
      accuracy,
      speed,
      consistency,
    })

    return {
      category,
      label: categoryLabel(category),
      attempts,
      accuracy: Number(accuracy.toFixed(2)),
      speed: Number(speed.toFixed(2)),
      consistency: Number(consistency.toFixed(2)),
      skillPower: Number(skillPower.toFixed(2)),
    }
  })

  const trackBreakdown = buildTrackBreakdown(userAttempts)
  const overallSkillPower = computeUserSkillPower(userAttempts)

  const platformBuckets = new Map<string, AttemptSnapshot[]>()
  for (const attempt of platformAttempts) {
    const existing = platformBuckets.get(attempt.userId)
    if (existing) {
      existing.push(attempt)
      continue
    }
    platformBuckets.set(attempt.userId, [attempt])
  }

  const platformSkillByUser = new Map<string, number>()

  for (const user of allUsers) {
    const attempts = platformBuckets.get(user.id) ?? []
    platformSkillByUser.set(user.id, computeUserSkillPower(attempts))
  }

  const platformSkillValues = [...platformSkillByUser.values()]
  const usersBelow = platformSkillValues.filter((value) => value < overallSkillPower).length
  const totalUsers = Math.max(1, platformSkillValues.length)
  const percentile = Number(((usersBelow / totalUsers) * 100).toFixed(2))

  const mean = average(platformSkillValues)
  const std = Math.max(6, standardDeviation(platformSkillValues) || 6)

  const curveRaw = Array.from({ length: 21 }, (_, index) => {
    const score = index * 5
    return {
      score,
      density: gaussianDensity(score, mean, std),
    }
  })

  const maxDensity = Math.max(...curveRaw.map((point) => point.density), 1)
  const curve: DistributionPoint[] = curveRaw.map((point) => ({
    score: point.score,
    density: Number(((point.density / maxDensity) * 100).toFixed(2)),
  }))

  const satScores = userAttempts.filter((attempt) => attempt.test.category === 'SAT').map((attempt) => attempt.finalScore)
  const projectionSeries = (satScores.length > 0 ? satScores : userAttempts.map((attempt) => attempt.finalScore)).slice(-10)
  const projection = linearRegressionProjection(projectionSeries)
  const projectedPercentScore = Number(clamp(projection.projected, 0, 100).toFixed(2))
  const projectedSatScore = toSatScale(projectedPercentScore)

  const momentumAttempts = userAttempts.slice(-10)
  let cumulativeXp = 0
  const xpMomentum: MomentumPoint[] = momentumAttempts.map((attempt, index) => {
    cumulativeXp += attempt.xpEarned

    return {
      label:
        momentumAttempts.length <= 5
          ? new Date(attempt.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : `T${index + 1}`,
      xp: cumulativeXp,
      score: Number(attempt.finalScore.toFixed(2)),
      accuracy: Number(attempt.percentage.toFixed(2)),
    }
  })

  const recentScores = userAttempts.slice(-8).map((attempt) => attempt.finalScore)
  const overallDeviation = standardDeviation(recentScores)

  const insights = buildInsights({
    trackBreakdown,
    recentAttempts: userAttempts,
    growthRate: projection.growthRate,
    overallDeviation,
  })

  const payload: SkillAnalyticsPayload = {
    overall: {
      skillPower: overallSkillPower,
      percentile,
      projectedSatScore,
      projectedPercentScore,
      growthRate: Number(projection.growthRate.toFixed(2)),
      totalUsers,
    },
    radar,
    trackBreakdown,
    distribution: {
      mean: Number(mean.toFixed(2)),
      standardDeviation: Number(std.toFixed(2)),
      userSkillPower: overallSkillPower,
      curve,
    },
    xpMomentum,
    insights,
  }

  analyticsCache.set(userId, {
    expiresAt: Date.now() + ANALYTICS_CACHE_TTL_MS,
    payload,
  })

  return payload
}
