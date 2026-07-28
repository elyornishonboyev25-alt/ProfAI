import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Flag,
  RotateCcw,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  SAT_PRACTICE_TEST_4_MODULES,
  isSATAnswerCorrect,
  scoreSATPracticeTest4,
  type SATAttempt,
  type SATModuleId,
  type SATQuestion,
} from '@/features/sat/practiceTest4'

type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'unanswered' | 'flagged'

type Props = {
  attempt: SATAttempt
  onStartAgain: () => void
}
export default function SATReview({ attempt, onStartAgain }: Props) {
  const navigate = useNavigate()
  const report = useMemo(() => scoreSATPracticeTest4(attempt.answers), [attempt.answers])
  const allQuestions = useMemo(
    () => SAT_PRACTICE_TEST_4_MODULES.flatMap((module) => module.questions),
    [],
  )
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [moduleFilter, setModuleFilter] = useState<'all' | SATModuleId>('all')
  const [selectedId, setSelectedId] = useState(allQuestions[0].id)

  const filteredQuestions = allQuestions.filter((question) => {
    if (moduleFilter !== 'all' && question.moduleId !== moduleFilter) return false
    const response = attempt.answers[question.id]
    const correct = isSATAnswerCorrect(question, response)
    if (filter === 'correct') return correct
    if (filter === 'incorrect') return Boolean(response?.trim()) && !correct
    if (filter === 'unanswered') return !response?.trim()
    if (filter === 'flagged') return attempt.flagged.includes(question.id)
    return true
  })

  const selectedQuestion =
    allQuestions.find((question) => question.id === selectedId) ?? filteredQuestions[0] ?? allQuestions[0]
  const selectedResponse = attempt.answers[selectedQuestion.id]
  const selectedCorrect = isSATAnswerCorrect(selectedQuestion, selectedResponse)
  const selectedModule = SAT_PRACTICE_TEST_4_MODULES.find(
    (module) => module.id === selectedQuestion.moduleId,
  )

  const statusMeta = (question: SATQuestion) => {
    const response = attempt.answers[question.id]
    if (!response?.trim()) return { label: 'Unanswered', className: 'bg-amber-50 text-amber-700', icon: CircleDashed }
    if (isSATAnswerCorrect(question, response)) {
      return { label: 'Correct', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 }
    }
    return { label: 'Incorrect', className: 'bg-red-50 text-red-700', icon: XCircle }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#f0f9ff_0%,#f8fafc_44%,#fff4f4_100%)] px-3 py-4 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[96rem]">
        <header className="rounded-[1.8rem] border border-white/90 bg-white/78 p-5 shadow-[0_24px_65px_rgba(15,23,42,.1)] backdrop-blur-2xl sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/sat')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 shadow-sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> SAT Arena
                </button>
                <span className="rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                  Attempt complete
                </span>
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Digital SAT Practice Test 4</p>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Score report & deep review
              </h1>
              <p className="mt-2 max-w-2xl text-xs font-semibold leading-6 text-slate-500">
                Paper-digital scores are reported as ranges. Every answer below is checked against
                the supplied official key and explanation guide.
              </p>
            </div>
            <div className="min-w-[17rem] rounded-[1.6rem] bg-gradient-to-br from-red-600 via-rose-600 to-red-800 p-5 text-white shadow-[0_20px_42px_rgba(220,38,38,.26)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/70">Total score range</p>
                  <p className="mt-1 text-4xl font-black tracking-tight">
                    {report.totalRange[0]}–{report.totalRange[1]}
                  </p>
                </div>
                <Target className="h-6 w-6 text-white/75" />
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${report.percent}%` }} />
              </div>
              <p className="mt-2 text-[10px] font-bold text-white/75">
                {report.correct} / 120 correct · {report.percent}% accuracy
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'R&W range', value: `${report.readingWritingRange[0]}–${report.readingWritingRange[1]}`, note: `${report.readingWritingRaw}/66 raw`, tone: 'blue' },
              { label: 'Math range', value: `${report.mathRange[0]}–${report.mathRange[1]}`, note: `${report.mathRaw}/54 raw`, tone: 'violet' },
              { label: 'Correct', value: report.correct, note: 'Mastered answers', tone: 'green' },
              { label: 'Incorrect', value: report.incorrect, note: 'Needs review', tone: 'red' },
              { label: 'Unanswered', value: report.unanswered, note: 'Opportunity left', tone: 'amber' },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-100 bg-white/82 p-4 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">{metric.label}</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{metric.value}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-500">{metric.note}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-4 grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="rounded-[1.6rem] border border-white/90 bg-white/82 p-4 shadow-[0_18px_45px_rgba(15,23,42,.08)] backdrop-blur-xl xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-600">Question review</p>
                <h2 className="mt-1 text-lg font-black">Find the signal</h2>
              </div>
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>

            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
              {(['all', 'correct', 'incorrect', 'unanswered', 'flagged'] as ReviewFilter[]).map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-black capitalize ${
                    filter === value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <select
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value as 'all' | SATModuleId)}
              className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 outline-none focus:border-red-300"
            >
              <option value="all">All modules</option>
              {SAT_PRACTICE_TEST_4_MODULES.map((module) => (
                <option key={module.id} value={module.id}>{module.shortTitle}</option>
              ))}
            </select>

            <div className="mt-3 max-h-[calc(100vh-18rem)] space-y-1.5 overflow-y-auto pr-1">
              {filteredQuestions.map((question) => {
                const status = statusMeta(question)
                const Icon = status.icon
                return (
                  <button
                    type="button"
                    key={question.id}
                    onClick={() => setSelectedId(question.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left ${
                      selectedQuestion.id === question.id
                        ? 'border-red-200 bg-red-50 shadow-sm'
                        : 'border-transparent bg-slate-50/80 hover:border-slate-200'
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${status.className}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-black text-slate-900">
                        {SAT_PRACTICE_TEST_4_MODULES.find((module) => module.id === question.moduleId)?.shortTitle} · Q{question.number}
                      </span>
                      <span className="mt-0.5 block text-[9px] font-bold text-slate-400">{status.label}</span>
                    </span>
                    {attempt.flagged.includes(question.id) ? <Flag className="h-3 w-3 fill-amber-400 text-amber-500" /> : null}
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  </button>
                )
              })}
              {filteredQuestions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-[10px] font-bold text-slate-400">
                  No questions match this filter.
                </p>
              ) : null}
            </div>
          </aside>

          <article className="min-w-0 rounded-[1.8rem] border border-white/90 bg-white/82 p-3 shadow-[0_20px_55px_rgba(15,23,42,.09)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{selectedModule?.title}</p>
                <h2 className="mt-1 text-xl font-black">Question {selectedQuestion.number}</h2>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black ${
                !selectedResponse?.trim()
                  ? 'bg-amber-50 text-amber-700'
                  : selectedCorrect
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
              }`}>
                {selectedCorrect ? <CheckCircle2 className="h-4 w-4" /> : selectedResponse?.trim() ? <XCircle className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                {selectedCorrect ? 'Correct' : selectedResponse?.trim() ? 'Incorrect' : 'Unanswered'}
              </div>
            </div>

            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(19rem,.7fr)]">
              <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img
                  src={selectedQuestion.asset}
                  alt={`Question ${selectedQuestion.number}`}
                  className="mx-auto w-full max-w-4xl rounded-xl bg-white shadow-sm"
                />
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Your answer</p>
                  <p className={`mt-2 text-xl font-black ${selectedCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                    {selectedResponse?.trim() || 'No response'}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-emerald-700">Correct answer</p>
                  <p className="mt-2 text-xl font-black text-emerald-700">{selectedQuestion.correctAnswer}</p>
                  {selectedQuestion.acceptedAnswers && selectedQuestion.acceptedAnswers.length > 1 ? (
                    <p className="mt-1 text-[10px] font-semibold text-emerald-700/70">
                      Equivalent accepted forms: {selectedQuestion.acceptedAnswers.join(', ')}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/65 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-blue-700">Official explanation</p>
                  <p className="mt-2 text-xs font-medium leading-6 text-slate-700">
                    {selectedQuestion.explanation || 'Explanation unavailable.'}
                  </p>
                </div>
                {attempt.notes[selectedQuestion.id] ? (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/65 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-violet-700">Your note</p>
                    <p className="mt-2 whitespace-pre-wrap text-xs font-medium leading-5 text-slate-700">{attempt.notes[selectedQuestion.id]}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        </section>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/sat')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black text-slate-600 shadow-sm"
          >
            Back to SAT Arena
          </button>
          <button
            type="button"
            onClick={onStartAgain}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[11px] font-black text-white shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start a new attempt
          </button>
        </div>
      </div>
    </main>
  )
}
