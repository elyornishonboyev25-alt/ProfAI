import type { Prisma, PrismaClient } from '@prisma/client'

type LearningActivityClient = PrismaClient | Prisma.TransactionClient

export type LearningStreakSnapshot = {
  currentStreak: number
  longestStreak: number
  lastLearningAt: Date | null
}

function safeTimeZone(timeZone?: string | null) {
  if (!timeZone) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
    return timeZone
  } catch {
    return 'UTC'
  }
}

function dateKey(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function dayNumber(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

export function calculateLearningStreak(
  activityDates: Date[],
  now = new Date(),
  requestedTimeZone?: string | null,
): LearningStreakSnapshot {
  const timeZone = safeTimeZone(requestedTimeZone)
  const uniqueDays = [...new Set(activityDates.map((date) => dateKey(date, timeZone)))]
    .sort((left, right) => dayNumber(left) - dayNumber(right))

  let longestStreak = 0
  let runningStreak = 0
  let previousDay: number | null = null
  for (const key of uniqueDays) {
    const currentDay = dayNumber(key)
    runningStreak = previousDay !== null && currentDay - previousDay === 1 ? runningStreak + 1 : 1
    longestStreak = Math.max(longestStreak, runningStreak)
    previousDay = currentDay
  }

  const activeDays = new Set(uniqueDays.map(dayNumber))
  const today = dayNumber(dateKey(now, timeZone))
  let cursor = activeDays.has(today) ? today : today - 1
  let currentStreak = 0
  while (activeDays.has(cursor)) {
    currentStreak += 1
    cursor -= 1
  }

  const lastLearningAt = activityDates.reduce<Date | null>(
    (latest, date) => (!latest || date > latest ? date : latest),
    null,
  )

  return { currentStreak, longestStreak, lastLearningAt }
}

export async function getLearningStreakSnapshot(
  client: LearningActivityClient,
  userId: string,
  timeZone?: string | null,
  now = new Date(),
  additionalActivityDates: Date[] = [],
) {
  const [attempts, speakingSessions, xpEvents] = await Promise.all([
    client.testAttempt.findMany({
      where: { userId },
      select: { completedAt: true },
      orderBy: { completedAt: 'asc' },
    }),
    client.speakingSession.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    client.xpEvent.findMany({
      where: { userId, amount: { gt: 0 } },
      select: { earnedAt: true },
      orderBy: { earnedAt: 'asc' },
    }),
  ])

  return calculateLearningStreak(
    [
      ...attempts.map((attempt) => attempt.completedAt),
      ...speakingSessions.map((session) => session.createdAt),
      ...xpEvents.map((event) => event.earnedAt),
      ...additionalActivityDates,
    ],
    now,
    timeZone,
  )
}
