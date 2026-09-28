export const SITE_TIME_UPDATED_EVENT = 'smarttest:site-time-updated'

const STORAGE_PREFIX = 'smarttest-site-time-v1'
const FLUSH_INTERVAL_MS = 15_000
// Ignore long gaps caused by a suspended browser or a sleeping device.
const MAX_ELAPSED_MS = 60_000

export type SiteTimeLog = Record<string, number>

export function siteTimeStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function loadSiteTime(userId: string): SiteTimeLog {
  try {
    const raw = window.localStorage.getItem(siteTimeStorageKey(userId))
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([key, seconds]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(key) && typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0,
    ))
  } catch {
    return {}
  }
}

export function recentSiteTimeSeconds(log: SiteTimeLog, now = new Date()) {
  let total = 0
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(now)
    day.setHours(12, 0, 0, 0)
    day.setDate(day.getDate() - offset)
    total += log[localDateKey(day)] ?? 0
  }
  return Math.round(total)
}

function recordElapsed(userId: string, start: number, end: number) {
  const log = loadSiteTime(userId)
  const previousTotal = recentSiteTimeSeconds(log)
  let cursor = start
  while (cursor < end) {
    const date = new Date(cursor)
    const key = localDateKey(date)
    date.setHours(24, 0, 0, 0)
    const segmentEnd = Math.min(end, date.getTime())
    log[key] = (log[key] ?? 0) + (segmentEnd - cursor) / 1000
    cursor = segmentEnd
  }
  try {
    window.localStorage.setItem(siteTimeStorageKey(userId), JSON.stringify(log))
    const nextTotal = recentSiteTimeSeconds(log)
    if ((previousTotal === 0 && nextTotal > 0) || Math.floor(previousTotal / 60) !== Math.floor(nextTotal / 60)) {
      window.dispatchEvent(new Event(SITE_TIME_UPDATED_EVENT))
    }
  } catch {
    // Browser storage can be unavailable; the rest of the site remains usable.
  }
}

export function startSiteTimeTracking(userId: string) {
  const isActive = () => document.visibilityState === 'visible' && document.hasFocus()
  let active = isActive()
  let last = Date.now()

  const flush = () => {
    const now = Date.now()
    if (active && now > last) {
      recordElapsed(userId, Math.max(last, now - MAX_ELAPSED_MS), now)
    }
    last = now
  }

  const updateActivity = () => {
    flush()
    active = isActive()
    last = Date.now()
  }
  const pause = () => {
    flush()
    active = false
  }

  const interval = window.setInterval(flush, FLUSH_INTERVAL_MS)
  document.addEventListener('visibilitychange', updateActivity)
  window.addEventListener('focus', updateActivity)
  window.addEventListener('blur', updateActivity)
  window.addEventListener('pagehide', pause)
  window.addEventListener('pageshow', updateActivity)

  return () => {
    flush()
    window.clearInterval(interval)
    document.removeEventListener('visibilitychange', updateActivity)
    window.removeEventListener('focus', updateActivity)
    window.removeEventListener('blur', updateActivity)
    window.removeEventListener('pagehide', pause)
    window.removeEventListener('pageshow', updateActivity)
  }
}
