import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, CreditCard, Sparkles, ShieldCheck, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import PricingCards, { formatBillingMoney } from './PricingCards'
import PlanDuration from './PlanDuration'
import { BILLING_PRODUCTS, type BillingProduct } from './catalog'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import { orderStatusLabel, productLabel } from './labels'
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
  const fullAccess = access?.active && access.kind !== 'TRIAL'
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
  return <main className="workspace-page billing-page billing-simple-page"><div className="billing-content">
    <div className="billing-page-nav"><Link to="/dashboard" className="billing-text-button"><ArrowLeft size={17} />{text('Dashboard', 'Bosh sahifa', 'Главная')}</Link><span><ShieldCheck size={15} />{text('No auto-renewal', 'Avtomatik uzaytirilmaydi', 'Без автопродления')}</span></div>
    <header className="billing-trial-hero"><div><span className="billing-eyebrow"><Sparkles size={15} />{text('YOUR NEXT CHAPTER', 'YANGI BOSQICHINGIZ', 'ВАШ НОВЫЙ ЭТАП')}</span>
      <h1>{text('Big goals.', 'Katta maqsadlar.', 'Большие цели.')}<br /><span>{text('Start for free.', 'Bepul boshlang.', 'Начните бесплатно.')}</span></h1>
      <p>{text('Build your IELTS and SAT confidence with your AI study coach. Your first 7 days are free.', 'AI yordamchisi bilan IELTS va SATga ishonch bilan tayyorlaning. Birinchi 7 kun bepul.', 'Готовьтесь к IELTS и SAT увереннее с AI-помощником. Первые 7 дней бесплатно.')}</p>
      {!user && <Link to="/register" className="billing-primary">{text('Start for free', 'Bepul boshlang', 'Начать бесплатно')}<ArrowRight size={17} /></Link>}
      <div className="billing-trial-proof"><span><CheckCircle2 size={15} />{text('No card required', 'Karta talab etilmaydi', 'Без карты')}</span><span><ShieldCheck size={15} />{text('No automatic charges', 'Avtomatik pul yechilmaydi', 'Без автоматических списаний')}</span></div>
    </div><div className="billing-trial-price"><span>{text('YOUR FIRST WEEK', 'BIRINCHI HAFTANGIZ', 'ВАША ПЕРВАЯ НЕДЕЛЯ')}</span><strong>$0</strong><p>IELTS · SAT · AI</p><small>{text('7 days to find your rhythm', 'O‘z ritmingizni topish uchun 7 kun', '7 дней, чтобы найти свой ритм')}</small></div></header>
    {user && access && <div className={`billing-status ${access.active ? 'is-success' : ''}`} role="status"><CheckCircle2 size={20} />{fullAccess ? text('Premium active. Your access is ready.', 'Premium faol. Imkoniyatlar ochiq.', 'Premium активен. Доступ открыт.') : access.active ? text(`Your free trial: ${access.daysRemaining} days left.`, `Bepul sinov: ${access.daysRemaining} kun qoldi.`, `Пробный период: осталось ${access.daysRemaining} дн.`) : text('Your free trial has ended. Choose a plan to continue.', 'Bepul sinov tugadi. Davom etish uchun tarif tanlang.', 'Пробный период закончился. Выберите тариф.')}</div>}
    {walletError && <div className="billing-error" role="alert">{walletError}<button onClick={() => void refresh()}>{text('Retry', 'Qayta urinish', 'Повторить')}</button></div>}
    {returnedOrder && <div className={`billing-status ${returnedOrder.status === 'APPROVED' ? 'is-success' : ''}`} role="status"><CheckCircle2 size={20} />{returnedOrder.status === 'APPROVED' ? text('Payment confirmed. Your Premium access is ready.', 'To‘lov tasdiqlandi. Premium imkoniyatlar ochiq.', 'Оплата подтверждена. Premium доступ открыт.') : text('Payment status', 'To‘lov holati', 'Статус оплаты') + ': ' + orderStatusLabel(returnedOrder.status, text)}<button className="billing-text-button" onClick={() => void refresh()}>{text('Refresh', 'Yangilash', 'Обновить')}</button></div>}
    {!!wallet?.subscriptions.length && <div className="billing-active-plans">{wallet.subscriptions.map(plan => <span key={plan.audience}><CheckCircle2 size={15} />{productLabel(plan.plan, text)} · {text('until', 'gacha', 'до')} {new Date(plan.expiresAt).toLocaleDateString()}</span>)}</div>}

    <section aria-labelledby="billing-plans-title">
      <div className="billing-section-heading"><h2 id="billing-plans-title">{text('Choose a plan', 'Tarifni tanlang', 'Выберите тариф')}</h2><PlanDuration months={months} onChange={value => { setMonths(value); setSelected(null) }} /></div>
      {catalogError && <div role="alert" className="billing-error">{catalogError}<button onClick={() => void loadCatalog()}>{text('Reload plans', 'Qayta yuklash', 'Обновить тарифы')}</button></div>}
      <PricingCards products={products} months={months} onChoose={choose} disabled={busy || !catalog} />
      <p className="billing-plan-footnote">{text('Student $3/month · Teacher $5/month. Classes require a paid plan. No auto-renewal.', 'Student $3/oy · Teacher $5/oy. Classes uchun pullik tarif kerak. Avtomatik uzaytirilmaydi.', 'Student $3/мес. · Teacher $5/мес. Для классов нужен платный тариф. Без автопродления.')}</p>
    </section>

    {selected && <section ref={checkoutRef} className="billing-glass billing-checkout" aria-labelledby="checkout-title">
      <div className="billing-section-heading"><div><span className="billing-eyebrow"><CreditCard size={15} />{text('PAYMENT', 'TO‘LOV', 'ОПЛАТА')}</span><h2 id="checkout-title">{text('Review your purchase', 'To‘lovni tekshiring', 'Проверьте покупку')}</h2></div><button type="button" className="billing-round-link" aria-label={text('Close checkout', 'To‘lov oynasini yopish', 'Закрыть оплату')} onClick={() => setSelected(null)}><X size={18} /></button></div>
      <div className="billing-checkout-grid"><div>
        <div className="billing-checkout-summary"><ShieldCheck size={24} /><div><strong>{productLabel(selected.code, text)}</strong><span>{text(`${selected.months} months of Premium access`, `${selected.months} oy Premium`, `${selected.months} мес. Premium`)}</span></div><strong>{formatBillingMoney(selected.amountUsd, 'USD')}</strong></div>
        <p>{text('One payment for the full period. No automatic charges.', 'Butun muddat uchun bir martalik to‘lov. Avtomatik pul yechilmaydi.', 'Один платёж за весь срок. Без автоматических списаний.')}</p>
        <div className="billing-checkout-amount" aria-live="polite"><span>{text('Amount to pay', 'To‘lanadigan summa', 'К оплате')}</span><strong>{currency === 'USD' ? formatBillingMoney(selected.amountUsd, 'USD') : quoteReady && quote ? formatBillingMoney(quote.amountUzs, 'UZS') : quoteError ? '—' : text('Calculating…', 'Hisoblanmoqda…', 'Рассчитываем…')}</strong>
          {currency === 'UZS' && quoteReady && quote && <small>{text('Central Bank rate', 'Markaziy bank kursi', 'Курс Центрального банка')} · {quote.date}<br />$1 = {formatBillingMoney(quote.rate, 'UZS')}</small>}
          {currency === 'UZS' && quoteError && <p className="billing-error">{text('Rate unavailable. Retry or choose USD payment.', 'Kursni olish imkoni bo‘lmadi. Qayta urining yoki USD to‘lovini tanlang.', 'Курс недоступен. Повторите или выберите оплату в USD.')}<button type="button" onClick={() => setQuoteVersion(v => v + 1)}>{text('Retry', 'Qayta urinish', 'Повторить')}</button></p>}
        </div>
      </div><div>
        <label className="billing-provider-label">{text('Payment method', 'To‘lov usuli', 'Способ оплаты')}<select value={provider} onChange={event => { setProvider(event.target.value as Provider['code']); setError('') }}>
          {(['PAYME', 'CLICK', 'STRIPE'] as const).map(code => <option key={code} value={code}>{code === 'STRIPE' ? text('International card · USD', 'Xalqaro karta · USD', 'Международная карта · USD') : `${code === 'PAYME' ? 'Payme' : 'Click'} · UZS`}{!providers.some(p => p.code === code && p.enabled) ? ` · ${text('Coming soon', 'Tez orada', 'Скоро')}` : ''}</option>)}
        </select></label>
        {!providerReady && <p className="billing-provider-notice">{text('Online payments are being connected. Contact support for plan activation.', 'Onlayn to‘lovlar ulanmoqda. Tarifni faollashtirish uchun yordamga murojaat qiling.', 'Онлайн-оплата подключается. Для активации тарифа обратитесь в поддержку.')}</p>}
        <button type="button" className="billing-primary" disabled={busy || !!openOrder || !providerReady || !quoteReady} onClick={() => void pay()}>{busy ? text('Opening payment…', 'To‘lov ochilmoqda…', 'Открываем оплату…') : text('Continue to payment', 'To‘lovga o‘tish', 'Перейти к оплате')}<ArrowRight size={17} /></button>
      </div></div>
    </section>}
    {openOrder && <section className="billing-glass billing-open-order" aria-label={text('Current payment', 'Joriy to‘lov', 'Текущая оплата')}><CreditCard size={23} /><div><strong>{text('Your open order', 'Ochiq buyurtmangiz', 'Ваш текущий заказ')}</strong><p>{productLabel(openOrder.plan, text)} · {formatBillingMoney(openOrder.currency === 'UZS' ? openOrder.amountMinor / 100 : openOrder.amountMinor, openOrder.currency)}</p></div>{openOrder.checkoutUrl && <a className="billing-secondary" href={openOrder.checkoutUrl}>{text('Continue payment', 'To‘lovni davom ettirish', 'Продолжить оплату')}<ArrowRight size={16} /></a>}{openOrder.status !== 'PROCESSING' && <button type="button" className="billing-text-button" disabled={busy} onClick={() => void cancelOrder(openOrder.id)}>{text('Cancel order', 'Bekor qilish', 'Отменить')}</button>}<button className="billing-text-button" onClick={() => void refresh()}>{text('Refresh status', 'Holatni yangilash', 'Обновить статус')}</button></section>}
    {error && <div role="alert" className="billing-error">{error}</div>}

    <p className="billing-free-note"><CheckCircle2 size={18} /><span>{text('Saved results, reviews and vocabulary remain available when your trial or plan ends.', 'Sinov yoki tarif tugaganda ham natijalar, tahlillar va lug‘at ochiq qoladi.', 'Результаты, разборы и словарь доступны после окончания пробного периода или тарифа.')}</span></p>
    {wallet && <section className="billing-glass billing-history"><details><summary><CreditCard size={19} />{text('Your payments', 'To‘lovlaringiz', 'Ваши платежи')}<ChevronDown size={17} /></summary><div className="billing-payment-list">{wallet.orders.length ? wallet.orders.map(order => <div className="billing-history-row" key={order.id}><span><strong>{productLabel(order.plan, text)}</strong><small>{new Date(order.createdAt).toLocaleDateString()} · {order.method}</small></span><b>{orderStatusLabel(order.status, text)}</b></div>) : <p>{text('Your payments will appear here.', 'To‘lovlaringiz shu yerda ko‘rinadi.', 'Здесь появятся ваши платежи.')}</p>}</div></details></section>}
  </div></main>
}
