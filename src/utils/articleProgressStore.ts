// Per-article reading progress (max scroll % reached), used by the Reading
// Library catalog to show progress rings and "Read" badges (concept 21).
// New dedicated key — never touches existing smarttest-* stores.

const STORAGE_KEY = 'profai-article-progress-v1'

type ProgressMap = Record<string, number>

export function getArticleProgressMap(): ProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as ProgressMap
  } catch {
    return {}
  }
}

export function getArticleProgress(slug: string): number {
  const value = getArticleProgressMap()[slug]
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0
}

/** Persist the max progress reached; writes only on meaningful (5%+) gains. */
export function saveArticleProgress(slug: string, percent: number): void {
  if (typeof window === 'undefined' || !slug) return
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  const map = getArticleProgressMap()
  const previous = map[slug] ?? 0
  if (clamped <= previous || (clamped - previous < 5 && clamped < 95)) return
  map[slug] = clamped
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* storage full/blocked — reading continues fine without progress */
  }
}
