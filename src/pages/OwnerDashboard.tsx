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
import OwnerPromotions from '@/components/owner/OwnerPromotions'
import OwnerPaymentDetails, { paymentAmount, type OwnerPayment } from '@/components/owner/OwnerPaymentDetails'
import { useOwnerUpdates, type OwnerSection } from '@/components/owner/useOwnerUpdates'
import { activityText } from '@/i18n/ownerActivity'
import './OwnerDashboard.css'
import OwnerPremiumUser, { premiumPlanLabel, type ManagedUser, type PremiumGrantInput } from '@/components/owner/OwnerPremiumUser'
import { hasOwnerAccess } from '@/utils/ownerAccess'

type Page<T> = { items: T[]; total: number; page: number; pageSize: number }
type NewUser = { id: string; fullName: string; email: string; createdAt: string; lastSeenAt?: string | null }
type PaymentRequest = OwnerPayment & { method?: string; user: NewUser & { promoCode?: { code: string; redeemedAt: string | null } | null } }
type Overview = {
  metrics: { totalUsers: number; todayUsers: number; weekUsers: number; totalReports: number; openReports: number }
  users: Page<NewUser>
}

const paymentStatusLabels: Record<string, string> = { SUBMITTED: 'Needs review', PENDING: 'Pending', PROCESSING: 'Processing', APPROVED: 'Approved', REJECTED: 'Rejected', CANCELED: 'Canceled' }

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
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tashkent' })
  const amount = (value: number) => `${new Intl.NumberFormat(locale).format(value)} ${t('UZS')}`
  const user = useAuthStore(state => state.user)
  const isOwner = hasOwnerAccess(user?.email, user?.nickname)
  const [section, setSection] = useState<OwnerSection>('activity')
  const [userPeriod, setUserPeriod] = useState('ALL')
  const [userKind, setUserKind] = useState('JOINED')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [overviewFailed, setOverviewFailed] = useState(false)
  const [userPage, setUserPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [managedPage, setManagedPage] = useState(1)
  const [managedUsers, setManagedUsers] = useState<Page<ManagedUser> | null>(null)
  const [managedLoading, setManagedLoading] = useState(true)
  const [managedFailed, setManagedFailed] = useState(false)
  const [paymentPage, setPaymentPage] = useState(1)
  const [paymentStatus, setPaymentStatus] = useState('ALL')
  const [paymentLoading, setPaymentLoading] = useState(true)
  const [payments, setPayments] = useState<Page<PaymentRequest> | null>(null)
  const [paymentPromotion, setPaymentPromotion] = useState('ALL')
  const { counts, markSeen } = useOwnerUpdates(user?.id, isOwner, reload)

  useEffect(() => {
    if (!isOwner) return
    let active = true
    setLoading(true)
    setOverviewFailed(false)
    setError('')
    const query = new URLSearchParams({ userPage: String(userPage), userPeriod, userKind })
    void apiClient.get<Overview>(`/support/owner/overview?${query}`).then(data => {
      if (active) setOverview(data)
    }).catch(() => {
      if (active) { setOverviewFailed(true); setError(t('Could not load the overview.')) }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [isOwner, userPage, userPeriod, userKind, reload, language])

  useEffect(() => {
    if (!isOwner) return
    let active = true
    const query = new URLSearchParams({ page: String(managedPage), q: userQuery })
    setManagedUsers(null)
    setManagedLoading(true)
    setManagedFailed(false)
    void apiClient.get<Page<ManagedUser>>(`/billing/owner/users?${query}`).then(data => {
      if (active) setManagedUsers(data)
    }).catch(() => { if (active) setManagedFailed(true) }).finally(() => { if (active) setManagedLoading(false) })
    return () => { active = false }
  }, [isOwner, managedPage, userQuery, reload, language])

  useEffect(() => {
    if (!isOwner) return
    let active = true
    setPayments(null)
    setPaymentLoading(true)
    const query = new URLSearchParams({ page: String(paymentPage), status: paymentStatus, promotion: paymentPromotion })
    void apiClient.get<Page<PaymentRequest>>(`/billing/owner/requests?${query}`).then(data => {
      if (active) setPayments(data)
    }).catch(() => { if (active) setError(t('Could not load payment requests.')) }).finally(() => { if (active) setPaymentLoading(false) })
    return () => { active = false }
  }, [isOwner, paymentPage, paymentStatus, paymentPromotion, reload, language])

  async function grantPremium(person: ManagedUser, input: PremiumGrantInput) {
    setUpdatingId(person.id)
    setError('')
    try {
      await apiClient.put(`/billing/owner/users/${person.id}/grant`, input)
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
  const selectUsers = (period: string) => { setUserPage(1); setUserPeriod(period); setSection('users') }
  const cards = [
    { label: t(userKind === 'ACTIVE' ? 'Active users' : 'Total users'), value: metrics?.totalUsers, icon: Users, active: section === 'users' && userPeriod === 'ALL', onClick: () => selectUsers('ALL') },
    { label: t(userKind === 'ACTIVE' ? 'Active today' : 'Joined today'), value: metrics?.todayUsers, icon: Users, active: section === 'users' && userPeriod === 'TODAY', onClick: () => selectUsers('TODAY') },
    { label: t('Last 7 days'), value: metrics?.weekUsers, icon: Users, active: section === 'users' && userPeriod === 'WEEK', onClick: () => selectUsers('WEEK') },
    { label: t('Open reports'), value: metrics?.openReports, icon: AlertCircle, active: section === 'reports', onClick: () => setSection('reports') },
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
      {([{ id: 'activity', label: 'Activity' }, { id: 'users', label: 'Users' }, { id: 'payments', label: 'Payments' }, { id: 'reports', label: 'Reports' }, { id: 'reviews', label: 'Reviews' }] as const).map(item => <button type="button" key={item.id} aria-pressed={section === item.id} className={section === item.id ? 'is-active' : ''} onClick={() => { markSeen(item.id); setSection(item.id); setReload(value => value + 1) }}>{activityText(item.label, language)}{Boolean(counts?.[item.id]) && <span className="owner-update-badge" aria-label={t(item.id === 'reports' ? '{count} reports awaiting reply' : '{count} new updates', { count: counts![item.id] })}>{counts![item.id] > 99 ? '99+' : counts![item.id]}</span>}</button>)}
    </nav>
    {section === 'activity' && <OwnerAccountActivity language={language} reload={reload} />}
    {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    {loading && !overview && <p role="status" className="rounded-2xl bg-white p-6 text-slate-600">{t('Loading data…')}</p>}
    {overview && <>
      <div hidden={section !== 'users' && section !== 'reports'}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => <button type="button" key={card.label} aria-pressed={card.active} onClick={card.onClick} className={`owner-metric rounded-2xl border border-slate-200 bg-white/90 p-5 text-left shadow-sm ${card.active ? 'is-active' : ''}`}>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600"><span>{card.label}</span><card.icon size={19} className="text-red-600" /></div>
          <div className="mt-3 text-3xl font-black text-slate-950">{card.value ?? '—'}</div>
        </button>)}
      </div>

      </div>
      <div hidden={section !== 'reports'}><OwnerReportInbox language={language} reload={reload} onChanged={() => setReload(value => value + 1)} /></div>
      <div hidden={section !== 'users'}><div className="mt-7 grid items-start gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">{t('Users')}</h2><p className="mt-1 text-sm text-slate-500">{t(userKind === 'ACTIVE' ? 'Active users' : 'New registrations')} · {t(({ ALL: 'All time', TODAY: 'Today', WEEK: 'Last 7 days' } as Record<string, string>)[userPeriod])} · {overview.users.total}</p></div>
            <select aria-label={t('User activity type')} value={userKind} onChange={event => { setUserKind(event.target.value); setUserPage(1) }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="JOINED">{t('New registrations')}</option><option value="ACTIVE">{t('Active users')}</option></select>
          </div>
          <p className="mb-4 text-xs text-slate-500">{t('Dates and periods use Tashkent time (UTC+5).')}</p>
          {loading ? <p role="status" className="py-5 text-sm text-slate-500">{t('Loading data…')}</p> : overviewFailed ? null : <div className="owner-users-list grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.users.items.map(person => <div key={person.id} className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/50 p-4">
              <div className="font-bold text-slate-900">{person.fullName}</div>
              <div className="break-all text-sm text-slate-600">{person.email}</div>
              <div className="mt-1 text-xs text-slate-500">{t(userKind === 'ACTIVE' ? 'Last active:' : 'Joined:')} {userKind === 'ACTIVE' ? person.lastSeenAt ? dateFormat.format(new Date(person.lastSeenAt)) : '—' : dateFormat.format(new Date(person.createdAt))}</div>
            </div>)}
            {overview.users.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No users found.')}</p>}
          </div>}
          {!loading && !overviewFailed && <Pagination page={userPage} total={overview.users.total} pageSize={overview.users.pageSize} onChange={setUserPage} language={language} />}
        </section>

      </div></div>
    </>}
    <div hidden={section !== 'reviews'}><ReviewModeration language={language} reload={reload} /></div>


    <div hidden={section !== 'users'}><section className="mt-7 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby="premium-users-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 id="premium-users-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><Crown size={21} className="text-amber-500" /> {t('Premium management')}</h2><p className="mt-1 text-sm text-slate-500">{t('See access status, sources and dates. Grant Pro or Elite with a clear duration.')}</p></div>
        <form onSubmit={event => { event.preventDefault(); setManagedPage(1); setUserQuery(search.trim()) }} className="flex w-full max-w-sm gap-2">
          <input aria-label={t('Search users')} value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Email, name or nickname')} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-xl bg-blue-600 px-3 py-2 text-white" aria-label={t('Search')}><Search size={18} /></button>
        </form>
      </div>
      <p className="mt-4 text-xs text-slate-500">{t('Dates and periods use Tashkent time (UTC+5).')} {t('New grants extend the selected plan from its current expiry.')}</p>
      <div className="owner-premium-list mt-5">
        {managedLoading && <p role="status" className="py-5 text-sm text-slate-500">{t('Loading data…')}</p>}
        {managedFailed && <p role="alert" className="py-5 text-sm text-red-700">{t('Could not load users.')}</p>}
        {managedUsers?.items.map(person => <OwnerPremiumUser key={person.id} person={person} language={language} busy={updatingId !== null} onGrant={(person, input) => void grantPremium(person, input)} onRevoke={person => void revokePremium(person)} />)}
        {managedUsers?.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No users found.')}</p>}
      </div>
      {managedUsers && <Pagination page={managedPage} total={managedUsers.total} pageSize={managedUsers.pageSize} onChange={setManagedPage} language={language} />}
    </section>

    </div>
    <div hidden={section !== 'payments'}><section className="mt-7 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm sm:p-6" aria-labelledby="payment-requests-title">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="payment-requests-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><Wallet size={21} className="text-blue-600" /> {t('Payment requests')}</h2><p className="mt-1 text-sm text-slate-500">{t('Payment amounts, statuses and applied discounts.')}</p></div>
        <select aria-label={t('Payment request status')} value={paymentStatus} onChange={event => { setPaymentStatus(event.target.value); setPaymentPage(1) }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="SUBMITTED">{t('Needs review')}</option><option value="PENDING">{t('Pending')}</option><option value="PROCESSING">{t('Processing')}</option><option value="APPROVED">{t('Approved')}</option><option value="REJECTED">{t('Rejected')}</option><option value="CANCELED">{t('Canceled')}</option><option value="ALL">{t('All')}</option></select>
        <select aria-label={t('Promotion filter')} value={paymentPromotion} onChange={event => { setPaymentPromotion(event.target.value); setPaymentPage(1) }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"><option value="ALL">{t('All payments')}</option><option value="DISCOUNTED">{t('Discounted payments')}</option></select>
      </div>
      {paymentLoading && <p role="status" className="py-5 text-sm text-slate-500">{t('Loading data…')}</p>}
      <div className="mt-5 divide-y divide-slate-100">
        {payments?.items.map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-bold text-slate-900">{request.user.fullName} · {paymentAmount(request, language)}</p><p className="break-all text-sm text-slate-600">{request.user.email}</p>{request.user.promoCode?.redeemedAt && <p className="mt-2 text-xs font-semibold text-rose-800">{t('Account promo code')}: <code>{request.user.promoCode.code}</code></p>}<p className="mt-1 text-xs text-slate-500">{t('Order:')} {request.id} · {premiumPlanLabel(request.plan, language)} · {dateFormat.format(new Date(request.createdAt))}</p><span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{t(paymentStatusLabels[request.status] ?? request.status)}</span><OwnerPaymentDetails payment={request} language={language} /></div>
          {request.status === 'SUBMITTED' && request.method === 'CARD_TRANSFER' && <div className="flex gap-2"><button type="button" disabled={updatingId === request.id} onClick={() => void reviewPayment(request, 'APPROVE')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{t('Approve payment')}</button><button type="button" disabled={updatingId === request.id} onClick={() => void reviewPayment(request, 'REJECT')} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">{t('Reject')}</button></div>}
        </div>)}
        {payments?.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No requests with this status.')}</p>}
      </div>
      {payments && <Pagination page={paymentPage} total={payments.total} pageSize={payments.pageSize} onChange={setPaymentPage} language={language} />}
    </section>{section === 'payments' && <OwnerPromotions language={language} reload={reload} />}</div>
  </div>
}
