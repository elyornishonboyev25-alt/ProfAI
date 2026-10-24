import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { BillingError } from './billing.service.js'

/**
 * Every block of ten spins hands out exactly these prizes, in a freshly shuffled order:
 * one 50%, one 25%, one 20%, four 15%, two 10% and one 5%.
 * A drawn slot is consumed even if the winner never pays, so a 50% that expires
 * does not come back until the next block of ten.
 */
export const WHEEL_BLOCK = [50, 25, 20, 15, 15, 15, 15, 10, 10, 5] as const
export const WHEEL_SEGMENTS = [50, 10, 15, 5, 25, 15, 20, 10] as const
const JACKPOT_WINDOW_MS = 10 * 60_000
const DISCOUNT_WINDOW_MS = 24 * 3_600_000
const INIT_DATA_MAX_AGE_S = 24 * 3600

export type TelegramWebAppUser = { id: number; first_name?: string; username?: string }

/** Verifies Telegram Mini App launch data (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app). */
export function verifyInitData(initData: string, now = Date.now()): TelegramWebAppUser {
  const token = env.TELEGRAM_BOT_TOKEN.trim()
  if (!token) throw new BillingError('WHEEL_UNAVAILABLE', 'The wheel is not available yet.', 503)
  const params = new URLSearchParams(initData)
  const hash = params.get('hash') ?? ''
  params.delete('hash')
  const dataCheck = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest()
  const expected = crypto.createHmac('sha256', secret).update(dataCheck).digest()
  const actual = Buffer.from(hash, 'hex')
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new BillingError('INVALID_TELEGRAM_SESSION', 'Open the wheel from the Telegram bot.', 401)
  const authDate = Number(params.get('auth_date'))
  if (!Number.isFinite(authDate) || now / 1000 - authDate > INIT_DATA_MAX_AGE_S) throw new BillingError('INVALID_TELEGRAM_SESSION', 'This session expired. Reopen the wheel from the bot.', 401)
  const user = JSON.parse(params.get('user') ?? 'null') as TelegramWebAppUser | null
  if (!user?.id) throw new BillingError('INVALID_TELEGRAM_SESSION', 'Open the wheel from the Telegram bot.', 401)
  return user
}

function shuffledBlock() {
  const slots: number[] = [...WHEEL_BLOCK]
  for (let index = slots.length - 1; index > 0; index -= 1) {
    const swap = crypto.randomInt(index + 1)
    ;[slots[index], slots[swap]] = [slots[swap], slots[index]]
  }
  return slots
}

export function spinWindowMs(percent: number) {
  return percent === 50 ? JACKPOT_WINDOW_MS : DISCOUNT_WINDOW_MS
}

export async function spinFor(telegramId: string) {
  return prisma.wheelSpin.findUnique({ where: { telegramId } })
}

export async function drawSpin(telegramId: string, now = new Date()) {
  const link = await prisma.telegramLink.findUnique({ where: { chatId: telegramId }, select: { userId: true } })
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtextextended('wheel:draw', 0))`
    const previous = await tx.wheelSpin.findFirst({ where: { OR: [{ telegramId }, ...(link ? [{ userId: link.userId }] : [])] } })
    if (previous) return { spin: previous, fresh: false }
    let block = await tx.wheelBlock.findFirst({ where: { cursor: { lt: WHEEL_BLOCK.length } }, orderBy: { createdAt: 'asc' } })
    if (!block) block = await tx.wheelBlock.create({ data: { slots: shuffledBlock() } })
    const slot = block.cursor
    const percent = block.slots[slot]
    await tx.wheelBlock.update({ where: { id: block.id }, data: { cursor: { increment: 1 } } })
    const spin = await tx.wheelSpin.create({ data: {
      telegramId, userId: link?.userId ?? null, percent, blockId: block.id, slot, wonAt: now,
      expiresAt: new Date(now.getTime() + spinWindowMs(percent)),
    } })
    return { spin, fresh: true }
  })
}

export const isSpinUsable = (spin: { usedAt: Date | null; expiresAt: Date }, now = new Date()) => !spin.usedAt && spin.expiresAt > now

/** The wheel discount that applies to this site account right now, if any. */
export async function activeDiscount(userId: string, now = new Date()) {
  const link = await prisma.telegramLink.findUnique({ where: { userId }, select: { chatId: true } })
  const spin = await prisma.wheelSpin.findFirst({ where: { OR: [{ userId }, ...(link ? [{ telegramId: link.chatId }] : [])] } })
  if (!spin) return { spun: false as const, discount: null }
  return { spun: true as const, discount: isSpinUsable(spin, now) ? { id: spin.id, percent: spin.percent, expiresAt: spin.expiresAt.toISOString() } : null,
    lastPercent: spin.percent, expired: !spin.usedAt && spin.expiresAt <= now, used: Boolean(spin.usedAt) }
}
