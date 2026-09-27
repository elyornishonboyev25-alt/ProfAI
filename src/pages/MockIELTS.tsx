import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Headphones,
  Mic2,
  PenSquare,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
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

const FILTERS = [
  { id: 'all', label: 'All mocks' },
  { id: 'available', label: 'Available' },
  { id: 'progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
] as const

type MockFilter = (typeof FILTERS)[number]['id']

function IELTSMockCatalog() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const mockTrial = useFeatureTrial('mock')
  const mocks = useMemo(() => getFullMockCatalog(), [])
  const availableCount = useMemo(() => mocks.filter((mock) => mock.readyCount > 0).length, [mocks])
  const fullyReadyCount = useMemo(() => mocks.filter((mock) => mock.fullyReady).length, [mocks])
  const [filter, setFilter] = useState<MockFilter>('all')
  const [search, setSearch] = useState('')
  const [progressVersion, setProgressVersion] = useState(0)

  useEffect(() => {
    const refresh = () => setProgressVersion((version) => version + 1)
    window.addEventListener(FULL_MOCK_PROGRESS_EVENT, refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener(FULL_MOCK_PROGRESS_EVENT, refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const completedByMock = useMemo(() => {
    void progressVersion
    return new Map(mocks.map((mock) => [mock.id, new Set(getFullMockCompletedSections(mock.id))]))
  }, [mocks, progressVersion])

  const visibleMocks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return mocks.filter((mock) => {
      const done = completedByMock.get(mock.id)?.size ?? 0
      const finished = done === MOCK_SECTION_COUNT
      if (filter === 'available' && mock.readyCount === 0) return false
      if (filter === 'progress' && (done === 0 || finished)) return false
      if (filter === 'completed' && !finished) return false
      return !query || `mock ${mock.index} full mock ${mock.index} ielts`.includes(query)
    })
  }, [completedByMock, filter, mocks, search])

  return (
    <section id="mocks" className="relative isolate scroll-mt-24 overflow-hidden rounded-[2.25rem] border border-white/90 bg-white/86 p-4 shadow-[0_24px_64px_rgba(30,48,70,.09),inset_0_1px_0_white] sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_92%_0%,rgba(190,35,53,.07),transparent_30%),radial-gradient(circle_at_5%_100%,rgba(185,183,190,.12),transparent_35%)]" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">IELTS Academic</p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-950">Full mock tests</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">Listening, Reading, Writing and Speaking in official exam order. Your progress stays with each mock.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search mock..."
              className="h-11 w-full rounded-full border border-white/90 bg-white/86 pl-10 pr-4 text-sm text-slate-900 shadow-[0_8px_22px_rgba(30,48,70,.06)] outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
            />
          </label>
          {!mockTrial.isPremium && Number.isFinite(mockTrial.remaining) ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white/75 px-3 py-1 text-[11px] font-bold text-red-700">
              <Sparkles className="h-3.5 w-3.5" /> {Math.max(0, mockTrial.remaining)} free mocks left
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-[36rem] sm:gap-3" aria-label="Full mock availability">
        {[
          { value: mocks.length, label: 'Full mocks' },
          { value: availableCount, label: 'Available now' },
          { value: fullyReadyCount, label: 'All 4 ready' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/90 bg-white/70 px-3 py-2.5 shadow-[0_7px_20px_rgba(30,48,70,.05)] sm:px-4">
            <strong className="block text-xl font-black leading-none tracking-tight text-slate-950">{metric.value}</strong>
            <span className="mt-1 block text-[10px] font-bold text-slate-500 sm:text-[11px]">{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter full mocks">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`rounded-full border px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 ${filter === id ? 'border-red-200 bg-red-50 text-red-700 shadow-[0_6px_16px_rgba(185,28,28,.08)]' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-red-200 hover:bg-white hover:text-red-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-slate-500">{visibleMocks.length} shown</span>
      </div>

      {visibleMocks.length ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleMocks.map((mock) => {
            const doneSections = completedByMock.get(mock.id) ?? new Set<MockSectionKey>()
            const doneCount = doneSections.size
            const finished = doneCount === MOCK_SECTION_COUNT
            const inProgress = doneCount > 0 && !finished

            return (
              <button
                key={mock.id}
                type="button"
                onClick={() => navigate(`/mock/ielts/${mock.id}`, { state: { from: from ?? 'ielts' } })}
                className="ielts-catalog-card group relative flex min-h-[14.5rem] w-full flex-col overflow-hidden rounded-[1.75rem] border border-red-100/90 bg-[linear-gradient(145deg,rgba(255,255,255,.96),rgba(254,242,242,.62)_58%,rgba(241,240,243,.67))] p-6 text-left shadow-[0_12px_34px_rgba(70,50,56,.07),inset_0_1px_0_white] transition-[border-color,box-shadow] duration-150 hover:border-red-200 hover:shadow-[0_18px_42px_rgba(185,28,28,.1),inset_0_1px_0_white] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">IELTS FULL MOCK {String(mock.index).padStart(2, '0')}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${mock.fullyReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : mock.readyCount > 0 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {mock.readyCount}/{MOCK_SECTION_COUNT} ready
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">Full Mock {mock.index}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Four skills in one exam flow</p>

                <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Section availability">
                  {mock.sections.map((section) => {
                    const Icon = SECTION_ICONS[section.key]
                    const done = doneSections.has(section.key)
                    return (
                      <span
                        key={section.key}
                        title={`${section.title} — ${done ? 'Completed by you' : section.available ? 'Ready' : 'Coming soon'}`}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${done ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : section.available ? 'border-red-100 bg-white/90 text-red-700' : 'border-slate-200 bg-white/60 text-slate-400'}`}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                        {SECTION_SHORT[section.key]}
                      </span>
                    )
                  })}
                </div>

                {inProgress ? (
                  <div className="mt-3" aria-label={`${doneCount} of ${MOCK_SECTION_COUNT} sections completed`}>
                    <div className="flex items-center justify-between text-[11px] font-bold text-red-700"><span>{doneCount}/{MOCK_SECTION_COUNT} completed</span><span>{Math.round((doneCount / MOCK_SECTION_COUNT) * 100)}%</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-red-100"><div className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400" style={{ width: `${(doneCount / MOCK_SECTION_COUNT) * 100}%` }} /></div>
                  </div>
                ) : finished ? (
                  <span className="mt-3 inline-flex items-center gap-1 self-start rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>
                ) : null}

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><Clock3 className="h-4 w-4" /> {formatMockDuration(mock.totalMinutes)} session</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-black text-red-700">{inProgress ? 'Resume' : finished ? 'Review' : 'Open'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-red-200 bg-white/65 px-4 py-12 text-center text-sm font-semibold text-slate-500">No mocks found for this filter.</div>
      )}
    </section>
  )
}

export default function MockIELTS({ embedded = false }: { embedded?: boolean }) {
  const location = useLocation()
  if (!embedded) return <Navigate to="/ielts/tests#mocks" replace state={location.state} />
  return <IELTSMockCatalog />
}
