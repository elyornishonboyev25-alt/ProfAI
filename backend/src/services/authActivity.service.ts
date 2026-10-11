import crypto from 'node:crypto'
import type { Request } from 'express'
import type { AuthSession, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

export const ONLINE_WINDOW_MS = 120_000
export const MAX_ACCOUNT_DEVICES = 3

export class AuthSessionError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message)
  }
}

export function describeDevice(userAgent = '') {
  const ua = userAgent.slice(0, 1024)
  const os = /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Macintosh|Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Unknown'
  const browser = /Edg(?:e|A|iOS)?\//i.test(ua) ? 'Edge' : /OPR\//i.test(ua) ? 'Opera' : /Firefox|FxiOS/i.test(ua) ? 'Firefox' : /Chrome|CriOS/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : 'Unknown'
  const deviceType = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? 'TABLET' : /Mobile|iPhone|iPod/i.test(ua) ? 'PHONE' : 'DESKTOP'
  return { os, browser, deviceType }
}

export function requestDeviceId(req: Request) {
  const id = req.get('X-Device-Id')
  // Old clients have no stable identifier. Do not infer a device from IP or UA.
  return id && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)
    ? id.toLowerCase() : `unknown-${crypto.randomUUID()}`
}

export async function createAuthSession(args: { userId: string; deviceId: string; userAgent?: string; ipAddress?: string; method: string; expiresAt: Date }, db?: Prisma.TransactionClient): Promise<AuthSession> {
  if (!db) return prisma.$transaction(tx => createAuthSession(args, tx))
  // Serialize admission per account, including simultaneous logins and legacy
  // heartbeat adoption. Count signed-in devices, even when currently offline.
  await db.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${args.userId} FOR UPDATE`
  const active = await db.authSession.findMany({
    where: { userId: args.userId, endedAt: null, expiresAt: { gt: new Date() } },
    distinct: ['deviceId'],
    select: { deviceId: true },
  })
  const existing = active.find(session => session.deviceId === args.deviceId)
  if (!existing && new Set(active.map(session => session.deviceId)).size >= MAX_ACCOUNT_DEVICES) {
    throw new AuthSessionError(403, 'DEVICE_LIMIT_REACHED', 'This account is already signed in on 3 devices. Sign out on another device before signing in here.')
  }
  return db.authSession.create({ data: {
    userId: args.userId, deviceId: args.deviceId, ...describeDevice(args.userAgent),
    ipAddress: args.ipAddress?.slice(0, 64), method: args.method, expiresAt: args.expiresAt,
  } })
}

export function onlineWhere(now = new Date()): Prisma.AuthSessionWhereInput {
  return { endedAt: null, expiresAt: { gt: now }, lastSeenAt: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } }
}
