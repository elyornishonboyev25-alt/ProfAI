import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOwner } from '../middleware/owner.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isPremiumUser } from '../utils/premium.js'
import { extendPremiumExpiry, PREMIUM_PLANS, type PaidPlan } from '../utils/premiumPlans.js'

const router = Router()
const planSchema = z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY'])
const grantSchema = z.object({ plan: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'UNLIMITED']) })
const pageSchema = z.coerce.number().int().min(1).max(10000).default(1)
const PAGE_SIZE = 20

router.get('/plans', (_req, res) => res.json({ plans: PREMIUM_PLANS }))

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
  const parsed = z.object({ plan: planSchema }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid premium plan.' })
  const existing = await prisma.paymentRequest.findFirst({
    where: { userId: req.user!.id, status: { in: ['PENDING', 'SUBMITTED'] } }, orderBy: { createdAt: 'desc' },
  })
  if (existing) return res.status(409).json({ message: 'You already have an open payment request.', code: 'REQUEST_OPEN' })
  try {
    const request = await prisma.paymentRequest.create({
      data: { userId: req.user!.id, plan: parsed.data.plan, amountUzs: PREMIUM_PLANS[parsed.data.plan].amountUzs },
      select: { id: true, plan: true, amountUzs: true, status: true, createdAt: true },
    })
    return res.status(201).json(request)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'You already have an open payment request.', code: 'REQUEST_OPEN' })
    }
    throw error
  }
}))

router.patch('/requests/:id/submit', requireAuth, asyncHandler(async (req, res) => {
  const request = await prisma.paymentRequest.updateMany({
    where: { id: req.params.id, userId: req.user!.id, status: 'PENDING' },
    data: { status: 'SUBMITTED' },
  })
  if (request.count !== 1) return res.status(409).json({ message: 'This request cannot be submitted.' })
  return res.json({ status: 'SUBMITTED' })
}))

router.delete('/requests/:id', requireAuth, asyncHandler(async (req, res) => {
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
        premiumGrant: { select: { plan: true, source: true, expiresAt: true, startsAt: true } } } }),
  ])
  return res.json({ items: users.map(user => ({ ...user, fixedPremium: isPremiumUser(user) })), total, page, pageSize: PAGE_SIZE })
}))

router.put('/owner/users/:id/grant', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const parsed = grantSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid premium plan.' })
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  const existing = await prisma.premiumGrant.findUnique({ where: { userId: user.id }, select: { expiresAt: true } })
  const now = new Date()
  const expiresAt = parsed.data.plan === 'UNLIMITED' ? null : extendPremiumExpiry(parsed.data.plan, existing?.expiresAt, now)
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
