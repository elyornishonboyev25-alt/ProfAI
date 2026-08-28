import { useEffect, useState } from 'react'
import { BarChart3, ShieldCheck, X } from 'lucide-react'
import {
  analyticsPreferenceEvents,
  getAnalyticsConsent,
  isAnalyticsConfigured,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from '@/lib/analytics'

export default function AnalyticsConsentBanner() {
  const [choice, setChoice] = useState<AnalyticsConsent | null>(() => getAnalyticsConsent())
  const [open, setOpen] = useState(() => getAnalyticsConsent() === null)

  useEffect(() => {
    const reopen = () => setOpen(true)
    window.addEventListener(analyticsPreferenceEvents.open, reopen)
    return () => window.removeEventListener(analyticsPreferenceEvents.open, reopen)
  }, [])

  if (!isAnalyticsConfigured()) return null

  const choose = (next: AnalyticsConsent) => {
    setAnalyticsConsent(next)
    setChoice(next)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-[190] inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/80 bg-white/72 text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200/70"
        aria-label="Open analytics privacy preferences"
        title="Privacy preferences"
      >
        <ShieldCheck className="h-4 w-4" />
      </button>
    )
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-3 bottom-3 z-[240] mx-auto max-w-3xl overflow-hidden rounded-[1.6rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,.94),rgba(239,246,255,.9))] p-4 shadow-[0_28px_80px_rgba(15,23,42,.22)] backdrop-blur-2xl sm:bottom-5 sm:p-5"
    >
      <div className="pointer-events-none absolute -left-14 -top-20 h-40 w-40 rounded-full bg-red-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-4 h-44 w-44 rounded-full bg-blue-300/35 blur-3xl" />
      {choice !== null ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-white/70 hover:text-slate-700"
          aria-label="Close privacy preferences"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-blue-600 text-white shadow-[0_12px_26px_rgba(37,99,235,.24)]">
          <BarChart3 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="analytics-consent-title" className="text-base font-black tracking-tight text-slate-950">
            Help us improve ProfAI
          </h2>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-600 sm:text-sm">
            With your permission, anonymous product analytics help us improve the university journey. Replay masks all text and inputs, and never runs on sensitive account or writing screens.
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="min-h-11 rounded-xl border border-slate-200/80 bg-white/72 px-4 text-xs font-black text-slate-700 transition hover:bg-white sm:text-sm"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="min-h-11 rounded-xl bg-gradient-to-r from-[#1f4bc1] to-[#3576ed] px-4 text-xs font-black text-white shadow-[0_12px_26px_rgba(37,99,235,.24)] transition hover:-translate-y-0.5 sm:text-sm"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </section>
  )
}
