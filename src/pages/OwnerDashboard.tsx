import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Crown, RefreshCw, Search, ShieldCheck, Users, Wallet } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

const OWNER_EMAIL = 'elyornishonboyev000@gmail.com'
type ReportStatus = 'OPEN' | 'RESOLVED'
type ReportFilter = 'ALL' | ReportStatus
type Page<T> = { items: T[]; total: number; page: number; pageSize: number }
type NewUser = { id: string; fullName: string; email: string; createdAt: string }
type PremiumGrant = { plan: string; source: string; startsAt: string; expiresAt: string | null }
type ManagedUser = NewUser & { nickname: string | null; role: string; fixedPremium: boolean; premiumGrant: PremiumGrant | null }
type PaymentRequest = { id: string; plan: string; amountUzs: number; status: string; createdAt: string; user: NewUser }
type IssueReport = { id: string; name: string; email: string; category: string; description: string; pagePath: string | null; status: ReportStatus; createdAt: string }
type Overview = {
  metrics: { totalUsers: number; todayUsers: number; weekUsers: number; totalReports: number; openReports: number }
  users: Page<NewUser>
  reports: Page<IssueReport>
}

const dateFormat = new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })
const categoryLabels: Record<string, string> = { BUG: 'Texnik xatolik', BILLING: "To‘lov masalasi", FEATURE: 'Taklif', OTHER: 'Boshqa' }

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  if (maxPage === 1) return null
  return <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
    <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold disabled:opacity-40">Oldingi</button>
    <span>{page} / {maxPage}</span>
    <button type="button" disabled={page >= maxPage} onClick={() => onChange(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold disabled:opacity-40">Keyingi</button>
  </div>
}

export default function OwnerDashboard() {
  const user = useAuthStore(state => state.user)
  const isOwner = user?.email.trim().toLowerCase() === OWNER_EMAIL
  const [overview, setOverview] = useState<Overview | null>(null)
  const [userPage, setUserPage] = useState(1)
  const [reportPage, setReportPage] = useState(1)
  const [filter, setFilter] = useState<ReportFilter>('ALL')
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [managedPage, setManagedPage] = useState(1)
  const [managedUsers, setManagedUsers] = useState<Page<ManagedUser> | null>(null)
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentStatus, setPaymentStatus] = useState('SUBMITTED')
  const [payments, setPayments] = useState<Page<PaymentRequest> | null>(null)
  const [grantPlans, setGrantPlans] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOwner) return
    let active = true
    setLoading(true)
    setError('')
    const query = new URLSearchParams({ userPage: String(userPage), reportPage: String(reportPage), status: filter })
    void apiClient.get<Overview>(`/support/owner/overview?${query}`).then(data => {
      if (active) setOverview(data)
    }).catch(cause => {
      if (active) setError(cause instanceof Error ? cause.message : 'Ma’lumotlarni yuklab bo‘lmadi.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [isOwner, userPage, reportPage, filter, reload])

  useEffect(() => {
    if (!isOwner) return
    let active = true
    const query = new URLSearchParams({ page: String(managedPage), q: userQuery })
    void apiClient.get<Page<ManagedUser>>(`/billing/owner/users?${query}`).then(data => {
      if (active) setManagedUsers(data)
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Foydalanuvchilarni yuklab bo‘lmadi.') })
    return () => { active = false }
  }, [isOwner, managedPage, userQuery, reload])

  useEffect(() => {
    if (!isOwner) return
    let active = true
    const query = new URLSearchParams({ page: String(paymentPage), status: paymentStatus })
    void apiClient.get<Page<PaymentRequest>>(`/billing/owner/requests?${query}`).then(data => {
      if (active) setPayments(data)
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'To‘lov so‘rovlarini yuklab bo‘lmadi.') })
    return () => { active = false }
  }, [isOwner, paymentPage, paymentStatus, reload])

  async function grantPremium(person: ManagedUser) {
    setUpdatingId(person.id)
    setError('')
    try {
      await apiClient.put(`/billing/owner/users/${person.id}/grant`, { plan: grantPlans[person.id] ?? 'MONTHLY' })
      setReload(value => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Premiumni berib bo‘lmadi.')
    } finally { setUpdatingId(null) }
  }

  async function revokePremium(person: ManagedUser) {
    if (!window.confirm(`${person.email} hisobidan premiumni olib tashlaysizmi?`)) return
    setUpdatingId(person.id)
    setError('')
    try {
      await apiClient.delete(`/billing/owner/users/${person.id}/grant`)
      setReload(value => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Premiumni olib tashlab bo‘lmadi.')
    } finally { setUpdatingId(null) }
  }

  async function reviewPayment(request: PaymentRequest, action: 'APPROVE' | 'REJECT') {
    if (action === 'APPROVE' && !window.confirm(`${request.amountUzs.toLocaleString('uz-UZ')} so‘m kartaga kelganini tekshirdingizmi?`)) return
    setUpdatingId(request.id)
    setError('')
    try {
      await apiClient.patch(`/billing/owner/requests/${request.id}`, { action })
      setReload(value => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'So‘rovni ko‘rib chiqib bo‘lmadi.')
    } finally { setUpdatingId(null) }
  }

  async function changeStatus(report: IssueReport) {
    setUpdatingId(report.id)
    setError('')
    try {
      await apiClient.patch(`/support/owner/reports/${report.id}`, { status: report.status === 'OPEN' ? 'RESOLVED' : 'OPEN' })
      setReload(value => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Holatni o‘zgartirib bo‘lmadi.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (!isOwner) return <Navigate to="/dashboard" replace />

  const metrics = overview?.metrics
  const cards = [
    { label: 'Jami foydalanuvchilar', value: metrics?.totalUsers, icon: Users },
    { label: 'Bugun qo‘shilganlar', value: metrics?.todayUsers, icon: Users },
    { label: 'Oxirgi 7 kunda', value: metrics?.weekUsers, icon: Users },
    { label: 'Ochiq xabarlar', value: metrics?.openReports, icon: AlertCircle },
  ]

  return <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700"><ShieldCheck size={15} /> Shaxsiy boshqaruv paneli</div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Sayt faoliyati</h1>
        <p className="mt-2 text-slate-600">Yangi foydalanuvchilar va yuborilgan muammo xabarlari.</p>
      </div>
      <button type="button" onClick={() => setReload(value => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50"><RefreshCw size={16} /> Yangilash</button>
    </div>

    {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    {loading && !overview && <p role="status" className="rounded-2xl bg-white p-6 text-slate-600">Ma’lumotlar yuklanmoqda...</p>}
    {overview && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => <div key={card.label} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600"><span>{card.label}</span><card.icon size={19} className="text-red-600" /></div>
          <div className="mt-3 text-3xl font-black text-slate-950">{card.value ?? '—'}</div>
        </div>)}
      </div>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">Foydalanuvchilar</h2><p className="mt-1 text-sm text-slate-500">Yangi ro‘yxatdan o‘tganlar · jami {overview.users.total}</p></div></div>
          <div className="divide-y divide-slate-100">
            {overview.users.items.map(person => <div key={person.id} className="py-4 first:pt-0">
              <div className="font-bold text-slate-900">{person.fullName}</div>
              <div className="break-all text-sm text-slate-600">{person.email}</div>
              <div className="mt-1 text-xs text-slate-500">{dateFormat.format(new Date(person.createdAt))}</div>
            </div>)}
            {overview.users.items.length === 0 && <p className="py-5 text-sm text-slate-500">Hozircha foydalanuvchi yo‘q.</p>}
          </div>
          <Pagination page={userPage} total={overview.users.total} pageSize={overview.users.pageSize} onChange={setUserPage} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-xl font-black text-slate-900">Muammo xabarlari</h2><p className="mt-1 text-sm text-slate-500">Jami {overview.metrics.totalReports} ta xabar</p></div>
            <select aria-label="Xabar holati" value={filter} onChange={event => { setFilter(event.target.value as ReportFilter); setReportPage(1) }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <option value="ALL">Barchasi</option><option value="OPEN">Ochiq</option><option value="RESOLVED">Yopilgan</option>
            </select>
          </div>
          <div className="space-y-3">
            {overview.reports.items.map(report => <article key={report.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-bold text-slate-900">{report.name}</div><div className="break-all text-sm text-slate-600">{report.email}</div></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${report.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{report.status === 'OPEN' ? 'Ochiq' : 'Yopilgan'}</span></div>
              <div className="mt-3 text-xs font-semibold text-slate-500">{categoryLabels[report.category] ?? report.category} · {dateFormat.format(new Date(report.createdAt))}</div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{report.description}</p>
              {report.pagePath && <div className="mt-2 break-all text-xs text-slate-500">Sahifa: {report.pagePath}</div>}
              <button type="button" disabled={updatingId === report.id} onClick={() => void changeStatus(report)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"><CheckCircle2 size={15} /> {report.status === 'OPEN' ? 'Yopilgan deb belgilash' : 'Qayta ochish'}</button>
            </article>)}
            {overview.reports.items.length === 0 && <p className="py-5 text-sm text-slate-500">Bu holatda xabar yo‘q.</p>}
          </div>
          <div className="mt-4"><Pagination page={reportPage} total={overview.reports.total} pageSize={overview.reports.pageSize} onChange={setReportPage} /></div>
        </section>
      </div>
    </>}

    <section className="mt-7 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby="premium-users-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 id="premium-users-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><Crown size={21} className="text-amber-500" /> Premium boshqaruvi</h2><p className="mt-1 text-sm text-slate-500">Hisobni qidiring va unga 1, 3, 12 oylik yoki muddatsiz premium bering.</p></div>
        <form onSubmit={event => { event.preventDefault(); setManagedPage(1); setUserQuery(search.trim()) }} className="flex w-full max-w-sm gap-2">
          <input aria-label="Foydalanuvchi qidirish" value={search} onChange={event => setSearch(event.target.value)} placeholder="Email, ism yoki nickname" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-xl bg-blue-600 px-3 py-2 text-white" aria-label="Qidirish"><Search size={18} /></button>
        </form>
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {managedUsers?.items.map(person => {
          const grant = person.premiumGrant
          const grantActive = Boolean(grant && (!grant.expiresAt || new Date(grant.expiresAt) > new Date()))
          return <div key={person.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0"><p className="font-bold text-slate-900">{person.fullName} {person.nickname && <span className="text-sm font-normal text-slate-500">@{person.nickname}</span>}</p><p className="break-all text-sm text-slate-600">{person.email}</p><p className="mt-1 text-xs text-slate-500">Qo‘shilgan: {dateFormat.format(new Date(person.createdAt))}</p>
              <p className={`mt-1 text-xs font-bold ${person.fixedPremium || grantActive ? 'text-emerald-700' : 'text-slate-500'}`}>{person.fixedPremium ? 'Doimiy premium' : grantActive ? `${grant?.plan} · ${grant?.expiresAt ? `${dateFormat.format(new Date(grant.expiresAt))} gacha` : 'muddatsiz'}` : 'Premium yo‘q'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label={`${person.email} uchun premium muddati`} value={grantPlans[person.id] ?? 'MONTHLY'} onChange={event => setGrantPlans(value => ({ ...value, [person.id]: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="MONTHLY">1 oy</option><option value="QUARTERLY">3 oy</option><option value="YEARLY">12 oy</option><option value="UNLIMITED">Muddatsiz</option>
              </select>
              <button type="button" disabled={updatingId === person.id} onClick={() => void grantPremium(person)} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Premium berish</button>
              {grant && !person.fixedPremium && <button type="button" disabled={updatingId === person.id} onClick={() => void revokePremium(person)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Bekor qilish</button>}
            </div>
          </div>
        })}
        {managedUsers?.items.length === 0 && <p className="py-5 text-sm text-slate-500">Foydalanuvchi topilmadi.</p>}
      </div>
      {managedUsers && <Pagination page={managedPage} total={managedUsers.total} pageSize={managedUsers.pageSize} onChange={setManagedPage} />}
    </section>

    <section className="mt-7 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby="payment-requests-title">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="payment-requests-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><Wallet size={21} className="text-blue-600" /> To‘lov so‘rovlari</h2><p className="mt-1 text-sm text-slate-500">Tasdiqlashdan oldin kartangizga pul tushganini tekshiring.</p></div>
        <select aria-label="To‘lov so‘rovi holati" value={paymentStatus} onChange={event => { setPaymentStatus(event.target.value); setPaymentPage(1) }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="SUBMITTED">Tekshiriladigan</option><option value="PENDING">Kutilmoqda</option><option value="APPROVED">Tasdiqlangan</option><option value="REJECTED">Rad etilgan</option><option value="CANCELED">Bekor qilingan</option><option value="ALL">Barchasi</option></select>
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {payments?.items.map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-bold text-slate-900">{request.user.fullName} · {request.amountUzs.toLocaleString('uz-UZ')} so‘m</p><p className="break-all text-sm text-slate-600">{request.user.email}</p><p className="mt-1 text-xs text-slate-500">Buyurtma: {request.id} · {request.plan} · {dateFormat.format(new Date(request.createdAt))}</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{request.status}</span></div>
          {request.status === 'SUBMITTED' && <div className="flex gap-2"><button type="button" disabled={updatingId === request.id} onClick={() => void reviewPayment(request, 'APPROVE')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">To‘lovni tasdiqlash</button><button type="button" disabled={updatingId === request.id} onClick={() => void reviewPayment(request, 'REJECT')} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Rad etish</button></div>}
        </div>)}
        {payments?.items.length === 0 && <p className="py-5 text-sm text-slate-500">Bu holatda so‘rov yo‘q.</p>}
      </div>
      {payments && <Pagination page={paymentPage} total={payments.total} pageSize={payments.pageSize} onChange={setPaymentPage} />}
    </section>
  </div>
}
