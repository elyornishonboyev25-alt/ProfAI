import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { novaReleaseFor, recordNovaReleaseShown } from '../services/productRelease.service.js'

const router = Router()
router.use(requireAuth, (_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
router.get('/nova-studio', asyncHandler(async (req, res) => {
  res.json(await novaReleaseFor(req.user!.id))
}))
router.post('/nova-studio/shown', asyncHandler(async (req, res) => {
  res.json(await recordNovaReleaseShown(req.user!.id))
}))
export default router
