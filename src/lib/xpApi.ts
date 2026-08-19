import { apiClient } from '@/lib/apiClient'

export type XpActivitySource =
  | 'STUDY_VOCABULARY'
  | 'STUDY_ARTICLES'
  | 'STUDY_PODCAST'
  | 'STUDY_SHADOWING'
  | 'STUDY_ADMISSION'
  | 'VOCAB_FLASHCARDS'
  | 'VOCAB_MATCHING'
  | 'VOCAB_QUIZ'
  | 'VOCAB_TYPING'
  | 'WRITING'
  | 'SAT_PRACTICE'

export type XpAwardResponse = {
  duplicate: boolean
  xpEarned: number
  originalXp: number
  totalXp: number
  level: number
}

export async function recordXpActivity(input: {
  source: XpActivitySource
  eventKey: string
  accuracy?: number
  band?: number
  durationSec?: number
  metadata?: Record<string, string | number | boolean | null>
}) {
  return apiClient.post<XpAwardResponse>('/profile/xp/activity', input, { auth: true })
}

function syncKey(userId: string, sourceKey: string) {
  return `smarttest-xp-sync:${userId}:${sourceKey}`
}

export function markXpActivitySynced(userId: string, sourceKey: string) {
  try {
    window.localStorage.setItem(syncKey(userId, sourceKey), 'ok')
  } catch {
    // Server already owns the award; a storage failure must not break the UI.
  }
}

export function isXpActivitySynced(userId: string, sourceKey: string) {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(syncKey(userId, sourceKey)) === 'ok'
  } catch {
    return false
  }
}
