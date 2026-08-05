import { apiClient } from '@/lib/apiClient'

export type PodcastSegment = {
  id: string
  orderIndex: number
  startSec: number
  endSec: number
  text: string
}

export type CommunityPodcastSummary = {
  id: string
  youtubeId: string
  title: string
  author: string | null
  thumbnailUrl: string | null
  durationSec: number
  level: string
  accent: string | null
  topic: string | null
  captionKind: string
  language: string
  segmentCount: number
  wordCount: number
  playCount: number
  createdAt: string
}

export type CommunityPodcastDetail = CommunityPodcastSummary & { segments: PodcastSegment[] }

export async function listCommunityPodcasts(): Promise<CommunityPodcastSummary[]> {
  const response = await apiClient.get<{ videos: CommunityPodcastSummary[] }>('/podcasts', { auth: true })
  return response.videos ?? []
}

export async function getCommunityPodcast(youtubeId: string): Promise<CommunityPodcastDetail> {
  const response = await apiClient.get<{ video: CommunityPodcastDetail }>(
    `/podcasts/${encodeURIComponent(youtubeId)}`,
    { auth: true },
  )
  return response.video
}

export async function submitCommunityPodcast(url: string): Promise<{ video: CommunityPodcastDetail; created: boolean }> {
  return apiClient.post<{ video: CommunityPodcastDetail; created: boolean }>('/podcasts', { url }, { auth: true })
}
