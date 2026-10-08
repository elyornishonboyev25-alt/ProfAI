import { accountStorageFor } from '@/utils/accountStorage'
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { getFreeAttemptInfo } from '@/utils/premiumAccess'

const PREFIX = 'smarttest:free-attempts'

function keyFor(userId: string | null) {
  return `${PREFIX}:${userId ?? 'guest'}`
}

function readCount(userId: string | null): number {
  try {
    const raw = accountStorageFor(userId ?? 'guest').getItem(keyFor(userId))
    const parsed = raw ? Number.parseInt(raw, 10) : 0
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  } catch {
    return 0
  }
}

/**
 * User-scoped free test-attempt counter (localStorage). It always tracks usage
 * so the data is ready, but it only *gates* anything when ENFORCE_PREMIUM is on
 * (see getFreeAttemptInfo). Mirror of the owner-keyed storage pattern used in
 * weeklyPlanner.
 */
export function useTestAttempts() {
  const user = useAuthStore((state: AuthState) => state.user)
  const userId = user?.id ?? null
  const [used, setUsed] = useState(() => readCount(userId))

  useEffect(() => {
    setUsed(readCount(userId))
  }, [userId])

  const increment = useCallback(() => {
    setUsed((previous) => {
      const next = previous + 1
      try {
        accountStorageFor(userId ?? 'guest').setItem(keyFor(userId), String(next))
      } catch {
        /* storage unavailable — ignore */
      }
      return next
    })
  }, [userId])

  const reset = useCallback(() => {
    setUsed(0)
    try {
      accountStorageFor(userId ?? 'guest').removeItem(keyFor(userId))
    } catch {
      /* ignore */
    }
  }, [userId])

  return { used, info: getFreeAttemptInfo(used, user), increment, reset }
}
