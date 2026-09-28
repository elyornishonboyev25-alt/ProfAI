import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

export const OWNER_EMAIL = 'elyornishonboyev000@gmail.com'

export async function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true } })
    if (user?.email.trim().toLowerCase() !== OWNER_EMAIL) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' })
    }
    res.setHeader('Cache-Control', 'no-store')
    return next()
  } catch (error) {
    return next(error)
  }
}
