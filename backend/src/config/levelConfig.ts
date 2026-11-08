// Lifetime learning XP; mirrored by src/utils/learnerLevel.ts.
export const LEVEL_THRESHOLDS = [0, 100, 300, 750, 1500, 3000, 5000, 8000, 13000, 20200] as const
export const MAX_LEARNER_LEVEL = 10

export function resolveLevelFromXp(xp: number): number {
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0
  return LEVEL_THRESHOLDS.reduce<number>((level, threshold, index) => safeXp >= threshold ? index + 1 : level, 1)
}

export function getLevelProgress(xp: number, _savedLevel?: number) {
  const level = resolveLevelFromXp(xp)
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1]!
  const nextLevelThreshold = LEVEL_THRESHOLDS[level] ?? currentLevelThreshold
  const xpIntoCurrent = Math.max(0, (Number.isFinite(xp) ? xp : 0) - currentLevelThreshold)
  const levelSpan = Math.max(1, nextLevelThreshold - currentLevelThreshold)
  return { currentLevelThreshold, nextLevelThreshold, xpIntoCurrent, levelSpan,
    progressPercent: level === MAX_LEARNER_LEVEL ? 100 : Math.min(100, xpIntoCurrent / levelSpan * 100) }
}
