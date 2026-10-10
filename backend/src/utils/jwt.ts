import crypto from 'node:crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'

type AccessPayload = {
  sub: string
  role: 'USER' | 'ADMIN'
  sid?: string
}

type RefreshPayload = {
  sub: string
  tokenId: string
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  } as SignOptions)
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessPayload
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  } as SignOptions)
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as RefreshPayload
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateTokenId() {
  return crypto.randomUUID()
}

export function durationToMs(duration: string): number {
  const match = duration.trim().match(/^(\d+)([smhd])$/i)
  if (!match) {
    return 15 * 60 * 1000
  }

  const value = Number(match[1])
  const unit = match[2].toLowerCase()

  if (unit === 's') return value * 1000
  if (unit === 'm') return value * 60 * 1000
  if (unit === 'h') return value * 60 * 60 * 1000
  return value * 24 * 60 * 60 * 1000
}

export function getTokenExpiryDate(duration: string): Date {
  return new Date(Date.now() + durationToMs(duration))
}
