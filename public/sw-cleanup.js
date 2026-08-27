const SAFE_REFRESH_ROUTE = /^\/(?:$|dashboard\/?$|ielts(?:\/(?:reading|listening|writing|speaking)(?:\/tests)?)?\/?$|sat\/?$|mock\/(?:ielts|sat)\/?$|leaderboard\/?$|profile\/?$)/i
const UPDATE_MARKER_CACHE = 'profai-sw-update-marker'

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const isUpdate = await caches.has(UPDATE_MARKER_CACHE)
    if (!isUpdate) await caches.open(UPDATE_MARKER_CACHE)

    await Promise.all(
      (await caches.keys())
        .filter((name) => name === 'profai-app-assets' || name.startsWith('profai-app-assets-'))
        .map((name) => caches.delete(name)),
    )

    // The first service-worker install must not create a visible double-load.
    // Subsequent deployments refresh only safe overview/catalog routes.
    if (!isUpdate) return

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    await Promise.all(windows.map(async (client) => {
      try {
        const url = new URL(client.url)
        if (url.origin !== self.location.origin || !SAFE_REFRESH_ROUTE.test(url.pathname)) return
        if ('navigate' in client) await client.navigate(client.url)
      } catch {
        // A client can close while a new service worker is activating.
      }
    }))
  })())
})
