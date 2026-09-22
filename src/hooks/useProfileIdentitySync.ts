import { useEffect } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/platform'

// A persisted browser session can contain an old photo from onboarding or a
// different device. Refresh identity without replacing tokens or live progress.
export function useProfileIdentitySync() {
  const userId = useAuthStore((state) => state.user?.id)
  useEffect(() => {
    if (!userId) return
    let active = true
    let pending = false
    const sync = async () => {
      if (pending) return
      const before = useAuthStore.getState().user
      if (before?.id !== userId) return
      pending = true
      try {
        const { user } = await apiClient.get<{ user: AuthUser }>('/auth/me')
        if (!active || user.id !== userId) return
        useAuthStore.setState((state) => {
          if (state.user?.id !== userId) return {}
          return { user: {
            ...state.user,
            // Never overwrite a photo/name saved while this request was pending.
            ...(state.user.avatarUrl === before.avatarUrl ? { avatarUrl: user.avatarUrl ?? null } : {}),
            ...(state.user.fullName === before.fullName ? { fullName: user.fullName } : {}),
            ...(state.user.nickname === before.nickname ? { nickname: user.nickname ?? null } : {}),
          } }
        })
      } catch {
        // Preserve the existing session offline; retry when connectivity returns.
      } finally {
        pending = false
      }
    }
    void sync()
    window.addEventListener('online', sync)
    return () => { active = false; window.removeEventListener('online', sync) }
  }, [userId])
}
