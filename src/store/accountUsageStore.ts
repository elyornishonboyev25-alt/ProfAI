import { create } from 'zustand'

type UsageStatus = 'checking' | 'active' | 'blocked' | 'unavailable'

// Keep this tab's server verification out of persisted authentication storage.
export const useAccountUsageStore = create<{
  owner: string | undefined
  status: UsageStatus
  validUntil: number
  setUsage: (owner: string, status: UsageStatus, validUntil?: number) => void
  resetUsage: () => void
}>((set) => ({
  owner: undefined,
  status: 'checking',
  validUntil: 0,
  setUsage: (owner, status, validUntil = 0) => set({ owner, status, validUntil }),
  resetUsage: () => set({ owner: undefined, status: 'checking', validUntil: 0 }),
}))
