import { clearBuildBypassParam, recoverFromStaleBuild } from './staleBuildRecovery'

const CHECK_INTERVAL_MS = 5 * 60_000
const MIN_CHECK_GAP_MS = 30_000
const LAST_REFRESH_TARGET_KEY = 'profai:last-build-refresh-target'
const ENTRY_PATTERN = /<script\b[^>]*\bsrc=["']([^"']*\/assets\/index-[^"']+\.js)["'][^>]*>/i
const ACTIVE_TEST_ROUTE = /(?:\/test\/|\/run(?:\/|$)|\/ielts\/(?:writing|speaking)\/test\/)/i

let checkInFlight: Promise<void> | null = null
let lastCheckAt = 0

function normalizeEntry(value: string) {
  try {
    return new URL(value, window.location.origin).pathname
  } catch {
    return value
  }
}

function currentEntry() {
  const script = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]')
  return script?.src ? normalizeEntry(script.src) : null
}

function latestEntry(html: string) {
  const match = html.match(ENTRY_PATTERN)
  return match?.[1] ? normalizeEntry(match[1]) : null
}

function canRefreshCurrentPage() {
  return !ACTIVE_TEST_ROUTE.test(window.location.pathname)
}

async function checkForNewBuild(entryAtBoot: string) {
  if (checkInFlight) return checkInFlight
  const now = Date.now()
  if (now - lastCheckAt < MIN_CHECK_GAP_MS) return
  lastCheckAt = now

  checkInFlight = (async () => {
    try {
      const response = await fetch(`/?__profai_check=${Date.now().toString(36)}`, {
        cache: 'no-store',
        headers: { Pragma: 'no-cache' },
      })
      if (!response.ok) return

      const nextEntry = latestEntry(await response.text())
      if (!nextEntry || nextEntry === entryAtBoot || !canRefreshCurrentPage()) return
      if (window.sessionStorage.getItem(LAST_REFRESH_TARGET_KEY) === nextEntry) return
      window.sessionStorage.setItem(LAST_REFRESH_TARGET_KEY, nextEntry)
      await recoverFromStaleBuild(undefined, true)
    } catch {
      // An offline or interrupted check must never affect the current session.
    } finally {
      checkInFlight = null
    }
  })()

  return checkInFlight
}

/**
 * Keeps long-lived dashboard and catalog tabs on the current deployment.
 * Active test routes are deliberately excluded so an exam is never interrupted.
 */
export function startBuildFreshnessMonitor() {
  clearBuildBypassParam()
  if (import.meta.env.DEV) return

  const entryAtBoot = currentEntry()
  if (!entryAtBoot) return

  const check = () => {
    if (document.visibilityState === 'visible') void checkForNewBuild(entryAtBoot)
  }

  const initialTimer = window.setTimeout(check, 4_000)
  const interval = window.setInterval(check, CHECK_INTERVAL_MS)
  window.addEventListener('focus', check)
  document.addEventListener('visibilitychange', check)

  window.addEventListener(
    'pagehide',
    () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    },
    { once: true },
  )
}
