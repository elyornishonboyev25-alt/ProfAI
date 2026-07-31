import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  Mic2,
  PenSquare,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import {
  formatMockDuration,
  getFullMockCatalog,
  getFullMockCompletedSections,
  FULL_MOCK_PROGRESS_EVENT,
  MOCK_SECTION_COUNT,
  type MockSectionKey,
} from '@/utils/ieltsMockCatalog'

const SECTION_ICONS: Record<MockSectionKey, LucideIcon> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenSquare,
  speaking: Mic2,
}

const SECTION_SHORT: Record<MockSectionKey, string> = {
  listening: 'L',
  reading: 'R',
  writing: 'W',
  speaking: 'S',
}

export default function MockIELTS() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const mockTrial = useFeatureTrial('mock')

  const mocks = useMemo(() => getFullMockCatalog(), [])
  const liveMocks = useMemo(() => mocks.filter((mock) => mock.readyCount > 0).length, [mocks])
  const fullyReadyMocks = useMemo(() => mocks.filter((mock) => mock.fullyReady).length, [mocks])

  // Per-mock user completion (localStorage-backed, updated live by the runners).
  const [progressVersion, setProgressVersion] = useState(0)
  const [filter, setFilter] = useState<'all' | 'available' | 'progress' | 'completed'>('all')
  useEffect(() => {
    const bump = () => setProgressVersion((version) => version + 1)
    window.addEventListener(FULL_MOCK_PROGRESS_EVENT, bump)
    return () => window.removeEventListener(FULL_MOCK_PROGRESS_EVENT, bump)
  }, [])
  const completedByMock = useMemo(() => {
    void progressVersion
    return new Map(mocks.map((mock) => [mock.id, new Set(getFullMockCompletedSections(mock.id))]))
  }, [mocks, progressVersion])
  const visibleMocks = useMemo(
    () =>
      mocks.filter((mock) => {
        const done = completedByMock.get(mock.id)?.size ?? 0
        if (filter === 'available') return mock.readyCount > 0
        if (filter === 'progress') return done > 0 && done < mock.readyCount
        if (filter === 'completed') return mock.readyCount > 0 && done >= mock.readyCount
        return true
      }),
    [completedByMock, filter, mocks],
  )

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <Reveal>
          <section className="premium-hero p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="premium-top-controls">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="premium-back-btn"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Dashboard
                  </button>
                  <span className="premium-top-chip">IELTS Mock Suite</span>
                  {!mockTrial.isPremium && Number.isFinite(mockTrial.remaining) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      {Math.max(0, mockTrial.remaining)}/{mockTrial.limit} free mocks left
                    </span>
                  ) : null}
                </div>
                <h1 className="premium-section-title mt-4">
                  30 Full <span className="arena-title-accent-red">IELTS Mocks</span>
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  Every Full Mock bundles all four sections — Listening, Reading, Writing and Speaking — in official
                  exam order. Open a mock to run its sections one by one under real test timing.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Full-length timing
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    <Target className="h-3.5 w-3.5" />
                    4 sections per mock
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Official exam order
                  </span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:w-[31rem]">
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Full Mocks</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={mocks.length} />
                  </p>
                  <p className="hero-metric-note">Mock 1 → 30</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Playable now</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={liveMocks} />
                  </p>
                  <p className="hero-metric-note">At least one live section</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Complete</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={fullyReadyMocks} />
                  </p>
                  <p className="hero-metric-note">All 4 sections live</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/80 bg-white/75 p-3 shadow-[0_18px_38px_rgba(127,29,29,0.1)] backdrop-blur-xl">
            <div className="flex flex-wrap gap-2">
              {([
                ['all', 'All 30'],
                ['available', 'Available'],
                ['progress', 'In progress'],
                ['completed', 'Completed'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    filter === value
                      ? 'cta-sheen bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_9px_20px_rgba(220,38,38,0.28)]'
                      : 'border border-red-100 bg-white text-slate-600 hover:border-red-200 hover:text-red-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-slate-500">{visibleMocks.length} mock shown</p>
          </div>
        </Reveal>

        <Stagger key={filter} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleMocks.map((mock) => {
            const isLive = mock.readyCount > 0
            const doneSections = completedByMock.get(mock.id) ?? new Set<MockSectionKey>()
            const doneCount = doneSections.size
            const inProgress = doneCount > 0 && doneCount < mock.readyCount
            const finished = mock.readyCount > 0 && doneCount >= mock.readyCount
            return (
              <StaggerItem key={mock.id} className="h-full">
                <Tilt3D className="h-full rounded-[1.6rem]" max={5}>
                  <button
                    onClick={() => navigate(`/mock/ielts/${mock.id}`, { state: { from: from ?? 'mock' } })}
                    className="interactive-lift group flex h-full w-full flex-col rounded-[1.6rem] border border-red-200 bg-gradient-to-br from-white via-rose-50 to-red-100/60 p-5 text-left shadow-[0_16px_32px_rgba(220,38,38,0.13)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
                          Full Mock {mock.index}
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-slate-900">Mock {mock.index}</h2>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          mock.fullyReady
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                            : isLive
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-slate-200 bg-slate-100 text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {mock.readyCount}/{MOCK_SECTION_COUNT} ready
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {mock.sections.map((section) => {
                        const Icon = SECTION_ICONS[section.key]
                        const done = doneSections.has(section.key)
                        return (
                          <span
                            key={section.key}
                            title={`${section.title} — ${done ? 'Completed by you' : section.available ? 'Ready' : 'Coming soon'}`}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                              done
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_4px_10px_rgba(16,185,129,0.3)]'
                                : section.available
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 bg-white text-slate-400'
                            }`}
                          >
                            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                            {SECTION_SHORT[section.key]}
                          </span>
                        )
                      })}
                    </div>

                    {/* Resume progress bar (concept: 15-Mock-Catalog) */}
                    {inProgress ? (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-red-700">Resume · {doneCount}/{MOCK_SECTION_COUNT} done</span>
                          <span className="text-slate-400">{Math.round((doneCount / MOCK_SECTION_COUNT) * 100)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-red-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#DC2626] to-[#E11D48] transition-[width] duration-700"
                            style={{ width: `${(doneCount / MOCK_SECTION_COUNT) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : finished ? (
                      <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Completed
                      </div>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatMockDuration(mock.totalMinutes)} session
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-red-700 transition group-hover:translate-x-0.5">
                        {inProgress ? 'Resume' : finished ? 'Review' : 'Open'}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                </Tilt3D>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </div>
  )
}
