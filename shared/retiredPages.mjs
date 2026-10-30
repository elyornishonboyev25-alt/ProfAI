// Retire removed hubs and their aliases, keeping live exam and result URLs available.
export function isRetiredPagePath(pathname) {
  let path
  try { path = decodeURIComponent(pathname).toLowerCase().replace(/\/+$/, '') }
  catch { return false }
  return path === '/test-preparation' || path.startsWith('/test-preparation/')
    || path === '/review-mistakes' || path.startsWith('/review-mistakes/')
    || path === '/tests' || path === '/mock'
}
