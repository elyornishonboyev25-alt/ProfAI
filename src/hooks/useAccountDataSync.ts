import { restoreSpeakingAccount } from '@/store/speakingStore'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import { loadActivityLog, loadOnboardingProfile, loadWeeklyPlan } from '@/utils/weeklyPlanner'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { ACCOUNT_DATA_EVENT, applyAccountData, getAccountMutations, migrateOwnedAccountData } from '@/utils/accountStorage'

export function useAccountDataSync(owner: string | undefined) {
  const [loaded, setLoaded] = useState<string | undefined>()
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!owner) return
    try {
      migrateOwnedAccountData(owner)
      restoreSpeakingAccount(owner)
      getReadingAnalysisHistory(owner)
      getWritingAnalysisHistory(owner)
      loadActivityLog(owner)
      loadOnboardingProfile(owner)
      loadWeeklyPlan(owner)
    } catch { /* Browser storage can be unavailable; still allow server sync. */ }
    let cancelled = false
    let running = false
    const isCurrent = () => !cancelled && useAuthStore.getState().user?.id === owner
    const sync = async () => {
      if (running || !isCurrent()) return
      running = true
      let changed = false
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 12_000)
      try {
        for (const [key, mutation] of getAccountMutations(owner)) {
          if (!isCurrent()) return
          const entry = await apiClient.put<{ key: string; value: string | null }>('/account-data', { key, ...mutation }, { expectedUserId: owner, signal: controller.signal })
          if (!isCurrent()) return
          changed = applyAccountData(owner, entry.key, entry.value, mutation) || changed
        }
        const { entries } = await apiClient.get<{ entries: { key: string; value: string | null }[] }>('/account-data', { expectedUserId: owner, signal: controller.signal })
        if (!isCurrent()) return
        for (const entry of entries) changed = applyAccountData(owner, entry.key, entry.value) || changed
        restoreSpeakingAccount(owner)
        if (changed) setRevision((value) => value + 1)
      } catch { /* Keep account-scoped offline data and retry on focus/online. */ }
      finally {
        window.clearTimeout(timeout)
        running = false
        if (isCurrent()) setLoaded(owner)
      }
    }
    let debounce: number | undefined
    const schedule = () => { window.clearTimeout(debounce); debounce = window.setTimeout(() => { void sync() }, 1500) }
    void sync()
    const timer = window.setInterval(schedule, 30_000)
    window.addEventListener(ACCOUNT_DATA_EVENT, schedule)
    window.addEventListener('focus', schedule)
    window.addEventListener('online', schedule)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.clearTimeout(debounce)
      window.removeEventListener(ACCOUNT_DATA_EVENT, schedule)
      window.removeEventListener('focus', schedule)
      window.removeEventListener('online', schedule)
    }
  }, [owner])
  return { ready: !owner || loaded === owner, revision }
}
