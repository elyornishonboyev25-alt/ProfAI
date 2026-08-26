function toWebSocketUrl(value: string) {
  const base = typeof window === 'undefined' ? 'http://localhost' : window.location.origin
  const url = new URL(value, base)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws/speaking'
  url.search = ''
  url.hash = ''
  return url.toString()
}

/**
 * Resolves the speaking socket against the deployed API host. The frontend and
 * API are commonly deployed on different domains, so using window.location.host
 * alone would silently connect to the static frontend instead of the realtime
 * server.
 */
export function getSpeakingWebSocketUrl() {
  const env = import.meta.env as Record<string, string | undefined>
  const explicit = env.VITE_SPEAKING_WS_URL?.trim()
  if (explicit) return toWebSocketUrl(explicit)

  const apiUrl = (env.VITE_API_URL || env.VITE_API_BASE_URL)?.trim()
  if (apiUrl) return toWebSocketUrl(apiUrl)

  return toWebSocketUrl('/ws/speaking')
}
