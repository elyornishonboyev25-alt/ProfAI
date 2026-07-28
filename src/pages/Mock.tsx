import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Clock3, Crown, Headphones, ShieldCheck, Sparkles, Target } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'

const tracks = [
  {
    id: 'ielts',
    title: 'IELTS Mock Arena',
    subtitle: 'Full 4-section simulation',
    description:
      'Reading, Listening, Writing, and Speaking in exam-sequence order with strict timing behavior.',
    path: '/mock/ielts',
    tone: 'red',
    chips: ['2h 45m flow', '4 sections', 'exam pressure mode'],
  },
  {
    id: 'sat',
    title: 'SAT Mock Arena',
    subtitle: 'Digital SAT simulation',
    description:
      'Reading/Writing and Math modules inside one controlled environment with timer discipline and section gates.',
    path: '/mock/sat',
    tone: 'blue',
    chips: ['2h 14m flow', '4 modules', 'adaptive pacing'],
  },
] as const

function cardToneClass(tone: (typeof tracks)[number]['tone']) {
  if (tone === 'blue') {
    return 'border-blue-200 bg-gradient-to-br from-white via-blue-50 to-indigo-100/75 shadow-[0_20px_40px_rgba(37,99,235,0.16)]'
  }

  return 'border-red-200 bg-gradient-to-br from-white via-rose-50 to-red-100/70 shadow-[0_20px_40px_rgba(220,38,38,0.16)]'
}

function labelToneClass(tone: (typeof tracks)[number]['tone']) {
  if (tone === 'blue') {
    return 'border-blue-200 text-blue-700'
  }

  return 'border-red-200 text-red-700'
}

function linkToneClass(tone: (typeof tracks)[number]['tone']) {
  if (tone === 'blue') {
    return 'text-blue-700'
  }

  return 'text-red-700'
}

export default function Mock() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const mockTrial = useFeatureTrial('mock')
  const [showMockGate, setShowMockGate] = useState(false)

  const launchMock = (path: string) => {
    if (mockTrial.locked) {
      setShowMockGate(true)
      return
    }
    mockTrial.consume()
    navigate(path, { state: { from: from ?? 'mock' } })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fde8e8] via-[#fceaea] to-[#f9dede] px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-mesh" />
        <div className="ambient-grid" />
        <div className="ambient-noise" />
        <div className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-red-200/45 blur-3xl" />
        <div className="absolute -right-16 top-20 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl" />
      </div>

      <AnimatePresence>
        {showMockGate ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
              onClick={() => setShowMockGate(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-amber-200 bg-white p-7 text-center shadow-[0_34px_78px_rgba(127,29,29,0.28)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-red-500 to-rose-500" />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-[0_16px_32px_rgba(245,158,11,0.4)]">
                <Crown className="h-8 w-8" />
              </div>
              <span className="premium-top-chip mt-5 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Premium only
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Free mock exams used up</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You&apos;ve used your {mockTrial.limit} free mock exams. Subscribe to Premium for unlimited full-length
                IELTS &amp; SAT mock simulations with AI analysis.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/premium')}
                  className="cta-sheen inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(220,38,38,0.34)]"
                >
                  <Crown className="h-4 w-4" />
                  Subscribe to Premium
                </button>
                <button
                  type="button"
                  onClick={() => setShowMockGate(false)}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <Reveal>
          <section className="premium-hero p-6 sm:p-9">
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-start">
              <div className="xl:pr-2">
                <div className="premium-top-controls">
                  <button onClick={() => navigate('/dashboard')} className="premium-back-btn">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Dashboard
                  </button>
                  <span className="premium-top-chip">
                    <Sparkles className="h-3.5 w-3.5" />
                    Mock Exam Center
                  </span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Choose your <span className="arena-title-accent-red">Mock Arena</span>
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  IELTS and SAT now open as dedicated mock exam spaces with structured timing, clean layout, and real test pressure.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Full-length timing
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    <Target className="h-3.5 w-3.5" />
                    Real exam pressure
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Section lock flow
                  </span>
                  {!mockTrial.isPremium && Number.isFinite(mockTrial.remaining) ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      {Math.max(0, mockTrial.remaining)}/{mockTrial.limit} free mocks left
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:w-full">
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Mock Tracks</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={2} />
                  </p>
                  <p className="hero-metric-note">IELTS + SAT</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Session Style</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">Locked</p>
                  <p className="hero-metric-note">Exam-first sequence</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">IELTS Flow</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">2h 45m</p>
                  <p className="hero-metric-note">4 sections</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">SAT Flow</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">2h 14m</p>
                  <p className="hero-metric-note">4 modules</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <Stagger className="grid gap-5 md:grid-cols-2">
          {tracks.map((track) => (
            <StaggerItem key={track.id} className="h-full">
              <Tilt3D className="h-full rounded-[1.85rem]" max={6}>
                <button
                  onClick={() => launchMock(track.path)}
                  className={`interactive-lift group h-full w-full rounded-[1.85rem] border p-6 text-left ${cardToneClass(track.tone)}`}
                >
                  <div className={`inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-semibold ${labelToneClass(track.tone)}`}>
                    <Headphones className="h-3.5 w-3.5" />
                    {track.subtitle}
                  </div>
                  <h2 className="mt-4 text-3xl font-black text-slate-900">{track.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{track.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    {track.chips.map((chip) => (
                      <span key={chip} className="rounded-full bg-white px-3 py-1 text-slate-700">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <p className={`mt-6 text-sm font-semibold transition group-hover:translate-x-1 ${linkToneClass(track.tone)}`}>
                    Open {track.title} -&gt;
                  </p>
                </button>
              </Tilt3D>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}
