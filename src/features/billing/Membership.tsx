import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Coins, CreditCard, Gift, ShieldCheck, Wallet, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import PricingCards, { formatBillingMoney } from './PricingCards'
import PlanDuration from './PlanDuration'
import { BILLING_PRODUCTS, COIN_COSTS, LISTENING_TEST_COST, WELCOME_COINS, PRACTICE_ACCESS_DAYS, type BillingProduct } from './catalog'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import { activityLabel, orderStatusLabel, productLabel } from './labels'
import { useAccountAccess } from './useAccountAccess'
import './billing.css'

type Provider = { code: 'CLICK' | 'PAYME' | 'STRIPE'; currency: 'UZS' | 'USD'; enabled: boolean }
type Catalog = { products: BillingProduct[]; providers: Provider[] }
type Quote = { product: string; amountUsd: number; amountUzs: number; rate: number; date: string; expiresAt: number; token: string }

export default function Membership() {
  const text = useBillingText()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuthStore(s => s.user)
  const { wallet: storedWallet, userId: walletUserId, refresh, error: walletError } = useBillingStore()
  const wallet = user?.id === walletUserId ? storedWallet : null
  const access = useAccountAccess()
  const fullAccess = access?.active && access.kind !== 'COINS'
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [catalogError, setCatalogError] = useState('')
  const [months, setMonths] = useState(1)
  const [selected, setSelected] = useState<BillingProduct | null>(null)
  const [provider, setProvider] = useState<Provider['code']>('PAYME')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteError, setQuoteError] = useState(false)
  const [quoteVersion, setQuoteVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const checkoutRef = useRef<HTMLElement>(null)
  const currency = provider === 'STRIPE' ? 'USD' : 'UZS'
  const products = catalog?.products ?? BILLING_PRODUCTS
  const providers = catalog?.providers ?? []
  const providerReady = providers.some(p => p.code === provider && p.enabled)
  const quoteReady = currency === 'USD' || (quote?.product === selected?.code && quote !== null && quote.expiresAt > Date.now())
  const openOrder = wallet?.orders.find(order => ['PENDING', 'SUBMITTED', 'PROCESSING'].includes(order.status))
  const returnedOrder = wallet?.orders.find(order => order.id === params.get('order'))

  async function loadCatalog() {
    setCatalogError('')
    try { setCatalog(await apiClient.get<Catalog>('/billing/plans', { auth: false })) }
    catch (error) { setCatalogError(error instanceof Error ? error.message : 'Could not load plans.') }
  }
  useEffect(() => { void loadCatalog() }, [])
  useEffect(() => {
    if (!params.get('order') || !user) return
    let count = 0
    const timer = window.setInterval(() => { void refresh(); if (++count >= 12) window.clearInterval(timer) }, 5000)
    return () => window.clearInterval(timer)
  }, [params, user?.id, refresh])
  useEffect(() => {
    setQuote(null); setQuoteError(false)
    if (!selected || !user || currency !== 'UZS') return
    let alive = true
    let timer: number | undefined
    void apiClient.get<Quote>(`/billing/quote?product=${encodeURIComponent(selected.code)}`).then(value => {
      if (!alive) return
      setQuote(value)
      timer = window.setTimeout(() => { setQuote(null); setQuoteVersion(v => v + 1) }, Math.max(0, value.expiresAt - Date.now()))
    }).catch(() => { if (alive) setQuoteError(true) })
    return () => { alive = false; window.clearTimeout(timer) }
  }, [selected?.code, currency, quoteVersion, user?.id])

  function choose(product: BillingProduct) {
    if (!user) { navigate('/register', { state: { from: { pathname: '/premium' } } }); return }
    setQuote(null); setQuoteError(false); setSelected(product); setError('')
    setProvider(providers.find(p => p.enabled && p.currency === 'UZS')?.code ?? providers.find(p => p.enabled)?.code ?? 'PAYME')
    setQuoteVersion(v => v + 1)
    window.setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 20)
  }
  async function pay() {
    if (!selected || busy || !quoteReady || !providerReady) return
    setBusy(true); setError('')
    try {
      const result = await apiClient.post<{ id: string; url: string }>('/billing/checkout', { product: selected.code, currency, provider, quote: currency === 'UZS' ? quote?.token : undefined })
      await refresh(); window.location.assign(result.url)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not open checkout.')
      if (currency === 'UZS') { setQuote(null); setQuoteVersion(v => v + 1) }
    } finally { setBusy(false) }
  }
  async function cancelOrder(id: string) {
    setBusy(true); setError('')
    try { await apiClient.delete(`/billing/requests/${encodeURIComponent(id)}`); await refresh() }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not cancel order.') }
    finally { setBusy(false) }
  }
  const costs = [
    { title: 'Reading · SAT', value: COIN_COSTS.test, note: text(`${PRACTICE_ACCESS_DAYS} days of access; reopening is free`, `${PRACTICE_ACCESS_DAYS} kun foydalanish; qayta ochish bepul`, `${PRACTICE_ACCESS_DAYS} дней доступа; повторное открытие бесплатно`) },
    { title: 'Listening', value: LISTENING_TEST_COST, note: text(`${PRACTICE_ACCESS_DAYS} days of access; reopening is free`, `${PRACTICE_ACCESS_DAYS} kun foydalanish; qayta ochish bepul`, `${PRACTICE_ACCESS_DAYS} дней доступа; повторное открытие бесплатно`) },
    { title: text('Full mock', 'To‘liq mock', 'Полный mock'), value: COIN_COSTS.mock, note: text('7 days + both Writing tasks and one Speaking assessment', '7 kun + ikkala Writing vazifasi va bitta Speaking tekshiruvi', '7 дней + обе задачи Writing и одна проверка Speaking') },
    { title: 'Writing AI · Speaking AI', value: COIN_COSTS.writing, note: text('Per assessment', 'Har bir tekshiruv uchun', 'За каждую проверку') },
    { title: 'Shadowing · Podcast', value: COIN_COSTS.podcast, note: text('Pay once; unlimited free replays', 'Bir marta ochiladi; takrorlash doim bepul', 'Одна оплата; повторы всегда бесплатны') },
    { title: 'AI Coach', value: COIN_COSTS.ai, note: text('Per text request', 'Har bir matnli so‘rov uchun', 'За текстовый запрос') },
    { title: 'AI Voice', value: COIN_COSTS.voice, note: text('Per voice session', 'Har bir ovozli sessiya uchun', 'За голосовую сессию') },
  ]

  return <main className="workspace-page billing-page billing-simple-page"><div className="billing-content">
    <div className="billing-page-nav"><Link to="/dashboard" className="billing-text-button"><ArrowLeft size={17} />{text('Dashboard', 'Bosh sahifa', 'Главная')}</Link><span><ShieldCheck size={15} />{text('No auto-renewal', 'Avtomatik uzaytirilmaydi', 'Без автопродления')}</span></div>
    <header className="billing-simple-header"><span className="billing-eyebrow">PROFAI PLANS</span>
      <h1>{text('More practice. Clear prices.', 'Ko‘proq mashq. Aniq narxlar.', 'Больше практики. Понятные цены.')}</h1>
      <p>{text('Choose your plan. All prices are in USD; your local payment amount appears at checkout.', 'Mos tarifni tanlang. Narxlar dollarda; so‘mdagi to‘lov summasi faqat to‘lov bo‘limida ko‘rinadi.', 'Выберите тариф. Цены в USD; сумма местной оплаты появится при оформлении.')}</p>
    </header>
    {!fullAccess && <div className="billing-glass billing-simple-balance"><Gift size={22} /><div><strong>{user ? text('Your balance', 'Balansingiz', 'Ваш баланс') : text('Start free', 'Bepul boshlang', 'Начните бесплатно')}: {user ? wallet?.balance.toLocaleString('en-US') ?? '…' : WELCOME_COINS} {text('coins', 'tanga', 'монет')}</strong><p>{text(`${WELCOME_COINS} welcome coins cover ${WELCOME_COINS / COIN_COSTS.test} practice tests or ${WELCOME_COINS / COIN_COSTS.mock} full mocks.`, `${WELCOME_COINS} sovg‘a tanga ${WELCOME_COINS / COIN_COSTS.test} ta test yoki ${WELCOME_COINS / COIN_COSTS.mock} ta to‘liq mockka yetadi.`, `${WELCOME_COINS} приветственных монет хватит на ${WELCOME_COINS / COIN_COSTS.test} тестов или ${WELCOME_COINS / COIN_COSTS.mock} полных mock.`)}</p></div><a href="#coin-packs" className="billing-text-button">{text('Add coins', 'Tanga olish', 'Купить монеты')}<ArrowRight size={15} /></a></div>}
    {walletError && <div className="billing-error" role="alert">{walletError}<button onClick={() => void refresh()}>{text('Retry', 'Qayta urinish', 'Повторить')}</button></div>}
    {returnedOrder && <div className={`billing-status ${returnedOrder.status === 'APPROVED' ? 'is-success' : ''}`} role="status"><CheckCircle2 size={20} />{returnedOrder.status === 'APPROVED' ? text('Payment confirmed. Your plan and coins are ready.', 'To‘lov tasdiqlandi. Tarif va tangalaringiz tayyor.', 'Оплата подтверждена. Тариф и монеты готовы.') : text('Payment status', 'To‘lov holati', 'Статус оплаты') + ': ' + orderStatusLabel(returnedOrder.status, text)}<button className="billing-text-button" onClick={() => void refresh()}>{text('Refresh', 'Yangilash', 'Обновить')}</button></div>}
    {!!wallet?.subscriptions.length && <div className="billing-active-plans">{wallet.subscriptions.map(plan => <span key={plan.audience}><CheckCircle2 size={15} />{productLabel(plan.plan, text)} · {text('until', 'gacha', 'до')} {new Date(plan.expiresAt).toLocaleDateString()}</span>)}</div>}

    <section aria-labelledby="billing-plans-title">
      <div className="billing-section-heading"><h2 id="billing-plans-title">{text('Choose a plan', 'Tarifni tanlang', 'Выберите тариф')}</h2><PlanDuration months={months} onChange={value => { setMonths(value); setSelected(null) }} /></div>
      {catalogError && <div role="alert" className="billing-error">{catalogError}<button onClick={() => void loadCatalog()}>{text('Reload plans', 'Qayta yuklash', 'Обновить тарифы')}</button></div>}
      <PricingCards products={products} months={months} onChoose={choose} disabled={busy || !catalog} />
      <p className="billing-plan-footnote">{text('Coins arrive together after payment and never expire. Paid practice uses coins. Teacher enables class creation for the plan duration.', 'Tangalar to‘lovdan keyin birdan beriladi va muddatsiz saqlanadi. Pullik mashqlar tangalardan foydalanadi. Class yaratish Teacher tarifi muddati davomida ochiq.', 'Монеты начисляются сразу и не сгорают. Платная практика расходует монеты. Teacher разрешает создавать классы на весь срок тарифа.')}</p>
    </section>

    <section id="coin-packs" aria-labelledby="coin-packs-title"><div className="billing-section-heading"><div><h2 id="coin-packs-title">{text('Just need more practice?', 'Yana mashq qilmoqchimisiz?', 'Нужно больше практики?')}</h2><p>{text('Buy coins without a subscription. No expiry. Class creation is not included.', 'Tarifsiz ham tanga olish mumkin. Tangalar muddatsiz. Class yaratish huquqi kirmaydi.', 'Покупайте монеты без подписки. Не сгорают. Создание классов не включено.')}</p></div></div>
      <div className="billing-topup-grid">{products.filter(p => p.audience === 'TOPUP').map(product => <article key={product.code} className="billing-glass billing-topup"><span className="billing-icon"><Coins size={22} /></span><div><strong>{product.coins}</strong><span>{text('coins', 'tanga', 'монет')}</span></div><p>{formatBillingMoney(product.amountUsd, 'USD')}</p><button className="billing-secondary" disabled={!catalog || busy} onClick={() => choose(product)}>{text('Add coins', 'Tanga olish', 'Купить монеты')}<ArrowRight size={15} /></button></article>)}</div>
    </section>

    {selected && <section ref={checkoutRef} className="billing-glass billing-checkout" aria-labelledby="checkout-title">
      <div className="billing-section-heading"><div><span className="billing-eyebrow"><CreditCard size={15} />{text('PAYMENT', 'TO‘LOV', 'ОПЛАТА')}</span><h2 id="checkout-title">{text('Review your purchase', 'To‘lovni tekshiring', 'Проверьте покупку')}</h2></div><button type="button" className="billing-round-link" aria-label={text('Close checkout', 'To‘lov oynasini yopish', 'Закрыть оплату')} onClick={() => setSelected(null)}><X size={18} /></button></div>
      <div className="billing-checkout-grid"><div>
        <div className="billing-checkout-summary"><Coins size={24} /><div><strong>{productLabel(selected.code, text)}</strong><span>{selected.coins.toLocaleString('en-US')} {text('coins included', 'tanga beriladi', 'монет включено')}</span></div><strong>{formatBillingMoney(selected.amountUsd, 'USD')}</strong></div>
        <p>{selected.months ? text('One payment for the full period. No automatic charges.', 'Butun muddat uchun bir martalik to‘lov. Avtomatik pul yechilmaydi.', 'Один платёж за весь срок. Без автоматических списаний.') : text('One payment. Your coins never expire.', 'Bir martalik to‘lov. Tangalar muddatsiz saqlanadi.', 'Разовый платёж. Монеты не сгорают.')}</p>
        <div className="billing-checkout-amount" aria-live="polite"><span>{text('Amount to pay', 'To‘lanadigan summa', 'К оплате')}</span><strong>{currency === 'USD' ? formatBillingMoney(selected.amountUsd, 'USD') : quoteReady && quote ? formatBillingMoney(quote.amountUzs, 'UZS') : quoteError ? '—' : text('Calculating…', 'Hisoblanmoqda…', 'Рассчитываем…')}</strong>
          {currency === 'UZS' && quoteReady && quote && <small>{text('Central Bank rate', 'Markaziy bank kursi', 'Курс Центрального банка')} · {quote.date}<br />$1 = {formatBillingMoney(quote.rate, 'UZS')}</small>}
          {currency === 'UZS' && quoteError && <p className="billing-error">{text('Rate unavailable. Retry or choose USD payment.', 'Kursni olish imkoni bo‘lmadi. Qayta urining yoki USD to‘lovini tanlang.', 'Курс недоступен. Повторите или выберите оплату в USD.')}<button type="button" onClick={() => setQuoteVersion(v => v + 1)}>{text('Retry', 'Qayta urinish', 'Повторить')}</button></p>}
        </div>
      </div><div>
        <label className="billing-provider-label">{text('Payment method', 'To‘lov usuli', 'Способ оплаты')}<select value={provider} onChange={event => { setProvider(event.target.value as Provider['code']); setError('') }}>
          {(['PAYME', 'CLICK', 'STRIPE'] as const).map(code => <option key={code} value={code}>{code === 'STRIPE' ? text('International card · USD', 'Xalqaro karta · USD', 'Международная карта · USD') : `${code === 'PAYME' ? 'Payme' : 'Click'} · UZS`}{!providers.some(p => p.code === code && p.enabled) ? ` · ${text('Coming soon', 'Tez orada', 'Скоро')}` : ''}</option>)}
        </select></label>
        {selected.audience === 'CENTER_STUDENT' && !wallet?.centerEligible && <p className="billing-error">{text('Join your teacher’s class first to use this rate.', 'Bu tarif uchun avval o‘qituvchi classiga qo‘shiling.', 'Для этого тарифа сначала вступите в класс.')}<Link to="/learning-center">{text('Open classes', 'Classlarga o‘tish', 'Открыть классы')}</Link></p>}
        {!providerReady && <p className="billing-provider-notice">{text('Online payments are being connected. You can use your free coins now.', 'Onlayn to‘lovlar ulanmoqda. Hozir bepul tangalardan foydalanishingiz mumkin.', 'Онлайн-оплата подключается. Бесплатные монеты уже доступны.')}</p>}
        <button type="button" className="billing-primary" disabled={busy || !!openOrder || !providerReady || !quoteReady || (selected.audience === 'CENTER_STUDENT' && !wallet?.centerEligible)} onClick={() => void pay()}>{busy ? text('Opening payment…', 'To‘lov ochilmoqda…', 'Открываем оплату…') : text('Continue to payment', 'To‘lovga o‘tish', 'Перейти к оплате')}<ArrowRight size={17} /></button>
      </div></div>
    </section>}
    {openOrder && <section className="billing-glass billing-open-order" aria-label={text('Current payment', 'Joriy to‘lov', 'Текущая оплата')}><CreditCard size={23} /><div><strong>{text('Your open order', 'Ochiq buyurtmangiz', 'Ваш текущий заказ')}</strong><p>{productLabel(openOrder.plan, text)} · {formatBillingMoney(openOrder.currency === 'UZS' ? openOrder.amountMinor / 100 : openOrder.amountMinor, openOrder.currency)}</p></div>{openOrder.checkoutUrl && <a className="billing-secondary" href={openOrder.checkoutUrl}>{text('Continue payment', 'To‘lovni davom ettirish', 'Продолжить оплату')}<ArrowRight size={16} /></a>}{openOrder.status !== 'PROCESSING' && <button type="button" className="billing-text-button" disabled={busy} onClick={() => void cancelOrder(openOrder.id)}>{text('Cancel order', 'Bekor qilish', 'Отменить')}</button>}<button className="billing-text-button" onClick={() => void refresh()}>{text('Refresh status', 'Holatni yangilash', 'Обновить статус')}</button></section>}
    {error && <div role="alert" className="billing-error">{error}</div>}

    <section className="billing-glass billing-simple-guide" aria-labelledby="coin-guide-title"><div className="billing-section-heading"><div><h2 id="coin-guide-title">{text('How coins work', 'Tangalar qanday ishlaydi?', 'Как работают монеты')}</h2><p>{text('You see the cost before opening a paid activity.', 'Pullik mashqni ochishdan oldin tanga sarfi ko‘rsatiladi.', 'Стоимость видна до открытия платного занятия.')}</p></div><Coins size={23} /></div>
      <div className="billing-cost-list">{costs.map(cost => <div key={cost.title}><span><strong>{cost.title}</strong><small>{cost.note}</small></span><b>{cost.value}<Coins size={14} /></b></div>)}</div>
      <p className="billing-plan-footnote"><ShieldCheck size={15} />{text('Failed AI requests are refunded. Test replays within 7 days and unlocked media replays are free.', 'AI so‘rovi bajarilmasa, tanga qaytariladi. Testni 7 kun ichida, ochilgan media darslarini esa doim bepul qayta ishlatasiz.', 'При ошибке AI монеты возвращаются. Повторы тестов в течение 7 дней и открытых медиауроков бесплатны.')}</p>
    </section>
    <p className="billing-free-note"><CheckCircle2 size={18} /><span>{text('Always free: saved results and reviews, vocabulary and flashcards, plus three podcasts and three shadowing lessons. They stay available even at zero balance.', 'Doim bepul: saqlangan natijalar va tahlillar, lug‘at va flashcardlar, uchtadan podcast va shadowing darsi. Balans tugasa ham ulardan foydalana olasiz.', 'Всегда бесплатно: результаты и разборы, словарь и карточки, по три подкаста и урока шэдоуинга. Доступны даже при нулевом балансе.')}</span></p>
    {wallet && <section className="billing-glass billing-history"><details><summary><Wallet size={19} />{text('Balance activity & payments', 'Balans harakatlari va to‘lovlar', 'Баланс и платежи')}<ChevronDown size={17} /></summary><div className="billing-history-grid"><div><h3>{text('Coin activity', 'Tanga harakatlari', 'Движение монет')}</h3>{wallet.entries.map(entry => <div className="billing-history-row" key={entry.id}><span><strong>{activityLabel(entry.reason, text)}</strong><small>{new Date(entry.createdAt).toLocaleString()}</small></span><b className={entry.amount > 0 ? 'is-positive' : ''}>{entry.amount > 0 ? '+' : ''}{entry.amount}</b></div>)}</div><div><h3>{text('Payments', 'To‘lovlar', 'Платежи')}</h3>{wallet.orders.length ? wallet.orders.map(order => <div className="billing-history-row" key={order.id}><span><strong>{productLabel(order.plan, text)}</strong><small>{new Date(order.createdAt).toLocaleDateString()} · {order.method === 'STRIPE' ? text('International card', 'Xalqaro karta', 'Международная карта') : order.method}</small></span><b>{orderStatusLabel(order.status, text)}</b></div>) : <p>{text('Your payments will appear here.', 'To‘lovlaringiz shu yerda ko‘rinadi.', 'Здесь появятся ваши платежи.')}</p>}</div></div></details></section>}
  </div></main>
}
