import crypto from 'node:crypto'
import type { Request } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

export const ONLINE_WINDOW_MS = 120_000

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

export async function createAuthSession(args: { userId: string; deviceId: string; userAgent?: string; ipAddress?: string; method: string; expiresAt: Date }, db: Prisma.TransactionClient = prisma) {
  return db.authSession.create({ data: {
    userId: args.userId, deviceId: args.deviceId, ...describeDevice(args.userAgent),
    ipAddress: args.ipAddress?.slice(0, 64), method: args.method, expiresAt: args.expiresAt,
  } })
}

export function onlineWhere(now = new Date()): Prisma.AuthSessionWhereInput {
  return { endedAt: null, expiresAt: { gt: now }, lastSeenAt: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } }
}
