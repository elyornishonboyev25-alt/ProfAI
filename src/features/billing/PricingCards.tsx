import UiText from '@/components/common/UiText'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Check, Crown, Rocket, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountAccess } from './useAccountAccess'
import { BILLING_PRODUCTS, discountedAmount, type BillingCurrency, type BillingProduct, type PlanTier } from './catalog'
import { useBillingText } from './copy'
import './plans.css'

export function formatBillingMoney(amount: number, currency: BillingCurrency) {
  return currency === 'USD' ? `$${(amount / 100).toFixed(2).replace(/\.00$/, '')}` : `${amount.toLocaleString('en-US').replace(/,/g, ' ')} UZS`
}

type Text = ReturnType<typeof useBillingText>

export function planHighlights(tier: PlanTier, text: Text) {
  if (tier === 'FREE') return [
    text('First 5 tests in each IELTS skill', 'Har bir IELTS skillida dastlabki 5 ta test', 'Первые 5 тестов каждого навыка IELTS'),
    text('First 5 IELTS + 5 SAT full mocks', 'Dastlabki 5 ta IELTS + 5 ta SAT full mock', 'Первые 5 полных IELTS + 5 SAT'),
    text('Vocabulary for your free tests', 'Bepul testlaringizning lug‘atlari', 'Словари бесплатных тестов'),
    text('AI tutor with a monthly balance', 'Oylik balansli AI ustoz', 'AI-наставник с месячным балансом'),
  ]
  return [
    text('Every IELTS & SAT test and full mock', 'Barcha IELTS va SAT test va full mocklar', 'Все тесты и полные экзамены IELTS и SAT'),
    text('Vocabulary for every test', 'Har bir testning lug‘ati', 'Словарь каждого теста'),
    tier === 'PRO' ? text('6× more AI chat capacity', 'AI suhbat uchun 6× ko‘proq imkoniyat', 'В 6× больше общения с AI') : text('30× more AI chat capacity', 'AI suhbat uchun 30× ko‘proq imkoniyat', 'В 30× больше общения с AI'),
    tier === 'PRO' ? text('Live AI tutor · 1 hour a day', 'Live AI ustoz · kuniga 1 soat', 'Голосовой AI · 1 час в день') : text('Live AI tutor · 4 hours a day', 'Live AI ustoz · kuniga 4 soat', 'Голосовой AI · 4 часа в день'),
    tier === 'PRO' ? text('Join classes and complete assignments', 'Classlarga qo‘shilish va vazifalar', 'Участие в классах и задания') : text('Create classes and follow every student', 'Class yaratish va o‘quvchilarni kuzatish', 'Создание классов и контроль учеников'),
  ]
}

export default function PricingCards({ months, onChoose, disabled = false, products = BILLING_PRODUCTS, discountPercent = 0 }: {
  months: number; onChoose: (product: BillingProduct) => void; disabled?: boolean; products?: BillingProduct[]; discountPercent?: number
}) {
  const text = useBillingText()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const tier = access?.active ? access.tier : 'FREE'
  const period = months === 1 ? text('/ month', '/ oy', '/ месяц') : months === 3 ? text('/ 3 months', '/ 3 oy', '/ 3 месяца') : text('/ year', '/ yil', '/ год')
  const paid = [
    { audience: 'PRO' as const, title: 'IvyGoo Pro', icon: Rocket, featured: true,
      description: text('Everything you need to prepare seriously.', 'Jiddiy tayyorgarlik uchun hamma narsa.', 'Всё для серьёзной подготовки.') },
    { audience: 'MAX' as const, title: 'IvyGoo Elite', icon: Crown, featured: false,
      description: text('Unlimited mocks, more AI and your own classes.', 'Cheksiz mock, ko‘proq AI va o‘z classlaringiz.', 'Безлимитные экзамены, больше AI и свои классы.') },
  ]
  return <div className="billing-plan-grid billing-plan-grid-simple plans-grid">
    <article className={`billing-glass billing-plan billing-plan-free ${tier === 'FREE' && user ? 'is-current' : ''}`}>
      <div className="billing-plan-top"><span className="billing-icon"><Sparkles size={24} /></span><span className="billing-saving">{text('Free forever', 'Doimiy bepul', 'Навсегда бесплатно')}</span></div>
      <h3><UiText text={"Free"} /></h3><p className="billing-plan-description">{text('Start practising today. No card, no time limit.', 'Bugunoq boshlang. Karta va muddat yo‘q.', 'Начните сегодня. Без карты и срока.')}</p>
      <div className="billing-plan-price"><strong>$0</strong><span>{text('/ forever', '/ doimiy', '/ навсегда')}</span></div>
      <p className="billing-plan-total">{text('Your free tests stay open.', 'Bepul testlaringiz doim ochiq.', 'Бесплатные тесты остаются доступными.')}</p>
      <ul>{planHighlights('FREE', text).map(item => <li key={item}><Check size={16} />{item}</li>)}</ul>
      <button type="button" className="billing-secondary" onClick={() => navigate(user ? '/ielts' : '/register')}>
        {!user ? text('Start for free', 'Bepul boshlash', 'Начать бесплатно') : tier === 'FREE' ? text('Your current plan', 'Joriy tarifingiz', 'Ваш текущий тариф') : text('Continue learning', 'O‘qishni davom ettirish', 'Продолжить обучение')}
      </button>
    </article>
    {paid.map(card => {
      const product = products.find(p => p.audience === card.audience && p.months === months)
      if (!product) return null
      const Icon = card.icon
      const price = discountedAmount(product.amountUsd, discountPercent)
      const saving = Math.round(product.discount)
      const current = tier === card.audience
      return <article key={card.audience} className={`billing-glass billing-plan ${card.featured ? 'billing-plan-featured' : 'plans-card-max'} ${current ? 'is-current' : ''}`}>
        {card.featured && <span className="billing-plan-recommendation"><Sparkles size={13} aria-hidden="true" />{text('Most popular', 'Eng ko‘p tanlanadi', 'Самый популярный')}</span>}
        <div className="billing-plan-top"><span className="billing-icon"><Icon size={24} /></span>
          {discountPercent > 0 ? <span className="plans-discount-chip">−{discountPercent}% 🎡</span> : saving > 0 && <span className="billing-saving">{text(`Save ${saving}%`, `${saving}% tejang`, `Экономия ${saving}%`)}</span>}
        </div>
        <h3>{card.title}</h3><p className="billing-plan-description">{card.description}</p>
        <div className="billing-plan-price">
          {discountPercent > 0 && <s className="plans-old-price">{formatBillingMoney(product.amountUsd, 'USD')}</s>}
          <strong>{formatBillingMoney(price, 'USD')}</strong><span>{period}</span>
        </div>
        <p className="billing-plan-total">{months === 1 ? text('One payment. No auto-renewal.', 'Bir martalik to‘lov. Avtomatik uzaytirilmaydi.', 'Разовый платёж. Без автопродления.') : text(`${formatBillingMoney(Math.round(price / months), 'USD')}/month equivalent`, `Oyiga ${formatBillingMoney(Math.round(price / months), 'USD')} ga teng`, `${formatBillingMoney(Math.round(price / months), 'USD')}/мес. в пересчёте`)}</p>
        <ul>{planHighlights(card.audience, text).map(item => <li key={item}><Check size={16} />{item}</li>)}</ul>
        <button type="button" className={card.featured ? 'billing-primary' : 'billing-secondary plans-max-button'} disabled={disabled} onClick={() => onChoose(product)}>
          {current ? text(`Extend ${card.title}`, `${card.title}ni uzaytirish`, `Продлить ${card.title}`) : text(`Choose ${card.title}`, `${card.title}ni tanlash`, `Выбрать ${card.title}`)}<ArrowUpRight size={17} />
        </button>
      </article>
    })}
  </div>
}
