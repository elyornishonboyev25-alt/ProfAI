import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Headphones,
  Lock,
  Mic2,
  PenSquare,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Reveal } from '@/components/fx'
import {
  formatMockDuration,
  FULL_MOCK_PROGRESS_EVENT,
  getFullMockById,
  getFullMockCompletedSections,
  MOCK_SECTION_COUNT,
  type FullMockEntry,
  type MockSection,
  type MockSectionKey,
} from '@/utils/ieltsMockCatalog'

const SECTION_ICONS: Record<MockSectionKey, LucideIcon> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenSquare,
  speaking: Mic2,
}

type SectionStatus = 'completed' | 'current' | 'locked' | 'coming-soon'

// Official IELTS exam order is enforced: a section unlocks only after every
// earlier section that actually has content is finished. Coming-soon sections
// have no test to run, so they neither unlock nor block the chain.
function resolveStatus(
  sections: MockSection[],
  index: number,
  completed: Set<MockSectionKey>,
): SectionStatus {
  const section = sections[index]
  if (!section.available) return 'coming-soon'
  if (completed.has(section.key)) return 'completed'

  const earlierAvailableDone = sections
    .slice(0, index)
    .filter((earlier) => earlier.available)
    .every((earlier) => completed.has(earlier.key))

  return earlierAvailableDone ? 'current' : 'locked'
}

export default function MockIELTSRun() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mockId } = useParams<{ mockId: string }>()
  const from = (location.state as { from?: string } | null)?.from

  const mock = useMemo<FullMockEntry | null>(() => (mockId ? getFullMockById(mockId) : null), [mockId])

  const [completedKeys, setCompletedKeys] = useState<MockSectionKey[]>(() =>
    mockId ? getFullMockCompletedSections(mockId) : [],
  )

  // Completion is written by the section runners themselves (on submit / when
  // the examiner grade saves). Re-read whenever that happens, or when the user
  // returns to this tab after finishing a section elsewhere.
  const refreshProgress = useCallback(() => {
    setCompletedKeys(mockId ? getFullMockCompletedSections(mockId) : [])
  }, [mockId])

  useEffect(() => {
    refreshProgress()
    window.addEventListener(FULL_MOCK_PROGRESS_EVENT, refreshProgress)
    window.addEventListener('storage', refreshProgress)
    window.addEventListener('focus', refreshProgress)
    document.addEventListener('visibilitychange', refreshProgress)
    return () => {
      window.removeEventListener(FULL_MOCK_PROGRESS_EVENT, refreshProgress)
      window.removeEventListener('storage', refreshProgress)
      window.removeEventListener('focus', refreshProgress)
      document.removeEventListener('visibilitychange', refreshProgress)
    }
  }, [refreshProgress])

  const completedSet = useMemo(() => new Set(completedKeys), [completedKeys])

  const launchSection = useCallback(
    (section: MockSection) => {
      if (!section.launchPath || !mock) return
      navigate(section.launchPath, {
        state: {
          entry: 'mock-ielts',
          from: from ?? 'mock',
          mock: { id: mock.id, section: section.key },
          launchPreset: { mode: 'simulation' },
        },
      })
    },
    [from, mock, navigate],
  )

  if (!mock) {
    return <Navigate to="/mock/ielts" replace />
  }

  const liveDone = mock.sections.filter((section) => section.available && completedSet.has(section.key)).length
  const allSectionsDone = mock.fullyReady && liveDone === MOCK_SECTION_COUNT
  const progressPercent = mock.readyCount === 0 ? 0 : Math.round((liveDone / mock.readyCount) * 100)
  const nextSection = mock.sections.find(
    (section, index) => resolveStatus(mock.sections, index, completedSet) === 'current',
  )

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
                  Sit the four sections in official exam order. Each section opens straight into exam mode and is marked
                  done automatically once you finish it — the next section unlocks only then.
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
            {mock.sections.map((section, index) => {
              const Icon = SECTION_ICONS[section.key]
              const status = resolveStatus(mock.sections, index, completedSet)
              const isDone = status === 'completed'
              const isCurrent = status === 'current'
              const isLocked = status === 'locked'

              return (
                <article
                  key={section.key}
                  className={`surface-card flex flex-wrap items-center gap-4 p-5 transition ${
                    isDone ? 'ring-1 ring-emerald-200' : isCurrent ? 'ring-1 ring-red-200' : ''
                  } ${isLocked ? 'opacity-60' : ''}`}
                >
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border text-base font-black ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                        : isLocked
                          ? 'border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-6 w-6" /> : isLocked ? <Lock className="h-5 w-5" /> : <Icon className="h-6 w-6" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        Section {section.order}
                      </span>
                      <h2 className="text-xl font-black text-slate-900">{section.title}</h2>
                      {isDone ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                          Done
                        </span>
                      ) : isCurrent ? (
                        <span className="rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-red-700">
                          Up next
                        </span>
                      ) : section.available ? (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                          Locked
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                          Coming soon
                        </span>
                      )}
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
                    {isDone ? (
                      <button
                        type="button"
                        onClick={() => launchSection(section)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Retake
                      </button>
                    ) : isCurrent ? (
                      <button
                        type="button"
                        onClick={() => launchSection(section)}
                        className="arena-primary-btn cta-sheen inline-flex items-center gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Start
                      </button>
                    ) : isLocked ? (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">
                        <Lock className="h-4 w-4" />
                        Locked
                      </span>
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
                  : nextSection
                    ? `Up next: ${nextSection.title}. Finish it to unlock the next section.`
                    : 'You have finished every live section of this mock.'}
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
                  Finish all four live sections in order to unlock a combined IELTS band (Reading &amp; Listening
                  auto-scored, Writing &amp; Speaking graded by the AI examiner).
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
