import { create } from 'zustand'
import type { SkillTrackKey } from '@/components/achievements/badgeMeta'

// A small queue so several badges earned at once (e.g. a full mock unlocking
// multiple skills) celebrate one after another instead of overlapping.

export type CelebrationItem = {
  id: string
  track: SkillTrackKey
  band: number
}

type CelebrationState = {
  current: CelebrationItem | null
  queue: CelebrationItem[]
  trigger: (item: Omit<CelebrationItem, 'id'>) => void
  dismiss: () => void
}

export const useCelebrationStore = create<CelebrationState>((set, get) => ({
  current: null,
  queue: [],
  trigger: (item) => {
    const full: CelebrationItem = {
      ...item,
      id: `cel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }
    if (get().current) {
      set((state) => ({ queue: [...state.queue, full] }))
    } else {
      set({ current: full })
    }
  },
  dismiss: () =>
    set((state) => {
      const [next, ...rest] = state.queue
      return { current: next ?? null, queue: rest }
    }),
}))
