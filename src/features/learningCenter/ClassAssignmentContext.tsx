import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Catalogs lead to a second route before a test starts. Keep the explicit
// assignment query throughout that journey; leaving learning routes clears it.
export default function ClassAssignmentContext() {
  const location = useLocation()
  const navigate = useNavigate()
  const userId = useAuthStore((state) => state.user?.id)
  const context = useRef<{ userId?: string; id?: string }>({})
  useEffect(() => {
    const learningRoute = /^\/(?:sat(?:\/|$)|mock\/(?:sat|ielts)(?:\/|$)|ielts(?:\/|$)|test\/|tests(?:\/|$)|vocabulary(?:\/|$))/.test(location.pathname)
    if (!learningRoute || !userId) { context.current = {}; return }
    const query = new URLSearchParams(location.search)
    const explicitId = query.get('assignmentId')
    if (explicitId) { context.current = { userId, id: explicitId }; return }
    if (context.current.userId !== userId || !context.current.id) { context.current = {}; return }
    query.set('assignmentId', context.current.id)
    navigate({ pathname: location.pathname, search: query.toString(), hash: location.hash }, { replace: true, state: location.state })
  }, [location, navigate, userId])
  return null
}
