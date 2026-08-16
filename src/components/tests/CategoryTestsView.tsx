import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BookOpenCheck, Layers3, Rocket } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import type { TestCategory, TestSummary } from '@/types/platform'
import { Skeleton } from '@/components/common/Skeleton'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

type CategoryTestsViewProps = {
  category: TestCategory
  title: string
  subtitle: string
}

const categoryTheme: Record<
  TestCategory,
  {
    badge: string
    badgeClass: string
    borderClass: string
    orbLeftClass: string
    orbRightClass: string
    chipClass: string
    modeIconClass: string
  }
> = {
  SCHOOL: {
    badge: 'School Foundation',
    badgeClass: 'border-orange-200 bg-orange-50 text-orange-700',
    borderClass: 'border-orange-100/90',
    orbLeftClass: 'bg-orange-200/35',
    orbRightClass: 'bg-amber-200/35',
    chipClass: 'border-orange-100 bg-white text-orange-700',
    modeIconClass: 'text-orange-600',
  },
  SAT: {
    badge: 'SAT Elite Track',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
    borderClass: 'border-blue-100/90',
    orbLeftClass: 'bg-blue-200/35',
    orbRightClass: 'bg-indigo-200/35',
    chipClass: 'border-blue-100 bg-white text-blue-700',
    modeIconClass: 'text-blue-600',
  },
  IELTS: {
    badge: 'IELTS Academic Track',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
    borderClass: 'border-blue-100/90',
    orbLeftClass: 'bg-blue-200/35',
    orbRightClass: 'bg-indigo-200/35',
    chipClass: 'border-blue-100 bg-white text-blue-700',
    modeIconClass: 'text-blue-600',
  },
  OLYMPIAD: {
    badge: 'Olympiad Master Track',
    badgeClass: 'border-purple-200 bg-purple-50 text-purple-700',
    borderClass: 'border-purple-100/90',
    orbLeftClass: 'bg-purple-200/35',
    orbRightClass: 'bg-fuchsia-200/35',
    chipClass: 'border-purple-100 bg-white text-purple-700',
    modeIconClass: 'text-purple-600',
  },
}

function formatDuration(durationSec: number) {
  const minutes = Math.round(durationSec / 60)
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainder = minutes % 60
    return `${hours}h ${remainder}m`
  }
  return `${minutes}m`
}

export default function CategoryTestsView({ category, title, subtitle }: CategoryTestsViewProps) {
  const navigate = useNavigate()
  const { allowHoverMotion, minimalMotion } = useMotionPreferences()
  const [tests, setTests] = useState<TestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const theme = categoryTheme[category]
  const advancedCount = useMemo(() => tests.filter((test) => test.difficulty === 'HARD' || test.difficulty === 'OLYMPIAD').length, [tests])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const payload = await apiClient.get<{ items: Array<TestSummary & { questionCount: number }> }>(
          `/tests?category=${category}&page=1&limit=18`,
        )

        if (!active) return
        setTests(payload.items)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load category tests')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [category])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.section
        initial={minimalMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={minimalMotion ? { duration: 0.14 } : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className={`premium-hero p-6 sm:p-8 ${theme.borderClass}`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className={`absolute -left-14 top-0 h-52 w-52 rounded-full blur-3xl ${theme.orbLeftClass}`} />
          <div className={`absolute -right-16 bottom-0 h-56 w-56 rounded-full blur-3xl ${theme.orbRightClass}`} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/80 to-transparent" />
        </div>

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${theme.badgeClass}`}>
              <BookOpenCheck className="h-3.5 w-3.5" />
              {theme.badge}
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#64748B] sm:text-base">{subtitle}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:w-[28rem]">
            <div className={`rounded-2xl border px-4 py-3 shadow-sm ${theme.chipClass}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Loaded Tests</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{loading ? '--' : tests.length}</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 shadow-sm ${theme.chipClass}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Advanced</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{loading ? '--' : advancedCount}</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 shadow-sm ${theme.chipClass}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Mode</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-900">
                <Layers3 className={`h-4 w-4 ${theme.modeIconClass}`} />
                Focused
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{error}</div> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-36 w-full" />)
          : tests.map((test) => (
              <motion.article
                key={test.id}
                whileHover={allowHoverMotion ? { y: -4, scale: 1.015 } : undefined}
                className="surface-card p-5"
              >
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">{test.difficulty}</span>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                    Open Access
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#1F2937]">{test.title}</h3>
                <p className="mt-1 text-sm text-[#6B7280]">{test.description}</p>
                <div className="mt-4 text-xs text-slate-600">
                  {formatDuration(test.durationSec)} | XP {test.xpReward ?? 0}
                </div>
                <button
                  onClick={() => navigate(`/tests/${test.id}/attempt`)}
                  className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Start Test
                </button>
              </motion.article>
            ))}
      </section>
    </div>
  )
}

