import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountAccess } from './useAccountAccess'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import './billing.css'
export default function AccountGate({ children, classes = false }: { children: ReactNode; classes?: boolean }) {
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const { wallet, userId, error, refresh } = useBillingStore()
  const text = useBillingText()
  const paid = access?.active && access.kind !== 'TRIAL'
  const allowed = classes ? paid && (userId === user?.id ? wallet?.canJoinClass : user?.canJoinClass) : access?.active
  if (user && allowed) return <>{children}</>
  if (user && !access && !error) return <div className="billing-access-wrap" role="status">{text('Checking your access…', 'Kirish huquqi tekshirilmoqda…', 'Проверяем доступ…')}</div>
  return <section className="billing-access-wrap"><div className="billing-glass billing-access-panel">
    <span className="billing-icon"><LockKeyhole size={26} /></span>
    <p className="billing-eyebrow">PROFAI PREMIUM</p>
    <h1>{!user ? text('Your next chapter starts free.', 'Yangi bosqichni bepul boshlang.', 'Новый этап начинается бесплатно.') : classes ? text('Learn together with Premium.', 'Premium bilan birga o‘rganing.', 'Учитесь вместе с Premium.') : text('Keep your momentum.', 'Rivojlanishda davom eting.', 'Продолжайте двигаться вперёд.')}</h1>
    <p>{classes ? text('Joining classes requires Student ($3/month) or Teacher ($5/month). Classes are not included in the free trial.', 'Classga qo‘shilish uchun Student ($3/oy) yoki Teacher ($5/oy) kerak. Classes bepul sinovga kirmaydi.', 'Для классов нужен Student ($3/мес.) или Teacher ($5/мес.). Классы не включены в пробный период.') : user ? text('Your 7-day free trial has ended. Continue IELTS, SAT and AI practice with a plan from $3/month.', '7 kunlik bepul sinov tugadi. IELTS, SAT va AI mashqlarini oyiga $3 dan davom ettiring.', '7-дневный пробный период закончился. Продолжайте IELTS, SAT и AI от $3/мес.') : text('Try IELTS, SAT and AI for 7 days. $0 today. No card required.', 'IELTS, SAT va AIni 7 kun sinang. Bugun $0. Karta talab etilmaydi.', 'Попробуйте IELTS, SAT и AI 7 дней. Сегодня $0. Карта не нужна.')}</p>
    <Link className="billing-primary" to={user ? '/premium' : '/register'}>{user ? text('Choose your plan', 'Tarifni tanlang', 'Выбрать тариф') : text('Start for free · $0', 'Bepul boshlang · $0', 'Начать бесплатно · $0')}<ArrowRight size={17} /></Link>
    <small className="billing-access-note"><ShieldCheck size={15} />{text('Your saved results and vocabulary stay available.', 'Saqlangan natijalar va lug‘at ochiq qoladi.', 'Результаты и словарь остаются доступны.')}</small>
    {error && <div className="billing-error" role="alert">{error}<button onClick={() => void refresh()}>{text('Retry', 'Qayta urinish', 'Повторить')}</button></div>}
  </div></section>
}
