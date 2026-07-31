import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { tierForBand, type SkillTrackKey } from '@/components/achievements/badgeMeta'
import { upsertBadge } from '@/lib/profileApi'
import { useCelebrationStore } from './celebrationStore'

// Local mirror of earned skill badges. The backend is the source of truth for the
// public profile, but this store gates the celebration (so a band is celebrated
// only when it beats the learner's previous best) and keeps badges visible offline.

export type AwardMode = string

export type LocalBadgeRecord = {
  userId: string | null
  track: SkillTrackKey
  tier: number
  band: number
  unlockedAt: string
}

// A badge is only awarded for real exam / mock attempts — never for practice mode.
const ELIGIBLE_MODES = new Set(['exam', 'simulation', 'mock', 'full-test', 'mock-arena', 'full_mock'])

export function isEligibleMode(mode: AwardMode): boolean {
  return ELIGIBLE_MODES.has(mode)
}

type BadgeState = {
  records: LocalBadgeRecord[]
  recordsForUser: (userId: string | null) => LocalBadgeRecord[]
  bestBand: (userId: string | null, track: SkillTrackKey) => number
  clearForUser: (userId: string | null) => void
  awardIfEligible: (input: {
    userId: string | null
    track: SkillTrackKey
    band: number
    mode: AwardMode
    source?: string
  }) => { celebrated: boolean; tier: number | null }
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      records: [],
      recordsForUser: (userId) => get().records.filter((r) => r.userId === userId),
      bestBand: (userId, track) =>
        get()
          .records.filter((r) => r.userId === userId && r.track === track)
          .reduce((max, r) => Math.max(max, r.band), 0),
      clearForUser: (userId) => set((state) => ({ records: state.records.filter((record) => record.userId !== userId) })),
      awardIfEligible: ({ userId, track, band, mode, source }) => {
        if (!isEligibleMode(mode)) return { celebrated: false, tier: null }
        const tier = tierForBand(band)
        if (!tier) return { celebrated: false, tier: null }

        const prevBest = get().bestBand(userId, track)
        const shouldCelebrate = band > prevBest

        set((state) => {
          const idx = state.records.findIndex(
            (r) => r.userId === userId && r.track === track && r.tier === tier,
          )
          const next = [...state.records]
          if (idx >= 0) {
            if (band > next[idx].band) {
              next[idx] = { ...next[idx], band, unlockedAt: new Date().toISOString() }
            }
          } else {
            next.push({ userId, track, tier, band, unlockedAt: new Date().toISOString() })
          }
          return { records: next }
        })

        // Best-effort server persistence (drives the public profile + cross-device).
        void upsertBadge({ track, band, source: source ?? mode })
          .then((res) => {
            if (shouldCelebrate) useCelebrationStore.getState().setServerBadgeId(res.badge.id)
          })
          .catch(() => {})

        if (shouldCelebrate) {
          useCelebrationStore.getState().trigger({ track, band })
        }

        return { celebrated: shouldCelebrate, tier }
      },
    }),
    { name: 'smarttest-skill-badges-v1' },
  ),
)
