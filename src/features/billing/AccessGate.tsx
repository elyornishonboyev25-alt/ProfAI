import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LockKeyhole, PlayCircle } from 'lucide-react'
import { ApiError, apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAccountAccess } from './useAccountAccess'
import AccountGate from './AccountGate'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import type { AccessFeature, PlanTier } from './catalog'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import './billing.css'

type Status = { unlocked: boolean; tier?: PlanTier; used?: number; limit?: number | null; remaining?: number | null }

/** Opens a test, mock or lesson. Each new one spends one start from the plan's monthly allowance. */
export default function AccessGate({ feature, resource, children, onCancel, onUnlocked }: {
  feature: AccessFeature; resource: string; children?: ReactNode; onCancel?: () => void; onUnlocked?: () => void
}) {
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const refreshBilling = useBillingStore(s => s.refresh)
  const text = useBillingText()
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)
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
  }, [user?.id, feature, resource, access?.tier, retry])
  useEffect(() => { if (status?.unlocked) continuation.current?.() }, [status?.unlocked])

  async function start() {
    setBusy(true); setError('')
    try {
      await apiClient.post('/billing/access', { feature, resource })
      setStatus(current => ({ ...current, unlocked: true }))
      void refreshBilling()
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === 'PREMIUM_REQUIRED') setStatus(current => ({ ...current, unlocked: false, remaining: 0 }))
      else setError(failure instanceof Error ? failure.message : 'Could not open this test.')
    } finally { setBusy(false) }
  }

  if (!user) return <AccountGate>{null}</AccountGate>
  if (status?.unlocked) return <>{children}</>
  if (error) return <div className="billing-access-wrap"><div className="billing-error" role="alert">{error}<button onClick={() => setRetry(n => n + 1)}>{text('Retry', 'Qayta urinish', 'Повторить')}</button>{onCancel && <button onClick={onCancel}>{text('Back', 'Orqaga', 'Назад')}</button>}</div></div>
  if (!status) return <BrandPageLoader compact label={text('Checking your access…', 'Kirish huquqi tekshirilmoqda…', 'Проверяем доступ…')} />

  const noun = feature === 'mock' ? text('full mocks', 'to‘liq mock', 'полных экзаменов')
    : feature === 'podcast' || feature === 'shadowing' ? text('lessons', 'dars', 'уроков') : text('tests', 'test', 'тестов')
  const planName = status.tier === 'MAX' ? 'Max' : status.tier === 'PRO' ? 'Pro' : 'Free'
  const left = status.remaining ?? 0
  const exhausted = status.remaining !== null && status.remaining !== undefined && left <= 0

  return <section className="billing-access-wrap"><div className="billing-glass billing-access-panel">
    <span className="billing-icon">{exhausted ? <LockKeyhole size={26} /> : <PlayCircle size={26} />}</span>
    <p className="billing-eyebrow">{planName.toUpperCase()} · {text('THIS MONTH', 'SHU OY', 'В ЭТОМ МЕСЯЦЕ')}</p>
    {exhausted ? <>
      <h1>{text('You have used this month’s allowance.', 'Shu oylik imkoniyat tugadi.', 'Лимит этого месяца исчерпан.')}</h1>
      <p>{text(`Your ${planName} plan includes ${status.limit} ${noun} a month. Upgrade to keep going today — or wait until the 1st.`, `${planName} tarifida oyiga ${status.limit} ta ${noun} bor. Bugunoq davom etish uchun tarifni yangilang — yoki keyingi oyning 1-sanasini kuting.`, `Тариф ${planName} включает ${status.limit} ${noun} в месяц. Улучшите тариф или дождитесь 1-го числа.`)}</p>
      <Link className="billing-primary" to="/premium">{text('Compare plans', 'Tariflarni solishtirish', 'Сравнить тарифы')}<ArrowRight size={17} /></Link>
    </> : <>
      <h1>{text('Ready to start?', 'Boshlashga tayyormisiz?', 'Готовы начать?')}</h1>
      <p>{text(`This uses 1 of your ${left} remaining ${noun} this month. Reopening it later this month is free.`, `Bu shu oy qolgan ${left} ta ${noun}dan 1 tasini ishlatadi. Shu oy ichida qayta ochish bepul.`, `Будет использован 1 из ${left} оставшихся ${noun} в этом месяце. Повторное открытие в этом месяце бесплатно.`)}</p>
      <button type="button" className="billing-primary" disabled={busy} onClick={() => void start()}>{busy ? text('Opening…', 'Ochilmoqda…', 'Открываем…') : text('Start now', 'Boshlash', 'Начать')}<ArrowRight size={17} /></button>
      {status.tier === 'FREE' && <Link className="billing-text-button" to="/premium">{text('Unlimited tests with Pro', 'Pro bilan cheksiz testlar', 'Безлимитные тесты с Pro')}</Link>}
    </>}
    {onCancel && <button type="button" className="billing-text-button" onClick={onCancel}>{text('Back', 'Orqaga', 'Назад')}</button>}
  </div></section>
}
