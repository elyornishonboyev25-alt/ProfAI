import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOwner } from '../middleware/owner.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isPremiumUser } from '../utils/premium.js'
import { extendPremiumExpiry, type PaidPlan } from '../utils/premiumPlans.js'
import { BILLING_PRODUCTS, GROUP_MIN_SIZE, GROUP_MONTHLY_USD, PLAN_MONTHLY_USD, PLAN_QUOTAS, billingProduct, extendBillingExpiry, tierOfAudience } from '../utils/billingCatalog.js'
import { ownerPremiumSelect, ownerPremiumSummary, recordPremiumEvent } from '../services/premiumHistory.service.js'
import { activeDiscount } from '../services/wheel.service.js'
import { accessStatus, unlockResource, accountOverview, usageSnapshot, lockBilling, fulfillPayment, BillingError } from '../services/billing.service.js'
import { paymentProviders, checkoutUrl, expireStripeCheckout } from '../services/paymentProviders.service.js'
import { approvedMedia } from '../services/educationalMedia.service.js'
import { voiceUsageSnapshot } from '../services/voiceAllowance.service.js'
import { createPaymentQuote, dollarRate, readPaymentQuote, verifyPaymentQuote } from '../services/billingQuote.service.js'
import { checkoutAmounts, checkoutPromotion } from '../services/checkoutPromo.service.js'

const router = Router()
const grantSchema = z.object({
  plan: z.string().refine(value => ['MONTHLY', 'QUARTERLY', 'YEARLY', 'UNLIMITED'].includes(value) || Boolean(billingProduct(value))),
  source: z.enum(['OWNER', 'PAYMENT']).default('OWNER'),
  amountUzs: z.number().int().positive().max(20_000_000).optional(),
}).refine(value => value.source !== 'PAYMENT' || value.amountUzs !== undefined)
const pageSchema = z.coerce.number().int().min(1).max(10000).default(1)
const PAGE_SIZE = 20

router.get('/plans', (_req, res) => res.json({ products: BILLING_PRODUCTS, monthly: PLAN_MONTHLY_USD, quotas: PLAN_QUOTAS,
  group: { minSize: GROUP_MIN_SIZE, monthly: GROUP_MONTHLY_USD }, providers: paymentProviders() }))

router.get('/discount', requireAuth, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  return res.json(await activeDiscount(req.user!.id))
}))

router.get('/quote', requireAuth, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const payload = z.object({ product: z.string().max(50), currency: z.enum(['UZS', 'USD']).default('UZS'), promoCode: z.string().max(40).optional() }).parse(req.query)
  const product = billingProduct(payload.product)
  if (!product) throw new BillingError('INVALID_PLAN', 'Choose a valid plan.', 400)
  const { discount } = await activeDiscount(req.user!.id)
  const promo = checkoutPromotion(payload.promoCode, product)
  const rate = payload.currency === 'UZS' || promo?.amountUzs !== undefined ? await dollarRate() : { rate: 0, date: '' }
  const amounts = checkoutAmounts(product, discount?.percent ?? 0, promo, rate.rate)
  return res.json({ ...createPaymentQuote({ ...product, amountUsd: amounts.amountUsd }, rate, Date.now(), {
    currency: payload.currency, userId: req.user!.id, promoCode: promo?.code ?? '', amountUzs: amounts.amountUzs,
  }), ...amounts, discountPercent: discount?.percent ?? 0, listAmountUsd: product.amountUsd })
}))

router.get('/account', requireAuth, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const [wallet, orders] = await Promise.all([accountOverview(req.user!.id).then(async overview => ({ ...overview, usage: await usageSnapshot(req.user!.id, overview.tier) })), prisma.paymentRequest.findMany({
    where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 20,
    select: { id: true, plan: true, currency: true, amountMinor: true, status: true, method: true, checkoutUrl: true, createdAt: true } })])
  return res.json({ ...wallet, orders, voiceUsage: await voiceUsageSnapshot(req.user!.id) })
}))
const accessSchema = z.object({ feature: z.enum(['test', 'mock', 'shadowing', 'podcast']), resource: z.string().max(180) })
async function validateLesson(feature: string, resource: string) {
  if (feature !== 'shadowing' && feature !== 'podcast') return false
  const id = resource.slice(feature.length + 1)
  const kind = feature === 'podcast' ? 'podcasts' : 'shadowing'
  if (!approvedMedia(kind, id)) throw new BillingError('INVALID_RESOURCE', 'This lesson is unavailable.', 404)
  return true
}
router.get('/access', requireAuth, asyncHandler(async (req, res) => {
  const payload = accessSchema.parse(req.query)
  const free = await validateLesson(payload.feature, payload.resource)
  const status = await accessStatus(req.user!.id, payload.feature, payload.resource)
  return res.json(free ? { ...status, unlocked: true, expiresAt: null } : status)
}))
router.post('/access', requireAuth, asyncHandler(async (req, res) => {
  const payload = accessSchema.parse(req.body)
  if (await validateLesson(payload.feature, payload.resource)) return res.json({ unlocked: true })
  return res.json(await unlockResource(req.user!.id, payload.feature, payload.resource))
}))
router.post('/checkout', requireAuth, asyncHandler(async (req, res) => {
  const payload = z.object({ product: z.string().max(50), currency: z.enum(['UZS', 'USD']), provider: z.enum(['PAYME', 'CLICK', 'STRIPE']), quote: z.string().max(2048).optional(), promoCode: z.string().max(40).optional() }).parse(req.body)
  const listed = billingProduct(payload.product)
  if (!listed) throw new BillingError('INVALID_PLAN', 'Choose a valid plan.', 400)
  // The wheel discount must still be valid when the order is created.
  const { discount } = await activeDiscount(req.user!.id)
  const promo = checkoutPromotion(payload.promoCode, listed)
  const signed = payload.currency === 'UZS' || promo ? readPaymentQuote(payload.quote) : null
  if (payload.currency === 'UZS' && (!signed || signed.rate <= 0)) throw new BillingError('QUOTE_EXPIRED', 'Please refresh the payment amount before continuing.', 409)
  const amounts = checkoutAmounts(listed, discount?.percent ?? 0, promo, signed?.rate ?? 0)
  const product = { ...listed, amountUsd: amounts.amountUsd }
  if (signed) verifyPaymentQuote(payload.quote, product, Date.now(), {
    currency: payload.currency, userId: req.user!.id, promoCode: promo?.code ?? '', amountUzs: amounts.amountUzs,
  })
  const provider = paymentProviders().find(item => item.code === payload.provider && item.currency === payload.currency)
  const free = product.amountUsd === 0 && (payload.currency === 'USD' || amounts.amountUzs === 0)
  if (!free && !provider?.enabled) throw new BillingError('PAYMENTS_UNAVAILABLE', 'This payment method is not available yet.', 503)
  const amountUzs = payload.currency === 'UZS' ? amounts.amountUzs : 0
  const order = await prisma.$transaction(async tx => {
    await lockBilling(tx, req.user!.id)
    const existing = await tx.paymentRequest.findFirst({ where: { userId: req.user!.id, status: { in: ['PENDING', 'SUBMITTED', 'PROCESSING'] } } })
    if (existing) throw new BillingError('REQUEST_OPEN', 'Finish or cancel your existing order first.', 409)
    const order = await tx.paymentRequest.create({ data: { userId: req.user!.id, plan: product.code, audience: product.audience, months: product.months,
      currency: payload.currency, amountUzs, discountPercent: Math.round((1 - product.amountUsd / listed.amountUsd) * 100), wheelSpinId: discount?.id ?? null,
      reference: promo ? `promo:${promo.code}` : null,
      promoDiscountMinor: promo ? (payload.currency === 'USD' ? amounts.promoDiscountUsd : amounts.promoDiscountUzs * 100) : null,
      amountMinor: payload.currency === 'UZS' ? amountUzs * 100 : product.amountUsd, method: free ? 'PROMO' : payload.provider } })
    if (free) await fulfillPayment(tx, order, 'PROMO')
    return order
  })
  if (free) return res.status(201).json({ id: order.id, status: 'APPROVED' })
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
  return res.json({ products: BILLING_PRODUCTS, grant, requests })
}))

router.post('/requests', requireAuth, asyncHandler(async (req, res) => {
  return res.status(410).json({ message: 'Choose a subscription and an online payment method.', code: 'LEGACY_PLANS_CLOSED' })

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
      select: ownerPremiumSelect }),
  ])
  const actorIds = [...new Set(users.flatMap(user => [user.premiumGrant?.grantedBy, ...(user.paymentRequests ?? []).map(order => order.reviewedBy)]).filter((id): id is string => Boolean(id)))]
  const actors = actorIds.length ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, fullName: true, email: true } }) : []
  const actorMap = new Map(actors.map(actor => [actor.id, actor]))
  const now = new Date()
  return res.json({ items: users.map(user => ownerPremiumSummary(user, actorMap, now)), total, page, pageSize: PAGE_SIZE })
}))

router.put('/owner/users/:id/grant', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = grantSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid premium plan.' })
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  const aliases: Record<string, string> = { MONTHLY: 'PRO_1', QUARTERLY: 'PRO_3', YEARLY: 'PRO_12' }
  const product = billingProduct(aliases[parsed.data.plan] ?? parsed.data.plan)
  if (product) {
    await prisma.$transaction(async tx => {
      await lockBilling(tx, user.id)
      if (product.months) {
        const now = new Date()
        const [subscriptions, legacy] = await Promise.all([
          tx.billingSubscription.findMany({ where: { userId: user.id } }),
          tx.premiumGrant.findUnique({ where: { userId: user.id } }),
        ])
        const current = subscriptions.find(row => row.audience === product.audience)
        const sameTier = subscriptions.filter(row => tierOfAudience(row.audience) === tierOfAudience(product.audience)).map(row => row.expiresAt.getTime())
        if (legacy?.expiresAt && !legacy.plan.startsWith('TRIAL_') && (legacy.plan.startsWith('MAX') ? 'MAX' : 'PRO') === tierOfAudience(product.audience)) sameTier.push(legacy.expiresAt.getTime())
        const startsAt = new Date(Math.max(now.getTime(), ...sameTier))
        const expiresAt = extendBillingExpiry(product.months, startsAt, now)
        await tx.billingSubscription.upsert({ where: { userId_audience: { userId: user.id, audience: product.audience } },
          create: { userId: user.id, audience: product.audience, plan: product.code, startsAt: now, expiresAt },
          update: { plan: product.code, expiresAt, ...(current && current.expiresAt > now ? {} : { startsAt: now }) } })
        await recordPremiumEvent(tx, { userId: user.id, source: parsed.data.source, plan: product.code, months: product.months,
          startsAt, expiresAt, createdAt: now, actorId: req.user!.id,
          ...(parsed.data.source === 'PAYMENT' ? { currency: 'UZS', amountMinor: parsed.data.amountUzs! * 100, method: 'CARD_TRANSFER' } : {}) })
      }
    })
    return res.json({ status: 'GRANTED' })
  }
  const grant = await prisma.$transaction(async tx => {
    await lockBilling(tx, user.id)
    const now = new Date()
    const existing = await tx.premiumGrant.findUnique({ where: { userId: user.id }, select: { source: true } })
    const source = existing?.source === 'SELECTED_ACCESS' ? 'SELECTED_ACCESS' : parsed.data.source
    const grant = await tx.premiumGrant.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: 'UNLIMITED', source, startsAt: now, expiresAt: null, grantedBy: req.user!.id },
      update: { plan: 'UNLIMITED', source, startsAt: now, expiresAt: null, grantedBy: req.user!.id },
      select: { plan: true, source: true, startsAt: true, expiresAt: true },
    })
    await recordPremiumEvent(tx, { userId: user.id, source: parsed.data.source, plan: 'UNLIMITED', startsAt: now, createdAt: now,
      actorId: req.user!.id, ...(parsed.data.source === 'PAYMENT' ? { currency: 'UZS', amountMinor: parsed.data.amountUzs! * 100, method: 'CARD_TRANSFER' } : {}) })
    return grant
  })
  return res.json({ grant })
}))

router.delete('/owner/users/:id/grant', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true, email: true, nickname: true } })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  if (isPremiumUser(user)) return res.status(409).json({ message: 'This account has fixed premium access.' })
  await prisma.$transaction(async tx => {
    await lockBilling(tx, user.id)
    const now = new Date()
    const legacy = await tx.premiumGrant.findUnique({ where: { userId: user.id } })
    if (legacy) {
      const recorded = await tx.premiumEvent.findFirst({ where: { userId: user.id, plan: legacy.plan, createdAt: legacy.startsAt } })
      if (!recorded) await recordPremiumEvent(tx, { userId: user.id, source: legacy.source === 'OWNER' ? 'OWNER' : legacy.source === 'PAYMENT' ? 'PAYMENT' : 'LEGACY',
        plan: legacy.plan, startsAt: legacy.startsAt, expiresAt: legacy.expiresAt, createdAt: legacy.startsAt, actorId: legacy.grantedBy })
    }
    await recordPremiumEvent(tx, { userId: user.id, source: 'REVOKED', plan: 'NONE', startsAt: now, expiresAt: now, createdAt: now, actorId: req.user!.id })
    await tx.premiumEvent.updateMany({ where: { userId: user.id, revokedAt: null, source: { not: 'REVOKED' }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, data: { revokedAt: now } })
    await tx.premiumGrant.deleteMany({ where: { userId: user.id } })
    await tx.billingSubscription.deleteMany({ where: { userId: user.id } })
  })
  return res.json({ grant: null })
}))

router.get('/owner/requests', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const parsed = z.object({ page: pageSchema, status: z.enum(['ALL', 'PENDING', 'SUBMITTED', 'PROCESSING', 'APPROVED', 'REJECTED', 'CANCELED']).default('ALL'), promotion: z.enum(['ALL', 'DISCOUNTED']).default('ALL') }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid request filter.' })
  const { page, status, promotion } = parsed.data
  const where: Prisma.PaymentRequestWhereInput = { ...(status === 'ALL' ? {} : { status }), ...(promotion === 'DISCOUNTED' ? { discountPercent: { gt: 0 } } : {}) }
  const [total, items] = await Promise.all([
    prisma.paymentRequest.count({ where }),
    prisma.paymentRequest.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: { id: true, plan: true, amountUzs: true, status: true, method: true, createdAt: true, reviewedAt: true,
        currency: true, amountMinor: true, discountPercent: true, wheelSpinId: true,
        user: { select: { id: true, fullName: true, email: true,
          promoCode: { select: { code: true, redeemedAt: true } } } } } }),
  ])
  return res.json({ items, total, page, pageSize: PAGE_SIZE })
}))

// Redeemed codes, referrals and wheel prizes are distinct promotion sources.
router.get('/owner/promotions', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const parsed = z.object({ page: pageSchema }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid promotion page.' })
  const { page } = parsed.data
  const where: Prisma.UserWhereInput = { OR: [
    { promoCode: { is: { redeemedAt: { not: null } } } },
    { referralReceived: { isNot: null } }, { wheelSpin: { isNot: null } },
    { paymentRequests: { some: { discountPercent: { gt: 0 } } } },
  ] }
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: { id: true, fullName: true, email: true,
        promoCode: { select: { code: true, days: true, redeemedAt: true } },
        referralReceived: { select: { createdAt: true, inviter: { select: { fullName: true, referralCode: true } } } },
        wheelSpin: { select: { id: true, percent: true, expiresAt: true, usedAt: true } },
        paymentRequests: { where: { discountPercent: { gt: 0 } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1,
          select: { id: true, plan: true, status: true, currency: true, amountMinor: true, amountUzs: true, discountPercent: true, wheelSpinId: true, createdAt: true } },
      } }),
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
        await recordPremiumEvent(tx, { userId: request.userId, originKey: `payment:${request.id}`, source: 'PAYMENT', plan,
          months: ({ MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as Record<string, number>)[plan], startsAt: current?.expiresAt && current.expiresAt > now ? current.expiresAt : now,
          expiresAt, createdAt: now, actorId: req.user!.id, currency: request.currency,
          amountMinor: request.amountMinor || request.amountUzs * 100, method: request.method, discountPercent: request.discountPercent })
      }
    }
    return { status: parsed.data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
  })
  if (!outcome) return res.status(409).json({ message: 'Only submitted requests can be reviewed.' })
  return res.json(outcome)
}))

export default router
