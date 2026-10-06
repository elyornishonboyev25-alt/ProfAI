import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bell, CheckCheck, CheckCircle2, ChevronLeft, ChevronRight, Inbox, MessageSquareText, Search, Send, Users, X } from 'lucide-react'
import { ApiError, apiClient } from '@/lib/apiClient'
import { ownerText, type OwnerLanguage } from '@/i18n/owner'

type Report = { id: string; userId: string; name: string; email: string; category: string; description: string; pagePath: string | null; status: 'OPEN' | 'RESOLVED'; createdAt: string }
type ReportPage = { items: Report[]; total: number; page: number; pageSize: number }
type Reply = { id: string; title: string; message: string; createdAt: string; readAt: string | null }
const categories: Record<string, string> = { BUG: 'Technical issue', BILLING: 'Billing issue', FEATURE: 'Suggestion', OTHER: 'Other' }

function ReplyHistory({ report, language }: { report: Report; language: OwnerLanguage }) {
  const t = (text: string) => ownerText(text, language)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Reply[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    if (!open) return
    let active = true
    setItems(null); setError(false)
    void apiClient.get<{ items: Reply[] }>(`/support/owner/reports/${encodeURIComponent(report.id)}/replies`)
      .then(data => { if (active) setItems(data.items) })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [open, report.id])
  return <div className="mt-3">
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-700"><MessageSquareText size={14} />{t(open ? 'Hide reply history' : 'Reply history')}</button>
    {open && <div className="mt-2 space-y-2 border-t border-slate-200/70 pt-3">
      {error ? <p role="alert" className="text-xs text-red-700">{t('Could not load replies.')} <button type="button" onClick={() => setOpen(false)} className="underline">{t('Close')}</button></p> : !items ? <p role="status" className="text-xs text-slate-500">{t('Loading replies...')}</p> : items.length === 0 ? <p className="text-xs text-slate-500">{t('No replies yet.')}</p> : items.map(reply => <div key={reply.id} className="rounded-xl border border-white bg-white/70 p-3">
        <div className="flex flex-wrap justify-between gap-2"><strong className="break-words text-sm text-slate-800">{reply.title}</strong><span className="text-xs font-semibold text-slate-500">{t(reply.readAt ? 'Read' : 'Delivered')}</span></div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{reply.message}</p>
        <p className="mt-2 text-xs text-slate-500">{new Date(reply.createdAt).toLocaleString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US')}</p>
      </div>)}
    </div>}
  </div>
}

export default function OwnerReportInbox({ language, reload, onChanged }: { language: OwnerLanguage; reload: number; onChanged: () => void }) {
  const t = (text: string, params?: Record<string, string | number>) => ownerText(text, language, params)
  const [data, setData] = useState<ReportPage | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('ALL')
  const [category, setCategory] = useState('ALL')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState<Record<string, Report>>({})
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [resolve, setResolve] = useState(false)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const composerRef = useRef<HTMLElement>(null)
  const requestRef = useRef<{ payload: string; id: string } | null>(null)
  const sendLock = useRef(false)
  const reports = Object.values(selected)
  const recipients = new Set(reports.map(report => report.userId)).size
  const maxPage = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)))
  const dateFormat = new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })

  useEffect(() => {
    let active = true
    setLoading(true); setLoadError('')
    const params = new URLSearchParams({ reportPage: String(page), status, category, q: query })
    void apiClient.get<{ reports: ReportPage }>(`/support/owner/overview?${params}`)
      .then(result => {
        if (!active) return
        const last = Math.max(1, Math.ceil(result.reports.total / result.reports.pageSize))
        if (page > last) setPage(last)
        else setData(result.reports)
      }).catch(() => { if (active) setLoadError(t('Could not load reports.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, status, category, query, reload, language])

  function toggle(report: Report) {
    setSelected(current => {
      const next = { ...current }
      if (next[report.id]) delete next[report.id]
      else if (Object.keys(next).length < 100) next[report.id] = report
      return next
    })
    setNotice('')
  }

  function reply(report: Report) {
    setSelected({ [report.id]: report }); setNotice(''); setError('')
    titleRef.current?.focus({ preventScroll: true })
    composerRef.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  async function changeStatus(report: Report) {
    setUpdating(report.id); setError('')
    try {
      await apiClient.patch(`/support/owner/reports/${encodeURIComponent(report.id)}`, { status: report.status === 'OPEN' ? 'RESOLVED' : 'OPEN' })
      onChanged()
    } catch { setError(t('Could not change the status.')) }
    finally { setUpdating(null) }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (sendLock.current || !reports.length || title.trim().length < 3 || message.trim().length < 10) return
    sendLock.current = true; setSending(true); setError(''); setNotice('')
    const payload = { reportIds: reports.map(report => report.id).sort(), title: title.trim(), message: message.trim(), resolve }
    const fingerprint = JSON.stringify(payload)
    try {
      if (requestRef.current?.payload !== fingerprint) requestRef.current = { payload: fingerprint, id: crypto.randomUUID() }
      const result = await apiClient.post<{ recipientCount: number }>('/support/owner/reports/notify', { ...payload, requestId: requestRef.current!.id })
      setNotice(t('Notification delivered to {count} users.', { count: result.recipientCount }))
      setSelected({}); setTitle(''); setMessage(''); setResolve(false); requestRef.current = null
      onChanged()
    } catch (failure) { setError(t(failure instanceof ApiError && failure.status === 404 ? 'Some selected reports no longer exist. Clear the selection, refresh and select them again.' : 'Could not send the notification. Your draft is saved here; please try again.')) }
    finally { sendLock.current = false; setSending(false) }
  }

  return <section className="owner-report-workspace mt-7" aria-labelledby="owner-report-title">
    <div className="owner-glass owner-inbox-heading">
      <div className="flex items-start gap-4"><span className="owner-icon"><Inbox size={23} /></span><div><p className="owner-eyebrow">{t('SUPPORT CENTER')}</p><h2 id="owner-report-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950">{t('Issue reports')}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t('Read reports, reply directly, and keep your users informed.')}</p></div></div>
      <span className="owner-count">{t('{count} reports', { count: data?.total ?? 0 })}</span>
    </div>
    {notice && <p role="status" className="owner-feedback mt-4"><CheckCheck size={18} />{notice}</p>}
    {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</p>}
    {loadError && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{loadError}</p>}
    <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="owner-glass min-w-0 p-4 sm:p-6">
        <form onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()) }} className="flex gap-2">
          <label className="owner-search flex min-w-0 flex-1 items-center gap-2"><Search size={17} className="shrink-0 text-slate-400" /><input aria-label={t('Search reports')} value={search} onChange={event => setSearch(event.target.value)} maxLength={200} placeholder={t('Search message, name, email or page')} className="min-w-0 w-full bg-transparent text-sm outline-none" /></label>
          <button type="submit" className="owner-secondary">{t('Search')}</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <select aria-label={t('Report status')} value={status} onChange={event => { setStatus(event.target.value); setPage(1) }} className="owner-field min-w-0 flex-1 text-sm"><option value="ALL">{t('All statuses')}</option><option value="OPEN">{t('Open')}</option><option value="RESOLVED">{t('Resolved')}</option></select>
          <select aria-label={t('Type of issue')} value={category} onChange={event => { setCategory(event.target.value); setPage(1) }} className="owner-field min-w-0 flex-1 text-sm"><option value="ALL">{t('All issue types')}</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}</select>
        </div>
        <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500"><span>{t('Select similar reports to send one update.')}</span><button type="button" disabled={loading || Boolean(loadError) || sending || !data?.items.length} onClick={() => setSelected(current => {
          const next = { ...current }
          for (const report of data?.items ?? []) { if (Object.keys(next).length >= 100) break; next[report.id] = report }
          return next
        })} className="min-h-10 font-bold text-red-700 disabled:opacity-40">{t('Select this page')}</button></div>
        {loading ? <div role="status" className="owner-empty"><Inbox size={28} /><p>{t('Loading reports...')}</p></div> : loadError && !data ? <button type="button" onClick={onChanged} className="owner-secondary">{t('Refresh')}</button> : <div className="space-y-4" aria-busy={loading}>
          {!loadError && data?.items.map(report => <article key={report.id} className={`owner-report-card ${selected[report.id] ? 'is-selected' : ''}`}>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={Boolean(selected[report.id])} disabled={sending || (!selected[report.id] && reports.length >= 100)} onChange={() => toggle(report)} aria-label={t('Select report from {name}', { name: report.name })} className="mt-1 h-5 w-5 shrink-0 accent-red-600" />
              <div className="min-w-0 flex-1"><h3 className="break-words font-black text-slate-900">{report.name}</h3><p className="mt-0.5 break-all text-xs text-slate-500">{report.email}</p></div>
              <span className={`owner-status ${report.status === 'OPEN' ? 'is-open' : ''}`}>{t(report.status === 'OPEN' ? 'Open' : 'Resolved')}</span>
            </div>
            <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold text-slate-500"><span className="text-red-700">{t(categories[report.category] ?? report.category)}</span><span aria-hidden="true">·</span><time dateTime={report.createdAt}>{dateFormat.format(new Date(report.createdAt))}</time></p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{report.description}</p>
            {report.pagePath && <p className="mt-3 break-all rounded-lg bg-slate-200/40 px-3 py-2 font-mono text-[11px] text-slate-600">{t('Page:')} {report.pagePath}</p>}
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={sending} onClick={() => reply(report)} className="owner-primary"><Send size={15} />{t('Reply to user')}</button><button type="button" disabled={Boolean(updating) || sending} onClick={() => void changeStatus(report)} className="owner-secondary"><CheckCircle2 size={15} />{t(updating === report.id ? 'Saving...' : report.status === 'OPEN' ? 'Mark resolved' : 'Reopen')}</button></div>
            <ReplyHistory key={`${report.id}-${reload}`} report={report} language={language} />
          </article>)}
          {!loadError && data?.items.length === 0 && <div className="owner-empty"><Inbox size={30} /><h3 className="font-bold text-slate-700">{t('No matching reports')}</h3><p>{t('Try another search or change the filters.')}</p></div>}
          {loadError && data && <button type="button" onClick={onChanged} className="owner-secondary">{t('Refresh')}</button>}
        </div>}
        {maxPage > 1 && <div className="mt-5 flex items-center justify-between border-t border-slate-200/70 pt-4"><button type="button" aria-label={t('Previous')} disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)} className="owner-secondary"><ChevronLeft size={17} /></button><span className="text-xs font-bold text-slate-500">{page} / {maxPage}</span><button type="button" aria-label={t('Next')} disabled={page >= maxPage || loading} onClick={() => setPage(value => value + 1)} className="owner-secondary"><ChevronRight size={17} /></button></div>}
      </div>
      <aside ref={composerRef} className="owner-glass owner-composer min-w-0 p-5 sm:p-6 xl:sticky xl:top-6" aria-labelledby="owner-compose-title">
        <div className="flex items-center gap-3"><span className="owner-icon"><Bell size={21} /></span><div><p className="owner-eyebrow">{t('USER NOTIFICATION')}</p><h3 id="owner-compose-title" className="mt-1 text-lg font-black text-slate-950">{t('Send an update')}</h3></div></div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{t('Your message will appear in the selected users’ Notifications.')}</p>
        <div className="owner-recipient-box mt-5">
          <div className="flex items-center justify-between gap-2"><p className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><Users size={16} />{t('{count} recipients', { count: recipients })}</p>{reports.length > 0 && <button type="button" disabled={sending} onClick={() => setSelected({})} className="min-h-10 text-xs font-bold text-red-700">{t('Clear selection')}</button>}</div>
          {!reports.length ? <p className="mt-2 text-xs leading-5 text-slate-500">{t('Choose a report or select several similar reports.')}</p> : <><div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">{reports.map(report => <button type="button" disabled={sending} key={report.id} onClick={() => toggle(report)} title={report.email} aria-label={t('Remove report from {name}', { name: report.name })} className="owner-recipient"><span className="max-w-40 truncate">{report.name}</span><X size={12} /></button>)}</div><p className="mt-3 text-xs text-slate-500">{t('Each user receives one notification per update. Selection limit: 100 reports.')}</p></>}
        </div>
        <form onSubmit={event => void submit(event)} className="mt-5 space-y-4">
          <fieldset disabled={sending} className="space-y-4">
            <label className="block text-xs font-bold text-slate-700">{t('Notification title')}<input ref={titleRef} required minLength={3} maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder={t('An update on your report')} className="owner-field mt-2 w-full text-sm" /></label>
            <label className="block text-xs font-bold text-slate-700">{t('Message')}<textarea required minLength={10} maxLength={3000} rows={5} value={message} onChange={event => setMessage(event.target.value)} placeholder={t('Explain what changed or how the user can proceed.')} className="owner-field mt-2 w-full resize-y text-sm leading-6" /><span className="mt-1 block text-right text-[11px] font-medium text-slate-500">{message.length} / 3000</span></label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/70 bg-white/40 p-3"><input type="checkbox" checked={resolve} onChange={event => setResolve(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-red-600" /><span><span className="block text-xs font-bold text-slate-700">{t('Also mark selected reports resolved')}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{t('Use this when the reported issue has been fixed.')}</span></span></label>
          </fieldset>
          {(title.trim() || message.trim()) && <div className="owner-preview"><p className="owner-eyebrow mb-3">{t('NOTIFICATION PREVIEW')}</p><div className="flex items-start gap-3"><span className="owner-preview-icon"><MessageSquareText size={17} /></span><div className="min-w-0"><p className="break-words text-sm font-black text-slate-800">{title.trim() || t('Notification title')}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">{message.trim() || t('Message')}</p><p className="mt-2 text-[10px] font-bold text-red-700">ProfAI · {t('Support team')}</p></div></div></div>}
          <button type="submit" disabled={sending || Boolean(updating) || !recipients || title.trim().length < 3 || message.trim().length < 10} className="owner-primary w-full justify-center !py-3.5"><Send size={17} />{t(sending ? 'Sending...' : 'Send notification')}</button>
        </form>
      </aside>
    </div>
  </section>
}
