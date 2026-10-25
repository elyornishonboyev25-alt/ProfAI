import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const testIdSchema = z.string().trim().regex(/^[a-z0-9][a-z0-9-]{0,119}$/i)
const examSchema = z.enum(['SAT', 'IELTS'])

const standingQuerySchema = z.object({
  total: z.coerce.number().int().min(0).max(1600).optional(),
  rw: z.coerce.number().int().min(0).max(800).optional(),
  math: z.coerce.number().int().min(0).max(800).optional(),
})

const postSchema = z.object({
  body: z.string().trim().min(2).max(1500),
  questionRef: z.string().trim().max(40).regex(/^[a-z0-9:-]+$/i).optional(),
}).strict()

const postRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  message: { message: 'You are posting too quickly. Please wait a moment.' },
})

// Large embedded uploads stay on the profile page; lists use links and initials.
function listAvatar(user: { avatarUrl: string | null; googleAvatarUrl: string | null }) {
  const avatar = user.avatarUrl ?? user.googleAvatarUrl
  return avatar && avatar.length <= 200_000 ? avatar : null
}

function sectionScore(range: unknown) {
  if (!Array.isArray(range) || range.length !== 2) return null
  const [low, high] = range.map(Number)
  return Number.isFinite(low) && Number.isFinite(high) ? Math.round((low + high) / 20) * 10 : null
}

function percentile(values: number[], score: number | undefined) {
  if (score === undefined || !values.length) return null
  return Math.round((values.filter((value) => value <= score).length / values.length) * 1000) / 10
}

/** Each learner's first completed attempt is their test-day result. */
router.get(
  '/sat/:testId/standing',
  requireAuth,
  validateQuery(standingQuerySchema),
  asyncHandler(async (req, res) => {
    const parsedId = testIdSchema.safeParse(req.params.testId)
    if (!parsedId.success) return res.status(400).json({ message: 'Unknown test.' })
    const testId = parsedId.data
    const query = req.query as unknown as z.infer<typeof standingQuerySchema>
    const prefix = `sat-${testId}-`
    const results = await prisma.assessmentResult.findMany({
      where: { examType: 'SAT', sourceKey: { startsWith: prefix } },
      orderBy: { completedAt: 'asc' },
      take: 20_000,
      select: { userId: true, sourceKey: true, score: true, maxScore: true, breakdown: true, durationSec: true, completedAt: true },
    })
    const first = new Map<string, (typeof results)[number]>()
    for (const result of results) {
      // A longer test id shares the prefix; only `<prefix><timestamp>` belongs to this test.
      if (!/^\d+$/.test(result.sourceKey.slice(prefix.length))) continue
      if (!first.has(result.userId)) first.set(result.userId, result)
    }
    const attempts = [...first.values()].map((result) => {
      const breakdown = (result.breakdown ?? {}) as Record<string, unknown>
      return {
        userId: result.userId,
        total: Math.round(result.score),
        maxScore: result.maxScore,
        rw: sectionScore(breakdown.readingWritingRange),
        math: sectionScore(breakdown.mathRange),
        correct: Number(breakdown.correct) || 0,
        durationSec: result.durationSec,
        completedAt: result.completedAt,
      }
    })
    const ranked = [...attempts].sort((a, b) =>
      b.total - a.total || a.durationSec - b.durationSec || a.completedAt.getTime() - b.completedAt.getTime())
    const top = ranked.slice(0, 50)
    const me = ranked.findIndex((row) => row.userId === req.user!.id)
    const shown = new Set(top.map((row) => row.userId))
    if (me >= 0) shown.add(ranked[me].userId)
    const users = await prisma.user.findMany({
      where: { id: { in: [...shown] } },
      select: {
        id: true, fullName: true, nickname: true, avatarUrl: true, googleAvatarUrl: true,
        profile: { select: { showLeaderboard: true, country: true } },
      },
    })
    const byId = new Map(users.map((user) => [user.id, user]))
    const row = (entry: (typeof ranked)[number], index: number) => {
      const user = byId.get(entry.userId)
      const isMe = entry.userId === req.user!.id
      const visible = isMe || user?.profile?.showLeaderboard !== false
      return {
        rank: index + 1,
        name: visible ? user?.fullName?.trim() || user?.nickname || 'Ivygoo learner' : 'Private learner',
        nickname: visible ? user?.nickname ?? null : null,
        avatarUrl: visible && user ? listAvatar(user) : null,
        country: visible ? user?.profile?.country ?? null : null,
        total: entry.total,
        maxScore: entry.maxScore,
        rw: entry.rw,
        math: entry.math,
        correct: entry.correct,
        durationSec: entry.durationSec,
        completedAt: entry.completedAt.toISOString(),
        isMe,
      }
    }
    const values = (key: 'total' | 'rw' | 'math') =>
      attempts.map((entry) => entry[key]).filter((value): value is number => typeof value === 'number')
    return res.json({
      participants: attempts.length,
      percentiles: {
        total: percentile(values('total'), query.total),
        rw: percentile(values('rw'), query.rw),
        math: percentile(values('math'), query.math),
      },
      average: attempts.length ? Math.round(attempts.reduce((sum, entry) => sum + entry.total, 0) / attempts.length) : null,
      rows: top.map(row),
      me: me >= 0 ? row(ranked[me], me) : null,
    })
  }),
)

router.get(
  '/:exam/:testId/discussion',
  requireAuth,
  asyncHandler(async (req, res) => {
    const exam = examSchema.safeParse(req.params.exam.toUpperCase())
    const testId = testIdSchema.safeParse(req.params.testId)
    if (!exam.success || !testId.success) return res.status(400).json({ message: 'Unknown test.' })
    const posts = await prisma.testDiscussionPost.findMany({
      where: { exam: exam.data, testId: testId.data },
      orderBy: { createdAt: 'desc' },
      take: 150,
      include: { user: { select: { id: true, fullName: true, nickname: true, avatarUrl: true, googleAvatarUrl: true } } },
    })
    return res.json({
      posts: posts.map((post) => ({
        id: post.id,
        body: post.body,
        questionRef: post.questionRef,
        createdAt: post.createdAt.toISOString(),
        author: {
          name: post.user.fullName?.trim() || post.user.nickname || 'Ivygoo learner',
          nickname: post.user.nickname,
          avatarUrl: listAvatar(post.user),
        },
        mine: post.userId === req.user!.id,
        canDelete: post.userId === req.user!.id || req.user!.role === 'ADMIN',
      })),
    })
  }),
)

router.post(
  '/:exam/:testId/discussion',
  requireAuth,
  postRateLimit,
  validateBody(postSchema),
  asyncHandler(async (req, res) => {
    const exam = examSchema.safeParse(req.params.exam.toUpperCase())
    const testId = testIdSchema.safeParse(req.params.testId)
    if (!exam.success || !testId.success) return res.status(400).json({ message: 'Unknown test.' })
    const payload = req.body as z.infer<typeof postSchema>
    const post = await prisma.testDiscussionPost.create({
      data: { userId: req.user!.id, exam: exam.data, testId: testId.data, body: payload.body, questionRef: payload.questionRef ?? null },
      include: { user: { select: { fullName: true, nickname: true, avatarUrl: true, googleAvatarUrl: true } } },
    })
    return res.status(201).json({
      post: {
        id: post.id,
        body: post.body,
        questionRef: post.questionRef,
        createdAt: post.createdAt.toISOString(),
        author: {
          name: post.user.fullName?.trim() || post.user.nickname || 'Ivygoo learner',
          nickname: post.user.nickname,
          avatarUrl: listAvatar(post.user),
        },
        mine: true,
        canDelete: true,
      },
    })
  }),
)

router.delete(
  '/discussion/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await prisma.testDiscussionPost.findUnique({ where: { id: req.params.id }, select: { userId: true } })
    if (!post) return res.status(404).json({ message: 'Post not found.' })
    if (post.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You can delete only your own posts.' })
    }
    await prisma.testDiscussionPost.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  }),
)

export default router
