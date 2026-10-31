import { useEffect, useState } from 'react'
import { TicketPercent } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { ownerText, type OwnerLanguage } from '@/i18n/owner'
import OwnerPaymentDetails, { type OwnerPayment } from './OwnerPaymentDetails'

type PromotionUser = {
  id: string; fullName: string; email: string
  promoCode: { code: string; days: number; redeemedAt: string | null } | null
  referralReceived: { inviter: { fullName: string; referralCode: string | null } } | null
  wheelSpin: { id: string; percent: number; expiresAt: string; usedAt: string | null } | null
  paymentRequests: OwnerPayment[]
}
type PromotionPage = { items: PromotionUser[]; total: number; page: number; pageSize: number }

export default function OwnerPromotions({ language, reload }: { language: OwnerLanguage; reload: number }) {
  const t = (text: string, params?: Record<string, string | number>) => ownerText(text, language, params)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PromotionPage | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setData(null); setError(false)
    void apiClient.get<PromotionPage>(`/billing/owner/promotions?page=${page}`).then(result => {
      if (active) {
        const max = Math.max(1, Math.ceil(result.total / result.pageSize))
        if (page > max) setPage(max)
        else setData(result)
      }
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [page, reload, language, retry])
  const dateFormat = new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tashkent' })
  const maxPage = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)))
  return <section className="mt-7 p-5 sm:p-6" aria-labelledby="owner-promotions-title">
    <h2 id="owner-promotions-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><TicketPercent size={21} />{t('Promo users')}{data && <span className="owner-count">{data.total}</span>}</h2>
    <p className="mt-2 text-sm text-slate-500">{t('Redeemed promo codes, referrals and wheel discounts.')}</p>
    {error ? <p role="alert" className="mt-4 text-sm text-red-700">{t('Could not load promotions.')} <button type="button" onClick={() => setRetry(value => value + 1)} className="underline">{t('Retry')}</button></p> : !data ? <p role="status" className="py-5 text-sm text-slate-500">{t('Loading data…')}</p> : <div className="owner-promotions-list mt-5 grid gap-4 sm:grid-cols-2">
      {data.items.map(person => {
        const spin = person.wheelSpin
        const order = person.paymentRequests[0]
        return <article key={person.id} className="min-w-0 rounded-2xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900">{person.fullName}</h3><p className="break-all text-sm text-slate-600">{person.email}</p>
          {person.promoCode?.redeemedAt && <div className="owner-promotion-source"><strong>{t('Promo code')}: <code>{person.promoCode.code}</code></strong><p>{t('{days} free days', { days: person.promoCode.days })} · {dateFormat.format(new Date(person.promoCode.redeemedAt))}</p></div>}
          {person.referralReceived && <div className="owner-promotion-source"><strong>{t('Referral code')}: <code>{person.referralReceived.inviter.referralCode ?? '—'}</code></strong><p>{person.referralReceived.inviter.fullName}</p></div>}
          {spin && <div className="owner-promotion-source"><strong>{t('Wheel discount')} · {spin.percent}%</strong><p>{t(spin.usedAt ? 'Used' : new Date(spin.expiresAt) <= new Date() ? 'Expired' : 'Active')} · {dateFormat.format(new Date(spin.expiresAt))}</p><code className="break-all">{spin.id}</code></div>}
          {order ? <div className="mt-4 border-t border-slate-200 pt-3"><p className="break-all text-xs text-slate-500">{t('Latest discounted order')}: {order.id} · {order.plan}</p><p className="mt-1 text-xs font-bold text-slate-600">{t(({ APPROVED: 'Approved', PENDING: 'Pending', PROCESSING: 'Processing', SUBMITTED: 'Needs review', CANCELED: 'Canceled', REJECTED: 'Rejected' } as Record<string, string>)[order.status] ?? order.status)}</p><OwnerPaymentDetails payment={order} language={language} /></div> : <p className="mt-4 text-sm text-slate-500">{t('No payment order yet.')}</p>}
        </article>
      })}
      {data.items.length === 0 && <p className="py-4 text-sm text-slate-500">{t('No promo users yet.')}</p>}
    </div>}
    {maxPage > 1 && <div className="mt-5 flex items-center justify-between text-sm"><button type="button" disabled={page <= 1 || !data} onClick={() => setPage(value => value - 1)} className="owner-secondary">{t('Previous')}</button><span>{page} / {maxPage}</span><button type="button" disabled={page >= maxPage || !data} onClick={() => setPage(value => value + 1)} className="owner-secondary">{t('Next')}</button></div>}
  </section>
}
