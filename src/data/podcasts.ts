import type { SubtitleCue } from '@/utils/subtitleParser'
import { PODCAST_CATALOG, type MediaLevel } from './educationalMedia'

export type PodcastLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type PodcastEpisode = {
  id: string
  slug: string
  title: string
  description: string
  /** YouTube video id (the part after watch?v= or youtu.be/). */
  youtubeId: string
  durationSec: number
  sourceUrl: string
  /** Where playback should begin, in seconds. */
  startSeconds: number
  level: PodcastLevel
  durationLabel: string
  topic: string
  source: string
  cefr?: MediaLevel
  focus?: string
  /** Optional artwork supplied by the podcast source. Falls back to the video's YouTube thumbnail. */
  coverUrl?: string | null
  /** Transcript source state. Metadata-only podcasts remain fully playable. */
  captionKind?: 'manual' | 'auto' | 'generated' | 'unavailable'
  /**
   * Optional synced transcript. When present the transcript panel highlights
   * along with playback and each line is click-to-seek. When absent we rely on
   * YouTube's own English captions (toggled with the CC button on the player),
   * Caption availability depends on the source and YouTube's playback rules.
   */
  transcript?: SubtitleCue[]
}

/** Reviewed, stable IDs preserve per-episode listening progress. */
export const PODCAST_EPISODES: PodcastEpisode[] = PODCAST_CATALOG.map(item => ({
  id: 'curated-' + item.youtubeId, slug: 'curated-' + item.youtubeId, title: item.title,
  description: item.focus, durationSec: item.durationSec, sourceUrl: item.sourceUrl, youtubeId: item.youtubeId, startSeconds: 0,
  level: item.cefr === 'A2' ? 'Beginner' : item.cefr === 'C1' ? 'Advanced' : 'Intermediate',
  cefr: item.cefr, focus: item.focus,
  durationLabel: Math.floor(item.durationSec / 60) + ':' + String(item.durationSec % 60).padStart(2, '0'),
  topic: item.category, source: item.source, coverUrl: item.thumbnailUrl,
}))

export function getPodcastEpisode(slug?: string): PodcastEpisode {
  if (!slug) return PODCAST_EPISODES[0]
  return PODCAST_EPISODES.find((episode) => episode.slug === slug) ?? PODCAST_EPISODES[0]
}
