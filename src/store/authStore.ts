import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { AuthUser } from '@/types/platform'
import { isPremiumUser } from '@/utils/premiumAccess'
import { claimPendingReferral } from '@/utils/referralCapture'
import { useAccountUsageStore } from '@/store/accountUsageStore'

// Safari can expose localStorage while temporarily throwing on access (private
// browsing, storage pressure, or a damaged value). Zustand otherwise skips its
// hydration callback and the application waits on the loading screen forever.
const resilientLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // Keep the in-memory session usable when browser storage is unavailable.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name)
    } catch {
      // There is nothing else to clear when browser storage is unavailable.
    }
  },
}

export type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  hydrated: boolean
  setSession: (payload: { user: AuthUser; accessToken: string; refreshToken: string }) => void
  updateUserProgress: (payload: { xp?: number; level?: number; currentStreak?: number }) => void
  setUserNickname: (nickname: string) => void
  setUserAvatar: (avatarUrl: string | null) => void
  setUserFullName: (fullName: string) => void
  setOnboardingCompleted: (completed: boolean) => void
  clearSession: () => void
  setHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (rawSet, get, api) => {
      // Storage events can arrive after a background tab updates profile/XP.
      // Adopt the latest credentials before every non-session write, including
      // direct setState calls, so that write cannot persist a revoked token.
      const guard = (write: typeof rawSet): typeof rawSet => ((partial, replace) => {
        const explicitSession = typeof partial !== 'function' &&
          ('accessToken' in partial || 'refreshToken' in partial)
        if (!explicitSession) {
          const current = get()
          const saved = readStoredSession()
          if (current && saved && (saved.accessToken !== current.accessToken || saved.refreshToken !== current.refreshToken)) {
            if (saved.user?.id !== current.user?.id || !saved.accessToken) useAccountUsageStore.getState().resetUsage()
            rawSet(saved)
            // A queued update belongs to the account that initiated it.
            if (saved.user?.id !== current.user?.id) return
          }
        }
        if (replace === true) write(partial as AuthState, true)
        else write(partial, false)
      }) as typeof rawSet
      const set = guard(rawSet)
      api.setState = guard(api.setState)
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        hydrated: false,
        setSession: ({ user, accessToken, refreshToken }: { user: AuthUser; accessToken: string; refreshToken: string }) => {
          set({
            user: {
              ...user,
              premium: isPremiumUser(user),
            },
            accessToken,
            refreshToken,
          })
          // A friend's invitation link is applied once the visitor has an account.
          void claimPendingReferral()
        },
        updateUserProgress: ({ xp, level, currentStreak }: { xp?: number; level?: number; currentStreak?: number }) =>
          set((state) => {
            if (!state.user) return {}
            return {
              user: {
                ...state.user,
                xp: xp ?? state.user.xp,
                level: level ?? state.user.level,
                currentStreak: currentStreak ?? state.user.currentStreak,
              },
            }
          }),
        setUserNickname: (nickname: string) =>
          set((state) => (state.user ? { user: { ...state.user, nickname } } : {})),
        setUserAvatar: (avatarUrl: string | null) =>
          set((state) => (state.user ? { user: { ...state.user, avatarUrl } } : {})),
        setUserFullName: (fullName: string) =>
          set((state) => (state.user ? { user: { ...state.user, fullName } } : {})),
        setOnboardingCompleted: (completed: boolean) =>
          set((state) => (state.user ? { user: { ...state.user, onboardingCompleted: completed } } : {})),
        clearSession: () => {
          useAccountUsageStore.getState().resetUsage()
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
          })
        },
        setHydrated: (value: boolean) => set({ hydrated: value }),
      }
    },
    {
      // v2 intentionally invalidates old browser sessions once. This rolls every
      // existing learner through the new login + one-time onboarding contract.
      name: 'smart-test-pro-auth-v2',
      storage: createJSONStorage(() => resilientLocalStorage),
      partialize: (state: AuthState) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state?: AuthState) => {
        if (state?.user) {
          state.user = {
            ...state.user,
            premium: isPremiumUser(state.user),
          }
        }
        state?.setHydrated(true)
      },
    },
  ),
)

type StoredSession = Pick<AuthState, 'user' | 'accessToken' | 'refreshToken'>

function readStoredSession(): StoredSession | null {
  try {
    const raw = resilientLocalStorage.getItem('smart-test-pro-auth-v2')
    if (typeof raw !== 'string') return null
    const saved = JSON.parse(raw).state as StoredSession
    if (!saved || !(saved.accessToken === null || typeof saved.accessToken === 'string') ||
        !(saved.refreshToken === null || typeof saved.refreshToken === 'string')) return null
    return {
      user: saved.user ? { ...saved.user, premium: isPremiumUser(saved.user) } : null,
      accessToken: saved.accessToken,
      refreshToken: saved.refreshToken,
    }
  } catch {
    // Unavailable or damaged storage must not destroy the in-memory session.
    return null
  }
}

// Refresh tokens rotate after use. Other tabs must adopt the replacement before
// sending requests, otherwise they will try to reuse an already revoked token.
export function syncStoredSession() {
  const saved = readStoredSession()
  if (!saved) return
  const current = useAuthStore.getState()
  if (saved.accessToken === current.accessToken && saved.refreshToken === current.refreshToken) return
  if (saved.user?.id !== current.user?.id || !saved.accessToken) useAccountUsageStore.getState().resetUsage()
  useAuthStore.setState(saved)
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'smart-test-pro-auth-v2') syncStoredSession()
  })
}
