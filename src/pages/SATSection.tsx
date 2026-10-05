import { useState, type KeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpenText, Calculator, CheckCircle2, Clock3, Layers3, Search } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import { getSATSectionTest, isSATSection, SAT_TEST_CATALOG, satAvailabilityNote } from '@/features/sat/catalog'
import './mock-ielts.css'

const tabs = [
  { id: 'reading-writing', label: 'Reading & Writing', detail: 'Evidence and expression', icon: BookOpenText },
  { id: 'math', label: 'Math', detail: 'Problem solving', icon: Calculator },
  { id: 'mocks', label: 'Full Mocks', detail: 'Both sections together', icon: Layers3 },
] as const

type TabId = (typeof tabs)[number]['id']

function isTabId(value: string | undefined): value is TabId {
  return value === 'mocks' || isSATSection(value)
}

export default function SATSection() {
  const navigate = useNavigate()
  const { section } = useParams<{ section: string }>()
  const [search, setSearch] = useState('')

  if (!isTabId(section)) return <Navigate to="/sat" replace />

  const activeTab = tabs.find((tab) => tab.id === section)!
  const isFullMock = section === 'mocks'
  const tests = Object.values(SAT_TEST_CATALOG)
    .sort((a, b) => a.mockId - b.mockId)
    .map((test) => isFullMock ? test : getSATSectionTest(test.mockId, section))
  const query = search.trim().toLowerCase()
  const visibleTests = tests.filter((test) =>
    `${test.mockId} ${isFullMock ? 'Full Mock' : 'Practice Test'} ${test.title} ${test.badge} ${test.subtitle}`.toLowerCase().includes(query),
  )

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tab: TabId) => {
    const index = tabs.findIndex((item) => item.id === tab)
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? tabs.length - 1 : -1
    if (nextIndex < 0) return
    event.preventDefault()
    const nextTab = tabs[nextIndex].id
    navigate(`/sat/${nextTab}`)
    document.getElementById(`sat-tab-${nextTab}`)?.focus()
  }

  return (
    <main className="workspace-page relative min-h-screen px-4 pb-20 pt-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <div className="sticky top-2 z-20 rounded-2xl border border-white bg-white/95 p-2 shadow-[0_12px_35px_rgba(15,23,42,.09)]">
          <div role="tablist" aria-label="SAT test sections" className="flex gap-2 overflow-x-auto">
            {tabs.map(({ id, label, detail, icon: Icon }) => (
              <button key={id} id={`sat-tab-${id}`} type="button" role="tab" tabIndex={section === id ? 0 : -1}
                aria-selected={section === id} aria-controls="sat-test-panel"
                onKeyDown={(event) => handleTabKeyDown(event, id)} onClick={() => navigate(`/sat/${id}`)}
                className={`flex min-w-[11rem] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${section === id ? 'border-red-200 bg-gradient-to-br from-white to-red-50 text-red-700 shadow-[0_6px_18px_rgba(185,28,28,.08)]' : 'border-transparent text-slate-800 hover:bg-red-50/70'}`}>
                <Icon className="h-5 w-5 shrink-0 text-red-600" />
                <span><strong className="block text-sm">{label}</strong><small className="block whitespace-nowrap text-[11px] font-semibold text-slate-500">{detail}</small></span>
              </button>
            ))}
          </div>
        </div>

        <div id="sat-test-panel" role="tabpanel" tabIndex={0} aria-labelledby={`sat-tab-${section}`} className="mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
          <section className="mock-ielts-glass relative isolate overflow-hidden p-4 sm:p-5 lg:p-6">
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <button type="button" onClick={() => navigate('/sat')} className="route-back-button mb-5"><ArrowLeft className="h-4 w-4" /> SAT Prep</button>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">Digital SAT</p>
                <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-950">{isFullMock ? 'Full mock exams' : `${activeTab.label} tests`}</h1>
                <p className="mt-1 text-xs font-semibold text-slate-500">{tests.length} available · {isFullMock ? 'Reading & Writing and Math together' : 'Practice one SAT section at a time'}</p>
              </div>
              <label className="relative block w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search test..." aria-label="Search SAT tests"
                  className="mock-ielts-glass-search h-11 w-full rounded-full pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-red-100" />
              </label>
            </div>

            {visibleTests.length === 0 ? (
              <div className="relative mt-5 rounded-[1.75rem] border border-dashed border-blue-200 bg-white/64 px-4 py-12 text-center text-sm font-semibold text-slate-500">No tests found.</div>
            ) : (
              <div className="relative mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleTests.map((test) => {
                  const attempt = loadSATAttempt(test.id)
                  const answered = Object.values(attempt?.answers ?? {}).filter((answer) => answer.trim()).length
                  const note = satAvailabilityNote(test)
                  const expectedModules = isFullMock ? 4 : 2
                  const readyModules = test.modules.length
                  const durationMinutes = Math.round(test.totalDurationSeconds / 60)
                  const duration = durationMinutes >= 60
                    ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ''}`
                    : `${durationMinutes}m`
                  const cardSections = tabs.filter((tab) => tab.id !== 'mocks' && (isFullMock || tab.id === section))
                  const destination = `/mock/sat/${test.mockId}${isFullMock ? '' : `?section=${section}`}`
                  const action = attempt?.status === 'active' ? 'Continue' : attempt?.status === 'submitted' ? 'Review' : 'Open'

                  return (
                    <button key={test.id} type="button" onClick={() => navigate(destination, { state: { from: `/sat/${section}` } })}
                      className="ielts-catalog-card mock-ielts-glass-card group relative flex min-h-[14.5rem] w-full flex-col overflow-hidden p-5 text-left transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">SAT {isFullMock ? 'Full Mock' : activeTab.label} {String(test.mockId).padStart(2, '0')}</span>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${note ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> {readyModules}/{expectedModules} ready
                        </span>
                      </div>
                      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{isFullMock ? 'Full Mock' : 'Practice Test'} {test.mockId}</h2>
                      <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">{test.badge}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5" aria-label="SAT sections">
                        {cardSections.map(({ id, label, icon: Icon }) => (
                          <span key={id} title={label} className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white/90 px-2 py-1 text-[11px] font-bold text-red-700">
                            <Icon className="h-3.5 w-3.5" /> {id === 'math' ? 'Math' : 'R&W'}
                          </span>
                        ))}
                        <span className="self-center text-[11px] font-bold text-slate-500">{test.modules.length} modules · {test.questionCount} questions</span>
                      </div>
                      {note ? <p className="mt-2 text-xs font-semibold text-amber-700">{note}</p> : null}
                      {attempt ? <div className="mt-4" aria-label={`${answered} of ${test.questionCount} questions answered`}>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500"><span>{attempt.status === 'submitted' ? 'Completed' : 'Saved progress'}</span><span>{answered}/{test.questionCount}</span></div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400" style={{ width: `${Math.min(100, (answered / Math.max(1, test.questionCount)) * 100)}%` }} /></div>
                      </div> : null}
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><Clock3 className="h-4 w-4" /> {duration} session</span>
                        <span className="mock-ielts-glass-open inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black">{action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /></span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
