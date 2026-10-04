import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Crown, RefreshCw, Search, ShieldCheck, Users, Wallet } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { ownerText, type OwnerLanguage } from '@/i18n/owner'
import { premiumLanguage } from '@/i18n/premium'
import { useAuthStore } from '@/store/authStore'
import ReviewModeration from '@/components/landing/ReviewModeration'

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

const categoryLabels: Record<string, string> = { BUG: 'Technical issue', BILLING: 'Billing issue', FEATURE: 'Suggestion', OTHER: 'Other' }
const paymentStatusLabels: Record<string, string> = { SUBMITTED: 'Needs review', PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', CANCELED: 'Canceled' }
const planLabels: Record<string, string> = { MONTHLY: '1 month', QUARTERLY: '3 months', YEARLY: '12 months', UNLIMITED: 'Indefinitely' }

function Pagination({ page, total, pageSize, onChange, language }: { page: number; total: number; pageSize: number; onChange: (page: number) => void; language: OwnerLanguage }) {
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  if (maxPage === 1) return null
  return <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
    <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold disabled:opacity-40">{ownerText('Previous', language)}</button>
    <span>{page} / {maxPage}</span>
    <button type="button" disabled={page >= maxPage} onClick={() => onChange(page + 1)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold disabled:opacity-40">{ownerText('Next', language)}</button>
  </div>
}

export default function OwnerDashboard() {
  const { i18n } = useTranslation()
  const language = premiumLanguage(i18n.resolvedLanguage ?? i18n.language)
  const t = (text: string, params?: Record<string, string | number>) => ownerText(text, language, params)
  const locale = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US'
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
  const amount = (value: number) => `${new Intl.NumberFormat(locale).format(value)} ${t('UZS')}`
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
    }).catch(() => {
      if (active) setError(t('Could not load the overview.'))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [isOwner, userPage, reportPage, filter, reload, language])

  useEffect(() => {
    if (!isOwner) return
    let active = true
    const query = new URLSearchParams({ page: String(managedPage), q: userQuery })
    void apiClient.get<Page<ManagedUser>>(`/billing/owner/users?${query}`).then(data => {
      if (active) setManagedUsers(data)
    }).catch(() => { if (active) setError(t('Could not load users.')) })
    return () => { active = false }
  }, [isOwner, managedPage, userQuery, reload, language])

  useEffect(() => {
    if (!isOwner) return
    let active = true
    const query = new URLSearchParams({ page: String(paymentPage), status: paymentStatus })
    void apiClient.get<Page<PaymentRequest>>(`/billing/owner/requests?${query}`).then(data => {
      if (active) setPayments(data)
    }).catch(() => { if (active) setError(t('Could not load payment requests.')) })
    return () => { active = false }
  }, [isOwner, paymentPage, paymentStatus, reload, language])

  async function grantPremium(person: ManagedUser) {
    setUpdatingId(person.id)
    setError('')
    try {
      await apiClient.put(`/billing/owner/users/${person.id}/grant`, { plan: grantPlans[person.id] ?? 'MONTHLY' })
      setReload(value => value + 1)
    } catch {
      setError(t('Could not grant Premium.'))
    } finally { setUpdatingId(null) }
  }

  async function revokePremium(person: ManagedUser) {
    if (!window.confirm(t('Remove Premium from {email}?', { email: person.email }))) return
    setUpdatingId(person.id)
    setError('')
    try {
      await apiClient.delete(`/billing/owner/users/${person.id}/grant`)
      setReload(value => value + 1)
    } catch {
      setError(t('Could not revoke Premium.'))
    } finally { setUpdatingId(null) }
  }

  async function reviewPayment(request: PaymentRequest, action: 'APPROVE' | 'REJECT') {
    if (action === 'APPROVE' && !window.confirm(t('Have you verified the card received {amount}?', { amount: amount(request.amountUzs) }))) return
    setUpdatingId(request.id)
    setError('')
    try {
      await apiClient.patch(`/billing/owner/requests/${request.id}`, { action })
      setReload(value => value + 1)
    } catch {
      setError(t('Could not review the request.'))
    } finally { setUpdatingId(null) }
  }

  async function changeStatus(report: IssueReport) {
    setUpdatingId(report.id)
    setError('')
    try {
      await apiClient.patch(`/support/owner/reports/${report.id}`, { status: report.status === 'OPEN' ? 'RESOLVED' : 'OPEN' })
      setReload(value => value + 1)
    } catch {
      setError(t('Could not change the status.'))
    } finally {
      setUpdatingId(null)
    }
  }

  if (!isOwner) return <Navigate to="/dashboard" replace />

  const metrics = overview?.metrics
  const cards = [
    { label: t('Total users'), value: metrics?.totalUsers, icon: Users },
    { label: t('Joined today'), value: metrics?.todayUsers, icon: Users },
    { label: t('Last 7 days'), value: metrics?.weekUsers, icon: Users },
    { label: t('Open reports'), value: metrics?.openReports, icon: AlertCircle },
  ]

  return <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700"><ShieldCheck size={15} /> {t('Owner dashboard')}</div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t('Site activity')}</h1>
        <p className="mt-2 text-slate-600">{t('New users and submitted issue reports.')}</p>
      </div>
      <button type="button" onClick={() => setReload(value => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50"><RefreshCw size={16} /> {t('Refresh')}</button>
    </div>

    {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    <ReviewModeration language={language} reload={reload} />
    {loading && !overview && <p role="status" className="rounded-2xl bg-white p-6 text-slate-600">{t('Loading data…')}</p>}
    {overview && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => <div key={card.label} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600"><span>{card.label}</span><card.icon size={19} className="text-red-600" /></div>
          <div className="mt-3 text-3xl font-black text-slate-950">{card.value ?? '—'}</div>
        </div>)}
      </div>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">{t('Users')}</h2><p className="mt-1 text-sm text-slate-500">{t('New registrations · total {count}', { count: overview.users.total })}</p></div></div>
          <div className="divide-y divide-slate-100">
            {overview.users.items.map(person => <div key={person.id} className="py-4 first:pt-0">
              <div className="font-bold text-slate-900">{person.fullName}</div>
              <div className="break-all text-sm text-slate-600">{person.email}</div>
              <div className="mt-1 text-xs text-slate-500">{dateFormat.format(new Date(person.createdAt))}</div>
            </div>)}
            {overview.users.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No users yet.')}</p>}
          </div>
          <Pagination page={userPage} total={overview.users.total} pageSize={overview.users.pageSize} onChange={setUserPage} language={language} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-xl font-black text-slate-900">{t('Issue reports')}</h2><p className="mt-1 text-sm text-slate-500">{t('Total reports: {count}', { count: overview.metrics.totalReports })}</p></div>
            <select aria-label={t('Report status')} value={filter} onChange={event => { setFilter(event.target.value as ReportFilter); setReportPage(1) }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              <option value="ALL">{t('All')}</option><option value="OPEN">{t('Open')}</option><option value="RESOLVED">{t('Resolved')}</option>
            </select>
          </div>
          <div className="space-y-3">
            {overview.reports.items.map(report => <article key={report.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-bold text-slate-900">{report.name}</div><div className="break-all text-sm text-slate-600">{report.email}</div></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${report.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{t(report.status === 'OPEN' ? 'Open' : 'Resolved')}</span></div>
              <div className="mt-3 text-xs font-semibold text-slate-500">{t(categoryLabels[report.category] ?? report.category)} · {dateFormat.format(new Date(report.createdAt))}</div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{report.description}</p>
              {report.pagePath && <div className="mt-2 break-all text-xs text-slate-500">{t('Page:')} {report.pagePath}</div>}
              <button type="button" disabled={updatingId === report.id} onClick={() => void changeStatus(report)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"><CheckCircle2 size={15} /> {t(report.status === 'OPEN' ? 'Mark resolved' : 'Reopen')}</button>
            </article>)}
            {overview.reports.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No reports with this status.')}</p>}
          </div>
          <div className="mt-4"><Pagination page={reportPage} total={overview.reports.total} pageSize={overview.reports.pageSize} onChange={setReportPage} language={language} /></div>
        </section>
      </div>
    </>}

    <section className="mt-7 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby="premium-users-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 id="premium-users-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><Crown size={21} className="text-amber-500" /> {t('Premium management')}</h2><p className="mt-1 text-sm text-slate-500">{t('Search for an account and grant Premium for 1, 3 or 12 months, or indefinitely.')}</p></div>
        <form onSubmit={event => { event.preventDefault(); setManagedPage(1); setUserQuery(search.trim()) }} className="flex w-full max-w-sm gap-2">
          <input aria-label={t('Search users')} value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Email, name or nickname')} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-xl bg-blue-600 px-3 py-2 text-white" aria-label={t('Search')}><Search size={18} /></button>
        </form>
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {managedUsers?.items.map(person => {
          const grant = person.premiumGrant
          const grantActive = Boolean(grant && (!grant.expiresAt || new Date(grant.expiresAt) > new Date()))
          return <div key={person.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0"><p className="font-bold text-slate-900">{person.fullName} {person.nickname && <span className="text-sm font-normal text-slate-500">@{person.nickname}</span>}</p><p className="break-all text-sm text-slate-600">{person.email}</p><p className="mt-1 text-xs text-slate-500">{t('Joined:')} {dateFormat.format(new Date(person.createdAt))}</p>
              <p className={`mt-1 text-xs font-bold ${person.fixedPremium || grantActive ? 'text-emerald-700' : 'text-slate-500'}`}>{person.fixedPremium ? t('Permanent Premium') : grantActive ? `${t(planLabels[grant?.plan ?? ''] ?? grant?.plan ?? '')} · ${grant?.expiresAt ? t('until {date}', { date: dateFormat.format(new Date(grant.expiresAt)) }) : t('Indefinitely')}` : t('No Premium')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label={t('Premium duration for {email}', { email: person.email })} value={grantPlans[person.id] ?? 'MONTHLY'} onChange={event => setGrantPlans(value => ({ ...value, [person.id]: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="MONTHLY">{t('1 month')}</option><option value="QUARTERLY">{t('3 months')}</option><option value="YEARLY">{t('12 months')}</option><option value="UNLIMITED">{t('Indefinitely')}</option>
              </select>
              <button type="button" disabled={updatingId === person.id} onClick={() => void grantPremium(person)} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{t('Grant Premium')}</button>
              {grant && !person.fixedPremium && <button type="button" disabled={updatingId === person.id} onClick={() => void revokePremium(person)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">{t('Revoke')}</button>}
            </div>
          </div>
        })}
        {managedUsers?.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No users found.')}</p>}
      </div>
      {managedUsers && <Pagination page={managedPage} total={managedUsers.total} pageSize={managedUsers.pageSize} onChange={setManagedPage} language={language} />}
    </section>

    <section className="mt-7 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby="payment-requests-title">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="payment-requests-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><Wallet size={21} className="text-blue-600" /> {t('Payment requests')}</h2><p className="mt-1 text-sm text-slate-500">{t('Verify that the money reached your card before approval.')}</p></div>
        <select aria-label={t('Payment request status')} value={paymentStatus} onChange={event => { setPaymentStatus(event.target.value); setPaymentPage(1) }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="SUBMITTED">{t('Needs review')}</option><option value="PENDING">{t('Pending')}</option><option value="APPROVED">{t('Approved')}</option><option value="REJECTED">{t('Rejected')}</option><option value="CANCELED">{t('Canceled')}</option><option value="ALL">{t('All')}</option></select>
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {payments?.items.map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-bold text-slate-900">{request.user.fullName} · {amount(request.amountUzs)}</p><p className="break-all text-sm text-slate-600">{request.user.email}</p><p className="mt-1 text-xs text-slate-500">{t('Order:')} {request.id} · {t(planLabels[request.plan] ?? request.plan)} · {dateFormat.format(new Date(request.createdAt))}</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{t(paymentStatusLabels[request.status] ?? request.status)}</span></div>
          {request.status === 'SUBMITTED' && <div className="flex gap-2"><button type="button" disabled={updatingId === request.id} onClick={() => void reviewPayment(request, 'APPROVE')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{t('Approve payment')}</button><button type="button" disabled={updatingId === request.id} onClick={() => void reviewPayment(request, 'REJECT')} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">{t('Reject')}</button></div>}
        </div>)}
        {payments?.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No requests with this status.')}</p>}
      </div>
      {payments && <Pagination page={paymentPage} total={payments.total} pageSize={payments.pageSize} onChange={setPaymentPage} language={language} />}
    </section>
  </div>
}
