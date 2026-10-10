import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { AlertCircle, Crown, RefreshCw, Search, ShieldCheck, Users, Wallet } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { ownerText, type OwnerLanguage } from '@/i18n/owner'
import { premiumLanguage } from '@/i18n/premium'
import { useAuthStore } from '@/store/authStore'
import ReviewModeration from '@/components/landing/ReviewModeration'
import OwnerReportInbox from '@/components/support/OwnerReportInbox'
import OwnerAccountActivity from '@/components/owner/OwnerAccountActivity'
import { activityText } from '@/i18n/ownerActivity'
import './OwnerDashboard.css'
import { BILLING_PRODUCTS } from '@/features/billing/catalog'
import { hasOwnerAccess } from '@/utils/ownerAccess'

type Page<T> = { items: T[]; total: number; page: number; pageSize: number }
type NewUser = { id: string; fullName: string; email: string; createdAt: string }
type PremiumGrant = { plan: string; source: string; startsAt: string; expiresAt: string | null }
type ManagedUser = NewUser & { nickname: string | null; role: string; fixedPremium: boolean; premiumGrant: PremiumGrant | null; billingSubscriptions?: Array<{ plan: string; expiresAt: string }> }
type PaymentRequest = { id: string; plan: string; amountUzs: number; currency?: string; amountMinor?: number; method?: string; status: string; createdAt: string; user: NewUser }
type Overview = {
  metrics: { totalUsers: number; todayUsers: number; weekUsers: number; totalReports: number; openReports: number }
  users: Page<NewUser>
}

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
  const isOwner = hasOwnerAccess(user?.email)
  const [section, setSection] = useState('activity')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [userPage, setUserPage] = useState(1)
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
    const query = new URLSearchParams({ userPage: String(userPage) })
    void apiClient.get<Overview>(`/support/owner/overview?${query}`).then(data => {
      if (active) setOverview(data)
    }).catch(() => {
      if (active) setError(t('Could not load the overview.'))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [isOwner, userPage, reload, language])

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

  if (!isOwner) return <Navigate to="/dashboard" replace />

  const metrics = overview?.metrics
  const cards = [
    { label: t('Total users'), value: metrics?.totalUsers, icon: Users },
    { label: t('Joined today'), value: metrics?.todayUsers, icon: Users },
    { label: t('Last 7 days'), value: metrics?.weekUsers, icon: Users },
    { label: t('Open reports'), value: metrics?.openReports, icon: AlertCircle },
  ]

  return <div className="owner-dashboard mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
    <div className="owner-hero mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700"><ShieldCheck size={15} /> {t('Owner dashboard')}</div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t('Site activity')}</h1>
        <p className="mt-2 text-slate-600">{activityText('Manage your site in one place.', language)}</p>
      </div>
      <button type="button" onClick={() => setReload(value => value + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm disabled:opacity-50"><RefreshCw size={16} /> {t('Refresh')}</button>
    </div>

    <nav className="owner-navigation" aria-label={t('Owner dashboard')}>
      {[{ id: 'activity', label: 'Activity' }, { id: 'users', label: 'Users' }, { id: 'payments', label: 'Payments' }, { id: 'reports', label: 'Reports' }, { id: 'reviews', label: 'Reviews' }].map(item => <button type="button" key={item.id} aria-pressed={section === item.id} className={section === item.id ? 'is-active' : ''} onClick={() => setSection(item.id)}>{activityText(item.label, language)}{item.id === 'reports' && Boolean(overview?.metrics.openReports) && <span>{overview?.metrics.openReports}</span>}</button>)}
    </nav>
    {section === 'activity' && <OwnerAccountActivity language={language} reload={reload} />}
    {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    {loading && !overview && <p role="status" className="rounded-2xl bg-white p-6 text-slate-600">{t('Loading data…')}</p>}
    {overview && <>
      <div hidden={section !== 'users' && section !== 'reports'}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => <div key={card.label} className="owner-metric rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600"><span>{card.label}</span><card.icon size={19} className="text-red-600" /></div>
          <div className="mt-3 text-3xl font-black text-slate-950">{card.value ?? '—'}</div>
        </div>)}
      </div>

      </div>
      <div hidden={section !== 'reports'}><OwnerReportInbox language={language} reload={reload} onChanged={() => setReload(value => value + 1)} /></div>
      <div hidden={section !== 'users'}><div className="mt-7 grid items-start gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">{t('Users')}</h2><p className="mt-1 text-sm text-slate-500">{t('New registrations · total {count}', { count: overview.users.total })}</p></div></div>
          <div className="owner-users-list grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.users.items.map(person => <div key={person.id} className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/50 p-4">
              <div className="font-bold text-slate-900">{person.fullName}</div>
              <div className="break-all text-sm text-slate-600">{person.email}</div>
              <div className="mt-1 text-xs text-slate-500">{dateFormat.format(new Date(person.createdAt))}</div>
            </div>)}
            {overview.users.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No users yet.')}</p>}
          </div>
          <Pagination page={userPage} total={overview.users.total} pageSize={overview.users.pageSize} onChange={setUserPage} language={language} />
        </section>

      </div></div>
    </>}
    <div hidden={section !== 'reviews'}><ReviewModeration language={language} reload={reload} /></div>


    <div hidden={section !== 'users'}><section className="mt-7 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby="premium-users-title">
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
            <p className="text-xs text-slate-500">{person.billingSubscriptions?.map(plan => `${plan.plan} (${dateFormat.format(new Date(plan.expiresAt))})`).join(', ')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label={t('Premium duration for {email}', { email: person.email })} value={grantPlans[person.id] ?? 'MONTHLY'} onChange={event => setGrantPlans(value => ({ ...value, [person.id]: event.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                {BILLING_PRODUCTS.map(product => <option key={product.code} value={product.code}>{product.code} · ${(product.amountUsd / 100).toFixed(2)}</option>)}
                <option value="MONTHLY">{t('1 month')}</option><option value="QUARTERLY">{t('3 months')}</option><option value="YEARLY">{t('12 months')}</option><option value="UNLIMITED">{t('Indefinitely')}</option>
              </select>
              <button type="button" disabled={updatingId === person.id} onClick={() => void grantPremium(person)} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{t('Grant Premium')}</button>
              {(grant || person.billingSubscriptions?.length) && !person.fixedPremium && <button type="button" disabled={updatingId === person.id} onClick={() => void revokePremium(person)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">{t('Revoke')}</button>}
            </div>
          </div>
        })}
        {managedUsers?.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No users found.')}</p>}
      </div>
      {managedUsers && <Pagination page={managedPage} total={managedUsers.total} pageSize={managedUsers.pageSize} onChange={setManagedPage} language={language} />}
    </section>

    </div>
    <div hidden={section !== 'payments'}><section className="mt-7 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby="payment-requests-title">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="payment-requests-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><Wallet size={21} className="text-blue-600" /> {t('Payment requests')}</h2><p className="mt-1 text-sm text-slate-500">{t('Verify that the money reached your card before approval.')}</p></div>
        <select aria-label={t('Payment request status')} value={paymentStatus} onChange={event => { setPaymentStatus(event.target.value); setPaymentPage(1) }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="SUBMITTED">{t('Needs review')}</option><option value="PENDING">{t('Pending')}</option><option value="APPROVED">{t('Approved')}</option><option value="REJECTED">{t('Rejected')}</option><option value="CANCELED">{t('Canceled')}</option><option value="ALL">{t('All')}</option></select>
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {payments?.items.map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-bold text-slate-900">{request.user.fullName} · {request.currency === 'USD' ? `USD ${((request.amountMinor ?? 0) / 100).toFixed(2)}` : amount(request.amountUzs)}</p><p className="break-all text-sm text-slate-600">{request.user.email}</p><p className="mt-1 text-xs text-slate-500">{t('Order:')} {request.id} · {t(planLabels[request.plan] ?? request.plan)} · {dateFormat.format(new Date(request.createdAt))}</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{t(paymentStatusLabels[request.status] ?? request.status)}</span></div>
          {request.status === 'SUBMITTED' && <div className="flex gap-2"><button type="button" disabled={updatingId === request.id} onClick={() => void reviewPayment(request, 'APPROVE')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{t('Approve payment')}</button><button type="button" disabled={updatingId === request.id} onClick={() => void reviewPayment(request, 'REJECT')} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">{t('Reject')}</button></div>}
        </div>)}
        {payments?.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No requests with this status.')}</p>}
      </div>
      {payments && <Pagination page={paymentPage} total={payments.total} pageSize={payments.pageSize} onChange={setPaymentPage} language={language} />}
    </section></div>
  </div>
}
