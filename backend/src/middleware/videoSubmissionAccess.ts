import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { canSubmitCommunityVideo } from '../utils/videoSubmissionAccess.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const requireVideoSubmissionAccess = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true, nickname: true },
    })

    if (!user) {
      return res.status(401).json({ message: 'Authenticated user no longer exists.' })
    }

    if (!canSubmitCommunityVideo(user)) {
      return res.status(403).json({ message: 'You do not have permission to add community videos.' })
    }

    return next()
  },
)
