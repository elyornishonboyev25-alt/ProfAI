import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireVideoSubmissionAccess } from '../middleware/videoSubmissionAccess.js'
import { validateBody } from '../middleware/validate.js'
import { buildPodcastDraft, extractYouTubeId, ShadowingError } from '../services/shadowing.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Prisma generates these delegates from the migration above. The runtime cast
// keeps type-checking usable before a local `prisma generate` has run.
const prismaRuntime = prisma as unknown as Record<string, any>
const podcastVideo = prismaRuntime.podcastVideo

const submitRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many podcast submissions. Please wait a minute and try again.' },
})

const PODCAST_LIST_SELECT = {
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

const submitSchema = z.object({ url: z.string().min(5).max(400) })

/** Shared podcast library, newest first. */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const videos = await podcastVideo.findMany({
      orderBy: { createdAt: 'desc' },
      select: PODCAST_LIST_SELECT,
    })
    return res.json({ videos })
  }),
)

/** One episode plus its synced caption transcript. */
router.get(
  '/:youtubeId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const video = await podcastVideo.findUnique({
      where: { youtubeId: req.params.youtubeId },
      include: { segments: { orderBy: { orderIndex: 'asc' } } },
    })
    if (!video) return res.status(404).json({ message: 'Podcast not found.' })

    podcastVideo
      .update({ where: { youtubeId: video.youtubeId }, data: { playCount: { increment: 1 } } })
      .catch(() => null)
    return res.json({ video })
  }),
)

/**
 * Submit a public YouTube podcast. Captions enrich the episode when available,
 * but a temporary caption/audio failure does not block normal playback.
 */
router.post(
  '/',
  requireAuth,
  submitRateLimit,
  requireVideoSubmissionAccess,
  validateBody(submitSchema),
  asyncHandler(async (req, res) => {
    const { url } = req.body as z.infer<typeof submitSchema>
    const youtubeId = extractYouTubeId(url)
    if (!youtubeId) {
      return res.status(400).json({ message: "That doesn't look like a YouTube link. Paste a full youtube.com or youtu.be URL." })
    }

    const existing = await podcastVideo.findUnique({
      where: { youtubeId },
      include: { segments: { orderBy: { orderIndex: 'asc' } } },
    })
    if (existing) return res.json({ video: existing, created: false })

    try {
      const draft = await buildPodcastDraft(youtubeId)
      const video = await podcastVideo.create({
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
          submittedById: req.user!.id,
          ...(draft.segments.length > 0
            ? {
                segments: {
                  create: draft.segments.map((segment) => ({
                    orderIndex: segment.orderIndex,
                    startSec: segment.startSec,
                    endSec: segment.endSec,
                    text: segment.text,
                  })),
                },
              }
            : {}),
        },
        include: { segments: { orderBy: { orderIndex: 'asc' } } },
      })
      return res.status(201).json({ video, created: true })
    } catch (error) {
      if (error instanceof ShadowingError) {
        return res.status(error.statusCode).json({ message: error.message })
      }
      if ((error as { code?: string })?.code === 'P2002') {
        const saved = await podcastVideo.findUnique({
          where: { youtubeId },
          include: { segments: { orderBy: { orderIndex: 'asc' } } },
        })
        if (saved) return res.json({ video: saved, created: false })
      }
      throw error
    }
  }),
)

export default router
