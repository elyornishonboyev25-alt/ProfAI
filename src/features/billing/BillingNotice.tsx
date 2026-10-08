import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LockKeyhole, X } from 'lucide-react'
import { useBillingText } from './copy'
export default function BillingNotice() {
  const [message, setMessage] = useState('')
  const text = useBillingText()
  useEffect(() => {
    const listener = (event: Event) => setMessage((event as CustomEvent<string>).detail)
    window.addEventListener('profai:premium-required', listener)
    return () => window.removeEventListener('profai:premium-required', listener)
  }, [])
  if (!message) return null
  return <div className="billing-notice" role="alert"><LockKeyhole size={22} /><div><strong>{text('Choose a plan to continue', 'Davom etish uchun tarif tanlang', 'Выберите тариф, чтобы продолжить')}</strong><p>{text('Continue with Student for $3/month or Teacher for $5/month. Your saved progress stays available.', 'Student $3/oy yoki Teacher $5/oy bilan davom eting. Saqlangan natijalar ochiq qoladi.', 'Продолжайте со Student за $3/мес. или Teacher за $5/мес. Прогресс сохранён.')}</p><Link to="/premium" onClick={() => setMessage('')}>{text('View plans', 'Tariflarni ko‘rish', 'Посмотреть тарифы')}<ArrowRight size={14} /></Link></div><button aria-label={text('Dismiss', 'Yopish', 'Закрыть')} onClick={() => setMessage('')}><X size={18} /></button></div>
}
