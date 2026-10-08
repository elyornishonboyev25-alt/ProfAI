import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/jwt.js'
import { prisma } from '../lib/prisma.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  const token = authHeader.slice(7)

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true } })
    if (!user) {
      return res.status(401).json({ message: 'This account no longer exists. Create a new account to continue.', code: 'ACCOUNT_DELETED' })
    }
    req.user = {
      id: user.id,
      role: user.role,
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

export function requireRole(allowed: Array<'ADMIN' | 'USER'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' })
    }

    return next()
  }
}
