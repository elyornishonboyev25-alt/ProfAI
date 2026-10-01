import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requireVideoSubmissionAccess } from '../middleware/videoSubmissionAccess.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { extractYouTubeId } from '../services/shadowing.service.js'
import { approvedMedia, educationalCatalog, educationalDetail, educationalSummary, type MediaKind } from '../services/educationalMedia.service.js'

const schema = z.object({ url: z.string().min(5).max(400) })
export function educationalMediaRouter(kind: MediaKind) {
  const router = Router()
  const captionLimit = rateLimit({ windowMs: 60000, max: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Please wait a moment before opening another lesson.' } })
  router.get('/', requireAuth, asyncHandler(async (_req, res) => res.json({ videos: educationalCatalog(kind).map(educationalSummary) })))
  router.get('/:youtubeId', requireAuth, captionLimit, asyncHandler(async (req, res) => {
    const item = approvedMedia(kind, req.params.youtubeId)
    if (!item) return res.status(404).json({ message: 'This video is not in the curated educational library.' })
    return res.json({ video: await educationalDetail(kind, item) })
  }))
  // Retain the API contract for existing clients, while preventing unreviewed videos from entering either library.
  router.post('/', requireAuth, captionLimit, requireVideoSubmissionAccess, validateBody(schema), asyncHandler(async (req, res) => {
    const id = extractYouTubeId(req.body.url)
    const item = id ? approvedMedia(kind, id) : undefined
    if (!item) return res.status(422).json({ message: 'Choose a lesson from the curated educational library. Unreviewed videos cannot be added.' })
    return res.json({ video: await educationalDetail(kind, item), created: false })
  }))
  return router
}
