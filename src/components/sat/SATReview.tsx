import { SATNoteList } from './SATNotes'
import { readSATNotes, type SATNote } from '@/features/sat/notes'
import { analyzeSATResult, formatSATDate, formatSATDuration, satAnswerStatus } from '@/features/sat/resultAnalysis'
import { openSATReport } from '@/features/sat/resultReport'
import { bankDomain } from '@/features/sat/bankTopics'
import { examResultsApi, MIN_PLATFORM_PARTICIPANTS, nationalPercentile, ordinal } from '@/features/sat/resultInsights'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { SATDiscussion, SATLeaderboard, type StandingState } from './SATResultSocial'
import './SATReview.css'
import './SATResultsPro.css'
import { useCallback, useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Flag,
  GraduationCap,
  Layers3,
  Lightbulb,
  MessageSquareText,
  RotateCcw,
  Target,
  TrendingUp,
  Trophy,
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
import SATChoiceContent from './SATChoiceContent'
import SATVisual from './SATVisual'
import SATTextHighlights from './SATTextHighlights'
import { useAuthStore } from '@/store/authStore'
import { useBadgeStore } from '@/store/badgeStore'

type ReviewFilter = 'all' | 'missed' | 'correct' | 'incorrect' | 'unanswered' | 'flagged'
type ResultTab = 'scores' | 'performance' | 'leaderboard' | 'domains' | 'questions' | 'discussion'
type SectionFilter = 'all' | SATQuestion['section']
const RESULT_TABS = [
  { id: 'scores', label: 'Scores', icon: GraduationCap },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'domains', label: 'Domains', icon: Layers3 },
  { id: 'questions', label: 'Question Review', icon: BookOpenCheck },
  { id: 'discussion', label: 'Discussion', icon: MessageSquareText },
] as const

const moduleChip = (module?: { id: string; section: string }) =>
  module ? `${module.section === 'math' ? 'Math' : 'R&W'} · M${module.id.replace(/\D/g, '') || '1'}` : ''

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
  const gradientId = `sr-ring-${useId().replace(/:/g, '')}`
  const progress = score === null ? percent : (score / 800) * 100
  return (
    <div
      className="sr-score-ring"
      role="img"
      aria-label={`${label}: ${score === null ? `${percent}% accuracy` : `${score} out of 800, estimated`}`}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="sr-ring-stop-start" />
            <stop offset="1" className="sr-ring-stop-end" />
          </linearGradient>
        </defs>
        <circle className="sr-ring-track" cx="100" cy="100" r="84" />
        <circle
          className="sr-ring-value"
          style={{ stroke: `url(#${gradientId})` }}
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
  if (!response?.trim())
    return {
      label: 'Unanswered',
      className: 'bg-amber-50 text-amber-700',
      icon: CircleDashed,
    }
  if (isSATAnswerCorrect(question, response))
    return {
      label: 'Correct',
      className: 'bg-emerald-50 text-emerald-700',
      icon: CheckCircle2,
    }
  return {
    label: 'Incorrect',
    className: 'bg-red-50 text-red-700',
    icon: XCircle,
  }
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
                      <div
                        data-sat-highlight-block={`choice-${choice.key}`}
                        className="min-w-0 flex-1 pt-1 font-serif text-[17px] leading-8 text-slate-800"
                      >
                        <SATChoiceContent choice={choice} />
                        {eliminatedChoices.includes(choice.key) ? (
                          <span className="mt-1 block font-sans text-xs font-semibold text-slate-500">
                            Crossed out during test
                          </span>
                        ) : null}
                      </div>
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
  const [selectedId, setSelectedId] = useState(allQuestions[0]?.id)
  const [reviewView, setReviewView] = useState<'overview' | 'detail'>('overview')
  const [reportError, setReportError] = useState(false)
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all')
  const [standing, setStanding] = useState<StandingState>({
    status: 'loading',
  })
  const [standingReload, setStandingReload] = useState(0)
  const [discussionRef, setDiscussionRef] = useState('')
  const sectionScore = (id: SATQuestion['section']) => sections.find((section) => section.id === id)?.score ?? null
  const rwScore = sectionScore('reading-writing')
  const mathScore = sectionScore('math')

  useEffect(() => {
    if (!user) return setStanding({ status: 'guest' })
    if (!submitted || score === null) return setStanding({ status: 'unavailable' })
    let active = true
    setStanding({ status: 'loading' })
    examResultsApi
      .satStanding(test.id, { total: score, rw: rwScore, math: mathScore })
      .then((data) => active && setStanding({ status: 'ready', data }))
      .catch(() => active && setStanding({ status: 'error' }))
    return () => {
      active = false
    }
  }, [mathScore, rwScore, score, standingReload, submitted, test.id, user])

  const platformReady = standing.status === 'ready' && standing.data.participants >= MIN_PLATFORM_PARTICIPANTS
  const percentileFor = useCallback(
    (key: 'total' | 'rw' | 'math', value: number | null, scale: 800 | 1600) => {
      if (value === null) return null
      const platform = standing.status === 'ready' ? standing.data.percentiles[key] : null
      if (platformReady && platform !== null) return { value: platform, platform: true }
      return { value: nationalPercentile(value, scale), platform: false }
    },
    [platformReady, standing],
  )
  const percentileText = (entry: ReturnType<typeof percentileFor>, firstAttempt = false) =>
    !entry
      ? null
      : entry.platform
        ? `${entry.value}% got same as or below you${firstAttempt ? ' in their 1st attempt' : ''}.`
        : `≈ ${ordinal(entry.value)} SAT percentile (estimated).`
  const domainKey = (q: SATQuestion) => `${q.section}:${bankDomain(q.domain)}`
  const matches = (q: SATQuestion, status: ReviewFilter, module: string, domain: string | null) => {
    if (sectionFilter !== 'all' && q.section !== sectionFilter) return false
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
  const chooseSection = (next: SectionFilter) => {
    setSectionFilter(next)
    const first = allQuestions.find((q) => next === 'all' || q.section === next)
    if (first) setSelectedId(first.id)
  }
  const discussQuestion = (question: SATQuestion) => {
    setDiscussionRef(`${question.moduleId}:${question.number}`)
    setTab('discussion')
    requestAnimationFrame(() => document.getElementById('sat-discussion-body')?.focus())
  }
  const showReview = (domain: string | null = null, status: ReviewFilter = 'missed') => {
    setSectionFilter('all')
    chooseFilter(status, 'all', domain)
    setTab('questions')
    setReviewView('overview')
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
        email: user?.email,
        timestamp: attempt.submittedAt ?? attempt.updatedAt,
        mode: attempt.mode,
        attempt,
        percentiles: {
          total: percentileFor('total', score, analysis.maximum === 800 ? 800 : 1600),
          rw: percentileFor('rw', rwScore, 800),
          math: percentileFor('math', mathScore, 800),
        },
      }),
    )
  const activateTab = (next: ResultTab) => {
    if (next === 'questions') {
      setSectionFilter('all')
      chooseFilter('all', 'all', null)
      setReviewView('overview')
    }
    setTab(next)
  }
  const openQuestion = (id: string) => {
    setSelectedId(id)
    setReviewView('detail')
  }
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
    activateTab(RESULT_TABS[next].id)
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
        <section className="srx-hero sr-card">
          <div className="sr-topbar">
            <button type="button" className="sr-back" onClick={onBack ?? (() => navigate(backPath))}>
              <ArrowLeft size={15} />
              {returnLabel}
            </button>
            <BrandLogo height={42} />
          </div>
          <header className="srx-header">
            <div className="srx-title-row">
              <h1>
                Your SAT <span>Results</span>
              </h1>
              <button
                type="button"
                className="srx-download"
                disabled={!submitted}
                onClick={downloadReport}
                title="Open your score report to save as PDF or print"
              >
                <ArrowDownToLine size={17} />
                Download Report
              </button>
            </div>
            <p className="srx-subtitle">
              An in-depth analysis of your performance. See your strengths and where you can improve.
            </p>
            <div className="srx-meta">
              <span className="srx-meta-test">{test.title}</span>
              <span>{formatSATDate(attempt.submittedAt ?? attempt.updatedAt)}</span>
              <span>{attempt.mode === 'exam' ? 'Exam mode' : 'Practice mode'}</span>
              <span>
                {allQuestions.length} questions · {modules.length} modules
              </span>
              <span className={`srx-meta-status ${submitted ? '' : 'is-incomplete'}`}>
                {submitted ? <CheckCircle2 size={13} /> : <CircleDashed size={13} />}
                {submitted ? 'Completed' : 'Saved incomplete'}
              </span>
            </div>
          </header>
        </section>
        {!submitted && (
          <p className="sr-notice">
            This attempt was saved before submission. You can review your saved answers; a score is available after
            completion.
          </p>
        )}
        {satAvailabilityNote(test) && <p className="sr-notice">{satAvailabilityNote(test)}</p>}
        {reportError && (
          <p className="sr-notice" role="alert">
            Your browser blocked the report tab. Allow pop-ups for Ivygoo, then select Download Report again.
          </p>
        )}
        <div className="srx-tabs-wrap">
          <div className="srx-tabs" role="tablist" aria-label="SAT result analysis" onKeyDown={handleTabKeys}>
            {RESULT_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`sat-result-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls={`sat-result-panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => activateTab(id)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {tab === 'scores' && (
          <section
            role="tabpanel"
            id="sat-result-panel-scores"
            aria-labelledby="sat-result-tab-scores"
            tabIndex={0}
            className="sr-panel"
          >
            <div className={`srx-score-stage ${sections.length === 1 ? 'is-section' : ''}`}>
              {sections.length > 1 &&
                sections.map((section, index) => {
                  const entry = percentileFor(section.id === 'math' ? 'math' : 'rw', section.score, 800)
                  return (
                    <section
                      key={section.id}
                      className={`sr-card srx-score-card ${index === 0 ? 'is-first' : 'is-last'}`}
                      aria-label={`${section.label} result`}
                    >
                      <h2>{section.label}</h2>
                      <ScoreRing score={section.score} percent={section.percent} label={section.label} />
                      <p className="srx-score-counts">
                        <b className="tone-correct">{section.correct} Correct</b>
                        <span aria-hidden="true">·</span>
                        <b className="tone-wrong">{section.total - section.correct} Wrong</b>
                      </p>
                      <p className="srx-percentile">
                        {percentileText(entry) ??
                          (section.score === null ? 'Score shown after the full section is completed.' : '')}
                      </p>
                      <button type="button" className="srx-card-link" onClick={() => showReview(null, 'all')}>
                        {section.unanswered ? `${section.unanswered} unanswered · ` : ''}
                        Review answers
                        <ChevronRight size={14} />
                      </button>
                    </section>
                  )
                })}
              <section className="sr-card srx-score-card srx-total-card" aria-label="Overall result">
                <span className="srx-total-glow" aria-hidden="true" />
                <h2>
                  {!submitted
                    ? 'Saved incomplete'
                    : score === null
                      ? 'Accuracy'
                      : sections.length === 1
                        ? `${sections[0].label} Score`
                        : 'Total Score'}
                </h2>
                <div className="srx-total-number">
                  <strong>{!submitted ? '—' : (score ?? `${report.percent}%`)}</strong>
                  {submitted && score !== null && <span>/{maximum}</span>}
                </div>
                <p className="srx-percentile">
                  {!submitted
                    ? 'Finish the test to see your score.'
                    : score === null
                      ? 'Based on the available modules.'
                      : percentileText(percentileFor('total', score, maximum === 800 ? 800 : 1600), true)}
                </p>
                {score !== null && (
                  <div className="srx-total-range">
                    <span>
                      Estimated range{' '}
                      <b>
                        {range[0]}–{range[1]}
                      </b>
                    </span>
                    <span>
                      <b>{report.correct}</b>/{allQuestions.length} correct
                    </span>
                  </div>
                )}
                {sections.length === 1 && (
                  <p className="srx-score-counts">
                    <b className="tone-correct">{sections[0].correct} Correct</b>
                    <span aria-hidden="true">·</span>
                    <b className="tone-wrong">{sections[0].total - sections[0].correct} Wrong</b>
                  </p>
                )}
              </section>
            </div>
            <p className="sr-estimate-note">
              Practice scores are estimates, not official SAT results. Accuracy reflects the questions in this attempt.
            </p>
            <div className="sr-summary-strip" aria-label="Attempt summary">
              {[
                {
                  label: 'Correct',
                  value: `${report.correct}/${allQuestions.length}`,
                  icon: CheckCircle2,
                },
                {
                  label: 'Overall accuracy',
                  value: `${report.percent}%`,
                  icon: Target,
                },
                {
                  label: 'Accuracy on answered',
                  value: `${analysis.answeredAccuracy}%`,
                  icon: TrendingUp,
                },
                {
                  label: 'Completion',
                  value: `${analysis.completion}%`,
                  icon: Check,
                },
                {
                  label: 'Active time',
                  value: formatSATDuration(analysis.seconds),
                  icon: Clock3,
                },
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
                  <p className="sr-eyebrow">
                    {strongest?.correct ? 'Highest domain accuracy' : 'Build your foundation'}
                  </p>
                  <h2>{strongest?.correct ? strongest.domain : 'Start with one skill.'}</h2>
                  <p>
                    {strongest?.correct
                      ? `${strongest.correct} of ${strongest.total} correct · ${strongest.percent}% accuracy. ${strongest.percent >= 80 ? 'Keep this skill sharp as you work on your next focus.' : 'This was your best domain result in this attempt. Review its missed questions to build consistency.'}`
                      : 'Review an explanation, write down the rule, then try a similar question without notes.'}
                  </p>
                  <button type="button" className="sr-text-button" onClick={() => setTab('domains')}>
                    Explore knowledge & skills
                    <ArrowRight size={15} />
                  </button>
                </div>
              </section>
            </div>
            <section className="sr-card sr-next-steps">
              <div>
                <p className="sr-eyebrow">Your next practice session</p>
                <h2>Turn the review into a plan.</h2>
                <p>
                  {analysis.prioritySkills.length
                    ? 'Start with the skills that account for the most missed questions.'
                    : 'Keep your skills sharp with a fresh set of questions.'}
                </p>
              </div>
              <ol>
                {analysis.prioritySkills.slice(0, 3).map((skill, index) => (
                  <li key={skill.key}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{skill.skill}</strong>
                      <small>
                        {skill.domain} · {skill.total - skill.correct} to revisit
                      </small>
                    </div>
                    <button
                      type="button"
                      aria-label={`Review ${skill.skill}`}
                      onClick={() => showReview(`${skill.section}:${skill.domain}`)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </li>
                ))}
                {!analysis.prioritySkills.length && (
                  <li>
                    <span>01</span>
                    <div>
                      <strong>Challenge yourself with a new test</strong>
                      <small>Check that you can apply these skills to unfamiliar questions.</small>
                    </div>
                  </li>
                )}
              </ol>
            </section>
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
            <section className="sr-card sr-skill-table-card">
              <div className="sr-block-heading">
                <div>
                  <p className="sr-eyebrow">Beyond the domain</p>
                  <h2>Skill-by-skill breakdown</h2>
                </div>
                <span>{analysis.skills.length} skills assessed</span>
              </div>
              <div className="sr-skill-table">
                {analysis.skills.map((skill) => (
                  <div key={skill.key}>
                    <div>
                      <strong>{skill.skill}</strong>
                      <span>{skill.domain}</span>
                    </div>
                    <div className="sr-domain-progress">
                      <span style={{ width: `${skill.percent}%` }} />
                    </div>
                    <strong>{skill.percent}%</strong>
                    <span>
                      {skill.correct}/{skill.total} correct
                    </span>
                  </div>
                ))}
              </div>
            </section>
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
            <div className="srx-center-heading">
              <p className="sr-eyebrow">From answer to understanding</p>
              <h2>Question Review</h2>
              <p>Your answer, the correct answer and a full explanation for every question.</p>
            </div>
            {reviewView === 'overview' && (
              <>
                <div className="srx-review-controls">
                  {sections.length > 1 && (
                    <div className="srx-segment" role="group" aria-label="Section">
                      {(
                        [
                          ['all', 'All'],
                          ['reading-writing', 'R&W'],
                          ['math', 'Math'],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={sectionFilter === value}
                          onClick={() => chooseSection(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="srx-status-chips" role="group" aria-label="Filter by outcome">
                    {(
                      [
                        ['all', 'All'],
                        ['correct', 'Correct'],
                        ['incorrect', 'Incorrect'],
                        ['unanswered', 'Unanswered'],
                        ['flagged', 'Flagged'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`chip-${value}`}
                        aria-pressed={filter === value}
                        onClick={() => chooseFilter(value, moduleFilter, domainFilter)}
                      >
                        {label}
                        <span>{allQuestions.filter((q) => matches(q, value, moduleFilter, domainFilter)).length}</span>
                      </button>
                    ))}
                  </div>
                  {(domainFilter || moduleFilter !== 'all') && (
                    <button
                      type="button"
                      className="srx-clear-filter"
                      onClick={() => chooseFilter(filter, 'all', null)}
                    >
                      {domainFilter ? domains.find((d) => d.key === domainFilter)?.domain : 'Module filter'}
                      <X size={13} />
                    </button>
                  )}
                </div>
                {filteredQuestions.length ? (
                  <ol className="sr-card srx-question-list" aria-label="Questions">
                    {filteredQuestions.map((question) => {
                      const module = modules.find((m) => m.id === question.moduleId)
                      const outcome = satAnswerStatus(question, attempt)
                      const response = attempt.answers[question.id]?.trim()
                      return (
                        <li key={question.id} className={`srx-q-row srx-row-${outcome}`} data-question-id={question.id}>
                          <div className="srx-q-id">
                            <span className={`srx-chip ${question.section === 'math' ? 'is-math' : ''}`}>
                              {moduleChip(module)}
                            </span>
                            <strong>
                              Question {question.number}
                              {attempt.flagged.includes(question.id) && (
                                <Flag size={12} aria-label="Flagged" className="srx-flag" />
                              )}
                            </strong>
                          </div>
                          <div className="srx-q-answer">
                            <span>Your Answer</span>
                            <b className={`tone-${outcome}`}>{response || 'Unanswered'}</b>
                          </div>
                          <div className="srx-q-answer">
                            <span>Correct Answer</span>
                            <b className="tone-correct">{question.correctAnswer}</b>
                          </div>
                          <button
                            type="button"
                            className="srx-review-button"
                            aria-label={`Review ${module?.shortTitle ?? ''} question ${question.number}`}
                            onClick={() => openQuestion(question.id)}
                          >
                            Review
                            <ChevronRight size={15} />
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  <div className="sr-card srx-empty">
                    <BookOpenCheck size={30} />
                    <h3>No questions match these filters.</h3>
                    <button
                      type="button"
                      className="sr-button"
                      onClick={() => {
                        setSectionFilter('all')
                        chooseFilter('all', 'all', null)
                      }}
                    >
                      Show all questions
                    </button>
                  </div>
                )}
              </>
            )}
            {reviewView === 'detail' && (
              <button type="button" className="srx-back-to-list" onClick={() => setReviewView('overview')}>
                <ArrowLeft size={15} />
                All questions
              </button>
            )}
            {reviewView === 'detail' && (
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
                          <span>
                            {allQuestions.filter((q) => matches(q, value, moduleFilter, domainFilter)).length}
                          </span>
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
                                onClick={() => openQuestion(question.id)}
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
                        <button
                          type="button"
                          className="sr-text-button"
                          onClick={() => chooseFilter('all', 'all', null)}
                        >
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
                        <div className="srx-question-actions">
                          <button
                            type="button"
                            className="srx-discuss-button"
                            onClick={() => discussQuestion(selectedQuestion)}
                          >
                            <MessageSquareText size={15} />
                            Discuss
                          </button>
                          <span className={`sr-answer-status ${selectedStatus.className}`}>
                            <StatusIcon size={16} />
                            {selectedStatus.label}
                          </span>
                        </div>
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
            )}
          </section>
        )}
        {tab === 'leaderboard' && (
          <section
            role="tabpanel"
            id="sat-result-panel-leaderboard"
            aria-labelledby="sat-result-tab-leaderboard"
            tabIndex={0}
            className="sr-panel"
          >
            <div className="srx-center-heading">
              <p className="sr-eyebrow">Test-day ranking</p>
              <h2>Leaderboard</h2>
              <p>See how your first attempt compares with every learner who took {test.title}.</p>
            </div>
            <SATLeaderboard
              standing={standing}
              onRetry={() => setStandingReload((value) => value + 1)}
              testTitle={test.title}
              sectioned={sections.length > 1}
              maximum={maximum}
            />
          </section>
        )}

        {tab === 'discussion' && (
          <section
            role="tabpanel"
            id="sat-result-panel-discussion"
            aria-labelledby="sat-result-tab-discussion"
            tabIndex={0}
            className="sr-panel"
          >
            <div className="srx-center-heading">
              <p className="sr-eyebrow">Learn together</p>
              <h2>Discussion</h2>
              <p>Ask about a question, share a strategy, or help someone who is stuck.</p>
            </div>
            <SATDiscussion
              testId={test.id}
              modules={modules}
              signedIn={Boolean(user)}
              userName={user?.fullName?.trim() || 'Ivygoo learner'}
              questionRef={discussionRef}
              onQuestionRefChange={setDiscussionRef}
            />
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
