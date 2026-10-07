import { create } from 'zustand'

export const XP_NOTIFICATION_DURATION = 2200

type XpNotification = {
  id: number
  userId: string
  amount: number
  testCompleted: boolean
}

type XpNotificationState = {
  rewards: XpNotification[]
  award: (userId: string, amount: number, testCompleted: boolean) => void
  dismiss: (id: number) => void
  clear: () => void
}

let nextId = 0

export const useXpNotificationStore = create<XpNotificationState>((set) => ({
  rewards: [],
  award: (userId, amount, testCompleted) => {
    if (!Number.isFinite(amount) || amount <= 0) return
    set((state) => {
      const rewards = state.rewards.filter((reward) => reward.userId === userId)
      const previous = rewards.find((reward) => reward.testCompleted === testCompleted)
      return { rewards: [
        ...rewards.filter((reward) => reward !== previous),
        { id: ++nextId, userId, amount: amount + (previous?.amount ?? 0), testCompleted },
      ] }
    })
  },
  dismiss: (id) => set((state) => ({ rewards: state.rewards.filter((reward) => reward.id !== id) })),
  clear: () => set({ rewards: [] }),
}))

// Only confirmed awards from mutations count. Profile loads, duplicate syncs,
// failed requests and session refreshes must never celebrate historical XP.
export function notifyXpAward(userId: string, payload: unknown, path: string, body: unknown) {
  if (!payload || typeof payload !== 'object') return
  const reward = payload as { xpEarned?: unknown; duplicate?: boolean }
  if (reward.duplicate || typeof reward.xpEarned !== 'number') return
  const source = body && typeof body === 'object' ? (body as { source?: string }).source : undefined
  const testCompleted = path.startsWith('/tests/') || path === '/profile/speaking/session' ||
    (path === '/profile/xp/activity' && (source === 'WRITING' || source === 'SAT_PRACTICE'))
  useXpNotificationStore.getState().award(userId, reward.xpEarned, testCompleted)
}
