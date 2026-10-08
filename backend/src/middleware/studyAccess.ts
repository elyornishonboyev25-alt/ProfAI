import type { RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireStudyAccess } from '../services/billing.service.js'
// Applied before every AI provider endpoint, including speech and transcription.
export const enforceStudyAccess: RequestHandler = asyncHandler(async (req, _res, next) => {
  await requireStudyAccess(req.user!.id)
  next()
})
