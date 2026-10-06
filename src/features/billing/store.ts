import { create } from 'zustand'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

export type BillingOrder = { id: string; plan: string; currency: 'UZS' | 'USD'; amountMinor: number; coins: number; status: string; method: string; checkoutUrl: string | null; createdAt: string }
export type WalletOverview = { balance: number; canCreateClass: boolean; centerEligible: boolean; legacyAccess: boolean;
  subscriptions: Array<{ audience: string; plan: string; expiresAt: string }>; entries: Array<{ id: string; amount: number; reason: string; createdAt: string }>; orders: BillingOrder[] }
type BillingState = { userId: string | null; wallet: WalletOverview | null; loading: boolean; error: string; refresh: () => Promise<void> }
let pending: { userId: string; promise: Promise<void> } | null = null
export const useBillingStore = create<BillingState>((set, get) => ({ userId: null, wallet: null, loading: false, error: '',
  refresh: async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) { set({ userId: null, wallet: null, loading: false, error: '' }); return }
    if (pending?.userId === userId) return pending.promise
    if (get().userId !== userId) set({ userId, wallet: null })
    set({ loading: true, error: '' })
    const promise = (async () => {
      try {
        const wallet = await apiClient.get<WalletOverview>('/billing/wallet')
        if (useAuthStore.getState().user?.id === userId) set({ wallet, userId, loading: false, error: '' })
      } catch (error) {
        if (useAuthStore.getState().user?.id === userId) set({ loading: false, error: error instanceof Error ? error.message : 'Could not load balance.' })
      } finally { if (pending?.userId === userId) pending = null }
    })()
    pending = { userId, promise }; return promise
  },
}))
