import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

const OWNER_EMAIL = 'elyornishonboyev000@gmail.com'
type ReportStatus = 'OPEN' | 'RESOLVED'
type ReportFilter = 'ALL' | ReportStatus
type Page<T> = { items: T[]; total: number; page: number; pageSize: number }
type NewUser = { id: string; fullName: string; email: string; createdAt: string }
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
  </div>
}
