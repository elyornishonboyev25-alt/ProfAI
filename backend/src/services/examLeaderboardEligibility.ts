type Assessment = { examType?: string; maxScore: number; durationSec: number; breakdown?: unknown }

/** Keep saved scores available while excluding incomplete/too-fast ranking runs. */
export function assessmentCountsForLeaderboard(result: Assessment) {
  if ((result.breakdown as { leaderboardEligible?: boolean } | null)?.leaderboardEligible === false) return false
  if (result.examType !== 'SAT') return true
  const minimum = result.maxScore === 1600 ? 1800 : result.maxScore === 800 ? 600 : Infinity
  return Number.isFinite(result.durationSec) && result.durationSec >= minimum
}
