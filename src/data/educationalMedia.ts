import catalog from '../../backend/src/data/educationalMedia.json'
import type { ShadowingVideoDetail, ShadowingVideoSummary } from '@/services/shadowing'

export type MediaLevel = 'A2' | 'B1' | 'B2' | 'C1'
export type EducationalMedia = {
  youtubeId: string; title: string; source: string; sourceUrl: string; channelUrl: string
  thumbnailUrl: string; durationSec: number; cefr: MediaLevel; category: string; focus: string; verifiedAt: string
}
export const SHADOWING_CATALOG = catalog.shadowing as EducationalMedia[]
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
