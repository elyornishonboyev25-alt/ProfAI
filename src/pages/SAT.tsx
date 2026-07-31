import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookMarked,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  Lock,
  Search,
  Target,
} from 'lucide-react'
import ExamCountdown from '@/components/exam/ExamCountdown'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'
import CatalogHero from '@/components/catalog/CatalogHero'

const MOCK_COUNT = 30
const LIVE_MOCKS = 1

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
        title: index + 1 === 4
          ? 'College Board Practice Test 04'
          : `Digital SAT Full Mock ${String(index + 1).padStart(2, '0')}`,
        available: index + 1 === 4,
        completed: false,
        difficulty: index + 1 === 4 ? 'Official' : index < 10 ? 'Foundation' : index < 20 ? 'Advanced' : 'Mastery',
      })),
    [],
  )

  const visibleMocks = mocks.filter((mock) => {
    const matchesSearch = mock.title.toLowerCase().includes(search.toLowerCase()) || String(mock.id) === search.trim()
    const matchesFilter = filter === 'all' || (filter === 'available' && mock.available) || (filter === 'completed' && mock.completed)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">

      <div className="relative mx-auto max-w-[92rem] space-y-5">
        <CatalogHero
          tone="blue"
          backLabel="Test Library"
          onBack={() => navigate('/dashboard')}
          eyebrow="Digital SAT Command Center"
          title={<>30 full Digital SAT mocks. <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">One score journey.</span></>}
          subtitle="Reading & Writing and Math stay together in every official-style simulation, with clear practice, review and recovery in one focused workspace."
          filters={[
            { id: 'all', label: 'All mocks', count: MOCK_COUNT },
            { id: 'available', label: 'Available now', count: LIVE_MOCKS },
            { id: 'completed', label: 'Completed', count: mocks.filter((mock) => mock.completed).length },
          ]}
          activeFilter={filter}
          onFilterChange={(id) => setFilter(id as typeof filter)}
          summary={[
            { label: 'Exam length', value: '2h 14m' },
            { label: 'Score range', value: '400–1600' },
          ]}
          actions={(
            <>
              <button onClick={() => navigate('/mock/sat', { state: { mockId: 4, from: '/sat' } })} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-4 text-xs font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5">
                Start Practice Test 04 <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => navigate('/sat/mistakes')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/90 bg-white/72 px-4 text-xs font-black text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:text-blue-700">
                <FileSearch className="h-3.5 w-3.5" /> Analyze SAT mistakes
              </button>
            </>
          )}
        />

        <ExamCountdown
          exam="SAT"
          tone="blue"
          date={profile?.satExamDate}
          currentScore={profile?.currentSatScore}
          targetScore={profile?.targetSatScore}
        />

        <section className="group relative isolate overflow-hidden rounded-[1.6rem] border border-blue-100 bg-white/78 p-5 shadow-[0_18px_48px_rgba(30,64,175,0.09)] backdrop-blur-2xl sm:p-6">
          <span className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-blue-200/50 blur-3xl transition duration-700 group-hover:scale-125" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]"><BrainCircuit className="h-5 w-5" /></span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-blue-600">SAT Review Lab</p>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">Domain analysis</span>
                  <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] font-bold text-cyan-700">Recovery queue</span>
                </div>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Know exactly where your next points will come from.</h2>
                <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-slate-500 sm:text-sm">Review Math and Reading &amp; Writing errors by domain, find repeated patterns and return to focused practice.</p>
              </div>
            </div>
            <button onClick={() => navigate('/sat/mistakes')} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-[0_12px_26px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-blue-700">
              Analyze SAT mistakes <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
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

            <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {visibleMocks.map((mock) => (
                <motion.article
                  key={mock.id}
                  initial={minimalMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={allowHoverMotion ? { y: -3 } : undefined}
                  className={`group relative isolate flex min-h-[14.5rem] flex-col overflow-hidden rounded-[1.35rem] border p-4 transition ${mock.available ? 'border-blue-200 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50 shadow-[0_14px_30px_rgba(37,99,235,0.12)]' : 'border-slate-200/80 bg-white/72 shadow-[0_10px_24px_rgba(15,23,42,0.05)]'}`}
                >
                  <span className={`pointer-events-none absolute -right-10 -top-12 -z-10 h-32 w-32 rounded-full blur-3xl ${mock.available ? 'bg-blue-200/70' : 'bg-slate-200/55'}`} />
                  <div className="flex items-start justify-between gap-2">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black ${mock.available ? 'bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,.25)]' : 'border border-slate-200 bg-white text-slate-500'}`}>
                      {String(mock.id).padStart(2, '0')}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${mock.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {mock.available ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {mock.available ? 'Ready now' : 'Coming soon'}
                    </span>
                  </div>
                  <p className={`mt-4 text-[9px] font-black uppercase tracking-[0.15em] ${mock.available ? 'text-blue-600' : 'text-slate-400'}`}>{mock.difficulty} path</p>
                  <h3 className="mt-1 text-base font-black leading-tight text-slate-950">{mock.title}</h3>
                  <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
                    {mock.difficulty} · {mock.id === 4 ? '120' : '98'} questions · 134 min
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    <span className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-center text-[9px] font-bold text-slate-500">English + Math</span>
                    <span className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-center text-[9px] font-bold text-slate-500">
                      {mock.id === 4 ? 'Official scoring' : 'Adaptive modules'}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!mock.available}
                    onClick={() => navigate('/mock/sat', { state: { mockId: mock.id, from: '/sat' } })}
                    className={`mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-black transition ${mock.available ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-[0_10px_22px_rgba(37,99,235,.22)] hover:brightness-105' : 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'}`}
                  >
                    {mock.available ? <>Start full mock <ArrowRight className="h-3 w-3" /></> : <><Lock className="h-3 w-3" /> Unlocking soon</>}
                  </button>
                </motion.article>
              ))}
            </div>
          </article>

          <aside className="space-y-4">
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
