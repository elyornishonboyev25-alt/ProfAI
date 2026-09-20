import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SATReview from '@/components/sat/SATReview'
import {
  clearSATAttempt,
  deleteSATAttemptHistoryEntry,
  loadSATAttempt,
  loadSATAttemptHistory,
  type SATAttemptHistoryEntry,
} from '@/features/sat/attemptStorage'
import {
  getSATSectionTest,
  isSATTestComplete,
  SAT_TEST_CATALOG,
  type SATTestDefinition,
} from '@/features/sat/catalog'
import { scoreSATModules } from '@/features/sat/practiceTest4'

const SAT_TESTS = Object.values(SAT_TEST_CATALOG).flatMap((test) => [
  test,
  getSATSectionTest(test.mockId, 'reading-writing'),
  getSATSectionTest(test.mockId, 'math'),
])
const SAT_TESTS_BY_ID = new Map(SAT_TESTS.map((test) => [test.id, test]))

function loadHistoryWithLegacyResults() {
  // Loading the current slots migrates completed pre-history attempts once.
  SAT_TESTS.forEach((test) => loadSATAttempt(test.id))
  return loadSATAttemptHistory()
}

function scoreFor(test: SATTestDefinition, entry: SATAttemptHistoryEntry) {
  const report = scoreSATModules(test.modules, entry.attempt.answers)
  const onlySection = test.modules.every((module) => module.section === test.modules[0]?.section)
  const range = onlySection
    ? test.modules[0]?.section === 'math' ? report.mathRange : report.readingWritingRange
    : report.totalRange

  return {
    accuracy: report.percent,
    correct: report.correct,
    incorrect: report.incorrect,
    unanswered: report.unanswered,
    total: report.correct + report.incorrect + report.unanswered,
    scoreRange: `${range[0]}–${range[1]}`,
  }
}

export default function SATMistakes() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [history, setHistory] = useState(loadHistoryWithLegacyResults)

  const attempts = useMemo(() => history.flatMap((entry) => {
    const test = SAT_TESTS_BY_ID.get(entry.attempt.testId)
    return test ? [{ entry, test, result: scoreFor(test, entry) }] : []
  }), [history])

  const completedAttempts = attempts.filter(({ entry }) => entry.attempt.status === 'submitted')
  const averageAccuracy = completedAttempts.length
    ? completedAttempts.reduce((sum, attempt) => sum + attempt.result.accuracy, 0) / completedAttempts.length
    : 0
  const recoveryQueue = completedAttempts.reduce((sum, attempt) => sum + attempt.result.incorrect + attempt.result.unanswered, 0)

  const deleteAttempt = (entry: SATAttemptHistoryEntry, title: string) => {
    const timestamp = new Date(entry.savedAt).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    if (!window.confirm(`Delete “${title}” saved on ${timestamp}? This cannot be undone.`)) return
    const currentAttempt = loadSATAttempt(entry.attempt.testId)
    if (currentAttempt?.attemptId === entry.id) clearSATAttempt(entry.attempt.testId)
    deleteSATAttemptHistoryEntry(entry.id)
    setHistory(loadSATAttemptHistory())
  }

  const selectedAttemptId = searchParams.get('attempt')
  const selectedAttempt = attempts.find(({ entry }) => entry.id === selectedAttemptId)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedAttemptId])
  const closeReview = () => {
    setSearchParams((params) => {
      params.delete('attempt')
      return params
    })
  }

  if (selectedAttempt) {
    return (
      <SATReview
        key={selectedAttempt.entry.id}
        attempt={selectedAttempt.entry.attempt}
        test={selectedAttempt.test}
        onBack={closeReview}
        backLabel="SAT Mistake Lab"
        historyReview
      />
    )
  }

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-7 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] border border-white/90 bg-white/75 p-6 shadow-[0_24px_60px_rgba(37,99,235,0.12)] backdrop-blur-2xl sm:p-8">
          <button onClick={() => navigate('/sat')} className="route-back-button">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to SAT Prep
          </button>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">SAT-only workspace</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-950">SAT Mistake Lab</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Every submitted full mock, individual section, and unfinished Exit &amp; Save attempt stays here as a separate dated result.</p>
            </div>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_14px_30px_rgba(37,99,235,.3)]">
              <BrainCircuit className="h-6 w-6" />
            </span>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Saved attempts', value: attempts.length.toString(), icon: CheckCircle2 },
            { label: 'Average accuracy', value: completedAttempts.length ? `${averageAccuracy.toFixed(0)}%` : '—', icon: Target },
            { label: 'Mistakes to review', value: recoveryQueue.toString(), icon: TrendingUp },
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <article key={metric.label} className="rounded-2xl border border-white bg-white/75 p-4 shadow-[0_12px_30px_rgba(37,99,235,.08)] backdrop-blur">
                <Icon className="h-4 w-4 text-blue-600" />
                <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{metric.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{metric.value}</p>
              </article>
            )
          })}
        </section>

        <section className="rounded-[2rem] border border-white/90 bg-white/78 p-5 shadow-[0_22px_55px_rgba(37,99,235,.1)] backdrop-blur-2xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Attempt history</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Your SAT review queue</h2>
            </div>
            <Clock3 className="h-5 w-5 text-blue-500" />
          </div>

          {selectedAttemptId ? (
            <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">This saved attempt is no longer available. Choose another result below.</p>
          ) : null}
          <div className="mt-4 space-y-2.5">
            {attempts.length ? (
              attempts.map(({ entry, test, result }) => {
                const completed = entry.attempt.status === 'submitted'
                return (
                  <article key={entry.id} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white p-2">
                    <button
                      type="button"
                      onClick={() => setSearchParams({ attempt: entry.id })}
                      aria-label={`Review ${test.title} attempt saved ${new Date(entry.savedAt).toLocaleString('en-GB')}`}
                      className="grid min-w-0 flex-1 gap-3 rounded-xl p-2 text-left transition hover:bg-blue-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-slate-900">{test.title}</p>
                          <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {completed ? 'Completed' : 'Saved incomplete'}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                          {new Date(entry.savedAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' · '}{entry.attempt.mode === 'exam' ? 'Exam mode' : 'Practice mode'}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-blue-600">Review answers <ChevronRight className="h-3.5 w-3.5" /></span>
                      </div>
                      <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                        <p className="text-[9px] font-black uppercase text-blue-500">{isSATTestComplete(test) ? 'Estimated score' : 'Accuracy'}</p>
                        <p className="text-sm font-black text-blue-800">{completed ? (isSATTestComplete(test) ? result.scoreRange : `${result.accuracy}% accuracy`) : '—'}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
                        <p className="text-[9px] font-black uppercase text-slate-400">Correct answers</p>
                        <p className="text-sm font-black text-slate-800">{result.correct}/{result.total}</p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-500">{result.incorrect} incorrect · {result.unanswered} unanswered</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAttempt(entry, test.title)}
                      aria-label={`Delete ${test.title} attempt`}
                      title="Delete result"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center justify-self-end rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:border-red-200 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </article>
                )
              })
            ) : (
              <div className="rounded-[1.7rem] border border-dashed border-blue-200 bg-blue-50/45 px-5 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><BrainCircuit className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-black text-slate-900">No saved SAT attempts yet</h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">Submit any full mock or section test, or use Exit &amp; Save during an unfinished attempt.</p>
                <button onClick={() => navigate('/sat')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_24px_rgba(37,99,235,.25)]">Choose a SAT test</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
