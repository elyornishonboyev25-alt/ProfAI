import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import DeviceAccessDialog from '@/components/auth/DeviceAccessDialog'
import DeviceAccessPanel from '@/components/auth/DeviceAccessPanel'
import { apiClient, ApiError, releaseDeviceUsage } from '@/lib/apiClient'
import { startDeviceActivity } from '@/lib/deviceActivity'
import { useAuthStore } from '@/store/authStore'
import { useAccountUsageStore } from '@/store/accountUsageStore'
import { accountUsageText } from '@/i18n/accountUsage'

export default function AccountUsageBoundary({ children }: { children: ReactNode }) {
  const owner = useAuthStore(state => state.user?.id)
  const hydrated = useAuthStore(state => state.hydrated)
  const usage = useAccountUsageStore()
  const [retry, setRetry] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  const [checking, setChecking] = useState(false)
  const verifiedOwner = useRef<string>()
  const { i18n } = useTranslation()
  const text = accountUsageText(i18n.language)

  // Closing the last tab frees the account for the owner's other devices at once.
  useEffect(() => { startDeviceActivity(releaseDeviceUsage) }, [])

  useEffect(() => {
    if (!owner || !hydrated) return
    const controller = new AbortController()
    let running = false
    const check = async () => {
      if (controller.signal.aborted || running || document.hidden || useAuthStore.getState().user?.id !== owner) return
      running = true
      setChecking(true)
      const previous = useAccountUsageStore.getState()
      if (previous.owner === owner && previous.status === 'active' && previous.validUntil <= Date.now()) previous.setUsage(owner, 'checking')
      // Use the request start time so a delayed response cannot extend access
      // past the server's lease. Stop offline usage before that lease expires.
      const startedAt = Date.now()
      const requestController = new AbortController()
      const abort = () => requestController.abort()
      controller.signal.addEventListener('abort', abort, { once: true })
      const timeout = window.setTimeout(abort, 12_000)
      try {
        // Retry short network/server interruptions inside the same bounded request window.
        for (let attempt = 0; ; attempt++) {
          try {
            await apiClient.post('/auth/activity/heartbeat', { refreshToken: useAuthStore.getState().refreshToken }, { expectedUserId: owner, signal: requestController.signal })
            break
          } catch (error) {
            const transient = !(error instanceof ApiError) || error.status >= 500 || error.status === 408 || error.status === 429
            if (!transient || attempt >= 2 || requestController.signal.aborted) throw error
            await new Promise<void>(resolve => {
              const done = () => { window.clearTimeout(delay); requestController.signal.removeEventListener('abort', done); resolve() }
              const delay = window.setTimeout(done, 400 * (attempt + 1))
              requestController.signal.addEventListener('abort', done, { once: true })
            })
            if (requestController.signal.aborted) throw error
          }
        }
        if (!controller.signal.aborted && useAuthStore.getState().user?.id === owner) {
          useAccountUsageStore.getState().setUsage(owner, 'active', startedAt + 90_000)
        }
      } catch (error) {
        if (controller.signal.aborted) return
        if (useAuthStore.getState().user?.id !== owner) return
        const current = useAccountUsageStore.getState()
        if (error instanceof ApiError && error.code === 'ACCOUNT_IN_USE') current.setUsage(owner, 'blocked', 0, error.details)
        else if (current.owner !== owner || current.status !== 'active' || current.validUntil <= Date.now()) current.setUsage(owner, 'unavailable')
      } finally {
        window.clearTimeout(timeout)
        controller.signal.removeEventListener('abort', abort)
        running = false
        if (!controller.signal.aborted) setChecking(false)
      }
    }
    void check()
    const timer = window.setInterval(() => { void check() }, 30_000)
    const expiry = window.setInterval(() => {
      const current = useAccountUsageStore.getState()
      if (!document.hidden && !running && current.owner === owner && current.status === 'active' && current.validUntil <= Date.now()) void check()
    }, 1000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('online', check)
    // Returning to an idle tab confirms at once whether this device may continue.
    window.addEventListener('profai:device-active', check)
    return () => {
      running = false
      controller.abort()
      window.clearInterval(timer)
      window.clearInterval(expiry)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('online', check)
      window.removeEventListener('profai:device-active', check)
    }
  }, [owner, hydrated, retry])

  const logout = useCallback(async () => {
    setSigningOut(true)
    const current = useAuthStore.getState()
    try {
      if (current.refreshToken) await apiClient.post('/auth/logout', { refreshToken: current.refreshToken })
    } catch { /* Local sign-out remains available when offline. */ }
    finally {
      if (useAuthStore.getState().user?.id === current.user?.id) useAuthStore.getState().clearSession()
      setSigningOut(false)
    }
  }, [])
  const retryNow = useCallback(() => setRetry(value => value + 1), [])

  if (!hydrated) return <BrandPageLoader label={text.checking} />
  if (!owner) { verifiedOwner.current = undefined; return <>{children}<DeviceAccessDialog /></> }
  const status = usage.owner === owner ? usage.status : 'checking'
  const allowed = status === 'active' && usage.validUntil > Date.now()
  if (allowed) verifiedOwner.current = owner
  if (status === 'blocked') verifiedOwner.current = undefined
  // An expired lease still gates access, but must not destroy the running test,
  // audio position or sync state when a background tab becomes visible again.
  const retained = allowed || verifiedOwner.current === owner
  return (
    <>
    {retained && <div key={owner} data-account-workspace aria-hidden={!allowed || undefined} hidden={!allowed} ref={node => { if (node) node.inert = !allowed }} style={{ display: allowed ? 'contents' : 'none' }}>{children}</div>}
    {!allowed && (status === 'checking' || status === 'active' ? <BrandPageLoader compact label={text.checking} /> : (
    <main className="device-access-page">
      <DeviceAccessPanel variant={status === 'blocked' ? 'in-use' : 'unavailable'} activeDevice={usage.details?.activeDevice}
        startedAt={usage.blockedAt} checking={checking} onRetry={retryNow} onLogout={() => { void logout() }} loggingOut={signingOut} />
    </main>
    ))}
    <DeviceAccessDialog />
    </>
  )
}
