import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOwner } from '../middleware/owner.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isPremiumUser } from '../utils/premium.js'
import { extendPremiumExpiry, PREMIUM_PLANS, type PaidPlan } from '../utils/premiumPlans.js'
import { BILLING_PRODUCTS, COIN_COSTS, WELCOME_COINS, billingProduct, extendBillingExpiry } from '../utils/billingCatalog.js'
import { randomUUID } from 'node:crypto'
import { accessStatus, unlockResource, walletOverview, lockWallet, fulfillPayment, BillingError } from '../services/coinBilling.service.js'
import { paymentProviders, checkoutUrl, expireStripeCheckout } from '../services/paymentProviders.service.js'
import { approvedMedia, educationalCatalog } from '../services/educationalMedia.service.js'

const router = Router()
const grantSchema = z.object({ plan: z.string().refine(value => ['MONTHLY', 'QUARTERLY', 'YEARLY', 'UNLIMITED'].includes(value) || Boolean(billingProduct(value))) })
const pageSchema = z.coerce.number().int().min(1).max(10000).default(1)
const PAGE_SIZE = 20

router.get('/plans', (_req, res) => res.json({ plans: PREMIUM_PLANS, products: BILLING_PRODUCTS, costs: COIN_COSTS, welcomeCoins: WELCOME_COINS, providers: paymentProviders() }))

router.get('/wallet', requireAuth, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const [wallet, orders] = await Promise.all([walletOverview(req.user!.id), prisma.paymentRequest.findMany({
    where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 20,
    select: { id: true, plan: true, currency: true, amountMinor: true, coins: true, status: true, method: true, checkoutUrl: true, createdAt: true } })])
  return res.json({ ...wallet, orders })
}))
const accessSchema = z.object({ feature: z.enum(['test', 'mock', 'shadowing', 'podcast']), resource: z.string().max(180) })
async function validateLesson(feature: string, resource: string) {
  if (feature !== 'shadowing' && feature !== 'podcast') return false
  const id = resource.slice(feature.length + 1)
  const kind = feature === 'podcast' ? 'podcasts' : 'shadowing'
  if (!approvedMedia(kind, id)) throw new BillingError('INVALID_RESOURCE', 'This lesson is unavailable.', 404)
  return educationalCatalog(kind).slice(0, 3).some(item => item.youtubeId === id)
}
router.get('/access', requireAuth, asyncHandler(async (req, res) => {
  const payload = accessSchema.parse(req.query)
  const free = await validateLesson(payload.feature, payload.resource)
  const status = await accessStatus(req.user!.id, payload.feature, payload.resource)
  return res.json(free ? { ...status, unlocked: true, cost: 0 } : status)
}))
router.post('/access', requireAuth, asyncHandler(async (req, res) => {
  const payload = accessSchema.parse(req.body)
  if (await validateLesson(payload.feature, payload.resource)) return res.json({ charged: 0 })
  return res.json(await unlockResource(req.user!.id, payload.feature, payload.resource))
}))
router.post('/checkout', requireAuth, asyncHandler(async (req, res) => {
  const payload = z.object({ product: z.string().max(50), currency: z.enum(['UZS', 'USD']), provider: z.enum(['PAYME', 'CLICK', 'STRIPE']) }).parse(req.body)
  const product = billingProduct(payload.product)
  if (!product) throw new BillingError('INVALID_PLAN', 'Choose a valid plan.', 400)
  const provider = paymentProviders().find(item => item.code === payload.provider && item.currency === payload.currency)
  if (!provider?.enabled) throw new BillingError('PAYMENTS_UNAVAILABLE', 'This payment method is not available yet.', 503)
  const order = await prisma.$transaction(async tx => {
    await lockWallet(tx, req.user!.id)
    if (product.audience === 'CENTER_STUDENT') {
      const member = await tx.learningCenterMember.findFirst({ where: { userId: req.user!.id, role: 'STUDENT', status: 'ACTIVE' } })
      if (!member) throw new BillingError('CENTER_MEMBERSHIP_REQUIRED', 'Join your teacher’s class to use the learning center student rate.', 403)
    }
    const existing = await tx.paymentRequest.findFirst({ where: { userId: req.user!.id, status: { in: ['PENDING', 'SUBMITTED', 'PROCESSING'] } } })
    if (existing) throw new BillingError('REQUEST_OPEN', 'Finish or cancel your existing order first.', 409)
    return tx.paymentRequest.create({ data: { userId: req.user!.id, plan: product.code, audience: product.audience, months: product.months,
      coins: product.coins, currency: payload.currency, amountUzs: product.amountUzs,
      amountMinor: payload.currency === 'UZS' ? product.amountUzs * 100 : product.amountUsd, method: payload.provider } })
  })
  try {
    const checkout = await checkoutUrl(order)
    const saved = await prisma.paymentRequest.updateMany({ where: { id: order.id, status: 'PENDING' }, data: { checkoutUrl: checkout.url, providerId: checkout.providerId } })
    if (!saved.count) throw new BillingError('ORDER_CANCELED', 'The order was canceled.', 409)
    return res.status(201).json({ id: order.id, url: checkout.url })
  } catch (error) {
    await prisma.paymentRequest.updateMany({ where: { id: order.id, status: 'PENDING' }, data: { status: 'CANCELED' } })
    throw error
  }
}))

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const [grant, requests] = await Promise.all([
    prisma.premiumGrant.findUnique({ where: { userId: req.user!.id }, select: { plan: true, source: true, startsAt: true, expiresAt: true } }),
    prisma.paymentRequest.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, plan: true, amountUzs: true, status: true, method: true, createdAt: true, reviewedAt: true } }),
  ])
  return res.json({ plans: PREMIUM_PLANS, grant, requests })
}))

router.post('/requests', requireAuth, asyncHandler(async (req, res) => {
  return res.status(410).json({ message: 'Choose a coin plan and an online payment method.', code: 'LEGACY_PLANS_CLOSED' })

}))

router.patch('/requests/:id/submit', requireAuth, asyncHandler(async (req, res) => {
  const request = await prisma.paymentRequest.updateMany({
    where: { id: req.params.id, userId: req.user!.id, status: 'PENDING', method: 'CARD_TRANSFER' },
    data: { status: 'SUBMITTED' },
  })
  if (request.count !== 1) return res.status(409).json({ message: 'This request cannot be submitted.' })
  return res.json({ status: 'SUBMITTED' })
}))

router.delete('/requests/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.paymentRequest.findFirst({ where: { id: req.params.id, userId: req.user!.id, status: 'PENDING' } })
  if (existing?.method === 'STRIPE' && existing.providerId) await expireStripeCheckout(existing.providerId.slice(7))
  const request = await prisma.paymentRequest.updateMany({
    where: { id: req.params.id, userId: req.user!.id, status: { in: ['PENDING', 'SUBMITTED'] } },
    data: { status: 'CANCELED' },
  })
  if (request.count !== 1) return res.status(409).json({ message: 'This request cannot be canceled.' })
  return res.json({ status: 'CANCELED' })
}))

router.get('/owner/users', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = z.object({ page: pageSchema, q: z.string().trim().max(100).default('') }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid search.' })
  const { page, q } = parsed.data
  const where = q ? { OR: [
    { email: { contains: q, mode: 'insensitive' as const } },
    { fullName: { contains: q, mode: 'insensitive' as const } },
    { nickname: { contains: q, mode: 'insensitive' as const } },
  ] } : {}
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: { id: true, fullName: true, email: true, nickname: true, role: true, createdAt: true,
        coinWallet: { select: { balance: true } }, billingSubscriptions: { select: { audience: true, plan: true, expiresAt: true } },
        premiumGrant: { select: { plan: true, source: true, expiresAt: true, startsAt: true } } } }),
  ])
  return res.json({ items: users.map(user => ({ ...user, fixedPremium: isPremiumUser(user) })), total, page, pageSize: PAGE_SIZE })
}))

router.put('/owner/users/:id/grant', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = grantSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid premium plan.' })
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  const product = billingProduct(parsed.data.plan)
  if (product) {
    await prisma.$transaction(async tx => {
      await lockWallet(tx, user.id)
      await tx.coinWallet.update({ where: { userId: user.id }, data: { balance: { increment: product.coins } } })
      await tx.coinEntry.create({ data: { userId: user.id, key: `owner:${randomUUID()}`, amount: product.coins, reason: `OWNER:${product.code}` } })
      if (product.months) {
        const current = await tx.billingSubscription.findUnique({ where: { userId_audience: { userId: user.id, audience: product.audience } } })
        const expiresAt = extendBillingExpiry(product.months, current?.expiresAt)
        await tx.billingSubscription.upsert({ where: { userId_audience: { userId: user.id, audience: product.audience } },
          create: { userId: user.id, audience: product.audience, plan: product.code, expiresAt }, update: { plan: product.code, expiresAt } })
      }
    })
    return res.json({ status: 'GRANTED' })
  }
  const existing = await prisma.premiumGrant.findUnique({ where: { userId: user.id }, select: { expiresAt: true } })
  const now = new Date()
  const expiresAt = parsed.data.plan === 'UNLIMITED' ? null : extendPremiumExpiry(parsed.data.plan as PaidPlan, existing?.expiresAt, now)
  const grant = await prisma.premiumGrant.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan: parsed.data.plan, source: 'OWNER', startsAt: now, expiresAt, grantedBy: req.user!.id },
    update: { plan: parsed.data.plan, source: 'OWNER', startsAt: now, expiresAt, grantedBy: req.user!.id },
    select: { plan: true, source: true, startsAt: true, expiresAt: true },
  })
  return res.json({ grant })
}))

router.delete('/owner/users/:id/grant', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true, email: true, nickname: true } })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  if (isPremiumUser(user)) return res.status(409).json({ message: 'This account has fixed premium access.' })
  await prisma.premiumGrant.deleteMany({ where: { userId: user.id } })
  await prisma.billingSubscription.deleteMany({ where: { userId: user.id } })
  return res.json({ grant: null })
}))

router.get('/owner/requests', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = z.object({ page: pageSchema, status: z.enum(['ALL', 'PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELED']).default('SUBMITTED') }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid request filter.' })
  const { page, status } = parsed.data
  const where = status === 'ALL' ? {} : { status }
  const [total, items] = await Promise.all([
    prisma.paymentRequest.count({ where }),
    prisma.paymentRequest.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: { id: true, plan: true, amountUzs: true, status: true, method: true, createdAt: true, reviewedAt: true,
        currency: true, amountMinor: true,
        user: { select: { id: true, fullName: true, email: true } } } }),
  ])
  return res.json({ items, total, page, pageSize: PAGE_SIZE })
}))

router.patch('/owner/requests/:id', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = z.object({ action: z.enum(['APPROVE', 'REJECT']) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid decision.' })
  const outcome = await prisma.$transaction(async tx => {
    const request = await tx.paymentRequest.findUnique({ where: { id: req.params.id } })
    if (!request || request.status !== 'SUBMITTED') return null
    if (request.method !== 'CARD_TRANSFER') throw new BillingError('PROVIDER_CONFIRMATION_REQUIRED', 'Online payments are confirmed by the payment provider.', 409)
    if (parsed.data.action === 'APPROVE' && request.audience) {
      const fulfilled = await fulfillPayment(tx, request, req.user!.id)
      return fulfilled ? { status: 'APPROVED' } : null
    }
    const claimed = await tx.paymentRequest.updateMany({
      where: { id: request.id, status: 'SUBMITTED' },
      data: { status: parsed.data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewedBy: req.user!.id, reviewedAt: new Date() },
    })
    if (claimed.count !== 1) return null
    if (parsed.data.action === 'APPROVE') {
      const plan = request.plan as PaidPlan
      const current = await tx.premiumGrant.findUnique({ where: { userId: request.userId }, select: { expiresAt: true } })
      const now = new Date()
      // An owner's unlimited grant must remain unlimited after a paid request is approved.
      if (!current || current.expiresAt !== null) {
        const expiresAt = extendPremiumExpiry(plan, current?.expiresAt, now)
        await tx.premiumGrant.upsert({ where: { userId: request.userId },
          create: { userId: request.userId, plan, source: 'PAYMENT', startsAt: now, expiresAt, grantedBy: req.user!.id },
          update: { plan, source: 'PAYMENT', startsAt: now, expiresAt, grantedBy: req.user!.id },
        })
      }
    }
    return { status: parsed.data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
  })
  if (!outcome) return res.status(409).json({ message: 'Only submitted requests can be reviewed.' })
  return res.json(outcome)
}))

export default router
