import UiText from '@/components/common/UiText'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AudioLines, ArrowUpRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from './store'
import { useAccountAccess } from './useAccountAccess'
import { useBillingText } from './copy'
import { remainingPercent } from './studyResources'
import './premium-experience.css'

export default function UsageBalance({ compact = false }: { compact?: boolean }) {
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const { wallet, userId, refresh, error } = useBillingStore()
  const text = useBillingText()
  useEffect(() => {
    const update = () => { void refresh() }
    window.addEventListener('profai:billing-updated', update)
    return () => window.removeEventListener('profai:billing-updated', update)
  }, [refresh])
  if (!user) return null
  const own = userId === user.id ? wallet : null
  const usage = own?.usage?.ai
  const unlimited = access?.active && access.kind === 'UNLIMITED'
  const percent = unlimited ? 100 : usage ? remainingPercent(usage.used, usage.limit) : null
  const voice = own?.voiceUsage
  const hours = (seconds: number) => {
    const minutes = Math.max(0, Math.ceil(seconds / 60))
    const h = Math.floor(minutes / 60), m = minutes % 60
    return text(`${h}h ${m}m`, `${h} soat ${m} daq`, `${h} ч ${m} мин`)
  }
  return <section className={`usage-balance ${compact ? 'usage-balance--compact' : ''}`} aria-label={text('Your AI balance', 'AI balansingiz', 'Ваш баланс AI')}>
    <div className="usage-text-balance"><div className="usage-label"><Sparkles size={17} /><span>{text('AI balance', 'AI balansi', 'Баланс AI')}</span><strong>{percent === null ? '—' : `${percent}%`}</strong></div>
      <div className="usage-meter" role="progressbar" aria-label={text('Monthly AI balance remaining', 'Qolgan oylik AI balansi', 'Остаток месячного баланса AI')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent ?? undefined}><span style={{ width: `${percent ?? 0}%` }} /></div>
      {!compact && <p>{error ? text('Balance unavailable.', 'Balansni yuklab bo‘lmadi.', 'Баланс недоступен.') : text('Renews on the 1st of each month. Live AI time is separate.', 'Har oyning 1-sanasida yangilanadi. Live AI vaqti alohida.', 'Обновляется 1-го числа. Время Live AI учитывается отдельно.')}{error && <button onClick={() => void refresh()}>{text('Retry', 'Qayta urinish', 'Повторить')}</button>}</p>}
    </div>
    {(!compact || access?.active) && <div className="usage-voice-balance"><AudioLines size={18} /><div><strong><UiText text={"Live AI"} /></strong>{!access?.active ? <Link to="/premium">IvyGoo Pro / IvyGoo Elite<ArrowUpRight size={13} /></Link> : unlimited ? <p>{text('Unlimited access', 'Cheksiz kirish', 'Безлимитный доступ')}</p> : voice ? <p><span>{text('Today', 'Bugun', 'Сегодня')}: <b>{hours(Math.max(0, (voice.daily.limit ?? 0) - voice.daily.used))}</b></span><span>{text('This month', 'Shu oy', 'За месяц')}: <b>{hours(Math.max(0, (voice.monthly.limit ?? 0) - voice.monthly.used))}</b></span></p> : <p>—</p>}</div></div>}
  </section>
}
