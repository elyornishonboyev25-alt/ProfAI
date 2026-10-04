import TestVocabulary from '@/components/vocab/TestVocabulary'
import UiText from '@/components/common/UiText'
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
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Reveal } from '@/components/fx'
import { useAuthStore } from '@/store/authStore'
import { useBadgeStore } from '@/store/badgeStore'
import {
  formatMockDuration,
  FULL_MOCK_PROGRESS_EVENT,
  getFullMockById,
  getFullMockCompletedSections,
  getFullMockOverallBand,
  getFullMockResults,
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
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const awardBadge = useBadgeStore((state) => state.awardIfEligible)
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
  const sectionResults = useMemo(() => {
    void completedKeys
    return mockId ? getFullMockResults(mockId) : {}
  }, [completedKeys, mockId])
  const overallBand = mockId ? getFullMockOverallBand(mockId) : null

  useEffect(() => {
    if (!mock?.fullyReady || completedKeys.length !== MOCK_SECTION_COUNT || overallBand === null) return
    awardBadge({ userId, track: 'IELTS_OVERALL', band: overallBand, mode: 'full_mock', source: 'ielts-full-mock' })
  }, [awardBadge, completedKeys.length, mock?.fullyReady, overallBand, userId])

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

  const reviewSection = (section: MockSection) => {
    const saved = sectionResults[section.key]
    if (!saved?.result || !section.launchPath) return
    navigate(section.launchPath, { state: {
      entry: 'mock-ielts', from: from ?? 'mock',
      mock: { id: mock.id, section: section.key },
      reviewPayload: { result: saved.result, showCorrectAnswers: true },
    } })
  }

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <Reveal>
          <section className="premium-hero overflow-hidden border border-red-100 bg-[radial-gradient(circle_at_95%_0%,rgba(239,68,68,.14),transparent_40%),linear-gradient(145deg,#fff,#fff7f7)] p-6 shadow-[0_24px_50px_rgba(95,40,40,.08)] sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="premium-top-controls">
                  <button
                    onClick={() => navigate('/ielts/tests#mocks', { state: { from: from ?? 'mock' } })}
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
                  One continuous exam: Listening, Reading, Writing, then Speaking. Your overall band and review appear only after all four sections finish.
                </p>
              </div>

              <div className="premium-stat rounded-3xl bg-gradient-to-br from-white via-rose-50/70 to-red-100/65 px-5 py-4 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Total Session</p>
                <p className="mt-1 text-4xl font-black text-slate-900">{formatMockDuration(mock.totalMinutes)}</p>
                <p className="mt-2 text-xs font-semibold text-red-700">
                  {liveDone}/{MOCK_SECTION_COUNT} sections complete
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
                        {section.durationMinutes}  <UiText text={"min"} /> </span>
                      <span>·</span>
                      <span>{section.meta}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDone ? (
                      allSectionsDone && sectionResults[section.key]?.result ? (
                        <button type="button" onClick={() => reviewSection(section)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50">Review</button>
                      ) : <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Complete</span>
                    ) : isCurrent ? (
                      <button
                        type="button"
                        onClick={() => launchSection(section)}
                        className="arena-primary-btn cta-sheen inline-flex items-center gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                         <UiText text={"Start"} /> </button>
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
                    ? `Up next: ${nextSection.title}. Your score stays hidden until the exam ends.`
                    : 'You have finished every live section of this mock.'}
              </p>
            </article>

            <article className="surface-card p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                <Sparkles className="h-4 w-4" />
                Combined band
              </p>
              {allSectionsDone && overallBand !== null ? (
                <div className="mt-4">
                  <p className="text-5xl font-black tracking-tight text-slate-950">{overallBand.toFixed(1)}<span className="ml-2 text-sm font-semibold text-slate-500">overall band</span></p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Practice estimate. Listening and Reading are auto scored; Writing and Speaking use AI evaluation.</p>
                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    {mock.sections.map((section) => {
                      const saved = sectionResults[section.key]
                      return <div key={section.key} className="rounded-xl bg-slate-50 px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-slate-700">{section.title}</span>
                          <strong className="text-lg text-slate-950">{saved?.band.toFixed(1)}</strong>
                        </div>
                        {saved?.summary ? <p className="mt-1 text-xs leading-5 text-slate-600">{saved.summary}</p> : null}
                        <TestVocabulary testId={saved?.testId ?? ''} skill={section.key} variant="review" />
                        {saved?.result ? <button type="button" onClick={() => reviewSection(section)} className="mt-2 text-xs font-bold text-red-700 hover:underline">Review answers →</button> : null}
                        {saved?.review?.length ? <details className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-700">
                          <summary className="cursor-pointer font-bold text-red-700">Review {section.title.toLowerCase()} responses</summary>
                          <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                            {saved.review.map((item, index) => <div key={index} className="rounded-lg bg-white p-3">
                              <p className="font-bold text-slate-900">{item.label}</p>
                              <p className="mt-1 whitespace-pre-wrap leading-5">{item.response || 'No response recorded.'}</p>
                              {item.feedback ? <p className="mt-2 border-t border-slate-100 pt-2 leading-5 text-slate-500">{item.feedback}</p> : null}
                            </div>)}
                          </div>
                        </details> : null}
                      </div>
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-600">Your overall band and review unlock when all four sections finish. Section scores stay hidden during the exam.</p>
              )}
            </article>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
