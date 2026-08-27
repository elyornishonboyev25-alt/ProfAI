import type { Achievement, Difficulty } from '@prisma/client'

type UnlockContext = {
  existingAttemptCount: number
  projectedXp: number
  projectedCurrentStreak: number
  finalScore: number
  difficulty: Difficulty
}

export function resolveUnlockedAchievements(params: {
  availableAchievements: Achievement[]
  unlockedAchievementIds: Set<string>
  context: UnlockContext
}) {
  const unlocked: Achievement[] = []

  for (const achievement of params.availableAchievements) {
    if (params.unlockedAchievementIds.has(achievement.id)) {
      continue
    }

    const criteria = achievement.criteria as { type?: string; min?: number }
    const min = criteria.min ?? 0

    if (criteria.type === 'attempt_count' && params.context.existingAttemptCount + 1 >= min) {
      unlocked.push(achievement)
      continue
    }

    if (criteria.type === 'best_score' && params.context.finalScore >= min) {
      unlocked.push(achievement)
      continue
    }

    if (criteria.type === 'streak' && params.context.projectedCurrentStreak >= min) {
      unlocked.push(achievement)
      continue
    }

    if (criteria.type === 'xp' && params.context.projectedXp >= min) {
      unlocked.push(achievement)
      continue
    }
  }

  return unlocked
}
