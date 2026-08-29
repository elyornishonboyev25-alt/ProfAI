import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Compass,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
} from 'lucide-react'
import {
  claimStoredGuestDiagnostic,
  clearGuestDiagnosticHandoff,
  getMyJourneyPlan,
  type DiagnosticCategory,
  type DiagnosticRecord,
} from '@/lib/guestDiagnostic'
import { isPublicFeatureEnabled } from '@/config/featureFlags'

const EASE = [0.22, 1, 0.36, 1] as const
const diagnosticEnabled = isPublicFeatureEnabled('guestDiagnostic')

const categoryIcons: Record<DiagnosticCategory['key'], ComponentType<{ className?: string }>> = {
  academics: GraduationCap,
  tests: BookOpenCheck,
  research: Compass,
  application: CalendarDays,
}

function formatDate(value: string | null) {
  if (!value) return 'Recently updated'
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export default function JourneyPlan() {
  const navigate = useNavigate()
  const reduceMotion = Boolean(useReducedMotion())
  const [plan, setPlan] = useState<DiagnosticRecord | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')

  const loadPlan = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      await claimStoredGuestDiagnostic()
      const diagnostic = await getMyJourneyPlan()
      if (diagnostic) clearGuestDiagnosticHandoff()
      setPlan(diagnostic)
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your journey plan could not be loaded.')
      setStatus('error')
    }
  }, [])

  useEffect(() => { void loadPlan() }, [loadPlan])

  if (status === 'loading') {
    return <div className="grid min-h-[70vh] place-items-center px-4"><div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl"><Route className="h-7 w-7" /></div><Loader2 className="mx-auto mt-5 h-5 w-5 animate-spin text-blue-600" /><p className="mt-3 text-sm font-bold text-slate-500">Preparing your journey plan…</p></div></div>
  }

  if (status === 'error') {
    return <div className="grid min-h-[70vh] place-items-center px-4"><section role="alert" className="w-full max-w-lg rounded-[2rem] border border-white bg-white/75 p-8 text-center shadow-2xl backdrop-blur-2xl"><RefreshCw className="mx-auto h-7 w-7 text-red-500" /><h1 className="mt-5 text-2xl font-black text-slate-950">We couldn’t load your plan</h1><p className="mt-3 text-sm leading-6 text-slate-600">{error}</p><button type="button" onClick={() => void loadPlan()} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><RefreshCw className="h-4 w-4" /> Try again</button></section></div>
  }

  if (!plan?.result) {
    return (
      <div className="workspace-page relative min-h-screen px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
        <section className="mx-auto grid min-h-[72vh] max-w-5xl place-items-center overflow-hidden rounded-[2.5rem] border border-white/90 bg-white/65 p-6 text-center shadow-[0_32px_100px_rgba(30,64,175,.14)] backdrop-blur-2xl sm:p-12">
          <div className="max-w-xl"><div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.7rem] bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-[0_20px_45px_rgba(37,99,235,.28)]"><Target className="h-8 w-8" /></div><span className="mt-6 inline-flex rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[.17em] text-blue-700">My Journey Plan</span><h1 className="mt-4 text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-5xl">Build your first readiness plan.</h1><p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">Complete the private five-step diagnostic. ProfAI will turn your answers into readiness signals and concrete priorities, then keep the plan here.</p>{diagnosticEnabled ? <button type="button" onClick={() => navigate('/diagnostic')} className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(239,68,68,.25)] hover:bg-red-600">Start my diagnostic <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button> : null}</div>
        </section>
      </div>
    )
  }

  const result = plan.result
  const answers = plan.answers
  const destinationLabel = answers.destinations?.length ? answers.destinations.slice(0, 2).join(' · ') : 'Destination not set'
  const planDate = formatDate(plan.claimedAt ?? plan.completedAt)

  return (
    <div className="workspace-page relative min-h-screen px-3 pb-24 pt-3 sm:px-5 sm:pt-5 lg:px-5 lg:pb-6">
      <div className="mx-auto max-w-[92rem]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3"><button type="button" onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" className="grid h-11 w-11 place-items-center rounded-2xl border border-white bg-white/65 text-slate-600 shadow-sm backdrop-blur-xl transition hover:bg-white hover:text-slate-950"><ArrowLeft className="h-4 w-4" /></button><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">Personal university workspace</p><h1 className="text-2xl font-black tracking-[-.04em] text-slate-950 sm:text-3xl">My Journey Plan</h1></div></div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/85 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.13em] text-emerald-800"><ShieldCheck className="h-3.5 w-3.5" /> Account-private</div>
        </header>

        <motion.section initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .55, ease: EASE }} className="relative overflow-hidden rounded-[2.4rem] bg-slate-950 p-6 text-white shadow-[0_34px_90px_rgba(15,23,42,.24)] sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_14%,rgba(37,99,235,.58),transparent_31%),radial-gradient(circle_at_8%_95%,rgba(239,68,68,.28),transparent_32%)]" />
          <motion.div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], rotate: [0, 12, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-3.5 py-2 text-[10px] font-black uppercase tracking-[.17em] text-blue-200"><Sparkles className="h-3.5 w-3.5" /> Readiness roadmap</span><h2 className="mt-5 max-w-3xl text-3xl font-black leading-[1.03] tracking-[-.045em] sm:text-5xl">{result.readinessLabel}. <span className="text-blue-300">Your next moves are clear.</span></h2><p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{result.summary}</p><div className="mt-7 flex flex-wrap gap-2.5 text-xs font-bold text-slate-200"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3.5 py-2"><GraduationCap className="h-4 w-4 text-red-300" /> {answers.intendedMajor || 'Major not set'}</span><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3.5 py-2"><MapPin className="h-4 w-4 text-blue-300" /> {destinationLabel}</span><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3.5 py-2"><CalendarDays className="h-4 w-4 text-emerald-300" /> {answers.intakeYear || 'Intake not set'}</span></div></div>
            <div className="relative mx-auto grid h-48 w-48 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#60a5fa ${result.overallScore}%, rgba(255,255,255,.12) 0)` }}><div className="grid h-[154px] w-[154px] place-items-center rounded-full border border-white/15 bg-slate-950/85 text-center shadow-inner backdrop-blur-xl"><div><b className="block text-5xl font-black tracking-[-.06em]">{result.overallScore}</b><span className="mt-1 block text-[9px] font-black uppercase tracking-[.18em] text-blue-200">Overall readiness</span></div></div></div>
          </div>
          <div className="relative mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] font-semibold text-slate-400"><span>Plan saved {planDate}</span><span className="inline-flex items-center gap-2"><TimerReset className="h-4 w-4" /> Built for {answers.weeklyHours ?? 0} focused hours per week</span></div>
        </motion.section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {result.categories.map((category, index) => {
            const Icon = categoryIcons[category.key]
            return <motion.article key={category.key} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : .08 + index * .06, duration: .4, ease: EASE }} className="rounded-[1.75rem] border border-white/90 bg-white/65 p-5 shadow-[0_18px_55px_rgba(15,23,42,.07)] backdrop-blur-2xl"><div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span><span className="text-3xl font-black tracking-[-.04em] text-slate-950">{category.score}</span></div><h3 className="mt-5 text-sm font-black text-slate-950">{category.label}</h3><p className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-blue-700">{category.status}</p><p className="mt-3 text-xs leading-5 text-slate-500">{category.summary}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200/70"><motion.div initial={{ width: 0 }} animate={{ width: `${category.score}%` }} transition={{ duration: reduceMotion ? 0 : .75, delay: .2 + index * .06, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400" /></div></motion.article>
          })}
        </section>

        <section className="mt-5 rounded-[2.2rem] border border-white/90 bg-white/65 p-5 shadow-[0_24px_75px_rgba(30,64,175,.1)] backdrop-blur-2xl sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-red-500">Priority roadmap</p><h2 className="mt-1 text-2xl font-black tracking-[-.035em] text-slate-950">Your next three actions</h2><p className="mt-2 text-sm text-slate-500">Work from top to bottom. Each action opens the right ProfAI workspace.</p></div>{diagnosticEnabled ? <button type="button" onClick={() => navigate('/diagnostic')} className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white/75 px-4 py-3 text-xs font-black text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950"><RefreshCw className="h-4 w-4" /> Update my answers</button> : null}</div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {result.priorities.map((priority, index) => {
              const destination = priority.actionPath === '/register' ? '/admission' : priority.actionPath
              return <article key={priority.key} className="group flex min-h-[15rem] flex-col rounded-[1.65rem] border border-slate-200/75 bg-white/75 p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_50px_rgba(37,99,235,.1)]"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.18em] text-red-500">Action 0{index + 1}</span><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div><h3 className="mt-5 text-lg font-black tracking-tight text-slate-950">{priority.title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{priority.body}</p><button type="button" onClick={() => navigate(destination)} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 transition group-hover:text-blue-800">{priority.actionLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></article>
            })}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/65 p-4 text-xs leading-5 text-blue-950"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" /><p>Your plan is private to your account. It is planning guidance, not an admission prediction; verify requirements and deadlines on official university sources.</p></div>
        </section>
      </div>
    </div>
  )
}
