import { ArrowLeft, BookOpen, BrainCircuit, Headphones, Mic2, PenSquare } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import ExamCountdown from '@/components/exam/ExamCountdown'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'

const sections = [
  {
    id: 'reading',
    title: 'Reading',
    description: 'Passage navigation, inference precision, and time management with AI support.',
    icon: BookOpen,
    chips: ['3 passages', 'timed drills', 'AI review'],
  },
  {
    id: 'listening',
    title: 'Listening',
    description: 'Audio concentration, distractor control, and answer transfer accuracy workflows.',
    icon: Headphones,
    chips: ['4 sections', 'audio mode', 'mistake map'],
  },
  {
    id: 'writing',
    title: 'Writing',
    description: 'Task 1 and Task 2 structured writing studio with premium draft analytics.',
    icon: PenSquare,
    chips: ['task studio', 'band hints', 'timed mode'],
  },
  {
    id: 'speaking',
    title: 'Speaking',
    description: 'Part-by-part speaking flow with recording, replay, and fluency analysis.',
    icon: Mic2,
    chips: ['3 parts', 'voice mode', 'AI feedback'],
  },
] as const

export default function IELTS() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const profile = loadOnboardingProfile(user?.id)
  const navigationState = location.state as { entry?: string; from?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'
  const mockFrom = navigationState?.from ?? 'tests'

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fde8e8] via-[#fceaea] to-[#f9dede] px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-mesh" />
        <div className="ambient-grid" />
        <div className="ambient-noise" />
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-red-200/45 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-0 h-96 w-96 rounded-full bg-rose-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <Reveal>
          <section className="premium-hero p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="premium-top-controls">
                  <button
                    onClick={() =>
                      fromMock
                        ? navigate('/mock/ielts', { state: { from: mockFrom } })
                        : navigate('/tests')
                    }
                    className="premium-back-btn"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {fromMock ? 'Back to Mock IELTS' : 'Back to Test Library'}
                  </button>
                  <span className="premium-top-chip">IELTS Master Track</span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Choose your <span className="arena-title-accent-red">IELTS Arena</span>
                </h1>
                <p className="premium-section-subtitle">
                  Reading, Listening, Writing, and Speaking now open as independent premium sections with their own pages.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:w-[31rem]">
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">IELTS Sections</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={4} />
                  </p>
                  <p className="hero-metric-note">Independent premium pages</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Workflow</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">Exam</p>
                  <p className="hero-metric-note">Reading to Speaking flow</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Coaching</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">AI</p>
                  <p className="hero-metric-note">Per-section analysis</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.04}>
          <ExamCountdown
            exam="IELTS"
            tone="red"
            date={profile?.ieltsExamDate}
            currentScore={profile?.currentIeltsScore}
            targetScore={profile?.targetIeltsScore}
          />
        </Reveal>

        <Stagger className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <StaggerItem key={section.id} className="h-full">
                <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
                  <button
                    onClick={() => {
                      const target =
                        section.id === 'writing'
                          ? '/ielts/writing/tests'
                          : `/ielts/${section.id}`
                      navigate(target, {
                        state: fromMock
                          ? { entry: 'mock-ielts', from: mockFrom }
                          : { entry: 'ielts-hub' },
                      })
                    }}
                    className="interactive-lift group h-full w-full rounded-[1.8rem] border border-red-200 bg-gradient-to-br from-white via-rose-50 to-red-100/70 p-6 text-left shadow-[0_18px_36px_rgba(244,63,94,0.16)]"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                      <Icon className="h-3.5 w-3.5" />
                      IELTS Section
                    </div>
                    <h2 className="mt-4 text-3xl font-black text-slate-900">{section.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{section.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      {section.chips.map((chip) => (
                        <span key={chip} className="rounded-full bg-white px-3 py-1 text-slate-700">
                          {chip}
                        </span>
                      ))}
                    </div>
                    <p className="mt-6 text-sm font-semibold text-red-700 transition group-hover:translate-x-1">Open {section.title} -&gt;</p>
                  </button>
                </Tilt3D>
              </StaggerItem>
            )
          })}
          <StaggerItem className="h-full">
            <Tilt3D className="h-full rounded-[1.8rem]" max={6}>
              <button
                onClick={() => navigate('/analyze-mistakes')}
                className="interactive-lift group h-full w-full rounded-[1.8rem] border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-rose-100/70 p-6 text-left shadow-[0_18px_36px_rgba(124,58,237,0.13)]"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  IELTS Review Lab
                </div>
                <h2 className="mt-4 text-3xl font-black text-slate-900">Analyze IELTS Mistakes</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">Review Reading and Writing errors, spot repeated patterns, and turn them into focused recovery practice.</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">IELTS only</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">saved reviews</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">AI feedback</span>
                </div>
                <p className="mt-6 text-sm font-semibold text-violet-700 transition group-hover:translate-x-1">Open mistake analysis -&gt;</p>
              </button>
            </Tilt3D>
          </StaggerItem>
        </Stagger>
      </div>
    </div>
  )
}
