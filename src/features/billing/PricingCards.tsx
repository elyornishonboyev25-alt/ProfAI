import { ArrowUpRight, BookOpen, Check, Coins, GraduationCap, Users } from 'lucide-react'
import { BILLING_PRODUCTS, type BillingAudience, type BillingCurrency, type BillingProduct } from './catalog'
import { useBillingText } from './copy'
export function formatBillingMoney(amount: number, currency: BillingCurrency) {
  return currency === 'USD' ? `$${(amount / 100).toFixed(2)}` : `${amount.toLocaleString('en-US').replace(/,/g, ' ')} UZS`
}
export default function PricingCards({ months, currency, onChoose, disabled = false, products = BILLING_PRODUCTS }: {
  months: number; currency: BillingCurrency; onChoose: (product: BillingProduct) => void; disabled?: boolean; products?: BillingProduct[]
}) {
  const text = useBillingText()
  const cards: Array<{ audience: BillingAudience; title: string; description: string; icon: typeof BookOpen; features: string[] }> = [
    { audience: 'LEARNER', title: text('Independent learner', 'Mustaqil o‘quvchi', 'Самостоятельный ученик'), icon: BookOpen,
      description: text('A focused plan for your next score.', 'Keyingi natijangiz uchun shaxsiy tarif.', 'Личный план для нового результата.'),
      features: [text('IELTS & SAT practice', 'IELTS va SAT mashqlari', 'Практика IELTS и SAT'), text('Writing & Speaking AI feedback', 'Writing va Speaking AI tahlili', 'AI-анализ Writing и Speaking'), text('Podcast & shadowing library', 'Podcast va shadowing kutubxonasi', 'Библиотека подкастов и шэдоуинга')] },
    { audience: 'CENTER_STUDENT', title: text('Learning center student', 'Markaz o‘quvchisi', 'Ученик учебного центра'), icon: Users,
      description: text('Learn with your teacher, at a student rate.', 'O‘qituvchingiz bilan, o‘quvchi narxida.', 'Учитесь с преподавателем по тарифу ученика.'),
      features: [text('Everything in the learner plan', 'O‘quvchi tarifidagi imkoniyatlar', 'Возможности личного тарифа'), text('Class assignments & shared progress', 'Class vazifalari va umumiy natijalar', 'Задания класса и общий прогресс'), text('Requires active student membership', 'Classda faol o‘quvchi bo‘lish talab etiladi', 'Нужно активное участие в классе')] },
    { audience: 'TEACHER', title: text('Teacher Individual', 'O‘qituvchi Individual', 'Преподаватель Individual'), icon: GraduationCap,
      description: text('Your own teaching workspace.', 'O‘qitish uchun shaxsiy ish joyingiz.', 'Ваше личное пространство преподавателя.'),
      features: [text('Create classes & learning groups', 'Class va o‘quv guruhlarini yaratish', 'Создание классов и учебных групп'), text('Invite students & assign practice', 'O‘quvchilarni taklif qilish va vazifa berish', 'Приглашения и учебные задания'), text('Student results & class analytics', 'O‘quvchi natijalari va class tahlili', 'Результаты учеников и аналитика класса')] },
  ]
  return <div className="billing-plan-grid">{cards.map(card => {
    const product = products.find(p => p.audience === card.audience && p.months === months)
    if (!product) return null
    const amount = currency === 'USD' ? product.amountUsd : product.amountUzs
    const Icon = card.icon
    return <article key={card.audience} className={`billing-glass billing-plan ${card.audience === 'TEACHER' ? 'billing-plan-featured' : ''}`}>
      {card.audience === 'TEACHER' && <span className="billing-plan-ribbon">{text('CREATE YOUR CLASS', 'CLASSINGIZNI YARATING', 'СОЗДАЙТЕ СВОЙ КЛАСС')}</span>}
      <div className="billing-plan-top"><span className="billing-icon"><Icon size={24} /></span><span className="billing-plan-number">{card.audience === 'LEARNER' ? '01' : card.audience === 'CENTER_STUDENT' ? '02' : '03'}</span></div>
      <h3>{card.title}</h3><p className="billing-plan-description">{card.description}</p>
      <div className="billing-plan-price"><strong>{formatBillingMoney(Math.round(amount / months), currency)}</strong><span>{text('/ month', '/ oy', '/ месяц')}</span></div>
      <p className="billing-plan-total">{months === 1 ? text('One payment. No automatic renewal.', 'Bir martalik to‘lov. Avtomatik uzaytirish yo‘q.', 'Разовый платёж. Без автопродления.') : text(`${formatBillingMoney(amount, currency)} billed for ${months} months`, `${months} oy uchun jami ${formatBillingMoney(amount, currency)}`, `${formatBillingMoney(amount, currency)} за ${months} месяцев`)}</p>
      <div className="billing-plan-coins"><Coins size={20} /><strong>{product.coins.toLocaleString()}</strong><span>{text('coins for your plan', 'tarifingiz uchun tanga', 'монет на ваш план')}</span></div>
      <ul>{card.features.map(feature => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
      <p className="billing-plan-condition">{card.audience === 'TEACHER' ? text('Each student needs their own plan or coins.', 'Har bir o‘quvchiga o‘z tarifi yoki tangalari kerak.', 'Каждому ученику нужен свой тариф или монеты.') : text('Coins unlock paid practice. Class creation is in Teacher Individual.', 'Pullik mashqlar tangalar bilan ochiladi. Class yaratish — O‘qituvchi Individual tarifida.', 'Платная практика открывается монетами. Классы создаёт преподаватель Individual.')}</p>
      <button type="button" className={card.audience === 'TEACHER' ? 'billing-primary' : 'billing-secondary'} disabled={disabled} onClick={() => onChoose(product)}>{text('Choose plan', 'Tarifni tanlash', 'Выбрать тариф')}<ArrowUpRight size={17} /></button>
    </article>
  })}</div>
}
