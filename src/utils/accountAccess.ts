type ReturnLocation = { pathname?: string; search?: string; hash?: string }

// Check public routes before mounting any workspace shell or content.
export function isPublicAccountRoute(pathname: string) {
  return ['/', '/login', '/register', '/premium', '/learning-center', '/diagnostic'].includes(pathname)
    || pathname.startsWith('/shared/')
    || pathname.startsWith('/speaker/')
    || pathname.startsWith('/u/')
}

export function accountReturnPath(from?: ReturnLocation | null) {
  const pathname = from?.pathname
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\')
    || Array.from(pathname).some(character => character.charCodeAt(0) < 32)) return '/dashboard'
  if (['/login', '/register', '/onboarding', '/focus', '/diagnostic'].includes(pathname)) return '/dashboard'
  const search = from?.search?.startsWith('?') ? from.search : ''
  const hash = from?.hash?.startsWith('#') ? from.hash : ''
  return `${pathname}${search}${hash}`
}
