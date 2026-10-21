import { useEffect, useRef, useState, type ReactNode } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAccountAccess } from './useAccountAccess'
import AccountGate from './AccountGate'
import { useBillingText } from './copy'
import type { AccessFeature } from './catalog'
export default function AccessGate({ feature, resource, children, onCancel, onUnlocked }: {
  feature: AccessFeature; resource: string; children?: ReactNode; onCancel?: () => void; onUnlocked?: () => void
}) {
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const text = useBillingText()
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const continuation = useRef(onUnlocked)
  continuation.current = onUnlocked
  useEffect(() => {
    let canceled = false
    setUnlocked(false); setError('')
    if (user) void apiClient.get<{ unlocked: boolean }>(`/billing/access?${new URLSearchParams({ feature, resource })}`).then(status => {
      if (!canceled) setUnlocked(status.unlocked)
    }).catch(error => { if (!canceled) setError(error.message) })
    return () => { canceled = true }
  }, [user?.id, feature, resource, access?.active, retry])
  useEffect(() => { if (unlocked) continuation.current?.() }, [unlocked])
  if (unlocked && access?.active) return <>{children}</>
  // The server also allows selected free media lessons without a plan.
  if (unlocked && (feature === 'podcast' || feature === 'shadowing')) return <>{children}</>
  return <AccountGate>{error ? <div className="billing-access-wrap"><div className="billing-error" role="alert">{error}<button onClick={() => setRetry(n => n + 1)}>{text('Retry', 'Qayta urinish', 'Повторить')}</button>{onCancel && <button onClick={onCancel}>{text('Back', 'Orqaga', 'Назад')}</button>}</div></div> : <p role="status">{text('Checking your access…', 'Kirish huquqi tekshirilmoqda…', 'Проверяем доступ…')}</p>}</AccountGate>
}
