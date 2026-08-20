import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthStore, type AuthState } from '@/store/authStore'

const STORAGE_PREFIX = 'profai-admission-shortlist-v1'
const SHORTLIST_EVENT = 'profai:admission-shortlist-change'

function readShortlist(key: string): string[] {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return Array.from(new Set(parsed.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)))
  } catch {
    return []
  }
}

function writeShortlist(key: string, slugs: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(slugs))
  } catch {
    // Keep the in-memory shortlist usable when browser storage is unavailable.
  }
}

export function useUniversityShortlist() {
  const userId = useAuthStore((state: AuthState) => state.user?.id)
  const storageKey = `${STORAGE_PREFIX}:${userId ?? 'guest'}`
  const [shortlistedSlugs, setShortlistedSlugs] = useState<string[]>(() => readShortlist(storageKey))

  useEffect(() => {
    setShortlistedSlugs(readShortlist(storageKey))

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === storageKey) setShortlistedSlugs(readShortlist(storageKey))
    }
    const syncInTab = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; slugs: string[] }>).detail
      if (detail?.key === storageKey) setShortlistedSlugs(detail.slugs)
    }

    window.addEventListener('storage', syncFromStorage)
    window.addEventListener(SHORTLIST_EVENT, syncInTab)
    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener(SHORTLIST_EVENT, syncInTab)
    }
  }, [storageKey])

  const shortlistedSet = useMemo(() => new Set(shortlistedSlugs), [shortlistedSlugs])

  const toggleShortlist = useCallback((slug: string) => {
    const current = readShortlist(storageKey)
    const isRemoving = current.includes(slug)
    const next = isRemoving ? current.filter((item) => item !== slug) : [...current, slug]

    writeShortlist(storageKey, next)
    setShortlistedSlugs(next)
    window.dispatchEvent(new CustomEvent(SHORTLIST_EVENT, { detail: { key: storageKey, slugs: next } }))
    return !isRemoving
  }, [storageKey])

  return {
    shortlistedSlugs,
    shortlistedSet,
    shortlistCount: shortlistedSlugs.length,
    isShortlisted: (slug: string) => shortlistedSet.has(slug),
    toggleShortlist,
  }
}
