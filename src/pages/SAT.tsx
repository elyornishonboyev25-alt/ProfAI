import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileSearch,
  Gauge,
  ListChecks,
  Lock,
  Search,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import ExamCountdown from '@/components/exam/ExamCountdown'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'

const MOCK_COUNT = 30
const LIVE_MOCKS = 3

export default function SAT() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const { allowHoverMotion, minimalMotion } = useMotionPreferences()
  const profile = loadOnboardingProfile(user?.id)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('all')

  const mocks = useMemo(
    () =>
      Array.from({ length: MOCK_COUNT }, (_, index) => ({
        id: index + 1,
        title: `Digital SAT Full Mock ${String(index + 1).padStart(2, '0')}`,
        available: index < LIVE_MOCKS,
        completed: false,
        difficulty: index < 10 ? 'Foundation' : index < 20 ? 'Advanced' : 'Mastery',
      })),
    [],
  )

  const visibleMocks = mocks.filter((mock) => {
    const matchesSearch = mock.title.toLowerCase().includes(search.toLowerCase()) || String(mock.id) === search.trim()
    const matchesFilter = filter === 'all' || (filter === 'available' && mock.available) || (filter === 'completed' && mock.completed)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(145deg,#eef6ff_0%,#f8fbff_48%,#eef2ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative mx-auto max-w-[92rem] space-y-5">
        <motion.section
          initial={minimalMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border border-white/85 bg-white/70 p-5 shadow-[0_24px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl sm:p-7"
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(32rem,.9fr)] xl:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => navigate('/tests')} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700 shadow-sm hover:bg-blue-50">
                  <ArrowLeft className="h-3.5 w-3.5" /> Test Library
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" /> Digital SAT Command Center
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                One complete path to your <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">best SAT score.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                Math and Reading &amp; Writing are combined in every official-style mock. Practice, review SAT-only mistakes, and grow your vocabulary from one clear workspace.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => navigate('/mock/sat', { state: { mockId: 1, from: '/sat' } })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5">
                  Start Full Mock 01 <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => navigate('/sat/mistakes')} className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700">
                  <FileSearch className="h-3.5 w-3.5" /> Analyze SAT mistakes
                </button>
              </div>
            </div>
            <ExamCountdown
              exam="SAT"
              tone="blue"
              date={profile?.satExamDate}
              currentScore={profile?.currentSatScore}
              targetScore={profile?.targetSatScore}
            />
          </div>
        </motion.section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Full mocks', value: '30', note: 'Combined exam simulations', icon: Trophy },
            { label: 'Exam length', value: '2h 14m', note: 'Official digital pacing', icon: Clock3 },
            { label: 'Questions', value: '98', note: '54 English · 44 Math', icon: ListChecks },
            { label: 'Score range', value: '400–1600', note: 'Section-level diagnostics', icon: Gauge },
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <article key={metric.label} className="rounded-[1.4rem] border border-white/90 bg-white/72 p-4 shadow-[0_14px_35px_rgba(37,99,235,0.08)] backdrop-blur-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">{metric.label}</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{metric.value}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">{metric.note}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-4 w-4" /></span>
                </div>
              </article>
            )
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <article className="rounded-[2rem] border border-white/90 bg-white/76 p-4 shadow-[0_22px_55px_rgba(37,99,235,0.1)] backdrop-blur-2xl sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Full mock roadmap</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">30 complete Digital SAT mocks</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">Each mock contains both Reading &amp; Writing and Math modules.</p>
              </div>
              <label className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search mock number" className="h-11 w-full rounded-xl border border-blue-100 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
              </label>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {([
                ['all', 'All 30'],
                ['available', `${LIVE_MOCKS} available`],
                ['completed', 'Completed'],
              ] as const).map(([value, label]) => (
                <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition ${filter === value ? 'bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.25)]' : 'border border-slate-100 bg-white text-slate-500 hover:border-blue-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid max-h-[44rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 2xl:grid-cols-3">
              {visibleMocks.map((mock) => (
                <motion.article
                  key={mock.id}
                  whileHover={allowHoverMotion ? { y: -2 } : undefined}
                  className={`rounded-2xl border p-4 transition ${mock.available ? 'border-blue-100 bg-gradient-to-br from-white to-blue-50/80 shadow-[0_10px_24px_rgba(37,99,235,0.08)]' : 'border-slate-100 bg-slate-50/70'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${mock.available ? 'bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,.25)]' : 'bg-slate-200 text-slate-500'}`}>
                      {mock.available ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${mock.available ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {mock.available ? 'Ready' : 'Soon'}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-black text-slate-900">{mock.title}</h3>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">{mock.difficulty} · 98 questions · 134 min</p>
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    <span className="rounded-lg bg-white px-2 py-1 text-center text-[9px] font-bold text-slate-500">English + Math</span>
                    <span className="rounded-lg bg-white px-2 py-1 text-center text-[9px] font-bold text-slate-500">Adaptive modules</span>
                  </div>
                  <button
                    type="button"
                    disabled={!mock.available}
                    onClick={() => navigate('/mock/sat', { state: { mockId: mock.id, from: '/sat' } })}
                    className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-black ${mock.available ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:brightness-105' : 'cursor-not-allowed border border-slate-200 bg-white text-slate-400'}`}
                  >
                    {mock.available ? <>Start full mock <ArrowRight className="h-3 w-3" /></> : <><Lock className="h-3 w-3" /> Unlocking soon</>}
                  </button>
                </motion.article>
              ))}
            </div>
          </article>

          <aside className="space-y-4">
            <button onClick={() => navigate('/sat/mistakes')} className="group w-full overflow-hidden rounded-[1.7rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-5 text-left text-white shadow-[0_20px_46px_rgba(30,64,175,0.22)] transition hover:-translate-y-0.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-300"><BrainCircuit className="h-5 w-5" /></span>
              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-300">SAT-only analysis</p>
              <h3 className="mt-1 text-xl font-black">Analyze Mistakes</h3>
              <p className="mt-2 text-xs leading-5 text-blue-100/70">Review errors by domain, find repeated patterns, and build a focused recovery queue.</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-black text-white">Open SAT analysis <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </button>

            <button onClick={() => navigate('/vocabulary/sat')} className="group w-full overflow-hidden rounded-[1.7rem] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50 to-blue-100 p-5 text-left shadow-[0_18px_42px_rgba(14,116,144,0.14)] transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,.25)]"><BookMarked className="h-5 w-5" /></span>
                <span className="rounded-full border border-blue-100 bg-white px-2 py-1 text-[9px] font-black uppercase text-blue-700">600 words</span>
              </div>
              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-600">Built into SAT Prep</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">SAT Vocabulary</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">10 packs · 40 focused sections · matching, recall, quiz and typing drills.</p>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-black text-blue-700">Study vocabulary <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </button>

            <div className="rounded-[1.7rem] border border-blue-100 bg-white/75 p-5 backdrop-blur">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">This week’s focus</h3>
              </div>
              <div className="mt-3 space-y-2 text-[11px] font-semibold text-slate-600">
                <p className="rounded-xl bg-blue-50 px-3 py-2">1 full timed mock</p>
                <p className="rounded-xl bg-blue-50 px-3 py-2">2 mistake recovery sessions</p>
                <p className="rounded-xl bg-blue-50 px-3 py-2">60 vocabulary reviews</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
