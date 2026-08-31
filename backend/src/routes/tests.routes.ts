import { Difficulty, LearningSubmissionStatus, Prisma, TestCategory } from '@prisma/client'
import { type Response, Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { calculateAttemptScore } from '../services/scoring.service.js'
import { calculateXp, resolveLevelTransition } from '../services/gamification.service.js'
import { getLearningStreakSnapshot } from '../services/activityStreak.service.js'
import { resolveUnlockedAchievements } from '../services/achievement.service.js'
import { startOfUtcDay } from '../utils/date.js'
import { invalidateLeaderboardCache } from '../services/leaderboard.service.js'
import { invalidateSkillAnalyticsCache } from '../services/analytics.service.js'
import { invalidateAiCoachCache, precomputeAiCoachReport } from '../services/aiCoach.service.js'

const router = Router()

const testListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(TestCategory).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  premium: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})

const submitAttemptSchema = z.object({
  timeSpentSec: z.coerce.number().int().min(1),
  assignmentId: z.string().min(1).max(191).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        optionId: z.string().min(1).nullable(),
      }),
    )
    .min(1),
})

const readingSyncSchema = z.object({
  externalAttemptKey: z.string().min(6).max(180),
  externalTestId: z.string().min(3).max(120),
  title: z.string().min(3).max(220),
  completedAt: z.string().optional(),
  durationSec: z.coerce.number().int().min(600).max(4 * 60 * 60).default(3600),
  timeSpentSec: z.coerce.number().int().min(60).max(4 * 60 * 60),
  totalQuestions: z.coerce.number().int().min(1).max(200),
  correctAnswers: z.coerce.number().int().min(0).max(200),
  accuracy: z.coerce.number().min(0).max(100).optional(),
  finalScore: z.coerce.number().min(0).max(100).optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.HARD),
  isPartial: z.boolean().default(false),
  subjects: z.array(z.string().min(2).max(60)).min(1).max(12).optional(),
})
const listeningSyncSchema = z.object({
  externalAttemptKey: z.string().min(6).max(180),
  externalTestId: z.string().min(3).max(120),
  title: z.string().min(3).max(220),
  completedAt: z.string().optional(),
  durationSec: z.coerce.number().int().min(600).max(4 * 60 * 60).default(1800),
  timeSpentSec: z.coerce.number().int().min(60).max(4 * 60 * 60),
  totalQuestions: z.coerce.number().int().min(1).max(200),
  correctAnswers: z.coerce.number().int().min(0).max(200),
  accuracy: z.coerce.number().min(0).max(100).optional(),
  finalScore: z.coerce.number().min(0).max(100).optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.HARD),
  isPartial: z.boolean().default(false),
  subjects: z.array(z.string().min(2).max(60)).min(1).max(12).optional(),
})

const createTestSchema = z.object({
  slug: z.string().min(3).max(120),
  title: z.string().min(3).max(180),
  description: z.string().min(12).max(3000),
  category: z.nativeEnum(TestCategory),
  difficulty: z.nativeEnum(Difficulty),
  durationSec: z.coerce.number().int().min(300).max(4 * 60 * 60),
  premium: z.boolean().default(false),
  xpReward: z.coerce.number().int().min(25).max(1000).optional(),
  subjects: z.array(z.string().min(2).max(60)).min(1).max(10),
  questions: z
    .array(
      z.object({
        text: z.string().min(5).max(2000),
        explanation: z.string().min(5).max(3000).optional(),
        weight: z.coerce.number().min(0.2).max(5).default(1),
        options: z
          .array(
            z.object({
              text: z.string().min(1).max(600),
              isCorrect: z.boolean(),
            }),
          )
          .min(2)
          .max(6)
          .refine((options) => options.filter((option) => option.isCorrect).length === 1, {
            message: 'Each question must contain exactly one correct option.',
          }),
      }),
    )
    .min(1)
    .max(120),
})

function toSafeSyncSlug(externalTestId: string, track: 'reading' | 'listening') {
  const normalized = externalTestId
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)

  const suffix = normalized || 'reading'
  return `ielts-${track}-sync-${suffix}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const LEADERBOARD_PASSAGE_MIN_TIME_SEC = 10 * 60
const LEADERBOARD_FULL_TEST_MIN_TIME_SEC = 30 * 60
const LEADERBOARD_FULL_TEST_QUESTION_THRESHOLD = 27

function resolveLeaderboardAttemptKind(input: {
  totalQuestions: number
  durationSec: number
  externalTestId?: string
}) {
  const testKey = input.externalTestId?.toLowerCase() ?? ''
  const isFullTest =
    input.totalQuestions >= LEADERBOARD_FULL_TEST_QUESTION_THRESHOLD ||
    testKey.includes('full') ||
    testKey.includes('mock')

  return isFullTest ? 'full-test' : 'passage'
}

function getMinimumLeaderboardTimeSec(input: {
  totalQuestions: number
  durationSec: number
  externalTestId?: string
}) {
  const requestedMinimum = resolveLeaderboardAttemptKind(input) === 'full-test'
    ? LEADERBOARD_FULL_TEST_MIN_TIME_SEC
    : LEADERBOARD_PASSAGE_MIN_TIME_SEC
  return Math.min(requestedMinimum, Math.max(60, input.durationSec))
}

function sendLeaderboardTimeGuard(res: Response, input: {
  minTimeSec: number
  actualTimeSec: number
  totalQuestions: number
  durationSec: number
  externalTestId?: string
}) {
  const attemptKind = resolveLeaderboardAttemptKind(input)
  const minMinutes = Math.round(input.minTimeSec / 60)

  return res.status(422).json({
    code: 'LEADERBOARD_MIN_TIME',
    leaderboardEligible: false,
    attemptKind,
    minTimeSec: input.minTimeSec,
    actualTimeSec: input.actualTimeSec,
    message: `Integrity check: this ${attemptKind === 'full-test' ? 'full test' : 'passage'} was submitted too quickly. Spend at least ${minMinutes} minutes before submitting to earn leaderboard points.`,
  })
}

router.get(
  '/',
  requireAuth,
  validateQuery(testListQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof testListQuerySchema>
    const skip = (query.page - 1) * query.limit

    const where: Prisma.TestWhereInput = {
      published: true,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { subjects: { has: query.search } },
            ],
          }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
      ...(query.premium ? { premium: query.premium === 'true' } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ premium: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          durationSec: true,
          premium: true,
          xpReward: true,
          subjects: true,
          _count: {
            select: { questions: true },
          },
        },
      }),
      prisma.test.count({ where }),
    ])

    return res.json({
      items: items.map((test) => ({
        ...test,
        questionCount: test._count.questions,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  }),
)

router.get(
  '/recommended',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id

    const attempts = await prisma.testAttempt.findMany({
      where: { userId },
      select: {
        percentage: true,
        test: {
          select: {
            category: true,
          },
        },
      },
    })

    const categoryBuckets = new Map<TestCategory, { total: number; count: number }>()

    for (const attempt of attempts) {
      const previous = categoryBuckets.get(attempt.test.category) ?? { total: 0, count: 0 }
      categoryBuckets.set(attempt.test.category, {
        total: previous.total + attempt.percentage,
        count: previous.count + 1,
      })
    }

    const weakestCategory = [...categoryBuckets.entries()]
      .map(([category, stats]) => ({
        category,
        avg: stats.total / stats.count,
      }))
      .sort((a, b) => a.avg - b.avg)[0]?.category

    const recommendations = await prisma.test.findMany({
      where: {
        published: true,
        ...(weakestCategory ? { category: weakestCategory } : {}),
      },
      orderBy: [{ premium: 'asc' }, { createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        category: true,
        durationSec: true,
        premium: true,
        xpReward: true,
        subjects: true,
      },
    })

    return res.json({ items: recommendations, weakestCategory: weakestCategory ?? null })
  }),
)

router.post(
  '/reading-sync',
  requireAuth,
  validateBody(readingSyncSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = req.body as z.infer<typeof readingSyncSchema>

    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date()
    const safeCompletedAt = Number.isNaN(completedAt.getTime()) ? new Date() : completedAt
    const safeTotalQuestions = Math.max(1, payload.totalQuestions)
    const minLeaderboardTimeSec = getMinimumLeaderboardTimeSec({
      totalQuestions: safeTotalQuestions,
      durationSec: payload.durationSec,
      externalTestId: payload.externalTestId,
    })

    if (payload.timeSpentSec < minLeaderboardTimeSec) {
      return sendLeaderboardTimeGuard(res, {
        minTimeSec: minLeaderboardTimeSec,
        actualTimeSec: payload.timeSpentSec,
        totalQuestions: safeTotalQuestions,
        durationSec: payload.durationSec,
        externalTestId: payload.externalTestId,
      })
    }

    const computedAccuracy = (payload.correctAnswers / safeTotalQuestions) * 100
    const percentage = clamp(
      typeof payload.accuracy === 'number' ? payload.accuracy : computedAccuracy,
      0,
      100,
    )
    const finalScore = clamp(
      typeof payload.finalScore === 'number' ? payload.finalScore : percentage,
      0,
      100,
    )

    const syncSlug = toSafeSyncSlug(payload.externalTestId, 'reading')
    const defaultSubjects = ['IELTS Reading', 'Reading', 'Passage', 'Comprehension']
    const subjects = payload.subjects && payload.subjects.length > 0 ? payload.subjects : defaultSubjects

    const test = await prisma.test.upsert({
      where: { slug: syncSlug },
      update: {
        title: payload.title,
        description: `Synced IELTS Reading attempt (${payload.externalTestId})`,
        category: TestCategory.IELTS,
        difficulty: payload.difficulty,
        durationSec: payload.durationSec,
        premium: false,
        subjects,
        published: true,
      },
      create: {
        slug: syncSlug,
        title: payload.title,
        description: `Synced IELTS Reading attempt (${payload.externalTestId})`,
        category: TestCategory.IELTS,
        difficulty: payload.difficulty,
        durationSec: payload.durationSec,
        premium: false,
        xpReward: 110,
        subjects,
        published: true,
        createdById: userId,
      },
      select: {
        id: true,
        durationSec: true,
        difficulty: true,
        xpReward: true,
      },
    })

    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId,
        testId: test.id,
        timeSpentSec: payload.timeSpentSec,
        totalQuestions: payload.totalQuestions,
        correctAnswers: payload.correctAnswers,
        completedAt: {
          gte: new Date(safeCompletedAt.getTime() - 60_000),
          lte: new Date(safeCompletedAt.getTime() + 60_000),
        },
      },
      select: { id: true },
    })

    if (existingAttempt) {
      return res.status(200).json({
        synced: true,
        duplicate: true,
        attemptId: existingAttempt.id,
      })
    }

    const safeDuration = Math.max(1, test.durationSec)
    const boundedTimeSpent = Math.max(0, Math.min(payload.timeSpentSec, safeDuration))
    const timeEfficiency = Math.max(0, safeDuration - boundedTimeSpent) / safeDuration
    const timeBonus = Math.min(5, timeEfficiency * 10)
    const rawScore = clamp((payload.correctAnswers / safeTotalQuestions) * 100, 0, 100)
    const weightedScore = percentage

    const attemptResponse = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          lastActiveDate: true,
          profile: { select: { timezone: true } },
        },
      })

      if (!user) {
        throw new Error('User not found during reading sync.')
      }

      const now = safeCompletedAt
      const derivedStreak = await getLearningStreakSnapshot(
        tx,
        userId,
        user.profile?.timezone,
        now,
        [now],
      )
      const streak = {
        ...derivedStreak,
        longestStreak: Math.max(user.longestStreak, derivedStreak.longestStreak),
      }

      const xpEarned = calculateXp({
        baseXp: test.xpReward ?? 110,
        difficulty: test.difficulty,
        performancePercent: percentage,
        timeBonus,
        streak: streak.currentStreak,
      })

      const levelTransition = resolveLevelTransition(user.xp, xpEarned)

      const attempt = await tx.testAttempt.create({
        data: {
          userId,
          testId: test.id,
          startedAt: new Date(now.getTime() - Math.max(payload.timeSpentSec, 1) * 1000),
          completedAt: now,
          timeSpentSec: payload.timeSpentSec,
          totalQuestions: payload.totalQuestions,
          correctAnswers: payload.correctAnswers,
          rawScore,
          weightedScore,
          percentage,
          timeBonus,
          finalScore,
          accuracy: percentage,
          xpEarned,
          levelBefore: levelTransition.levelBefore,
          levelAfter: levelTransition.levelAfter,
          streakAtCompletion: streak.currentStreak,
        },
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: levelTransition.nextXp,
          level: levelTransition.levelAfter,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActiveDate: new Date(),
        },
      })

      const activityDate = startOfUtcDay(now)
      const existingActivity = await tx.dailyActivity.findUnique({
        where: {
          userId_activityDate: {
            userId,
            activityDate,
          },
        },
      })

      if (!existingActivity) {
        await tx.dailyActivity.create({
          data: {
            userId,
            activityDate,
            testsCompleted: 1,
            questionsAnswered: payload.totalQuestions,
            xpEarned,
            averageScore: finalScore,
          },
        })
      } else {
        const nextTests = existingActivity.testsCompleted + 1
        const nextAverageScore =
          (existingActivity.averageScore * existingActivity.testsCompleted + finalScore) / nextTests

        await tx.dailyActivity.update({
          where: {
            userId_activityDate: {
              userId,
              activityDate,
            },
          },
          data: {
            testsCompleted: nextTests,
            questionsAnswered: existingActivity.questionsAnswered + payload.totalQuestions,
            xpEarned: existingActivity.xpEarned + xpEarned,
            averageScore: nextAverageScore,
          },
        })
      }

      if (levelTransition.leveledUp) {
        await tx.notification.create({
          data: {
            userId,
            type: 'LEVEL_UP',
            title: 'Level Up!',
            message: `You reached level ${levelTransition.levelAfter}. Keep your momentum going.`,
            metadata: {
              levelBefore: levelTransition.levelBefore,
              levelAfter: levelTransition.levelAfter,
              source: 'reading_sync',
            },
          },
        })
      }

      return {
        attemptId: attempt.id,
        xpEarned,
        currentStreak: streak.currentStreak,
        levelAfter: levelTransition.levelAfter,
      }
    })

    invalidateLeaderboardCache()
    invalidateSkillAnalyticsCache(userId)
    invalidateAiCoachCache(userId)
    void precomputeAiCoachReport(userId)

    return res.status(201).json({
      synced: true,
      duplicate: false,
      ...attemptResponse,
    })
  }),
)

router.post(
  '/listening-sync',
  requireAuth,
  validateBody(listeningSyncSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = req.body as z.infer<typeof listeningSyncSchema>

    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date()
    const safeCompletedAt = Number.isNaN(completedAt.getTime()) ? new Date() : completedAt
    const safeTotalQuestions = Math.max(1, payload.totalQuestions)
    const minLeaderboardTimeSec = getMinimumLeaderboardTimeSec({
      totalQuestions: safeTotalQuestions,
      durationSec: payload.durationSec,
      externalTestId: payload.externalTestId,
    })

    if (payload.timeSpentSec < minLeaderboardTimeSec) {
      return sendLeaderboardTimeGuard(res, {
        minTimeSec: minLeaderboardTimeSec,
        actualTimeSec: payload.timeSpentSec,
        totalQuestions: safeTotalQuestions,
        durationSec: payload.durationSec,
        externalTestId: payload.externalTestId,
      })
    }

    const computedAccuracy = (payload.correctAnswers / safeTotalQuestions) * 100
    const percentage = clamp(
      typeof payload.accuracy === 'number' ? payload.accuracy : computedAccuracy,
      0,
      100,
    )
    const finalScore = clamp(
      typeof payload.finalScore === 'number' ? payload.finalScore : percentage,
      0,
      100,
    )

    const syncSlug = toSafeSyncSlug(payload.externalTestId, 'listening')
    const defaultSubjects = ['IELTS Listening', 'Listening', 'Audio', 'Comprehension']
    const subjects = payload.subjects && payload.subjects.length > 0 ? payload.subjects : defaultSubjects

    const test = await prisma.test.upsert({
      where: { slug: syncSlug },
      update: {
        title: payload.title,
        description: `Synced IELTS Listening attempt (${payload.externalTestId})`,
        category: TestCategory.IELTS,
        difficulty: payload.difficulty,
        durationSec: payload.durationSec,
        premium: false,
        subjects,
        published: true,
      },
      create: {
        slug: syncSlug,
        title: payload.title,
        description: `Synced IELTS Listening attempt (${payload.externalTestId})`,
        category: TestCategory.IELTS,
        difficulty: payload.difficulty,
        durationSec: payload.durationSec,
        premium: false,
        xpReward: 105,
        subjects,
        published: true,
        createdById: userId,
      },
      select: {
        id: true,
        durationSec: true,
        difficulty: true,
        xpReward: true,
      },
    })

    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId,
        testId: test.id,
        timeSpentSec: payload.timeSpentSec,
        totalQuestions: payload.totalQuestions,
        correctAnswers: payload.correctAnswers,
        completedAt: {
          gte: new Date(safeCompletedAt.getTime() - 60_000),
          lte: new Date(safeCompletedAt.getTime() + 60_000),
        },
      },
      select: { id: true },
    })

    if (existingAttempt) {
      return res.status(200).json({
        synced: true,
        duplicate: true,
        attemptId: existingAttempt.id,
      })
    }

    const safeDuration = Math.max(1, test.durationSec)
    const boundedTimeSpent = Math.max(0, Math.min(payload.timeSpentSec, safeDuration))
    const timeEfficiency = Math.max(0, safeDuration - boundedTimeSpent) / safeDuration
    const timeBonus = Math.min(5, timeEfficiency * 10)
    const rawScore = clamp((payload.correctAnswers / safeTotalQuestions) * 100, 0, 100)

    const attemptResponse = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          lastActiveDate: true,
          profile: { select: { timezone: true } },
        },
      })

      if (!user) {
        throw new Error('User not found during listening sync.')
      }

      const now = safeCompletedAt
      const derivedStreak = await getLearningStreakSnapshot(
        tx,
        userId,
        user.profile?.timezone,
        now,
        [now],
      )
      const streak = {
        ...derivedStreak,
        longestStreak: Math.max(user.longestStreak, derivedStreak.longestStreak),
      }

      const xpEarned = calculateXp({
        baseXp: test.xpReward ?? 105,
        difficulty: test.difficulty,
        performancePercent: percentage,
        timeBonus,
        streak: streak.currentStreak,
      })

      const levelTransition = resolveLevelTransition(user.xp, xpEarned)

      const attempt = await tx.testAttempt.create({
        data: {
          userId,
          testId: test.id,
          startedAt: new Date(now.getTime() - Math.max(payload.timeSpentSec, 1) * 1000),
          completedAt: now,
          timeSpentSec: payload.timeSpentSec,
          totalQuestions: payload.totalQuestions,
          correctAnswers: payload.correctAnswers,
          rawScore,
          weightedScore: percentage,
          percentage,
          timeBonus,
          finalScore,
          accuracy: percentage,
          xpEarned,
          levelBefore: levelTransition.levelBefore,
          levelAfter: levelTransition.levelAfter,
          streakAtCompletion: streak.currentStreak,
        },
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: levelTransition.nextXp,
          level: levelTransition.levelAfter,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActiveDate: new Date(),
        },
      })

      const activityDate = startOfUtcDay(now)
      const existingActivity = await tx.dailyActivity.findUnique({
        where: {
          userId_activityDate: {
            userId,
            activityDate,
          },
        },
      })

      if (!existingActivity) {
        await tx.dailyActivity.create({
          data: {
            userId,
            activityDate,
            testsCompleted: 1,
            questionsAnswered: payload.totalQuestions,
            xpEarned,
            averageScore: finalScore,
          },
        })
      } else {
        const nextTests = existingActivity.testsCompleted + 1
        const nextAverageScore =
          (existingActivity.averageScore * existingActivity.testsCompleted + finalScore) / nextTests

        await tx.dailyActivity.update({
          where: {
            userId_activityDate: {
              userId,
              activityDate,
            },
          },
          data: {
            testsCompleted: nextTests,
            questionsAnswered: existingActivity.questionsAnswered + payload.totalQuestions,
            xpEarned: existingActivity.xpEarned + xpEarned,
            averageScore: nextAverageScore,
          },
        })
      }

      if (levelTransition.leveledUp) {
        await tx.notification.create({
          data: {
            userId,
            type: 'LEVEL_UP',
            title: 'Level Up!',
            message: `You reached level ${levelTransition.levelAfter}. Keep your momentum going.`,
            metadata: {
              levelBefore: levelTransition.levelBefore,
              levelAfter: levelTransition.levelAfter,
              source: 'listening_sync',
            },
          },
        })
      }

      return {
        attemptId: attempt.id,
        xpEarned,
        currentStreak: streak.currentStreak,
        levelAfter: levelTransition.levelAfter,
      }
    })

    invalidateLeaderboardCache()
    invalidateSkillAnalyticsCache(userId)
    invalidateAiCoachCache(userId)
    void precomputeAiCoachReport(userId)

    return res.status(201).json({
      synced: true,
      duplicate: false,
      ...attemptResponse,
    })
  }),
)

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        durationSec: true,
        premium: true,
        xpReward: true,
        subjects: true,
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            explanation: true,
            order: true,
            weight: true,
            options: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                text: true,
                order: true,
              },
            },
          },
        },
      },
    })

    if (!test) {
      return res.status(404).json({ message: 'Test not found.' })
    }

    return res.json({ test })
  }),
)

router.post(
  '/:id/submit',
  requireAuth,
  validateBody(submitAttemptSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const testId = req.params.id
    const { answers, timeSpentSec, assignmentId } = req.body

    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        durationSec: true,
        difficulty: true,
        category: true,
        xpReward: true,
        questions: {
          select: {
            id: true,
            weight: true,
            options: {
              select: {
                id: true,
                isCorrect: true,
              },
            },
          },
        },
      },
    })

    if (!test) {
      return res.status(404).json({ message: 'Test not found.' })
    }

    const minLeaderboardTimeSec = getMinimumLeaderboardTimeSec({
      totalQuestions: test.questions.length,
      durationSec: test.durationSec,
    })

    if (timeSpentSec < minLeaderboardTimeSec) {
      return sendLeaderboardTimeGuard(res, {
        minTimeSec: minLeaderboardTimeSec,
        actualTimeSec: timeSpentSec,
        totalQuestions: test.questions.length,
        durationSec: test.durationSec,
      })
    }

    const score = calculateAttemptScore({
      difficulty: test.difficulty,
      durationSec: test.durationSec,
      timeSpentSec,
      questions: test.questions,
      answers,
      xpRewardOverride: test.xpReward,
    })

    const now = new Date()

    const attemptResponse = await prisma.$transaction(async (tx) => {
      const [user, existingAttemptCount, unlockedRows, achievements] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            xp: true,
            level: true,
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
            profile: { select: { timezone: true } },
          },
        }),
        tx.testAttempt.count({ where: { userId } }),
        tx.userAchievement.findMany({
          where: { userId },
          select: { achievementId: true },
        }),
        tx.achievement.findMany(),
      ])

      if (!user) {
        throw new Error('User not found during test submission.')
      }

      const derivedStreak = await getLearningStreakSnapshot(
        tx,
        userId,
        user.profile?.timezone,
        now,
        [now],
      )
      const streak = {
        ...derivedStreak,
        longestStreak: Math.max(user.longestStreak, derivedStreak.longestStreak),
      }

      const baseXpEarned = calculateXp({
        baseXp: score.baseXp,
        difficulty: test.difficulty,
        performancePercent: score.percentage,
        timeBonus: score.timeBonus,
        streak: streak.currentStreak,
      })

      const projectedXp = user.xp + baseXpEarned
      const unlocked = resolveUnlockedAchievements({
        availableAchievements: achievements,
        unlockedAchievementIds: new Set(unlockedRows.map((row) => row.achievementId)),
        context: {
          existingAttemptCount,
          projectedXp,
          projectedCurrentStreak: streak.currentStreak,
          finalScore: score.finalScore,
          difficulty: test.difficulty,
        },
      })

      const achievementBonusXp = unlocked.reduce((total, achievement) => total + achievement.xpReward, 0)
      const totalXpGained = baseXpEarned + achievementBonusXp
      const levelTransition = resolveLevelTransition(user.xp, totalXpGained)

      const attempt = await tx.testAttempt.create({
        data: {
          userId,
          testId,
          startedAt: new Date(now.getTime() - Math.max(timeSpentSec, 1) * 1000),
          completedAt: now,
          timeSpentSec,
          totalQuestions: score.totalQuestions,
          correctAnswers: score.correctAnswers,
          rawScore: score.rawScore,
          weightedScore: score.weightedScore,
          percentage: score.percentage,
          timeBonus: score.timeBonus,
          finalScore: score.finalScore,
          accuracy: score.percentage,
          xpEarned: totalXpGained,
          levelBefore: levelTransition.levelBefore,
          levelAfter: levelTransition.levelAfter,
          streakAtCompletion: streak.currentStreak,
          answers: {
            create: score.computedAnswers.map((answer) => ({
              questionId: answer.questionId,
              selectedOptionId: answer.selectedOptionId,
              isCorrect: answer.isCorrect,
              weight: answer.weight,
            })),
          },
        },
      })

      if (assignmentId) {
        await tx.learningCenterAssignmentSubmission.updateMany({
          where: { assignmentId, studentId: userId },
          data: {
            status: LearningSubmissionStatus.COMPLETED,
            progress: 100,
            submittedAt: now,
          },
        })
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: levelTransition.nextXp,
          level: levelTransition.levelAfter,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActiveDate: new Date(),
        },
      })

      const activityDate = startOfUtcDay(now)
      const existingActivity = await tx.dailyActivity.findUnique({
        where: {
          userId_activityDate: {
            userId,
            activityDate,
          },
        },
      })

      if (!existingActivity) {
        await tx.dailyActivity.create({
          data: {
            userId,
            activityDate,
            testsCompleted: 1,
            questionsAnswered: score.totalQuestions,
            xpEarned: totalXpGained,
            averageScore: score.finalScore,
          },
        })
      } else {
        const nextTests = existingActivity.testsCompleted + 1
        const nextAverageScore =
          (existingActivity.averageScore * existingActivity.testsCompleted + score.finalScore) / nextTests

        await tx.dailyActivity.update({
          where: {
            userId_activityDate: {
              userId,
              activityDate,
            },
          },
          data: {
            testsCompleted: nextTests,
            questionsAnswered: existingActivity.questionsAnswered + score.totalQuestions,
            xpEarned: existingActivity.xpEarned + totalXpGained,
            averageScore: nextAverageScore,
          },
        })
      }

      if (levelTransition.leveledUp) {
        await tx.notification.create({
          data: {
            userId,
            type: 'LEVEL_UP',
            title: `Level Up!`,
            message: `You reached level ${levelTransition.levelAfter}. Keep your momentum going.`,
            metadata: {
              levelBefore: levelTransition.levelBefore,
              levelAfter: levelTransition.levelAfter,
            },
          },
        })
      }

      if (unlocked.length > 0) {
        await tx.userAchievement.createMany({
          data: unlocked.map((achievement) => ({
            userId,
            achievementId: achievement.id,
          })),
          skipDuplicates: true,
        })

        await tx.notification.createMany({
          data: unlocked.map((achievement) => ({
            userId,
            type: 'ACHIEVEMENT',
            title: `Achievement Unlocked: ${achievement.title}`,
            message: achievement.description,
            metadata: {
              achievementId: achievement.id,
              achievementSlug: achievement.slug,
              xpReward: achievement.xpReward,
            },
          })),
        })
      }

      return {
        attemptId: attempt.id,
        totalQuestions: score.totalQuestions,
        correctAnswers: score.correctAnswers,
        weightedScore: score.weightedScore,
        finalScore: score.finalScore,
        percentage: score.percentage,
        timeBonus: score.timeBonus,
        xpEarned: totalXpGained,
        totalXp: levelTransition.nextXp,
        baseXpEarned,
        achievementBonusXp,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        levelBefore: levelTransition.levelBefore,
        levelAfter: levelTransition.levelAfter,
        leveledUp: levelTransition.leveledUp,
        answerReview: score.computedAnswers,
        unlockedAchievements: unlocked.map((achievement) => ({
          id: achievement.id,
          slug: achievement.slug,
          title: achievement.title,
          xpReward: achievement.xpReward,
        })),
      }
    })

    invalidateLeaderboardCache()
    invalidateSkillAnalyticsCache(userId)
    invalidateAiCoachCache(userId)
    void precomputeAiCoachReport(userId)

    return res.status(201).json(attemptResponse)
  }),
)

router.post(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  validateBody(createTestSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof createTestSchema>

    const existing = await prisma.test.findUnique({ where: { slug: payload.slug } })
    if (existing) {
      return res.status(409).json({ message: 'Test slug already exists.' })
    }

    const created = await prisma.test.create({
      data: {
        slug: payload.slug,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        difficulty: payload.difficulty,
        durationSec: payload.durationSec,
        premium: payload.premium,
        xpReward: payload.xpReward,
        subjects: payload.subjects,
        published: true,
        createdById: req.user!.id,
        questions: {
          create: payload.questions.map((question, questionIndex) => ({
            text: question.text,
            explanation: question.explanation,
            weight: question.weight,
            order: questionIndex + 1,
            options: {
              create: question.options.map((option, optionIndex) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                order: optionIndex + 1,
              })),
            },
          })),
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
      },
    })

    return res.status(201).json({ test: created })
  }),
)

export default router
