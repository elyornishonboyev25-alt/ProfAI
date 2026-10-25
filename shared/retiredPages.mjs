// Retire the old exam hub and its aliases, keeping live exam URLs available.
export function isRetiredPagePath(pathname) {
  let path
  try { path = decodeURIComponent(pathname).toLowerCase().replace(/\/+$/, '') }
  catch { return false }
  return path === '/test-preparation' || path.startsWith('/test-preparation/')
    || path === '/tests' || path === '/mock'
}
