import type { SkillTrackKey } from '@/lib/profileApi'

export type { SkillTrackKey }
export type BadgeGroup = 'IELTS' | 'SAT'

export type TrackMeta = {
  key: SkillTrackKey
  label: string
  short: string
  group: BadgeGroup
  /** lucide-react icon name used by the crest + shelf. */
  icon: 'Headphones' | 'BookOpen' | 'PenLine' | 'Mic' | 'Sigma' | 'Type' | 'Trophy'
  title: string
}

// Display order groups all IELTS tracks first, then SAT.
export const TRACK_ORDER: SkillTrackKey[] = [
  'IELTS_LISTENING',
  'IELTS_READING',
  'IELTS_WRITING',
  'IELTS_SPEAKING',
  'IELTS_OVERALL',
  'SAT_MATH',
  'SAT_ENGLISH',
  'SAT_OVERALL',
]

export const TRACK_META: Record<SkillTrackKey, TrackMeta> = {
  IELTS_LISTENING: { key: 'IELTS_LISTENING', label: 'IELTS Listening', short: 'Listening', group: 'IELTS', icon: 'Headphones', title: 'Listening Master' },
  IELTS_READING: { key: 'IELTS_READING', label: 'IELTS Reading', short: 'Reading', group: 'IELTS', icon: 'BookOpen', title: 'Reading Master' },
  IELTS_WRITING: { key: 'IELTS_WRITING', label: 'IELTS Writing', short: 'Writing', group: 'IELTS', icon: 'PenLine', title: 'Writing Master' },
  IELTS_SPEAKING: { key: 'IELTS_SPEAKING', label: 'IELTS Speaking', short: 'Speaking', group: 'IELTS', icon: 'Mic', title: 'Speaking Master' },
  IELTS_OVERALL: { key: 'IELTS_OVERALL', label: 'IELTS Full Mock', short: 'Full Mock', group: 'IELTS', icon: 'Trophy', title: 'IELTS Master' },
  SAT_MATH: { key: 'SAT_MATH', label: 'SAT Math', short: 'Math', group: 'SAT', icon: 'Sigma', title: 'Math Master' },
  SAT_ENGLISH: { key: 'SAT_ENGLISH', label: 'SAT Reading & Writing', short: 'Reading & Writing', group: 'SAT', icon: 'Type', title: 'Reading & Writing Master' },
  SAT_OVERALL: { key: 'SAT_OVERALL', label: 'Digital SAT Full Mock', short: 'Full Mock', group: 'SAT', icon: 'Trophy', title: 'SAT Master' },
}

/** IELTS achievements start at band 7; SAT overall achievements start at 1400. */
export const MIN_BADGE_BAND = 7
export const MIN_SAT_BADGE_SCORE = 1400
export const MIN_SAT_SECTION_BADGE_SCORE = 700

export function isCompleteIeltsObjectiveSection(track: 'IELTS_LISTENING' | 'IELTS_READING', availableParts: number, completedParts: number): boolean {
  const requiredParts = track === 'IELTS_LISTENING' ? 4 : 3
  return availableParts === requiredParts && completedParts === requiredParts
}

/** A complete IELTS exam at band 7.0+ unlocks the corresponding tier. */
export function tierForBand(band: number): 6 | 7 | 8 | 9 | null {
  if (!Number.isFinite(band) || band < MIN_BADGE_BAND || band > 9) return null
  const t = Math.min(9, Math.floor(band))
  return t as 6 | 7 | 8 | 9
}

export function tierForAchievement(track: SkillTrackKey, score: number): 6 | 7 | 8 | 9 | null {
  if (track === 'SAT_OVERALL') {
    if (!Number.isInteger(score) || score < MIN_SAT_BADGE_SCORE || score > 1600) return null
    if (score >= 1600) return 9
    if (score >= 1550) return 8
    return 7
  }
  if (track === 'SAT_MATH' || track === 'SAT_ENGLISH') {
    if (!Number.isInteger(score) || score < MIN_SAT_SECTION_BADGE_SCORE || score > 800) return null
    if (score >= 790) return 9
    if (score >= 750) return 8
    return 7
  }
  return tierForBand(score)
}

export const TIER_NAME: Record<number, string> = {
  6: 'Legacy',
  7: 'Gold',
  8: 'Platinum',
  9: 'Diamond',
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
  return isIeltsTrack(track) ? formatBand(score) : String(Math.round(score))
}

export function nextAchievementThreshold(track: SkillTrackKey, tier: number): number | null {
  if (tier >= 9) return null
  if (track === 'SAT_OVERALL') return tier === 7 ? 1550 : 1600
  if (track === 'SAT_MATH' || track === 'SAT_ENGLISH') return tier === 7 ? 750 : 790
  return tier === 7 ? 8 : 9
}
