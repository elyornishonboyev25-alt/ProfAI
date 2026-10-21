import BrandPageLoader from '@/components/common/BrandPageLoader'
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
  const scope = JSON.stringify([user?.id, feature, resource])
  const [grant, setGrant] = useState<{ scope: string; unlocked: boolean } | null>(null)
  const unlocked = grant?.scope === scope && grant.unlocked
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const continuation = useRef(onUnlocked)
  continuation.current = onUnlocked
  useEffect(() => {
    let canceled = false
    // Keep an already verified test mounted during background revalidation.
    setError('')
    if (user) void apiClient.get<{ unlocked: boolean }>(`/billing/access?${new URLSearchParams({ feature, resource })}`).then(status => {
      if (!canceled) setGrant({ scope, unlocked: status.unlocked })
    }).catch(error => { if (!canceled) { setError(error.message); if (error.status === 401 || error.status === 403) setGrant({ scope, unlocked: false }) } })
    return () => { canceled = true }
  }, [scope, access?.active, retry])
  useEffect(() => { if (unlocked) continuation.current?.() }, [unlocked])
  if (unlocked && access?.active) return <>{children}</>
  // The server also allows selected free media lessons without a plan.
  if (unlocked && (feature === 'podcast' || feature === 'shadowing')) return <>{children}</>
  return <AccountGate>{error ? <div className="billing-access-wrap"><div className="billing-error" role="alert">{error}<button onClick={() => setRetry(n => n + 1)}>{text('Retry', 'Qayta urinish', 'Повторить')}</button>{onCancel && <button onClick={onCancel}>{text('Back', 'Orqaga', 'Назад')}</button>}</div></div> : <BrandPageLoader compact />}</AccountGate>
}
