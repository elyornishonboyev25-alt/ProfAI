import catalog from '../../backend/src/data/educationalMedia.json'
import type { ShadowingVideoDetail, ShadowingVideoSummary } from '@/services/shadowing'

export type MediaLevel = 'A2' | 'B1' | 'B2' | 'C1'
export type EducationalMedia = {
  youtubeId: string; title: string; source: string; sourceUrl: string; channelUrl: string
  thumbnailUrl: string; durationSec: number; cefr: MediaLevel; category: string; focus: string; verifiedAt: string
}
// Longer source lessons are offered as explicitly bounded two-minute excerpts.
export const SHADOWING_CATALOG = (catalog.shadowing as EducationalMedia[]).map(item => ({ ...item, durationSec: Math.min(120, item.durationSec) }))
export const PODCAST_CATALOG = catalog.podcasts as EducationalMedia[]

export function mediaSummary(item: EducationalMedia): ShadowingVideoSummary {
  return {
    id: `curated-${item.youtubeId}`, youtubeId: item.youtubeId, title: item.title,
    author: item.source, thumbnailUrl: item.thumbnailUrl, durationSec: item.durationSec,
    level: item.cefr === 'A2' ? 'Beginner' : item.cefr === 'C1' ? 'Advanced' : 'Intermediate',
    accent: item.source === 'BBC Learning English' ? 'British' : 'American',
    topic: item.category, captionKind: 'unavailable', language: 'en',
    segmentCount: 0, wordCount: 0, playCount: 0, createdAt: `${item.verifiedAt}T00:00:00.000Z`,
  }
}
/** Honest fallback: timed listening intervals, never an invented transcript. */
export function guidedShadowing(item: EducationalMedia): ShadowingVideoDetail { return { ...mediaSummary(item), segments: [] } }

export function filterMedia<T>(items: T[], metadata: (item: T) => EducationalMedia, query: string, level: string, category: string): T[] {
  const needle = query.trim().toLocaleLowerCase()
  return items.filter(item => {
    const media = metadata(item)
    return (level === 'All' || media.cefr === level) && (category === 'All' || media.category === category)
      && (!needle || `${media.title} ${media.source} ${media.category} ${media.focus}`.toLocaleLowerCase().includes(needle))
  })
}

export type MediaDuration = 'All' | '1-10' | '10-30' | '30-60' | '60+'
export const DURATION_OPTIONS: { value: MediaDuration; label: string }[] = [
  { value: 'All', label: 'All durations' }, { value: '1-10', label: '1–10 minutes' },
  { value: '10-30', label: '10–30 minutes' }, { value: '30-60', label: '30–60 minutes' },
  { value: '60+', label: 'Over 60 minutes' },
]
/** Adjacent ranges do not overlap: exactly ten minutes belongs to 1–10. */
export function matchesMediaDuration(seconds: number, duration: MediaDuration): boolean {
  switch (duration) {
    case '1-10': return seconds >= 60 && seconds <= 600
    case '10-30': return seconds > 600 && seconds <= 1800
    case '30-60': return seconds > 1800 && seconds <= 3600
    case '60+': return seconds > 3600
    default: return true
  }
}
