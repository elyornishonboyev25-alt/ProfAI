import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, RefreshCw, Send } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { ownerText, type OwnerLanguage } from '@/i18n/owner'

type Message = {
  id: string; kind: string; title: string | null; message: string; authorName: string | null
  authorEmail?: string | null; createdAt: string; readAt?: string | null
}
type Thread = {
  items: Message[]; nextCursor: string | null
  report?: { description: string; status: string; needsReply: boolean; createdAt: string }
}

function mergeMessages(older: Message[], newer: Message[]) {
  return [...new Map([...older, ...newer].map(item => [item.id, item])).values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
}

export default function ReportConversation({ reportId, language, owner = false }: { reportId: string; language: OwnerLanguage; owner?: boolean }) {
  const t = (text: string) => ownerText(text, language)
  const path = owner ? `/support/owner/reports/${encodeURIComponent(reportId)}/replies` : `/support/reports/${encodeURIComponent(reportId)}/thread`
  const [data, setData] = useState<Thread | null>(null)
  const [error, setError] = useState('')
  const [sendError, setSendError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [sent, setSent] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const request = useRef<{ message: string; id: string } | null>(null)
  const sendLock = useRef(false)
  const active = useRef(true)
  const dateFormat = new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tashkent' })

  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    let cancelled = false, inFlight = false
    const load = async () => {
      if (inFlight || document.visibilityState === 'hidden') return
      inFlight = true
      try {
        const result = await apiClient.get<Thread>(path)
        if (!cancelled) {
          setData(current => {
            if (!current) return result
            // If more than a page arrived while away, restart pagination so the
            // gap stays reachable through "Load earlier messages".
            if (result.nextCursor && !result.items.some(item => current.items.some(previous => previous.id === item.id))) return result
            return { ...result, items: mergeMessages(current.items, result.items), nextCursor: current.nextCursor }
          })
          setError('')
        }
      } catch { if (!cancelled) setError('Could not load replies.') }
      finally { inFlight = false }
    }
    void load()
    const timer = window.setInterval(() => void load(), 20_000)
    window.addEventListener('focus', load)
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener('focus', load) }
  }, [path, refresh])

  async function loadOlder() {
    if (!data?.nextCursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const result = await apiClient.get<Thread>(`${path}?${new URLSearchParams({ before: data.nextCursor })}`)
      if (active.current) { setData(current => ({ ...current, items: mergeMessages(result.items, current?.items ?? []), nextCursor: result.nextCursor })); setError('') }
    } catch { if (active.current) setError('Could not load replies.') }
    finally { if (active.current) setLoadingOlder(false) }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const message = draft.trim()
    if (!message || sendLock.current) return
    sendLock.current = true; setSending(true); setSendError(''); setSent(false)
    if (request.current?.message !== message) request.current = { message, id: crypto.randomUUID() }
    try {
      await apiClient.post(`/support/reports/${encodeURIComponent(reportId)}/replies`, { message, requestId: request.current.id })
      if (active.current) { setDraft(''); request.current = null; setSent(true); setRefresh(value => value + 1) }
    } catch { if (active.current) setSendError('Could not send your reply. Your draft is saved here; please try again.') }
    finally { sendLock.current = false; if (active.current) setSending(false) }
  }

  const actions: Record<string, string> = { IGNORED: 'Ignored', REOPENED: 'Reopened', RESOLVED: 'Resolved' }
  return <div className="report-conversation mt-3 space-y-3 border-t border-slate-200/70 pt-3">
    <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-slate-700">{t('Conversation')}</p><button type="button" onClick={() => setRefresh(value => value + 1)} aria-label={t('Refresh conversation')} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-600"><RefreshCw size={14} /></button></div>
    {error && <p role="alert" className="text-xs leading-5 text-red-700">{t(error)}</p>}
    {!data && !error && <p role="status" className="text-xs text-slate-500">{t('Loading replies...')}</p>}
    {data?.report && <div className="rounded-xl bg-slate-100 p-3"><p className="text-[11px] font-bold text-slate-500">{t('Your report')}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{data.report.description}</p>{data.report.status !== 'IGNORED' && <p className="mt-2 text-xs font-semibold text-red-700">{t(data.report.needsReply ? 'Awaiting admin reply' : data.report.status === 'RESOLVED' ? 'Resolved' : 'Answered')}</p>}</div>}
    {data?.nextCursor && <button type="button" disabled={loadingOlder} onClick={() => void loadOlder()} className="min-h-10 text-xs font-bold text-red-700">{t(loadingOlder ? 'Loading replies...' : 'Load earlier messages')}</button>}
    <div className="max-h-96 space-y-3 overflow-y-auto overscroll-contain" aria-live="polite">
      {data?.items.map(item => <div key={item.id} className={`rounded-xl border p-3 ${item.kind === 'USER_REPLY' ? 'border-red-100 bg-red-50/60' : 'border-slate-200/70 bg-white/80'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><strong className="break-words text-slate-800">{item.authorName || t(item.kind === 'USER_REPLY' ? 'User' : 'Admin not recorded')}{item.kind !== 'USER_REPLY' && <span className="ml-1 font-medium text-slate-500">· {t('Admin')}</span>}</strong>{owner && item.kind === 'ADMIN_REPLY' && <span className="font-semibold text-slate-500">{t(item.readAt ? 'Read' : 'Delivered')}</span>}</div>
        {owner && item.authorEmail && <p className="mt-1 break-all text-[11px] text-slate-500">{item.authorEmail}</p>}
        {item.title && <p className="mt-2 break-words text-sm font-bold text-slate-800">{item.title}</p>}
        {actions[item.kind] ? <p className="mt-2 text-xs font-bold text-slate-600">{t(actions[item.kind])}</p> : <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{item.message}</p>}
        <time dateTime={item.createdAt} className="mt-2 block text-[11px] text-slate-500">{dateFormat.format(new Date(item.createdAt))}</time>
      </div>)}
      {data?.items.length === 0 && <p className="text-xs text-slate-500">{t('No replies yet.')}</p>}
    </div>
    {!owner && data && <form onSubmit={event => void submit(event)} className="space-y-2">
      {sendError && <p role="alert" className="text-xs leading-5 text-red-700">{t(sendError)}</p>}
      <label className="block text-xs font-bold text-slate-700">{t('Reply about this issue')}<textarea required maxLength={3000} rows={3} disabled={sending} value={draft} onChange={event => { setDraft(event.target.value); setSent(false) }} placeholder={t('Ask a follow-up question about this report.')} className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-red-300 disabled:opacity-50" /></label>
      <button type="submit" disabled={sending || !draft.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{t(sending ? 'Sending...' : 'Send reply')}</button>
      {sent && <p role="status" className="text-xs font-semibold text-emerald-700">{t('Your reply was sent. An admin will respond here.')}</p>}
    </form>}
  </div>
}
