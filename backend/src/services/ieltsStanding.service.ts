import { prisma } from '../lib/prisma.js'

export function ieltsBandForCorrect(correct: number) {
  const bands: Array<[number, number]> = [[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[27,6.5],[23,6],[19,5.5],[15,5],[12,4.5],[9,4],[7,3.5],[5,3],[3,2.5],[1,2]]
  return bands.find(([threshold]) => correct >= threshold)?.[1] ?? 0
}

export type IeltsStandingAttempt = { userId: string; total: number; correct: number; durationSec: number; completedAt: Date }
export function assessmentBelongsToTest(entry: { sourceKey: string; breakdown: unknown }, testId: string) {
  const stored = (entry.breakdown as { testId?: string } | null)?.testId
  if (stored) return stored === testId
  const singlePrefix = `writing-${testId}-`
  const fullPrefix = `writing-full-${testId}-`
  return entry.sourceKey.startsWith(singlePrefix) && /^\d+$/.test(entry.sourceKey.slice(singlePrefix.length))
    || entry.sourceKey.startsWith(fullPrefix) && /^writing-.+-\d+$/.test(entry.sourceKey.slice(fullPrefix.length))
}
export function rankFirstIeltsAttempts(attempts: IeltsStandingAttempt[]) {
  const first = new Map<string, IeltsStandingAttempt>()
  for (const result of [...attempts].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())) {
    if (!first.has(result.userId)) first.set(result.userId, result)
  }
  return [...first.values()].sort((a, b) => b.total - a.total || a.durationSec - b.durationSec || a.completedAt.getTime() - b.completedAt.getTime())
}

export async function getIeltsStanding(testId: string, viewerId: string) {
  const normalized = testId.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 72)
  const [legacy, assessments] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { test: { category: 'IELTS', slug: { in: [`ielts-reading-sync-${normalized}`, `ielts-listening-sync-${normalized}`] } } },
      orderBy: { completedAt: 'asc' }, take: 20_000,
      select: { userId: true, correctAnswers: true, totalQuestions: true, timeSpentSec: true, completedAt: true },
    }),
    prisma.assessmentResult.findMany({
      where: { examType: 'IELTS', maxScore: 9, OR: [
        { breakdown: { path: ['testId'], equals: testId } },
        { sourceKey: { startsWith: `writing-${testId}-` } },
        { sourceKey: { startsWith: `writing-full-${testId}-` } },
      ] },
      orderBy: { completedAt: 'asc' }, take: 20_000,
      select: { userId: true, sourceKey: true, score: true, durationSec: true, completedAt: true, breakdown: true },
    }),
  ])
  const ranked = rankFirstIeltsAttempts([
    ...legacy.map(result => ({ userId: result.userId, total: ieltsBandForCorrect(result.correctAnswers), correct: result.correctAnswers, durationSec: result.timeSpentSec, completedAt: result.completedAt })),
    ...assessments.filter(result => assessmentBelongsToTest(result, testId) && (result.breakdown as { partial?: boolean; leaderboardEligible?: boolean } | null)?.partial !== true && (result.breakdown as { leaderboardEligible?: boolean } | null)?.leaderboardEligible !== false)
      .map(result => ({ userId: result.userId, total: result.score, correct: Number((result.breakdown as { correct?: number } | null)?.correct) || 0, durationSec: result.durationSec, completedAt: result.completedAt })),
  ])
  const top = ranked.slice(0, 50)
  const myIndex = ranked.findIndex(result => result.userId === viewerId)
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set([...top.map(result => result.userId), ...(myIndex >= 0 ? [viewerId] : [])])] } },
    select: { id: true, fullName: true, nickname: true, avatarUrl: true, googleAvatarUrl: true, profile: { select: { showLeaderboard: true, country: true } } },
  })
  const byId = new Map(users.map(user => [user.id, user]))
  const row = (result: IeltsStandingAttempt, index: number) => {
    const user = byId.get(result.userId)
    const isMe = result.userId === viewerId
    const visible = isMe || user?.profile?.showLeaderboard !== false
    const avatar = user?.avatarUrl ?? user?.googleAvatarUrl
    return { rank: index + 1, name: visible ? user?.fullName?.trim() || user?.nickname || 'Ivygoo learner' : 'Private learner',
      nickname: visible ? user?.nickname ?? null : null, avatarUrl: visible && avatar && avatar.length <= 200_000 ? avatar : null,
      country: visible ? user?.profile?.country ?? null : null, total: result.total, maxScore: 9, rw: null, math: null,
      correct: result.correct, durationSec: result.durationSec, completedAt: result.completedAt.toISOString(), isMe }
  }
  return { participants: ranked.length, percentiles: { total: null, rw: null, math: null },
    average: ranked.length ? Math.round(ranked.reduce((sum, result) => sum + result.total, 0) / ranked.length * 10) / 10 : null,
    rows: top.map(row), me: myIndex >= 0 ? row(ranked[myIndex], myIndex) : null }
}
