import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountAccess } from './useAccountAccess'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import BrandPageLoader from '@/components/common/BrandPageLoader'
import './billing.css'
export default function AccountGate({ children, classes = false }: { children: ReactNode; classes?: boolean }) {
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const { wallet, userId, error, refresh } = useBillingStore()
  const text = useBillingText()
  const paid = access?.active
  // Every signed-in account has the Free plan; its monthly limits are enforced where a test or AI request starts.
  const allowed = classes ? paid && (userId === user?.id ? wallet?.canJoinClass : user?.canJoinClass) : Boolean(user)
  if (user && allowed) return <>{children}</>
  if (user && !access && !error) return <BrandPageLoader compact label={text('Checking your access…', 'Kirish huquqi tekshirilmoqda…', 'Проверяем доступ…')} />
  return <section className="billing-access-wrap"><div className="billing-glass billing-access-panel">
    <span className="billing-icon"><LockKeyhole size={26} /></span>
    <p className="billing-eyebrow">IVYGOO PREMIUM</p>
    <h1>{!user ? text('Your next chapter starts free.', 'Yangi bosqichni bepul boshlang.', 'Новый этап начинается бесплатно.') : classes ? text('Learn together with Premium.', 'Premium bilan birga o‘rganing.', 'Учитесь вместе с Premium.') : text('Keep your momentum.', 'Rivojlanishda davom eting.', 'Продолжайте двигаться вперёд.')}</h1>
    <p>{classes ? text('Joining classes requires Pro ($5.99/month) or Max ($11.99/month). Classes are not part of the Free plan.', 'Classga qo‘shilish uchun Pro ($5.99/oy) yoki Max ($11.99/oy) kerak. Free tarifga classlar kirmaydi.', 'Для классов нужен Pro ($5.99/мес.) или Max ($11.99/мес.). В тариф Free классы не входят.') : text('Create a free account to practise IELTS and SAT, get AI feedback and save your progress. No card needed.', 'IELTS va SAT mashq qilish, AI tahlil olish va natijalarni saqlash uchun bepul hisob oching. Karta kerak emas.', 'Создайте бесплатный аккаунт: практика IELTS и SAT, AI-разборы и сохранение прогресса. Без карты.')}</p>
    <Link className="billing-primary" to={user ? '/premium' : '/register'}>{user ? text('Choose your plan', 'Tarifni tanlang', 'Выбрать тариф') : text('Start for free · $0', 'Bepul boshlang · $0', 'Начать бесплатно · $0')}<ArrowRight size={17} /></Link>
    <small className="billing-access-note"><ShieldCheck size={15} />{text('Your saved results and vocabulary stay available.', 'Saqlangan natijalar va lug‘at ochiq qoladi.', 'Результаты и словарь остаются доступны.')}</small>
    {error && <div className="billing-error" role="alert">{error}<button onClick={() => void refresh()}>{text('Retry', 'Qayta urinish', 'Повторить')}</button></div>}
  </div></section>
}
