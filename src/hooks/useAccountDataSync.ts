import { restoreSpeakingAccount } from '@/store/speakingStore'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import { loadActivityLog, loadOnboardingProfile, loadWeeklyPlan } from '@/utils/weeklyPlanner'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ACCOUNT_DATA_EVENT, migrateOwnedAccountData } from '@/utils/accountStorage'
import { syncAccountData, type AccountSyncFailures } from '@/utils/accountDataSync'

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
    let activeController: AbortController | undefined
    const failures: AccountSyncFailures = new Map()
    const isCurrent = () => !cancelled && useAuthStore.getState().user?.id === owner
    const sync = async () => {
      if (running || document.hidden || !isCurrent()) return
      running = true
      let changed = false
      const controller = new AbortController()
      activeController = controller
      const timeout = window.setTimeout(() => controller.abort(), 12_000)
      try {
        changed = await syncAccountData(owner, { signal: controller.signal, isCurrent, failures })
        if (!isCurrent()) return
        restoreSpeakingAccount(owner)
        if (changed) setRevision((value) => value + 1)
      } catch { /* Keep account-scoped offline data and retry on focus/online. */ }
      finally {
        window.clearTimeout(timeout)
        running = false
        activeController = undefined
        if (isCurrent()) setLoaded(owner)
      }
    }
    let debounce: number | undefined
    // Continuous autosaves must not keep postponing uploads forever.
    const schedule = () => {
      if (debounce !== undefined) return
      debounce = window.setTimeout(() => { debounce = undefined; void sync() }, 1500)
    }
    void sync()
    const timer = window.setInterval(schedule, 30_000)
    window.addEventListener(ACCOUNT_DATA_EVENT, schedule)
    window.addEventListener('focus', schedule)
    window.addEventListener('online', schedule)
    window.addEventListener('storage', schedule)
    document.addEventListener('visibilitychange', schedule)
    return () => {
      cancelled = true
      activeController?.abort()
      window.clearInterval(timer)
      window.clearTimeout(debounce)
      window.removeEventListener(ACCOUNT_DATA_EVENT, schedule)
      window.removeEventListener('focus', schedule)
      window.removeEventListener('online', schedule)
      window.removeEventListener('storage', schedule)
      document.removeEventListener('visibilitychange', schedule)
    }
  }, [owner])
  return { ready: !owner || loaded === owner, revision }
}
