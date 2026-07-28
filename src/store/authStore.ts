import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types/platform'
import { hasPremiumAccess } from '@/utils/premiumAccess'

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
