import { useState } from 'react'
import { BadgeCheck, Gift, CreditCard, Ticket, ShieldCheck } from 'lucide-react'
import { BILLING_PRODUCTS } from '@/features/billing/catalog'
import { ownerText, type OwnerLanguage } from '@/i18n/owner'

type PremiumEvent = {
  id: string; source: string; plan: string; months: number | null; days: number | null
  createdAt: string; startsAt: string | null; expiresAt: string | null; expiryKnown: boolean; historical: boolean
  actorId: string | null; actorName: string | null; actorEmail: string | null; promoCode: string | null; giftRank: number | null
  currency: string | null; amountMinor: number | null; discountPercent: number | null; method: string | null; revokedAt: string | null
  promoDiscountMinor: number | null; wheelSpinId: string | null
}
export type ManagedUser = {
  id: string; fullName: string; email: string; nickname: string | null; createdAt: string; fixedPremium: boolean
  access: { active: boolean; tier: string; startsAt: string | null; expiresAt: string | null }
  premiumStatus: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'NONE'
  premiumPeriods: Array<{ plan: string; startsAt: string; expiresAt: string | null }>
  premiumHistory: PremiumEvent[]
  launchGift: { rank: number; claimedAt: null } | null
}
export type PremiumGrantInput = { plan: string; source: 'OWNER' | 'PAYMENT'; amountUzs?: number }

export function premiumPlanLabel(plan: string, language: OwnerLanguage, months?: number | null, days?: number | null) {
  const t = (text: string, params?: Record<string, string | number>) => ownerText(text, language, params)
  if (plan === 'UNLIMITED') return `${t('Elite')} · ${t('Indefinitely')}`
  const period = months ?? ({ MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as Record<string, number>)[plan] ?? Number(plan.match(/_(1|3|12)$/)?.[1] ?? 0)
  const tier = plan.startsWith('MAX') || plan.startsWith('TEACHER') ? t('Elite') : 'Pro'
  return `${tier}${days ? ` · ${t('{count} days', { count: days })}` : period ? ` · ${t(period === 1 ? '1 month' : '{count} months', { count: period })}` : ''}`
}

function HistoryEntry({ event, language, date }: { event: PremiumEvent; language: OwnerLanguage; date: (value: string | null) => string }) {
  const t = (text: string, params?: Record<string, string | number>) => ownerText(text, language, params)
  const source = event.source === 'LAUNCH_GIFT' ? t('Automatic gift #{number}', { number: event.giftRank ?? '—' })
    : t(({ OWNER: 'Admin gift', PAYMENT: 'Paid subscription', PROMO: 'Promo code', REFERRAL: 'Referral reward', REVOKED: 'Premium revoked' } as Record<string, string>)[event.source] ?? 'Source not recorded')
  const Icon = event.source === 'LAUNCH_GIFT' || event.source === 'OWNER' ? Gift : event.source === 'PAYMENT' ? CreditCard : event.source === 'PROMO' ? Ticket : ShieldCheck
  const money = (value: number) => event.currency === 'USD' ? `USD ${(value / 100).toFixed(2)}` : `${new Intl.NumberFormat(language).format(value / 100)} ${t('UZS')}`
  return <div className="owner-premium-event">
    <div className="owner-premium-event-heading"><span className={`owner-premium-source is-${event.source.toLowerCase()}`}><Icon size={14} />{source}</span>
      {event.source !== 'REVOKED' && <strong>{premiumPlanLabel(event.plan, language, event.months, event.days)}</strong>}
      {event.revokedAt && <span className="text-xs font-semibold text-red-700">{t('Revoked:')} {date(event.revokedAt)}</span>}
    </div>
    <dl className="owner-premium-facts">
      <div><dt>{t(event.source === 'REVOKED' ? 'Revoked:' : 'Granted:')}</dt><dd>{date(event.createdAt)}</dd></div>
      {event.source !== 'REVOKED' && <>
        <div><dt>{t('Access starts:')}</dt><dd>{date(event.startsAt)}</dd></div>
        <div><dt>{t('Access expires:')}</dt><dd>{event.expiryKnown ? event.expiresAt ? date(event.expiresAt) : t('Indefinitely') : t('Not recorded')}</dd></div>
      </>}
      <div><dt>{t('Granted by:')}</dt><dd>{event.actorName || event.actorEmail ? <>{event.actorName}{event.actorEmail && <small>{event.actorEmail}</small>}</>
        : t(['OWNER', 'REVOKED'].includes(event.source) || event.actorId || event.method === 'CARD_TRANSFER' ? 'Admin not recorded' : event.source === 'PAYMENT' && !event.method ? 'Not recorded' : 'Automatic system')}</dd></div>
      {event.promoCode && <div><dt>{t('Promo code')}</dt><dd><code>{event.promoCode}</code></dd></div>}
      {event.discountPercent !== null && <div><dt>{t('Total discount')}</dt><dd>{event.discountPercent}%</dd></div>}
      {event.promoDiscountMinor != null && <div><dt>{t('Promo discount')}</dt><dd>{money(event.promoDiscountMinor)}</dd></div>}
      {event.wheelSpinId && <div><dt>{t('Wheel discount reference')}</dt><dd><code>{event.wheelSpinId}</code></dd></div>}
      {event.amountMinor !== null && event.currency && <div><dt>{t('Paid amount')}</dt><dd>{money(event.amountMinor)}</dd></div>}
      {event.method && <div><dt>{t('Payment method')}</dt><dd>{t(({ CARD_TRANSFER: 'Manual payment', PROMO: 'Free with promo' } as Record<string, string>)[event.method] ?? event.method)}</dd></div>}
    </dl>
    {event.historical && !event.expiryKnown && <p className="owner-premium-note">{t('This older record has no saved access period. Current access dates are shown above.')}</p>}
  </div>
}

export default function OwnerPremiumUser({ person, language, busy, onGrant, onRevoke }: {
  person: ManagedUser; language: OwnerLanguage; busy: boolean
  onGrant: (person: ManagedUser, input: PremiumGrantInput) => void
  onRevoke: (person: ManagedUser) => void
}) {
  const t = (text: string, params?: Record<string, string | number>) => ownerText(text, language, params)
  const [plan, setPlan] = useState('PRO_1')
  const [source, setSource] = useState<'OWNER' | 'PAYMENT'>('OWNER')
  const [paidAmount, setPaidAmount] = useState('')
  const dateFormat = new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', language === 'uz'
    ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tashkent' }
    : { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tashkent' })
  const date = (value: string | null) => value ? dateFormat.format(new Date(value)) : t('Not recorded')
  const access = person.access
  const history = person.premiumHistory ?? []
  const periods = person.premiumPeriods ?? []
  const latestGrant = history.find(event => event.source !== 'REVOKED')
  const status = person.fixedPremium ? 'Permanent Premium' : ({ ACTIVE: 'Premium active', SCHEDULED: 'Premium scheduled', EXPIRED: 'Premium expired', NONE: 'No Premium' } as const)[person.premiumStatus] ?? 'No Premium'
  const current = access?.active ? { plan: access.tier === 'MAX' ? 'MAX' : 'PRO', startsAt: access.startsAt, expiresAt: access.expiresAt }
    : periods.filter(period => person.premiumStatus !== 'SCHEDULED' || Date.parse(period.startsAt) > Date.now()).sort((a, b) => person.premiumStatus === 'SCHEDULED' ? Date.parse(a.startsAt) - Date.parse(b.startsAt) : Date.parse(b.expiresAt ?? b.startsAt) - Date.parse(a.expiresAt ?? a.startsAt))[0]
  const money = Number(paidAmount)
  return <article className="owner-premium-user" aria-label={person.email}>
    <div className="owner-premium-user-heading">
      <div className="min-w-0"><p className="font-bold text-slate-900">{person.fullName} {person.nickname && <span className="text-sm font-normal text-slate-500">@{person.nickname}</span>}</p><p className="break-all text-sm text-slate-600">{person.email}</p><p className="mt-1 text-xs text-slate-500">{t('Joined:')} {date(person.createdAt)}</p></div>
      <span className={`owner-premium-status is-${person.fixedPremium || access?.active ? 'active' : person.premiumStatus?.toLowerCase() ?? 'none'}`}><BadgeCheck size={15} />{t(status)}</span>
    </div>
    <dl className="owner-premium-summary">
      <div><dt>{t(person.premiumStatus === 'SCHEDULED' ? 'Scheduled plan' : person.premiumStatus === 'EXPIRED' ? 'Last plan' : 'Current plan')}</dt><dd>{person.fixedPremium ? `${t('Elite')} · ${t('Indefinitely')}` : current ? premiumPlanLabel(current.plan, language) : t('Free')}</dd></div>
      <div><dt>{t('Granted:')}</dt><dd>{latestGrant ? date(latestGrant.createdAt) : access?.active || current ? t('Not recorded') : '—'}</dd></div>
      <div><dt>{t('Access starts:')}</dt><dd>{current?.startsAt ? date(current.startsAt) : access?.active ? t('Not recorded') : '—'}</dd></div>
      <div><dt>{t('Access expires:')}</dt><dd>{person.fixedPremium || current?.expiresAt === null ? t('Indefinitely') : current ? date(current.expiresAt) : '—'}</dd></div>
    </dl>
    {person.fixedPremium && <p className="owner-premium-note">{t('Permanent access from the account role or allowlist.')}</p>}
    {periods.length > 1 && <details className="owner-premium-history"><summary>{t('All access periods')} ({periods.length})</summary>{periods.map((period, index) => <p key={index} className="owner-premium-note">{premiumPlanLabel(period.plan, language)} · {date(period.startsAt)} → {period.expiresAt ? date(period.expiresAt) : t('Indefinitely')}</p>)}</details>}
    {person.launchGift && <p className="owner-premium-note">{t('Gift #{number} reserved, not claimed', { number: person.launchGift.rank })}</p>}
    {history[0] ? <HistoryEntry event={history[0]} language={language} date={date} /> : !person.fixedPremium && access?.active && <p className="owner-premium-note">{t('Source not recorded')}</p>}
    {history.length > 1 && <details className="owner-premium-history"><summary>{t('Earlier Premium history')} ({history.length - 1})</summary>{history.slice(1).map(event => <HistoryEntry key={event.id} event={event} language={language} date={date} />)}</details>}
    <form className="owner-premium-actions" onSubmit={event => { event.preventDefault(); onGrant(person, { plan, source, ...(source === 'PAYMENT' ? { amountUzs: money } : {}) }) }}>
      <label><span>{t('Premium duration')}</span><select disabled={busy} aria-label={t('Premium duration for {email}', { email: person.email })} value={plan} onChange={event => setPlan(event.target.value)}>
        {BILLING_PRODUCTS.map(product => <option key={product.code} value={product.code}>{premiumPlanLabel(product.code, language, product.months)}</option>)}
        <option value="UNLIMITED">{premiumPlanLabel('UNLIMITED', language)}</option>
      </select></label>
      <label><span>{t('Grant type')}</span><select disabled={busy} aria-label={t('Grant type for {email}', { email: person.email })} value={source} onChange={event => setSource(event.target.value as 'OWNER' | 'PAYMENT')}><option value="OWNER">{t('Admin gift')}</option><option value="PAYMENT">{t('Manual payment')}</option></select></label>
      {source === 'PAYMENT' && <label><span>{t('Paid amount')} ({t('UZS')})</span><input aria-label={t('Paid amount for {email}', { email: person.email })} type="number" min="1" max="20000000" step="1" required value={paidAmount} disabled={busy} onChange={event => setPaidAmount(event.target.value)} /></label>}
      <button type="submit" disabled={busy || source === 'PAYMENT' && (!Number.isInteger(money) || money <= 0 || money > 20_000_000)} className="owner-primary">{t('Grant Premium')}</button>
      {!person.fixedPremium && (access?.active || person.premiumStatus === 'SCHEDULED') && <button type="button" disabled={busy} onClick={() => onRevoke(person)} className="owner-secondary">{t('Revoke')}</button>}
    </form>
  </article>
}
