import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAccountAccess } from './useAccountAccess'
import AccountGate from './AccountGate'
import { useBillingText } from './copy'
import type { AccessFeature, PlanTier } from './catalog'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import UpgradePrompt from './UpgradePrompt'
import './billing.css'

type Status = { unlocked: boolean; tier?: PlanTier }
export default function AccessGate({ feature, resource, children, onCancel, onUnlocked }: {
  feature: AccessFeature; resource: string; children?: ReactNode; onCancel?: () => void; onUnlocked?: () => void
}) {
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const text = useBillingText()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const continuation = useRef(onUnlocked)
  continuation.current = onUnlocked
  useEffect(() => {
    let canceled = false
    setStatus(null); setError('')
    if (user) void apiClient.get<Status>(`/billing/access?${new URLSearchParams({ feature, resource })}`).then(value => {
      if (!canceled) setStatus(value)
    }).catch(failure => { if (!canceled) setError(failure.message) })
    return () => { canceled = true }
  }, [user?.id, feature, resource, access?.active, access?.tier, retry])
  useEffect(() => { if (status?.unlocked) continuation.current?.() }, [status?.unlocked])
  const close = onCancel ?? (() => navigate(resource.startsWith('mock:sat:') ? '/sat' : resource.startsWith('mock:ielts:') ? '/mock/ielts' : '/ielts/tests'))
  if (!user) return <AccountGate>{null}</AccountGate>
  if (status?.unlocked) return <>{children}</>
  if (error) return <div className="billing-access-wrap"><div className="billing-error" role="alert">{error}<button onClick={() => setRetry(n => n + 1)}>{text('Retry', 'Qayta urinish', 'Повторить')}</button><button onClick={close}>{text('Back', 'Orqaga', 'Назад')}</button></div></div>
  if (!status) return <BrandPageLoader compact label={text('Checking your access…', 'Kirish huquqi tekshirilmoqda…', 'Проверяем доступ…')} />
  return <section className="billing-access-wrap"><UpgradePrompt onClose={close} /></section>
}
