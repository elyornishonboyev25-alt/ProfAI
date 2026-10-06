import { ArrowUpRight, Check, Coins, GraduationCap, Sparkles, Users } from 'lucide-react'
import { BILLING_PRODUCTS, type BillingCurrency, type BillingProduct } from './catalog'
import { useBillingText } from './copy'

export function formatBillingMoney(amount: number, currency: BillingCurrency) {
  return currency === 'USD' ? `$${(amount / 100).toFixed(2)}` : `${amount.toLocaleString('en-US').replace(/,/g, ' ')} UZS`
}

export default function PricingCards({ months, onChoose, disabled = false, products = BILLING_PRODUCTS }: {
  months: number; onChoose: (product: BillingProduct) => void; disabled?: boolean; products?: BillingProduct[]
}) {
  const text = useBillingText()
  const cards = [
    { audience: 'CENTER_STUDENT', title: 'Classes', icon: Users,
      description: text('For students in a teacher’s class.', 'O‘qituvchi classidagi har bir o‘quvchi uchun.', 'Для каждого ученика класса преподавателя.'),
      features: [text('IELTS, SAT and AI practice with coins', 'Tangalar bilan IELTS, SAT va AI mashqlari', 'Практика IELTS, SAT и AI за монеты'),
        text('Join your teacher’s assignments', 'O‘qituvchi bergan vazifalarni bajarish', 'Выполнение заданий преподавателя'),
        text('Your results and learning progress', 'Shaxsiy natijalar va rivojlanish', 'Личные результаты и прогресс')] },
    { audience: 'LEARNER', title: 'Individual', icon: Coins,
      description: text('Your personal learning plan.', 'Mustaqil o‘rganish uchun shaxsiy tarif.', 'Личный тариф для самостоятельной учёбы.'),
      features: [text('IELTS and SAT practice with coins', 'Tangalar bilan IELTS va SAT mashqlari', 'Практика IELTS и SAT за монеты'),
        text('Writing, Speaking and AI feedback', 'Writing, Speaking va AI tahlili', 'Анализ Writing, Speaking и AI'),
        text('Podcasts, shadowing and saved results', 'Podcast, shadowing va saqlangan natijalar', 'Подкасты, шэдоуинг и результаты')] },
    { audience: 'TEACHER', title: 'Teacher', icon: GraduationCap,
      description: text('Practice and manage your own classes.', 'Mashq qiling va o‘z classlaringizni boshqaring.', 'Практикуйтесь и управляйте своими классами.'),
      features: [text('IELTS, SAT and AI practice with coins', 'Tangalar bilan IELTS, SAT va AI mashqlari', 'Практика IELTS, SAT и AI за монеты'),
        text('Create classes and invite students', 'Class yaratish va o‘quvchilarni taklif qilish', 'Создание классов и приглашение учеников'),
        text('Assignments and student progress', 'Vazifalar va o‘quvchilar natijalari', 'Задания и прогресс учеников')] },
  ]
  const period = months === 1 ? text('/ month', '/ oy', '/ месяц') : months === 3 ? text('/ 3 months', '/ 3 oy', '/ 3 месяца') : text('/ year', '/ yil', '/ год')
  return <div className="billing-plan-grid billing-plan-grid-simple">{cards.map(card => {
    const product = products.find(p => p.audience === card.audience && p.months === months)
    if (!product) return null
    const Icon = card.icon
    const recommended = card.audience === 'LEARNER'
    return <article key={card.audience} className={`billing-glass billing-plan ${recommended ? 'billing-plan-featured' : ''}`}>
      {recommended && <span className="billing-plan-recommendation"><Sparkles size={13} aria-hidden="true" />{text('Recommended', 'Tavsiya etiladi', 'Рекомендуем')}</span>}
      <div className="billing-plan-top"><span className="billing-icon"><Icon size={24} /></span>{product.discount > 0 && <span className="billing-saving">{text(`Save ${product.discount}%`, `${product.discount}% tejang`, `Экономия ${product.discount}%`)}</span>}</div>
      <h3>{card.title}</h3><p className="billing-plan-description">{card.description}</p>
      <div className="billing-plan-price"><strong>{formatBillingMoney(product.amountUsd, 'USD')}</strong><span>{period}</span></div>
      <p className="billing-plan-total">{months === 1 ? text('One payment. No auto-renewal.', 'Bir martalik to‘lov. Avtomatik uzaytirilmaydi.', 'Разовый платёж. Без автопродления.') : text(
        `${formatBillingMoney(Math.round(product.amountUsd / months), 'USD')}/month equivalent · paid in full`,
        `Oyiga ${formatBillingMoney(Math.round(product.amountUsd / months), 'USD')} ga teng · jami summa bir marta to‘lanadi`,
        `В среднем ${formatBillingMoney(Math.round(product.amountUsd / months), 'USD')}/мес. · оплата за весь срок`)}</p>
      <div className="billing-plan-coins"><Coins size={19} /><strong>{product.coins.toLocaleString('en-US')}</strong><span>{text('coins included · never expire', 'tanga beriladi · muddatsiz', 'монет включено · не сгорают')}</span></div>
      <ul>{card.features.map(feature => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
      <p className="billing-plan-condition">{card.audience === 'TEACHER' ? text('Class creation is included for the plan duration. Each student uses their own balance.', 'Tarif muddati davomida class yaratish mumkin. Har bir o‘quvchi o‘z balansidan foydalanadi.', 'Создание классов включено на весь срок. У каждого ученика свой баланс.') : card.audience === 'CENTER_STUDENT' ? text('Per student. Requires active membership in a class. Does not include class creation.', 'Har bir o‘quvchi uchun. Classda faol a’zolik kerak. Class yaratish huquqi kirmaydi.', 'За каждого ученика. Нужно активное участие в классе. Без создания классов.') : text('For your own practice. To create classes, choose Teacher.', 'Shaxsiy mashqlar uchun. Class yaratish uchun Teacher tarifini tanlang.', 'Для личной практики. Для создания классов выберите Teacher.')}</p>
      <button type="button" className={recommended ? 'billing-primary' : 'billing-secondary'} disabled={disabled} onClick={() => onChoose(product)}>{text(`Choose ${card.title}`, `${card.title}ni tanlash`, `Выбрать ${card.title}`)}<ArrowUpRight size={17} /></button>
    </article>
  })}</div>
}
