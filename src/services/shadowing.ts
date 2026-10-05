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

export type SharedShadowingRecording = {
  id: string; title: string; youtubeId: string; durationSec: number; createdAt: string
}
export function getSharedShadowingRecording(id: string, signal?: AbortSignal) {
  return apiClient.get<{ recording: SharedShadowingRecording }>(`/shadowing-recordings/${encodeURIComponent(id)}`, { auth: false, signal })
}
export async function shareShadowingRecording(blob: Blob, youtubeId: string, durationSec: number, recordingKey: string) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const parts: string[] = []
  for (let offset = 0; offset < bytes.length; offset += 32768) parts.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)))
  const audioBase64 = btoa(parts.join(''))
  return apiClient.post<{ path: string }>('/shadowing-recordings', {
    recordingKey, youtubeId, durationSec, mimeType: blob.type.split(';')[0], audioBase64,
  }, { auth: true })
}
