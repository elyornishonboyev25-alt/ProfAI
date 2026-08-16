import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenText,
  Clock3,
  Lock,
  PenLine,
  PlayCircle,
  Search,
  Sparkles,
  Target,
} from 'lucide-react'

import {
  getWritingDayCatalog,
  getWritingFullTestCatalog,
} from '@/data/writingTestData'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import CatalogHero from '@/components/catalog/CatalogHero'

type CatalogFilter = 'all' | 'daily' | 'full-tests'

type CatalogRow = {
  id: string
  title: string
  subtitle: string
  badge: 'task1' | 'task2' | 'full-test'
  durationMinutes: number
  available: boolean
  isDay: boolean
}

const CARD_EASE = [0.22, 1, 0.36, 1] as const

export default function IELTSWritingTests() {
  const navigate = useNavigate()
  const location = useLocation()
  const { allowHoverMotion, minimalMotion } = useMotionPreferences()
  const navigationState = location.state as { entry?: string; from?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'

  const [activeFilter, setActiveFilter] = useState<CatalogFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const dayCatalog = useMemo(() => getWritingDayCatalog(), [])
  const fullTestCatalog = useMemo(() => getWritingFullTestCatalog(), [])

  const dayRows = useMemo<CatalogRow[]>(
    () =>
      dayCatalog.map((task) => ({
        id: task.id,
        title: task.title,
        subtitle: task.subtitle,
        badge: task.taskType,
        durationMinutes: task.durationMinutes,
        available: task.available,
        isDay: true,
      })),
    [dayCatalog],
  )

  const fullTestRows = useMemo<CatalogRow[]>(
    () =>
      fullTestCatalog.map((test) => ({
        id: test.id,
        title: test.title,
        subtitle: 'Task 1 + Task 2 · 60 minutes · Full exam simulation',
        badge: 'full-test' as const,
        durationMinutes: 60,
        available: test.available,
        isDay: false,
      })),
    [fullTestCatalog],
  )

  const allRows = useMemo(() => [...dayRows, ...fullTestRows], [dayRows, fullTestRows])

  const filteredRows = useMemo(() => {
    if (activeFilter === 'daily') return dayRows
    if (activeFilter === 'full-tests') return fullTestRows
    return allRows
  }, [activeFilter, allRows, dayRows, fullTestRows])

  const visibleRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return filteredRows
    return filteredRows.filter(
      (row) => `${row.title} ${row.subtitle}`.toLowerCase().includes(query),
    )
  }, [filteredRows, searchTerm])

  const counts = useMemo(
    () => ({
      all: allRows.length,
      daily: dayRows.length,
      fullTests: fullTestRows.length,
      available: allRows.filter((r) => r.available).length,
    }),
    [allRows, dayRows, fullTestRows],
  )

  const handleLaunch = (row: CatalogRow) => {
    if (!row.available) return
    navigate(`/ielts/writing/test/${row.id}`)
  }

  return (
    <motion.div
      initial={minimalMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={minimalMotion ? { duration: 0.14 } : { duration: 0.34, ease: CARD_EASE }}
      className="w-full min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8"
    >
      <CatalogHero
        tone="rose"
        backLabel="Back to IELTS"
        onBack={() => navigate(fromMock ? '/mock/ielts' : '/ielts')}
        eyebrow="IELTS Writing Section"
        title={<>30 days to sharper <span className="arena-title-accent-red">IELTS Writing.</span></>}
        subtitle="Build exam-ready Task 1 reports and Task 2 essays through a clear daily roadmap, then prove your progress in full mock simulations."
        filters={[
          { id: 'all', label: 'All tests', count: counts.all },
          { id: 'daily', label: 'Daily practice', count: counts.daily },
          { id: 'full-tests', label: 'Full mocks', count: counts.fullTests },
        ]}
        activeFilter={activeFilter}
        onFilterChange={(id) => setActiveFilter(id as CatalogFilter)}
        summary={[
          { label: 'Live now', value: counts.available },
          { label: 'Full mocks', value: counts.fullTests },
        ]}
      />

      <section className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-indigo-100/85 bg-white/95 p-4 shadow-[0_18px_42px_rgba(79,70,229,0.1)] lg:sticky lg:top-5">
          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/75 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700">
              Day Pattern
            </p>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-indigo-200 bg-indigo-100 text-[10px] font-black text-indigo-700">
                  1
                </span>
                <span>Task 1 — Visual Report</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-violet-200 bg-violet-100 text-[10px] font-black text-violet-700">
                  2
                </span>
                <span>Task 2 — Essay</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-violet-200 bg-violet-100 text-[10px] font-black text-violet-700">
                  3
                </span>
                <span>Task 2 — Essay</span>
              </div>
              <p className="mt-1 text-[10px] italic text-slate-500">
                This cycle repeats through Day 30
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/75 p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700">
                Writing Tips
              </p>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li className="flex items-start gap-1.5">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-indigo-500" />
                Task 1: 150+ words, 20 minutes
              </li>
              <li className="flex items-start gap-1.5">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-indigo-500" />
                Task 2: 250+ words, 40 minutes
              </li>
              <li className="flex items-start gap-1.5">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-indigo-500" />
                Task 2 is worth 2x Task 1 score
              </li>
            </ul>
          </div>
        </aside>

        <div className="rounded-3xl border border-indigo-100/85 bg-white/95 p-4 shadow-[0_20px_46px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Writing Roadmap</h2>
              <p className="text-sm text-slate-500">
                {activeFilter === 'daily'
                  ? 'Daily practice lineup'
                  : activeFilter === 'full-tests'
                    ? 'Full mock test lineup'
                    : 'Complete writing lineup'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-emerald-700">
                Live: {counts.available}
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-amber-700">
                Coming: {counts.all - counts.available}
              </span>
            </div>
          </div>

          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search day or test number..."
              className="h-11 w-full rounded-xl border border-indigo-100 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <div className="mt-3 max-h-[68vh] divide-y divide-slate-200/70 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white">
            {visibleRows.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">No tests found</p>
                <p className="mt-1 text-xs text-slate-500">Try a different keyword or filter.</p>
              </div>
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                {visibleRows.map((row) => {
                  const badgeLabel =
                    row.badge === 'task1'
                      ? 'Task 1'
                      : row.badge === 'task2'
                        ? 'Task 2'
                        : 'Full Test'
                  const badgeColor =
                    row.badge === 'task1'
                      ? 'border-indigo-200 bg-indigo-100 text-indigo-700'
                      : row.badge === 'task2'
                        ? 'border-violet-200 bg-violet-100 text-violet-700'
                        : 'border-sky-200 bg-sky-100 text-sky-700'

                  return (
                    <motion.article
                      key={row.id}
                      layout
                      initial={minimalMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={minimalMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      whileHover={allowHoverMotion ? { scale: 1.01 } : undefined}
                      transition={
                        minimalMotion ? { duration: 0.12 } : { duration: 0.24, ease: CARD_EASE }
                      }
                      className="relative px-3 py-2 hover:bg-indigo-50/45 sm:px-4"
                    >
                      <div className="absolute bottom-0 left-3 top-0 w-px">
                        <span className="block h-full w-px bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent" />
                      </div>
                      <span
                        className={`absolute left-[6px] top-4 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                          row.available
                            ? 'border-indigo-300 bg-white text-indigo-600 shadow-[0_0_0_4px_rgba(255,241,242,1)]'
                            : 'border-slate-300 bg-slate-100 text-slate-400'
                        }`}
                      >
                        {row.available ? (
                          <PenLine className="h-2.5 w-2.5" />
                        ) : (
                          <Lock className="h-2.5 w-2.5" />
                        )}
                      </span>

                      <div className="flex flex-wrap items-center justify-between gap-2 pl-8">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-slate-900">
                              {row.title}
                            </h3>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${badgeColor}`}
                            >
                              {badgeLabel}
                            </span>
                            {row.available && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                                Live
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500">{row.subtitle}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {row.durationMinutes} min
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <BookOpenText className="h-3.5 w-3.5" />
                              {row.badge === 'task1'
                                ? '150+ words'
                                : row.badge === 'task2'
                                  ? '250+ words'
                                  : '400+ words'}
                            </span>
                          </div>
                        </div>

                        <motion.button
                          type="button"
                          whileTap={minimalMotion ? undefined : { scale: 0.98 }}
                          disabled={!row.available}
                          onClick={() => handleLaunch(row)}
                          className={`inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition ${
                            row.available
                              ? 'border-indigo-600 bg-gradient-to-r from-indigo-600 via-blue-500 to-blue-600 text-white hover:brightness-105'
                              : 'cursor-not-allowed border-amber-300 bg-amber-100 text-amber-900'
                          }`}
                        >
                          {row.available ? (
                            <>
                              <PlayCircle className="h-4 w-4" />
                              Start writing
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Coming soon
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.article>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  )
}
