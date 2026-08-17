import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Clock3,
  Crown,
  PlayCircle,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react'
import {
  getIeltsSpeakingDayCatalog,
  getIeltsSpeakingFullMockCatalog,
} from '@/utils/ieltsSpeakingCatalog'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import CatalogHero from '@/components/catalog/CatalogHero'
import AiCoach from '@/components/speaking/sections/AiCoach'

type Filter = 'all' | 'days' | 'full-mocks'

type Row = {
  id: string
  testId: string
  title: string
  subtitle: string
  badge: 'day' | 'full'
  badgeLabel: string
  durationMinutes: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  available: boolean
}

const CARD_EASE = [0.22, 1, 0.36, 1] as const

function levelTone(level: Row['difficulty']) {
  if (level === 'Easy') return 'text-emerald-700 bg-emerald-100 border-emerald-200'
  if (level === 'Medium') return 'text-amber-700 bg-amber-100 border-amber-200'
  return 'text-indigo-700 bg-indigo-100 border-indigo-200'
}

function partTone(part: 'day' | 'full', badgeLabel: string) {
  if (part === 'full') return 'border-violet-200 bg-violet-50 text-violet-700'
  if (badgeLabel.includes('Part 1')) return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  if (badgeLabel.includes('Part 2')) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-sky-200 bg-sky-50 text-sky-700'
}

export default function IELTSSpeakingTests() {
  const navigate = useNavigate()
  const location = useLocation()
  const { allowHoverMotion, minimalMotion } = useMotionPreferences()
  const navigationState = location.state as { entry?: string; from?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'

  const [activeFilter, setActiveFilter] = useState<Filter>(() => new URLSearchParams(location.search).get('coach') === '1' ? 'full-mocks' : 'all')
  const [searchTerm, setSearchTerm] = useState('')
  const speakingTrial = useFeatureTrial('speakingDaily')
  const [showTrialGate, setShowTrialGate] = useState(false)

  const days = useMemo(() => getIeltsSpeakingDayCatalog(), [])
  const mocks = useMemo(() => getIeltsSpeakingFullMockCatalog(), [])

  const dayRows = useMemo<Row[]>(
    () =>
      days.map((d) => ({
        id: d.id,
        testId: d.id,
        title: d.title,
        subtitle: d.subtitle,
        badge: 'day' as const,
        badgeLabel: `Part ${d.part}`,
        durationMinutes: d.durationMinutes,
        difficulty: d.difficulty,
        available: d.available,
      })),
    [days],
  )

  const mockRows = useMemo<Row[]>(
    () =>
      mocks.map((m) => ({
        id: m.id,
        testId: m.id,
        title: m.title,
        subtitle: m.subtitle,
        badge: 'full' as const,
        badgeLabel: 'Full mock',
        durationMinutes: m.durationMinutes,
        difficulty: 'Hard' as const,
        available: m.available,
      })),
    [mocks],
  )

  const allRows = useMemo<Row[]>(() => [...dayRows, ...mockRows], [dayRows, mockRows])

  const filteredRows = useMemo(() => {
    if (activeFilter === 'days') return dayRows
    if (activeFilter === 'full-mocks') return mockRows
    return allRows
  }, [activeFilter, allRows, dayRows, mockRows])

  const visibleRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return filteredRows
    return filteredRows.filter((row) => `${row.title} ${row.subtitle}`.toLowerCase().includes(q))
  }, [filteredRows, searchTerm])

  const counts = {
    all: allRows.length,
    days: dayRows.length,
    mocks: mockRows.length,
    available: allRows.filter((r) => r.available).length,
  }

  const handleLaunch = (row: Row) => {
    // Non-premium learners get a limited number of free AI-checked speaking
    // sessions. Once spent, show the premium gate instead of launching.
    if (speakingTrial.locked) {
      setShowTrialGate(true)
      return
    }
    speakingTrial.consume()
    navigate(`/ielts/speaking/test/${row.testId}`, {
      state: fromMock ? { entry: 'mock-ielts', from: navigationState?.from ?? 'tests' } : { entry: 'ielts-speaking' },
    })
  }

  return (
    <motion.div
      initial={minimalMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={minimalMotion ? { duration: 0.14 } : { duration: 0.34, ease: CARD_EASE }}
      className="w-full min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8"
    >
      <AnimatePresence>
        {showTrialGate ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
              onClick={() => setShowTrialGate(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.3, ease: CARD_EASE }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-amber-200 bg-white p-7 text-center shadow-[0_34px_78px_rgba(30,64,175,0.28)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-blue-500 to-indigo-500" />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-[0_16px_32px_rgba(245,158,11,0.4)]">
                <Crown className="h-8 w-8" />
              </div>
              <span className="premium-top-chip mt-5 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Premium only
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Free speaking sessions used up</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You&apos;ve used your {speakingTrial.limit} free AI-checked speaking sessions. Subscribe to Premium for
                unlimited daily questions, full mocks and instant band analysis.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/premium')}
                  className="cta-sheen inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.34)]"
                >
                  <Crown className="h-4 w-4" />
                  Subscribe to Premium
                </button>
                <button
                  type="button"
                  onClick={() => setShowTrialGate(false)}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <CatalogHero
        tone="rose"
        backLabel="Back to IELTS"
        onBack={() => navigate(fromMock ? '/mock/ielts' : '/ielts')}
        eyebrow="IELTS Speaking Section"
        title={<>Speak with confidence. <span className="arena-title-accent-red">Score with proof.</span></>}
        subtitle="A focused 30-day speaking roadmap with realistic full mocks, AI examiner feedback, grammar correction and Band 8+ model answers."
        filters={[
          { id: 'all', label: 'All sessions', count: counts.all },
          { id: 'days', label: 'Daily practice', count: counts.days },
          { id: 'full-mocks', label: 'Full mocks', count: counts.mocks },
        ]}
        activeFilter={activeFilter}
        onFilterChange={(id) => setActiveFilter(id as Filter)}
        summary={[
          { label: 'Live now', value: counts.available },
          { label: 'AI mocks', value: counts.mocks },
        ]}
        badge={!speakingTrial.isPremium && Number.isFinite(speakingTrial.remaining) ? (
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 text-xs font-bold text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            {Math.max(0, speakingTrial.remaining)}/{speakingTrial.limit} free sessions left
          </span>
        ) : undefined}
      />

      {activeFilter === 'full-mocks' ? (
        <section className="mt-5 rounded-[2rem] border border-white/90 bg-white/70 p-4 shadow-[0_24px_60px_rgba(30,64,175,.1)] backdrop-blur-md sm:p-6">
          <div className="mb-4">
            <p className="text-[11px] font-black uppercase tracking-[.16em] text-red-600">AI Speaking Mock</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Practise with your AI examiner</h2>
            <p className="mt-1 text-sm text-slate-500">Run a complete IELTS Speaking simulation or warm up with a guided conversation.</p>
          </div>
          <AiCoach />
        </section>
      ) : null}

      {/* Layout */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-indigo-100/85 bg-white/95 p-4 shadow-[0_18px_42px_rgba(79,70,229,0.1)] lg:sticky lg:top-5">
          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/75 p-3 text-xs">
            <p className="font-semibold uppercase tracking-[0.14em] text-indigo-600">How the cycle works</p>
            <p className="mt-2 text-slate-600">
              Day 1 = Part 1 · Day 2 = Part 2 · Day 3 = Part 3. The cycle repeats — Day 4 is Part 1 again — across the
              full 30-day roadmap.
            </p>
          </div>
        </aside>

        <div className="rounded-3xl border border-indigo-100/85 bg-white/95 p-4 shadow-[0_20px_46px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Speaking Roadmap</h2>
              <p className="text-sm text-slate-500">
                {activeFilter === 'days' ? 'Day-by-day question lineup' : activeFilter === 'full-mocks' ? 'Full mock simulation' : 'Daily questions + full mocks'}
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              Live: {counts.available}
            </span>
          </div>

          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search day, part, or topic..."
              className="h-11 w-full rounded-xl border border-indigo-100 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <div className="mt-3 max-h-[68vh] divide-y divide-slate-200/70 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white">
            {visibleRows.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">No tests match</p>
                <p className="mt-1 text-xs text-slate-500">Try a different keyword or filter.</p>
              </div>
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                {visibleRows.map((row) => (
                  <motion.article
                    key={row.id}
                    layout
                    initial={minimalMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={minimalMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    whileHover={allowHoverMotion ? { scale: 1.01 } : undefined}
                    transition={minimalMotion ? { duration: 0.12 } : { duration: 0.24, ease: CARD_EASE }}
                    className="relative px-3 py-2 hover:bg-indigo-50/45 sm:px-4"
                  >
                    <div className="absolute left-3 top-0 bottom-0 w-px">
                      <span className="block h-full w-px bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent" />
                    </div>
                    <span className="absolute left-[6px] top-4 inline-flex h-5 w-5 items-center justify-center rounded-full border border-indigo-300 bg-white text-indigo-600 shadow-[0_0_0_4px_rgba(255,241,242,1)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    </span>

                    <div className="flex flex-wrap items-center justify-between gap-2 pl-8">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-slate-900">{row.title}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${partTone(row.badge, row.badgeLabel)}`}>
                            {row.badgeLabel}
                          </span>
                          {row.badge === 'full' ? (
                            <span className="rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-700">
                              <Trophy className="mr-0.5 inline h-3 w-3" /> Graded
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">{row.subtitle}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                          <span className={`rounded-full border px-2 py-0.5 font-semibold ${levelTone(row.difficulty)}`}>
                            {row.difficulty}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {row.durationMinutes} min
                          </span>
                          <span className="inline-flex items-center gap-1 text-indigo-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI feedback
                          </span>
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        whileTap={minimalMotion ? undefined : { scale: 0.98 }}
                        onClick={() => handleLaunch(row)}
                        className="inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-xl border border-indigo-600 bg-gradient-to-r from-indigo-600 via-blue-500 to-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-105"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {row.badge === 'full' ? 'Start mock' : 'Start day'}
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  )
}
