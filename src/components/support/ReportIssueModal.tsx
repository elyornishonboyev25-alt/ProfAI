import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Bug, CheckCircle2, CircleHelp, CreditCard, Lightbulb, Send, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

const categories = [
  { value: 'BUG', label: 'Bug or technical issue', icon: Bug },
  { value: 'BILLING', label: 'Billing issue', icon: CreditCard },
  { value: 'FEATURE', label: 'Feature request', icon: Lightbulb },
  { value: 'OTHER', label: 'Other', icon: CircleHelp },
] as const

export default function ReportIssueModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [category, setCategory] = useState<(typeof categories)[number]['value'] | null>(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) { setSubmitted(false); setError('') }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown) }
  }, [open, onClose])

  if (!open) return null

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!category || description.trim().length < 20) {
      setError('Select an issue type and add at least 20 characters of detail.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await apiClient.post('/support/reports', { category, description: description.trim(), pagePath: window.location.pathname })
      setSubmitted(true)
      setDescription('')
      setCategory(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not submit your report. Please try again.')
    } finally { setSubmitting(false) }
  }

  return createPortal(<div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-labelledby="report-issue-title" className="relative flex max-h-[min(92dvh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white bg-[radial-gradient(circle_at_100%_0%,#eaf3ff,transparent_48%),linear-gradient(145deg,#fff,#fff8f8)] shadow-[0_35px_100px_rgba(15,23,42,.28)]">
      <button type="button" onClick={onClose} className="absolute right-5 top-5 z-10 rounded-full border border-slate-200 bg-white/80 p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600" aria-label="Close report form"><X size={18} /></button>
      <div className="overflow-y-auto px-5 pb-6 pt-8 sm:px-9 sm:pb-9">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-600 shadow-sm">{submitted ? <CheckCircle2 size={27} /> : <AlertCircle size={27} />}</div>
        <h2 id="report-issue-title" className="mt-4 text-center text-3xl font-black tracking-tight text-slate-950">{submitted ? 'Report received' : 'Report an issue'}</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-slate-600">{submitted ? 'Thank you. Your report has been saved for the ProfAI team.' : "Tell us what happened and we'll use your details to investigate."}</p>
        {!user ? <button type="button" onClick={() => { onClose(); navigate('/login') }} className="mt-8 w-full rounded-2xl bg-red-600 px-5 py-3.5 font-bold text-white">Sign in to submit a report</button> : submitted ? <button type="button" onClick={() => { setSubmitted(false); onClose() }} className="mt-8 w-full rounded-2xl bg-red-600 px-5 py-3.5 font-bold text-white">Done</button> : <form onSubmit={(event) => void submit(event)} className="mt-7 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">Your name<input value={user?.fullName ?? ''} readOnly className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700" /></label>
            <label className="block text-sm font-bold text-slate-700">Your email<input value={user?.email ?? ''} readOnly className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700" /></label>
          </div>
          <fieldset><legend className="mb-2 text-sm font-bold text-slate-700">Type of issue</legend><div className="grid gap-2 sm:grid-cols-2">{categories.map((item) => <button key={item.value} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-sm font-bold transition ${category === item.value ? 'border-red-400 bg-red-50 text-red-800 shadow-[0_8px_25px_rgba(220,38,38,.1)]' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-red-200'}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><item.icon size={19} /></span>{item.label}</button>)}</div></fieldset>
          <label className="block text-sm font-bold text-slate-700">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={5} placeholder="What happened? Which page were you on, and what did you expect?" className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 font-medium leading-6 text-slate-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100" /></label>
          {error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-red-700 px-5 py-3.5 font-bold text-white shadow-[0_12px_30px_rgba(220,38,38,.2)] disabled:opacity-60"><Send size={17} />{submitting ? 'Submitting...' : 'Submit report'}</button></div>
        </form>}
      </div>
    </section>
  </div>, document.body)
}
