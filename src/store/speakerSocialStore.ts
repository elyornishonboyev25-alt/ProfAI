import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Social layer for speakers: public nicknames/handles and peer ratings received.
// Persisted locally; a backend can sync these later (Phase 3 writes peer ratings
// after a live session). Keyed by user id so it works for guests (null) too.

export type PeerRating = {
  id: string
  fromName: string
  fromUserId: string | null
  /** 1–5 stars on each axis. */
  fluency: number
  pronunciation: number
  helpfulness: number
  tags: string[]
  note?: string
  date: string
}

type SpeakerSocialState = {
  nicknames: Record<string, string>
  ratings: Record<string, PeerRating[]>
  setNickname: (userId: string, nickname: string) => void
  addRating: (userId: string, rating: Omit<PeerRating, 'id' | 'date'>) => void
  clearForUser: (userId: string) => void
}

export const useSpeakerSocialStore = create<SpeakerSocialState>()(
  persist(
    (set) => ({
      nicknames: {},
      ratings: {},
      setNickname: (userId, nickname) =>
        set((state) => ({ nicknames: { ...state.nicknames, [userId]: nickname.trim() } })),
      addRating: (userId, rating) =>
        set((state) => {
          const full: PeerRating = {
            ...rating,
            id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            date: new Date().toISOString(),
          }
          const existing = state.ratings[userId] ?? []
          return { ratings: { ...state.ratings, [userId]: [full, ...existing].slice(0, 50) } }
        }),
      clearForUser: (userId) =>
        set((state) => {
          const nicknames = { ...state.nicknames }
          const ratings = { ...state.ratings }
          delete nicknames[userId]
          delete ratings[userId]
          return { nicknames, ratings }
        }),
    }),
    { name: 'smarttest-speaker-social-v1' },
  ),
)

/** A stable @handle for a speaker: their chosen nickname, else a slug of their name. */
export function speakerHandle(
  userId: string | null,
  fullName: string | null,
  nicknames: Record<string, string>,
): string {
  if (userId && nicknames[userId]) return nicknames[userId]
  const base = (fullName ?? 'speaker').trim().toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '')
  const suffix = userId ? userId.replace(/[^a-z0-9]/gi, '').slice(-3) : ''
  return `${base || 'speaker'}${suffix}`
}

export function initialsOf(fullName: string | null): string {
  const parts = (fullName ?? '').split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'SP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function averageRating(ratings: PeerRating[]): {
  fluency: number
  pronunciation: number
  helpfulness: number
  overall: number
  count: number
} {
  if (ratings.length === 0) return { fluency: 0, pronunciation: 0, helpfulness: 0, overall: 0, count: 0 }
  const avg = (pick: (r: PeerRating) => number) =>
    Math.round((ratings.reduce((a, r) => a + pick(r), 0) / ratings.length) * 10) / 10
  const fluency = avg((r) => r.fluency)
  const pronunciation = avg((r) => r.pronunciation)
  const helpfulness = avg((r) => r.helpfulness)
  return {
    fluency,
    pronunciation,
    helpfulness,
    overall: Math.round(((fluency + pronunciation + helpfulness) / 3) * 10) / 10,
    count: ratings.length,
  }
}
