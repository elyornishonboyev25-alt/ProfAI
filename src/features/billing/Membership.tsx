import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronDown, Coins, CreditCard, Gift, Globe2, GraduationCap, Headphones, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import PricingCards, { formatBillingMoney } from './PricingCards'
import { BILLING_PRODUCTS, COIN_COSTS, WELCOME_COINS, type BillingCurrency, type BillingProduct } from './catalog'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import { activityLabel, orderStatusLabel, productLabel } from './labels'
import AccountAccessCard from './AccountAccessCard'
import './billing.css'
type Provider = { code: 'CLICK' | 'PAYME' | 'STRIPE'; currency: BillingCurrency; enabled: boolean }
type Catalog = { products: BillingProduct[]; providers: Provider[] }
export default function Membership() {
  const text = useBillingText()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuthStore(s => s.user)
  const { wallet: storedWallet, userId: walletUserId, refresh, error: walletError } = useBillingStore()
  const wallet = user?.id === walletUserId ? storedWallet : null
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [catalogError, setCatalogError] = useState('')
  const [currency, setCurrency] = useState<BillingCurrency>('UZS')
  const [months, setMonths] = useState(1)
  const [selected, setSelected] = useState<BillingProduct | null>(null)
  const [provider, setProvider] = useState<Provider['code']>('PAYME')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const checkoutRef = useRef<HTMLElement>(null)
  async function loadCatalog() {
    setCatalogError('')
    try { setCatalog(await apiClient.get<Catalog>('/billing/plans', { auth: false })) }
    catch (error) { setCatalogError(error instanceof Error ? error.message : 'Could not load plans.') }
  }
  useEffect(() => { void loadCatalog() }, [])
  useEffect(() => { void refresh() }, [user?.id, refresh])
  useEffect(() => {
    if (!params.get('order') || !user) return
    let count = 0
    const timer = window.setInterval(() => { void refresh(); if (++count >= 12) window.clearInterval(timer) }, 5000)
    return () => window.clearInterval(timer)
  }, [params, user?.id, refresh])
  const products = catalog?.products ?? BILLING_PRODUCTS
  const providers = catalog?.providers.filter(p => p.currency === currency) ?? []
  const openOrder = wallet?.orders.find(order => ['PENDING', 'SUBMITTED', 'PROCESSING'].includes(order.status))
  const returnedOrder = wallet?.orders.find(order => order.id === params.get('order'))
  const choose = (product: BillingProduct) => {
    if (!user) { navigate('/register', { state: { from: { pathname: '/premium' } } }); return }
    setSelected(product); setError('')
    setProvider(providers.find(p => p.enabled)?.code ?? (currency === 'USD' ? 'STRIPE' : 'PAYME'))
    window.setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 20)
  }
  async function pay() {
    if (!selected || busy) return
    setBusy(true); setError('')
    try {
      const result = await apiClient.post<{ id: string; url: string }>('/billing/checkout', { product: selected.code, currency, provider })
      await refresh(); window.location.assign(result.url)
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not open checkout.') }
    finally { setBusy(false) }
  }
  async function cancelOrder(id: string) {
    setBusy(true); setError('')
    try { await apiClient.delete(`/billing/requests/${encodeURIComponent(id)}`); await refresh() }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not cancel order.') }
    finally { setBusy(false) }
  }
  const freeFeatures = [text('Saved results & review', 'Saqlangan natijalar va tahlillar', 'Результаты и разбор'), text('Your vocabulary & flashcards', 'Lug‘atingiz va flashcard mashqlari', 'Ваш словарь и карточки'), text('Three free podcasts & shadowing lessons', 'Uchtadan bepul podcast va shadowing darsi', 'По три бесплатных подкаста и урока шэдоуинга'), text('Replay every unlocked lesson', 'Ochilgan darslarni qayta ishlatish', 'Повторы открытых уроков')]
  const costs = [
    { title: 'Reading · Listening · SAT', value: COIN_COSTS.test, note: text('Test access for 24 hours', 'Testdan 24 soat foydalanish', 'Доступ к тесту на 24 часа') },
    { title: 'Full mock', value: COIN_COSTS.mock, note: text('Includes one Writing & Speaking assessment', 'Bittadan Writing va Speaking tekshiruvi bilan', 'Включает по одной проверке Writing и Speaking') },
    { title: 'Writing AI', value: COIN_COSTS.writing, note: text('Per assessment', 'Har bir tekshiruv uchun', 'За каждую проверку') },
    { title: 'Speaking AI', value: COIN_COSTS.speaking, note: text('Per assessment', 'Har bir tekshiruv uchun', 'За каждую проверку') },
    { title: 'Shadowing · Podcast', value: COIN_COSTS.podcast, note: text('Unlock once, replay for free', 'Bir marta ochish, takrorlash bepul', 'Одно открытие, бесплатные повторы') },
    { title: 'AI Coach', value: COIN_COSTS.ai, note: text('Per text request', 'Har bir matnli so‘rov uchun', 'За текстовый запрос') },
    { title: 'AI Voice', value: COIN_COSTS.speaking, note: text('Per voice session', 'Har bir ovozli sessiya uchun', 'За голосовую сессию') },
  ]
  return <main className="workspace-page billing-page"><div className="billing-content">
    <div className="billing-page-nav"><Link to="/dashboard" className="billing-text-button"><ArrowLeft size={17} />{text('Dashboard', 'Bosh sahifa', 'Главная')}</Link><span><ShieldCheck size={15} />{text('Clear prices. Your choice.', 'Aniq narxlar. Tanlov sizniki.', 'Прозрачные цены. Ваш выбор.')}</span></div>
    <header className="billing-glass billing-hero"><div className="billing-hero-copy"><span className="billing-eyebrow"><Sparkles size={15} /> PROFAI MEMBERSHIP</span><h1>{text('Invest in your', 'Keyingi natijangiz', 'Инвестируйте в свой')}<br /><span>{text('next chapter.', 'uchun imkoniyatlar.', 'следующий шаг.')}</span></h1><p>{text('Start with 150 welcome coins. Choose a plan for yourself, your students or your classroom — and keep learning your way.', '150 sovg‘a tanga bilan boshlang. O‘zingiz, o‘quvchilaringiz yoki classingiz uchun mos tarifni tanlang va o‘z yo‘lingizda rivojlaning.', 'Начните со 150 приветственных монет. Выберите тариф для себя, учеников или своего класса и учитесь в своём ритме.')}</p><div className="billing-hero-chips"><span><Check size={14} /> IELTS & SAT</span><span><Coins size={14} />{text('One shared balance', 'Yagona tanga balansi', 'Единый баланс')}</span><span><ShieldCheck size={14} />{text('No auto-renewal', 'Avtomatik uzaytirish yo‘q', 'Без автопродления')}</span></div></div><div className="billing-coin-art" aria-hidden="true"><div className="billing-coin-orbit" /><div className="billing-coin-disc"><span>P</span><small>PROFAI</small></div><div className="billing-coin-caption"><Coins size={17} /><strong>{WELCOME_COINS}</strong><span>{text('welcome coins', 'sovg‘a tanga', 'приветственных монет')}</span></div></div></header>
    <AccountAccessCard />
    <section className="billing-account-row" aria-label={text('Your account', 'Akkauntingiz', 'Ваш аккаунт')}>
      <div className="billing-glass billing-balance"><span className="billing-icon"><Wallet size={22} /></span><div><small>{user ? text('Your balance', 'Balansingiz', 'Ваш баланс') : text('Your welcome gift', 'Boshlang‘ich sovg‘angiz', 'Ваш приветственный подарок')}</small><strong>{user ? wallet?.balance.toLocaleString() ?? '…' : WELCOME_COINS}<span>{text(' coins', ' tanga', ' монет')}</span></strong></div><a href="#coin-packs" className="billing-round-link" aria-label={text('Add coins', 'Tanga olish', 'Купить монеты')}><ArrowUpRight size={18} /></a></div>
      <div className="billing-glass billing-account-detail"><Gift size={23} /><div><strong>{text('Free stays useful.', 'Bepul imkoniyatlar doim bor.', 'Бесплатное остаётся полезным.')}</strong><p>{text('Your results, vocabulary and unlocked lessons stay open when your balance reaches zero.', 'Balans tugasa ham natijalar, lug‘at va ochilgan darslar saqlanadi.', 'Результаты, словарь и открытые уроки доступны даже при нулевом балансе.')}</p></div></div>
    </section>
    {walletError && <div className="billing-error" role="alert">{walletError}<button onClick={() => void refresh()}>{text('Retry', 'Qayta urinish', 'Повторить')}</button></div>}
    {returnedOrder && <div className={`billing-status ${returnedOrder.status === 'APPROVED' ? 'is-success' : ''}`} role="status"><CheckCircle2 size={20} />{returnedOrder.status === 'APPROVED' ? text('Payment confirmed. Your coins and plan are ready.', 'To‘lov tasdiqlandi. Tangalar va tarifingiz tayyor.', 'Платёж подтверждён. Монеты и тариф активны.') : text('Waiting for confirmation from your payment provider. Returning here does not confirm a payment.', 'To‘lov xizmatining tasdig‘i kutilmoqda. Bu sahifaga qaytish to‘lov tasdiqlanganini anglatmaydi.', 'Ожидаем подтверждение сервиса. Возврат на страницу не подтверждает оплату.')}</div>}
    {!!wallet?.subscriptions.length && <div className="billing-active-plans">{wallet.subscriptions.map(plan => <span key={plan.audience}><CheckCircle2 size={15} />{plan.audience === 'TEACHER' ? text('Teacher plan', 'O‘qituvchi tarifi', 'Тариф преподавателя') : plan.audience === 'CENTER_STUDENT' ? text('Center student', 'Markaz o‘quvchisi', 'Ученик центра') : text('Learner plan', 'O‘quvchi tarifi', 'Тариф ученика')} · {new Date(plan.expiresAt).toLocaleDateString()}</span>)}</div>}
    {wallet?.legacyAccess && <p className="billing-status">{text('Your existing Premium access remains active until its original expiry.', 'Mavjud Premium huquqingiz oldingi muddati tugaguncha saqlanadi.', 'Ваш прежний Premium сохраняется до окончания срока.')}</p>}
    <section aria-labelledby="billing-plans-title"><div className="billing-section-heading"><div><span className="billing-eyebrow">01 / {text('MEMBERSHIP', 'TARIFLAR', 'ТАРИФЫ')}</span><h2 id="billing-plans-title">{text('A plan for your ambition.', 'Maqsadingizga mos tarif.', 'Тариф для вашей цели.')}</h2></div><div className="billing-segment" role="group" aria-label={text('Payment currency', 'To‘lov valyutasi', 'Валюта оплаты')}>{(['UZS', 'USD'] as const).map(value => <button key={value} aria-pressed={currency === value} onClick={() => { setCurrency(value); setSelected(null) }}>{value === 'UZS' ? text('So‘m', 'So‘m', 'Сум') : 'USD $'}</button>)}</div></div>
      <div className="billing-period-row"><div className="billing-segment" role="group" aria-label={text('Plan duration', 'Tarif muddati', 'Срок тарифа')}>{[1, 3, 12].map(value => <button key={value} aria-pressed={months === value} onClick={() => { setMonths(value); setSelected(null) }}>{value === 1 ? text('Monthly', 'Oylik', 'Месяц') : value === 3 ? text('Quarterly', 'Choraklik', 'Квартал') : text('Yearly', 'Yillik', 'Год')}{value > 1 && <span>−{value === 3 ? 10 : 20}%</span>}</button>)}</div><p>{text('Plan coins arrive together after payment and do not expire.', 'Tarif tangalari to‘lovdan keyin birga beriladi va muddati tugamaydi.', 'Монеты начисляются сразу после оплаты и не сгорают.')}</p></div>
      {catalogError && <div role="alert" className="billing-error">{catalogError}<button onClick={() => void loadCatalog()}>{text('Reload plans', 'Tariflarni qayta yuklash', 'Обновить тарифы')}</button></div>}
      <PricingCards products={products} months={months} currency={currency} onChoose={choose} disabled={busy || !catalog} />
      <p className="billing-plan-footnote"><GraduationCap size={16} />{text('The center price is per student. Every teacher who creates classes needs their own Teacher Individual plan.', 'Markaz narxi har bir o‘quvchi uchun. Class yaratadigan har bir o‘qituvchiga o‘z O‘qituvchi Individual tarifi kerak.', 'Цена центра — за каждого ученика. Преподавателю нужен личный тариф Teacher Individual.')}</p>
    </section>
    {selected && <section ref={checkoutRef} className="billing-glass billing-checkout" aria-labelledby="checkout-title"><div className="billing-section-heading"><div><span className="billing-eyebrow"><CreditCard size={15} /> CHECKOUT</span><h2 id="checkout-title">{text('Review your purchase', 'Xaridingizni tekshiring', 'Проверьте покупку')}</h2></div><button className="billing-round-link" aria-label={text('Close checkout', 'To‘lov oynasini yopish', 'Закрыть оплату')} onClick={() => setSelected(null)}><X size={18} /></button></div><div className="billing-checkout-grid"><div><div className="billing-checkout-summary"><Coins size={25} /><div><strong>{selected.coins.toLocaleString()} {text('coins', 'tanga', 'монет')}</strong><span>{selected.months ? text(`${selected.months} months · ${selected.audience === 'TEACHER' ? 'Class creation included' : 'Learning plan'}`, `${selected.months} oy · ${selected.audience === 'TEACHER' ? 'Class yaratish huquqi bilan' : 'O‘quv tarifi'}`, `${selected.months} мес. · ${selected.audience === 'TEACHER' ? 'Создание классов' : 'Учебный тариф'}`) : text('Coin top-up · no expiry', 'Tanga paketi · muddatsiz', 'Пополнение монет · без срока')}</span></div><strong>{formatBillingMoney(currency === 'USD' ? selected.amountUsd : selected.amountUzs, currency)}</strong></div><p>{text('One payment for the full period. No auto-renewal. USD and UZS have separate fixed prices.', 'Butun muddat uchun bir martalik to‘lov. Avtomatik uzaytirish yo‘q. USD va UZS narxlari alohida.', 'Разовый платёж за весь срок. Без автопродления. Цены USD и UZS фиксируются отдельно.')}</p></div><div><label className="billing-provider-label">{text('Payment method', 'To‘lov usuli', 'Способ оплаты')}<select value={provider} onChange={event => setProvider(event.target.value as Provider['code'])}>{providers.map(item => <option key={item.code} value={item.code}>{item.code === 'STRIPE' ? text('International card', 'Xalqaro karta', 'Международная карта') : item.code}{!item.enabled ? ` · ${text('Coming soon', 'Tez orada', 'Скоро')}` : ''}</option>)}</select></label>
      {selected.audience === 'CENTER_STUDENT' && !wallet?.centerEligible && <p className="billing-error">{text('Join your teacher’s class before choosing the center rate.', 'Markaz tarifini olishdan oldin o‘qituvchingiz classiga qo‘shiling.', 'Сначала вступите в класс преподавателя.')}<Link to="/learning-center">{text('Open classes', 'Classlarga o‘tish', 'Открыть классы')}</Link></p>}
      {!providers.some(p => p.code === provider && p.enabled) && <p className="billing-provider-notice">{text('Online payments are being connected. Your free coins and existing access are available now.', 'Onlayn to‘lovlar ulanmoqda. Bepul tangalar va mavjud huquqlaringizdan hozir foydalanishingiz mumkin.', 'Онлайн-оплата подключается. Бесплатные монеты и текущий доступ уже доступны.')}</p>}
      <button type="button" className="billing-primary" disabled={busy || Boolean(openOrder) || !providers.some(p => p.code === provider && p.enabled) || (selected.audience === 'CENTER_STUDENT' && !wallet?.centerEligible)} onClick={() => void pay()}>{busy ? text('Opening checkout…', 'To‘lov ochilmoqda…', 'Открываем оплату…') : text('Continue to payment', 'To‘lovga o‘tish', 'Перейти к оплате')}<ArrowRight size={17} /></button></div></div></section>}
    {openOrder && <section className="billing-glass billing-open-order"><CreditCard size={23} /><div><strong>{text('Your open order', 'Ochiq buyurtmangiz', 'Ваш текущий заказ')}</strong><p>{productLabel(openOrder.plan, text)} · {formatBillingMoney(openOrder.currency === 'UZS' ? openOrder.amountMinor / 100 : openOrder.amountMinor, openOrder.currency)}</p><small>{openOrder.id}</small></div>{openOrder.checkoutUrl && <a className="billing-secondary" href={openOrder.checkoutUrl}>{text('Continue payment', 'To‘lovni davom ettirish', 'Продолжить оплату')}<ArrowRight size={16} /></a>}{openOrder.status !== 'PROCESSING' && <button type="button" className="billing-text-button" disabled={busy} onClick={() => void cancelOrder(openOrder.id)}>{text('Cancel order', 'Buyurtmani bekor qilish', 'Отменить заказ')}</button>}<button className="billing-text-button" onClick={() => void refresh()}>{text('Refresh status', 'Holatni yangilash', 'Обновить статус')}</button></section>}
    {error && <div role="alert" className="billing-error">{error}</div>}
    <section id="coin-packs"><div className="billing-section-heading"><div><span className="billing-eyebrow">02 / PROFAI COINS</span><h2>{text('Just need more practice?', 'Yana mashq qilmoqchimisiz?', 'Нужно больше практики?')}</h2><p>{text('Top up anytime. Coin packs do not include class creation.', 'Istalgan payt balansni to‘ldiring. Tanga paketlari class yaratish huquqini bermaydi.', 'Пополняйте баланс. Пакеты монет не дают права создавать классы.')}</p></div></div><div className="billing-topup-grid">{products.filter(p => p.audience === 'TOPUP').map(product => <article key={product.code} className="billing-glass billing-topup"><span className="billing-icon"><Coins size={22} /></span><div><strong>{product.coins}</strong><span>{text('coins', 'tanga', 'монет')}</span></div><p>{formatBillingMoney(currency === 'USD' ? product.amountUsd : product.amountUzs, currency)}</p><button className="billing-secondary" disabled={!catalog || busy} onClick={() => choose(product)}>{text('Add coins', 'Tangalarni olish', 'Купить монеты')}<ArrowRight size={15} /></button></article>)}</div></section>
    <section className="billing-info-grid"><div className="billing-glass billing-info-panel"><span className="billing-eyebrow">03 / {text('COIN GUIDE', 'TANGA QOIDALARI', 'ПРАВИЛА МОНЕТ')}</span><h2>{text('Know what you spend.', 'Sarfingizni oldindan biling.', 'Знайте стоимость заранее.')}</h2><div className="billing-cost-list">{costs.map(cost => <div key={cost.title}><span><strong>{cost.title}</strong><small>{cost.note}</small></span><b>{cost.value}<Coins size={14} /></b></div>)}</div><p>{text('Failed AI requests are refunded. A full mock includes 24-hour access and one assessment for Writing and Speaking.', 'Bajarilmagan AI so‘rovlarining tangalari qaytariladi. To‘liq mock: 24 soat foydalanish va bittadan Writing hamda Speaking tekshiruvi.', 'Неудачные AI-запросы возвращают монеты. Полный mock включает 24 часа доступа и по одной проверке Writing и Speaking.')}</p></div><div className="billing-glass billing-info-panel"><span className="billing-eyebrow"><Headphones size={15} /> {text('ALWAYS AVAILABLE', 'DOIM OCHIQ', 'ВСЕГДА ДОСТУПНО')}</span><h2>{text('Keep your momentum.', 'O‘rganishni davom ettiring.', 'Продолжайте двигаться.')}</h2><ul className="billing-free-list">{freeFeatures.map(feature => <li key={feature}><CheckCircle2 size={18} />{feature}</li>)}</ul><Link to="/academic-skills" className="billing-secondary">{text('Explore free learning', 'Bepul o‘rganishni boshlash', 'Бесплатные занятия')}<ArrowRight size={16} /></Link><div className="billing-center-example"><GraduationCap size={22} /><p>{text('10 students: 1 teacher × 69,999 + 10 students × 39,999 = 469,989 UZS/month.', '10 o‘quvchi: 1 o‘qituvchi × 69 999 + 10 o‘quvchi × 39 999 = oyiga 469 989 so‘m.', '10 учеников: 1 преподаватель × 69 999 + 10 учеников × 39 999 = 469 989 UZS/мес.')}</p></div></div></section>
    {wallet && <section className="billing-glass billing-history"><details><summary><Wallet size={19} />{text('Balance activity & payment history', 'Balans harakatlari va to‘lovlar tarixi', 'История баланса и платежей')}<ChevronDown size={17} /></summary><div className="billing-history-grid"><div><h3>{text('Coin activity', 'Tanga harakatlari', 'Движение монет')}</h3>{wallet.entries.map(entry => <div className="billing-history-row" key={entry.id}><span><strong>{activityLabel(entry.reason, text)}</strong><small>{new Date(entry.createdAt).toLocaleString()}</small></span><b className={entry.amount > 0 ? 'is-positive' : ''}>{entry.amount > 0 ? '+' : ''}{entry.amount}</b></div>)}</div><div><h3>{text('Payment history', 'To‘lovlar tarixi', 'История платежей')}</h3>{wallet.orders.length ? wallet.orders.map(order => <div className="billing-history-row" key={order.id}><span><strong>{productLabel(order.plan, text)}</strong><small>{order.method === 'STRIPE' ? text('International card', 'Xalqaro karta', 'Международная карта') : order.method} · {orderStatusLabel(order.status, text)}</small></span><b>{formatBillingMoney(order.currency === 'UZS' ? order.amountMinor / 100 : order.amountMinor, order.currency)}</b></div>) : <p>{text('Your payments will appear here.', 'To‘lovlaringiz shu yerda ko‘rinadi.', 'Здесь появятся ваши платежи.')}</p>}</div></div></details></section>}
    <footer className="billing-footer"><Globe2 size={17} />{text('UZS through Click / Payme · USD through international card checkout', 'UZS — Click / Payme · USD — xalqaro karta orqali', 'UZS через Click / Payme · USD через международную карту')}<span>ProfAI</span></footer>
  </div></main>
}
