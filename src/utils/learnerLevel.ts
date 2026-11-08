// Mirrors backend/src/config/levelConfig.ts; awards remain server-authoritative.
export const LEVEL_THRESHOLDS = [0, 100, 300, 750, 1500, 3000, 5000, 8000, 13000, 20200] as const
export const MAX_LEARNER_LEVEL = 10

export function learnerLevel(xp: number) {
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0
  const level = LEVEL_THRESHOLDS.reduce<number>((current, threshold, index) => safeXp >= threshold ? index + 1 : current, 1)
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1]!
  const nextLevelThreshold = LEVEL_THRESHOLDS[level] ?? currentLevelThreshold
  const xpIntoCurrent = Math.max(0, safeXp - currentLevelThreshold)
  const levelSpan = Math.max(1, nextLevelThreshold - currentLevelThreshold)
  return { level, currentLevelThreshold, nextLevelThreshold, xpIntoCurrent, levelSpan,
    remaining: Math.max(0, nextLevelThreshold - safeXp),
    progressPercent: level === MAX_LEARNER_LEVEL ? 100 : Math.min(100, xpIntoCurrent / levelSpan * 100) }
}
