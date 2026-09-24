import { useEffect, useMemo, useState } from 'react'
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
import { motion, useReducedMotion } from 'framer-motion'
import {
  isSATAnswerCorrect,
  scoreSATModules,
  type SATAttempt,
  type SATModuleId,
  type SATQuestion,
} from '@/features/sat/practiceTest4'
import { splitSATPrompt } from '@/features/sat/promptLayout'
import { isSATTestComplete, satAvailabilityNote, type SATTestDefinition } from '@/features/sat/catalog'
import SATRichText from './SATRichText'
import SATSourceContent from './SATSourceContent'
import SATVisual from './SATVisual'
import { useAuthStore } from '@/store/authStore'
import { useBadgeStore } from '@/store/badgeStore'

type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'unanswered' | 'flagged'

type Props = {
  attempt: SATAttempt
  test: SATTestDefinition
  onStartAgain?: () => void
  onBack?: () => void
  backLabel?: string
  historyReview?: boolean
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${Math.max(1, minutes)}m`
}

function AnimatedScore({ value }: { value: number }) {
  const reduceMotion = useReducedMotion()
  const [displayed, setDisplayed] = useState(reduceMotion ? value : 0)
  useEffect(() => {
    if (reduceMotion) { setDisplayed(value); return }
    let frame = 0
    let start = 0
    const tick = (time: number) => {
      if (!start) start = time
      const progress = Math.min(1, (time - start) / 1450)
      setDisplayed(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduceMotion, value])
  return <span>{displayed}</span>
}

function statusMeta(question: SATQuestion, attempt: SATAttempt) {
  const response = attempt.answers[question.id]
  if (!response?.trim()) return { label: 'Unanswered', className: 'bg-amber-50 text-amber-700', icon: CircleDashed }
  if (isSATAnswerCorrect(question, response)) return { label: 'Correct', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 }
  return { label: 'Incorrect', className: 'bg-red-50 text-red-700', icon: XCircle }
}

function ReviewQuestion({ question, response, note }: { question: SATQuestion; response?: string; note?: string }) {
  const { context, task } = splitSATPrompt(question.prompt)
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
          {question.visual ? (
            <SATVisual
              asset={question.visual.asset}
              alt={question.visual.alt}
              className="mx-auto mb-6 border border-slate-200 bg-slate-50 p-3"
              imageClassName="max-h-[28rem] max-w-full object-contain"
            />
          ) : null}
          {question.sourceContent ? <>
            {question.sourceContent.context && <SATSourceContent html={question.sourceContent.context} className="rounded-2xl bg-slate-50 px-5 py-5 font-serif text-[17px] leading-8 text-slate-800" />}
            <SATSourceContent html={question.sourceContent.task} className="mt-5 font-serif text-xl font-semibold leading-8 text-slate-950" />
          </> : <>
            {context ? <SATRichText text={context} className="rounded-2xl bg-slate-50 px-5 py-5 font-serif text-[17px] leading-8 text-slate-800" /> : null}
            <SATRichText text={task} className={`${context ? 'mt-5' : ''} font-serif text-xl font-semibold leading-8 text-slate-950`} />
          </>}

          {question.kind === 'multiple-choice' ? (
            <div className="mt-6 space-y-3.5">
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
                    <span className="min-w-0 flex-1 pt-1 font-serif text-[17px] leading-8 text-slate-800">
                      {choice.image ? <img src={choice.image} alt={`Choice ${choice.key}`} className="mb-2 max-h-56 max-w-full rounded-lg object-contain" /> : null}
                      {choice.html ? <SATSourceContent html={choice.html} /> : <SATRichText text={choice.text} />}
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
          <div><p className="text-[9px] font-black uppercase tracking-[0.13em] text-blue-700">Answer explanation</p><h3 className="mt-0.5 text-lg font-black text-slate-950">Why this answer works</h3></div>
        </div>
        {question.sourceContent ? <SATSourceContent html={question.sourceContent.explanation} className="mt-4 text-sm font-medium leading-7 text-slate-700" /> : <SATRichText text={question.explanation || 'Explanation unavailable.'} className="mt-4 text-sm font-medium leading-7 text-slate-700" />}
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-white/80 px-3 py-3 text-[11px] font-bold leading-5 text-slate-600">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> Review the rule or pattern, then explain the solution aloud in your own words before moving on.
        </div>
      </section>

      {note ? <section className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-700">Your test-day note</p><p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{note}</p></section> : null}
    </div>
  )
}

export default function SATReview({ attempt, test, onStartAgain, onBack, backLabel, historyReview = false }: Props) {
  const navigate = useNavigate()
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const awardBadge = useBadgeStore((state) => state.awardIfEligible)
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
  const submitted = attempt.status === 'submitted'
  const returnLabel = backLabel ?? (onlySection ? 'section tests' : 'SAT Prep')
  const backPath = onlySection ? `/sat/${onlySection}` : '/sat'
  const displayedRange = onlySection === 'math'
    ? report.mathRange
    : onlySection === 'reading-writing'
      ? report.readingWritingRange
      : report.totalRange
  const completeTest = isSATTestComplete(test)
  const completeMath = !test.missingModuleIds?.some((id) => id.startsWith('math'))
  const displayedMidpoint = Math.round((displayedRange[0] + displayedRange[1]) / 2)
  const weakest = domainStats[0]
  const elapsed = formatDuration(Math.max(0, ((attempt.submittedAt ?? attempt.updatedAt) - attempt.startedAt) / 1000))

  useEffect(() => {
    if (historyReview || !submitted || !completeTest || onlySection || displayedMidpoint < 1400) return
    awardBadge({
      userId,
      track: 'SAT_OVERALL',
      band: displayedMidpoint,
      mode: attempt.mode,
      source: 'mock',
    })
  }, [attempt.mode, awardBadge, completeTest, displayedMidpoint, historyReview, onlySection, submitted, userId])
  const headline = !submitted ? 'Your saved answers are ready to review.' : !completeTest ? 'Your available modules are complete. Review your answers below.' : displayedMidpoint >= (onlySection ? 725 : 1450) ? 'Elite work — you are in striking distance.' : displayedMidpoint >= (onlySection ? 600 : 1200) ? 'Strong foundation. Now turn review into points.' : 'You finished. Every smart review adds points.'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_8%_4%,#ffe5e8_0%,transparent_29%),radial-gradient(circle_at_91%_9%,#dbeaff_0%,transparent_33%),linear-gradient(155deg,#f7faff,#fff9f9)] px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[96rem]">
        <header className="overflow-hidden rounded-[2.5rem] border border-white bg-white/90 shadow-[0_34px_90px_rgba(33,52,96,.12)] backdrop-blur-2xl">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_28rem]">
            <div className="relative overflow-hidden p-6 sm:p-9 lg:p-12">
              <div className="pointer-events-none absolute -right-24 -top-36 h-72 w-72 rounded-full bg-rose-100/50 blur-3xl" />
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={onBack ?? (() => navigate(backPath))} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600"><ArrowLeft className="h-3.5 w-3.5" /> {returnLabel}</button>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700"><Sparkles className="h-3.5 w-3.5" /> {test.title} · {submitted ? 'Completed' : 'Saved incomplete'}</span>
              </div>
              <p className="mt-8 text-[11px] font-black uppercase tracking-[0.22em] text-red-600">Personal score report</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.06] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[3.75rem]">{headline}</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">{submitted ? `Your submitted answers across ${modules.length} modules are shown below.` : 'This attempt was saved before submission. Review your answers and unanswered questions below.'}</p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Correct', `${report.correct}/${allQuestions.length}`], ['Accuracy', `${report.percent}%`], ['Time used', elapsed], ['Flagged', String(attempt.flagged.length)],
                ].map(([label, value]) => <div key={label} className="rounded-[1.2rem] border border-slate-100 bg-[linear-gradient(145deg,#fff,#f5f8ff)] p-4 shadow-[0_6px_20px_rgba(43,64,110,.04)]"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>)}
              </div>
            </div>
            <div className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,#234ac0_0%,#3935ae_54%,#11182e_100%)] p-7 text-white sm:p-10">
              <div className="absolute -right-12 -top-12 h-60 w-60 rounded-full bg-cyan-300/20 blur-3xl" /><div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-rose-400/20 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">{!submitted ? 'Saved incomplete' : !completeTest ? 'Available-module accuracy' : onlySection === 'math' ? 'Estimated Math range' : onlySection === 'reading-writing' ? 'Estimated R&W range' : 'Estimated score range'}</p><p className="mt-4 text-[clamp(2.8rem,5vw,5rem)] font-black leading-none tracking-[-.07em]">{!submitted ? '—' : completeTest ? <><AnimatedScore value={displayedRange[0]} />–<AnimatedScore value={displayedRange[1]} /></> : <><AnimatedScore value={report.percent} />%</>}</p><p className="mt-3 text-xs font-semibold text-white/65">{submitted ? 'Your results are ready to explore' : 'Return when you are ready to finish'}</p></div><div className="rounded-2xl border border-white/20 bg-white/10 p-3"><Award className="h-7 w-7 text-cyan-200" /></div></div>
              {satAvailabilityNote(test) ? <p className="relative mt-4 text-xs leading-5 text-white/80">{satAvailabilityNote(test)}</p> : null}
              <div className="relative mt-8 space-y-3">
                {readingWritingTotal ? <div><div className="flex justify-between text-[10px] font-black"><span>Reading & Writing</span><span>{submitted ? `${report.readingWritingRange[0]}–${report.readingWritingRange[1]}` : `${report.readingWritingRaw}/${readingWritingTotal} correct`}</span></div><div className="mt-1.5 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${(report.readingWritingRaw / readingWritingTotal) * 100}%` }} /></div></div> : null}
                {mathTotal ? <div><div className="flex justify-between text-[10px] font-black"><span>Math</span><span>{submitted && completeMath ? `${report.mathRange[0]}–${report.mathRange[1]}` : `${report.mathRaw}/${mathTotal} correct`}</span></div><div className="mt-1.5 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-rose-300" style={{ width: `${(report.mathRaw / mathTotal) * 100}%` }} /></div></div> : null}
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_20px_54px_rgba(33,52,96,.07)] sm:p-8">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-600">Skill performance</p><h2 className="mt-1 text-xl font-black">Where your next points are hiding</h2></div><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {domainStats.map((stat) => <div key={stat.domain} className="rounded-[1.3rem] border border-slate-100 bg-[linear-gradient(140deg,#f8fbff,#fff)] p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-black text-slate-800">{stat.domain}</p><span className="text-sm font-black text-slate-950">{stat.percent}%</span></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200"><motion.div initial={{ width: 0 }} whileInView={{ width: `${stat.percent}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full rounded-full ${stat.percent >= 75 ? 'bg-emerald-500' : stat.percent >= 55 ? 'bg-blue-500' : 'bg-amber-500'}`} /></div><p className="mt-3 text-[10px] font-bold text-slate-500">{stat.correct} of {stat.total} correct</p></div>)}
            </div>
          </div>
          <div className="rounded-[2rem] border border-amber-100 bg-gradient-to-br from-[#fff9ec] via-white to-[#fff6f5] p-6 shadow-[0_20px_54px_rgba(113,72,23,.07)]">
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

        <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={onBack ?? (() => navigate(backPath))} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black text-slate-600">Back to {returnLabel}</button>{onStartAgain ? <button type="button" onClick={onStartAgain} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[11px] font-black text-white"><RotateCcw className="h-3.5 w-3.5" /> Start fresh</button> : null}</div>
      </div>
    </main>
  )
}
