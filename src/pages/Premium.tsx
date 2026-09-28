import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock3, Copy, Crown, ExternalLink, ShieldCheck, Wallet } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { isPremiumUser } from '@/utils/premiumAccess'

const TELEGRAM_USERNAME = 'nishonboyev7'
const CARD_NUMBER = '5614 6827 0376 3088'
const CARD_NUMBER_RAW = CARD_NUMBER.replace(/\s/g, '')
type PlanCode = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
type Plan = { name: string; months: number; amountUzs: number }
type PaymentRequest = { id: string; plan: PlanCode; amountUzs: number; status: string; createdAt: string; reviewedAt: string | null }
type BillingOverview = { plans: Record<PlanCode, Plan>; grant: { plan: string; source: string; startsAt: string; expiresAt: string | null } | null; requests: PaymentRequest[] }

const planOrder: PlanCode[] = ['MONTHLY', 'QUARTERLY', 'YEARLY']
const statusLabels: Record<string, string> = {
  PENDING: 'To‘lov kutilmoqda', SUBMITTED: 'Tekshirilmoqda', APPROVED: 'Tasdiqlangan',
  REJECTED: 'Rad etilgan', CANCELED: 'Bekor qilingan',
}
const uzs = (amount: number) => `${amount.toLocaleString('uz-UZ')} so‘m`
const dateFormat = new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium' })

export default function Premium() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const [plans, setPlans] = useState<Record<PlanCode, Plan> | null>(null)
  const [billing, setBilling] = useState<BillingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function refresh() {
    try {
      if (user) {
        const data = await apiClient.get<BillingOverview>('/billing')
        setBilling(data)
        setPlans(data.plans)
      } else {
        const data = await apiClient.get<{ plans: Record<PlanCode, Plan> }>('/billing/plans', { auth: false })
        setPlans(data.plans)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tariflarni yuklab bo‘lmadi.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [user?.id])

  const activeRequest = billing?.requests.find(request => request.status === 'PENDING' || request.status === 'SUBMITTED')
  const premiumActive = isPremiumUser(user)
  const activeUntil = billing?.grant?.expiresAt ? dateFormat.format(new Date(billing.grant.expiresAt)) : null

  async function createRequest(plan: PlanCode) {
    if (!user) { navigate('/login', { state: { from: { pathname: '/premium' } } }); return }
    setBusy(true)
    setError('')
    try {
      await apiClient.post('/billing/requests', { plan })
      await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Buyurtma yaratilmadi.') }
    finally { setBusy(false) }
  }

  async function submitRequest() {
    if (!activeRequest) return
    setBusy(true)
    setError('')
    try {
      await apiClient.patch(`/billing/requests/${activeRequest.id}/submit`)
      await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'So‘rov yuborilmadi.') }
    finally { setBusy(false) }
  }

  async function cancelRequest() {
    if (!activeRequest || !window.confirm('Bu to‘lov so‘rovini bekor qilasizmi?')) return
    setBusy(true)
    setError('')
    try {
      await apiClient.delete(`/billing/requests/${activeRequest.id}`)
      await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'So‘rov bekor qilinmadi.') }
    finally { setBusy(false) }
  }

  async function copyCard() {
    try { await navigator.clipboard.writeText(CARD_NUMBER_RAW); setCopied(true); window.setTimeout(() => setCopied(false), 2000) }
    catch { setError('Karta raqamini nusxalab bo‘lmadi. Uni qo‘lda ko‘chiring.') }
  }

  const telegramMessage = activeRequest && user
    ? `Assalomu alaykum. ProfAI Premium to‘lovi. Buyurtma: ${activeRequest.id}. Email: ${user.email}. Tarif: ${plans?.[activeRequest.plan]?.name ?? activeRequest.plan}. Summa: ${uzs(activeRequest.amountUzs)}. To‘lov chekini yuboryapman.`
    : ''
  const telegramUrl = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(telegramMessage)}`

  return <main className="workspace-page min-h-screen px-4 py-9 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-6xl">
      <button type="button" onClick={() => navigate(-1)} className="route-back-button mb-6"><ArrowLeft size={17} /> Orqaga</button>
      <header className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-7 text-white shadow-xl sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider"><Crown size={15} className="text-amber-300" /> ProfAI Premium</span>
        <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Tayyorgarligingizga to‘liq kirish</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">Barcha premium bo‘limlar, AI tahlil va speaking vositalari. Tariflar bir martalik to‘lov bilan faollashadi va o‘zidan o‘zi yangilanmaydi.</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">{['Barcha premium bo‘limlar', 'AI tahlil', 'Speaking vositalari', 'Avtomatik yangilanish yo‘q'].map(item => <span key={item} className="rounded-full border border-white/20 bg-white/10 px-3 py-2">{item}</span>)}</div>
      </header>

      {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
      {loading && <p role="status" className="mt-6 text-slate-600">Tariflar yuklanmoqda...</p>}

      {premiumActive && <section className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <CheckCircle2 size={30} className="text-emerald-600" /><div><h2 className="font-black">Premium faol</h2><p className="text-sm">{activeUntil ? `${activeUntil} gacha faol` : 'Muddatsiz premium huquqi mavjud.'}</p></div>
      </section>}

      {plans && <section className="mt-10" aria-labelledby="plans-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="plans-title" className="text-2xl font-black text-slate-900">Tariflar</h2><p className="mt-1 text-sm text-slate-600">O‘zbekiston so‘mida. Hammasi bir xil premium imkoniyatlarini beradi.</p></div><span className="text-xs font-semibold text-slate-500">Narx to‘lovdan oldin buyurtmada tasdiqlanadi</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">{planOrder.map(code => {
          const plan = plans[code]
          const monthly = Math.round(plan.amountUzs / plan.months)
          return <article key={code} className={`flex flex-col rounded-[1.6rem] border bg-white p-6 shadow-sm ${code === 'QUARTERLY' ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{plan.name}</span>{code === 'QUARTERLY' && <span className="text-xs font-black text-blue-700">TAVSIYA</span>}</div>
            <div className="mt-5 text-3xl font-black text-slate-950">{uzs(plan.amountUzs)}</div><p className="mt-1 text-sm text-slate-500">{uzs(monthly)} / oy hisobida</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700"><li className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-emerald-600" />Barcha premium bo‘limlar</li><li className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-emerald-600" />AI va test tahlillari</li><li className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-emerald-600" />{plan.months} oylik kirish</li></ul>
            <button type="button" onClick={() => void createRequest(code)} disabled={busy || Boolean(activeRequest) || (premiumActive && !activeUntil)} className="mt-7 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{!user ? 'Kirish va tanlash' : activeRequest ? 'Avvalgi so‘rovni yakunlang' : 'Tarifni tanlash'}</button>
          </article>
        })}</div>
      </section>}

      {activeRequest && <section className="mt-8 rounded-[1.6rem] border border-blue-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="payment-title">
        <div className="flex items-center gap-3"><Wallet size={27} className="text-blue-600" /><div><h2 id="payment-title" className="text-xl font-black text-slate-900">To‘lov buyurtmangiz</h2><p className="text-sm text-slate-600">Buyurtma kodi: <strong className="break-all">{activeRequest.id}</strong></p></div></div>
        <div className="mt-5 grid gap-5 md:grid-cols-2"><div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Karta orqali o‘tkazma</p><p className="mt-4 font-mono text-xl font-bold tracking-wider sm:text-2xl">{CARD_NUMBER}</p><button type="button" onClick={() => void copyCard()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-bold"><Copy size={15} />{copied ? 'Nusxalandi' : 'Raqamni nusxalash'}</button></div>
          <div className="rounded-2xl bg-blue-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-blue-700">To‘lanadigan summa</p><p className="mt-3 text-3xl font-black text-slate-950">{uzs(activeRequest.amountUzs)}</p><p className="mt-2 text-sm text-slate-600">Click, Payme yoki bank ilovasidan shu kartaga o‘tkazing. Chekni Telegram orqali yuboring.</p></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 p-4 text-sm"><strong>1.</strong> Aniq summani kartaga o‘tkazing.</div><div className="rounded-xl border border-slate-200 p-4 text-sm"><strong>2.</strong> Chek va buyurtma kodini Telegramga yuboring.</div><div className="rounded-xl border border-slate-200 p-4 text-sm"><strong>3.</strong> So‘rovni yuborilgan deb belgilang; admin tekshiradi.</div></div>
        <div className="mt-6 flex flex-wrap gap-3"><a href={telegramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700"><ExternalLink size={17} /> @{TELEGRAM_USERNAME} ga chek yuborish</a>
          {activeRequest.status === 'PENDING' && <button type="button" disabled={busy} onClick={() => void submitRequest()} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Chekni yubordim</button>}
          <button type="button" disabled={busy} onClick={() => void cancelRequest()} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">So‘rovni bekor qilish</button></div>
        {activeRequest.status === 'SUBMITTED' && <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700"><Clock3 size={17} /> To‘lov qo‘lda tekshirilmoqda. Tasdiqlangach premium ochiladi.</p>}
      </section>}

      {billing && billing.requests.length > 0 && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-black text-slate-900">Buyurtmalar tarixi</h2><div className="mt-4 divide-y divide-slate-100">{billing.requests.map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><strong>{plans?.[request.plan]?.name ?? request.plan}</strong><span className="ml-2 text-slate-500">{uzs(request.amountUzs)} · {dateFormat.format(new Date(request.createdAt))}</span></div><span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">{statusLabels[request.status] ?? request.status}</span></div>)}</div></section>}

      <p className="mt-8 flex items-start gap-2 text-sm leading-6 text-slate-600"><ShieldCheck size={18} className="mt-1 shrink-0 text-blue-600" /> To‘lov Telegram orqali qo‘lda tasdiqlanadi. Karta ma’lumotlaringiz saytimizda saqlanmaydi. Savollar bo‘lsa @{TELEGRAM_USERNAME} ga yozing.</p>
    </div>
  </main>
}
