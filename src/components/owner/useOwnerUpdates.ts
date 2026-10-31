import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '@/lib/apiClient'

export type OwnerSection = 'activity' | 'users' | 'payments' | 'reports' | 'reviews'
type Cursors = Partial<Record<OwnerSection, string>>
type Updates = { checkedAt: string; counts: Record<OwnerSection, number> }
const sections: OwnerSection[] = ['activity', 'users', 'payments', 'reports', 'reviews']

function readCursors(key: string): Cursors {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}')
    return Object.fromEntries(sections.filter(section => typeof stored?.[section] === 'string' && Number.isFinite(Date.parse(stored[section]))).map(section => [section, new Date(stored[section]).toISOString()]))
  } catch { return {} }
}

export function useOwnerUpdates(ownerId: string | undefined, enabled: boolean, reload: number) {
  const key = `owner-updates:v1:${ownerId}`
  const [updates, setUpdates] = useState<Updates | null>(null)
  const cursors = useRef<Cursors>({})
  const revision = useRef(0)
  useEffect(() => {
    cursors.current = readCursors(key)
    setUpdates(null)
    revision.current++
  }, [key, enabled])
  useEffect(() => {
    if (!enabled) return
    let active = true
    let inFlight = false
    const refresh = async () => {
      if (inFlight || document.visibilityState === 'hidden') return
      inFlight = true
      const requestedRevision = revision.current
      try {
        const result = await apiClient.get<Updates>(`/support/owner/updates?${new URLSearchParams(cursors.current)}`)
        if (active && revision.current === requestedRevision) setUpdates(result)
      } catch { /* Keep the last successful counts during a connection failure. */ }
      finally { inFlight = false }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 30_000)
    const onVisibility = () => { if (document.visibilityState !== 'hidden') void refresh() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility) }
  }, [enabled, key, reload])
  const markSeen = useCallback((section: OwnerSection) => {
    if (!updates) return
    revision.current++
    cursors.current = { ...cursors.current, [section]: updates.checkedAt }
    try { localStorage.setItem(key, JSON.stringify(cursors.current)) } catch { /* Counts still work when storage is unavailable. */ }
    setUpdates(current => current ? { ...current, counts: { ...current.counts, [section]: 0 } } : current)
  }, [key, updates])
  return { counts: updates?.counts, markSeen }
}
