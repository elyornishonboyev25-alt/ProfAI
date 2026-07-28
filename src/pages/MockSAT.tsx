import { useState } from 'react'
import { ArrowLeft, BookOpen, Calculator, CheckCircle2, Clock3, ShieldCheck, Target } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'

const satModules = [
  {
    id: 'rw-1',
    title: 'Reading/Writing Module 1',
    duration: '32 min',
    detail: 'Foundation-level text and grammar control under timer pressure.',
    icon: BookOpen,
    path: '/sat/reading-writing',
  },
  {
    id: 'rw-2',
    title: 'Reading/Writing Module 2',
    duration: '32 min',
    detail: 'Harder adaptive verbal module with denser evidence questions.',
    icon: BookOpen,
    path: '/sat/reading-writing',
  },
  {
    id: 'math-1',
    title: 'Math Module 1',
    duration: '35 min',
    detail: 'Calculator-allowed mixed math with pacing-sensitive accuracy.',
    icon: Calculator,
    path: '/sat/math',
  },
  {
    id: 'math-2',
    title: 'Math Module 2',
    duration: '35 min',
    detail: 'Higher-difficulty adaptive math sequence with fewer recovery windows.',
    icon: Calculator,
    path: '/sat/math',
  },
] as const

function ModeToggle({
  label,
  detail,
  checked,
  onToggle,
}: {
  label: string
  detail: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-3 rounded-xl border border-blue-200 bg-white/85 px-3 py-2.5 text-left"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-600">{detail}</p>
      </div>
      <span
        className={`mt-0.5 inline-flex h-6 min-w-[2.6rem] items-center rounded-full border px-1 transition ${
          checked
            ? 'border-blue-300 bg-blue-100 justify-end'
            : 'border-slate-300 bg-slate-100 justify-start'
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  )
}

export default function MockSAT() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [adaptiveLock, setAdaptiveLock] = useState(true)
  const [strictTimer, setStrictTimer] = useState(true)
  const [hideHints, setHideHints] = useState(true)

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#eaf2ff] via-[#edf4ff] to-[#e5edff] px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-mesh" />
        <div className="ambient-grid opacity-90" />
        <div className="ambient-noise" />
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -right-16 bottom-[-6rem] h-[26rem] w-[26rem] rounded-full bg-indigo-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <Reveal>
          <section className="premium-hero premium-hero-blue p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="premium-top-controls">
                  <button
                    onClick={() => navigate('/mock', { state: { from: from ?? 'home' } })}
                    className="premium-back-btn-blue"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <span className="premium-top-chip-blue">SAT Mock Suite</span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Real <span className="arena-title-accent-blue">SAT Exam Mode</span>
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  Digital SAT sequence with adaptive module rhythm and clean, exam-grade timing structure.
                </p>
              </div>

              <div className="premium-stat-blue rounded-3xl bg-gradient-to-br from-white via-blue-50/70 to-indigo-100/70 px-5 py-4 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Total Session</p>
                <p className="mt-1 text-4xl font-black text-slate-900">2h 14m</p>
                <p className="mt-2 text-xs font-semibold text-blue-700">4 connected modules</p>
              </div>
            </div>
          </section>
        </Reveal>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {satModules.map((satModule) => {
              const Icon = satModule.icon
              return (
                <StaggerItem key={satModule.id} className="h-full">
                  <Tilt3D className="h-full rounded-3xl" max={6}>
                    <article className="surface-card h-full p-5">
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        <Icon className="h-3.5 w-3.5" />
                        {satModule.duration}
                      </div>
                      <h2 className="mt-3 text-2xl font-black text-slate-900">{satModule.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{satModule.detail}</p>
                      <div className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Included in full mock
                      </div>
                    </article>
                  </Tilt3D>
                </StaggerItem>
              )
            })}
          </Stagger>

          <Reveal delay={0.1} className="space-y-4">
            <article className="surface-card p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                <ShieldCheck className="h-4 w-4" />
                Mock Environment Controls
              </p>
              <div className="mt-3 space-y-2">
                <ModeToggle
                  label="Adaptive Lock"
                  detail="Module 2 difficulty follows Module 1 result."
                  checked={adaptiveLock}
                  onToggle={() => setAdaptiveLock((value) => !value)}
                />
                <ModeToggle
                  label="Strict Timer"
                  detail="Hard stop when module time reaches zero."
                  checked={strictTimer}
                  onToggle={() => setStrictTimer((value) => !value)}
                />
                <ModeToggle
                  label="Hide Hints"
                  detail="No helper text during active exam mode."
                  checked={hideHints}
                  onToggle={() => setHideHints((value) => !value)}
                />
              </div>
            </article>

            <article className="surface-card p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Clock3 className="h-4 w-4" />
                Full Mock Run
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start from SAT hub and run Reading/Writing then Math in official digital sequence.
              </p>
              <button
                onClick={() => navigate('/sat')}
                className="arena-primary-btn-blue cta-sheen mt-4"
              >
                Choose from 30 Full Mocks
              </button>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                Recommended: keep adaptive lock ON for realistic score projection.
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <Target className="h-3.5 w-3.5 text-blue-600" />
                Target pacing: 96 sec per question average.
              </p>
            </article>
          </Reveal>
        </section>
      </div>
    </div>
  )
}
