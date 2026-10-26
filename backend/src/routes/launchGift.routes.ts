import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { claimLaunchGift, launchGiftFor, launchGiftStats } from '../services/launchGift.service.js'

const router = Router()

// Public counter for the guest invitation.
router.get('/stats', asyncHandler(async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  return res.json(await launchGiftStats())
}))

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  return res.json(await launchGiftFor(req.user!.id))
}))

router.post('/claim', requireAuth, asyncHandler(async (req, res) => {
  return res.json(await claimLaunchGift(req.user!.id))
}))

export default router
