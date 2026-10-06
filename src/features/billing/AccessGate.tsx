import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Coins, ShieldCheck } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useBillingText } from './copy'
import type { CoinFeature } from './catalog'
import './billing.css'
type Status = { unlocked: boolean; cost: number; balance: number }
export default function AccessGate({ feature, resource, children, onCancel, onUnlocked }: {
  feature: CoinFeature; resource: string; children?: ReactNode; onCancel?: () => void; onUnlocked?: () => void
}) {
  const user = useAuthStore(s => s.user)
  const text = useBillingText()
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  const continuation = useRef(onUnlocked)
  continuation.current = onUnlocked
  useEffect(() => {
    let canceled = false
    setStatus(null); setError('')
    if (user) void apiClient.get<Status>(`/billing/access?${new URLSearchParams({ feature, resource })}`).then(data => {
      if (!canceled) { setStatus(data); if (data.unlocked) continuation.current?.() }
    }).catch(error => { if (!canceled) setError(error.message) })
    return () => { canceled = true }
  }, [user?.id, feature, resource, reload])
  async function unlock() {
    setBusy(true); setError('')
    try {
      await apiClient.post('/billing/access', { feature, resource })
      setStatus(current => current ? { ...current, unlocked: true } : current)
      window.dispatchEvent(new Event('profai:billing-updated')); onUnlocked?.()
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not open this activity.') }
    finally { setBusy(false) }
  }
  if (status?.unlocked) return <>{children}</>
  return <section className="billing-access-wrap"><div className="billing-glass billing-access-panel">
    {onCancel && <button type="button" className="billing-text-button" onClick={onCancel}><ArrowLeft size={16} />{text('Back', 'Orqaga', 'Назад')}</button>}
    <span className="billing-icon"><Coins size={28} /></span>
    <p className="billing-eyebrow">PROFAI COINS</p><h1>{text('Ready for your next step?', 'Keyingi qadamga tayyormisiz?', 'Готовы к следующему шагу?')}</h1>
    <p>{text('Use your coins for focused practice. Your saved results and free activities always stay available.', 'Tangalar bilan mashqni boshlang. Saqlangan natijalar va bepul mashqlar doim ochiq qoladi.', 'Используйте монеты для практики. Результаты и бесплатные занятия всегда доступны.')}</p>
    {!user ? <Link className="billing-primary" to="/login">{text('Sign in · 150 welcome coins', 'Kirish · 150 sovg‘a tanga', 'Войти · 150 приветственных монет')}<ArrowRight size={16} /></Link> : status ? <>
      <div className="billing-access-cost"><strong>{status.cost}</strong><span>{text('coins', 'tanga', 'монет')}</span><small>{text('Your balance', 'Balansingiz', 'Ваш баланс')}: {status.balance}</small></div>
      {status.balance >= status.cost ? <button type="button" className="billing-primary" disabled={busy} onClick={() => void unlock()}>{busy ? text('Opening…', 'Ochilmoqda…', 'Открываем…') : text(`Continue · ${status.cost} coins`, `Davom etish · ${status.cost} tanga`, `Продолжить · ${status.cost} монет`)}<ArrowRight size={17} /></button> : <Link className="billing-primary" to="/premium">{text('Add coins', 'Tangalarni to‘ldirish', 'Пополнить монеты')}<ArrowRight size={17} /></Link>}
      <small className="billing-access-note"><ShieldCheck size={14} />{feature === 'shadowing' || feature === 'podcast' ? text('Open once. Replay for free.', 'Bir marta oching. Takrorlash bepul.', 'Откройте один раз. Повторы бесплатны.') : text('24 hours of access, including resume. No charge on refresh.', '24 soat foydalanish va davom ettirish. Yangilashda qayta tanga olinmaydi.', 'Доступ на 24 часа с продолжением. Обновление без повторной оплаты.')}</small>
    </> : !error ? <p role="status">{text('Checking your balance…', 'Balans tekshirilmoqda…', 'Проверяем баланс…')}</p> : null}
    {error && <div role="alert" className="billing-error">{error}<button type="button" onClick={() => setReload(n => n + 1)}>{text('Retry', 'Qayta urinish', 'Повторить')}</button></div>}
    <Link className="billing-text-button" to="/vocabulary">{text('Continue with free vocabulary', 'Bepul lug‘at mashqlariga o‘tish', 'Продолжить бесплатный словарь')}<ArrowRight size={15} /></Link>
  </div></section>
}
