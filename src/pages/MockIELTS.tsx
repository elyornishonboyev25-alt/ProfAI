import { useCopy } from '@/i18n/interface'
import { useEffect, useMemo, useState } from 'react'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { useStudyAccessPrompt } from '@/features/billing/useStudyAccessPrompt'
import StudyAccessChip from '@/features/billing/StudyAccessChip'
import { useAuthStore } from '@/store/authStore'
import UiText from '@/components/common/UiText'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Headphones,
  Mic2,
  PenSquare,
  Search,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import './mock-ielts.css'
import {
  formatMockDuration,
  getFullMockCatalog,
  getFullMockResults,
  calculateFullMockOverallBand,
  getFullMockChosenMode,
  getFullMockMode,
  FULL_MOCK_PROGRESS_EVENT,
  MOCK_SECTION_COUNT,
  retakeFullMock,
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
  const { c: uiCopy } = useCopy()
  const studyAccess = useStudyAccessPrompt()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const mocks = useMemo(() => getFullMockCatalog(), [])
  const fullyReadyCount = useMemo(() => mocks.filter((mock) => mock.fullyReady).length, [mocks])
  const [filter, setFilter] = useState<MockFilter>('all')
  const [search, setSearch] = useState('')
  const [progressVersion, setProgressVersion] = useState(0)
  const [retakeError, setRetakeError] = useState('')
  const revision = useAccountDataRevision()
  const owner = useAuthStore(state => state.user?.id ?? 'guest')

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

  const resultsByMock = useMemo(() => {
    void progressVersion
    return new Map(mocks.map((mock) => [mock.id, getFullMockResults(mock.id, owner)]))
  }, [mocks, progressVersion, revision, owner])
  const completedByMock = useMemo(() => new Map(mocks.map(mock => [mock.id, new Set(Object.keys(resultsByMock.get(mock.id) ?? {}) as MockSectionKey[])])), [mocks, resultsByMock])
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
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"><UiText text={"Full mock exams"} /></h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">Four skills in one mock. Take it in Exam mode like the real test, or in Practice mode one section at a time. Your overall band appears after all four.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={uiCopy("Search mock...")}
              aria-label={uiCopy("Search full mocks")}
              className="mock-ielts-glass-search h-11 w-full rounded-full pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-[36rem] sm:gap-3" aria-label={uiCopy("Full mock availability")}>
        {[
          { value: fullyReadyCount, label: 'Ready to take' },
          { value: inProgressCount, label: 'In progress' },
          { value: completedCount, label: 'Completed' },
        ].map((metric) => (
          <div key={metric.label} className="mock-ielts-glass-metric rounded-2xl px-3 py-2.5 sm:px-4">
            <strong className="block text-xl font-black leading-none tracking-tight text-slate-950">{metric.value}</strong>
            <span className="mt-1 block text-[10px] font-bold text-slate-500 sm:text-[11px]"><UiText text={metric.label} /></span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={uiCopy("Filter full mocks")}>
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className="mock-ielts-glass-filter rounded-full px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
            >
              <UiText text={label} />
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-slate-500">{visibleMocks.length} <UiText text={"shown"} /></span>
      </div>

      {visibleMocks.length ? (
        <div className="mock-ielts-rows mt-5">
          {visibleMocks.map((mock) => {
            const doneSections = completedByMock.get(mock.id) ?? new Set<MockSectionKey>()
            const doneCount = doneSections.size
            const finished = doneCount === MOCK_SECTION_COUNT
            const inProgress = doneCount > 0 && !finished
            const overall = finished ? calculateFullMockOverallBand(resultsByMock.get(mock.id) ?? {}) : null
            const mode = doneCount || getFullMockChosenMode(mock.id, owner) ? getFullMockMode(mock.id, owner) : null

            return (
              <article
                key={mock.id}
                onClick={event => { if (!(event.target as HTMLElement).closest('button')) event.currentTarget.querySelector<HTMLButtonElement>('.mock-ielts-card-open')?.click() }}
                className={`ielts-catalog-card mock-ielts-glass-card mock-ielts-row${finished ? ' is-finished' : inProgress ? ' is-progress' : ''}`}
              >
                <span className="mock-ielts-row-index" aria-hidden="true"><small>MOCK</small>{String(mock.index).padStart(2, '0')}</span>
                <div className="mock-ielts-row-copy">
                  <div className="mock-ielts-row-title">
                    <h2><UiText text={"Full Mock"} /> {mock.index}</h2>
                    <StudyAccessChip resource={`mock:ielts:${mock.id}`} />
                  </div>
                  <p>
                    <Clock3 size={13} aria-hidden="true" /> {formatMockDuration(mock.totalMinutes)}
                    {mode && <span className={`mock-ielts-row-mode is-${mode}`}><UiText text={mode === 'exam' ? 'Exam mode' : 'Practice mode'} /></span>}
                    {!mock.fullyReady && <span className="mock-ielts-row-mode">{mock.readyCount}/{MOCK_SECTION_COUNT} <UiText text={"ready"} /></span>}
                  </p>
                </div>

                <div className="mock-ielts-row-skills" aria-label="Section progress">
                  {mock.sections.map((section) => {
                    const Icon = SECTION_ICONS[section.key]
                    const done = doneSections.has(section.key)
                    return (
                      <span
                        key={section.key}
                        title={`${section.title} — ${done ? 'Completed by you' : section.available ? 'Not completed yet' : 'Coming soon'}`}
                        className={`mock-ielts-skill ${done ? 'is-done' : section.available ? 'is-todo' : 'is-soon'}`}
                      >
                        {done ? <CheckCircle2 size={13} /> : <Icon size={13} />}
                        {SECTION_SHORT[section.key]}
                        <span className="sr-only">{done ? ' completed' : ' not completed'}</span>
                      </span>
                    )
                  })}
                </div>

                <div className="mock-ielts-row-result">
                  {finished
                    ? overall !== null
                      ? <><strong>{overall.toFixed(1)}</strong><small><UiText text="Overall band" /></small></>
                      : <small className="is-pending"><UiText text="Assessment pending" /></small>
                    : null}
                </div>

                <div className="mock-ielts-card-actions">
                  {finished ? <><button type="button" className="mock-ielts-glass-open mock-ielts-card-open" aria-label={uiCopy("Review Full Mock {{value1}}", { value1: String(mock.index) })} onClick={() => navigate(`/mock/ielts/${mock.id}`, { state: { from: from ?? 'ielts' } })}><UiText text="View results" /></button><button type="button" className="mock-ielts-glass-open mock-ielts-retake" aria-label={uiCopy("Retake Full Mock {{value1}}", { value1: String(mock.index) })} title="Retake" onClick={() => {
                    if (!studyAccess.open(`mock:ielts:${mock.id}`)) return
                    if (!retakeFullMock(mock.id)) { setRetakeError('Unable to save your previous attempt. Please try again.'); return }
                    setRetakeError('')
                    navigate(`/mock/ielts/${mock.id}`, { state: { from: from ?? 'ielts' } })
                  }}><RotateCcw size={14} /> <UiText text="Retake" /></button></> :
                  <button type="button" className={`mock-ielts-glass-open mock-ielts-card-open${inProgress ? '' : ' is-primary'}`} aria-label={uiCopy("{{value1}} Full Mock {{value2}}", { value1: String(inProgress ? 'Resume' : 'Start'), value2: String(mock.index) })} onClick={() => {
                    if (!studyAccess.open(`mock:ielts:${mock.id}`)) return
                    navigate(`/mock/ielts/${mock.id}`, { state: { from: from ?? 'ielts' } })
                  }}>{inProgress ? <UiText text={"Resume"} /> : <UiText text={"Start"} />} <ArrowRight size={14} /></button>}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mock-ielts-glass-empty mt-5 rounded-[1.75rem] border border-dashed border-red-200 px-4 py-12 text-center text-sm font-semibold text-slate-600" role="status"><UiText text={"No mocks found for this filter."} /></div>
      )}
      {retakeError && <p role="alert" className="mt-3 text-sm text-red-700">{retakeError}</p>}
    </section>
  )
}

export default function MockIELTS({ embedded = false }: { embedded?: boolean }) {
  const location = useLocation()
  if (!embedded) return <Navigate to="/ielts/tests#mocks" replace state={location.state} />
  return <IELTSMockCatalog />
}
