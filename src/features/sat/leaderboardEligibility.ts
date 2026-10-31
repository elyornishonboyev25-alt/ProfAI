import type { SATAttempt, SATModule } from './practiceTest4'
import { totalTime } from './timing'

export function minimumSATLeaderboardSeconds(modules: SATModule[]) {
  return new Set(modules.map(module => module.section)).size > 1 ? 30 * 60 : 10 * 60
}
export function isSATLeaderboardEligible(attempt: SATAttempt, modules: SATModule[]) {
  return attempt.leaderboardEligible !== false && totalTime(attempt, modules) >= minimumSATLeaderboardSeconds(modules)
}
