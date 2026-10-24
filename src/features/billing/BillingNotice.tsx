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
  return <div className="billing-notice" role="alert"><LockKeyhole size={22} /><div><strong>{text('Upgrade to keep going', 'Davom etish uchun tarifni yangilang', 'Улучшите тариф, чтобы продолжить')}</strong><p>{text('You have reached this month’s limit. Continue with Pro ($6/month) or Max ($12/month). Your saved progress stays available.', 'Shu oylik limit tugadi. Pro ($6/oy) yoki Max ($12/oy) bilan davom eting. Saqlangan natijalar ochiq qoladi.', 'Лимит этого месяца исчерпан. Продолжайте с Pro ($6/мес.) или Max ($12/мес.). Прогресс сохранён.')}</p><Link to="/premium" onClick={() => setMessage('')}>{text('View plans', 'Tariflarni ko‘rish', 'Посмотреть тарифы')}<ArrowRight size={14} /></Link></div><button aria-label={text('Dismiss', 'Yopish', 'Закрыть')} onClick={() => setMessage('')}><X size={18} /></button></div>
}
