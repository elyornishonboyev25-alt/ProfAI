import { TestCategory } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { addUtcDays, startOfUtcDay } from '../utils/date.js'
import { generateLeaderboard } from '../services/leaderboard.service.js'

const router = Router()

function buildSevenDayWindow(now: Date) {
  const days = [] as Date[]
  const start = addUtcDays(startOfUtcDay(now), -6)

  for (let index = 0; index < 7; index += 1) {
    days.push(addUtcDays(start, index))
  }

  return days
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

router.get(
  '/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const now = new Date()

    const [user, attemptAggregate, attemptsCount, recentAttempts, notifications] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
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
    ])

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    const leaderboard = await generateLeaderboard({
      period: 'all',
      currentUserId: userId,
    })

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

    const sevenDays = buildSevenDayWindow(now)
    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId,
        activityDate: {
          gte: sevenDays[0],
          lte: sevenDays[6],
        },
      },
      select: {
        activityDate: true,
        testsCompleted: true,
        questionsAnswered: true,
      },
    })

    const activityMap = new Map(activities.map((activity) => [startOfUtcDay(activity.activityDate).toISOString(), activity]))

    const weeklyProgress = sevenDays.map((day) => {
      const key = startOfUtcDay(day).toISOString()
      const activity = activityMap.get(key)

      return {
        date: key,
        label: formatDayLabel(day),
        testsCompleted: activity?.testsCompleted ?? 0,
        questionsAnswered: activity?.questionsAnswered ?? 0,
        active: Boolean((activity?.testsCompleted ?? 0) > 0),
      }
    })

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
        currentRank: leaderboard.currentUserRank,
        currentStreak: user.currentStreak,
      },
      weeklyProgress,
      recommendedTests,
      activityTimeline,
      miniLeaderboard,
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
