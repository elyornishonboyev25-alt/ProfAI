import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCircle2, Loader2, MessageSquareText, Send } from 'lucide-react'
import { premiumLanguage } from '@/i18n/premium'
import { learningCenterApi } from './api'
import { classText } from './messages'
import { Avatar, CenterPanel, inputClass, primaryButton } from './components'
import type { StudentDetail } from './types'

export default function TeacherNotesPanel({ slug, studentId, notes, onSent }: {
  slug: string; studentId: string; notes: StudentDetail['notes']; onSent: () => Promise<unknown>
}) {
  const { i18n } = useTranslation()
  const language = premiumLanguage(i18n.resolvedLanguage ?? i18n.language ?? 'en')
  const textFor = (text: Parameters<typeof classText>[0]) => classText(text, language)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function send(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const note = draft.trim()
    if (note.length < 2 || note.length > 2000) { setError(textFor('Write a note with 2 to 2,000 characters.')); return }
    setBusy(true); setError(''); setSent(false)
    try {
      await learningCenterApi.addNote(slug, studentId, note)
      setDraft(''); setSent(true)
      // Delivery already succeeded; a history refresh must not invite a duplicate send.
      await onSent().catch(() => {})
    } catch { setError(textFor('Could not send your note. Your draft is saved here; please try again.')) }
    finally { setBusy(false) }
  }

  return <CenterPanel className="lc-coaching-panel p-5 sm:p-6">
    <div className="flex items-start gap-3">
      <span className="lc-coaching-icon"><MessageSquareText className="h-5 w-5" /></span>
      <div className="min-w-0"><p className="lc-eyebrow">{textFor('Student communication')}</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{textFor('Teacher notes')}</h2></div>
    </div>
    <p className="mt-3 flex items-start gap-2 text-xs font-medium leading-5 text-slate-600"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />{textFor('New notes are sent to this student’s notifications.')}</p>
    <form onSubmit={send} className="mt-5">
      <label htmlFor={`teacher-note-${studentId}`} className="mb-2 block text-xs font-bold text-slate-700">{textFor('Your message')}</label>
      <textarea id={`teacher-note-${studentId}`} value={draft} disabled={busy} maxLength={2000} onChange={(event) => { setDraft(event.target.value); setSent(false); setError('') }} rows={4} className={`${inputClass} lc-note-input h-auto py-3`} placeholder={textFor('Write feedback, a reminder or the next step…')} />
      <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[11px] font-semibold tabular-nums text-slate-500">{draft.length.toLocaleString()} / 2,000</span><button type="submit" disabled={busy || draft.trim().length < 2} className={primaryButton}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{textFor(busy ? 'Sending…' : 'Save note')}</button></div>
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-800">{error}</p>}
      {sent && <p role="status" className="lc-note-success mt-3 flex items-start gap-2 p-3 text-xs font-semibold leading-5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{textFor('Note sent to the student’s notifications.')}</p>}
    </form>
    <div className="lc-note-history mt-6 space-y-3">{notes.length ? notes.map((entry) => <article key={entry.id} className="lc-note-card p-4">
      <div className="mb-3 flex items-center gap-2.5"><Avatar name={entry.author.fullName} url={entry.author.avatarUrl} size="sm" /><div className="min-w-0"><p className="break-words text-xs font-bold text-slate-800">{entry.author.fullName}</p><time dateTime={entry.createdAt} className="text-[10px] font-semibold text-slate-500">{new Date(entry.createdAt).toLocaleDateString(language === 'en' ? 'en-GB' : language, { day: 'numeric', month: 'short', year: 'numeric' })}</time></div></div>
      <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-700">{entry.note}</p>
    </article>) : <div className="lc-note-empty p-6 text-center"><MessageSquareText className="mx-auto h-6 w-6 text-slate-500" /><p className="mt-3 text-sm font-bold text-slate-700">{textFor('No coaching notes yet.')}</p><p className="mt-1 text-xs leading-5 text-slate-500">{textFor('Send a clear next step to help this student progress.')}</p></div>}</div>
  </CenterPanel>
}
