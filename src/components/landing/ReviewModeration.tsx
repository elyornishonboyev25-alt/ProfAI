import { useEffect, useState } from 'react'
import { ArrowRight, Check, MessageSquareText, RefreshCw, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import type { LandingReview } from '@/lib/reviewsApi'
import { ownerText, type OwnerLanguage } from '@/i18n/owner'

type ReviewPage = { items: LandingReview[]; total: number; page: number; pageSize: number }

export default function ReviewModeration({ language, reload }: { language: OwnerLanguage; reload: number }) {
  const t = (text: string) => ownerText(text, language)
  const [status, setStatus] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ReviewPage | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void apiClient.get<ReviewPage>(`/reviews/owner?status=${status}&page=${page}`).then(result => {
      if (!active) return
      const maxPage = Math.max(1, Math.ceil(result.total / result.pageSize))
      if (page > maxPage) setPage(maxPage)
      else setData(result)
    }).catch(() => { if (active) setError(t('Could not load comments.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [status, page, refresh, reload, language])

  async function moderate(review: LandingReview, action: 'PUBLISH' | 'HIDE' | 'DELETE') {
    if (updating) return
    setUpdating(review.id)
    setError('')
    setMessage('')
    try {
      if (action === 'DELETE') await apiClient.delete(`/reviews/owner/${encodeURIComponent(review.id)}`)
      else await apiClient.patch(`/reviews/owner/${encodeURIComponent(review.id)}`, { approved: action === 'PUBLISH' })
      setMessage(t(action === 'PUBLISH' ? 'Comment published on the site.' : action === 'HIDE' ? 'Comment hidden from the site.' : 'Comment deleted.'))
      setRefresh(value => value + 1)
    } catch { setError(t('Could not update the comment.')) }
    finally { setUpdating(null) }
  }

  const dateFormat = new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })
  const maxPage = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 12)))

  return <section aria-labelledby="review-moderation-title" className="my-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 id="review-moderation-title" className="flex items-center gap-2 text-xl font-black text-slate-900"><MessageSquareText size={21} className="text-red-600" /> {t('Comment moderation')}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{t('Read each comment and check for insults before publishing. Only you can publish comments.')}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label={t('Comment status')} value={status} disabled={Boolean(updating)} onChange={event => { setStatus(event.target.value); setPage(1); setData(null); setMessage('') }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
          <option value="PENDING">{t('Awaiting approval')}</option><option value="PUBLISHED">{t('Published')}</option><option value="ALL">{t('All')}</option>
        </select>
        <button type="button" disabled={loading || Boolean(updating)} aria-label={t('Refresh')} onClick={() => setRefresh(value => value + 1)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 disabled:opacity-50"><RefreshCw size={17} /></button>
      </div>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {loading ? <p role="status" className="py-6 text-sm text-slate-500">{t('Loading comments...')}</p> : !error && <div className="mt-5 space-y-4">
      {data?.items.map(review => <article key={review.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="break-words font-bold text-slate-900">{review.name}</h3><p className="mt-1 text-xs text-slate-500">{review.exam} · {dateFormat.format(new Date(review.createdAt))}{review.rating && ` · ${review.rating}/5`}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${review.approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{t(review.approved ? 'Published' : 'Awaiting approval')}</span></div>
        {review.bandBefore !== null && review.bandAfter !== null && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span><small className="block text-slate-500">{t('Score before using ProfAI')}</small><strong>{review.bandBefore}</strong></span><ArrowRight size={18} className="text-red-500" aria-hidden="true" /><span><small className="block text-slate-500">{t('Score after using ProfAI')}</small><strong>{review.bandAfter}</strong></span></div>}
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{review.text}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={Boolean(updating) || loading} onClick={() => void moderate(review, review.approved ? 'HIDE' : 'PUBLISH')} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 ${review.approved ? 'border border-slate-200 text-slate-700' : 'bg-red-600 text-white'}`}><Check size={16} />{t(updating === review.id ? 'Saving...' : review.approved ? 'Hide from site' : 'Publish on site')}</button>
          {!review.approved && <button type="button" disabled={Boolean(updating) || loading} onClick={() => void moderate(review, 'DELETE')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"><Trash2 size={16} /> {t('Delete comment')}</button>}
        </div>
      </article>)}
      {data?.items.length === 0 && <p className="py-5 text-sm text-slate-500">{t('No comments with this status.')}</p>}
    </div>}
    {maxPage > 1 && <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600"><button type="button" disabled={page <= 1 || loading || Boolean(updating)} onClick={() => setPage(value => value - 1)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold disabled:opacity-40">{t('Previous')}</button><span>{page} / {maxPage}</span><button type="button" disabled={page >= maxPage || loading || Boolean(updating)} onClick={() => setPage(value => value + 1)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold disabled:opacity-40">{t('Next')}</button></div>}
  </section>
}
