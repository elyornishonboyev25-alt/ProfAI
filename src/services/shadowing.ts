import { apiClient } from '@/lib/apiClient'

// Client for the shared shadowing library. A clip submitted by any user is saved
// once on the server (keyed by its YouTube id) and then served to everyone, so
// the library grows over time. The server is the only place that talks to
// YouTube — the browser just sends a link and renders what comes back.

export type ShadowingSegment = {
  id: string
  orderIndex: number
  startSec: number
  endSec: number
  text: string
}

export type ShadowingVideoSummary = {
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

export type ShadowingVideoDetail = ShadowingVideoSummary & {
  segments: ShadowingSegment[]
  captions?: ShadowingSegment[]
}

export async function listShadowingVideos(): Promise<ShadowingVideoSummary[]> {
  const res = await apiClient.get<{ videos: ShadowingVideoSummary[] }>('/shadowing', { auth: true })
  return res.videos ?? []
}

export async function getShadowingVideo(youtubeId: string, signal?: AbortSignal): Promise<ShadowingVideoDetail> {
  const res = await apiClient.get<{ video: ShadowingVideoDetail }>(
    `/shadowing/${encodeURIComponent(youtubeId)}`,
    { auth: true, signal },
  )
  return res.video
}

export async function submitShadowingVideo(
  url: string,
): Promise<{ video: ShadowingVideoDetail; created: boolean }> {
  return apiClient.post<{ video: ShadowingVideoDetail; created: boolean }>(
    '/shadowing',
    { url },
    { auth: true },
  )
}
