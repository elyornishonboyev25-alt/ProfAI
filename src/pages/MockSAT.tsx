import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  Clock3,
  Expand,
  FileCheck2,
  Focus,
  GraduationCap,
  Highlighter,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BrandLockup } from '@/components/brand/BrandLogo'
import { useFullscreen } from '@/hooks/useFullscreen'
import {
  SAT_PRACTICE_TEST_4,
  createSATPracticeTest4Attempt,
  type SATMode,
} from '@/features/sat/practiceTest4'
import {
  clearSATPracticeTest4Attempt,
  loadSATPracticeTest4Attempt,
  saveSATPracticeTest4Attempt,
} from '@/features/sat/attemptStorage'

const modeCards = [
  {
    id: 'practice',
    eyebrow: 'Learn without pressure',
    title: 'Practice Mode',
    description:
      'Work at your own pace, keep every tool available, leave and resume whenever you want.',
    icon: BookOpenCheck,
    color: 'blue',
    points: ['No fullscreen lock', 'No hard time limit', 'Progress autosaves'],
  },
  {
    id: 'exam',
    eyebrow: 'True test simulation',
    title: 'Exam Mode',
    description:
      'Official module timing with a protected fullscreen environment and integrity monitoring.',
    icon: ShieldCheck,
    color: 'red',
    points: ['Fullscreen required', 'Strict module timer', '10-second recovery window'],
  },
] as const

export default function MockSAT() {
  const navigate = useNavigate()
  const { supported: fullscreenSupported, enter } = useFullscreen()
  const [selectedMode, setSelectedMode] = useState<SATMode>('practice')
  const [existingAttempt, setExistingAttempt] = useState(loadSATPracticeTest4Attempt)
  const [fullscreenError, setFullscreenError] = useState('')

  useEffect(() => {
    setExistingAttempt(loadSATPracticeTest4Attempt())
  }, [])

  const completedQuestions = useMemo(
    () => Object.values(existingAttempt?.answers ?? {}).filter(Boolean).length,
    [existingAttempt],
  )

  const openRunner = async (mode: SATMode, resume = false) => {
    setFullscreenError('')
    if (mode === 'exam') {
      if (!fullscreenSupported) {
        setFullscreenError('Exam Mode requires a browser with fullscreen support.')
        return
      }
      await enter()
      const webkitDocument = document as Document & { webkitFullscreenElement?: Element | null }
      if (!document.fullscreenElement && !webkitDocument.webkitFullscreenElement) {
        setFullscreenError('Fullscreen permission was not granted. Allow it to start Exam Mode.')
        return
      }
    }

    if (!resume) {
      const attempt = createSATPracticeTest4Attempt(mode)
      saveSATPracticeTest4Attempt(attempt)
    }
    navigate('/sat/mock/4/run')
  }

  const activeAttempt = existingAttempt?.status === 'active'
  const finishedAttempt = existingAttempt?.status === 'submitted'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#eff9ff_0%,#f8f7fb_42%,#fff4f1_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute -right-24 top-8 h-[30rem] w-[30rem] rounded-full bg-red-200/30 blur-3xl" />
        <div className="absolute bottom-[-16rem] left-1/3 h-[36rem] w-[36rem] rounded-full bg-indigo-200/25 blur-3xl" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-[88rem]">
        <header className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-white/85 bg-white/70 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,.08)] backdrop-blur-2xl sm:px-6">
          <BrandLockup
            iconSize={46}
            titleClassName="text-xl sm:text-2xl"
            subtitle="Digital SAT testing studio"
          />
          <button
            type="button"
            onClick={() => navigate('/sat')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 shadow-sm hover:border-red-200 hover:text-red-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> SAT Arena
          </button>
        </header>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(30rem,.92fr)]">
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2rem] border border-white/90 bg-white/74 p-5 shadow-[0_28px_70px_rgba(15,23,42,.1)] backdrop-blur-2xl sm:p-8"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-red-600">
                <Sparkles className="h-3.5 w-3.5" /> New official mock
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Practice Test #4
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Your real SAT,
              <span className="block bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 bg-clip-text text-transparent">
                beautifully simulated.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
              All 120 questions from the supplied College Board paper-digital edition, with
              original graphs and notation, autosave, review tools, and official range scoring.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['120', 'Questions'],
                ['4', 'Modules'],
                ['2h 14m', 'Exam time'],
                ['400–1600', 'Score range'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white bg-white/85 p-3 shadow-sm">
                  <p className="text-xl font-black tracking-tight text-slate-950">{value}</p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Highlighter, title: 'Highlight & notes', copy: 'Draw directly over any passage, graph, or formula.' },
                { icon: Focus, title: 'Focused runner', copy: 'Question-by-question flow with flags and keyboard controls.' },
                { icon: Target, title: 'Official scoring', copy: 'R&W and Math score ranges from your supplied scoring guide.' },
                { icon: GraduationCap, title: 'Deep review', copy: 'Correct answers, explanations, filters, and section insight.' },
              ].map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="flex gap-3 rounded-2xl border border-slate-100 bg-white/70 p-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-black">{feature.title}</p>
                      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{feature.copy}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.article>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[2rem] border border-white/90 bg-white/78 p-4 shadow-[0_28px_70px_rgba(15,23,42,.1)] backdrop-blur-2xl sm:p-6"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Before you begin</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Choose your test mode</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                You can choose again when starting a fresh attempt.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {modeCards.map((mode) => {
                const Icon = mode.icon
                const selected = selectedMode === mode.id
                return (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`relative w-full overflow-hidden rounded-[1.4rem] border p-4 text-left transition ${
                      selected
                        ? mode.color === 'red'
                          ? 'border-red-300 bg-gradient-to-br from-red-50 to-rose-100/70 shadow-[0_14px_32px_rgba(220,38,38,.12)]'
                          : 'border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-100/60 shadow-[0_14px_32px_rgba(37,99,235,.12)]'
                        : 'border-slate-200 bg-white/75 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        mode.color === 'red' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-[0.14em] ${
                              mode.color === 'red' ? 'text-red-600' : 'text-blue-600'
                            }`}>{mode.eyebrow}</p>
                            <p className="mt-0.5 text-lg font-black text-slate-950">{mode.title}</p>
                          </div>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                            selected
                              ? mode.color === 'red'
                                ? 'border-red-600 bg-red-600 text-white'
                                : 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}>
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] font-medium leading-5 text-slate-600">{mode.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {mode.points.map((point) => (
                            <span key={point} className="rounded-lg border border-white bg-white/80 px-2 py-1 text-[9px] font-black text-slate-500">
                              {point}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {fullscreenError ? (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
                {fullscreenError}
              </p>
            ) : null}

            {activeAttempt ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/85 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">Saved attempt</p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {completedQuestions} of {SAT_PRACTICE_TEST_4.questionCount} answered
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500">
                      {existingAttempt?.mode === 'exam' ? 'Exam Mode' : 'Practice Mode'} · autosaved
                    </p>
                  </div>
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void openRunner(existingAttempt!.mode, true)}
                    className="rounded-xl bg-amber-600 px-3 py-2 text-[11px] font-black text-white shadow-sm"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearSATPracticeTest4Attempt()
                      setExistingAttempt(null)
                    }}
                    className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-[11px] font-black text-amber-700"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ) : null}

            {finishedAttempt ? (
              <button
                type="button"
                onClick={() => navigate('/sat/mock/4/run')}
                className="mt-4 flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-left"
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Completed attempt</span>
                  <span className="mt-1 block text-sm font-black text-slate-900">Open score & review</span>
                </span>
                <FileCheck2 className="h-5 w-5 text-emerald-600" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => void openRunner(selectedMode)}
              className={`mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(15,23,42,.18)] transition hover:-translate-y-0.5 ${
                selectedMode === 'exam'
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'
              }`}
            >
              {selectedMode === 'exam' ? <Expand className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              Start {selectedMode === 'exam' ? 'Exam' : 'Practice'} Mode
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[9px] font-bold text-slate-400">
              <LockKeyhole className="h-3 w-3" />
              Progress and notes stay on this device.
            </p>
          </motion.aside>
        </section>
      </div>
    </main>
  )
}
