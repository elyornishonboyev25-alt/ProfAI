import { useCallback, useEffect, useState, type ReactNode } from 'react'
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
  const [verifiedOwner, setVerifiedOwner] = useState<string>()
  const { i18n } = useTranslation()
  const text = accountUsageText(i18n.language)

  useEffect(() => {
    if (!owner || !hydrated) return
    const controller = new AbortController()
    let running = false
    const check = async () => {
      if (running || document.hidden || useAuthStore.getState().user?.id !== owner) return
      running = true
      // Revalidate silently; a request or a failed connection must never unmount
      // an admitted workspace and discard its live inputs or audio element.
      const startedAt = Date.now()
      const requestController = new AbortController()
      const abort = () => requestController.abort()
      controller.signal.addEventListener('abort', abort, { once: true })
      const timeout = window.setTimeout(abort, 12_000)
      try {
        await apiClient.post('/auth/activity/heartbeat', { refreshToken: useAuthStore.getState().refreshToken }, { expectedUserId: owner, signal: requestController.signal })
        if (!controller.signal.aborted && useAuthStore.getState().user?.id === owner) {
          useAccountUsageStore.getState().setUsage(owner, 'active', startedAt + 90_000)
          setVerifiedOwner(owner)
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
    const timer = window.setInterval(() => {
      const current = useAccountUsageStore.getState()
      if (current.owner !== owner || current.status !== 'active' || current.validUntil - Date.now() < 60_000) void check()
    }, 5_000)
    const expiry = window.setInterval(() => {
      const current = useAccountUsageStore.getState()
      if (!document.hidden && current.owner === owner && current.status === 'active' && current.validUntil <= Date.now()) {
        current.setUsage(owner, 'unavailable')
        void check()
      }
    }, 1000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('online', check)
    window.addEventListener('focus', check)
    return () => {
      running = false
      controller.abort()
      window.clearInterval(timer)
      window.clearInterval(expiry)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('online', check)
      window.removeEventListener('focus', check)
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
  if (!owner) return <>{children}</>
  const status = usage.owner === owner ? usage.status : 'checking'
  const admitted = verifiedOwner === owner
  const valid = status === 'active' && usage.validUntil > Date.now()
  const panel = (
    <main className="account-usage-screen">
      <section className="account-usage-panel" role="alert">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{status === 'blocked' ? text.blocked : text.unavailable}</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">{status === 'blocked' ? text.explanation : text.reconnect}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="account-usage-retry" onClick={() => setRetry(value => value + 1)}>{text.retry}</button>
          <button className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 dark:text-slate-200" disabled={signingOut} onClick={() => { void logout() }}>{text.logout}</button>
        </div>
      </section>
    </main>
  )
  if (!admitted) {
    if (status === 'blocked') return panel
    return <div className="account-usage-initial"><BrandPageLoader label={text.checking} />
      {status === 'unavailable' && <button type="button" className="account-usage-initial-retry" onClick={() => setRetry(value => value + 1)}>{text.retry}</button>}
    </div>
  }
  return <>
    <div className="account-usage-frame" ref={node => node?.toggleAttribute('inert', !valid)} aria-hidden={!valid || undefined}>{children}</div>
    {!valid && (status === 'blocked' ? <div className="account-usage-overlay">{panel}</div> :
      <div className="account-usage-reconnecting" role="status" aria-label={text.checking}>
        <div className="account-usage-connection-note"><img src="/logo.svg" alt="" width="24" height="24" /><button type="button" onClick={() => setRetry(value => value + 1)}>{text.retry}</button></div>
      </div>)}
  </>
}
