import type { SubtitleCue } from '@/utils/subtitleParser'

export type PodcastLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type PodcastEpisode = {
  id: string
  slug: string
  title: string
  description: string
  /** YouTube video id (the part after watch?v= or youtu.be/). */
  youtubeId: string
  /** Where playback should begin, in seconds. */
  startSeconds: number
  level: PodcastLevel
  durationLabel: string
  topic: string
  source: string
  /** Optional artwork supplied by the podcast source. Falls back to the video's YouTube thumbnail. */
  coverUrl?: string | null
  /** Transcript source state. Metadata-only podcasts remain fully playable. */
  captionKind?: 'manual' | 'auto' | 'generated' | 'unavailable'
  /**
   * Optional synced transcript. When present the transcript panel highlights
   * along with playback and each line is click-to-seek. When absent we rely on
   * YouTube's own English captions (toggled with the CC button on the player),
   * so subtitles are always available without shipping transcript text.
   */
  transcript?: SubtitleCue[]
}

/**
 * English-listening podcast episodes. More are added over time; the first one
 * is fully wired with the professional player below.
 */
export const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: 'ep-001',
    slug: 'english-listening-episode-1',
    title: 'English Listening Practice — Episode 1',
    description:
      'Sharpen your ear for natural, connected English. Listen actively, turn on captions, slow the pace down when you need to, and loop the tricky sections until every word is crystal clear.',
    youtubeId: 'P26AE7NLx4Q',
    startSeconds: 11,
    level: 'Intermediate',
    durationLabel: 'Full episode',
    topic: 'Everyday English',
    source: 'YouTube',
    captionKind: 'auto',
  },
]

export function getPodcastEpisode(slug?: string): PodcastEpisode {
  if (!slug) return PODCAST_EPISODES[0]
  return PODCAST_EPISODES.find((episode) => episode.slug === slug) ?? PODCAST_EPISODES[0]
}
