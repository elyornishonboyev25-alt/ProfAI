import type { Prisma, PrismaClient } from '@prisma/client'
import { resolveLevelFromXp } from '../config/levelConfig.js'

type XpClient = PrismaClient | Prisma.TransactionClient

export const XP_REWARD_POLICY = {
  DAILY_LOGIN: { fixed: 5, dailyCap: 5 },
  STUDY_VOCABULARY: { perFiveMinutes: 4, dailyCap: 40 },
  STUDY_ARTICLES: { perFiveMinutes: 3, dailyCap: 30 },
  STUDY_PODCAST: { perFiveMinutes: 3, dailyCap: 30 },
  STUDY_SHADOWING: { perFiveMinutes: 4, dailyCap: 40 },
  STUDY_ADMISSION: { perFiveMinutes: 2, dailyCap: 20 },
  VOCAB_FLASHCARDS: { fixed: 12, dailyCap: 120 },
  VOCAB_MATCHING: { fixed: 20, dailyCap: 120 },
  VOCAB_QUIZ: { base: 10, performancePool: 20, dailyCap: 120 },
  VOCAB_TYPING: { base: 10, performancePool: 25, dailyCap: 120 },
  WRITING: { base: 20, performancePool: 60, dailyCap: 240 },
  SPEAKING: { base: 15, performancePool: 45, durationPool: 10, dailyCap: 210 },
  SAT_PRACTICE: { quadraticCap: 100, dailyCap: 300 },
} as const

export type XpRewardSource = keyof typeof XP_REWARD_POLICY

export type XpRewardInput = {
  source: XpRewardSource
  accuracy?: number
  band?: number
  durationSec?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0))
}

export function calculateActivityXp(input: XpRewardInput) {
  const policy = XP_REWARD_POLICY[input.source]
  if ('fixed' in policy) return policy.fixed
  if ('perFiveMinutes' in policy) return policy.perFiveMinutes
  if ('quadraticCap' in policy) {
    const ratio = clamp(input.accuracy ?? 0, 0, 100) / 100
    return Math.round(policy.quadraticCap * ratio * ratio)
  }

  if (input.source === 'SPEAKING') {
    const speakingPolicy = XP_REWARD_POLICY.SPEAKING
    const performance = Math.round((clamp(input.band ?? 0, 0, 9) / 9) * speakingPolicy.performancePool)
    const duration = Math.min(speakingPolicy.durationPool, Math.floor(Math.max(0, input.durationSec ?? 0) / 120) * 2)
    return speakingPolicy.base + performance + duration
  }

  if (input.source === 'WRITING') {
    const writingPolicy = XP_REWARD_POLICY.WRITING
    return writingPolicy.base + Math.round((clamp(input.band ?? 0, 0, 9) / 9) * writingPolicy.performancePool)
  }

  return policy.base + Math.round((clamp(input.accuracy ?? 0, 0, 100) / 100) * policy.performancePool)
}

export function localDateKey(value: Date, requestedTimeZone?: string | null) {
  let timeZone = requestedTimeZone || 'UTC'
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone }).format(value)
  } catch {
    timeZone = 'UTC'
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${read('year')}-${read('month')}-${read('day')}`
}

function dailySourceFilter(source: XpRewardSource) {
  if (source.startsWith('VOCAB_')) return { startsWith: 'VOCAB_' }
  return { equals: source }
}

export async function awardActivityXp(
  client: XpClient,
  params: XpRewardInput & {
    userId: string
    eventKey: string
    earnedAt?: Date
    metadata?: Prisma.InputJsonValue
  },
) {
  const earnedAt = params.earnedAt ?? new Date()
  const normalizedEventKey = `${params.source}:${params.eventKey}`.slice(0, 240)
  const existing = await client.xpEvent.findUnique({
    where: { userId_eventKey: { userId: params.userId, eventKey: normalizedEventKey } },
    select: { amount: true },
  })
  if (existing) {
    const user = await client.user.findUnique({
      where: { id: params.userId },
      select: { xp: true, level: true },
    })
    return { duplicate: true, xpEarned: 0, originalXp: existing.amount, totalXp: user?.xp ?? 0, level: user?.level ?? 1 }
  }

  const requestedAmount = calculateActivityXp(params)
  const dayStart = new Date(earnedAt)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
  const awardedToday = await client.xpEvent.aggregate({
    where: {
      userId: params.userId,
      source: dailySourceFilter(params.source),
      earnedAt: { gte: dayStart, lt: dayEnd },
    },
    _sum: { amount: true },
  })
  const dailyCap = XP_REWARD_POLICY[params.source].dailyCap
  const amount = Math.max(0, Math.min(requestedAmount, dailyCap - (awardedToday._sum.amount ?? 0)))

  const user = await client.user.findUnique({
    where: { id: params.userId },
    select: { xp: true, level: true },
  })
  if (!user) throw new Error('User not found while awarding XP.')

  await client.xpEvent.create({
    data: {
      userId: params.userId,
      source: params.source,
      eventKey: normalizedEventKey,
      amount,
      metadata: params.metadata,
      earnedAt,
    },
  })

  const totalXp = user.xp + amount
  const level = resolveLevelFromXp(totalXp)
  if (amount > 0) {
    await client.user.update({
      where: { id: params.userId },
      data: { xp: totalXp, level },
    })
    if (level > user.level) {
      await client.notification.create({
        data: {
          userId: params.userId,
          type: 'LEVEL_UP',
          title: 'Level Up!',
          message: `You reached level ${level}. Keep your momentum going.`,
          metadata: { levelBefore: user.level, levelAfter: level, source: params.source },
        },
      })
    }
  }

  return { duplicate: false, xpEarned: amount, originalXp: amount, totalXp, level }
}
