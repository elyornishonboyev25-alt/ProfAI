import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const OWNER_EMAILS = new Set([
  'elyornishonboyev000@gmail.com',
  'firdavsalimqulov998@gmail.com',
])

export async function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true } })
    if (!user || !OWNER_EMAILS.has(user.email.trim().toLowerCase())) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' })
    }
    res.setHeader('Cache-Control', 'no-store')
    return next()
  } catch (error) {
    return next(error)
  }
}
