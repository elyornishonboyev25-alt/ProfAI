import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { AuthUser } from '@/types/platform'
import { hasPremiumAccess } from '@/utils/premiumAccess'

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
    (
      set: (
        partial:
          | Partial<AuthState>
          | ((state: AuthState) => Partial<AuthState>),
      ) => void,
    ) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      setSession: ({ user, accessToken, refreshToken }: { user: AuthUser; accessToken: string; refreshToken: string }) =>
        set({
          user: {
            ...user,
            premium: hasPremiumAccess(user),
          },
          accessToken,
          refreshToken,
        }),
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
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
      setHydrated: (value: boolean) => set({ hydrated: value }),
    }),
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
            premium: hasPremiumAccess(state.user),
          }
        }
        state?.setHydrated(true)
      },
    },
  ),
)
