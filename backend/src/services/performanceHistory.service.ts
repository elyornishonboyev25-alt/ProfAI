import { Difficulty, type Prisma, type TestCategory } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { assessmentCountsForLeaderboard } from './examLeaderboardEligibility.js'

export type PerformanceAttempt = {
  id: string
  userId: string
  testId: string
  finalScore: number
  percentage: number
  xpEarned: number
  timeSpentSec: number
  totalQuestions: number
  correctAnswers: number
  completedAt: Date
  assessment?: { sourceKey: string; skill: string; score: number; maxScore: number }
  test: { id: string; title: string; category: TestCategory; difficulty: Difficulty; durationSec: number; subjects: string[] }
}

// IELTS_LOCAL_TEST is deliberately excluded: full Reading/Listening results
// already live in TestAttempt, and partial sections are practice, not tests.
export const PERFORMANCE_ASSESSMENT_SOURCES = [
  'SAT_BLUEBOOK_MOCK', 'IELTS_WRITING_AI_EVALUATION', 'IELTS_WRITING_FULL_TEST', 'IELTS_SPEAKING_MOCK',
]

export async function loadAssessmentPerformanceAttempts(where: Prisma.AssessmentResultWhereInput = {}): Promise<PerformanceAttempt[]> {
  const results = await prisma.assessmentResult.findMany({
    where: { ...where, sourceType: { in: PERFORMANCE_ASSESSMENT_SOURCES } },
    select: { id: true, userId: true, sourceKey: true, title: true, skill: true, examType: true, accuracy: true, score: true, maxScore: true, durationSec: true, completedAt: true, breakdown: true },
    orderBy: { completedAt: 'asc' },
  })
  return results.flatMap((result) => {
    if (!assessmentCountsForLeaderboard(result)) return []
    // SAT scaled points are not question accuracy. IELTS bands share a 0–9
    // scale, so normalize them once for every profile, chart and ranking.
    const percentage = result.accuracy ?? (result.examType === 'IELTS' && result.maxScore > 0
      ? result.score / result.maxScore * 100 : null)
    if (percentage === null || !Number.isFinite(percentage)) return []
    const id = `assessment:${result.id}`
    const subjects = result.skill === 'SAT_OVERALL' ? ['SAT Math', 'SAT Reading Writing'] : [result.skill ?? '']
    const breakdown = result.breakdown as { total?: number; correct?: number } | null
    return [{
      id, userId: result.userId, testId: id,
      percentage: Math.min(100, Math.max(0, percentage)), finalScore: Math.min(100, Math.max(0, percentage)),
      // Assessment XP is already recorded in XpEvent. Never award or add it again.
      xpEarned: 0, timeSpentSec: result.durationSec,
      totalQuestions: Math.max(0, Number(breakdown?.total) || 0),
      correctAnswers: Math.max(0, Number(breakdown?.correct) || 0),
      completedAt: result.completedAt,
      assessment: { sourceKey: result.sourceKey, skill: result.skill, score: result.score, maxScore: result.maxScore },
      test: { id, title: result.title ?? '', category: result.examType, difficulty: Difficulty.HARD, durationSec: Math.max(1, result.durationSec), subjects },
    }]
  })
}

/** One server history for public/private profiles, dashboard and analytics. */
export async function loadPerformanceAttempts(userId?: string): Promise<PerformanceAttempt[]> {
  const [attempts, assessments] = await Promise.all([
    prisma.testAttempt.findMany({
      where: userId ? { userId } : {}, orderBy: { completedAt: 'asc' },
      select: {
        id: true, userId: true, testId: true, finalScore: true, percentage: true, xpEarned: true,
        timeSpentSec: true, totalQuestions: true, correctAnswers: true, completedAt: true,
        test: { select: { id: true, title: true, category: true, difficulty: true, durationSec: true, subjects: true } },
      },
    }),
    loadAssessmentPerformanceAttempts(userId ? { userId } : {}),
  ])
  return [...attempts, ...assessments].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
}

export function summarizePerformance(attempts: PerformanceAttempt[]) {
  const count = attempts.length
  return {
    totalAttempts: count,
    averageScore: count ? Number((attempts.reduce((sum, attempt) => sum + attempt.finalScore, 0) / count).toFixed(2)) : 0,
    averageAccuracy: count ? Number((attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / count).toFixed(2)) : 0,
    totalXpFromAttempts: attempts.reduce((sum, attempt) => sum + attempt.xpEarned, 0),
  }
}
