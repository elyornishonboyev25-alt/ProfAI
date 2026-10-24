import crypto from 'node:crypto'
import { isIP } from 'node:net'
import type { Request } from 'express'
import type { AuthSession, Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

export const ONLINE_WINDOW_MS = 120_000
export const MAX_ACCOUNT_DEVICES = 3
export const DEVICE_USAGE_WINDOW_MS = 120_000
// Browser profiles seen within this window can be recognised as the same device.
const DEVICE_MATCH_LOOKBACK_MS = 90 * 86_400_000

export class AuthSessionError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public details?: Record<string, unknown>) {
    super(message)
  }
}

/** Hashed signals that identify a physical device independently of the browser. */
export type DeviceSignals = { hardwareKey: string | null; gpuKey: string | null; networkKey: string | null }
type KnownSession = { deviceId: string; deviceKey?: string | null; hardwareKey?: string | null; gpuKey?: string | null; networkKey?: string | null }
type DeviceRow = { deviceId: string; deviceKey?: string | null; deviceType: string; browser: string; os: string; lastSeenAt: Date; usageUntil?: Date | null }

const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 32)
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
// v1|screen|colorDepth|cores|timezone|touchPoints|gpuVendor|gpuModel (see src/lib/deviceIdentity.ts)
const HINTS = /^v1\|(\d{2,5}x\d{2,5})\|(\d{1,2})\|(\d{1,3})\|([A-Za-z0-9_+\-/]{1,64})\|(\d{1,2})\|([a-z]{0,16})\|([a-z0-9 .+-]{0,64})$/

export function sessionDeviceKey(session: { deviceKey?: string | null; deviceId: string }) {
  return session.deviceKey || session.deviceId
}

export function describeDevice(userAgent = '') {
  const ua = userAgent.slice(0, 1024)
  const os = /Windows/i.test(ua) ? 'Windows' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Macintosh|Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Unknown'
  const browser = /Edg(?:e|A|iOS)?\//i.test(ua) ? 'Edge' : /OPR\//i.test(ua) ? 'Opera' : /YaBrowser\//i.test(ua) ? 'Yandex' : /SamsungBrowser\//i.test(ua) ? 'Samsung Internet' : /Firefox|FxiOS/i.test(ua) ? 'Firefox' : /Chrome|CriOS/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : 'Unknown'
  const deviceType = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? 'TABLET' : /Mobile|iPhone|iPod/i.test(ua) ? 'PHONE' : 'DESKTOP'
  return { os, browser, deviceType }
}

export function requestDeviceId(req: Request) {
  const id = req.get('X-Device-Id')
  // Old clients have no stable identifier. Do not infer a browser from IP or UA.
  return id && UUID.test(id) ? id.toLowerCase() : `unknown-${crypto.randomUUID()}`
}

/** The local network of an address: IPv4 /24 or IPv6 /64. */
export function networkKey(ip?: string | null) {
  let address = ip?.trim().toLowerCase().split('%')[0] ?? ''
  if (address.startsWith('::ffff:') && isIP(address.slice(7)) === 4) address = address.slice(7)
  const version = isIP(address)
  if (version === 4) return digest(`v4|${address.split('.').slice(0, 3).join('.')}`)
  if (version !== 6) return null
  const [head, tail] = address.split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const groups = tail === undefined ? left : [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
  return digest(`v6|${groups.slice(0, 4).map(group => group.padStart(4, '0')).join(':')}`)
}

export function deviceSignals(req: Request): DeviceSignals {
  const network = networkKey(req.ip)
  let hints = ''
  try { hints = decodeURIComponent(req.get('X-Device-Hints') ?? '').slice(0, 320) } catch { /* Malformed hints are ignored. */ }
  const match = HINTS.exec(hints)
  if (!match) return { hardwareKey: null, gpuKey: null, networkKey: network }
  const [, screen, depth, cores, zone, touch, gpuVendor, gpuModel] = match
  const { os, deviceType } = describeDevice(req.get('user-agent'))
  // Every browser on one computer reports the same screen, cores, time zone and GPU.
  const hardwareKey = digest(['hw1', os, deviceType, screen, depth, cores, zone, touch, gpuVendor].join('|'))
  // A named desktop GPU is distinctive enough to survive a change of monitor or network.
  const specific = deviceType === 'DESKTOP' && gpuModel.length >= 5 && /\d/.test(gpuModel) && !/swiftshader|llvmpipe|basic render|software/.test(gpuModel)
  return { hardwareKey, gpuKey: specific ? digest(['gpu1', os, cores, zone, gpuModel].join('|')) : null, networkKey: network }
}

export function requestDevice(req: Request) {
  return { deviceId: requestDeviceId(req), signals: deviceSignals(req) }
}

// Two of three independent signals must agree. The same hardware on another
// network, or the same network with other hardware, is a different device.
function sameDevice(signals: DeviceSignals, session: KnownSession) {
  const hardware = !!signals.hardwareKey && signals.hardwareKey === session.hardwareKey
  const gpu = !!signals.gpuKey && signals.gpuKey === session.gpuKey
  const network = !!signals.networkKey && signals.networkKey === session.networkKey
  return (hardware && network) || (gpu && (hardware || network))
}

async function knownSessions(db: Prisma.TransactionClient, userId: string, deviceId: string): Promise<KnownSession[]> {
  return db.authSession.findMany({
    where: { userId, OR: [{ deviceId }, { lastSeenAt: { gte: new Date(Date.now() - DEVICE_MATCH_LOOKBACK_MS) } }] },
    orderBy: { lastSeenAt: 'desc' }, take: 80,
    select: { deviceId: true, deviceKey: true, hardwareKey: true, gpuKey: true, networkKey: true },
  })
}

async function resolveDeviceKey(db: Prisma.TransactionClient, userId: string, deviceId: string, signals: DeviceSignals) {
  const known = await knownSessions(db, userId, deviceId)
  const sameBrowser = deviceId.startsWith('unknown-') ? undefined : known.find(session => session.deviceId === deviceId)
  if (sameBrowser) return sessionDeviceKey(sameBrowser)
  const twin = known.find(session => sameDevice(signals, session))
  return twin ? sessionDeviceKey(twin) : deviceId
}

async function activeDevices(db: Prisma.TransactionClient, userId: string): Promise<DeviceRow[]> {
  return db.authSession.findMany({
    where: { userId, endedAt: null, expiresAt: { gt: new Date() } },
    select: { deviceId: true, deviceKey: true, deviceType: true, browser: true, os: true, lastSeenAt: true, usageUntil: true },
  })
}

/** One entry per physical device, never exposing raw browser identifiers. */
export function summarizeDevices(rows: DeviceRow[], currentKey?: string) {
  const devices = new Map<string, { id: string; deviceType: string; os: string; browsers: string[]; lastSeenAt: Date | null; current: boolean }>()
  for (const row of rows) {
    const key = sessionDeviceKey(row)
    const device = devices.get(key) ?? { id: publicDeviceId(key), deviceType: row.deviceType, os: row.os, browsers: [], lastSeenAt: row.lastSeenAt ?? null, current: key === currentKey }
    if (!device.browsers.includes(row.browser)) device.browsers.push(row.browser)
    if (row.lastSeenAt && (!device.lastSeenAt || row.lastSeenAt > device.lastSeenAt)) device.lastSeenAt = row.lastSeenAt
    devices.set(key, device)
  }
  return [...devices.values()].sort((a, b) => Number(b.current) - Number(a.current) || (b.lastSeenAt?.getTime() ?? 0) - (a.lastSeenAt?.getTime() ?? 0))
}

export function publicDeviceId(deviceKey: string) {
  return digest(`device|${deviceKey}`).slice(0, 20)
}

// Call only while holding the account row lock. A denied request never renews
// its lease and cannot interrupt the device that is already using the account.
// Browsers on the same physical device share that device's access.
export async function assertDeviceAvailable(userId: string, deviceKey: string, db: Prisma.TransactionClient, rows?: DeviceRow[]) {
  const now = new Date()
  const holder = (rows ?? await activeDevices(db, userId))
    .filter(session => sessionDeviceKey(session) !== deviceKey && session.usageUntil && session.usageUntil > now)
    .sort((a, b) => b.usageUntil!.getTime() - a.usageUntil!.getTime())[0]
  if (holder) {
    const [device] = summarizeDevices([holder])
    throw new AuthSessionError(409, 'ACCOUNT_IN_USE', 'This account is being used on another device. Sign out there or close the site and wait up to 2 minutes before trying again.', {
      activeDevice: { deviceType: device.deviceType, os: device.os, browsers: device.browsers, lastSeenAt: device.lastSeenAt },
      retryAfterSec: Math.max(1, Math.ceil((holder.usageUntil!.getTime() - now.getTime()) / 1000)),
    })
  }
}

export async function acquireSessionUsage(userId: string, sessionId: string, deviceId?: string, options: { renew?: boolean; signals?: DeviceSignals } = {}) {
  const { renew = true, signals } = options
  return prisma.$transaction(async db => {
    await db.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`
    const session = await db.authSession.findUnique({ where: { id: sessionId } })
    if (!session || session.userId !== userId || session.endedAt || session.expiresAt <= new Date()) {
      throw new AuthSessionError(401, 'SESSION_EXPIRED', 'This session has ended. Please sign in again.')
    }
    if (deviceId !== undefined && !session.deviceId.startsWith('unknown-') && session.deviceId !== deviceId) {
      throw new AuthSessionError(401, 'SESSION_DEVICE_MISMATCH', 'Please sign in on this device.')
    }
    let deviceKey = sessionDeviceKey(session)
    const data: Prisma.AuthSessionUpdateInput = { lastSeenAt: new Date() }
    if (signals?.networkKey && signals.networkKey !== session.networkKey) data.networkKey = signals.networkKey
    if (signals?.hardwareKey && signals.hardwareKey !== session.hardwareKey) {
      data.hardwareKey = signals.hardwareKey
      data.gpuKey = signals.gpuKey
      // Sessions from before device signals adopt them once, joining any other
      // browser already known on this device so it stops counting separately.
      if (!session.hardwareKey) {
        const twin = (await knownSessions(db, userId, session.deviceId)).find(other => other.deviceId !== session.deviceId && sameDevice(signals, other))
        if (twin && sessionDeviceKey(twin) !== deviceKey) {
          deviceKey = sessionDeviceKey(twin)
          await db.authSession.updateMany({ where: { userId, deviceId: session.deviceId }, data: { deviceKey } })
        }
      }
    }
    await assertDeviceAvailable(userId, deviceKey, db)
    if (renew) data.usageUntil = new Date(Date.now() + DEVICE_USAGE_WINDOW_MS)
    return db.authSession.update({ where: { id: session.id }, data })
  })
}

/** Ends this browser's usage lease at once, e.g. when its last tab closes. */
export async function releaseSessionUsage(userId: string, sessionId: string) {
  await prisma.authSession.updateMany({ where: { id: sessionId, userId }, data: { usageUntil: null } })
}

export async function createAuthSession(args: { userId: string; deviceId: string; signals?: DeviceSignals; userAgent?: string; ipAddress?: string; method: string; expiresAt: Date }, db?: Prisma.TransactionClient): Promise<AuthSession> {
  if (!db) return prisma.$transaction(tx => createAuthSession(args, tx))
  // Serialize admission per account, including simultaneous logins and legacy
  // heartbeat adoption. Count signed-in physical devices, even when offline.
  await db.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${args.userId} FOR UPDATE`
  const signals = args.signals ?? { hardwareKey: null, gpuKey: null, networkKey: networkKey(args.ipAddress) }
  const deviceKey = await resolveDeviceKey(db, args.userId, args.deviceId, signals)
  const active = await activeDevices(db, args.userId)
  const devices = new Set(active.map(sessionDeviceKey))
  if (!devices.has(deviceKey) && devices.size >= MAX_ACCOUNT_DEVICES) {
    throw new AuthSessionError(403, 'DEVICE_LIMIT_REACHED', 'This account is already signed in on 3 devices. Sign out on another device before signing in here.', {
      maxDevices: MAX_ACCOUNT_DEVICES, devices: summarizeDevices(active).map(({ current: _current, ...device }) => device),
    })
  }
  await assertDeviceAvailable(args.userId, deviceKey, db, active)
  return db.authSession.create({ data: {
    userId: args.userId, deviceId: args.deviceId, deviceKey, ...signals, ...describeDevice(args.userAgent),
    ipAddress: args.ipAddress?.slice(0, 64), method: args.method, expiresAt: args.expiresAt,
    usageUntil: new Date(Date.now() + DEVICE_USAGE_WINDOW_MS),
  } })
}

export function onlineWhere(now = new Date()): Prisma.AuthSessionWhereInput {
  return { endedAt: null, expiresAt: { gt: now }, lastSeenAt: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } }
}
