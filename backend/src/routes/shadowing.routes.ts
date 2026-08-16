import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireVideoSubmissionAccess } from '../middleware/videoSubmissionAccess.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { buildShadowingDraft, extractYouTubeId, ShadowingError } from '../services/shadowing.service.js'

const router = Router()

// The Prisma client gains `shadowingVideo` / `shadowingSegment` delegates only
// after `prisma generate` runs against the new schema. Accessing them through a
// runtime cast (the same pattern used by aiChat.service) keeps `tsc` happy in
// the meantime and avoids coupling to the generated types.
const prismaRuntime = prisma as unknown as Record<string, any>
const shadowingVideo = prismaRuntime.shadowingVideo

// Building a draft hits YouTube several times, so submissions get a tighter
// limit than the general API to keep things polite and abuse-resistant.
const submitRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many video submissions. Please wait a minute and try again.' },
})

const VIDEO_LIST_SELECT = {
  id: true,
  youtubeId: true,
  title: true,
  author: true,
  thumbnailUrl: true,
  durationSec: true,
  level: true,
  accent: true,
  topic: true,
  captionKind: true,
  language: true,
  segmentCount: true,
  wordCount: true,
  playCount: true,
  createdAt: true,
}

const submitSchema = z.object({
  url: z.string().min(5).max(400),
})

/** GET /shadowing — the shared library every user sees, newest first. */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const videos = await shadowingVideo.findMany({
      orderBy: { createdAt: 'desc' },
      select: VIDEO_LIST_SELECT,
      take: 200,
    })
    return res.json({ videos })
  }),
)

/** GET /shadowing/:youtubeId — one clip with its ordered shadowing segments. */
router.get(
  '/:youtubeId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const youtubeId = req.params.youtubeId
    const video = await shadowingVideo.findUnique({
      where: { youtubeId },
      include: { segments: { orderBy: { orderIndex: 'asc' } } },
    })
    if (!video) {
      return res.status(404).json({ message: 'Shadowing video not found.' })
    }
    // Best-effort popularity counter — never block the response on it.
    shadowingVideo
      .update({ where: { youtubeId }, data: { playCount: { increment: 1 } } })
      .catch(() => null)
    return res.json({ video })
  }),
)

/**
 * POST /shadowing — submit a YouTube link.
 * If the clip is already in the library it is returned as-is (shared across all
 * users). Otherwise it is validated (English captions + appropriate), sliced
 * into shadowing segments, saved once, and returned to everyone from then on.
 */
router.post(
  '/',
  requireAuth,
  submitRateLimit,
  requireVideoSubmissionAccess,
  validateBody(submitSchema),
  asyncHandler(async (req, res) => {
    const { url } = req.body as z.infer<typeof submitSchema>
    const userId = req.user!.id

    const youtubeId = extractYouTubeId(url)
    if (!youtubeId) {
      return res.status(400).json({ message: "That doesn't look like a YouTube link. Paste a full youtube.com or youtu.be URL." })
    }

    // Already saved? Return the shared copy — no reprocessing, no duplicate.
    const existing = await shadowingVideo.findUnique({
      where: { youtubeId },
      include: { segments: { orderBy: { orderIndex: 'asc' } } },
    })
    if (existing) {
      return res.status(200).json({ video: existing, created: false })
    }

    try {
      const draft = await buildShadowingDraft(youtubeId)

      const video = await shadowingVideo.create({
        data: {
          youtubeId: draft.youtubeId,
          title: draft.title,
          author: draft.author,
          thumbnailUrl: draft.thumbnailUrl,
          durationSec: draft.durationSec,
          level: draft.level,
          accent: draft.accent,
          topic: draft.topic,
          captionKind: draft.captionKind,
          language: draft.language,
          segmentCount: draft.segments.length,
          wordCount: draft.wordCount,
          submittedById: userId,
          segments: {
            create: draft.segments.map((seg) => ({
              orderIndex: seg.orderIndex,
              startSec: seg.startSec,
              endSec: seg.endSec,
              text: seg.text,
            })),
          },
        },
        include: { segments: { orderBy: { orderIndex: 'asc' } } },
      })

      return res.status(201).json({ video, created: true })
    } catch (error) {
      if (error instanceof ShadowingError) {
        return res.status(error.statusCode).json({ message: error.message })
      }
      // A unique-constraint race: another request saved the same clip first.
      if ((error as { code?: string })?.code === 'P2002') {
        const saved = await shadowingVideo.findUnique({
          where: { youtubeId },
          include: { segments: { orderBy: { orderIndex: 'asc' } } },
        })
        if (saved) return res.status(200).json({ video: saved, created: false })
      }
      throw error
    }
  }),
)

export default router
