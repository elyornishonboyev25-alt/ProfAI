import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const OWNER_EMAILS = new Set([
  'elyornishonboyev000@gmail.com',
  'firdavsalimqulov998@gmail.com',
])

const OWNER_NICKNAMES = new Set(['erkinov'])

// Owner handles cannot be claimed by another account if their current holder
// renames or deletes the profile.
export async function canUseOwnerNickname(userId: string, nickname: string): Promise<boolean> {
  const normalized = nickname.trim().toLowerCase()
  if (!OWNER_NICKNAMES.has(normalized)) return true
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { nickname: true } })
  return user?.nickname?.trim().toLowerCase() === normalized
}

export async function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true, nickname: true } })
    const owner = user && (
      OWNER_EMAILS.has(user.email.trim().toLowerCase()) ||
      Boolean(user.nickname && OWNER_NICKNAMES.has(user.nickname.trim().toLowerCase()))
    )
    if (!owner) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' })
    }
    res.setHeader('Cache-Control', 'no-store')
    return next()
  } catch (error) {
    return next(error)
  }
}
