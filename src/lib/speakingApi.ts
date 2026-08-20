import { apiClient } from '@/lib/apiClient'
import type { XpAwardResponse } from '@/lib/xpApi'
import { markXpActivitySynced } from '@/lib/xpApi'

// Thin client for the Phase B speaking backend (nickname, presence, persisted
// sessions, community + public profiles). All of these return nicknames only and
// never expose another user's email.

export type CommunitySpeaker = {
  id: string
  nickname: string | null
  displayName: string
  online: boolean
  lastSeen: string | null
  streak: number
  sessionCount: number
  averageBand: number
  totalMinutes: number
}

export type SpeakerSessionRow = {
  id: string
  modeLabel: string
  overallBand: number
  fluencyBand: number
  lexicalBand: number
  grammarBand: number
  pronunciationBand: number
  durationSec: number
  wordCount: number
  createdAt: string
}

export type SpeakerProfilePayload = {
  profile: {
    id: string
    nickname: string | null
    displayName: string
    online: boolean
    lastSeen: string | null
    streak: number
    longestStreak: number
    level: number
    xp: number
    memberSince: string
    rank: number | null
    totalSpeakers: number
  }
  sessions: SpeakerSessionRow[]
}

export type SpeakingSessionInput = {
  eventKey?: string
  mode: string
  modeLabel: string
  overallBand: number
  fluencyBand: number
  lexicalBand: number
  grammarBand: number
  pronunciationBand: number
  durationSec: number
  wordCount: number
}

export async function checkNicknameAvailable(value: string): Promise<boolean> {
  try {
    const res = await apiClient.get<{ available: boolean }>(
      `/profile/nickname/check?value=${encodeURIComponent(value)}`,
      { auth: true },
    )
    return res.available
  } catch {
    return false
  }
}

export async function setNickname(nickname: string): Promise<void> {
  await apiClient.put('/profile/nickname', { nickname }, { auth: true })
}

export async function saveSpeakingSession(input: SpeakingSessionInput, userId?: string): Promise<XpAwardResponse | null> {
  // Best-effort: a failure here must never break the on-device result screen.
  try {
    const reward = await apiClient.post<XpAwardResponse>('/profile/speaking/session', input, { auth: true })
    if (userId && input.eventKey) markXpActivitySynced(userId, input.eventKey)
    return reward
  } catch {
    // ignore — the session is still saved locally
    return null
  }
}

export async function fetchCommunity(): Promise<CommunitySpeaker[]> {
  const res = await apiClient.get<{ speakers: CommunitySpeaker[] }>('/profile/speaking/community', { auth: true })
  return res.speakers ?? []
}

export async function fetchSpeakerByNickname(nickname: string): Promise<SpeakerProfilePayload> {
  return apiClient.get<SpeakerProfilePayload>(`/profile/speaking/by-nickname/${encodeURIComponent(nickname)}`, { auth: true })
}

export async function sendHeartbeat(recalculateStreak = false): Promise<XpAwardResponse | null> {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return await apiClient.post<XpAwardResponse>('/profile/heartbeat', { timezone, recalculateStreak }, { auth: true })
  } catch {
    // ignore
    return null
  }
}
