import type { SkillTrackKey } from '@/lib/profileApi'

export type { SkillTrackKey }
export type BadgeGroup = 'IELTS' | 'SAT'

export type TrackMeta = {
  key: SkillTrackKey
  label: string
  short: string
  group: BadgeGroup
  /** lucide-react icon name used by the crest + shelf. */
  icon: 'Headphones' | 'BookOpen' | 'PenLine' | 'Mic' | 'Sigma' | 'Type'
}

// Display order groups all IELTS tracks first, then SAT.
export const TRACK_ORDER: SkillTrackKey[] = [
  'IELTS_LISTENING',
  'IELTS_READING',
  'IELTS_WRITING',
  'IELTS_SPEAKING',
  'SAT_MATH',
  'SAT_ENGLISH',
  'SAT_OVERALL',
]

export const TRACK_META: Record<SkillTrackKey, TrackMeta> = {
  IELTS_LISTENING: { key: 'IELTS_LISTENING', label: 'IELTS Listening', short: 'Listening', group: 'IELTS', icon: 'Headphones' },
  IELTS_READING: { key: 'IELTS_READING', label: 'IELTS Reading', short: 'Reading', group: 'IELTS', icon: 'BookOpen' },
  IELTS_WRITING: { key: 'IELTS_WRITING', label: 'IELTS Writing', short: 'Writing', group: 'IELTS', icon: 'PenLine' },
  IELTS_SPEAKING: { key: 'IELTS_SPEAKING', label: 'IELTS Speaking', short: 'Speaking', group: 'IELTS', icon: 'Mic' },
  SAT_MATH: { key: 'SAT_MATH', label: 'SAT Math', short: 'Math', group: 'SAT', icon: 'Sigma' },
  SAT_ENGLISH: { key: 'SAT_ENGLISH', label: 'SAT English', short: 'English', group: 'SAT', icon: 'Type' },
  SAT_OVERALL: { key: 'SAT_OVERALL', label: 'Digital SAT Mock', short: 'SAT Overall', group: 'SAT', icon: 'Sigma' },
}

/** IELTS achievements start at band 7; SAT overall achievements start at 1400. */
export const MIN_BADGE_BAND = 7
export const MIN_SAT_BADGE_SCORE = 1400

/** Tier = floor(band) clamped to 6..9. Bands below 6 return null (no badge). */
export function tierForBand(band: number): 6 | 7 | 8 | 9 | null {
  if (!Number.isFinite(band) || band < MIN_BADGE_BAND) return null
  const t = Math.max(6, Math.min(9, Math.floor(band)))
  return t as 6 | 7 | 8 | 9
}

export function tierForAchievement(track: SkillTrackKey, score: number): 6 | 7 | 8 | 9 | null {
  if (track === 'SAT_OVERALL') {
    if (!Number.isFinite(score) || score < MIN_SAT_BADGE_SCORE) return null
    if (score >= 1600) return 9
    if (score >= 1550) return 8
    if (score >= 1500) return 7
    return 6
  }
  return tierForBand(score)
}

export const TIER_NAME: Record<number, string> = {
  6: 'Bronze',
  7: 'Silver',
  8: 'Gold',
  9: 'Diamond Elite',
}

export function trackLabel(track: SkillTrackKey): string {
  return TRACK_META[track]?.label ?? track
}

export function isIeltsTrack(track: SkillTrackKey): boolean {
  return TRACK_META[track]?.group === 'IELTS'
}

/** Format a band for display: always one decimal (8 -> "8.0", 8.5 -> "8.5"). */
export function formatBand(band: number): string {
  return band.toFixed(1)
}

export function formatAchievementScore(track: SkillTrackKey, score: number): string {
  return track === 'SAT_OVERALL' ? String(Math.round(score)) : formatBand(score)
}
