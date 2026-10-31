/** Stable IDs of the first five entries in each live catalog. Never an attempt quota. */
export const FREE_CATALOG_SIZE = 5
export type StudySkill = 'reading' | 'listening' | 'writing' | 'speaking'
export const FREE_STUDY_IDS: Record<StudySkill, readonly string[]> = {
  reading: Array.from({ length: 5 }, (_, i) => `reading-roadmap-full-${i + 1}`),
  listening: Array.from({ length: 5 }, (_, i) => `ielts-listening-${i + 1}`),
  writing: Array.from({ length: 5 }, (_, i) => `writing-full-${i + 1}`),
  speaking: Array.from({ length: 5 }, (_, i) => `speaking-full-${i + 1}`),
}

export function isFreeStudyResource(resource: string): boolean {
  const mock = resource.match(/^mock:(ielts|sat):(.+)$/)
  if (mock) return (mock[1] === 'ielts' ? /^full-mock-[1-5]$/ : /^[1-5]$/).test(mock[2])
  const test = resource.match(/^test:(reading|listening|writing|speaking|sat):([^:]+)(?::(?:math|reading-writing))?$/)
  if (!test) return false
  if (test[1] === 'sat') return /^[1-5]$/.test(test[2])
  const skill = test[1] as StudySkill
  if (FREE_STUDY_IDS[skill].includes(test[2])) return true
  if (skill === 'writing' && /^writing-full-[1-5]-task-[12]$/.test(test[2])) return true
  // The first five Reading full tests contain these original roadmap passages.
  return skill === 'reading' && /^reading-day-(?:[1-9]|1[0-3])$/.test(test[2])
}

export function remainingPercent(used: number, limit: number | null): number {
  if (limit === null) return 100
  if (limit <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((1 - used / limit) * 100)))
}

// MAX remains the storage/payment identifier so existing purchases stay valid.
export const PLAN_NAMES = { FREE: 'Free', PRO: 'IvyGoo Pro', MAX: 'IvyGoo Elite' } as const
export const VOICE_DAILY_SECONDS = { FREE: 0, PRO: 60 * 60, MAX: 4 * 60 * 60 } as const
