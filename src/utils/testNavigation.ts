export type TestNavigationState = {
  returnTo?: string
  resultBackTo?: string
  fromResults?: boolean
}

/** Store a concrete internal destination instead of relying on browser history depth. */
export function testReturnPath(state: unknown, fallback: string): string {
  const target = (state as TestNavigationState | null)?.returnTo
  return typeof target === 'string' && /^\/(?:profile|ielts|sat|mock\/ielts|mock\/sat|results)(?:[/?#]|$)/.test(target) ? target : fallback
}

export function testReturnLabel(path: string, fallback: string): string {
  if (path.includes('in-process')) return 'In process'
  if (path === '/profile') return 'My Results'
  if (/^\/ielts(?:$|\?)/.test(path)) return 'IELTS · In process'
  if (/^\/sat(?:$|\?)/.test(path)) return 'SAT · In process'
  if (/^\/mock\/ielts\//.test(path)) return 'Full Mock'
  return fallback
}
