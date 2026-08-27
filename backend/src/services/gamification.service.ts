import { Difficulty } from '@prisma/client'
import { resolveLevelFromXp } from '../config/levelConfig.js'
import { isSameUtcDay, startOfUtcDay } from '../utils/date.js'

type StreakInput = {
  lastActiveDate: Date | null
  currentStreak: number
  longestStreak: number
  now: Date
}

type StreakOutput = {
  currentStreak: number
  longestStreak: number
  lastActiveDate: Date
}

/**
 * Transparent, predictable XP rewards by difficulty.
 *
 * These are the base caps before streak/perfect bonuses. Accuracy scales the
 * base quadratically — so 50% gives 25%, 70% gives 49%, etc. That curve is
 * what makes high scores feel rewarding: the gap between a 70% and a 100%
 * is much bigger than between 30% and 60%, which is the gamification hook.
 *
 * Examples (Hard test, cap=100, before streak/perfect bonuses):
 *   100% accuracy  -> 100 XP (perfect)
 *    90% accuracy  ->  81 XP
 *    80% accuracy  ->  64 XP
 *    70% accuracy  ->  49 XP
 *    50% accuracy  ->  25 XP
 *    30% accuracy  ->   9 XP
 *     0% accuracy  ->   0 XP
 *
 */
export const MAX_XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 40,
  MEDIUM: 70,
  HARD: 100,
}

/** Small streak kicker capped at +20% — keeps daily players ahead, never dominates. */
const STREAK_BONUS_PER_DAY = 0.025 // +2.5% per streak day
const STREAK_BONUS_MAX = 0.2 // hard cap +20%

/** Tiny perfect-run kicker: rewards exact 100% with a +10% flourish. */
const PERFECT_BONUS = 0.1

export const TEST_XP_POLICY = {
  difficultyCaps: MAX_XP_BY_DIFFICULTY,
  accuracyExponent: 2,
  streakBonusPerDay: STREAK_BONUS_PER_DAY,
  maximumStreakBonus: STREAK_BONUS_MAX,
  perfectScoreBonus: PERFECT_BONUS,
  formula: 'round(cap × (accuracy / 100)^2 × (1 + streakBonus + perfectBonus))',
} as const

export function computeStreak(input: StreakInput): StreakOutput {
  const today = startOfUtcDay(input.now)

  if (!input.lastActiveDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, input.longestStreak),
      lastActiveDate: today,
    }
  }

  const lastDate = startOfUtcDay(input.lastActiveDate)

  if (isSameUtcDay(lastDate, today)) {
    return {
      currentStreak: input.currentStreak,
      longestStreak: input.longestStreak,
      lastActiveDate: lastDate,
    }
  }

  const dayDiff = Math.round((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))
  const currentStreak = dayDiff === 1 ? input.currentStreak + 1 : 1
  const longestStreak = Math.max(input.longestStreak, currentStreak)

  return {
    currentStreak,
    longestStreak,
    lastActiveDate: today,
  }
}

/**
 * The one and only XP formula. Predictable enough that players can mentally
 * estimate their reward before they hit submit.
 *
 *   xp = MAX(difficulty) × (score%)²   ×   (1 + streak_bonus)   ×   (perfect_bonus_if_100%)
 *
 * @param input.difficulty            Test difficulty tier (drives the cap).
 * @param input.performancePercent    The submission score, 0–100. For tests this
 *                                    is the accuracy (correct/total). Time and
 *                                    other side metrics intentionally do NOT
 *                                    enter the formula — they showed up in the
 *                                    old multi-multiplier model and made the
 *                                    reward unpredictable.
 * @param input.streak                Current daily streak (days). Small bonus.
 * @param input.baseXpOverride        Optional explicit cap (e.g. a curated test).
 */
export function calculateXp(input: {
  baseXp?: number
  baseXpOverride?: number | null
  difficulty: Difficulty
  performancePercent: number
  streak: number
  // Legacy positional params kept for back-compat — ignored by the new formula.
  timeBonus?: number
}): number {
  void input.timeBonus

  const cap = Math.max(
    1,
    input.baseXpOverride ?? input.baseXp ?? MAX_XP_BY_DIFFICULTY[input.difficulty],
  )

  const scoreRatio = Math.max(0, Math.min(100, input.performancePercent)) / 100
  const performanceFactor = scoreRatio * scoreRatio // quadratic curve

  const streakDays = Math.max(0, Math.floor(input.streak ?? 0))
  const streakBonus = Math.min(STREAK_BONUS_MAX, streakDays * STREAK_BONUS_PER_DAY)
  const perfectBonus = scoreRatio >= 0.999 ? PERFECT_BONUS : 0

  const xp = cap * performanceFactor * (1 + streakBonus + perfectBonus)
  return Math.max(0, Math.round(xp))
}

export function resolveLevelTransition(currentXp: number, gainedXp: number) {
  const levelBefore = resolveLevelFromXp(currentXp)
  const nextXp = currentXp + gainedXp
  const levelAfter = resolveLevelFromXp(nextXp)

  return {
    nextXp,
    levelBefore,
    levelAfter,
    leveledUp: levelAfter > levelBefore,
  }
}
