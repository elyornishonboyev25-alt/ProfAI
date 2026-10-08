import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError, apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

export function useListeningStartAccess(resource: string | null, feature: 'test' | 'mock' = 'test') {
  const userId = useAuthStore(state => state.user?.id)
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  useEffect(() => {
    setReady(true)
    setBusy(false)
    setError('')
    return () => { request.current?.abort(); request.current = null }
  }, [resource, feature, userId])

  async function unlock() {
    if (!resource) return true
    if (request.current) return false
    if (!userId) {
      navigate('/login', { state: { from: location } })
      return false
    }
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setError('')
    try {
      await apiClient.post('/billing/access', { feature, resource }, { signal: controller.signal })
      return !controller.signal.aborted
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof ApiError && failure.code === 'PREMIUM_REQUIRED') navigate('/premium')
        else setError(failure instanceof Error ? failure.message : 'Could not start the test.')
      }
      return false
    } finally {
      if (request.current === controller) { request.current = null; setBusy(false) }
    }
  }

  return { busy, ready, error, unlock }
}
