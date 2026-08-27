import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Calculator,
  CheckCircle2,
  Clock3,
  FileQuestion,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import {
  getSATSectionTest,
  isSATSection,
  SAT_TEST_CATALOG,
} from '@/features/sat/catalog'

function formatMinutes(seconds: number) {
  return `${Math.round(seconds / 60)} min`
}

export default function SATSection() {
  const navigate = useNavigate()
  const { section } = useParams<{ section: string }>()

  if (!isSATSection(section)) return <Navigate to="/sat" replace />

  const isMath = section === 'math'
  const title = isMath ? 'SAT Math' : 'SAT Reading & Writing'
  const description = isMath
    ? 'Only Math practice tests are shown here. Each test contains the two Math modules.'
    : 'Only Reading & Writing practice tests are shown here. Each test contains the two Reading & Writing modules.'
  const tests = Object.values(SAT_TEST_CATALOG)
    .sort((a, b) => a.mockId - b.mockId)
    .map((test) => getSATSectionTest(test.mockId, section))

  return (
    <main className="workspace-page min-h-screen bg-[linear-gradient(145deg,#eef3f9_0%,#f8fafc_48%,#fff2f2_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[88rem]">
        <button
          type="button"
          onClick={() => navigate('/sat')}
          className="route-back-button"
        >
          <ArrowLeft className="h-4 w-4" /> SAT Prep
        </button>

        <header className="mt-5 overflow-hidden rounded-[2rem] border border-white/90 bg-white/70 p-6 shadow-[0_24px_70px_rgba(55,65,100,0.12)] backdrop-blur-2xl sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-red-600">Section practice</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-6xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">{description}</p>
            </div>
            <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] text-white shadow-xl ${isMath ? 'bg-gradient-to-br from-red-500 to-rose-700' : 'bg-gradient-to-br from-blue-500 to-indigo-700'}`}>
              {isMath ? <Calculator className="h-9 w-9" /> : <BookOpenText className="h-9 w-9" />}
            </span>
          </div>
        </header>

        <section className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Available tests</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">Choose a {title.replace('SAT ', '')} test</h2>
            </div>
            <p className="text-xs font-bold text-slate-500">{tests.length} available</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {tests.map((test) => {
              const attempt = loadSATAttempt(test.id)
              const answered = Object.values(attempt?.answers ?? {}).filter((answer) => answer.trim()).length
              const action = attempt?.status === 'active' ? 'Continue' : attempt?.status === 'submitted' ? 'Review' : 'Start test'

              return (
                <article key={test.id} className="rounded-[1.8rem] border border-white/90 bg-white/75 p-5 shadow-[0_20px_55px_rgba(15,23,42,.09)] backdrop-blur-xl sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${isMath ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {isMath ? 'Math only' : 'Reading & Writing only'}
                      </span>
                      <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-slate-950">Practice Test {test.mockId}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{test.badge}</p>
                    </div>
                    {attempt?.status === 'submitted' ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <FileQuestion className="h-6 w-6 text-slate-400" />}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600">{test.questionCount} questions</span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600"><Clock3 className="h-3.5 w-3.5" /> {formatMinutes(test.totalDurationSeconds)}</span>
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600">{test.modules.length} modules</span>
                  </div>

                  {attempt ? (
                    <div className="mt-5">
                      <div className="flex justify-between text-[10px] font-black text-slate-500"><span>{attempt.status === 'submitted' ? 'Completed' : 'Saved progress'}</span><span>{answered}/{test.questionCount}</span></div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-red-500" style={{ width: `${Math.round((answered / test.questionCount) * 100)}%` }} /></div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => navigate(`/mock/sat/${test.mockId}?section=${section}`)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-lg hover:-translate-y-0.5"
                  >
                    {action} <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
