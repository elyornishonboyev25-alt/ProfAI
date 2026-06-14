import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  Headphones,
  Lock,
  Mic2,
  PenSquare,
  PlayCircle,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Reveal } from '@/components/fx'
import {
  formatMockDuration,
  getFullMockById,
  MOCK_SECTION_COUNT,
  type MockSectionKey,
} from '@/utils/ieltsMockCatalog'

const SECTION_ICONS: Record<MockSectionKey, LucideIcon> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenSquare,
  speaking: Mic2,
}

const PROGRESS_STORAGE_KEY = 'smarttest:full-mock-progress:v1'

type ProgressStore = Record<string, string[]>

function readProgress(): ProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    const cached = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    const parsed = cached ? (JSON.parse(cached) as unknown) : null
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as ProgressStore
  } catch {
    return {}
  }
}

export default function MockIELTSRun() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mockId } = useParams<{ mockId: string }>()
  const from = (location.state as { from?: string } | null)?.from

  const mock = useMemo(() => (mockId ? getFullMockById(mockId) : null), [mockId])

  const [progressStore, setProgressStore] = useState<ProgressStore>(() => readProgress())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressStore))
  }, [progressStore])

  const completedSections = useMemo(
    () => new Set(mockId ? progressStore[mockId] ?? [] : []),
    [mockId, progressStore],
  )

  const toggleSectionDone = useCallback(
    (sectionKey: string) => {
      if (!mockId) return
      setProgressStore((previous) => {
        const current = new Set(previous[mockId] ?? [])
        if (current.has(sectionKey)) {
          current.delete(sectionKey)
        } else {
          current.add(sectionKey)
        }
        return { ...previous, [mockId]: Array.from(current) }
      })
    },
    [mockId],
  )

  if (!mock) {
    return <Navigate to="/mock/ielts" replace />
  }

  const liveDone = mock.sections.filter(
    (section) => section.available && completedSections.has(section.key),
  ).length
  const allSectionsDone = mock.fullyReady && liveDone === MOCK_SECTION_COUNT
  const progressPercent = mock.readyCount === 0 ? 0 : Math.round((liveDone / mock.readyCount) * 100)

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fde8e8] via-[#fceaea] to-[#f9dede] px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-mesh" />
        <div className="ambient-grid" />
        <div className="ambient-noise" />
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-red-200/45 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-0 h-96 w-96 rounded-full bg-rose-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <Reveal>
          <section className="premium-hero p-6 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="premium-top-controls">
                  <button
                    onClick={() => navigate('/mock/ielts', { state: { from: from ?? 'mock' } })}
                    className="premium-back-btn"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    All mocks
                  </button>
                  <span className="premium-top-chip">Full Mock {mock.index}</span>
                </div>
                <h1 className="premium-section-title mt-4">
                  IELTS <span className="arena-title-accent-red">Full Mock {mock.index}</span>
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  Run the four sections in official order. Each section opens its real exam runner; mark it done to track
                  your progress through this mock.
                </p>
              </div>

              <div className="premium-stat rounded-3xl bg-gradient-to-br from-white via-rose-50/70 to-red-100/65 px-5 py-4 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Total Session</p>
                <p className="mt-1 text-4xl font-black text-slate-900">{formatMockDuration(mock.totalMinutes)}</p>
                <p className="mt-2 text-xs font-semibold text-red-700">
                  {mock.readyCount}/{MOCK_SECTION_COUNT} sections live · {liveDone} done
                </p>
              </div>
            </div>

            <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-3">
            {mock.sections.map((section) => {
              const Icon = SECTION_ICONS[section.key]
              const isDone = section.available && completedSections.has(section.key)
              return (
                <article
                  key={section.key}
                  className={`surface-card flex flex-wrap items-center gap-4 p-5 ${
                    isDone ? 'ring-1 ring-emerald-200' : ''
                  }`}
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700">
                    <Icon className="h-6 w-6" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Section {section.order}
                      </span>
                      <h2 className="text-xl font-black text-slate-900">{section.title}</h2>
                      {section.available ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                          Live
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                          Coming soon
                        </span>
                      )}
                      {isDone ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                          Done
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {section.durationMinutes} min
                      </span>
                      <span>·</span>
                      <span>{section.meta}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {section.available ? (
                      <button
                        type="button"
                        onClick={() => toggleSectionDone(section.key)}
                        aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                          isDone
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-700'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                    ) : null}

                    {section.available && section.launchPath ? (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(section.launchPath as string, {
                            state: { entry: 'mock-ielts', from: from ?? 'mock' },
                          })
                        }
                        className="arena-primary-btn cta-sheen inline-flex items-center gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {isDone ? 'Retake' : 'Start'}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                        <Lock className="h-4 w-4" />
                        Coming soon
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <Reveal delay={0.1} className="space-y-4">
            <article className="surface-card p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                <Trophy className="h-4 w-4" />
                Mock progress
              </p>
              <p className="mt-3 text-3xl font-black text-slate-900">
                {liveDone}
                <span className="text-lg font-bold text-slate-400">/{mock.readyCount || MOCK_SECTION_COUNT} live</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {mock.readyCount === 0
                  ? 'No sections are live for this mock yet.'
                  : liveDone === mock.readyCount
                    ? 'You have finished every live section of this mock.'
                    : `${mock.readyCount - liveDone} live section${mock.readyCount - liveDone === 1 ? '' : 's'} left to mark done.`}
              </p>
            </article>

            <article className="surface-card p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                <Sparkles className="h-4 w-4" />
                Combined band
              </p>
              {allSectionsDone ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  All four sections are complete. Your combined IELTS band report will appear here.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Finish all four live sections to unlock a combined IELTS band (Reading &amp; Listening auto-scored,
                  Writing &amp; Speaking graded by the AI examiner).
                </p>
              )}
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                <Lock className="h-3.5 w-3.5 text-red-600" />
                Unlocks when 4/4 sections are live and done.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
