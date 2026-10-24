import { create } from 'zustand'

type UsageStatus = 'checking' | 'active' | 'blocked' | 'unavailable'

/** What the server tells a refused device about the device holding the account. */
export type DeviceUsageDetails = Record<string, unknown> & {
  activeDevice?: { deviceType?: string; os?: string; browsers?: string[]; lastSeenAt?: string }
  retryAfterSec?: number
}

// Keep this tab's server verification out of persisted authentication storage.
export const useAccountUsageStore = create<{
  owner: string | undefined
  status: UsageStatus
  validUntil: number
  details?: DeviceUsageDetails
  blockedAt: number
  setUsage: (owner: string, status: UsageStatus, validUntil?: number, details?: DeviceUsageDetails) => void
  resetUsage: () => void
}>((set) => ({
  owner: undefined,
  status: 'checking',
  validUntil: 0,
  details: undefined,
  blockedAt: 0,
  setUsage: (owner, status, validUntil = 0, details) => set(state => ({
    owner, status, validUntil,
    details: status === 'blocked' ? details ?? (state.owner === owner ? state.details : undefined) : undefined,
    blockedAt: status === 'blocked' ? Date.now() : 0,
  })),
  resetUsage: () => set({ owner: undefined, status: 'checking', validUntil: 0, details: undefined, blockedAt: 0 }),
}))
