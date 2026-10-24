import crypto from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { botInviteLink, createLinkCode, handleUpdate, inviteLink, notifyUser, telegramEnabled, type TgUpdate } from '../services/telegram.service.js'
import { claimReferral, referralSummary, settleReferrals } from '../services/referral.service.js'

export const telegramWebhookRoutes = Router()

const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Telegram calls this with the secret_token we registered in setWebhook.
telegramWebhookRoutes.post('/webhook', (req, res) => {
  if (!telegramEnabled()) return res.status(404).end()
  const secret = env.TELEGRAM_WEBHOOK_SECRET
  if (secret && !safeEqual(String(req.headers['x-telegram-bot-api-secret-token'] ?? ''), secret)) return res.status(401).end()
  res.status(200).end()
  void handleUpdate(req.body as TgUpdate)
})

export const telegramRoutes = Router()
telegramRoutes.use(requireAuth)

telegramRoutes.get('/status', asyncHandler(async (req, res) => {
  const link = await prisma.telegramLink.findUnique({ where: { userId: req.user!.id }, select: { username: true, dailyWord: true, streakAlert: true, linkedAt: true } })
  res.json({ enabled: telegramEnabled(), botUsername: env.TELEGRAM_BOT_USERNAME, linked: Boolean(link), link })
}))

telegramRoutes.post('/link-code', asyncHandler(async (req, res) => {
  if (!telegramEnabled()) return res.status(503).json({ message: 'Telegram bot is not available yet.' })
  res.json(await createLinkCode(req.user!.id))
}))

telegramRoutes.delete('/link', asyncHandler(async (req, res) => {
  await prisma.telegramLink.deleteMany({ where: { userId: req.user!.id } })
  res.json({ linked: false })
}))

export const referralRoutes = Router()
referralRoutes.use(requireAuth)

referralRoutes.get('/me', asyncHandler(async (req, res) => {
  const payouts = await settleReferrals(req.user!.id)
  const summary = await referralSummary(req.user!.id)
  const code = summary.code ?? ''
  for (const payout of payouts) {
    await notifyUser(payout.inviterId, `🎉 <b>${payout.count}-do'st mukofoti!</b>\nHisobingizga <b>+${payout.days} kun</b> premium qo'shildi.`)
  }
  res.json({ ...summary, link: code ? inviteLink(code) : null, botLink: code ? botInviteLink(code) : null })
}))

const claimSchema = z.object({ code: z.string().min(4).max(32) })

referralRoutes.post('/claim', validateBody(claimSchema), asyncHandler(async (req, res) => {
  const result = await claimReferral(req.user!.id, req.body.code)
  if (!result.ok) return res.status(result.code === 'ALREADY_CLAIMED' ? 409 : 400).json({ code: result.code, message: 'This invitation cannot be applied.' })
  res.json({ claimed: true, bonusDays: result.bonusDays })
}))
