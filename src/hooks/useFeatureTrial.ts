import { useCallback, useEffect, useState } from 'react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { hasPremiumAccess } from '@/utils/premiumAccess'
import { useBillingStore } from '@/features/billing/store'
import type { AccessFeature } from '@/features/billing/catalog'
import {
  COMMUNITY_TRIAL_SECONDS,
  addCommunitySeconds,
  getCommunitySecondsUsed,
  type TrialFeature,
} from '@/utils/freeTrial'

export type FeatureTrial = {
  /** Paid plan (Pro or Max). */
  isPremium: boolean
  used: number
  limit: number
  /** Remaining uses this month (Infinity when the plan has no monthly limit). */
  remaining: number
  /** True when this month's allowance for the feature is used up. */
  locked: boolean
  /** The server meters each use; this only refreshes the shown allowance. */
  consume: () => boolean
}

const SERVER_FEATURE: Record<TrialFeature, AccessFeature> = {
  writing: 'writing', reading: 'test', listening: 'test', speakingDaily: 'speaking', mock: 'mock',
}

/** Monthly allowance for a feature on the account's plan (Free, Pro or Max). */
export function useFeatureTrial(feature: TrialFeature): FeatureTrial {
  const user = useAuthStore((state: AuthState) => state.user)
  const { wallet, userId, refresh } = useBillingStore()
  useEffect(() => { if (user && userId !== user.id) void refresh() }, [user?.id, userId, refresh])
  const isPremium = hasPremiumAccess(user)
  const usage = userId === user?.id ? wallet?.usage?.[SERVER_FEATURE[feature]] : undefined
  const used = usage?.used ?? 0
  const limit = usage ? usage.limit ?? Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY
  const remaining = Math.max(0, limit - used)
  // Unknown usage never locks; the server has the final word when the action starts.
  const locked = Boolean(user) && Boolean(usage) && remaining <= 0

  const consume = useCallback(() => {
    window.setTimeout(() => void refresh(), 1500)
    return !locked
  }, [locked, refresh])

  return { isPremium, used, limit, remaining, locked, consume }
}

export type CommunityTrial = {
  isPremium: boolean
  secondsUsed: number
  secondsLimit: number
  secondsRemaining: number
  locked: boolean
  /** Record elapsed community seconds. */
  addSeconds: (seconds: number) => void
}

/** Access state for the Speaking-community time budget (debate + partner). */
export function useCommunityTrial(): CommunityTrial {
  const user = useAuthStore((state: AuthState) => state.user)
  const isPremium = hasPremiumAccess(user)
  const [secondsUsed, setSecondsUsed] = useState(() => getCommunitySecondsUsed(user?.id))

  const secondsLimit = COMMUNITY_TRIAL_SECONDS
  const secondsRemaining = isPremium ? Number.POSITIVE_INFINITY : Math.max(0, secondsLimit - secondsUsed)
  const locked = !isPremium && secondsUsed >= secondsLimit

  // Stable identity (no secondsUsed dep) so a 1-second interval doesn't tear
  // down and rebuild every tick. addCommunitySeconds reads the latest stored
  // value, so the running total stays correct.
  const addSeconds = useCallback(
    (seconds: number) => {
      if (isPremium) return
      setSecondsUsed(addCommunitySeconds(seconds, user?.id))
    },
    [isPremium, user?.id],
  )

  return { isPremium, secondsUsed, secondsLimit, secondsRemaining, locked, addSeconds }
}
