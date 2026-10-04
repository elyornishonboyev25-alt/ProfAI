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
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import './mock-ielts.css'
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
  const mocks = useMemo(() => getFullMockCatalog(), [])
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
  const inProgressCount = useMemo(() => [...completedByMock.values()].filter((done) => done.size > 0 && done.size < MOCK_SECTION_COUNT).length, [completedByMock])
  const completedCount = useMemo(() => [...completedByMock.values()].filter((done) => done.size === MOCK_SECTION_COUNT).length, [completedByMock])

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
    <section id="mocks" className="mock-ielts-glass relative isolate scroll-mt-24 overflow-hidden p-4 sm:p-5 lg:p-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">IELTS Academic</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Full mock exams</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">Four skills. One uninterrupted exam. Your overall band and review open after Speaking.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search mock..."
              aria-label="Search full mocks"
              className="mock-ielts-glass-search h-11 w-full rounded-full pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-[36rem] sm:gap-3" aria-label="Full mock availability">
        {[
          { value: fullyReadyCount, label: 'Ready to take' },
          { value: inProgressCount, label: 'In progress' },
          { value: completedCount, label: 'Completed' },
        ].map((metric) => (
          <div key={metric.label} className="mock-ielts-glass-metric rounded-2xl px-3 py-2.5 sm:px-4">
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
              className="mock-ielts-glass-filter rounded-full px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
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
                className="ielts-catalog-card mock-ielts-glass-card group relative flex min-h-[14.5rem] w-full flex-col overflow-hidden p-5 text-left transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">IELTS FULL MOCK {String(mock.index).padStart(2, '0')}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${mock.fullyReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : mock.readyCount > 0 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {mock.readyCount}/{MOCK_SECTION_COUNT} ready
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">Full Mock {mock.index}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">Listening → Reading → Writing → Speaking</p>

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
                  <span className="mock-ielts-glass-open inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black">{inProgress ? 'Resume' : finished ? 'Review' : 'Open'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /></span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mock-ielts-glass-empty mt-5 rounded-[1.75rem] border border-dashed border-red-200 px-4 py-12 text-center text-sm font-semibold text-slate-600" role="status">No mocks found for this filter.</div>
      )}
    </section>
  )
}

export default function MockIELTS({ embedded = false }: { embedded?: boolean }) {
  const location = useLocation()
  if (!embedded) return <Navigate to="/ielts/tests#mocks" replace state={location.state} />
  return <IELTSMockCatalog />
}
