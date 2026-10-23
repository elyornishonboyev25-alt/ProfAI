import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import { apiClient, ApiError } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAccountUsageStore } from '@/store/accountUsageStore'
import { accountUsageText } from '@/i18n/accountUsage'

export default function AccountUsageBoundary({ children }: { children: ReactNode }) {
  const owner = useAuthStore(state => state.user?.id)
  const hydrated = useAuthStore(state => state.hydrated)
  const usage = useAccountUsageStore()
  const [retry, setRetry] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  const verifiedOwner = useRef<string>()
  const { i18n } = useTranslation()
  const text = accountUsageText(i18n.language)

  useEffect(() => {
    if (!owner || !hydrated) return
    const controller = new AbortController()
    let running = false
    const check = async () => {
      if (controller.signal.aborted || running || document.hidden || useAuthStore.getState().user?.id !== owner) return
      running = true
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
        if (error instanceof ApiError && error.code === 'ACCOUNT_IN_USE') current.setUsage(owner, 'blocked')
        else if (current.owner !== owner || current.status !== 'active' || current.validUntil <= Date.now()) current.setUsage(owner, 'unavailable')
      } finally {
        window.clearTimeout(timeout)
        controller.signal.removeEventListener('abort', abort)
        running = false
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
    return () => {
      running = false
      controller.abort()
      window.clearInterval(timer)
      window.clearInterval(expiry)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('online', check)
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

  if (!hydrated) return <BrandPageLoader label={text.checking} />
  if (!owner) { verifiedOwner.current = undefined; return <>{children}</> }
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900" role="alert">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{status === 'blocked' ? text.blocked : text.unavailable}</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">{status === 'blocked' ? text.explanation : text.reconnect}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white" onClick={() => setRetry(value => value + 1)}>{text.retry}</button>
          <button className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 dark:text-slate-200" disabled={signingOut} onClick={() => { void logout() }}>{text.logout}</button>
        </div>
      </section>
    </main>
    ))}
    </>
  )
}
