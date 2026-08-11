import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Flag,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  isSATAnswerCorrect,
  scoreSATModules,
  type SATAttempt,
  type SATModuleId,
  type SATQuestion,
} from '@/features/sat/practiceTest4'
import type { SATTestDefinition } from '@/features/sat/catalog'
import SATRichText from './SATRichText'

type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'unanswered' | 'flagged'

type Props = {
  attempt: SATAttempt
  test: SATTestDefinition
  onStartAgain: () => void
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`
}

function splitPrompt(prompt: string) {
  const clean = prompt.replace(/\n(?=•)/g, '\n').replace(/(?<!•)\n(?!•)/g, ' ').replace(/\s{2,}/g, ' ').trim()
  const leads = ['Which choice', 'Which equation', 'Which table', 'Which expression', 'Which of the following', 'What is', 'What was', 'What percentage', 'How many', 'How far', 'For what value', 'Based on']
  const index = Math.max(...leads.map((lead) => clean.lastIndexOf(lead)))
  return index > 0 ? { context: clean.slice(0, index).trim(), task: clean.slice(index).trim() } : { context: '', task: clean }
}

function statusMeta(question: SATQuestion, attempt: SATAttempt) {
  const response = attempt.answers[question.id]
  if (!response?.trim()) return { label: 'Unanswered', className: 'bg-amber-50 text-amber-700', icon: CircleDashed }
  if (isSATAnswerCorrect(question, response)) return { label: 'Correct', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 }
  return { label: 'Incorrect', className: 'bg-red-50 text-red-700', icon: XCircle }
}

function ReviewQuestion({ question, response, note }: { question: SATQuestion; response?: string; note?: string }) {
  const { context, task } = splitPrompt(question.prompt)
  const correct = isSATAnswerCorrect(question, response)
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-6">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-700">{question.domain}</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-500 ring-1 ring-slate-200">{question.skill}</span>
          <span className="ml-auto text-[9px] font-black text-slate-400">{question.difficulty}</span>
        </div>
        <div className="p-4 sm:p-7">
          {question.visual ? <img src={question.visual.asset} alt={question.visual.alt} className="mx-auto mb-6 max-h-[28rem] max-w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 object-contain" /> : null}
          {context ? <SATRichText text={context} className="rounded-2xl bg-slate-50 px-5 py-5 font-serif text-[17px] leading-8 text-slate-800" /> : null}
          <SATRichText text={task} className={`${context ? 'mt-5' : ''} font-serif text-xl font-semibold leading-8 text-slate-950`} />

          {question.kind === 'multiple-choice' ? (
            <div className="mt-6 space-y-2.5">
              {question.choices.map((choice) => {
                const isCorrectChoice = choice.key === question.correctAnswer
                const isUserChoice = choice.key === response
                return (
                  <div key={choice.key} className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                    isCorrectChoice ? 'border-emerald-300 bg-emerald-50' : isUserChoice ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
                  }`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                      isCorrectChoice ? 'bg-emerald-600 text-white' : isUserChoice ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>{choice.key}</span>
                    <span className="min-w-0 flex-1 pt-1 font-serif text-[17px] leading-7 text-slate-800">
                      {choice.image ? <img src={choice.image} alt={`Choice ${choice.key}`} className="mb-2 max-h-56 max-w-full rounded-lg object-contain" /> : null}
                      <SATRichText text={choice.text} />
                    </span>
                    <span className="ml-auto shrink-0 pt-1 text-[9px] font-black uppercase tracking-[0.08em]">
                      {isCorrectChoice ? <span className="text-emerald-700">Correct</span> : isUserChoice ? <span className="text-red-700">Your answer</span> : null}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className={`rounded-2xl border p-4 ${correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Your response</p>
                <p className="mt-2 text-xl font-black text-slate-900">{response?.trim() || 'No response'}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">Accepted answer</p>
                <p className="mt-2 text-xl font-black text-emerald-800">{question.correctAnswer}</p>
                {question.acceptedAnswers && question.acceptedAnswers.length > 1 ? <p className="mt-1 text-[9px] font-bold text-emerald-700/75">Also accepted: {question.acceptedAnswers.slice(1).join(', ')}</p> : null}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><BookOpenCheck className="h-5 w-5" /></span>
          <div><p className="text-[9px] font-black uppercase tracking-[0.13em] text-blue-700">Official reasoning</p><h3 className="mt-0.5 text-lg font-black text-slate-950">Why this answer works</h3></div>
        </div>
        <SATRichText text={question.explanation || 'Explanation unavailable.'} className="mt-4 text-sm font-medium leading-7 text-slate-700" />
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-white/80 px-3 py-3 text-[11px] font-bold leading-5 text-slate-600">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> Review the rule or pattern, then explain the solution aloud in your own words before moving on.
        </div>
      </section>

      {note ? <section className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-700">Your test-day note</p><p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{note}</p></section> : null}
    </div>
  )
}

export default function SATReview({ attempt, test, onStartAgain }: Props) {
  const navigate = useNavigate()
  const modules = test.modules
  const report = useMemo(() => scoreSATModules(modules, attempt.answers), [attempt.answers, modules])
  const allQuestions = useMemo(() => modules.flatMap((module) => module.questions), [modules])
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [moduleFilter, setModuleFilter] = useState<'all' | SATModuleId>('all')
  const [selectedId, setSelectedId] = useState(allQuestions.find((question) => !isSATAnswerCorrect(question, attempt.answers[question.id]))?.id ?? allQuestions[0].id)

  const domainStats = useMemo(() => {
    const stats = new Map<string, { correct: number; total: number }>()
    allQuestions.forEach((question) => {
      const value = stats.get(question.domain) ?? { correct: 0, total: 0 }
      value.total += 1
      if (isSATAnswerCorrect(question, attempt.answers[question.id])) value.correct += 1
      stats.set(question.domain, value)
    })
    return [...stats.entries()].map(([domain, value]) => ({ domain, ...value, percent: Math.round((value.correct / value.total) * 100) })).sort((a, b) => a.percent - b.percent)
  }, [allQuestions, attempt.answers])

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
  const selectedQuestion = allQuestions.find((question) => question.id === selectedId) ?? filteredQuestions[0] ?? allQuestions[0]
  const selectedIndex = allQuestions.findIndex((question) => question.id === selectedQuestion.id)
  const selectedResponse = attempt.answers[selectedQuestion.id]
  const selectedStatus = statusMeta(selectedQuestion, attempt)
  const StatusIcon = selectedStatus.icon
  const selectedModule = modules.find((module) => module.id === selectedQuestion.moduleId)
  const readingWritingTotal = allQuestions.filter((question) => question.section === 'reading-writing').length
  const mathTotal = allQuestions.filter((question) => question.section === 'math').length
  const onlySection = modules.every((module) => module.section === 'math')
    ? 'math'
    : modules.every((module) => module.section === 'reading-writing')
      ? 'reading-writing'
      : null
  const backPath = onlySection ? `/sat/${onlySection}` : '/sat'
  const displayedRange = onlySection === 'math'
    ? report.mathRange
    : onlySection === 'reading-writing'
      ? report.readingWritingRange
      : report.totalRange
  const displayedMidpoint = Math.round((displayedRange[0] + displayedRange[1]) / 2)
  const weakest = domainStats[0]
  const elapsed = formatDuration(Math.max(0, ((attempt.submittedAt ?? attempt.updatedAt) - attempt.startedAt) / 1000))
  const headline = displayedMidpoint >= (onlySection ? 725 : 1450) ? 'Elite work — you are in striking distance.' : displayedMidpoint >= (onlySection ? 600 : 1200) ? 'Strong foundation. Now turn review into points.' : 'You finished. Every smart review adds points.'

  return (
    <main className="min-h-screen bg-[linear-gradient(145deg,#eef6ff_0%,#f8fafc_46%,#fff5f4_100%)] px-3 py-4 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[96rem]">
        <header className="overflow-hidden rounded-[2rem] border border-white/90 bg-white/85 shadow-[0_26px_75px_rgba(15,23,42,.11)] backdrop-blur-2xl">
          <div className="grid lg:grid-cols-[1fr_23rem]">
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => navigate(backPath)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600"><ArrowLeft className="h-3.5 w-3.5" /> {onlySection ? 'Section tests' : 'SAT Prep'}</button>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700"><Sparkles className="h-3.5 w-3.5" /> {test.title} complete</span>
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Personal score report</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">{headline}</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">You completed all {modules.length} modules. Use the review lab below to turn every missed pattern into a repeatable strength.</p>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Correct', `${report.correct}/${test.questionCount}`], ['Accuracy', `${report.percent}%`], ['Time used', elapsed], ['Flagged', String(attempt.flagged.length)],
                ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div>)}
              </div>
            </div>
            <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-950 p-6 text-white sm:p-8">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="relative flex items-start justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/60">{onlySection === 'math' ? 'Estimated Math range' : onlySection === 'reading-writing' ? 'Estimated R&W range' : 'Estimated score range'}</p><p className="mt-2 text-5xl font-black tracking-tight">{displayedRange[0]}–{displayedRange[1]}</p></div><Award className="h-8 w-8 text-cyan-300" /></div>
              <div className="relative mt-8 space-y-3">
                {readingWritingTotal ? <div><div className="flex justify-between text-[10px] font-black"><span>Reading & Writing</span><span>{report.readingWritingRange[0]}–{report.readingWritingRange[1]}</span></div><div className="mt-1.5 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${(report.readingWritingRaw / readingWritingTotal) * 100}%` }} /></div></div> : null}
                {mathTotal ? <div><div className="flex justify-between text-[10px] font-black"><span>Math</span><span>{report.mathRange[0]}–{report.mathRange[1]}</span></div><div className="mt-1.5 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-rose-300" style={{ width: `${(report.mathRaw / mathTotal) * 100}%` }} /></div></div> : null}
              </div>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_21rem]">
          <div className="rounded-[1.6rem] border border-white/90 bg-white/82 p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">Skill performance</p><h2 className="mt-1 text-xl font-black">Where your next points are hiding</h2></div><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {domainStats.map((stat) => <div key={stat.domain} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black text-slate-800">{stat.domain}</p><span className="text-xs font-black text-slate-950">{stat.percent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${stat.percent >= 75 ? 'bg-emerald-500' : stat.percent >= 55 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${stat.percent}%` }} /></div><p className="mt-2 text-[9px] font-bold text-slate-400">{stat.correct} of {stat.total} correct</p></div>)}
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white"><Target className="h-5 w-5" /></span>
            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.13em] text-amber-700">Recommended next focus</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{weakest?.domain}</h2>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">Start with the missed questions in this domain. Write one rule from each explanation, then retry without notes.</p>
            <button type="button" onClick={() => { setFilter('incorrect'); setModuleFilter('all'); const next = allQuestions.find((question) => question.domain === weakest?.domain && !isSATAnswerCorrect(question, attempt.answers[question.id])); if (next) setSelectedId(next.id) }} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[10px] font-black text-white">Review weak spots <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="rounded-[1.6rem] border border-white/90 bg-white/85 p-4 shadow-[0_18px_45px_rgba(15,23,42,.08)] xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
            <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-600">Deep review</p><h2 className="mt-1 text-lg font-black">Question navigator</h2></div><BookOpenCheck className="h-5 w-5 text-red-500" /></div>
            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">{(['all', 'correct', 'incorrect', 'unanswered', 'flagged'] as ReviewFilter[]).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[9px] font-black capitalize ${filter === value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-500'}`}>{value}</button>)}</div>
            <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value as 'all' | SATModuleId)} className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600 outline-none"><option value="all">All {modules.length} modules</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.shortTitle}</option>)}</select>
            <div className="mt-3 max-h-[calc(100vh-15rem)] space-y-1.5 overflow-y-auto pr-1">
              {filteredQuestions.map((question) => { const status = statusMeta(question, attempt); const Icon = status.icon; return <button type="button" key={question.id} onClick={() => setSelectedId(question.id)} className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left ${selectedQuestion.id === question.id ? 'border-blue-200 bg-blue-50' : 'border-transparent bg-slate-50 hover:border-slate-200'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${status.className}`}><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-black text-slate-900">{modules.find((module) => module.id === question.moduleId)?.shortTitle} · Q{question.number}</span><span className="mt-0.5 block truncate text-[9px] font-bold text-slate-400">{question.skill}</span></span>{attempt.flagged.includes(question.id) ? <Flag className="h-3 w-3 fill-amber-400 text-amber-500" /> : null}<ChevronRight className="h-3.5 w-3.5 text-slate-300" /></button> })}
              {!filteredQuestions.length ? <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-[10px] font-bold text-slate-400">No questions match this filter.</p> : null}
            </div>
          </aside>

          <article className="min-w-0 rounded-[1.8rem] border border-white/90 bg-white/85 p-3 shadow-[0_20px_55px_rgba(15,23,42,.09)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{selectedModule?.title}</p><h2 className="mt-1 text-xl font-black">Question {selectedQuestion.number}</h2></div><div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black ${selectedStatus.className}`}><StatusIcon className="h-4 w-4" />{selectedStatus.label}</div></div>
            <ReviewQuestion question={selectedQuestion} response={selectedResponse} note={attempt.notes[selectedQuestion.id]} />
            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" disabled={selectedIndex <= 0} onClick={() => setSelectedId(allQuestions[selectedIndex - 1].id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black text-slate-600 disabled:opacity-30"><ArrowLeft className="h-3.5 w-3.5" /> Previous</button>
              <span className="text-[9px] font-black text-slate-400">{selectedIndex + 1} / {allQuestions.length}</span>
              <button type="button" disabled={selectedIndex >= allQuestions.length - 1} onClick={() => setSelectedId(allQuestions[selectedIndex + 1].id)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[10px] font-black text-white disabled:opacity-30">Next <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </article>
        </section>

        <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => navigate(backPath)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black text-slate-600">Back to {onlySection ? 'section tests' : 'SAT Prep'}</button><button type="button" onClick={onStartAgain} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[11px] font-black text-white"><RotateCcw className="h-3.5 w-3.5" /> Start fresh</button></div>
      </div>
    </main>
  )
}
