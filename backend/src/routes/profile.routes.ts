import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { addUtcDays, startOfUtcDay } from '../utils/date.js'
import { getLevelProgress } from '../config/levelConfig.js'
import { generateLeaderboard } from '../services/leaderboard.service.js'
import { generateSkillAnalytics } from '../services/analytics.service.js'
import { generateAiCoachReport, isAiCoachProviderError } from '../services/aiCoach.service.js'
import { generateAiChatResponse } from '../services/aiChat.service.js'
import { isPremiumUser } from '../utils/premium.js'
import { env } from '../config/env.js'

const router = Router()
const aiReportBodySchema = z.object({
  refresh: z.boolean().optional(),
})
const aiChatBodySchema = z.object({
  message: z.string().min(1).max(1200),
  history: z
    .array(
      z
        .object({
          role: z.enum(['user', 'assistant']),
          content: z.string().min(1).max(1600),
        })
        .strict(),
    )
    .max(12)
    .default([]),
  locale: z.enum(['en', 'uz']).optional(),
  contextMode: z
    .enum(['analysis', 'general', 'exam', 'training_reading', 'training_listening'])
    .optional(),
  uiContext: z
    .object({
      pathname: z.string().max(240).optional(),
    })
    .optional(),
})
const aiPreferenceBodySchema = z.object({
  preferredLocale: z.enum(['en', 'uz']).optional(),
  preferredName: z.string().min(2).max(80).nullable().optional(),
  toneStyle: z.enum(['sweet', 'neutral', 'coach']).optional(),
})
const vocabNotebookQuerySchema = z.object({
  testKey: z.string().min(2).max(120).optional(),
})
const vocabNotebookCreateSchema = z.object({
  testKey: z.string().min(2).max(120),
  title: z.string().min(2).max(140),
  locale: z.string().min(2).max(24).optional(),
})
const vocabNotebookUpdateSchema = z.object({
  title: z.string().min(2).max(140).optional(),
  locale: z.string().min(2).max(24).optional(),
})
const vocabItemCreateSchema = z.object({
  term: z.string().min(1).max(120),
  meaning: z.string().min(1).max(280),
  notes: z.string().max(600).optional(),
  sourceLang: z.string().max(24).optional(),
})
const vocabItemUpdateSchema = z
  .object({
    term: z.string().min(1).max(120).optional(),
    meaning: z.string().min(1).max(280).optional(),
    notes: z.string().max(600).nullable().optional(),
    sourceLang: z.string().max(24).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  })
const speakingEvaluateSchema = z.object({
  transcript: z.string().min(20).max(7000),
  transcriptLocale: z.string().max(24).optional(),
  taskLabel: z.string().max(80).optional(),
  pronunciationSignal: z.coerce.number().min(0).max(100).optional(),
})
const aiRealtimeSessionSchema = z.object({
  mode: z.enum(['conversation', 'mock']).optional(),
  part: z.enum(['part1', 'part2', 'part3', 'full_mock']).optional(),
})
const speakingQuestionsQuerySchema = z.object({
  part: z.coerce.number().int().min(1).max(3).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})
const attemptParamsSchema = z.object({
  attemptId: z.string().min(1).max(191),
})

const prismaRuntime = prisma as unknown as Record<string, any>
const aiPreferenceModel = prismaRuntime.userAiPreference as
  | {
      findUnique?: (input: unknown) => Promise<any>
      upsert?: (input: unknown) => Promise<any>
    }
  | undefined
const vocabularyNotebookModel = prismaRuntime.vocabularyNotebook as
  | {
      findMany?: (input: unknown) => Promise<any[]>
      findFirst?: (input: unknown) => Promise<any>
      upsert?: (input: unknown) => Promise<any>
      update?: (input: unknown) => Promise<any>
      delete?: (input: unknown) => Promise<any>
    }
  | undefined
const vocabularyItemModel = prismaRuntime.vocabularyNotebookItem as
  | {
      create?: (input: unknown) => Promise<any>
      findFirst?: (input: unknown) => Promise<any>
      update?: (input: unknown) => Promise<any>
      delete?: (input: unknown) => Promise<any>
    }
  | undefined
const speakingEvaluationModel = prismaRuntime.speakingEvaluation as
  | {
      create?: (input: unknown) => Promise<any>
    }
  | undefined
const speakingQuestionModel = prismaRuntime.speakingQuestionBank as
  | {
      findMany?: (input: unknown) => Promise<any[]>
    }
  | undefined

type FallbackAiPreference = {
  preferredLocale: string
  preferredName: string | null
  toneStyle: string
  lastAssistantLanguage: string
  updatedAt: string
}

type FallbackVocabularyNotebookItem = {
  id: string
  notebookId: string
  term: string
  meaning: string
  notes: string | null
  sourceLang: string | null
  createdAt: string
  updatedAt: string
}

type FallbackVocabularyNotebook = {
  id: string
  userId: string
  preferenceId: string | null
  testKey: string
  title: string
  locale: string
  createdAt: string
  updatedAt: string
  items: FallbackVocabularyNotebookItem[]
}

const fallbackAiPreferenceStore = new Map<string, FallbackAiPreference>()
const fallbackVocabularyStore = new Map<string, FallbackVocabularyNotebook[]>()

function createFallbackId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function isAiPreferenceModelReady() {
  return (
    typeof aiPreferenceModel?.findUnique === 'function' &&
    typeof aiPreferenceModel?.upsert === 'function'
  )
}

function isVocabModelReady() {
  return (
    typeof vocabularyNotebookModel?.findMany === 'function' &&
    typeof vocabularyNotebookModel?.upsert === 'function' &&
    typeof vocabularyItemModel?.create === 'function'
  )
}

function isSpeakingModelReady() {
  return typeof speakingEvaluationModel?.create === 'function'
}

function isSpeakingQuestionModelReady() {
  return typeof speakingQuestionModel?.findMany === 'function'
}

function getFallbackNotebooks(userId: string) {
  return fallbackVocabularyStore.get(userId) ?? []
}

const fallbackSpeakingQuestionBank: Array<{
  id: string
  part: number
  prompt: string
  sourceType: 'CURATED' | 'USER_UPLOADED' | 'LICENSED'
  sourceLabel: string
}> = [
  {
    id: 'spk-p1-1',
    part: 1,
    prompt: 'Do you prefer studying alone or with friends?',
    sourceType: 'CURATED',
    sourceLabel: 'curated',
  },
  {
    id: 'spk-p1-2',
    part: 1,
    prompt: 'What kind of books do you usually read?',
    sourceType: 'CURATED',
    sourceLabel: 'curated',
  },
  {
    id: 'spk-p2-1',
    part: 2,
    prompt: 'Describe a person who inspired you to learn English. You should say who this person is, how they inspired you, and explain why this influence matters to you.',
    sourceType: 'CURATED',
    sourceLabel: 'curated',
  },
  {
    id: 'spk-p2-2',
    part: 2,
    prompt: 'Describe a place where you like to study. You should say where it is, what it is like, and explain why it helps your concentration.',
    sourceType: 'CURATED',
    sourceLabel: 'curated',
  },
  {
    id: 'spk-p3-1',
    part: 3,
    prompt: 'How can schools improve students speaking confidence in real-life communication?',
    sourceType: 'CURATED',
    sourceLabel: 'curated',
  },
  {
    id: 'spk-p3-2',
    part: 3,
    prompt: 'Why do some learners plateau in speaking despite knowing grammar rules?',
    sourceType: 'CURATED',
    sourceLabel: 'curated',
  },
]

function getPastSevenDays(now: Date) {
  return Array.from({ length: 7 }, (_, index) => addUtcDays(startOfUtcDay(now), -6 + index))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parsePreferredName(fullName?: string | null) {
  if (!fullName) return null
  return fullName.trim().split(/\s+/)[0] ?? null
}

function buildSpeakingEvaluation(transcript: string, pronunciationSignal?: number) {
  const cleaned = transcript.replace(/\s+/g, ' ').trim()
  const words = cleaned
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean)
  const sentences = cleaned
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const uniqueWords = new Set(
    words
      .map((word) => word.toLowerCase().replace(/[^a-z']/g, ''))
      .filter((word) => word.length > 0),
  )

  const fillerPattern = /\b(um|uh|like|you know|erm|hmm)\b/gi
  const fillerCount = (cleaned.match(fillerPattern) ?? []).length
  const grammarPenaltyPatterns = [
    /\bi am agree\b/gi,
    /\bpeople is\b/gi,
    /\bhe go\b/gi,
    /\bshe go\b/gi,
    /\bmore better\b/gi,
    /\bdidn't went\b/gi,
    /\bchildrens\b/gi,
    /\badvices\b/gi,
  ]
  const grammarIssueCount = grammarPenaltyPatterns.reduce(
    (total, pattern) => total + (cleaned.match(pattern)?.length ?? 0),
    0,
  )

  const lexicalRatio = words.length > 0 ? uniqueWords.size / words.length : 0
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : words.length
  const fillerRatio = words.length > 0 ? fillerCount / words.length : 0

  const fluencyBand = clamp(5 + words.length / 80 + avgSentenceLength / 25 - fillerRatio * 12, 4, 9)
  const grammarBand = clamp(7.8 - grammarIssueCount * 0.6 + words.length / 250, 4, 9)
  const lexicalBand = clamp(4.8 + lexicalRatio * 5.2, 4, 9)
  const pronunciationBand = clamp(
    pronunciationSignal !== undefined ? 4 + (pronunciationSignal / 100) * 5 : fluencyBand - 0.15,
    4,
    9,
  )

  const overallBand = clamp(
    fluencyBand * 0.3 + grammarBand * 0.25 + pronunciationBand * 0.25 + lexicalBand * 0.2,
    4,
    9,
  )

  const metricOrder = [
    { key: 'fluency', value: fluencyBand, advice: 'Speak in longer chunks without overusing fillers.' },
    { key: 'grammar', value: grammarBand, advice: 'Use consistent tense control and cleaner sentence structures.' },
    { key: 'pronunciation', value: pronunciationBand, advice: 'Practice stress and connected speech for clearer delivery.' },
    { key: 'lexical', value: lexicalBand, advice: 'Expand topic vocabulary and collocation accuracy.' },
  ].sort((left, right) => left.value - right.value)

  const improvementPriorities = metricOrder.slice(0, 4).map((entry) => ({
    area: entry.key,
    target: Number((entry.value + 0.5).toFixed(1)),
    action: entry.advice,
  }))

  const strengths: string[] = []
  if (lexicalBand >= 6.5) strengths.push('Good lexical range with topic-relevant wording.')
  if (fluencyBand >= 6.5) strengths.push('Stable speaking rhythm and pacing.')
  if (grammarBand >= 6.5) strengths.push('Generally controlled grammar across responses.')
  if (pronunciationBand >= 6.5) strengths.push('Pronunciation is understandable and mostly clear.')
  if (strengths.length === 0) strengths.push('You kept speaking and maintained communication throughout.')

  const weaknesses: string[] = []
  if (fillerRatio > 0.05) weaknesses.push('Frequent filler usage reduced fluency precision.')
  if (grammarIssueCount > 0) weaknesses.push('Repeated grammar slips affected sentence accuracy.')
  if (avgSentenceLength < 7) weaknesses.push('Ideas were often short and underdeveloped.')
  if (weaknesses.length === 0) weaknesses.push('Main focus is polishing detail-level accuracy for a higher band.')

  return {
    overallBand: Number(overallBand.toFixed(1)),
    fluencyBand: Number(fluencyBand.toFixed(1)),
    grammarBand: Number(grammarBand.toFixed(1)),
    pronunciationBand: Number(pronunciationBand.toFixed(1)),
    lexicalBand: Number(lexicalBand.toFixed(1)),
    feedback: {
      summary: `Estimated IELTS Speaking band: ${overallBand.toFixed(1)}.`,
      strengths,
      weaknesses,
      improvementPriorities,
      stats: {
        wordCount: words.length,
        uniqueWords: uniqueWords.size,
        fillerCount,
        grammarIssueCount,
      },
    },
  }
}

router.get(
  '/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const now = new Date()

    const [user, attemptsAggregate, attemptsCount, recentAttempts, unlockedAchievements] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          nickname: true,
          role: true,
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          createdAt: true,
        },
      }),
      prisma.testAttempt.aggregate({
        where: { userId },
        _avg: { finalScore: true, percentage: true },
        _sum: { xpEarned: true },
      }),
      prisma.testAttempt.count({ where: { userId } }),
      prisma.testAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          finalScore: true,
          percentage: true,
          xpEarned: true,
          completedAt: true,
          test: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
            },
          },
        },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        take: 12,
        select: {
          unlockedAt: true,
          achievement: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              icon: true,
              xpReward: true,
            },
          },
        },
      }),
    ])

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (!isPremiumUser({ role: user.role, email: user.email, nickname: user.nickname })) {
      return res.status(403).json({
        message: 'AI Analysis is available for Premium users only.',
      })
    }

    const [skillAnalytics, leaderboardSnapshot] = await Promise.all([
      generateSkillAnalytics(userId),
      generateLeaderboard({
        period: 'all',
        currentUserId: userId,
      }),
    ])

    const days = getPastSevenDays(now)
    const activityRows = await prisma.dailyActivity.findMany({
      where: {
        userId,
        activityDate: {
          gte: days[0],
          lte: days[6],
        },
      },
      select: {
        activityDate: true,
        testsCompleted: true,
        questionsAnswered: true,
        xpEarned: true,
      },
    })

    const activityMap = new Map(activityRows.map((row) => [startOfUtcDay(row.activityDate).toISOString(), row]))

    const weeklyActivity = days.map((day) => {
      const key = startOfUtcDay(day).toISOString()
      const row = activityMap.get(key)

      return {
        date: key,
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        testsCompleted: row?.testsCompleted ?? 0,
        questionsAnswered: row?.questionsAnswered ?? 0,
        xpEarned: row?.xpEarned ?? 0,
        active: Boolean((row?.testsCompleted ?? 0) > 0),
      }
    })

    const levelProgress = getLevelProgress(user.xp, user.level)
    const competitiveRow = leaderboardSnapshot.rows.find((row) => row.userId === userId) ?? null

    return res.json({
      profile: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        level: user.level,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        memberSince: user.createdAt,
      },
      stats: {
        totalAttempts: attemptsCount,
        averageScore: Number((attemptsAggregate._avg.finalScore ?? 0).toFixed(2)),
        averageAccuracy: Number((attemptsAggregate._avg.percentage ?? 0).toFixed(2)),
        totalXpFromAttempts: Number(attemptsAggregate._sum.xpEarned ?? 0),
      },
      levelProgress,
      weeklyActivity,
      competitive: competitiveRow
        ? {
            rank: competitiveRow.rank,
            previousRank: competitiveRow.previousRank,
            rankDelta: competitiveRow.rankDelta,
            rankTrend: competitiveRow.rankTrend,
            division: competitiveRow.division,
            divisionLabel: competitiveRow.divisionLabel,
            rankScore: competitiveRow.rankingScore,
            uniqueTests: competitiveRow.uniqueTests,
            validatedAttempts: competitiveRow.validatedAttempts,
            discardedAttempts: competitiveRow.discardedAttempts,
            integrityScore: competitiveRow.integrityScore,
            breakdown: competitiveRow.breakdown,
          }
        : null,
      skillAnalytics,
      achievements: unlockedAchievements,
      recentAttempts,
    })
  }),
)

router.delete(
  '/attempts/:attemptId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const params = attemptParamsSchema.parse(req.params ?? {})

    const attempt = await prisma.testAttempt.findFirst({
      where: { id: params.attemptId, userId },
      select: { id: true },
    })

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found.' })
    }

    await prisma.testAttempt.delete({
      where: { id: attempt.id },
    })

    return res.status(204).send()
  }),
)

router.post(
  '/ai-report',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = aiReportBodySchema.parse(req.body ?? {})

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        nickname: true,
        role: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (!isPremiumUser({ role: user.role, email: user.email, nickname: user.nickname })) {
      return res.status(403).json({
        message: 'AI Analysis is available for Premium users only.',
      })
    }

    try {
      const report = await generateAiCoachReport({
        userId,
        refresh: payload.refresh ?? false,
      })
      return res.json(report)
    } catch (error) {
      if (isAiCoachProviderError(error)) {
        return res.status(error.statusCode).json({ message: error.message })
      }
      throw error
    }
  }),
)

router.post(
  '/ai-chat',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = aiChatBodySchema.parse(req.body ?? {})

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        nickname: true,
        role: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (!isPremiumUser({ role: user.role, email: user.email, nickname: user.nickname })) {
      return res.status(403).json({
        message: 'AI Copilot is available for Premium users only.',
      })
    }

    const response = await generateAiChatResponse(userId, {
      message: payload.message,
      history: payload.history,
      locale: payload.locale,
      contextMode: payload.contextMode,
      uiContext: payload.uiContext,
    })

    return res.json(response)
  }),
)

router.get(
  '/ai-preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (!isAiPreferenceModelReady()) {
      const fallbackPreference = fallbackAiPreferenceStore.get(userId)
      return res.json({
        preferredLocale: fallbackPreference?.preferredLocale ?? 'en',
        preferredName: fallbackPreference?.preferredName ?? parsePreferredName(user.fullName),
        toneStyle: fallbackPreference?.toneStyle ?? 'sweet',
        lastAssistantLanguage:
          fallbackPreference?.lastAssistantLanguage ?? fallbackPreference?.preferredLocale ?? 'en',
        updatedAt: fallbackPreference?.updatedAt ?? null,
      })
    }

    let preference: any = null
    try {
      preference = await aiPreferenceModel!.findUnique!({
        where: { userId },
        select: {
          preferredLocale: true,
          preferredName: true,
          toneStyle: true,
          lastAssistantLanguage: true,
          updatedAt: true,
        },
      })
    } catch {
      const fallbackPreference = fallbackAiPreferenceStore.get(userId)
      return res.json({
        preferredLocale: fallbackPreference?.preferredLocale ?? 'en',
        preferredName: fallbackPreference?.preferredName ?? parsePreferredName(user.fullName),
        toneStyle: fallbackPreference?.toneStyle ?? 'sweet',
        lastAssistantLanguage:
          fallbackPreference?.lastAssistantLanguage ?? fallbackPreference?.preferredLocale ?? 'en',
        updatedAt: fallbackPreference?.updatedAt ?? null,
      })
    }

    return res.json({
      preferredLocale: preference?.preferredLocale ?? 'en',
      preferredName: preference?.preferredName ?? parsePreferredName(user.fullName),
      toneStyle: preference?.toneStyle ?? 'sweet',
      lastAssistantLanguage: preference?.lastAssistantLanguage ?? preference?.preferredLocale ?? 'en',
      updatedAt: preference?.updatedAt?.toISOString() ?? null,
    })
  }),
)

router.put(
  '/ai-preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = aiPreferenceBodySchema.parse(req.body ?? {})

    if (!isAiPreferenceModelReady()) {
      const existing = fallbackAiPreferenceStore.get(userId)
      const updatedFallback: FallbackAiPreference = {
        preferredLocale: payload.preferredLocale ?? existing?.preferredLocale ?? 'en',
        preferredName:
          payload.preferredName === null
            ? null
            : payload.preferredName ?? existing?.preferredName ?? null,
        toneStyle: payload.toneStyle ?? existing?.toneStyle ?? 'sweet',
        lastAssistantLanguage: payload.preferredLocale ?? existing?.lastAssistantLanguage ?? 'en',
        updatedAt: new Date().toISOString(),
      }
      fallbackAiPreferenceStore.set(userId, updatedFallback)
      return res.json(updatedFallback)
    }

    try {
      const updated = await aiPreferenceModel!.upsert!({
        where: { userId },
        update: {
          preferredLocale: payload.preferredLocale ?? undefined,
          preferredName: payload.preferredName === null ? null : payload.preferredName ?? undefined,
          toneStyle: payload.toneStyle ?? undefined,
          lastAssistantLanguage: payload.preferredLocale ?? undefined,
        },
        create: {
          userId,
          preferredLocale: payload.preferredLocale ?? 'en',
          preferredName: payload.preferredName === null ? null : payload.preferredName ?? undefined,
          toneStyle: payload.toneStyle ?? 'sweet',
          lastAssistantLanguage: payload.preferredLocale ?? 'en',
        },
        select: {
          preferredLocale: true,
          preferredName: true,
          toneStyle: true,
          lastAssistantLanguage: true,
          updatedAt: true,
        },
      })

      return res.json(updated)
    } catch {
      const existing = fallbackAiPreferenceStore.get(userId)
      const updatedFallback: FallbackAiPreference = {
        preferredLocale: payload.preferredLocale ?? existing?.preferredLocale ?? 'en',
        preferredName:
          payload.preferredName === null
            ? null
            : payload.preferredName ?? existing?.preferredName ?? null,
        toneStyle: payload.toneStyle ?? existing?.toneStyle ?? 'sweet',
        lastAssistantLanguage: payload.preferredLocale ?? existing?.lastAssistantLanguage ?? 'en',
        updatedAt: new Date().toISOString(),
      }
      fallbackAiPreferenceStore.set(userId, updatedFallback)
      return res.json(updatedFallback)
    }
  }),
)

router.get(
  '/vocab-notebook',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const query = vocabNotebookQuerySchema.parse(req.query ?? {})

    if (!isVocabModelReady()) {
      const items = getFallbackNotebooks(userId)
        .filter((item) => (query.testKey ? item.testKey === query.testKey : true))
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      return res.json({ items })
    }

    try {
      const notebooks = await vocabularyNotebookModel!.findMany!({
        where: {
          userId,
          ...(query.testKey ? { testKey: query.testKey } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          items: {
            orderBy: [{ createdAt: 'desc' }],
          },
        },
      })

      return res.json({
        items: notebooks,
      })
    } catch {
      const items = getFallbackNotebooks(userId)
        .filter((item) => (query.testKey ? item.testKey === query.testKey : true))
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      return res.json({ items })
    }
  }),
)

router.post(
  '/vocab-notebook',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = vocabNotebookCreateSchema.parse(req.body ?? {})

    if (!isVocabModelReady()) {
      const nowIso = new Date().toISOString()
      const existingItems = getFallbackNotebooks(userId)
      const existing = existingItems.find((item) => item.testKey === payload.testKey)
      const preference = fallbackAiPreferenceStore.get(userId)

      if (existing) {
        existing.title = payload.title
        existing.locale = payload.locale ?? existing.locale
        existing.updatedAt = nowIso
        fallbackVocabularyStore.set(userId, [...existingItems])
        return res.status(201).json(existing)
      }

      const notebook: FallbackVocabularyNotebook = {
        id: createFallbackId('nb'),
        userId,
        preferenceId: null,
        testKey: payload.testKey,
        title: payload.title,
        locale: payload.locale ?? preference?.preferredLocale ?? 'en',
        createdAt: nowIso,
        updatedAt: nowIso,
        items: [],
      }
      fallbackVocabularyStore.set(userId, [notebook, ...existingItems])
      return res.status(201).json(notebook)
    }

    const preference =
      isAiPreferenceModelReady()
        ? await aiPreferenceModel!.findUnique!({
            where: { userId },
            select: { id: true },
          })
        : null

    const notebook = await vocabularyNotebookModel!.upsert!({
      where: {
        userId_testKey: {
          userId,
          testKey: payload.testKey,
        },
      },
      update: {
        title: payload.title,
        locale: payload.locale ?? undefined,
      },
      create: {
        userId,
        preferenceId: preference?.id ?? null,
        testKey: payload.testKey,
        title: payload.title,
        locale: payload.locale ?? 'en',
      },
      include: {
        items: {
          orderBy: [{ createdAt: 'desc' }],
        },
      },
    })

    return res.status(201).json(notebook)
  }),
)

router.patch(
  '/vocab-notebook/:notebookId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = vocabNotebookUpdateSchema.parse(req.body ?? {})

    if (!isVocabModelReady()) {
      const current = getFallbackNotebooks(userId)
      const target = current.find((item) => item.id === req.params.notebookId)
      if (!target) {
        return res.status(404).json({ message: 'Vocabulary notebook not found.' })
      }
      target.title = payload.title ?? target.title
      target.locale = payload.locale ?? target.locale
      target.updatedAt = new Date().toISOString()
      fallbackVocabularyStore.set(userId, [...current])
      return res.json(target)
    }

    const notebook = await vocabularyNotebookModel!.findFirst!({
      where: { id: req.params.notebookId, userId },
      select: { id: true },
    })

    if (!notebook) {
      return res.status(404).json({ message: 'Vocabulary notebook not found.' })
    }

    const updated = await vocabularyNotebookModel!.update!({
      where: { id: notebook.id },
      data: {
        title: payload.title ?? undefined,
        locale: payload.locale ?? undefined,
      },
      include: {
        items: {
          orderBy: [{ createdAt: 'desc' }],
        },
      },
    })

    return res.json(updated)
  }),
)

router.delete(
  '/vocab-notebook/:notebookId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id

    if (!isVocabModelReady()) {
      const current = getFallbackNotebooks(userId)
      const next = current.filter((item) => item.id !== req.params.notebookId)
      if (next.length === current.length) {
        return res.status(404).json({ message: 'Vocabulary notebook not found.' })
      }
      fallbackVocabularyStore.set(userId, next)
      return res.status(204).send()
    }

    const notebook = await vocabularyNotebookModel!.findFirst!({
      where: { id: req.params.notebookId, userId },
      select: { id: true },
    })

    if (!notebook) {
      return res.status(404).json({ message: 'Vocabulary notebook not found.' })
    }

    await vocabularyNotebookModel!.delete!({
      where: { id: notebook.id },
    })

    return res.status(204).send()
  }),
)

router.post(
  '/vocab-notebook/:notebookId/items',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = vocabItemCreateSchema.parse(req.body ?? {})

    if (!isVocabModelReady()) {
      const current = getFallbackNotebooks(userId)
      const notebook = current.find((item) => item.id === req.params.notebookId)
      if (!notebook) {
        return res.status(404).json({ message: 'Vocabulary notebook not found.' })
      }
      const nowIso = new Date().toISOString()
      const item: FallbackVocabularyNotebookItem = {
        id: createFallbackId('vb'),
        notebookId: notebook.id,
        term: payload.term,
        meaning: payload.meaning,
        notes: payload.notes ?? null,
        sourceLang: payload.sourceLang ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
      notebook.items = [item, ...notebook.items]
      notebook.updatedAt = nowIso
      fallbackVocabularyStore.set(userId, [...current])
      return res.status(201).json(item)
    }

    const notebook = await vocabularyNotebookModel!.findFirst!({
      where: { id: req.params.notebookId, userId },
      select: { id: true },
    })

    if (!notebook) {
      return res.status(404).json({ message: 'Vocabulary notebook not found.' })
    }

    const item = await vocabularyItemModel!.create!({
      data: {
        notebookId: notebook.id,
        term: payload.term,
        meaning: payload.meaning,
        notes: payload.notes,
        sourceLang: payload.sourceLang,
      },
    })

    return res.status(201).json(item)
  }),
)

router.patch(
  '/vocab-notebook/items/:itemId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = vocabItemUpdateSchema.parse(req.body ?? {})

    if (!isVocabModelReady()) {
      const current = getFallbackNotebooks(userId)
      let targetItem: FallbackVocabularyNotebookItem | null = null
      for (const notebook of current) {
        const found = notebook.items.find((item) => item.id === req.params.itemId)
        if (found) {
          targetItem = found
          break
        }
      }
      if (!targetItem) {
        return res.status(404).json({ message: 'Vocabulary item not found.' })
      }
      targetItem.term = payload.term ?? targetItem.term
      targetItem.meaning = payload.meaning ?? targetItem.meaning
      targetItem.notes = payload.notes === null ? null : payload.notes ?? targetItem.notes
      targetItem.sourceLang =
        payload.sourceLang === null ? null : payload.sourceLang ?? targetItem.sourceLang
      targetItem.updatedAt = new Date().toISOString()
      fallbackVocabularyStore.set(userId, [...current])
      return res.json(targetItem)
    }

    const item = await vocabularyItemModel!.findFirst!({
      where: {
        id: req.params.itemId,
        notebook: {
          userId,
        },
      },
      select: { id: true },
    })

    if (!item) {
      return res.status(404).json({ message: 'Vocabulary item not found.' })
    }

    const updated = await vocabularyItemModel!.update!({
      where: { id: item.id },
      data: {
        term: payload.term ?? undefined,
        meaning: payload.meaning ?? undefined,
        notes: payload.notes === null ? null : payload.notes ?? undefined,
        sourceLang: payload.sourceLang === null ? null : payload.sourceLang ?? undefined,
      },
    })

    return res.json(updated)
  }),
)

router.delete(
  '/vocab-notebook/items/:itemId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id

    if (!isVocabModelReady()) {
      const current = getFallbackNotebooks(userId)
      let found = false
      for (const notebook of current) {
        const nextItems = notebook.items.filter((item) => item.id !== req.params.itemId)
        if (nextItems.length !== notebook.items.length) {
          notebook.items = nextItems
          notebook.updatedAt = new Date().toISOString()
          found = true
          break
        }
      }
      if (!found) {
        return res.status(404).json({ message: 'Vocabulary item not found.' })
      }
      fallbackVocabularyStore.set(userId, [...current])
      return res.status(204).send()
    }

    const item = await vocabularyItemModel!.findFirst!({
      where: {
        id: req.params.itemId,
        notebook: {
          userId,
        },
      },
      select: { id: true },
    })

    if (!item) {
      return res.status(404).json({ message: 'Vocabulary item not found.' })
    }

    await vocabularyItemModel!.delete!({
      where: { id: item.id },
    })

    return res.status(204).send()
  }),
)

router.post(
  '/ai-realtime/session',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = aiRealtimeSessionSchema.parse(req.body ?? {})

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        nickname: true,
        role: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (!isPremiumUser({ role: user.role, email: user.email, nickname: user.nickname })) {
      return res.status(403).json({
        message: 'Realtime speaking is available for Premium users only.',
      })
    }

    if (!env.OPENAI_API_KEY.trim()) {
      return res.status(503).json({
        message: 'Realtime provider is not configured yet.',
      })
    }

    const instructions =
      payload.mode === 'mock'
        ? 'You are an IELTS speaking examiner. Speak only in English, run Part 1/2/3 flow, and provide brief corrective feedback between turns.'
        : 'You are a friendly English speaking partner. Speak only in English, keep answers natural, and adapt to user topic quickly.'

    const response = await fetch(`${env.OPENAI_API_BASE.replace(/\/$/, '')}/realtime/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_REALTIME_MODEL,
        voice: 'alloy',
        modalities: ['audio', 'text'],
        instructions,
        metadata: {
          mode: payload.mode ?? 'conversation',
          part: payload.part ?? null,
          product: 'smarttest-ai-coach',
        },
      }),
    })

    if (!response.ok) {
      const providerMessage = await response.text().catch(() => '')
      return res.status(502).json({
        message: `Realtime session failed: ${providerMessage || 'provider rejected request'}`,
      })
    }

    const session = await response.json().catch(() => null)
    if (!session) {
      return res.status(502).json({
        message: 'Realtime provider returned invalid JSON.',
      })
    }

    return res.status(201).json({
      session,
      provider: 'openai',
      model: env.OPENAI_REALTIME_MODEL,
      mode: payload.mode ?? 'conversation',
      part: payload.part ?? null,
    })
  }),
)

router.get(
  '/speaking/questions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const query = speakingQuestionsQuerySchema.parse(req.query ?? {})
    const limit = query.limit ?? 12

    if (!isSpeakingQuestionModelReady()) {
      const filtered = fallbackSpeakingQuestionBank
        .filter((item) => (query.part ? item.part === query.part : true))
        .slice(0, limit)
      return res.json({ items: filtered })
    }

    try {
      const items = await speakingQuestionModel!.findMany!({
        where: {
          isActive: true,
          ...(query.part ? { part: query.part } : {}),
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: limit,
        select: {
          id: true,
          part: true,
          prompt: true,
          sourceType: true,
          sourceLabel: true,
        },
      })

      if (items.length > 0) {
        return res.json({ items })
      }

      const filtered = fallbackSpeakingQuestionBank
        .filter((item) => (query.part ? item.part === query.part : true))
        .slice(0, limit)
      return res.json({ items: filtered })
    } catch {
      const filtered = fallbackSpeakingQuestionBank
        .filter((item) => (query.part ? item.part === query.part : true))
        .slice(0, limit)
      return res.json({ items: filtered })
    }
  }),
)

router.post(
  '/speaking-evaluate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = speakingEvaluateSchema.parse(req.body ?? {})
    const transcript = payload.transcript.trim()

    const latinLetterCount = (transcript.match(/[A-Za-z]/g) ?? []).length
    const letterCount = (transcript.match(/[A-Za-zА-Яа-я]/g) ?? []).length
    if (letterCount > 0 && latinLetterCount / letterCount < 0.6) {
      return res.status(400).json({
        message: 'Speaking Coach accepts English responses only.',
      })
    }

    const evaluation = buildSpeakingEvaluation(transcript, payload.pronunciationSignal)
    if (!isSpeakingModelReady()) {
      return res.status(201).json({
        id: createFallbackId('spk'),
        overallBand: evaluation.overallBand,
        fluencyBand: evaluation.fluencyBand,
        grammarBand: evaluation.grammarBand,
        pronunciationBand: evaluation.pronunciationBand,
        lexicalBand: evaluation.lexicalBand,
        feedback: {
          ...evaluation.feedback,
          taskLabel: payload.taskLabel ?? 'IELTS Speaking',
          transcriptLocale: payload.transcriptLocale ?? 'en',
        },
        createdAt: new Date().toISOString(),
      })
    }

    const preference =
      isAiPreferenceModelReady()
        ? await aiPreferenceModel!.findUnique!({
            where: { userId },
            select: { id: true },
          })
        : null

    try {
      const record = await speakingEvaluationModel!.create!({
        data: {
          userId,
          preferenceId: preference?.id ?? null,
          transcript,
          overallBand: evaluation.overallBand,
          fluencyBand: evaluation.fluencyBand,
          grammarBand: evaluation.grammarBand,
          pronunciationBand: evaluation.pronunciationBand,
          lexicalBand: evaluation.lexicalBand,
          feedback: {
            ...evaluation.feedback,
            taskLabel: payload.taskLabel ?? 'IELTS Speaking',
            transcriptLocale: payload.transcriptLocale ?? 'en',
          },
        },
        select: {
          id: true,
          overallBand: true,
          fluencyBand: true,
          grammarBand: true,
          pronunciationBand: true,
          lexicalBand: true,
          feedback: true,
          createdAt: true,
        },
      })

      return res.status(201).json(record)
    } catch {
      return res.status(201).json({
        id: createFallbackId('spk'),
        overallBand: evaluation.overallBand,
        fluencyBand: evaluation.fluencyBand,
        grammarBand: evaluation.grammarBand,
        pronunciationBand: evaluation.pronunciationBand,
        lexicalBand: evaluation.lexicalBand,
        feedback: {
          ...evaluation.feedback,
          taskLabel: payload.taskLabel ?? 'IELTS Speaking',
          transcriptLocale: payload.transcriptLocale ?? 'en',
        },
        createdAt: new Date().toISOString(),
      })
    }
  }),
)

// ── Nickname + speaking community (public, nickname-only — never exposes email) ─
const ONLINE_WINDOW_MS = 3 * 60 * 1000
const NICKNAME_RE = /^[A-Za-z][A-Za-z0-9_]{2,19}$/

const nicknameSetSchema = z.object({
  nickname: z.string().trim().regex(NICKNAME_RE),
})

const speakingSessionSchema = z.object({
  mode: z.string().max(40),
  modeLabel: z.string().max(80),
  overallBand: z.coerce.number().min(0).max(9),
  fluencyBand: z.coerce.number().min(0).max(9),
  lexicalBand: z.coerce.number().min(0).max(9),
  grammarBand: z.coerce.number().min(0).max(9),
  pronunciationBand: z.coerce.number().min(0).max(9),
  durationSec: z.coerce.number().int().min(0).max(36000),
  wordCount: z.coerce.number().int().min(0).max(100000),
})

function isOnline(lastActiveDate: Date | null) {
  return lastActiveDate ? Date.now() - new Date(lastActiveDate).getTime() < ONLINE_WINDOW_MS : false
}

router.get(
  '/nickname/check',
  requireAuth,
  asyncHandler(async (req, res) => {
    const value = String(req.query.value ?? '').trim()
    if (!NICKNAME_RE.test(value)) {
      return res.json({ available: false, reason: 'invalid' })
    }
    const existing = await prisma.user.findFirst({
      where: { nickname: { equals: value, mode: 'insensitive' }, NOT: { id: req.user!.id } },
      select: { id: true },
    })
    return res.json({ available: !existing })
  }),
)

router.put(
  '/nickname',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { nickname } = nicknameSetSchema.parse(req.body ?? {})
    const taken = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' }, NOT: { id: req.user!.id } },
      select: { id: true },
    })
    if (taken) return res.status(409).json({ message: 'That nickname is already taken.' })
    try {
      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: { nickname },
        select: { nickname: true },
      })
      return res.json(updated)
    } catch {
      return res.status(409).json({ message: 'That nickname is already taken.' })
    }
  }),
)

router.post(
  '/heartbeat',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.user!.id }, data: { lastActiveDate: new Date() } }).catch(() => {})
    return res.status(204).send()
  }),
)

router.post(
  '/speaking/session',
  requireAuth,
  asyncHandler(async (req, res) => {
    const data = speakingSessionSchema.parse(req.body ?? {})
    const session = await prisma.speakingSession.create({
      data: { userId: req.user!.id, ...data },
      select: { id: true, createdAt: true },
    })
    await prisma.user.update({ where: { id: req.user!.id }, data: { lastActiveDate: new Date() } }).catch(() => {})
    return res.status(201).json(session)
  }),
)

// Only users who have actually used the speaking studio. Nickname + presence only.
router.get(
  '/speaking/community',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const grouped = await prisma.speakingSession.groupBy({
      by: ['userId'],
      _count: { _all: true },
      _avg: { overallBand: true },
      _sum: { durationSec: true },
      _max: { createdAt: true },
    })
    const users = await prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, nickname: true, fullName: true, lastActiveDate: true, currentStreak: true },
    })
    const speakers = grouped
      .map((g) => {
        const u = users.find((x) => x.id === g.userId)
        if (!u) return null
        return {
          id: u.id,
          nickname: u.nickname,
          displayName: u.nickname ?? u.fullName,
          online: isOnline(u.lastActiveDate),
          lastSeen: u.lastActiveDate,
          streak: u.currentStreak,
          sessionCount: g._count._all,
          averageBand: g._avg.overallBand ? Math.round(g._avg.overallBand * 10) / 10 : 0,
          totalMinutes: Math.round((g._sum.durationSec ?? 0) / 60),
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.averageBand - a.averageBand || b.totalMinutes - a.totalMinutes)
    return res.json({ speakers })
  }),
)

// Public speaker profile by nickname — returns real speaking data, never the email.
router.get(
  '/speaking/by-nickname/:nickname',
  requireAuth,
  asyncHandler(async (req, res) => {
    const nickname = String(req.params.nickname ?? '').trim()
    const user = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' } },
      select: {
        id: true, nickname: true, fullName: true, lastActiveDate: true,
        currentStreak: true, longestStreak: true, level: true, xp: true, createdAt: true,
      },
    })
    if (!user) return res.status(404).json({ message: 'Speaker not found.' })

    const sessions = await prisma.speakingSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, modeLabel: true, overallBand: true, fluencyBand: true, lexicalBand: true,
        grammarBand: true, pronunciationBand: true, durationSec: true, wordCount: true, createdAt: true,
      },
    })

    // Real speaking rank: position among all speakers by average band.
    const grouped = await prisma.speakingSession.groupBy({ by: ['userId'], _avg: { overallBand: true } })
    const myAvg = sessions.length ? sessions.reduce((a, s) => a + s.overallBand, 0) / sessions.length : 0
    const rank = 1 + grouped.filter((g) => (g._avg.overallBand ?? 0) > myAvg).length

    return res.json({
      profile: {
        id: user.id,
        nickname: user.nickname,
        displayName: user.nickname ?? user.fullName,
        online: isOnline(user.lastActiveDate),
        lastSeen: user.lastActiveDate,
        streak: user.currentStreak,
        longestStreak: user.longestStreak,
        level: user.level,
        xp: user.xp,
        memberSince: user.createdAt,
        rank: sessions.length ? rank : null,
        totalSpeakers: grouped.length,
      },
      sessions,
    })
  }),
)

// ── Extended profile: account fields, avatar, badges, search, public profile ───
// Permanently stored so a learner's identity, exam targets and earned skill badges
// survive across devices and can power their public profile. The email is NEVER
// returned to anyone but the owner.

const EXAM_TARGETS = ['IELTS', 'SAT', 'BOTH'] as const
const SKILL_TRACKS = [
  'IELTS_LISTENING',
  'IELTS_READING',
  'IELTS_WRITING',
  'IELTS_SPEAKING',
  'SAT_MATH',
  'SAT_ENGLISH',
  'SAT_OVERALL',
] as const

const accountUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  gender: z.enum(['FEMALE', 'MALE', 'PREFER_NOT_TO_SAY']).nullable().optional(),
  gradeLevel: z.string().trim().max(40).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  timezone: z.string().trim().max(80).nullable().optional(),
  targetExam: z.enum(EXAM_TARGETS).nullable().optional(),
  targetScore: z.string().trim().max(40).nullable().optional(),
  examDate: z.string().trim().max(40).nullable().optional(),
  targetCountries: z.array(z.string().trim().min(2).max(80)).max(8).optional(),
  currentIeltsScore: z.coerce.number().min(0).max(9).nullable().optional(),
  targetIeltsScore: z.coerce.number().min(0).max(9).nullable().optional(),
  currentSatScore: z.coerce.number().int().min(400).max(1600).nullable().optional(),
  targetSatScore: z.coerce.number().int().min(400).max(1600).nullable().optional(),
  dailyStudyHours: z.coerce.number().int().min(1).max(12).nullable().optional(),
  onboardingCompletedAt: z.string().datetime().nullable().optional(),
  bio: z.string().trim().max(600).nullable().optional(),
  fieldOfStudy: z.string().trim().max(120).nullable().optional(),
  gpa: z.string().trim().max(20).nullable().optional(),
  degreeLevel: z.string().trim().max(40).nullable().optional(),
  budgetUsd: z.coerce.number().int().min(0).max(2_000_000).nullable().optional(),
  targetUniversitySlug: z.string().trim().max(120).nullable().optional(),
  isPublic: z.boolean().optional(),
  showResults: z.boolean().optional(),
  showLeaderboard: z.boolean().optional(),
  showUniversity: z.boolean().optional(),
  showBadges: z.boolean().optional(),
})

const PROFILE_DEFAULTS = {
  gender: null,
  gradeLevel: null,
  phone: null,
  country: null,
  timezone: null,
  targetExam: null,
  targetScore: null,
  examDate: null,
  targetCountries: [],
  currentIeltsScore: null,
  targetIeltsScore: null,
  currentSatScore: null,
  targetSatScore: null,
  dailyStudyHours: null,
  onboardingCompletedAt: null,
  bio: null,
  fieldOfStudy: null,
  gpa: null,
  degreeLevel: null,
  budgetUsd: null,
  targetUniversitySlug: null,
  isPublic: true,
  showResults: true,
  showLeaderboard: true,
  showUniversity: true,
  showBadges: true,
}

function serializeProfile(profile: Record<string, any> | null) {
  if (!profile) return { ...PROFILE_DEFAULTS }
  return {
    gender: profile.gender ?? null,
    gradeLevel: profile.gradeLevel ?? null,
    phone: profile.phone ?? null,
    country: profile.country ?? null,
    timezone: profile.timezone ?? null,
    targetExam: profile.targetExam ?? null,
    targetScore: profile.targetScore ?? null,
    examDate: profile.examDate ?? null,
    targetCountries: Array.isArray(profile.targetCountries) ? profile.targetCountries : [],
    currentIeltsScore: profile.currentIeltsScore ?? null,
    targetIeltsScore: profile.targetIeltsScore ?? null,
    currentSatScore: profile.currentSatScore ?? null,
    targetSatScore: profile.targetSatScore ?? null,
    dailyStudyHours: profile.dailyStudyHours ?? null,
    onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString?.() ?? profile.onboardingCompletedAt ?? null,
    bio: profile.bio ?? null,
    fieldOfStudy: profile.fieldOfStudy ?? null,
    gpa: profile.gpa ?? null,
    degreeLevel: profile.degreeLevel ?? null,
    budgetUsd: profile.budgetUsd ?? null,
    targetUniversitySlug: profile.targetUniversitySlug ?? null,
    isPublic: profile.isPublic ?? true,
    showResults: profile.showResults ?? true,
    showLeaderboard: profile.showLeaderboard ?? true,
    showUniversity: profile.showUniversity ?? true,
    showBadges: profile.showBadges ?? true,
  }
}

function tierForBand(band: number) {
  return Math.max(6, Math.min(9, Math.floor(band)))
}

function tierForAchievement(track: (typeof SKILL_TRACKS)[number], score: number) {
  if (track === 'SAT_OVERALL') {
    if (score >= 1600) return 9
    if (score >= 1550) return 8
    if (score >= 1500) return 7
    return 6
  }
  return tierForBand(score)
}

router.get(
  '/account',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const [user, profile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true, nickname: true, avatarUrl: true, level: true, xp: true, createdAt: true },
      }),
      prisma.userProfile.findUnique({ where: { userId } }),
    ])
    if (!user) return res.status(404).json({ message: 'User not found.' })
    return res.json({
      fullName: user.fullName,
      email: user.email,
      nickname: user.nickname ?? null,
      avatarUrl: user.avatarUrl ?? null,
      level: user.level,
      xp: user.xp,
      memberSince: user.createdAt,
      profile: serializeProfile(profile),
    })
  }),
)

router.put(
  '/account',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const { fullName, onboardingCompletedAt, ...profileData } = accountUpdateSchema.parse(req.body ?? {})
    const data = {
      ...profileData,
      ...(onboardingCompletedAt !== undefined
        ? { onboardingCompletedAt: onboardingCompletedAt ? new Date(onboardingCompletedAt) : null }
        : {}),
    }
    if (fullName) {
      await prisma.user.update({ where: { id: userId }, data: { fullName } })
    }
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })
    return res.json({ fullName, profile: serializeProfile(profile) })
  }),
)

const avatarSchema = z.object({
  dataUrl: z.string().min(1).max(700_000),
})

router.post(
  '/avatar',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { dataUrl } = avatarSchema.parse(req.body ?? {})
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(dataUrl)) {
      return res.status(400).json({ message: 'Avatar must be a PNG, JPEG, WEBP or GIF data URL.' })
    }
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: dataUrl },
      select: { avatarUrl: true },
    })
    return res.json(updated)
  }),
)

router.delete(
  '/avatar',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.user!.id }, data: { avatarUrl: null } })
    return res.status(204).send()
  }),
)

const badgeUpsertSchema = z.object({
  track: z.enum(SKILL_TRACKS),
  band: z.coerce.number().min(0).max(1600),
  source: z.string().max(40).optional(),
})
const badgePinSchema = z.object({
  id: z.string().min(1).max(191),
  pinned: z.boolean(),
})

router.get(
  '/badges',
  requireAuth,
  asyncHandler(async (req, res) => {
    const badges = await prisma.skillBadge.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ track: 'asc' }, { tier: 'desc' }],
    })
    return res.json({ badges })
  }),
)

router.post(
  '/badges',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { track, band, source } = badgeUpsertSchema.parse(req.body ?? {})
    if (track === 'SAT_OVERALL' ? band < 1400 : band < 7 || band > 9) {
      return res.status(400).json({
        message: track === 'SAT_OVERALL'
          ? 'SAT achievements are awarded for complete mock scores of 1400 and above only.'
          : 'IELTS achievements are awarded for band 7.0 and above only.',
      })
    }
    const tier = tierForAchievement(track, band)
    const existing = await prisma.skillBadge.findUnique({
      where: { userId_track_tier: { userId: req.user!.id, track, tier } },
    })
    let badge = existing
    let isNew = false
    if (existing) {
      if (band > existing.band) {
        badge = await prisma.skillBadge.update({
          where: { id: existing.id },
          data: { band, source: source ?? existing.source },
        })
      }
    } else {
      isNew = true
      badge = await prisma.skillBadge.create({
        data: { userId: req.user!.id, track, tier, band, source: source ?? null, pinned: false },
      })
    }
    return res.status(isNew ? 201 : 200).json({ badge, isNew })
  }),
)

router.patch(
  '/badges/pin',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id, pinned } = badgePinSchema.parse(req.body ?? {})
    const owned = await prisma.skillBadge.findFirst({ where: { id, userId: req.user!.id }, select: { id: true } })
    if (!owned) return res.status(404).json({ message: 'Badge not found.' })
    const badge = await prisma.skillBadge.update({ where: { id: owned.id }, data: { pinned } })
    return res.json({ badge })
  }),
)

router.delete(
  '/badges/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const owned = await prisma.skillBadge.findFirst({
      where: { id: String(req.params.id), userId: req.user!.id },
      select: { id: true },
    })
    if (!owned) return res.status(404).json({ message: 'Badge not found.' })
    await prisma.skillBadge.delete({ where: { id: owned.id } })
    return res.status(204).send()
  }),
)

const searchQuerySchema = z.object({
  q: z.string().trim().max(40).default(''),
  targetExam: z.enum(['IELTS', 'SAT']).optional(),
  country: z.string().trim().max(80).optional(),
  online: z.coerce.boolean().optional(),
})

router.get(
  '/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { q, targetExam, country, online } = searchQuerySchema.parse(req.query ?? {})
    const activeSince = new Date(Date.now() - 3 * 60 * 1000)
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user!.id },
        ...(q ? { nickname: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(online ? { lastActiveDate: { gte: activeSince } } : {}),
        ...((targetExam || country)
          ? {
              profile: {
                is: {
                  isPublic: true,
                  ...(targetExam ? { targetExam } : {}),
                  ...(country ? { country: { equals: country, mode: 'insensitive' as const } } : {}),
                },
              },
            }
          : {}),
        OR: [{ profile: { is: null } }, { profile: { isPublic: true } }],
      },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        level: true,
        xp: true,
        currentStreak: true,
        lastActiveDate: true,
        profile: {
          select: {
            country: true,
            targetExam: true,
            targetScore: true,
            targetUniversitySlug: true,
          },
        },
        _count: { select: { skillBadges: true } },
      },
      take: 24,
      orderBy: { xp: 'desc' },
    })

    // Prefer the validated rolling seven-day winner, but never let the community
    // crown disappear during a quiet week. LeaderboardState keeps the last
    // confirmed rank-one learner until a newly calculated board replaces them.
    const weeklyBoard = await generateLeaderboard({
      period: 'week',
      currentUserId: req.user!.id,
    }).catch(() => null)
    const visibleUserIds = new Set(users.map((user) => user.id))
    const liveChampion = weeklyBoard?.weeklyPremiumWinner
    const visibleWeeklyLeader = liveChampion && visibleUserIds.has(liveChampion.userId)
      ? liveChampion
      : weeklyBoard?.rows.find((row) => visibleUserIds.has(row.userId)) ?? null

    const persistedChampion = visibleWeeklyLeader
      ? null
      : await prisma.leaderboardState.findFirst({
          where: {
            period: 'WEEK',
            categoryKey: 'ALL',
            rank: 1,
            userId: { in: [...visibleUserIds] },
          },
          orderBy: { updatedAt: 'desc' },
          select: { userId: true, score: true },
        })

    // A brand-new installation may not have leaderboard history yet. In that
    // case the highest-XP public learner owns the crown until real weekly data
    // produces a replacement.
    const fallbackChampion = users[0] ?? null
    const weeklyChampionId = visibleWeeklyLeader?.userId
      ?? persistedChampion?.userId
      ?? fallbackChampion?.id
      ?? null
    const weeklyChampionScore = visibleWeeklyLeader?.rankingScore
      ?? persistedChampion?.score
      ?? fallbackChampion?.xp
      ?? 0

    return res.json({
      results: users.map((u) => ({
        nickname: u.nickname,
        avatarUrl: u.avatarUrl ?? null,
        level: u.level,
        xp: u.xp,
        streak: u.currentStreak,
        badgeCount: u._count.skillBadges,
        country: u.profile?.country ?? null,
        targetExam: u.profile?.targetExam ?? null,
        targetScore: u.profile?.targetScore ?? null,
        targetUniversitySlug: u.profile?.targetUniversitySlug ?? null,
        online: Boolean(u.lastActiveDate && u.lastActiveDate >= activeSince),
        weeklyChampion: u.id === weeklyChampionId,
        weeklyScore: u.id === weeklyChampionId ? weeklyChampionScore : 0,
      })),
    })
  }),
)

// Public profile by nickname — respects per-section privacy flags, never the email.
router.get(
  '/public/:nickname',
  requireAuth,
  asyncHandler(async (req, res) => {
    const nickname = String(req.params.nickname ?? '').trim()
    const user = await prisma.user.findFirst({
      where: { nickname: { equals: nickname, mode: 'insensitive' } },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        level: true,
        xp: true,
        currentStreak: true,
        longestStreak: true,
        lastActiveDate: true,
        createdAt: true,
        profile: true,
      },
    })
    if (!user) return res.status(404).json({ message: 'Profile not found.' })

    const profile = serializeProfile(user.profile as Record<string, any> | null)
    const isSelf = user.id === req.user!.id
    if (!profile.isPublic && !isSelf) {
      return res.status(403).json({ message: 'This profile is private.' })
    }

    // Heavy analytics are best-effort: a failure must not break the profile page.
    const [skillAnalytics, leaderboard, attemptsAgg, attemptsCount, badges] = await Promise.all([
      generateSkillAnalytics(user.id).catch(() => null),
      generateLeaderboard({ period: 'all', currentUserId: user.id }).catch(() => null),
      prisma.testAttempt
        .aggregate({ where: { userId: user.id }, _avg: { finalScore: true, percentage: true } })
        .catch(() => null),
      prisma.testAttempt.count({ where: { userId: user.id } }).catch(() => 0),
      prisma.skillBadge.findMany({ where: { userId: user.id }, orderBy: [{ tier: 'desc' }] }).catch(() => []),
    ])
    const rankRow = leaderboard?.rows.find((row) => row.userId === user.id) ?? null

    return res.json({
      profile: {
        nickname: user.nickname,
        displayName: user.nickname ?? 'Learner',
        avatarUrl: user.avatarUrl ?? null,
        level: user.level,
        xp: user.xp,
        streak: user.currentStreak,
        longestStreak: user.longestStreak,
        memberSince: user.createdAt,
        online: isOnline(user.lastActiveDate),
        lastSeen: user.lastActiveDate,
        isSelf,
        bio: profile.bio,
        country: profile.country,
        fieldOfStudy: profile.fieldOfStudy,
      },
      visibility: {
        showResults: profile.showResults,
        showLeaderboard: profile.showLeaderboard,
        showUniversity: profile.showUniversity,
        showBadges: profile.showBadges,
      },
      stats: profile.showResults
        ? {
            totalAttempts: attemptsCount ?? 0,
            averageScore: Number((attemptsAgg?._avg.finalScore ?? 0).toFixed(1)),
            averageAccuracy: Number((attemptsAgg?._avg.percentage ?? 0).toFixed(1)),
          }
        : null,
      skillAnalytics: profile.showResults ? skillAnalytics : null,
      competitive:
        profile.showLeaderboard && rankRow
          ? {
              rank: rankRow.rank,
              division: rankRow.division,
              divisionLabel: rankRow.divisionLabel,
              rankingScore: rankRow.rankingScore,
            }
          : null,
      university: profile.showUniversity ? { slug: profile.targetUniversitySlug } : null,
      badges: profile.showBadges ? badges : [],
    })
  }),
)

export default router
