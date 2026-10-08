import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, Check, GraduationCap, Sparkles, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountAccess } from './useAccountAccess'
import { BILLING_PRODUCTS, FREE_TRIAL_DAYS, type BillingCurrency, type BillingProduct } from './catalog'
import { useBillingText } from './copy'
export function formatBillingMoney(amount: number, currency: BillingCurrency) {
  return currency === 'USD' ? `$${(amount / 100).toFixed(2).replace(/\.00$/, '')}` : `${amount.toLocaleString('en-US').replace(/,/g, ' ')} UZS`
}
export default function PricingCards({ months, onChoose, disabled = false, products = BILLING_PRODUCTS }: {
  months: number; onChoose: (product: BillingProduct) => void; disabled?: boolean; products?: BillingProduct[]
}) {
  const text = useBillingText()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const canTry = !user || access?.active
  const cards = [
    { audience: 'STUDENT', title: 'Student', icon: Users,
      description: text('For every learner. On your own or in a class.', 'Har bir o‘quvchi uchun. Mustaqil yoki classda.', 'Для каждого ученика. Самостоятельно или в классе.'),
      features: [text('Full IELTS and Digital SAT practice', 'IELTS va Digital SAT mashqlari', 'Полная практика IELTS и Digital SAT'),
        text('AI Coach, Writing and Speaking feedback', 'AI Coach, Writing va Speaking tahlili', 'AI Coach, анализ Writing и Speaking'),
        text('Join classes and complete assignments', 'Classlarga qo‘shilish va vazifalarni bajarish', 'Участие в классах и выполнение заданий'),
        text('Podcasts, shadowing and progress tracking', 'Podcast, shadowing va rivojlanish kuzatuvi', 'Подкасты, шэдоуинг и отслеживание прогресса')] },
    { audience: 'TEACHER', title: 'Teacher', icon: GraduationCap,
      description: text('Your teaching workspace, ready for your team.', 'Jamoangiz uchun tayyor o‘qituvchi ish maydoni.', 'Рабочее пространство преподавателя для команды.'),
      features: [text('Everything in Student', 'Studentdagi barcha imkoniyatlar', 'Всё из Student'),
        text('Create classes and invite students', 'Class yaratish va o‘quvchilarni taklif qilish', 'Создание классов и приглашение учеников'),
        text('Assign work and follow student progress', 'Vazifa berish va o‘quvchi natijalarini kuzatish', 'Задания и отслеживание прогресса учеников'),
        text('Manage your classroom in one place', 'Classni bir joyda boshqarish', 'Управление классом в одном месте')] },
  ]
  const period = months === 1 ? text('/ month', '/ oy', '/ месяц') : months === 3 ? text('/ 3 months', '/ 3 oy', '/ 3 месяца') : text('/ year', '/ yil', '/ год')
  return <div className="billing-plan-grid billing-plan-grid-simple">
    <article className="billing-glass billing-plan billing-plan-free">
      <div className="billing-plan-top"><span className="billing-icon"><Sparkles size={24} /></span><span className="billing-saving">{text('No card needed', 'Karta kerak emas', 'Без карты')}</span></div>
      <h3>{text('Start for free', 'Bepul boshlang', 'Начните бесплатно')}</h3><p className="billing-plan-description">{text('Meet your new study routine. Your first week is on us.', 'Yangi o‘qish odatini boshlang. Birinchi hafta bizdan.', 'Начните учиться по-новому. Первая неделя за наш счёт.')}</p>
      <div className="billing-plan-price"><strong>$0</strong><span>{text(`for ${FREE_TRIAL_DAYS} days`, `${FREE_TRIAL_DAYS} kun uchun`, `на ${FREE_TRIAL_DAYS} дней`)}</span></div>
      <p className="billing-plan-total">{text('One account. One free trial. No automatic charges.', 'Har akkauntga bir marta. Avtomatik pul yechilmaydi.', 'Один пробный период на аккаунт. Без списаний.')}</p>
      <ul><li><Check size={16} />{text('Explore IELTS and Digital SAT', 'IELTS va Digital SATni sinang', 'Попробуйте IELTS и Digital SAT')}</li><li><Check size={16} />{text('Try your AI study coach', 'AI o‘qish yordamchisini sinang', 'Попробуйте AI-помощника')}</li><li><Check size={16} />{text('Keep your results and see your progress', 'Natijalarni saqlang va rivojlanishni ko‘ring', 'Сохраняйте результаты и следите за прогрессом')}</li></ul>
      <p className="billing-plan-condition">{text('After 7 days, choose a paid plan to continue AI, IELTS and SAT. Classes require a paid plan.', '7 kundan keyin AI, IELTS va SAT uchun pullik tarif kerak. Classesga pullik tarif bilan qo‘shilasiz.', 'После 7 дней для AI, IELTS и SAT нужен платный тариф. Для классов нужен платный тариф.')}</p>
      <button type="button" className="billing-secondary" disabled={!canTry} onClick={() => navigate(user ? '/ielts' : '/register')}>{!user ? text('Start for free', 'Bepul boshlang', 'Начать бесплатно') : access?.active ? text('Continue learning', 'O‘qishni davom ettirish', 'Продолжить обучение') : text('Free trial used', 'Bepul sinov ishlatilgan', 'Пробный период использован')}<ArrowRight size={17} /></button>
    </article>
    {cards.map(card => {
      const product = products.find(p => p.audience === card.audience && p.months === months)
      if (!product) return null
      const Icon = card.icon
      const recommended = card.audience === 'STUDENT'
      return <article key={card.audience} className={`billing-glass billing-plan ${recommended ? 'billing-plan-featured' : ''}`}>
        {recommended && <span className="billing-plan-recommendation"><Sparkles size={13} aria-hidden="true" />{text('Made for your next step', 'Keyingi qadamingiz uchun', 'Для следующего шага')}</span>}
        <div className="billing-plan-top"><span className="billing-icon"><Icon size={24} /></span>{product.discount > 0 && <span className="billing-saving">{text(`Save ${product.discount}%`, `${product.discount}% tejang`, `Экономия ${product.discount}%`)}</span>}</div>
        <h3>{card.title}</h3><p className="billing-plan-description">{card.description}</p>
        <div className="billing-plan-price"><strong>{formatBillingMoney(product.amountUsd, 'USD')}</strong><span>{period}</span></div>
        <p className="billing-plan-total">{months === 1 ? text('One payment. No auto-renewal.', 'Bir martalik to‘lov. Avtomatik uzaytirilmaydi.', 'Разовый платёж. Без автопродления.') : text(`${formatBillingMoney(Math.round(product.amountUsd / months), 'USD')}/month equivalent · paid in full`, `Oyiga ${formatBillingMoney(Math.round(product.amountUsd / months), 'USD')} · butun muddat bir marta to‘lanadi`, `В среднем ${formatBillingMoney(Math.round(product.amountUsd / months), 'USD')}/мес. · оплата за весь срок`)}</p>
        <ul>{card.features.map(feature => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
        <p className="billing-plan-condition">{card.audience === 'TEACHER' ? text('Each student needs their own active plan to join your class.', 'Classga qo‘shilish uchun har bir o‘quvchiga faol tarif kerak.', 'Каждому ученику нужен свой активный тариф для участия в классе.') : text('One price for independent study and class participation. Class creation is included in Teacher.', 'Mustaqil o‘qish va classga qo‘shilish uchun yagona narx. Class yaratish Teacherda.', 'Единая цена для самостоятельной учёбы и классов. Создание классов включено в Teacher.')}</p>
        <button type="button" className={recommended ? 'billing-primary' : 'billing-secondary'} disabled={disabled} onClick={() => onChoose(product)}>{text(`Choose ${card.title}`, `${card.title}ni tanlash`, `Выбрать ${card.title}`)}<ArrowUpRight size={17} /></button>
      </article>
    })}
  </div>
}
