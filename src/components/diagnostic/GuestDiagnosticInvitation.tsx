import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  GraduationCap,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import {
  dismissGuestDiagnosticInvitation,
  hasGuestDiagnosticSession,
  shouldShowGuestDiagnosticInvitation,
} from '@/lib/guestDiagnostic'

const EASE = [0.22, 1, 0.36, 1] as const

export default function GuestDiagnosticInvitation({ onStart }: { onStart: () => void }) {
  const reduceMotion = Boolean(useReducedMotion())
  const [open, setOpen] = useState(false)
  const [hasSession] = useState(() => hasGuestDiagnosticSession())
  const primaryButtonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    dismissGuestDiagnosticInvitation()
    setOpen(false)
  }, [])

  const start = useCallback(() => {
    dismissGuestDiagnosticInvitation()
    setOpen(false)
    onStart()
  }, [onStart])

  useEffect(() => {
    if (!shouldShowGuestDiagnosticInvitation()) return
    const timer = window.setTimeout(() => setOpen(true), reduceMotion ? 250 : 900)
    return () => window.clearTimeout(timer)
  }, [reduceMotion])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    primaryButtonRef.current?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [close, open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-slate-950/35 px-3 py-5 backdrop-blur-md sm:px-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="diagnostic-invitation-title"
            initial={false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.46, ease: EASE }}
            className="relative w-full max-w-[66rem] overflow-hidden rounded-[2rem] border border-white/90 bg-white/85 shadow-[0_40px_120px_rgba(15,23,42,0.28)] backdrop-blur-3xl sm:rounded-[2.5rem]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(248,113,113,.2),transparent_35%),radial-gradient(circle_at_92%_15%,rgba(59,130,246,.24),transparent_38%)]" />
            <button type="button" onClick={close} aria-label="Close readiness check" className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/90 bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-950 sm:right-6 sm:top-6"><X className="h-4 w-4" /></button>

            <div className="relative grid lg:grid-cols-[1.08fr_.92fr]">
              <div className="p-6 sm:p-9 lg:p-12">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/85 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.17em] text-emerald-800"><Sparkles className="h-3.5 w-3.5" /> Your journey starts here</span>
                <h2 id="diagnostic-invitation-title" className="mt-5 max-w-xl text-3xl font-black leading-[1.02] tracking-[-.045em] text-slate-950 sm:text-5xl">
                  Let’s find your clearest <span className="text-red-500">next step.</span>
                </h2>
                <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-slate-600 sm:text-base">Answer five focused questions and get a private university-readiness plan built around your destination, exams, funding and timeline.</p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    [Clock3, '3–4 minutes', 'Fast and focused'],
                    [ShieldCheck, 'No account', 'Start privately'],
                    [Route, 'Clear actions', 'Not vague advice'],
                  ].map(([Icon, title, detail]) => {
                    const ItemIcon = Icon as typeof Clock3
                    return <div key={String(title)} className="rounded-2xl border border-white bg-white/65 p-4 shadow-[0_12px_35px_rgba(15,23,42,.06)]"><ItemIcon className="h-5 w-5 text-blue-600" /><b className="mt-3 block text-xs font-black text-slate-900">{String(title)}</b><span className="mt-1 block text-[10px] font-semibold text-slate-500">{String(detail)}</span></div>
                  })}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button ref={primaryButtonRef} type="button" onClick={start} className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-[0_18px_42px_rgba(15,23,42,.22)] transition hover:-translate-y-0.5 hover:bg-blue-700">
                    {hasSession ? 'Continue my readiness check' : 'Build my readiness plan'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button type="button" onClick={close} className="min-h-12 rounded-2xl px-5 text-sm font-black text-slate-500 transition hover:bg-white/70 hover:text-slate-900">Maybe later</button>
                </div>
                <p className="mt-5 text-[10px] font-semibold leading-5 text-slate-400">Planning guidance only. ProfAI never invents admission probabilities or guarantees an outcome.</p>
              </div>

              <div className="relative hidden min-h-[34rem] overflow-hidden border-l border-white/80 bg-slate-950 lg:block">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(37,99,235,.48),transparent_28%),radial-gradient(circle_at_18%_85%,rgba(239,68,68,.28),transparent_32%)]" />
                <div className="absolute inset-[11%] rounded-full border border-blue-300/20" />
                <div className="absolute inset-[22%] rounded-full border border-dashed border-white/20" />
                <motion.div className="absolute inset-[16%] rounded-full border-t border-blue-300/80" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} />
                <div className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-white/10 text-center shadow-[0_0_70px_rgba(59,130,246,.34)] backdrop-blur-xl"><div><Target className="mx-auto h-7 w-7 text-red-300" /><b className="mt-3 block text-2xl font-black text-white">Your plan</b><span className="text-[9px] font-black uppercase tracking-[.18em] text-blue-200">Ready in 5 steps</span></div></div>
                {[
                  { Icon: GraduationCap, label: 'Direction', className: 'left-[12%] top-[21%]', delay: 0 },
                  { Icon: BookOpenCheck, label: 'Readiness', className: 'right-[10%] top-[30%]', delay: 0.8 },
                  { Icon: Route, label: 'Next actions', className: 'bottom-[17%] left-[24%]', delay: 1.5 },
                ].map(({ Icon, label, className, delay }) => (
                  <motion.div key={label} className={`absolute ${className} rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-xl`} animate={reduceMotion ? undefined : { y: [0, -9, 0] }} transition={{ duration: 4.8, delay, repeat: Infinity, ease: 'easeInOut' }}><Icon className="h-5 w-5 text-blue-200" /><span className="mt-2 block text-[10px] font-black uppercase tracking-[.13em]">{label}</span></motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
