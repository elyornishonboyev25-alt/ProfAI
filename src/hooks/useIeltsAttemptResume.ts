import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { saveIeltsAttemptResume } from '@/utils/ieltsAttemptResume'

export function useIeltsAttemptResume(active: boolean, sessionKey: string, title: string) {
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const location = useLocation()
  useLayoutEffect(() => {
    if (active) saveIeltsAttemptResume(owner, {
      sessionKey, title, pathname: location.pathname, search: location.search, state: location.state,
    })
  }, [active, sessionKey, title, owner, location.pathname, location.search, location.state])
}
