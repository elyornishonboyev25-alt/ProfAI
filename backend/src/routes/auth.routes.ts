import crypto from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../lib/prisma.js'
import { authRateLimit } from '../middleware/rateLimit.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import {
  generateTokenId,
  getTokenExpiryDate,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js'
import { env } from '../config/env.js'
import { requireAuth } from '../middleware/auth.js'
import { isPremiumUser } from '../utils/premium.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email().refine((value) => value.toLowerCase().endsWith('@gmail.com'), {
    message: 'Use your Gmail address.',
  }),
  password: z.string().min(8).max(72),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
})

const deleteAccountSchema = z.object({
  email: z.string().email(),
  confirmation: z.literal('DELETE'),
})

const googleAuthSchema = z.object({
  idToken: z.string().min(1),
  // When false (sign-in page) we refuse to create a brand-new account — the
  // user must register first. Defaults to true so the register page still
  // creates an account on first Google sign-up.
  allowCreate: z.boolean().optional().default(true),
})

const resolvedGoogleClientId = (env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || '').trim()
const googleOAuthClient = new OAuth2Client()

function sanitizeUser(user: {
  id: string
  email: string
  fullName: string
  role: 'USER' | 'ADMIN'
  xp: number
  level: number
  currentStreak: number
  nickname?: string | null
  avatarUrl?: string | null
  profile?: { onboardingCompletedAt: Date | null } | null
}) {
  const premium = isPremiumUser({
    role: user.role,
    email: user.email,
    nickname: user.nickname,
  })

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    premium,
    xp: user.xp,
    level: user.level,
    currentStreak: user.currentStreak,
    nickname: user.nickname ?? null,
    avatarUrl: user.avatarUrl ?? null,
    onboardingCompleted: Boolean(user.profile?.onboardingCompletedAt),
  }
}

function deriveFullNameFromEmail(email: string) {
  const localPart = email.split('@')[0] || 'ProfAI Learner'
  const cleaned = localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return 'ProfAI Learner'

  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .slice(0, 80)
}

async function issueAuthTokens(args: {
  userId: string
  role: 'USER' | 'ADMIN'
  ipAddress?: string
  userAgent?: string
}) {
  const accessToken = signAccessToken({
    sub: args.userId,
    role: args.role,
  })

  const tokenId = generateTokenId()
  const refreshToken = signRefreshToken({
    sub: args.userId,
    tokenId,
  })

  await prisma.refreshToken.create({
    data: {
      userId: args.userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getTokenExpiryDate(env.REFRESH_TOKEN_EXPIRES_IN),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    },
  })

  return { accessToken, refreshToken }
}

async function verifyGoogleIdentityToken(idToken: string) {
  if (!resolvedGoogleClientId) {
    throw new Error('Google authentication is not configured on the server.')
  }

  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: resolvedGoogleClientId,
  })

  const payload = ticket.getPayload()
  if (!payload?.email || !payload.email_verified) {
    throw new Error('Google account email is not verified.')
  }

  const normalizedEmail = payload.email.toLowerCase().trim()
  const normalizedName = payload.name?.trim() || normalizedEmail.split('@')[0]

  return {
    email: normalizedEmail,
    fullName: normalizedName,
  }
}

router.post(
  '/register',
  authRateLimit,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const normalizedEmail = email.trim().toLowerCase()
    const fullName = deriveFullNameFromEmail(normalizedEmail)

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (exists) {
      return res.status(409).json({ message: 'User with this email already exists.' })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        fullName,
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        xp: true,
        level: true,
        currentStreak: true,
        nickname: true,
        avatarUrl: true,
        profile: { select: { onboardingCompletedAt: true } },
      },
    })

    const tokens = await issueAuthTokens({
      userId: user.id,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })

    return res.status(201).json({
      user: sanitizeUser(user),
      ...tokens,
    })
  }),
)

router.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        xp: true,
        level: true,
        currentStreak: true,
        nickname: true,
        avatarUrl: true,
        profile: { select: { onboardingCompletedAt: true } },
        passwordHash: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        message: 'No account found for this email. Create an account to get started.',
        code: 'ACCOUNT_NOT_FOUND',
      })
    }

    const passwordValid = await verifyPassword(password, user.passwordHash)
    if (!passwordValid) {
      return res.status(401).json({
        message: 'Incorrect password. Please try again.',
        code: 'INVALID_PASSWORD',
      })
    }

    const tokens = await issueAuthTokens({
      userId: user.id,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })

    return res.json({
      user: sanitizeUser(user),
      ...tokens,
    })
  }),
)

router.post(
  '/google',
  authRateLimit,
  validateBody(googleAuthSchema),
  asyncHandler(async (req, res) => {
    const { idToken, allowCreate } = req.body

    let identity: { email: string; fullName: string }
    try {
      identity = await verifyGoogleIdentityToken(idToken)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google token validation failed.'
      const statusCode = message.includes('configured') ? 503 : 401
      return res.status(statusCode).json({ message })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: identity.email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        xp: true,
        level: true,
        currentStreak: true,
        nickname: true,
        avatarUrl: true,
        profile: { select: { onboardingCompletedAt: true } },
      },
    })

    if (!existingUser && !allowCreate) {
      return res.status(404).json({
        message: 'No account found for this Google email. Create an account to get started.',
        code: 'ACCOUNT_NOT_FOUND',
      })
    }

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          fullName: identity.fullName,
          email: identity.email,
          // Keep password auth path consistent while creating OAuth-first accounts.
          passwordHash: await hashPassword(`google-oauth-${crypto.randomUUID()}`),
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          xp: true,
          level: true,
          currentStreak: true,
          nickname: true,
          avatarUrl: true,
          profile: { select: { onboardingCompletedAt: true } },
        },
      }))

    const tokens = await issueAuthTokens({
      userId: user.id,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })

    return res.status(existingUser ? 200 : 201).json({
      user: sanitizeUser(user),
      ...tokens,
    })
  }),
)

router.get(
  '/google/config',
  authRateLimit,
  asyncHandler(async (_req, res) => {
    return res.json({
      enabled: Boolean(resolvedGoogleClientId),
      clientId: resolvedGoogleClientId || null,
    })
  }),
)

router.post(
  '/refresh',
  authRateLimit,
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body

    let payload: { sub: string; tokenId: string }
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token.' })
    }

    const tokenHash = hashToken(refreshToken)

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            xp: true,
            level: true,
            currentStreak: true,
            nickname: true,
            avatarUrl: true,
            profile: { select: { onboardingCompletedAt: true } },
          },
        },
      },
    })

    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.userId !== payload.sub) {
      return res.status(401).json({ message: 'Refresh token expired or revoked.' })
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const tokens = await issueAuthTokens({
      userId: stored.user.id,
      role: stored.user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    })

    return res.json({
      user: sanitizeUser(stored.user),
      ...tokens,
    })
  }),
)

router.post(
  '/logout',
  requireAuth,
  validateBody(logoutSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body

    await prisma.refreshToken.updateMany({
      where: {
        userId: req.user!.id,
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })

    return res.status(204).send()
  }),
)

router.delete(
  '/account',
  authRateLimit,
  requireAuth,
  validateBody(deleteAccountSchema),
  asyncHandler(async (req, res) => {
    const { email, confirmation } = req.body
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true },
    })

    if (!user) {
      return res.status(404).json({ message: 'User account was not found.' })
    }

    if (confirmation !== 'DELETE' || email.trim().toLowerCase() !== user.email.toLowerCase()) {
      return res.status(400).json({
        message: 'Account confirmation did not match.',
        code: 'ACCOUNT_CONFIRMATION_MISMATCH',
      })
    }

    // User-owned records cascade at the database layer. Shared resources such
    // as authored tests and submitted shadowing videos retain their content and
    // simply clear the author reference (onDelete: SetNull).
    await prisma.user.delete({ where: { id: user.id } })

    return res.status(204).send()
  }),
)

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        xp: true,
        level: true,
        currentStreak: true,
        nickname: true,
        avatarUrl: true,
        profile: { select: { onboardingCompletedAt: true } },
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    return res.json({ user: sanitizeUser(user) })
  }),
)

export default router
