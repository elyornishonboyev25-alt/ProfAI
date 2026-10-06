import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Coins, X } from 'lucide-react'
import { useBillingText } from './copy'
export default function BillingNotice() {
  const [message, setMessage] = useState('')
  const text = useBillingText()
  useEffect(() => {
    const listener = (event: Event) => setMessage((event as CustomEvent<string>).detail)
    window.addEventListener('profai:coins-required', listener)
    return () => window.removeEventListener('profai:coins-required', listener)
  }, [])
  if (!message) return null
  return <div className="billing-notice" role="alert"><Coins size={22} /><div><strong>{text('More coins needed', 'Tangalarni to‘ldiring', 'Нужны монеты')}</strong><p>{text('Your balance is too low for this action. Your progress and free activities remain available.', 'Bu amal uchun balans yetarli emas. Natijalaringiz va bepul mashqlar ochiq qoladi.', 'Для этого действия не хватает монет. Результаты и бесплатные занятия доступны.')}</p><Link to="/premium" onClick={() => setMessage('')}>{text('View plans & coins', 'Tariflar va tangalar', 'Тарифы и монеты')}<ArrowRight size={14} /></Link></div><button aria-label={text('Dismiss', 'Yopish', 'Закрыть')} onClick={() => setMessage('')}><X size={18} /></button></div>
}
