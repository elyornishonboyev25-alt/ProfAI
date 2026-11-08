import rateLimit, { type AugmentedRequest, type RateLimitExceededEventHandler } from 'express-rate-limit'
import { env } from '../config/env.js'

function speakingLimitHandler(code: string, message: string): RateLimitExceededEventHandler {
  return (req, res) => {
    const reset = (req as AugmentedRequest).rateLimit.resetTime?.getTime() ?? Date.now() + 60_000
    res.status(429).json({ message, code, details: { retryAfterMs: Math.max(1000, reset - Date.now()) } })
  }
}

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

// Voice playback and transcription are part of each Speaking turn. They must
// not spend the same request allowance as the final assessment or AI chat.
export const speakingMediaRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  handler: speakingLimitHandler('SPEAKING_MEDIA_RATE_LIMIT', 'Too many audio requests. Please wait a moment and retry.'),
})

export const speakingAssessmentRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  handler: speakingLimitHandler('SPEAKING_ASSESSMENT_RATE_LIMIT', 'Too many assessment requests. Please wait a moment and retry.'),
})

export const guestDiagnosticRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many diagnostic requests. Please wait a few minutes and try again.' },
})
