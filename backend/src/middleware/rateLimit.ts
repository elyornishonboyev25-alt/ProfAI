import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please retry in a few minutes.' },
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Rate limit exceeded. Please slow down your requests.' },
})

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  message: { message: 'AI request limit reached. Please wait a moment and try again.' },
})

export const guestDiagnosticRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many diagnostic requests. Please wait a few minutes and try again.' },
})
