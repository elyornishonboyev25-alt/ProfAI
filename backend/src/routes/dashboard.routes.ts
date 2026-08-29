import { TestCategory } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { addUtcDays } from '../utils/date.js'
import { generateLeaderboard } from '../services/leaderboard.service.js'
import { getLearningStreakSnapshot, normalizeTimeZone } from '../services/activityStreak.service.js'
import { localDateKey } from '../services/xpRewards.service.js'

const router = Router()

function buildSevenDayKeys(now: Date, timeZone: string) {
  const [year, month, day] = localDateKey(now, timeZone).split('-').map(Number)
  const today = new Date(Date.UTC(year, month - 1, day, 12))
  return Array.from({ length: 7 }, (_, index) => localDateKey(addUtcDays(today, index - 6), 'UTC'))
}

function formatDayLabel(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
}

router.get(
  '/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const now = new Date()

    const [user, attemptAggregate, attemptsCount, recentAttempts, notifications, latestJourneyPlan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          profile: {
            select: {
              targetExam: true,
              currentIeltsScore: true,
              targetIeltsScore: true,
              currentSatScore: true,
              targetSatScore: true,
              timezone: true,
            },
          },
        },
      }),
      prisma.testAttempt.aggregate({
        where: { userId },
        _avg: { finalScore: true },
      }),
      prisma.testAttempt.count({ where: { userId } }),
      prisma.testAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          finalScore: true,
          xpEarned: true,
          completedAt: true,
          test: {
            select: {
              title: true,
              category: true,
            },
          },
        },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          createdAt: true,
        },
      }),
      prisma.guestDiagnostic.findFirst({
        where: {
          claimedById: userId,
          status: 'CLAIMED',
        },
        orderBy: [{ claimedAt: 'desc' }, { completedAt: 'desc' }],
        select: {
          id: true,
          answers: true,
          result: true,
          completedAt: true,
          claimedAt: true,
          updatedAt: true,
        },
      }),
    ])

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const [leaderboard, learningStreak] = await Promise.all([
      generateLeaderboard({
        period: 'all',
        currentUserId: userId,
      }),
      getLearningStreakSnapshot(prisma, userId, user.profile?.timezone, now),
    ])

    const miniLeaderboard = leaderboard.rows.slice(0, 5)

    const attemptsByCategory = await prisma.testAttempt.findMany({
      where: { userId },
      select: {
        percentage: true,
        test: { select: { category: true } },
      },
    })

    const categoryStats = new Map<TestCategory, { sum: number; count: number }>()
    for (const entry of attemptsByCategory) {
      const previous = categoryStats.get(entry.test.category) ?? { sum: 0, count: 0 }
      categoryStats.set(entry.test.category, {
        sum: previous.sum + entry.percentage,
        count: previous.count + 1,
      })
    }

    const weakestCategory = [...categoryStats.entries()]
      .map(([category, stats]) => ({
        category,
        avg: stats.sum / stats.count,
      }))
      .sort((left, right) => left.avg - right.avg)[0]?.category

    const recommendedTests = await prisma.test.findMany({
      where: {
        published: true,
        ...(weakestCategory ? { category: weakestCategory } : {}),
      },
      take: 6,
      orderBy: [{ premium: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        difficulty: true,
        category: true,
        durationSec: true,
        premium: true,
        xpReward: true,
      },
    })

    const timeZone = normalizeTimeZone(user.profile?.timezone)
    const sevenDays = buildSevenDayKeys(now, timeZone)
    const broadWindowStart = addUtcDays(now, -8)
    const broadWindowEnd = addUtcDays(now, 1)
    const [weeklyAttempts, weeklyXpEvents] = await Promise.all([
      prisma.testAttempt.findMany({
        where: {
          userId,
          completedAt: {
            gte: broadWindowStart,
            lt: broadWindowEnd,
          },
        },
        select: {
          completedAt: true,
          timeSpentSec: true,
          totalQuestions: true,
        },
      }),
      prisma.xpEvent.findMany({
        where: { userId, earnedAt: { gte: broadWindowStart, lt: broadWindowEnd }, amount: { gt: 0 } },
        select: { earnedAt: true, source: true, metadata: true },
      }),
    ])

    const activityMap = new Map<string, { testsCompleted: number; questionsAnswered: number; studyTimeSec: number }>()
    for (const attempt of weeklyAttempts) {
      const key = localDateKey(attempt.completedAt, timeZone)
      if (!sevenDays.includes(key)) continue
      const previous = activityMap.get(key) ?? { testsCompleted: 0, questionsAnswered: 0, studyTimeSec: 0 }
      activityMap.set(key, {
        testsCompleted: previous.testsCompleted + 1,
        questionsAnswered: previous.questionsAnswered + attempt.totalQuestions,
        studyTimeSec: previous.studyTimeSec + attempt.timeSpentSec,
      })
    }

    for (const event of weeklyXpEvents) {
      const key = localDateKey(event.earnedAt, timeZone)
      if (!sevenDays.includes(key)) continue
      const previous = activityMap.get(key) ?? { testsCompleted: 0, questionsAnswered: 0, studyTimeSec: 0 }
      const metadata = event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
        ? event.metadata as Record<string, unknown>
        : null
      const activeMinutes = event.source.startsWith('STUDY_') && typeof metadata?.activeMinutes === 'number'
        ? Math.max(0, Math.min(60, metadata.activeMinutes))
        : 0
      activityMap.set(key, { ...previous, studyTimeSec: previous.studyTimeSec + Math.round(activeMinutes * 60) })
    }

    const weeklyProgress = sevenDays.map((key) => {
      const activity = activityMap.get(key)
      const hasXpActivity = weeklyXpEvents.some((event) => localDateKey(event.earnedAt, timeZone) === key)

      return {
        date: `${key}T00:00:00.000Z`,
        label: formatDayLabel(key),
        testsCompleted: activity?.testsCompleted ?? 0,
        questionsAnswered: activity?.questionsAnswered ?? 0,
        studyTimeSec: activity?.studyTimeSec ?? 0,
        active: Boolean((activity?.testsCompleted ?? 0) > 0 || hasXpActivity),
      }
    })

    const weeklyStudySeconds = weeklyProgress.reduce((total, day) => total + day.studyTimeSec, 0)
    const activityTimeline = [
      ...recentAttempts.map((attempt) => ({
        id: `attempt_${attempt.id}`,
        type: 'attempt',
        title: `Completed ${attempt.test.title}`,
        description: `Score ${attempt.finalScore.toFixed(1)}% • +${attempt.xpEarned} XP`,
        date: attempt.completedAt,
      })),
      ...notifications.map((notification) => ({
        id: `notification_${notification.id}`,
        type: 'notification',
        title: notification.title,
        description: notification.message,
        date: notification.createdAt,
      })),
    ]
      .sort((left, right) => right.date.getTime() - left.date.getTime())
      .slice(0, 10)

    return res.json({
      metrics: {
        totalTests: attemptsCount,
        averageScore: Number((attemptAggregate._avg.finalScore ?? 0).toFixed(2)),
        weeklyStudySeconds,
        currentRank: leaderboard.currentUserRank,
        currentStreak: learningStreak.currentStreak,
      },
      weeklyProgress,
      recommendedTests,
      activityTimeline,
      miniLeaderboard,
      targets: {
        targetExam: user.profile?.targetExam === 'IELTS' || user.profile?.targetExam === 'SAT' || user.profile?.targetExam === 'BOTH'
          ? user.profile.targetExam
          : null,
        currentIeltsScore: user.profile?.currentIeltsScore ?? null,
        targetIeltsScore: user.profile?.targetIeltsScore ?? null,
        currentSatScore: user.profile?.currentSatScore ?? null,
        targetSatScore: user.profile?.targetSatScore ?? null,
      },
      journeyPlan: latestJourneyPlan
        ? {
            id: latestJourneyPlan.id,
            answers: latestJourneyPlan.answers,
            result: latestJourneyPlan.result,
            completedAt: latestJourneyPlan.completedAt,
            claimedAt: latestJourneyPlan.claimedAt,
            updatedAt: latestJourneyPlan.updatedAt,
          }
        : null,
    })
  }),
)

router.get(
  '/notifications',
  requireAuth,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        metadata: true,
        readAt: true,
        createdAt: true,
      },
    })

    return res.json({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.readAt).length,
    })
  }),
)

router.patch(
  '/notifications/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    })
    return res.json({ success: true })
  }),
)

router.patch(
  '/notifications/:notificationId/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { id: String(req.params.notificationId), userId: req.user!.id },
      select: { id: true },
    })
    if (!notification) return res.status(404).json({ message: 'Notification not found.' })

    await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    })
    return res.json({ success: true })
  }),
)

export default router
