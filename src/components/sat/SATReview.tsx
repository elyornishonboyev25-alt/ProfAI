import { SATNoteList } from './SATNotes'
import { readSATNotes, type SATNote } from '@/features/sat/notes'
import { analyzeSATResult, formatSATDate, formatSATDuration, satAnswerStatus } from '@/features/sat/resultAnalysis'
import { openSATReport } from '@/features/sat/resultReport'
import { bankDomain } from '@/features/sat/bankTopics'
import { BrandLogo } from '@/components/brand/BrandLogo'
import './SATReview.css'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ExternalLink,
  Flag,
  GraduationCap,
  Layers3,
  Lightbulb,
  RotateCcw,
  Target,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  isSATAnswerCorrect,
  type SATAttempt,
  type HighlightStroke,
  type SATModuleId,
  type SATQuestion,
} from '@/features/sat/practiceTest4'
import { splitSATPrompt } from '@/features/sat/promptLayout'
import { satAvailabilityNote, type SATTestDefinition } from '@/features/sat/catalog'
import SATRichText from './SATRichText'
import SATSourceContent from './SATSourceContent'
import SATVisual from './SATVisual'
import SATTextHighlights from './SATTextHighlights'
import { useAuthStore } from '@/store/authStore'
import { useBadgeStore } from '@/store/badgeStore'

type ReviewFilter = 'all' | 'missed' | 'correct' | 'incorrect' | 'unanswered' | 'flagged'
type ResultTab = 'scores' | 'performance' | 'domains' | 'questions'
const RESULT_TABS = [
  { id: 'scores', label: 'Scores', icon: GraduationCap },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'domains', label: 'Knowledge & skills', icon: Layers3 },
  { id: 'questions', label: 'Question review', icon: BookOpenCheck },
] as const

type Props = {
  attempt: SATAttempt
  test: SATTestDefinition
  onStartAgain?: () => void
  onBack?: () => void
  backLabel?: string
  historyReview?: boolean
}

function OutcomeBar({
  correct,
  incorrect,
  unanswered,
  total,
}: {
  correct: number
  incorrect: number
  unanswered: number
  total: number
}) {
  return (
    <div
      className="sr-outcome-bar"
      role="img"
      aria-label={`${correct} correct, ${incorrect} incorrect, ${unanswered} unanswered out of ${total}`}
    >
      <span className="is-correct" style={{ width: `${(correct / Math.max(1, total)) * 100}%` }} />
      <span className="is-incorrect" style={{ width: `${(incorrect / Math.max(1, total)) * 100}%` }} />
      <span className="is-unanswered" style={{ width: `${(unanswered / Math.max(1, total)) * 100}%` }} />
    </div>
  )
}

function ScoreRing({ score, percent, label }: { score: number | null; percent: number; label: string }) {
  const progress = score === null ? percent : (score / 800) * 100
  return (
    <div
      className="sr-score-ring"
      role="img"
      aria-label={`${label}: ${score === null ? `${percent}% accuracy` : `${score} out of 800, estimated`}`}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="sr-ring-track" cx="100" cy="100" r="84" />
        <circle
          className="sr-ring-value"
          cx="100"
          cy="100"
          r="84"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - progress}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div>
        <strong>{score ?? `${percent}%`}</strong>
        <span>{score === null ? 'accuracy' : '/ 800'}</span>
      </div>
    </div>
  )
}

function statusMeta(question: SATQuestion, attempt: SATAttempt) {
  const response = attempt.answers[question.id]
  if (!response?.trim()) return { label: 'Unanswered', className: 'bg-amber-50 text-amber-700', icon: CircleDashed }
  if (isSATAnswerCorrect(question, response))
    return { label: 'Correct', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 }
  return { label: 'Incorrect', className: 'bg-red-50 text-red-700', icon: XCircle }
}

function ReviewQuestion({
  question,
  response,
  note,
  strokes,
  eliminatedChoices = [],
}: {
  question: SATQuestion
  response?: string
  note?: string | SATNote[]
  strokes: HighlightStroke[]
  eliminatedChoices?: string[]
}) {
  const { context, task } = splitSATPrompt(question.prompt)
  const correct = isSATAnswerCorrect(question, response)
  const answered = Boolean(response?.trim())
  const alternativeAnswers = [...new Set(question.acceptedAnswers ?? [])].filter(
    (answer) => answer !== question.correctAnswer,
  )
  return (
    <SATTextHighlights key={question.id} strokes={strokes} enabled={false}>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white shadow-[0_12px_34px_rgba(32,55,99,.05)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-blue-100 bg-[linear-gradient(90deg,#f5f9ff,#fff9f9)] px-5 py-4 sm:px-7">
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-700">
              {question.domain}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-500 ring-1 ring-slate-200">
              {question.skill}
            </span>
            <span className="ml-auto text-[9px] font-black text-slate-400">{question.difficulty}</span>
          </div>
          <div className="p-5 sm:p-8">
            {question.visual ? (
              <SATVisual
                asset={question.visual.asset}
                alt={question.visual.alt}
                className="mx-auto mb-6 border border-slate-200 bg-slate-50 p-3"
                imageClassName="max-h-[20rem] max-w-[min(100%,42rem)] object-contain"
              />
            ) : null}
            {question.sourceContent ? (
              <>
                <div data-sat-highlight-block="context">
                  {question.sourceContent.context && (
                    <SATSourceContent
                      html={question.sourceContent.context}
                      className="rounded-2xl border border-slate-100 bg-[#f7faff] px-5 py-5 font-serif text-[17px] leading-8 text-slate-800"
                    />
                  )}
                </div>
                <div data-sat-highlight-block="task">
                  <SATSourceContent
                    html={question.sourceContent.task}
                    className="mt-5 font-serif text-lg font-semibold leading-7 text-slate-950"
                  />
                </div>
              </>
            ) : (
              <>
                <div data-sat-highlight-block="context">
                  {context ? (
                    <SATRichText
                      text={context}
                      className="rounded-2xl border border-slate-100 bg-[#f7faff] px-5 py-5 font-serif text-[17px] leading-8 text-slate-800"
                    />
                  ) : null}
                </div>
                <div data-sat-highlight-block="task">
                  <SATRichText
                    text={task}
                    className={`${context ? 'mt-5' : ''} font-serif text-lg font-semibold leading-7 text-slate-950`}
                  />
                </div>
              </>
            )}

            {question.kind === 'multiple-choice' ? (
              <div className="mt-6 space-y-3.5">
                {question.choices.map((choice) => {
                  const isCorrectChoice = choice.key === question.correctAnswer
                  const isUserChoice = choice.key === response?.trim().toUpperCase()
                  return (
                    <div
                      key={choice.key}
                      className={`flex items-start gap-3 rounded-[1.2rem] border p-4 transition-colors ${
                        isCorrectChoice
                          ? 'border-emerald-300 bg-emerald-50 shadow-[0_5px_18px_rgba(16,185,129,.08)]'
                          : isUserChoice
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                          isCorrectChoice
                            ? 'bg-emerald-600 text-white'
                            : isUserChoice
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {choice.key}
                      </span>
                      <span
                        data-sat-highlight-block={`choice-${choice.key}`}
                        className="min-w-0 flex-1 pt-1 font-serif text-[17px] leading-8 text-slate-800"
                      >
                        {choice.image ? (
                          <img
                            src={choice.image}
                            alt={`Choice ${choice.key}`}
                            className="mb-2 max-h-56 max-w-full rounded-lg object-contain"
                          />
                        ) : null}
                        {choice.html ? <SATSourceContent html={choice.html} /> : <SATRichText text={choice.text} />}
                        {eliminatedChoices.includes(choice.key) ? (
                          <span className="mt-1 block font-sans text-xs font-semibold text-slate-500">
                            Crossed out during test
                          </span>
                        ) : null}
                      </span>
                      <span className="ml-auto max-w-[5rem] shrink-0 pt-1 text-right text-[9px] font-black uppercase tracking-[0.08em]">
                        {isCorrectChoice ? (
                          <span className="text-emerald-700">{isUserChoice ? 'Your answer · Correct' : 'Correct'}</span>
                        ) : isUserChoice ? (
                          <span className="text-red-700">Your answer</span>
                        ) : null}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div
                  className={`rounded-2xl border p-4 ${correct ? 'border-emerald-200 bg-emerald-50' : answered ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">Your response</p>
                  <p className="mt-2 text-xl font-black text-slate-900">{response?.trim() || 'No response'}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">Accepted answer</p>
                  <p className="mt-2 text-xl font-black text-emerald-800">{question.correctAnswer}</p>
                  {alternativeAnswers.length > 0 ? (
                    <p className="mt-1 text-[9px] font-bold text-emerald-700/75">
                      Also accepted: {alternativeAnswers.join(', ')}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#fff)] p-6 shadow-[0_14px_36px_rgba(37,99,235,.06)] sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <BookOpenCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-blue-700">Answer explanation</p>
              <h3 className="mt-0.5 text-lg font-black text-slate-950">Why this answer works</h3>
            </div>
          </div>
          {question.sourceContent ? (
            <SATSourceContent
              html={question.sourceContent.explanation}
              className="mt-4 text-sm font-medium leading-7 text-slate-700"
            />
          ) : (
            <SATRichText
              text={question.explanation || 'Explanation unavailable.'}
              className="mt-4 text-sm font-medium leading-7 text-slate-700"
            />
          )}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-white/80 px-3 py-3 text-[11px] font-bold leading-5 text-slate-600">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> Review the rule or pattern, then explain
            the solution aloud in your own words before moving on.
          </div>
        </section>

        {readSATNotes(note).length ? (
          <section className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.12em] text-violet-700">
              Your test-day notes
            </p>
            <SATNoteList value={note} />
          </section>
        ) : null}
      </div>
    </SATTextHighlights>
  )
}

export default function SATReview({ attempt, test, onStartAgain, onBack, backLabel, historyReview = false }: Props) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const awardBadge = useBadgeStore((state) => state.awardIfEligible)
  const analysis = useMemo(() => analyzeSATResult(test, attempt), [test, attempt])
  const {
    report,
    questions: allQuestions,
    sections,
    domains,
    priorities,
    strongest,
    submitted,
    complete,
    score,
    range,
    maximum,
  } = analysis
  const modules = test.modules
  const onlySection = sections.length === 1 ? sections[0].id : null
  const returnLabel = backLabel ?? (onlySection ? 'section tests' : 'SAT Prep')
  const backPath = onlySection ? `/sat/${onlySection}` : '/sat'
  const [tab, setTab] = useState<ResultTab>(historyReview ? 'questions' : 'scores')
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [moduleFilter, setModuleFilter] = useState<'all' | SATModuleId>('all')
  const [domainFilter, setDomainFilter] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState(
    allQuestions.find((q) => !isSATAnswerCorrect(q, attempt.answers[q.id]))?.id ?? allQuestions[0]?.id,
  )
  const [reportError, setReportError] = useState(false)
  const domainKey = (q: SATQuestion) => `${q.section}:${bankDomain(q.domain)}`
  const matches = (q: SATQuestion, status: ReviewFilter, module: string, domain: string | null) => {
    if (module !== 'all' && q.moduleId !== module) return false
    if (domain && domainKey(q) !== domain) return false
    if (status === 'flagged') return attempt.flagged.includes(q.id)
    if (status === 'missed') return satAnswerStatus(q, attempt) !== 'correct'
    return status === 'all' || satAnswerStatus(q, attempt) === status
  }
  const filteredQuestions = allQuestions.filter((q) => matches(q, filter, moduleFilter, domainFilter))
  const chooseFilter = (next: ReviewFilter, module: 'all' | SATModuleId = moduleFilter, domain = domainFilter) => {
    setFilter(next)
    setModuleFilter(module)
    setDomainFilter(domain)
    const first = allQuestions.find((q) => matches(q, next, module, domain))
    if (first) setSelectedId(first.id)
  }
  const selectedQuestion = filteredQuestions.find((q) => q.id === selectedId) ?? filteredQuestions[0]
  const visibleIndex = filteredQuestions.findIndex((q) => q.id === selectedQuestion?.id)
  const selectedStatus = selectedQuestion ? statusMeta(selectedQuestion, attempt) : null
  const StatusIcon = selectedStatus?.icon ?? CircleDashed
  const selectedModule = modules.find((m) => m.id === selectedQuestion?.moduleId)
  const showReview = (domain: string | null = null, status: ReviewFilter = 'missed') => {
    chooseFilter(status, 'all', domain)
    setTab('questions')
    requestAnimationFrame(() => {
      const panel = document.getElementById('sat-result-panel-questions')
      panel?.focus({ preventScroll: true })
      panel?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }
  const downloadReport = () =>
    setReportError(
      !openSATReport({
        analysis,
        title: test.title,
        candidate: user?.fullName?.trim() || user?.nickname?.trim() || 'Ivygoo learner',
        timestamp: attempt.submittedAt ?? attempt.updatedAt,
        mode: attempt.mode,
      }),
    )
  const handleTabKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = RESULT_TABS.findIndex((item) => item.id === tab)
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % RESULT_TABS.length
        : event.key === 'ArrowLeft'
          ? (index + RESULT_TABS.length - 1) % RESULT_TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? RESULT_TABS.length - 1
              : null
    if (next === null) return
    event.preventDefault()
    setTab(RESULT_TABS[next].id)
    document.getElementById(`sat-result-tab-${RESULT_TABS[next].id}`)?.focus()
  }

  useEffect(() => {
    if (historyReview || !submitted || !complete || score === null) return
    if (onlySection) {
      awardBadge({
        userId: user?.id ?? null,
        track: onlySection === 'math' ? 'SAT_MATH' : 'SAT_ENGLISH',
        band: score,
        mode: 'mock',
        source: 'sat-section',
      })
      return
    }
    awardBadge({
      userId: user?.id ?? null,
      track: 'SAT_OVERALL',
      band: report.midpoint,
      mode: 'mock',
      source: 'sat-full-mock',
    })
    sections.forEach((section) => {
      if (section.score !== null)
        awardBadge({
          userId: user?.id ?? null,
          track: section.id === 'math' ? 'SAT_MATH' : 'SAT_ENGLISH',
          band: section.score,
          mode: 'mock',
          source: 'sat-full-mock',
        })
    })
  }, [awardBadge, complete, historyReview, onlySection, report.midpoint, score, sections, submitted, user?.id])

  return (
    <main className="sat-results workspace-page">
      <div className="sr-container">
        <div className="sr-topbar">
          <button type="button" className="sr-back" onClick={onBack ?? (() => navigate(backPath))}>
            <ArrowLeft size={15} />
            {returnLabel}
          </button>
          <BrandLogo height={29} />
        </div>
        <header className="sr-header">
          <div>
            <p className="sr-eyebrow">
              <span /> Your personal score report
            </p>
            <h1>
              Your SAT results<span>.</span>
            </h1>
            <p className="sr-subtitle">See what clicked. Find your next step.</p>
          </div>
          <div className="sr-download">
            <button
              type="button"
              className="sr-button sr-button-primary"
              disabled={!submitted}
              onClick={downloadReport}
            >
              <ArrowDownToLine size={17} />
              Download your result
              <ExternalLink size={13} />
            </button>
            <span>
              {submitted ? 'Opens your report · Save as PDF or print' : 'Available after you submit the test'}
            </span>
          </div>
        </header>
        <div className="sr-attempt-meta">
          <strong>{test.title}</strong>
          <span className="sr-meta-dot" />
          <span>{formatSATDate(attempt.submittedAt ?? attempt.updatedAt)}</span>
          <span className="sr-meta-dot" />
          <span>{attempt.mode === 'exam' ? 'Exam mode' : 'Practice mode'}</span>
          <span className={`sr-completed ${submitted ? '' : 'is-incomplete'}`}>
            {submitted ? <CheckCircle2 size={13} /> : <CircleDashed size={13} />}
            {submitted ? 'Completed' : 'Saved incomplete'}
          </span>
        </div>
        {!submitted && (
          <p className="sr-notice">
            This attempt was saved before submission. You can review your saved answers; a score is available after
            completion.
          </p>
        )}
        {satAvailabilityNote(test) && <p className="sr-notice">{satAvailabilityNote(test)}</p>}
        {reportError && (
          <p className="sr-notice" role="alert">
            Your browser blocked the report tab. Allow pop-ups for Ivygoo, then select Download your result again.
          </p>
        )}
        <div className="sr-tabs" role="tablist" aria-label="SAT result analysis" onKeyDown={handleTabKeys}>
          {RESULT_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`sat-result-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`sat-result-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => setTab(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
              {id === 'questions' && <small>{allQuestions.length}</small>}
            </button>
          ))}
        </div>

        {tab === 'scores' && (
          <section
            role="tabpanel"
            id="sat-result-panel-scores"
            aria-labelledby="sat-result-tab-scores"
            tabIndex={0}
            className="sr-panel"
          >
            <div className={`sr-score-grid ${sections.length === 1 ? 'is-section' : ''}`}>
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  className={`sr-card sr-section-score ${index === 0 ? 'sr-section-first' : 'sr-section-last'}`}
                  aria-label={`${section.label} result`}
                >
                  <div className="sr-card-heading">
                    <span className="sr-section-icon">
                      {section.id === 'math' ? <GraduationCap size={18} /> : <BookOpen size={18} />}
                    </span>
                    <h2>{section.label}</h2>
                  </div>
                  <ScoreRing score={section.score} percent={section.percent} label={section.label} />
                  <div className="sr-section-range">
                    {section.score === null
                      ? 'Based on the available answers'
                      : `Estimated range ${section.range[0]}–${section.range[1]}`}
                  </div>
                  <OutcomeBar {...section} />
                  <div className="sr-outcome-counts">
                    <span>
                      <i className="is-correct" />
                      <b>{section.correct}</b> correct
                    </span>
                    <span>
                      <i className="is-incorrect" />
                      <b>{section.incorrect}</b> incorrect
                    </span>
                    <span>
                      <i className="is-unanswered" />
                      <b>{section.unanswered}</b> unanswered
                    </span>
                  </div>
                </section>
              ))}
              <section className="sr-card sr-total-score" aria-label="Overall result">
                <span className="sr-score-caption">
                  <Target size={14} />
                  {!submitted
                    ? 'Saved incomplete'
                    : score === null
                      ? 'Available-module accuracy'
                      : sections.length === 1
                        ? 'Estimated section score'
                        : 'Estimated total score'}
                </span>
                <div className="sr-total-number">{!submitted ? '—' : (score ?? `${report.percent}%`)}</div>
                <p className="sr-total-scale">{score === null ? 'Based on your saved answers' : `out of ${maximum}`}</p>
                {score !== null && (
                  <>
                    <div
                      className="sr-score-scale"
                      role="img"
                      aria-label={`Estimated score ${score} on a ${maximum === 800 ? 200 : 400} to ${maximum} scale`}
                    >
                      <span
                        style={{
                          width: `${Math.max(0, Math.min(100, ((score - (maximum === 800 ? 200 : 400)) / (maximum === 800 ? 600 : 1200)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="sr-scale-labels">
                      <span>{maximum === 800 ? 200 : 400}</span>
                      <span>{maximum}</span>
                    </div>
                    <div className="sr-total-range">
                      Estimated range{' '}
                      <strong>
                        {range[0]}–{range[1]}
                      </strong>
                    </div>
                  </>
                )}
                <div className="sr-total-footer">
                  <span className="sr-mini-brand">
                    ivy<span>Goo</span>
                  </span>
                  <p>{submitted ? 'A clearer picture of where you are.' : 'Finish the test to see your score.'}</p>
                </div>
              </section>
            </div>
            <p className="sr-estimate-note">
              Practice scores are estimates, not official SAT results. Accuracy reflects the questions in this attempt.
            </p>
            <div className="sr-summary-strip" aria-label="Attempt summary">
              {[
                { label: 'Correct', value: `${report.correct}/${allQuestions.length}`, icon: CheckCircle2 },
                { label: 'Accuracy', value: `${report.percent}%`, icon: Target },
                { label: 'Time used', value: formatSATDuration(analysis.seconds), icon: Clock3 },
                { label: 'To review', value: String(report.incorrect + report.unanswered), icon: BookOpenCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label}>
                  <Icon size={19} />
                  <div>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="sr-insight-grid">
              <section className="sr-focus-card">
                <span className="sr-insight-icon">
                  <Target size={21} />
                </span>
                <div>
                  <p className="sr-eyebrow">{priorities.length ? 'Your next focus' : 'Keep the momentum'}</p>
                  <h2>{priorities[0]?.domain ?? 'A clean sweep. Keep going.'}</h2>
                  <p>
                    {priorities[0]?.guidance ??
                      'You answered every question correctly. Try a new test to check your skills on fresh material.'}
                  </p>
                  <button
                    type="button"
                    className="sr-text-button"
                    onClick={() => (priorities[0] ? showReview(priorities[0].key) : showReview(null, 'all'))}
                  >
                    {priorities.length ? 'Review weak spots' : 'Explore your answers'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </section>
              <section className="sr-card sr-strength-card">
                <span className="sr-insight-icon">
                  <TrendingUp size={21} />
                </span>
                <div>
                  <p className="sr-eyebrow">{strongest?.correct ? 'Your strongest area' : 'Build your foundation'}</p>
                  <h2>{strongest?.correct ? strongest.domain : 'Start with one skill.'}</h2>
                  <p>
                    {strongest?.correct
                      ? `${strongest.correct} of ${strongest.total} correct · ${strongest.percent}% accuracy. Keep this skill sharp as you work on your next focus.`
                      : 'Review an explanation, write down the rule, then try a similar question without notes.'}
                  </p>
                  <button type="button" className="sr-text-button" onClick={() => setTab('domains')}>
                    Explore knowledge & skills
                    <ArrowRight size={15} />
                  </button>
                </div>
              </section>
            </div>
          </section>
        )}

        {tab === 'performance' && (
          <section
            role="tabpanel"
            id="sat-result-panel-performance"
            aria-labelledby="sat-result-tab-performance"
            tabIndex={0}
            className="sr-panel"
          >
            <div className="sr-panel-heading">
              <div>
                <p className="sr-eyebrow">The bigger picture</p>
                <h2>How your test unfolded</h2>
                <p>Compare accuracy and time across your modules.</p>
              </div>
              <span className="sr-time-badge">
                <Clock3 size={16} />
                {formatSATDuration(analysis.seconds)} total
              </span>
            </div>
            <div className="sr-performance-grid">
              <section className="sr-card sr-module-card">
                <h3>Module breakdown</h3>
                <div className="sr-legend">
                  <span>
                    <i className="is-correct" />
                    Correct
                  </span>
                  <span>
                    <i className="is-incorrect" />
                    Incorrect
                  </span>
                  <span>
                    <i className="is-unanswered" />
                    Unanswered
                  </span>
                </div>
                {analysis.modules.map((module) => (
                  <div className="sr-module-row" key={module.id}>
                    <div className="sr-module-title">
                      <div>
                        <strong>{module.shortTitle}</strong>
                        <span>
                          {module.correct} / {module.total} correct
                        </span>
                      </div>
                      <b>{module.percent}%</b>
                    </div>
                    <OutcomeBar {...module} />
                    <div className="sr-module-foot">
                      <span>
                        {module.incorrect} incorrect · {module.unanswered} unanswered
                      </span>
                      <span>
                        <Clock3 size={12} />
                        {module.started ? formatSATDuration(module.seconds) : 'Not started'}
                      </span>
                    </div>
                  </div>
                ))}
                {!attempt.moduleElapsedSeconds && (
                  <p className="sr-small-note">Timing for this older attempt is estimated from saved timestamps.</p>
                )}
              </section>
              <div className="sr-performance-side">
                <section className="sr-card sr-difficulty-card">
                  <h3>Accuracy by difficulty</h3>
                  <p className="sr-small-note">Question difficulty follows the practice test labels.</p>
                  {analysis.difficulty.map((row) => (
                    <div className="sr-difficulty-row" key={row.label}>
                      <div>
                        <strong>{row.label}</strong>
                        <span>
                          {row.correct}/{row.total} correct
                        </span>
                        <b>{row.percent}%</b>
                      </div>
                      <div className="sr-domain-progress">
                        <span style={{ width: `${row.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </section>
                <section className="sr-card sr-pacing-card">
                  <Clock3 size={22} />
                  <h3>Your time, in context</h3>
                  <p>Time used counts active module time. Breaks and saved pauses are excluded when recorded.</p>
                  <p>
                    {attempt.mode === 'practice'
                      ? 'This was untimed practice. Focus on understanding the solution before increasing speed.'
                      : 'Module totals show where you spent time. Review missed answers before choosing a pacing strategy.'}
                  </p>
                  <span className="sr-small-note">Per-question timing was not recorded for this attempt.</span>
                </section>
              </div>
            </div>
          </section>
        )}

        {tab === 'domains' && (
          <section
            role="tabpanel"
            id="sat-result-panel-domains"
            aria-labelledby="sat-result-tab-domains"
            tabIndex={0}
            className="sr-panel"
          >
            <div className="sr-panel-heading">
              <div>
                <p className="sr-eyebrow">Knowledge & skills</p>
                <h2>Know your strengths. Choose your focus.</h2>
                <p>Each percentage is based on your answers in this attempt.</p>
              </div>
            </div>
            <div className="sr-domain-columns">
              {sections.map((section) => (
                <section key={section.id} className="sr-domain-section">
                  <h3>
                    {section.id === 'math' ? <GraduationCap size={18} /> : <BookOpen size={18} />}
                    {section.label}
                    <span>
                      {section.correct}/{section.total} correct
                    </span>
                  </h3>
                  {domains
                    .filter((d) => d.section === section.id)
                    .map((domain) => (
                      <div key={domain.key} className="sr-card sr-domain-card">
                        <div className="sr-domain-heading">
                          <h4>{domain.domain}</h4>
                          <strong>
                            {domain.percent}
                            <small>%</small>
                          </strong>
                        </div>
                        <div
                          className="sr-domain-progress"
                          role="img"
                          aria-label={`${domain.domain}: ${domain.percent}% accuracy`}
                        >
                          <span style={{ width: `${domain.percent}%` }} />
                        </div>
                        <div className="sr-domain-meta">
                          <span>
                            {domain.correct} / {domain.total} correct
                          </span>
                          <span className={domain.percent >= 80 ? 'sr-mastery-strong' : 'sr-mastery-focus'}>
                            {domain.percent >= 80 ? 'Strong in this attempt' : 'Room to grow'}
                          </span>
                        </div>
                        <p>{domain.guidance}</p>
                        <button
                          type="button"
                          className="sr-text-button"
                          onClick={() => showReview(domain.key, domain.correct < domain.total ? 'missed' : 'all')}
                        >
                          {domain.correct < domain.total
                            ? `Review ${domain.total - domain.correct} missed`
                            : 'Review answers'}
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                </section>
              ))}
            </div>
          </section>
        )}

        {tab === 'questions' && (
          <section
            role="tabpanel"
            id="sat-result-panel-questions"
            aria-labelledby="sat-result-tab-questions"
            tabIndex={0}
            className="sr-panel"
          >
            <div className="sr-panel-heading">
              <div>
                <p className="sr-eyebrow">From answer to understanding</p>
                <h2>Review, reflect, improve.</h2>
                <p>Your answers, explanations, highlights and notes — together.</p>
              </div>
              <span className="sr-time-badge">
                <CheckCircle2 size={16} />
                Correct {report.correct}/{allQuestions.length}
              </span>
            </div>
            <div id="sat-deep-review" className="sr-review-layout">
              <aside className="sr-card sr-navigator">
                <div className="sr-navigator-heading">
                  <h3>Question navigator</h3>
                  <span>{filteredQuestions.length} questions</span>
                </div>
                <div className="sr-review-filters" aria-label="Filter questions">
                  {(['all', 'missed', 'correct', 'incorrect', 'unanswered', 'flagged'] as ReviewFilter[]).map(
                    (value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={filter === value}
                        onClick={() => chooseFilter(value)}
                      >
                        {value === 'missed' ? 'To review' : value}
                        <span>{allQuestions.filter((q) => matches(q, value, moduleFilter, domainFilter)).length}</span>
                      </button>
                    ),
                  )}
                </div>
                <label className="sr-select-label" htmlFor="sat-review-module">
                  Module
                </label>
                <select
                  id="sat-review-module"
                  value={moduleFilter}
                  onChange={(event) => chooseFilter(filter, event.target.value as 'all' | SATModuleId)}
                >
                  <option value="all">All {modules.length} modules</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.shortTitle}
                    </option>
                  ))}
                </select>
                {domainFilter && (
                  <div className="sr-domain-filter">
                    <span>{domains.find((d) => d.key === domainFilter)?.domain}</span>
                    <button
                      type="button"
                      aria-label="Clear domain filter"
                      onClick={() => chooseFilter(filter, moduleFilter, null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="sr-question-groups">
                  {modules.map((module) => {
                    const rows = filteredQuestions.filter((q) => q.moduleId === module.id)
                    return rows.length ? (
                      <div key={module.id} className="sr-question-group">
                        <h4>{module.shortTitle}</h4>
                        <div>
                          {rows.map((question) => (
                            <button
                              type="button"
                              key={question.id}
                              className={`sr-question-number w-full is-${satAnswerStatus(question, attempt)} ${selectedQuestion?.id === question.id ? 'is-selected' : ''}`}
                              aria-label={`${module.shortTitle}, question ${question.number}, ${satAnswerStatus(question, attempt)}${attempt.flagged.includes(question.id) ? ', flagged' : ''}`}
                              aria-current={selectedQuestion?.id === question.id ? 'true' : undefined}
                              onClick={() => setSelectedId(question.id)}
                            >
                              {question.number}
                              {attempt.flagged.includes(question.id) && <Flag size={9} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })}
                  {!filteredQuestions.length && (
                    <div className="sr-empty">
                      <CheckCircle2 size={26} />
                      <strong>No questions match.</strong>
                      <p>Try another status or module.</p>
                      <button type="button" className="sr-text-button" onClick={() => chooseFilter('all', 'all', null)}>
                        Reset filters
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="sr-legend">
                  <span>
                    <i className="is-correct" />
                    Correct
                  </span>
                  <span>
                    <i className="is-incorrect" />
                    Incorrect
                  </span>
                  <span>
                    <i className="is-unanswered" />
                    Unanswered
                  </span>
                </div>
              </aside>
              <article className="sr-review-article">
                {selectedQuestion && selectedStatus ? (
                  <>
                    <div className="sr-question-heading">
                      <div>
                        <p className="sr-eyebrow">{selectedModule?.title}</p>
                        <h3>Question {selectedQuestion.number}</h3>
                      </div>
                      <span className={`sr-answer-status ${selectedStatus.className}`}>
                        <StatusIcon size={16} />
                        {selectedStatus.label}
                      </span>
                    </div>
                    <ReviewQuestion
                      question={selectedQuestion}
                      response={attempt.answers[selectedQuestion.id]}
                      note={attempt.notes[selectedQuestion.id]}
                      strokes={attempt.highlights[selectedQuestion.id] ?? []}
                      eliminatedChoices={attempt.eliminatedChoices?.[selectedQuestion.id] ?? []}
                    />
                    <nav className="sr-question-pagination" aria-label="Review question navigation">
                      <button
                        type="button"
                        className="sr-button"
                        disabled={visibleIndex <= 0}
                        onClick={() => setSelectedId(filteredQuestions[visibleIndex - 1].id)}
                      >
                        <ArrowLeft size={15} />
                        Previous
                      </button>
                      <span>
                        {visibleIndex + 1} of {filteredQuestions.length}
                      </span>
                      <button
                        type="button"
                        className="sr-button sr-button-dark"
                        disabled={visibleIndex >= filteredQuestions.length - 1}
                        onClick={() => setSelectedId(filteredQuestions[visibleIndex + 1].id)}
                      >
                        Next
                        <ArrowRight size={15} />
                      </button>
                    </nav>
                  </>
                ) : (
                  <div className="sr-card sr-empty sr-empty-article">
                    <BookOpenCheck size={34} />
                    <h3>A fresh view starts here.</h3>
                    <p>No questions match these filters. Choose another filter to continue reviewing.</p>
                    <button type="button" className="sr-button" onClick={() => chooseFilter('all', 'all', null)}>
                      Show all questions
                    </button>
                  </div>
                )}
              </article>
            </div>
          </section>
        )}
        <footer className="sr-footer">
          <span>
            <Check size={13} />
            Your progress, one practice at a time.
          </span>
          <div>
            <button type="button" className="sr-button" onClick={onBack ?? (() => navigate(backPath))}>
              Back to {returnLabel}
            </button>
            {onStartAgain && (
              <button type="button" className="sr-button sr-button-dark" onClick={onStartAgain}>
                <RotateCcw size={14} />
                Start fresh
              </button>
            )}
          </div>
        </footer>
      </div>
    </main>
  )
}
