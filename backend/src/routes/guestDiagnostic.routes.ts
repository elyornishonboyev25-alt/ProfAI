import { createHash, randomBytes } from 'node:crypto'
import { Router, type Request } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireFeature } from '../middleware/requireFeature.js'
import { guestDiagnosticRateLimit } from '../middleware/rateLimit.js'
import { guestDiagnosticAnswersSchema, guestDiagnosticDraftSchema, scoreGuestDiagnostic } from '../services/guestDiagnostic.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const TOKEN_HEADER = 'x-guest-diagnostic-token'
const SESSION_DAYS = 14

router.use(requireFeature('guestDiagnostic'), guestDiagnosticRateLimit)

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function readToken(req: Request) {
  const token = req.header(TOKEN_HEADER)?.trim()
  if (!token || token.length < 32 || token.length > 128) return null
  return token
}

function serializeDiagnostic(diagnostic: { id: string; status: string; answers: unknown; result: unknown; expiresAt: Date; completedAt: Date | null; claimedAt: Date | null }) {
  return {
    id: diagnostic.id,
    status: diagnostic.status,
    answers: diagnostic.answers,
    result: diagnostic.result,
    expiresAt: diagnostic.expiresAt.toISOString(),
    completedAt: diagnostic.completedAt?.toISOString() ?? null,
    claimedAt: diagnostic.claimedAt?.toISOString() ?? null,
  }
}

async function findSession(token: string) {
  return prisma.guestDiagnostic.findFirst({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
  })
}

router.post('/session', asyncHandler(async (req, res) => {
  const answers = guestDiagnosticDraftSchema.parse(req.body?.answers ?? {})
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  const diagnostic = await prisma.guestDiagnostic.create({
    data: { tokenHash: hashToken(token), answers: answers as Prisma.InputJsonValue, expiresAt },
  })
  if (Math.random() < 0.05) void prisma.guestDiagnostic.deleteMany({ where: { expiresAt: { lt: new Date() }, claimedById: null } }).catch(() => undefined)
  return res.status(201).json({ token, diagnostic: serializeDiagnostic(diagnostic) })
}))

router.get('/session', asyncHandler(async (req, res) => {
  const token = readToken(req)
  if (!token) return res.status(401).json({ message: 'Diagnostic session token is required.' })
  const diagnostic = await findSession(token)
  if (!diagnostic) return res.status(404).json({ message: 'This diagnostic session has expired.' })
  return res.json({ diagnostic: serializeDiagnostic(diagnostic) })
}))

router.patch('/session', asyncHandler(async (req, res) => {
  const token = readToken(req)
  if (!token) return res.status(401).json({ message: 'Diagnostic session token is required.' })
  const diagnostic = await findSession(token)
  if (!diagnostic) return res.status(404).json({ message: 'This diagnostic session has expired.' })
  if (diagnostic.claimedById) return res.status(409).json({ message: 'This diagnostic has already been claimed.' })
  const patch = guestDiagnosticDraftSchema.parse(req.body?.answers ?? {})
  const current = guestDiagnosticDraftSchema.parse(diagnostic.answers)
  const updated = await prisma.guestDiagnostic.update({
    where: { id: diagnostic.id },
    data: { answers: { ...current, ...patch } as Prisma.InputJsonValue },
  })
  return res.json({ diagnostic: serializeDiagnostic(updated) })
}))

router.post('/complete', asyncHandler(async (req, res) => {
  const token = readToken(req)
  if (!token) return res.status(401).json({ message: 'Diagnostic session token is required.' })
  const diagnostic = await findSession(token)
  if (!diagnostic) return res.status(404).json({ message: 'This diagnostic session has expired.' })
  if (diagnostic.claimedById) return res.status(409).json({ message: 'This diagnostic has already been claimed.' })
  const answers = guestDiagnosticAnswersSchema.parse(req.body?.answers ?? diagnostic.answers)
  const result = scoreGuestDiagnostic(answers)
  const completedAt = new Date()
  const updated = await prisma.guestDiagnostic.update({
    where: { id: diagnostic.id },
    data: { answers: answers as Prisma.InputJsonValue, result: result as unknown as Prisma.InputJsonValue, status: 'COMPLETED', completedAt },
  })
  return res.json({ diagnostic: serializeDiagnostic(updated) })
}))

router.get('/mine', requireAuth, asyncHandler(async (req, res) => {
  const diagnostic = await prisma.guestDiagnostic.findFirst({
    where: {
      claimedById: req.user!.id,
      status: 'CLAIMED',
      result: { not: Prisma.DbNull },
    },
    orderBy: [{ claimedAt: 'desc' }, { completedAt: 'desc' }],
  })

  return res.json({
    diagnostic: diagnostic ? serializeDiagnostic(diagnostic) : null,
  })
}))

router.post('/claim', requireAuth, asyncHandler(async (req, res) => {
  const token = readToken(req)
  if (!token) return res.status(401).json({ message: 'Diagnostic session token is required.' })
  const diagnostic = await findSession(token)
  if (!diagnostic) return res.status(404).json({ message: 'This diagnostic session has expired.' })
  if (diagnostic.claimedById && diagnostic.claimedById !== req.user!.id) return res.status(409).json({ message: 'This diagnostic belongs to another account.' })
  if (diagnostic.status !== 'COMPLETED' && diagnostic.status !== 'CLAIMED') return res.status(409).json({ message: 'Complete the diagnostic before saving it.' })
  const answers = guestDiagnosticAnswersSchema.parse(diagnostic.answers)
  const targetExam = ['IELTS', 'SAT', 'BOTH'].includes(answers.testPlan) ? answers.testPlan : null
  const claimedAt = diagnostic.claimedAt ?? new Date()
  const [updated] = await prisma.$transaction([
    prisma.guestDiagnostic.update({ where: { id: diagnostic.id }, data: { status: 'CLAIMED', claimedAt, claimedById: req.user!.id } }),
    prisma.userProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        country: answers.applicantCountry,
        targetCountries: answers.destinations,
        fieldOfStudy: answers.intendedMajor,
        degreeLevel: 'bachelor',
        targetExam,
        currentIeltsScore: answers.currentIeltsScore,
        targetIeltsScore: answers.targetIeltsScore,
        currentSatScore: answers.currentSatScore,
        targetSatScore: answers.targetSatScore,
      },
      create: {
        userId: req.user!.id,
        country: answers.applicantCountry,
        targetCountries: answers.destinations,
        fieldOfStudy: answers.intendedMajor,
        degreeLevel: 'bachelor',
        targetExam,
        currentIeltsScore: answers.currentIeltsScore,
        targetIeltsScore: answers.targetIeltsScore,
        currentSatScore: answers.currentSatScore,
        targetSatScore: answers.targetSatScore,
        isPublic: false,
        showResults: false,
        showLeaderboard: false,
        showUniversity: false,
        showBadges: false,
      },
    }),
  ])
  return res.json({ diagnostic: serializeDiagnostic(updated) })
}))

export default router
