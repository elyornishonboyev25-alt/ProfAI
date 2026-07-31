import { ArrowRight, BookOpen, BrainCircuit, Headphones, Mic2, PenSquare, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import ExamCountdown from '@/components/exam/ExamCountdown'
import CatalogHero from '@/components/catalog/CatalogHero'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

const sections = [
  {
    id: 'reading',
    index: '01',
    title: 'Reading',
    description: 'Master passage navigation, inference precision and exam pacing with guided review.',
    icon: BookOpen,
    chips: ['3 passages', '60 minutes', 'AI review'],
  },
  {
    id: 'listening',
    index: '02',
    title: 'Listening',
    description: 'Build concentration, control distractors and sharpen answer-transfer accuracy.',
    icon: Headphones,
    chips: ['4 sections', 'audio mode', 'mistake map'],
  },
  {
    id: 'writing',
    index: '03',
    title: 'Writing',
    description: 'Plan and write Task 1 and Task 2 responses with clear band-focused feedback.',
    icon: PenSquare,
    chips: ['task studio', 'band hints', 'timed mode'],
  },
  {
    id: 'speaking',
    index: '04',
    title: 'Speaking',
    description: 'Practise all three parts with recording, replay and fluency-focused analysis.',
    icon: Mic2,
    chips: ['3 parts', 'voice mode', 'AI feedback'],
  },
] as const

export default function IELTS() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const { allowHoverMotion } = useMotionPreferences()
  const profile = loadOnboardingProfile(user?.id)
  const navigationState = location.state as { entry?: string; from?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'
  const mockFrom = navigationState?.from ?? 'tests'

  const openSection = (id: (typeof sections)[number]['id']) => {
    const target = id === 'writing' ? '/ielts/writing/tests' : `/ielts/${id}`
    navigate(target, {
      state: fromMock ? { entry: 'mock-ielts', from: mockFrom } : { entry: 'ielts-hub' },
    })
  }

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto w-full max-w-[92rem] space-y-5">
        <CatalogHero
          tone="rose"
          backLabel={fromMock ? 'Mock IELTS' : 'Dashboard'}
          onBack={() => fromMock ? navigate('/mock/ielts', { state: { from: mockFrom } }) : navigate('/dashboard')}
          eyebrow="IELTS Master Track"
          title={<>One clear path to your <span className="bg-gradient-to-r from-red-700 via-rose-600 to-orange-500 bg-clip-text text-transparent">best IELTS band.</span></>}
          subtitle="Reading, Listening, Writing and Speaking follow the same focused workflow: practise, review mistakes, then improve with precise feedback."
          filters={sections.map((section) => ({ id: section.id, label: section.title }))}
          activeFilter=""
          onFilterChange={(id) => openSection(id as (typeof sections)[number]['id'])}
          summary={[
            { label: 'Exam sections', value: '4' },
            { label: 'Full test', value: '2h 45m' },
          ]}
          actions={(
            <>
              <button onClick={() => navigate('/mock/ielts', { state: { from: 'ielts' } })} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-4 text-xs font-black text-white shadow-[0_12px_28px_rgba(220,38,38,0.3)] transition hover:-translate-y-0.5">
                Start full IELTS mock <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => navigate('/analyze-mistakes')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/90 bg-white/72 px-4 text-xs font-black text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:text-violet-700">
                <BrainCircuit className="h-3.5 w-3.5" /> Open Review Lab
              </button>
            </>
          )}
        />

        <ExamCountdown
          exam="IELTS"
          tone="red"
          date={profile?.ieltsExamDate}
          currentScore={profile?.currentIeltsScore}
          targetScore={profile?.targetIeltsScore}
        />

        <Reveal delay={0.04}>
          <section className="group relative isolate overflow-hidden rounded-[1.6rem] border border-violet-100 bg-white/78 p-5 shadow-[0_18px_48px_rgba(109,40,217,0.09)] backdrop-blur-2xl sm:p-6">
            <span className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-violet-200/50 blur-3xl transition duration-700 group-hover:scale-125" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-[0_12px_28px_rgba(124,58,237,0.28)]">
                  <BrainCircuit className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.17em] text-violet-600">IELTS Review Lab</p>
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold text-violet-600">AI feedback</span>
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600">Saved reviews</span>
                  </div>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Turn every mistake into your next score gain.</h2>
                  <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-slate-500 sm:text-sm">See repeated Reading and Writing patterns, understand why answers failed, and build a focused recovery queue.</p>
                </div>
              </div>
              <button onClick={() => navigate('/analyze-mistakes')} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-[0_12px_26px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-violet-700">
                Analyze mistakes <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        </Reveal>

        <div className="flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.17em] text-red-600">Choose a skill</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Your four-section IELTS workspace</h2>
          </div>
          <span className="hidden items-center gap-1 text-[11px] font-bold text-slate-400 sm:inline-flex"><Sparkles className="h-3.5 w-3.5 text-red-500" /> One structure, zero confusion</span>
        </div>

        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <StaggerItem key={section.id} className="h-full">
                <Tilt3D className="h-full rounded-[1.7rem]" max={4}>
                  <motion.button
                    type="button"
                    onClick={() => openSection(section.id)}
                    whileHover={allowHoverMotion ? { y: -4 } : undefined}
                    className="group relative isolate flex h-full min-h-[19rem] w-full flex-col overflow-hidden rounded-[1.7rem] border border-white/90 bg-white/76 p-5 text-left shadow-[0_18px_46px_rgba(220,38,38,0.09)] backdrop-blur-2xl transition hover:border-red-200"
                  >
                    <span className="pointer-events-none absolute -right-12 -top-14 -z-10 h-40 w-40 rounded-full bg-red-100/80 blur-3xl transition duration-700 group-hover:scale-125" />
                    <div className="flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-[0_10px_24px_rgba(220,38,38,0.25)]"><Icon className="h-5 w-5" /></span>
                      <span className="text-3xl font-black tracking-[-0.08em] text-slate-100">{section.index}</span>
                    </div>
                    <p className="mt-5 text-[9px] font-black uppercase tracking-[0.17em] text-red-600">IELTS section</p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{section.title}</h3>
                    <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{section.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {section.chips.map((chip) => <span key={chip} className="rounded-full border border-slate-100 bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500">{chip}</span>)}
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-black text-red-700">Open studio <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                  </motion.button>
                </Tilt3D>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </div>
  )
}
