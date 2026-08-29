import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ClipboardCheck,
  Clock3,
  DollarSign,
  Globe2,
  GraduationCap,
  Loader2,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { WORLD_COUNTRIES } from '@/data/countries'
import { captureAnalyticsEvent } from '@/lib/analytics'
import {
  claimGuestDiagnostic,
  completeGuestDiagnostic,
  openGuestDiagnosticSession,
  rememberGuestDiagnosticDestination,
  saveGuestDiagnosticDraft,
  saveGuestDiagnosticHandoff,
  type GuestDiagnosticAnswers,
  type GuestDiagnosticResult,
} from '@/lib/guestDiagnostic'
import { useAuthStore, type AuthState } from '@/store/authStore'

type StepId = 1 | 2 | 3 | 4 | 5
type Answers = GuestDiagnosticAnswers

const EASE = [0.22, 1, 0.36, 1] as const
const currentYear = new Date().getFullYear()
const DEFAULT_ANSWERS: Answers = {
  applicantCountry: '',
  intendedMajor: '',
  destinations: [],
  intakeYear: currentYear + 1,
  curriculum: 'NATIONAL',
  academicBand: 'BETWEEN_80_89',
  testPlan: 'UNSURE',
  currentIeltsScore: null,
  targetIeltsScore: 7,
  currentSatScore: null,
  targetSatScore: 1400,
  budgetRange: 'UNSURE',
  needsAid: true,
  applicationStage: 'EXPLORING',
  weeklyHours: 6,
}

const STEP_META: Array<{ id: StepId; short: string; title: string; description: string; icon: ComponentType<{ className?: string }> }> = [
  { id: 1, short: 'Direction', title: 'Define your university direction', description: 'Tell us where you are applying from, what you want to study and where you are considering.', icon: Globe2 },
  { id: 2, short: 'Academics', title: 'Map your academic foundation', description: 'Use a broad grade band so your readiness preview stays useful across different school systems.', icon: GraduationCap },
  { id: 3, short: 'Tests', title: 'Set your exam direction', description: 'Add a current baseline when you have one. If you do not, ProfAI will make baseline testing a priority.', icon: TestTube2 },
  { id: 4, short: 'Funding', title: 'Make the plan financially realistic', description: 'Your annual budget direction helps ProfAI prioritize the right research questions—not make admission promises.', icon: DollarSign },
  { id: 5, short: 'Timeline', title: 'Turn your goal into an actionable pace', description: 'Your current application stage and weekly capacity determine what should happen first.', icon: Clock3 },
]

const CURRICULA = [
  ['NATIONAL', 'National curriculum', 'Your country’s standard school system'],
  ['IB', 'International Baccalaureate', 'IB Diploma or related program'],
  ['A_LEVELS', 'A Levels', 'Cambridge or another A Level pathway'],
  ['AP', 'US / AP curriculum', 'US high school with AP coursework'],
  ['OTHER', 'Another curriculum', 'You can refine this in full onboarding'],
] as const

const ACADEMIC_BANDS = [
  ['BELOW_70', 'Below 70%', 'Foundation-building stage'],
  ['BETWEEN_70_79', '70–79%', 'Developing academic profile'],
  ['BETWEEN_80_89', '80–89%', 'Competitive foundation'],
  ['NINETY_PLUS', '90%+', 'Strong academic foundation'],
] as const

const TEST_PLANS = [
  ['IELTS', 'IELTS', 'English proficiency'],
  ['SAT', 'Digital SAT', 'Undergraduate admissions test'],
  ['BOTH', 'IELTS + SAT', 'Prepare for both exams'],
  ['UNSURE', 'I am not sure yet', 'We will make clarification a priority'],
  ['NONE', 'No test planned', 'Requirements still need verification'],
] as const

const BUDGETS = [
  ['UNDER_10K', 'Under $10,000', 'per academic year'],
  ['BETWEEN_10K_25K', '$10,000–$25,000', 'per academic year'],
  ['BETWEEN_25K_50K', '$25,000–$50,000', 'per academic year'],
  ['ABOVE_50K', '$50,000+', 'per academic year'],
  ['UNSURE', 'Not decided yet', 'Budget research becomes a priority'],
] as const

const STAGES = [
  ['EXPLORING', 'Exploring options', 'I am still defining my direction'],
  ['RESEARCHING', 'Researching universities', 'I am comparing countries and programs'],
  ['SHORTLISTING', 'Building a shortlist', 'I have possible universities in mind'],
  ['PREPARING', 'Preparing materials', 'I am working on tests and documents'],
  ['READY', 'Ready to apply', 'My shortlist and core materials are nearly ready'],
] as const

function OptionCard({ selected, title, detail, onClick }: { selected: boolean; title: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`group relative min-h-[5.25rem] rounded-[1.3rem] border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${selected ? 'border-blue-400/80 bg-blue-50/80 shadow-[0_14px_34px_rgba(37,99,235,0.13)]' : 'border-white/90 bg-white/55 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white/80'}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span><b className="block text-sm font-black text-slate-950">{title}</b><small className="mt-1 block text-xs font-medium leading-5 text-slate-500">{detail}</small></span>
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-transparent'}`}><Check className="h-3.5 w-3.5" /></span>
      </span>
    </button>
  )
}

function FieldLabel({ children, optional }: { children: string; optional?: boolean }) {
  return <label className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">{children}{optional ? <span className="normal-case tracking-normal text-slate-400">optional</span> : null}</label>
}

function ScoreField({ label, value, onChange, min, max, step = 1, optional }: { label: string; value: number | null; onChange: (value: number | null) => void; min: number; max: number; step?: number; optional?: boolean }) {
  return <div><FieldLabel optional={optional}>{label}</FieldLabel><input type="number" min={min} max={max} step={step} value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} className="h-[3.25rem] w-full rounded-2xl border border-white/90 bg-white/65 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" /></div>
}

function JourneySignal({ step, reduceMotion }: { step: StepId; reduceMotion: boolean }) {
  return (
    <div className="relative mx-auto h-[250px] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_24px_70px_rgba(30,64,175,0.12)] backdrop-blur-2xl lg:h-[320px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(248,113,113,0.24),transparent_35%),radial-gradient(circle_at_78%_70%,rgba(59,130,246,0.25),transparent_38%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 430 320" aria-hidden="true"><path d="M55 220 C120 75 290 260 380 80" fill="none" stroke="rgba(100,116,139,.28)" strokeWidth="2" strokeDasharray="7 9" /></svg>
      <motion.div className="absolute left-[10%] top-[56%] grid h-16 w-16 place-items-center rounded-2xl border border-white bg-white/75 text-red-500 shadow-xl backdrop-blur-xl" animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [-2, 2, -2] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}><Target className="h-7 w-7" /></motion.div>
      <motion.div className="absolute right-[10%] top-[15%] grid h-16 w-16 place-items-center rounded-2xl border border-white bg-white/75 text-blue-600 shadow-xl backdrop-blur-xl" animate={reduceMotion ? undefined : { y: [0, 8, 0], rotate: [2, -2, 2] }} transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut' }}><GraduationCap className="h-7 w-7" /></motion.div>
      <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-slate-950 text-white shadow-[0_24px_65px_rgba(15,23,42,0.26)]"><div className="text-center"><b className="block text-3xl font-black">0{step}</b><span className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-200">of 05</span></div><motion.span className="absolute inset-[-12px] rounded-full border border-blue-300/50" animate={reduceMotion ? undefined : { scale: [0.94, 1.08, 0.94], opacity: [.7, .2, .7] }} transition={{ duration: 4, repeat: Infinity }} /></div>
      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white bg-white/60 px-4 py-3 backdrop-blur-xl"><span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Personal readiness map</span><span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Private</span></div>
    </div>
  )
}

export default function GuestDiagnostic() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const reduceMotion = Boolean(useReducedMotion())
  const [step, setStep] = useState<StepId>(1)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading')
  const [result, setResult] = useState<GuestDiagnosticResult | null>(null)
  const [error, setError] = useState('')
  const [openingPlan, setOpeningPlan] = useState(false)
  const started = useRef(false)

  const initialize = async () => {
    setStatus('loading')
    setError('')
    try {
      const session = await openGuestDiagnosticSession()
      setToken(session.token)
      setAnswers((current) => ({ ...current, ...session.diagnostic.answers }))
      if (session.diagnostic.result) setResult(session.diagnostic.result)
      setStatus('ready')
      if (!started.current) {
        started.current = true
        captureAnalyticsEvent('diagnostic_started', { entry: 'public_page' })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The diagnostic could not be opened.')
      setStatus('error')
    }
  }

  useEffect(() => { void initialize() }, [])

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setError('')
    setAnswers((current) => ({ ...current, [key]: value }))
  }
  const meta = STEP_META[step - 1]
  const progress = result ? 100 : step * 20

  const validationError = useMemo(() => {
    if (step === 1) {
      if (answers.applicantCountry.length < 2) return 'Select the country where you are applying from.'
      if (answers.intendedMajor.trim().length < 2) return 'Add the field you currently want to study.'
      if (answers.destinations.length === 0) return 'Add at least one destination country.'
      if (answers.intakeYear < currentYear || answers.intakeYear > currentYear + 7) return 'Choose a valid target intake year.'
    }
    if (step === 3) {
      if (['IELTS', 'BOTH'].includes(answers.testPlan) && answers.targetIeltsScore === null) return 'Add your IELTS target score.'
      if (['SAT', 'BOTH'].includes(answers.testPlan) && answers.targetSatScore === null) return 'Add your SAT target score.'
      if (answers.currentIeltsScore !== null && (answers.currentIeltsScore < 0 || answers.currentIeltsScore > 9 || answers.currentIeltsScore * 2 % 1 !== 0)) return 'Current IELTS band must be between 0 and 9 in 0.5 steps.'
      if (answers.targetIeltsScore !== null && (answers.targetIeltsScore < 4 || answers.targetIeltsScore > 9 || answers.targetIeltsScore * 2 % 1 !== 0)) return 'Target IELTS band must be between 4 and 9 in 0.5 steps.'
      if (answers.currentSatScore !== null && (answers.currentSatScore < 400 || answers.currentSatScore > 1600)) return 'Current SAT score must be between 400 and 1600.'
      if (answers.targetSatScore !== null && (answers.targetSatScore < 400 || answers.targetSatScore > 1600)) return 'Target SAT score must be between 400 and 1600.'
      if (answers.currentIeltsScore !== null && answers.targetIeltsScore !== null && answers.currentIeltsScore > answers.targetIeltsScore) return 'IELTS target should be at least your current score.'
      if (answers.currentSatScore !== null && answers.targetSatScore !== null && answers.currentSatScore > answers.targetSatScore) return 'SAT target should be at least your current score.'
    }
    if (step === 5 && (answers.weeklyHours < 1 || answers.weeklyHours > 30)) return 'Choose between 1 and 30 focused hours per week.'
    return ''
  }, [answers, step])

  const goNext = async () => {
    if (validationError || !token) { setError(validationError || 'Your secure session is still opening.'); return }
    setStatus('saving'); setError('')
    try {
      await saveGuestDiagnosticDraft(token, answers)
      captureAnalyticsEvent('diagnostic_step_completed', { step, step_name: meta.short })
      if (step < 5) {
        setDirection(1)
        setStep((step + 1) as StepId)
        setStatus('ready')
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
        return
      }
      const completed = await completeGuestDiagnostic(token, answers)
      setResult(completed.diagnostic.result)
      captureAnalyticsEvent('diagnostic_completed', { readiness_band: completed.diagnostic.result?.readinessLabel ?? 'unknown' })
      setStatus('ready')
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your answers could not be saved. Please retry.')
      setStatus('ready')
    }
  }

  const goBack = () => {
    setError('')
    if (result) { setResult(null); setStep(5); return }
    if (step === 1) { navigate('/'); return }
    setDirection(-1)
    setStep((step - 1) as StepId)
  }

  const addDestination = (country: string) => {
    if (!country || answers.destinations.includes(country) || answers.destinations.length >= 5) return
    set('destinations', [...answers.destinations, country])
  }

  const openSavedPlan = async () => {
    if (!token || !result || openingPlan) return
    setError('')
    saveGuestDiagnosticHandoff(answers)
    rememberGuestDiagnosticDestination()
    captureAnalyticsEvent('diagnostic_signup_started', { source: user ? 'authenticated_result' : 'result' })

    if (!user) {
      navigate('/register', { state: { from: { pathname: '/journey-plan' } } })
      return
    }

    setOpeningPlan(true)
    try {
      await claimGuestDiagnostic(token)
      navigate('/journey-plan', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your plan could not be linked to this account. Please retry.')
      setOpeningPlan(false)
    }
  }

  if (status === 'loading') {
    return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_10%_15%,#fee2e2,transparent_35%),radial-gradient(circle_at_90%_20%,#dbeafe,transparent_38%),#f8fafc]"><div className="text-center"><BrandMark size={64} /><Loader2 className="mx-auto mt-5 h-6 w-6 animate-spin text-blue-600" /><p className="mt-3 text-sm font-bold text-slate-600">Opening your private diagnostic…</p></div></main>
  }

  if (status === 'error') {
    return <main className="grid min-h-screen place-items-center bg-slate-50 px-4"><section className="max-w-md rounded-[2rem] border border-white bg-white/80 p-8 text-center shadow-2xl backdrop-blur-2xl"><BrandMark size={58} /><h1 className="mt-5 text-2xl font-black text-slate-950">We could not open the diagnostic</h1><p className="mt-3 text-sm leading-6 text-slate-600">{error}</p><button type="button" onClick={() => void initialize()} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><RefreshCw className="h-4 w-4" /> Retry</button></section></main>
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f7f9fd] text-slate-950">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_5%_15%,rgba(248,113,113,.24),transparent_34%),radial-gradient(circle_at_94%_18%,rgba(59,130,246,.25),transparent_38%),linear-gradient(135deg,#fff_0%,#f8fafc_46%,#eff6ff_100%)]" aria-hidden="true" />
      <motion.div className="fixed -left-20 top-[34%] h-64 w-64 rounded-full bg-red-200/35 blur-3xl" animate={reduceMotion ? undefined : { y: [0, 32, 0], scale: [1, 1.08, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="fixed -right-24 bottom-[8%] h-80 w-80 rounded-full bg-blue-200/45 blur-3xl" animate={reduceMotion ? undefined : { y: [0, -38, 0], scale: [1.06, .96, 1.06] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />

      <header className="relative z-20 px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.55rem] border border-white/85 bg-white/58 px-3.5 py-3 shadow-[0_20px_55px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:px-5">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2.5 rounded-xl"><BrandMark size={42} /><span className="text-xl font-black tracking-[-.04em]">Prof<span className="text-red-500">AI</span></span></button>
          <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Private guest assessment</div>
          <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black text-slate-600 hover:bg-white/70"><X className="h-4 w-4" /> <span className="hidden sm:inline">Exit</span></button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-7 sm:px-6 sm:pb-16 sm:pt-10">
        <div className="mb-7 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/55 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.18em] text-blue-700 backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" /> University readiness diagnostic</span><h1 className="mt-4 max-w-3xl text-3xl font-black leading-[1.02] tracking-[-.045em] sm:text-5xl">Find the next right move in your <span className="text-red-500">university journey.</span></h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Five focused steps. No account required. Your preview uses transparent readiness rules—not invented admission odds.</p></div>
          <div className="rounded-2xl border border-white bg-white/55 px-4 py-3 shadow-sm backdrop-blur-xl"><div className="flex items-center justify-between gap-12 text-xs font-black"><span>{result ? 'Assessment complete' : `Step ${step} of 5`}</span><span className="text-blue-700">{progress}%</span></div><div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-slate-200/70"><motion.div className="h-full rounded-full bg-gradient-to-r from-red-500 via-blue-600 to-blue-500" animate={{ width: `${progress}%` }} transition={{ duration: reduceMotion ? 0 : .45, ease: EASE }} /></div></div>
        </div>

        {!result ? (
          <nav aria-label="Diagnostic progress" className="mb-5 grid grid-cols-5 gap-1.5 rounded-[1.5rem] border border-white/90 bg-white/50 p-2 shadow-[0_16px_50px_rgba(15,23,42,.07)] backdrop-blur-2xl sm:gap-2 sm:p-2.5">
            {STEP_META.map((item) => {
              const Icon = item.icon
              const active = item.id === step
              const complete = item.id < step
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!complete}
                  onClick={() => { setDirection(-1); setStep(item.id); setError('') }}
                  aria-current={active ? 'step' : undefined}
                  className={`relative flex min-h-14 items-center justify-center gap-2 overflow-hidden rounded-[1rem] px-2 text-left transition sm:justify-start sm:px-3 ${active ? 'bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,.2)]' : complete ? 'bg-white/75 text-slate-700 hover:bg-white' : 'text-slate-400'}`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${active ? 'bg-blue-600 text-white' : complete ? 'bg-emerald-50 text-emerald-700' : 'bg-white/70 text-slate-400'}`}>{complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
                  <span className="hidden min-w-0 sm:block"><b className="block truncate text-[10px] font-black">{item.short}</b><small className={`mt-0.5 block text-[8px] font-bold uppercase tracking-[.11em] ${active ? 'text-blue-200' : 'text-slate-400'}`}>Step 0{item.id}</small></span>
                </button>
              )
            })}
          </nav>
        ) : null}

        {result ? (
          <ResultView result={result} onEdit={goBack} onSave={() => void openSavedPlan()} saving={openingPlan} error={error} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.22fr)_minmax(300px,.78fr)]">
            <section className="overflow-hidden rounded-[2.2rem] border border-white/90 bg-white/55 shadow-[0_30px_90px_rgba(30,64,175,0.14)] backdrop-blur-2xl">
              <div className="border-b border-white/80 bg-white/30 px-5 py-5 sm:px-8"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg"><meta.icon className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-red-500">0{step} · {meta.short}</p><h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{meta.title}</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{meta.description}</p></div></div></div>
              <div className="min-h-[390px] p-5 sm:p-8">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={step} initial={reduceMotion ? false : { opacity: 0, x: direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: direction * -18 }} transition={{ duration: reduceMotion ? 0 : .28, ease: EASE }}>
                    {step === 1 ? <DirectionStep answers={answers} set={set} addDestination={addDestination} /> : null}
                    {step === 2 ? <><ChoiceGrid items={CURRICULA} value={answers.curriculum} onChange={(value) => set('curriculum', value)} legend="Curriculum" /><div className="mt-7"><ChoiceGrid items={ACADEMIC_BANDS} value={answers.academicBand} onChange={(value) => set('academicBand', value)} legend="Current overall grade band" /></div></> : null}
                    {step === 3 ? <TestStep answers={answers} set={set} /> : null}
                    {step === 4 ? <><ChoiceGrid items={BUDGETS} value={answers.budgetRange} onChange={(value) => set('budgetRange', value)} legend="Estimated annual study budget (USD)" /><div className="mt-7"><FieldLabel>Will you need scholarships or financial aid?</FieldLabel><div className="grid gap-3 sm:grid-cols-2"><OptionCard selected={answers.needsAid} title="Yes, funding matters" detail="Prioritize aid and affordability research" onClick={() => set('needsAid', true)} /><OptionCard selected={!answers.needsAid} title="Not necessarily" detail="Still compare total cost carefully" onClick={() => set('needsAid', false)} /></div></div></> : null}
                    {step === 5 ? <TimelineStep answers={answers} set={set} /> : null}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="border-t border-white/80 bg-white/30 px-5 py-5 sm:px-8"><div aria-live="polite" className={`mb-3 min-h-5 text-sm font-bold ${error ? 'text-red-600' : 'text-slate-400'}`}>{error || 'Your progress is saved securely after every step.'}</div><div className="flex items-center justify-between gap-3"><button type="button" onClick={goBack} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white bg-white/65 px-4 text-sm font-black text-slate-700 shadow-sm hover:bg-white"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" disabled={status === 'saving'} onClick={() => void goNext()} className="group inline-flex min-h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,.2)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70">{status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 5 ? <ClipboardCheck className="h-4 w-4" /> : null}{step === 5 ? 'Build my preview' : 'Continue'}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></div></div>
            </section>
            <aside className="space-y-5"><JourneySignal step={step} reduceMotion={reduceMotion} /><div className="rounded-[1.75rem] border border-white/90 bg-white/55 p-5 shadow-[0_18px_55px_rgba(15,23,42,.08)] backdrop-blur-2xl"><div className="flex items-center gap-3"><Route className="h-5 w-5 text-blue-600" /><h3 className="text-sm font-black">What this preview does</h3></div><ul className="mt-4 space-y-3 text-xs font-semibold leading-5 text-slate-600">{['Measures four readiness areas with consistent rules.', 'Surfaces three priorities you can act on next.', 'Carries your answers into onboarding after signup.'].map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</li>)}</ul><p className="mt-5 border-t border-slate-200/70 pt-4 text-[11px] leading-5 text-slate-500">This is planning guidance, not an admission prediction. Always verify requirements on official university pages.</p></div></aside>
          </div>
        )}
      </div>
    </main>
  )
}

function DirectionStep({ answers, set, addDestination }: { answers: Answers; set: <K extends keyof Answers>(key: K, value: Answers[K]) => void; addDestination: (country: string) => void }) {
  return <div className="grid gap-5 sm:grid-cols-2"><div><FieldLabel>Applicant country</FieldLabel><select value={answers.applicantCountry} onChange={(event) => set('applicantCountry', event.target.value)} className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"><option value="">Select your country</option>{WORLD_COUNTRIES.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}</select></div><div><FieldLabel>Intended field of study</FieldLabel><input value={answers.intendedMajor} onChange={(event) => set('intendedMajor', event.target.value)} maxLength={120} placeholder="e.g. Computer Science" className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3.5 text-sm font-bold outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></div><div><FieldLabel>Target intake year</FieldLabel><select value={answers.intakeYear} onChange={(event) => set('intakeYear', Number(event.target.value))} className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">{Array.from({ length: 8 }, (_, index) => currentYear + index).map((year) => <option key={year} value={year}>{year}</option>)}</select></div><div><FieldLabel>Destination countries (up to 5)</FieldLabel><select value="" onChange={(event) => addDestination(event.target.value)} className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"><option value="">Add a destination</option>{WORLD_COUNTRIES.filter((country) => !answers.destinations.includes(country.name)).map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}</select></div><div className="sm:col-span-2 flex min-h-12 flex-wrap gap-2">{answers.destinations.map((country) => <button key={country} type="button" onClick={() => set('destinations', answers.destinations.filter((item) => item !== country))} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-black text-blue-900">{country}<X className="h-3.5 w-3.5" /></button>)}</div></div>
}

function ChoiceGrid<T extends string>({ items, value, onChange, legend }: { items: readonly (readonly [T, string, string])[]; value: T; onChange: (value: T) => void; legend: string }) {
  return <fieldset><legend className="mb-3 text-[11px] font-black uppercase tracking-[.16em] text-slate-600">{legend}</legend><div className={`grid gap-3 ${items.length >= 4 ? 'sm:grid-cols-2' : ''}`}>{items.map(([key, title, detail]) => <OptionCard key={key} selected={value === key} title={title} detail={detail} onClick={() => onChange(key)} />)}</div></fieldset>
}

function TestStep({ answers, set }: { answers: Answers; set: <K extends keyof Answers>(key: K, value: Answers[K]) => void }) {
  const showIelts = ['IELTS', 'BOTH'].includes(answers.testPlan)
  const showSat = ['SAT', 'BOTH'].includes(answers.testPlan)
  return <><ChoiceGrid items={TEST_PLANS} value={answers.testPlan} onChange={(value) => set('testPlan', value)} legend="Exam plan" />{showIelts || showSat ? <div className="mt-7 grid gap-5 rounded-[1.5rem] border border-white bg-white/42 p-4 sm:grid-cols-2 sm:p-5">{showIelts ? <><ScoreField label="Current IELTS band" optional value={answers.currentIeltsScore} onChange={(value) => set('currentIeltsScore', value)} min={0} max={9} step={0.5} /><ScoreField label="Target IELTS band" value={answers.targetIeltsScore} onChange={(value) => set('targetIeltsScore', value)} min={4} max={9} step={0.5} /></> : null}{showSat ? <><ScoreField label="Current SAT score" optional value={answers.currentSatScore} onChange={(value) => set('currentSatScore', value)} min={400} max={1600} step={10} /><ScoreField label="Target SAT score" value={answers.targetSatScore} onChange={(value) => set('targetSatScore', value)} min={400} max={1600} step={10} /></> : null}</div> : null}</>
}

function TimelineStep({ answers, set }: { answers: Answers; set: <K extends keyof Answers>(key: K, value: Answers[K]) => void }) {
  return <><ChoiceGrid items={STAGES} value={answers.applicationStage} onChange={(value) => set('applicationStage', value)} legend="Current application stage" /><div className="mt-7 rounded-[1.5rem] border border-white bg-white/50 p-5"><div className="flex items-center justify-between gap-4"><div><FieldLabel>Weekly time available</FieldLabel><p className="text-sm text-slate-500">A realistic commitment is more useful than an ambitious guess.</p></div><span className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white">{answers.weeklyHours}h</span></div><input aria-label="Weekly study hours" type="range" min={1} max={30} value={answers.weeklyHours} onChange={(event) => set('weeklyHours', Number(event.target.value))} className="mt-6 w-full accent-blue-600" /><div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400"><span>1 hour</span><span>30 hours</span></div></div></>
}

function ResultView({ result, onEdit, onSave, saving, error }: { result: GuestDiagnosticResult; onEdit: () => void; onSave: () => void; saving: boolean; error: string }) {
  const scoreStyle = { background: `conic-gradient(#2563eb ${result.overallScore}%, rgba(226,232,240,.75) 0)` }
  return (
    <section className="overflow-hidden rounded-[2.3rem] border border-white/90 bg-white/60 shadow-[0_34px_100px_rgba(30,64,175,.16)] backdrop-blur-2xl">
      <div className="grid gap-8 border-b border-white/80 p-6 sm:p-9 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="relative grid h-40 w-40 place-items-center rounded-full shadow-[0_18px_55px_rgba(37,99,235,.2)]" style={scoreStyle}>
          <div className="grid h-[128px] w-[128px] place-items-center rounded-full border border-white bg-white/90 text-center shadow-inner backdrop-blur-xl">
            <div><b className="block text-4xl font-black tracking-tight">{result.overallScore}</b><span className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Readiness</span></div>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-emerald-700"><Sparkles className="h-3.5 w-3.5" /> Your preview is ready</span>
          <h2 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-4xl">{result.readinessLabel}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{result.summary}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" disabled={saving} onClick={onSave} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 text-sm font-black text-white shadow-[0_16px_38px_rgba(239,68,68,.25)] transition hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-wait disabled:opacity-70">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Saving your plan…' : 'Save & see my plan'}
            {!saving ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
          </button>
          <button type="button" disabled={saving} onClick={onEdit} className="min-h-11 rounded-2xl px-4 text-xs font-black text-slate-600 hover:bg-white/70 disabled:opacity-50">Edit answers</button>
          {error ? <p role="alert" className="max-w-xs text-xs font-bold leading-5 text-red-600">{error}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-9 lg:grid-cols-4">
        {result.categories.map((category) => (
          <article key={category.key} className="rounded-[1.5rem] border border-white bg-white/65 p-5 shadow-[0_14px_40px_rgba(15,23,42,.07)]">
            <div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><BookOpenCheck className="h-5 w-5" /></div><b className="text-2xl font-black">{category.score}</b></div>
            <h3 className="mt-5 text-sm font-black">{category.label}</h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[.13em] text-blue-700">{category.status}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">{category.summary}</p>
          </article>
        ))}
      </div>

      <div className="border-t border-white/80 bg-white/30 p-6 sm:p-9">
        <div className="flex items-center gap-3"><Target className="h-5 w-5 text-red-500" /><h3 className="text-xl font-black">Your next three priorities</h3></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {result.priorities.map((priority, index) => (
            <article key={priority.key} className="rounded-[1.5rem] border border-white bg-white/65 p-5 shadow-[0_12px_35px_rgba(15,23,42,.05)]">
              <span className="text-[10px] font-black uppercase tracking-[.18em] text-red-500">Priority 0{index + 1}</span>
              <h4 className="mt-3 text-base font-black">{priority.title}</h4>
              <p className="mt-2 text-xs leading-5 text-slate-600">{priority.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/65 p-4 text-xs leading-5 text-blue-950"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" /><p>This is transparent planning guidance—not an admission probability. Always verify university requirements, tuition and deadlines on official sources.</p></div>
      </div>
    </section>
  )
}
