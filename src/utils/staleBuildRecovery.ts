const RECOVERY_KEY = 'profai:stale-build-recovery'
const RECOVERY_COOLDOWN_MS = 30_000

const STALE_BUILD_MESSAGES = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /unable to preload css/i,
  /vite:preloaderror/i,
  /_result\.default/i,
  /loaded module has no default export/i,
  /unexpected token ['"]?</i,
  /mime type.*(javascript|module)/i,
]

function errorMessage(error: unknown) {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  return String(error ?? '')
}

export function isStaleBuildError(error: unknown) {
  const message = errorMessage(error)
  return STALE_BUILD_MESSAGES.some((pattern) => pattern.test(message))
}

async function clearStaleAssetCaches() {
  if (!('caches' in window)) return
  const cacheNames = await window.caches.keys()
  await Promise.all(
    cacheNames
      .filter((name) => name === 'profai-app-assets' || name.startsWith('profai-app-assets-'))
      .map((name) => window.caches.delete(name)),
  )
}

async function updateServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations.map(async (registration) => {
      await registration.update()
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
    }),
  )
}

/**
 * Repairs a page that is still running an old deployment while requesting new
 * lazy chunks. The cooldown prevents a broken network from creating a reload loop.
 */
export async function recoverFromStaleBuild(error?: unknown, force = false) {
  if (typeof window === 'undefined') return false
  if (!force && !isStaleBuildError(error)) return false

  const now = Date.now()
  const previousAttempt = Number(window.sessionStorage.getItem(RECOVERY_KEY) || 0)
  if (!force && Number.isFinite(previousAttempt) && now - previousAttempt < RECOVERY_COOLDOWN_MS) {
    return false
  }

  window.sessionStorage.setItem(RECOVERY_KEY, String(now))
  const recovery = Promise.allSettled([clearStaleAssetCaches(), updateServiceWorker()])
  await Promise.race([
    recovery,
    new Promise<void>((resolve) => window.setTimeout(resolve, 1_500)),
  ])
  window.location.reload()
  return true
}
