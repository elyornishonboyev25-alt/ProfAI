export const SAT_CURRENT_SCORE_MIN = 400
export const SAT_TARGET_SCORE_MIN = 1000
export const SAT_SCORE_MAX = 1600

export function normalizeSATScore(score: number, target = false) {
  return Math.max(target ? SAT_TARGET_SCORE_MIN : SAT_CURRENT_SCORE_MIN,
    Math.min(SAT_SCORE_MAX, Math.round(score / 10) * 10))
}
