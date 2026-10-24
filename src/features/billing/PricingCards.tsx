import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Check, Crown, Rocket, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountAccess } from './useAccountAccess'
import { BILLING_PRODUCTS, PLAN_QUOTAS, discountedAmount, type BillingCurrency, type BillingProduct, type PlanTier } from './catalog'
import { useBillingText } from './copy'
import './plans.css'

export function formatBillingMoney(amount: number, currency: BillingCurrency) {
  return currency === 'USD' ? `$${(amount / 100).toFixed(2).replace(/\.00$/, '')}` : `${amount.toLocaleString('en-US').replace(/,/g, ' ')} UZS`
}

type Text = ReturnType<typeof useBillingText>
const count = (value: number | null, text: Text) => value === null ? text('Unlimited', 'Cheksiz', 'Без лимита') : value.toLocaleString('en-US')

export function planHighlights(tier: PlanTier, text: Text) {
  const q = PLAN_QUOTAS[tier]
  if (tier === 'FREE') return [
    text(`${q.test} IELTS & SAT tests every month`, `Har oy ${q.test} ta IELTS va SAT test`, `${q.test} теста IELTS и SAT в месяц`),
    text(`${q.mock} full mock exam per month`, `Oyiga ${q.mock} ta to‘liq mock imtihon`, `${q.mock} полный пробный экзамен в месяц`),
    text(`${q.writing} Writing + ${q.speaking} Speaking AI checks`, `${q.writing} ta Writing + ${q.speaking} ta Speaking AI tahlili`, `${q.writing} проверки Writing + ${q.speaking} Speaking от AI`),
    text(`${q.ai} AI tutor messages`, `${q.ai} ta AI ustoz xabari`, `${q.ai} сообщений AI-наставнику`),
    text('Vocabulary, articles, podcasts and shadowing', 'Lug‘at, maqolalar, podcast va shadowing', 'Словарь, статьи, подкасты и шэдоуинг'),
  ]
  if (tier === 'PRO') return [
    text('Unlimited IELTS & SAT practice tests', 'Cheksiz IELTS va SAT mashq testlari', 'Безлимитные тесты IELTS и SAT'),
    text(`${q.mock} full mock exams per month`, `Oyiga ${q.mock} ta to‘liq mock imtihon`, `${q.mock} полных пробных экзамена в месяц`),
    text(`${q.writing} Writing + ${q.speaking} Speaking AI checks`, `${q.writing} ta Writing + ${q.speaking} ta Speaking AI tahlili`, `${q.writing} проверок Writing + ${q.speaking} Speaking от AI`),
    text(`${count(q.ai, text)} AI tutor messages · ${q.voice} voice sessions`, `${count(q.ai, text)} ta AI xabar · ${q.voice} ta ovozli dars`, `${count(q.ai, text)} сообщений AI · ${q.voice} голосовых занятий`),
    text('Join classes and complete assignments', 'Classlarga qo‘shilish va vazifalar', 'Участие в классах и задания'),
  ]
  return [
    text('Everything in Pro — with no mock limits', 'Pro’dagi hammasi — mock cheklovisiz', 'Всё из Pro — без лимита пробных экзаменов'),
    text('Unlimited full mock exams', 'Cheksiz to‘liq mock imtihonlar', 'Безлимитные полные пробные экзамены'),
    text(`${q.writing} Writing + ${q.speaking} Speaking AI checks`, `${q.writing} ta Writing + ${q.speaking} ta Speaking AI tahlili`, `${q.writing} проверок Writing + ${q.speaking} Speaking от AI`),
    text(`${count(q.ai, text)} AI tutor messages · ${q.voice} voice sessions`, `${count(q.ai, text)} ta AI xabar · ${q.voice} ta ovozli dars`, `${count(q.ai, text)} сообщений AI · ${q.voice} голосовых занятий`),
    text('Create classes and follow every student', 'Class yaratish va o‘quvchilarni kuzatish', 'Создание классов и контроль учеников'),
  ]
}

export default function PricingCards({ months, onChoose, disabled = false, products = BILLING_PRODUCTS, discountPercent = 0 }: {
  months: number; onChoose: (product: BillingProduct) => void; disabled?: boolean; products?: BillingProduct[]; discountPercent?: number
}) {
  const text = useBillingText()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const tier = access?.tier ?? 'FREE'
  const period = months === 1 ? text('/ month', '/ oy', '/ месяц') : months === 3 ? text('/ 3 months', '/ 3 oy', '/ 3 месяца') : text('/ year', '/ yil', '/ год')
  const paid = [
    { audience: 'PRO' as const, title: 'Pro', icon: Rocket, featured: true,
      description: text('Everything you need to prepare seriously.', 'Jiddiy tayyorgarlik uchun hamma narsa.', 'Всё для серьёзной подготовки.') },
    { audience: 'MAX' as const, title: 'Max', icon: Crown, featured: false,
      description: text('Unlimited mocks, more AI and your own classes.', 'Cheksiz mock, ko‘proq AI va o‘z classlaringiz.', 'Безлимитные экзамены, больше AI и свои классы.') },
  ]
  return <div className="billing-plan-grid billing-plan-grid-simple plans-grid">
    <article className={`billing-glass billing-plan billing-plan-free ${tier === 'FREE' && user ? 'is-current' : ''}`}>
      <div className="billing-plan-top"><span className="billing-icon"><Sparkles size={24} /></span><span className="billing-saving">{text('Free forever', 'Doimiy bepul', 'Навсегда бесплатно')}</span></div>
      <h3>Free</h3><p className="billing-plan-description">{text('Start practising today. No card, no time limit.', 'Bugunoq boshlang. Karta va muddat yo‘q.', 'Начните сегодня. Без карты и срока.')}</p>
      <div className="billing-plan-price"><strong>$0</strong><span>{text('/ forever', '/ doimiy', '/ навсегда')}</span></div>
      <p className="billing-plan-total">{text('Monthly allowance renews on the 1st.', 'Oylik imkoniyatlar har oyning 1-sanasida yangilanadi.', 'Лимиты обновляются 1-го числа.')}</p>
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
      const current = tier === card.audience
      return <article key={card.audience} className={`billing-glass billing-plan ${card.featured ? 'billing-plan-featured' : 'plans-card-max'} ${current ? 'is-current' : ''}`}>
        {card.featured && <span className="billing-plan-recommendation"><Sparkles size={13} aria-hidden="true" />{text('Most popular', 'Eng ko‘p tanlanadi', 'Самый популярный')}</span>}
        <div className="billing-plan-top"><span className="billing-icon"><Icon size={24} /></span>
          {discountPercent > 0 ? <span className="plans-discount-chip">−{discountPercent}% 🎡</span> : product.discount > 0 && <span className="billing-saving">{text(`Save ${product.discount}%`, `${product.discount}% tejang`, `Экономия ${product.discount}%`)}</span>}
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
