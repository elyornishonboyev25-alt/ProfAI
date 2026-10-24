import crypto from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { announcePayouts, announceSpin, botInviteLink, createLinkCode, handleUpdate, inviteLink, knownChatLang, telegramEnabled, type TgUpdate } from '../services/telegram.service.js'
import { detectLang } from '../services/telegramI18n.js'
import { isChannelMember } from '../services/telegramApi.js'
import { drawSpin, isSpinUsable, isWheelTester, spinFor, testSpin, verifyInitData, WHEEL_SEGMENTS } from '../services/wheel.service.js'
import type { RequestHandler } from 'express'
import { BillingError } from '../services/billing.service.js'
import { claimReferral, INVITEE_BONUS_DAYS, referralSummary, settleReferrals } from '../services/referral.service.js'
import { redeemCode } from '../services/promo.service.js'
import { authRateLimit } from '../middleware/rateLimit.js'

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
  await announcePayouts(payouts)
  res.json({ ...summary, link: code ? inviteLink(code) : null, botLink: code ? botInviteLink(code) : null })
}))

const claimSchema = z.object({ code: z.string().min(4).max(32) })

referralRoutes.post('/claim', validateBody(claimSchema), asyncHandler(async (req, res) => {
  const result = await claimReferral(req.user!.id, req.body.code)
  if (!result.ok) return res.status(result.code === 'ALREADY_CLAIMED' ? 409 : 400).json({ code: result.code, message: 'This invitation cannot be applied.' })
  res.json({ claimed: true, bonusDays: result.bonusDays })
}))

export const promoRoutes = Router()
promoRoutes.use(requireAuth)

promoRoutes.get('/status', asyncHandler(async (req, res) => {
  const [promo, link] = await Promise.all([
    prisma.promoCode.findUnique({ where: { userId: req.user!.id }, select: { redeemedAt: true } }),
    prisma.telegramLink.findUnique({ where: { userId: req.user!.id }, select: { userId: true } }),
  ])
  res.json({
    telegramEnabled: telegramEnabled(),
    botUsername: env.TELEGRAM_BOT_USERNAME,
    channelUrl: env.TELEGRAM_CHANNEL_URL,
    promoDays: env.TELEGRAM_PROMO_DAYS,
    referralBonusDays: INVITEE_BONUS_DAYS,
    telegramLinked: Boolean(link),
    promoIssued: Boolean(promo),
    promoRedeemed: Boolean(promo?.redeemedAt),
  })
}))

// Opens the bot: straight to the promo step when the account is already linked.
promoRoutes.post('/telegram', asyncHandler(async (req, res) => {
  if (!telegramEnabled()) return res.status(503).json({ message: 'Telegram bot is not available yet.' })
  const link = await prisma.telegramLink.findUnique({ where: { userId: req.user!.id }, select: { userId: true } })
  if (link) return res.json({ url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=promo` })
  res.json({ url: (await createLinkCode(req.user!.id, 'promo')).url })
}))

const redeemSchema = z.object({ code: z.string().min(3).max(40) })

promoRoutes.post('/redeem', authRateLimit, validateBody(redeemSchema), asyncHandler(async (req, res) => {
  const result = await redeemCode(req.user!.id, req.body.code)
  if (!result.ok) return res.status(result.code === 'INVALID_CODE' ? 404 : 409).json({ code: result.code, message: 'This code cannot be applied.' })
  res.json({ redeemed: true, kind: result.kind, days: result.days })
}))

// Telegram Mini App wheel. Identity comes from signed Telegram launch data, not a site session.
export const wheelRoutes = Router()
const initDataSchema = z.object({ initData: z.string().min(10).max(4096) })

const spinView = (spin: { percent: number; expiresAt: Date; usedAt: Date | null }) => ({
  percent: spin.percent, expiresAt: spin.expiresAt.toISOString(), used: Boolean(spin.usedAt), active: isSpinUsable(spin),
})

// Testers are exempt from the spin rate limit; everyone else keeps it.
const wheelSpinLimit: RequestHandler = (req, res, next) => {
  try { if (isWheelTester(verifyInitData(req.body.initData))) return next() } catch { /* Invalid sessions are rejected by the route. */ }
  return authRateLimit(req, res, next)
}

wheelRoutes.post('/state', validateBody(initDataSchema), asyncHandler(async (req, res) => {
  const user = verifyInitData(req.body.initData)
  const telegramId = String(user.id)
  if (isWheelTester(user)) {
    return res.json({ subscribed: true, linked: false, channelUrl: env.TELEGRAM_CHANNEL_URL, segments: WHEEL_SEGMENTS, spin: null, test: true,
      language: (await knownChatLang(telegramId)) ?? detectLang(user.language_code) })
  }
  const [subscribed, spin, link, language] = await Promise.all([
    isChannelMember(user.id),
    spinFor(telegramId),
    prisma.telegramLink.findUnique({ where: { chatId: telegramId }, select: { userId: true } }),
    knownChatLang(telegramId),
  ])
  res.json({ subscribed, linked: Boolean(link), channelUrl: env.TELEGRAM_CHANNEL_URL, segments: WHEEL_SEGMENTS, spin: spin ? spinView(spin) : null,
    language: language ?? detectLang(user.language_code) })
}))

wheelRoutes.post('/spin', validateBody(initDataSchema), wheelSpinLimit, asyncHandler(async (req, res) => {
  const user = verifyInitData(req.body.initData)
  // Design test mode: nothing is saved, announced or applied as a discount.
  if (isWheelTester(user)) return res.json({ fresh: true, test: true, spin: testSpin() })
  const subscribed = await isChannelMember(user.id)
  if (subscribed === null) throw new BillingError('SUBSCRIPTION_CHECK_FAILED', 'We could not check your subscription. Try again in a moment.', 503)
  if (!subscribed) throw new BillingError('NOT_SUBSCRIBED', 'Subscribe to the channel to spin the wheel.', 403)
  const { spin, fresh } = await drawSpin(String(user.id))
  if (fresh) void announceSpin(String(user.id), spin.percent, spin.expiresAt)
  res.json({ fresh, spin: spinView(spin) })
}))
