import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Search } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { loadSATAttempt, loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import UiText from '@/components/common/UiText'
import { useAuthStore } from '@/store/authStore'
import { getSATSectionTest, isSATSection, SAT_TEST_CATALOG, satAvailabilityNote } from '@/features/sat/catalog'
import './mock-ielts.css'
import SATSectionTabs, { SAT_SECTION_TABS } from '@/components/sat/SATSectionTabs'

const tabs = SAT_SECTION_TABS
type TabId = 'mocks' | 'reading-writing' | 'math'
function isTabId(value: string | undefined): value is TabId {
  return value === 'mocks' || isSATSection(value)
}

export default function SATSection() {
  const navigate = useNavigate()
  const { section } = useParams<{ section: string }>()
  const [search, setSearch] = useState('')
  useAuthStore((state) => state.user?.id)

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
  const completedTestIds = new Set(loadSATAttemptHistory()
    .filter(({ attempt }) => attempt.status === 'submitted')
    .map(({ attempt }) => attempt.testId))


  return (
    <main className="workspace-page relative min-h-screen px-4 pb-20 pt-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <SATSectionTabs section={section} />

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
                  const completed = attempt?.status === 'submitted' || completedTestIds.has(test.id)
                  const answered = Object.values(attempt?.answers ?? {}).filter((answer) => answer.trim()).length
                  const note = satAvailabilityNote(test)
                  const expectedModules = isFullMock ? 4 : 2
                  const readyModules = test.modules.length
                  const durationMinutes = Math.round(test.totalDurationSeconds / 60)
                  const duration = durationMinutes >= 60
                    ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ''}`
                    : `${durationMinutes}m`
                  const cardSections = tabs.filter((tab) => (tab.id === 'math' || tab.id === 'reading-writing') && (isFullMock || tab.id === section))
                  const destination = `/mock/sat/${test.mockId}${isFullMock ? '' : `?section=${section}`}`
                  const action = attempt?.status === 'active' ? 'Continue' : attempt?.status === 'submitted' ? 'Review' : 'Open'

                  return (
                    <button key={test.id} type="button" onClick={() => navigate(destination, { state: { from: `/sat/${section}` } })}
                      className="ielts-catalog-card mock-ielts-glass-card group relative flex min-h-[14.5rem] w-full flex-col overflow-hidden p-5 text-left transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">SAT {isFullMock ? 'Full Mock' : activeTab.label} {String(test.mockId).padStart(2, '0')}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {completed ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800" data-sat-completed>
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /><UiText text="Completed" />
                          </span> : null}
                          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${note ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> {readyModules}/{expectedModules} ready
                          </span>
                        </div>
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
