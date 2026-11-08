import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { analyzeSATResult, formatSATDate, formatSATDuration, satAnswerStatus } from '@/features/sat/resultAnalysis'
import { openSATReport } from '@/features/sat/resultReport'
import { bankDomain } from '@/features/sat/bankTopics'
import {
  examResultsApi,
  filledSegments,
  MIN_PLATFORM_PARTICIPANTS,
  nationalPercentile,
  ordinal,
  SKILL_BAR_SEGMENTS,
} from '@/features/sat/resultInsights'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { SATDiscussion, SATLeaderboard, type StandingState } from './SATResultSocial'
import SATQuestionModal from './SATQuestionModal'
import './SATReview.css'
import './SATResultsPro.css'
import { useCallback, useEffect, useId, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Flag,
  GraduationCap,
  Layers3,
  MessageSquareText,
  RotateCcw,
  Target,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type SATAttempt, type SATModuleId, type SATQuestion } from '@/features/sat/practiceTest4'
import { resolveSATTest, satAvailabilityNote, type SATTestDefinition } from '@/features/sat/catalog'
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

const moduleChip = (module?: { id: string; section: string }, bank = false) =>
  module ? `${module.section === 'math' ? 'Math' : 'R&W'}${bank ? '' : ` · M${module.id.replace(/\D/g, '') || '1'}`}` : ''
// Question Bank sets are personal practice: no shared ranking or test discussion.
const BANK_TABS = RESULT_TABS.filter(({ id }) => id !== 'leaderboard' && id !== 'discussion')

type Props = {
  attempt: SATAttempt
  test: SATTestDefinition
  onStartAgain?: () => void
  onBack?: () => void
  backLabel?: string
  historyReview?: boolean
  variant?: 'test' | 'question-bank'
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
          style={{ stroke: `url(#${gradientId})`, '--sr-ring-offset': 100 - progress } as CSSProperties}
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
        <span>{score === null ? <UiText text={"accuracy"} /> : '/ 800'}</span>
      </div>
    </div>
  )
}

const tier = (percent: number) => (percent >= 80 ? 'is-strong' : percent >= 50 ? 'is-mid' : 'is-focus')

function formatPace(seconds: number) {
  const whole = Math.round(seconds)
  return whole >= 60 ? `${Math.floor(whole / 60)}m ${whole % 60}s` : `${whole}s`
}

export default function SATReview({ attempt, test: paper, onStartAgain, onBack, backLabel, historyReview = false, variant = 'test' }: Props) {
  const { c: uiCopy } = useCopy()
  const test = useMemo(() => resolveSATTest(paper, attempt), [paper, attempt])
  const bank = variant === 'question-bank'
  const tabs = bank ? BANK_TABS : RESULT_TABS
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const awardBadge = useBadgeStore((state) => state.awardIfEligible)
  const analysis = useMemo(() => analyzeSATResult(test, attempt), [test, attempt])
  const {
    report,
    questions: allQuestions,
    sections,
    domains,
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
  const [tab, setTab] = useState<ResultTab>('scores')
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [moduleFilter, setModuleFilter] = useState<'all' | SATModuleId>('all')
  const [domainFilter, setDomainFilter] = useState<string | null>(null)
  const [modal, setModal] = useState<{ questions: SATQuestion[]; index: number } | null>(null)
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
    if (bank || !submitted || score === null) return setStanding({ status: 'unavailable' })
    let active = true
    setStanding({ status: 'loading' })
    examResultsApi
      .satStanding(test.id, { total: score, rw: rwScore, math: mathScore })
      .then((data) => active && setStanding({ status: 'ready', data }))
      .catch(() => active && setStanding({ status: 'error' }))
    return () => {
      active = false
    }
  }, [bank, mathScore, rwScore, score, standingReload, submitted, test.id, user])

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
  }
  const discussQuestion = (question: SATQuestion) => {
    setModal(null)
    setDiscussionRef(`${question.moduleId}:${question.number}`)
    setTab('discussion')
    requestAnimationFrame(() => document.getElementById('sat-discussion-body')?.focus())
  }
  const showReview = (domain: string | null = null, status: ReviewFilter = 'missed') => {
    setSectionFilter('all')
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
    }
    setTab(next)
  }
  const openQuestion = (id: string) => {
    const index = filteredQuestions.findIndex((q) => q.id === id)
    if (index >= 0) setModal({ questions: filteredQuestions, index })
  }
  const handleTabKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex(item => item.id === tab)
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null
    if (next === null) return
    event.preventDefault()
    activateTab(tabs[next].id)
    const button = document.getElementById(`sat-result-tab-${tabs[next].id}`)
    button?.focus({ preventScroll: true })
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  useEffect(() => {
    if (bank || historyReview || !submitted || !complete || score === null) return
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
  }, [awardBadge, bank, complete, historyReview, onlySection, report.midpoint, score, sections, submitted, user?.id])

  return (
    <main className="sat-results workspace-page">
      <div className="sr-container">
        <section className="srx-hero sr-card">
          <div className="sr-topbar">
            <button type="button" className="sr-back" onClick={onBack ?? (() => navigate(backPath))}>
              <ArrowLeft size={15} />
              <UiText text={returnLabel} />
            </button>
            <div className="flex items-center gap-4">
              {onStartAgain && <button type="button" className="sr-back" onClick={onStartAgain}><RotateCcw size={14} /><UiText text="Start fresh" /></button>}
              <BrandLogo height={42} />
            </div>
          </div>
          <header className="srx-header">
            <div className="srx-title-row">
              <h1>
                {bank ? <UiText text={"Question Bank"} /> : <UiText text={"Your SAT"} />} <span><UiText text={"Results"} /></span>
              </h1>
              {!bank && <button
                type="button"
                className="srx-download"
                disabled={!submitted}
                onClick={downloadReport}
                title={uiCopy("Open your score report to save as PDF or print")}
              >
                <ArrowDownToLine size={17} />
                <UiText text={"Download Report"} />
              </button>}
            </div>
            <p className="srx-subtitle">
              <UiText text={"An in-depth analysis of your performance. See your strengths and where you can improve."} />
            </p>
            <div className="srx-meta">
              <span className="srx-meta-test">{test.title}</span>
              <span>{formatSATDate(attempt.submittedAt ?? attempt.updatedAt)}</span>
              <span>{attempt.mode === 'exam' ? <UiText text={"Exam mode"} /> : <UiText text={"Practice mode"} />}</span>
              <span>
                {allQuestions.length} <UiText text={"questions ·"} /> {bank ? <UiText text={"Untimed practice set"} /> : <UiText text={"{{value1}} modules"} values={{ value1: String(modules.length) }} />}
              </span>
              <span className={`srx-meta-status ${submitted ? '' : 'is-incomplete'}`}>
                {submitted ? <CheckCircle2 size={13} /> : <CircleDashed size={13} />}
                {submitted ? <UiText text={"Completed"} /> : <UiText text={"Saved incomplete"} />}
              </span>
            </div>
          </header>
        </section>
        {!submitted && (
          <p className="sr-notice">
            <UiText text={"This attempt was saved before submission. You can review your saved answers; a score is available after completion."} />
          </p>
        )}
        {!bank && satAvailabilityNote(test) && <p className="sr-notice">{satAvailabilityNote(test)}</p>}
        {!bank && reportError && (
          <p className="sr-notice" role="alert">
            <UiText text={"Your browser blocked the report tab. Allow pop-ups for Ivygoo, then select Download Report again."} />
          </p>
        )}
        <div className="srx-tabs-wrap">
          <div className="srx-tabs" role="tablist" aria-label={uiCopy("SAT result analysis")} onKeyDown={handleTabKeys}>
            {tabs.map(({ id, label, icon: Icon }) => <button key={id} id={`sat-result-tab-${id}`} type="button" role="tab"
              aria-selected={tab === id} aria-controls={`sat-result-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => activateTab(id)}>
              <Icon size={16} /><span><UiText text={label} /></span>
            </button>)}
          </div>
        </div>

        {tab === 'scores' && (
          <section
            role="tabpanel"
            aria-labelledby="sat-result-tab-scores"
            id="sat-result-panel-scores"
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
                      aria-label={uiCopy("{{value1}} result", { value1: String(section.label) })}
                    >
                      <h2><UiText text={section.label} /></h2>
                      <ScoreRing score={section.score} percent={section.percent} label={section.label} />
                      <p className="srx-score-counts">
                        <b className="tone-correct">{section.correct} <UiText text={"Correct"} /></b>
                        <span aria-hidden="true">·</span>
                        <b className="tone-wrong">{section.total - section.correct} <UiText text={"Wrong"} /></b>
                      </p>
                      <p className="srx-percentile">
                        {percentileText(entry) ??
                          (section.score === null ? 'Score shown after the full section is completed.' : '')}
                      </p>
                      <button type="button" className="srx-card-link" onClick={() => { showReview(null, 'all'); setSectionFilter(section.id) }}>
                        {section.unanswered ? <UiText text={"{{value1}} unanswered · "} values={{ value1: String(section.unanswered) }} /> : ''}
                        <UiText text={"Review answers"} />
                        <ChevronRight size={14} />
                      </button>
                    </section>
                  )
                })}
              <section className="sr-card srx-score-card srx-total-card" aria-label={uiCopy("Overall result")}>
                <span className="srx-total-glow" aria-hidden="true" />
                <h2>
                  {!submitted
                    ? <UiText text={"Saved incomplete"} />
                    : score === null
                      ? <UiText text={"Accuracy"} />
                      : sections.length === 1
                        ? <UiText text={"{{value1}} Score"} values={{ value1: String(sections[0].label) }} />
                        : <UiText text={"Total Score"} />}
                </h2>
                <div className="srx-total-number">
                  <strong>{!submitted ? '—' : (score ?? `${report.percent}%`)}</strong>
                  {submitted && score !== null && <span>/{maximum}</span>}
                </div>
                <p className="srx-percentile">
                  {!submitted
                    ? <UiText text={"Finish the test to see your score."} />
                    : score === null
                      ? <UiText text={"Based on the available modules."} />
                      : percentileText(percentileFor('total', score, maximum === 800 ? 800 : 1600), true)}
                </p>
                {submitted && (
                  <div className="srx-total-range">
                    {score !== null && <span>
                      <UiText text={"Estimated range"} />{' '}
                      <b>
                        {range[0]}–{range[1]}
                      </b>
                    </span>}
                    <span>
                      <b>{report.correct}</b>/{allQuestions.length} <UiText text={"correct"} />
                    </span>
                  </div>
                )}
                {sections.length === 1 && (
                  <p className="srx-score-counts">
                    <b className="tone-correct">{sections[0].correct} <UiText text={"Correct"} /></b>
                    <span aria-hidden="true">·</span>
                    <b className="tone-wrong">{sections[0].total - sections[0].correct} <UiText text={"Wrong"} /></b>
                  </p>
                )}
              </section>
            </div>
            <p className="sr-estimate-note">
              <UiText text={"Practice scores are estimates, not official SAT results. Accuracy reflects the questions in this attempt."} />
            </p>
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
            <div className="srx-center-heading">
              <p className="sr-eyebrow"><UiText text={"The bigger picture"} /></p>
              <h2><UiText text={"How your test unfolded"} /></h2>
              <p><UiText text={"Accuracy and time for every module, difficulty level and skill."} /></p>
            </div>
            <div className="srx-stat-row">
              {(
                [
                  [Clock3, 'Total time', formatSATDuration(analysis.seconds)],
                  [Target, 'Accuracy', `${report.percent}%`],
                  [CheckCircle2, 'Answered', `${analysis.answered}/${allQuestions.length}`],
                  [TrendingUp, 'Accuracy on answered', `${analysis.answeredAccuracy}%`],
                ] as const
              ).map(([Icon, label, value]) => (
                <div key={label} className="sr-card srx-stat">
                  <span className="srx-stat-icon">
                    <Icon size={20} />
                  </span>
                  <div>
                    <small><UiText text={label} /></small>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="srx-perf-grid">
              <section className="sr-card srx-panel-card">
                <div className="srx-card-head">
                  <h3>{bank ? <UiText text={"Section breakdown"} /> : <UiText text={"Module breakdown"} />}</h3>
                  <div className="srx-legend">
                    <span>
                      <i className="seg-correct" />
                      <UiText text={"Correct"} />
                    </span>
                    <span>
                      <i className="seg-incorrect" />
                      <UiText text={"Incorrect"} />
                    </span>
                    <span>
                      <i className="seg-unanswered" />
                      <UiText text={"Unanswered"} />
                    </span>
                  </div>
                </div>
                {analysis.modules.map((module) => (
                  <div className="srx-module" key={module.id}>
                    <div className="srx-module-top">
                      <div>
                        <span className={`srx-chip ${module.section === 'math' ? 'is-math' : ''}`}>
                          {moduleChip(module, bank)}
                        </span>
                        <strong>{module.title}</strong>
                      </div>
                      <b className={`srx-percent ${tier(module.percent)}`}>{module.percent}%</b>
                    </div>
                    <div
                      className="srx-stack"
                      role="img"
                      aria-label={uiCopy("{{value1}} correct, {{value2}} incorrect, {{value3}} unanswered", { value1: String(module.correct), value2: String(module.incorrect), value3: String(module.unanswered) })}
                    >
                      {(['correct', 'incorrect', 'unanswered'] as const).map((key) => (
                        <span
                          key={key}
                          className={`seg-${key}`}
                          style={{ width: `${(module[key] / Math.max(1, module.total)) * 100}%` }}
                        />
                      ))}
                    </div>
                    <div className="srx-module-meta">
                      <span className="pill-correct">
                        <b>{module.correct}</b> <UiText text={"correct"} />
                      </span>
                      <span className="pill-incorrect">
                        <b>{module.incorrect}</b> <UiText text={"incorrect"} />
                      </span>
                      <span className="pill-unanswered">
                        <b>{module.unanswered}</b> <UiText text={"unanswered"} />
                      </span>
                      <span className="srx-time">
                        <Clock3 size={14} />
                        {module.started ? formatSATDuration(module.seconds) : <UiText text={"Not started"} />}
                      </span>
                    </div>
                  </div>
                ))}
                {!attempt.moduleElapsedSeconds && (
                  <p className="srx-note"><UiText text={"Timing for this older attempt is estimated from saved timestamps."} /></p>
                )}
              </section>
              <div className="srx-perf-side">
                <section className="sr-card srx-panel-card">
                  <div className="srx-card-head">
                    <h3><UiText text={"Accuracy by difficulty"} /></h3>
                  </div>
                  {analysis.difficulty.map((row) => (
                    <div className="srx-bar-row" key={row.label}>
                      <div className="srx-bar-label">
                        <strong>
                          <i className={`level-${row.label.toLowerCase()}`} />
                          <UiText text={row.label} />
                        </strong>
                        <span>
                          {row.correct}/{row.total} <UiText text={"correct"} />
                        </span>
                        <b className={`srx-percent-sm ${tier(row.percent)}`}>{row.percent}%</b>
                      </div>
                      <div className="srx-meter">
                        <span className={tier(row.percent)} style={{ width: `${row.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </section>
                <section className="sr-card srx-panel-card">
                  <div className="srx-card-head">
                    <h3><UiText text={"Time per question"} /></h3>
                  </div>
                  {analysis.modules.map((module) => (
                    <div className="srx-pace-row" key={module.id}>
                      <span>{module.shortTitle}</span>
                      <strong>
                        {module.started && module.total ? formatPace(module.seconds / module.total) : '—'}
                      </strong>
                    </div>
                  ))}
                  <p className="srx-note">
                    {attempt.mode === 'practice'
                      ? <UiText text={"Untimed practice: understand each solution first, then build speed."} />
                      : 'Test-day pace is about 71 s per R&W question and 95 s per Math question.'}
                  </p>
                </section>
              </div>
            </div>
            <section className="sr-card srx-panel-card">
              <div className="srx-card-head">
                <div>
                  <p className="sr-eyebrow"><UiText text={"Beyond the domain"} /></p>
                  <h3><UiText text={"Skill-by-skill breakdown"} /></h3>
                </div>
                <span className="srx-count-pill">{analysis.skills.length} <UiText text={"skills"} /></span>
              </div>
              <div className="srx-skill-list">
                {analysis.skills.map((skill) => (
                  <button
                    key={skill.key}
                    type="button"
                    className="srx-skill-row"
                    onClick={() => showReview(`${skill.section}:${skill.domain}`, 'all')}
                  >
                    <span className="srx-skill-name">
                      <strong><UiText text={skill.skill} /></strong>
                      <span><UiText text={skill.domain} /></span>
                    </span>
                    <span className="srx-meter">
                      <span className={tier(skill.percent)} style={{ width: `${skill.percent}%` }} />
                    </span>
                    <b className={`srx-percent-sm ${tier(skill.percent)}`}>{skill.percent}%</b>
                    <span className="srx-skill-count">
                      {skill.correct}/{skill.total} <UiText text={"correct"} />
                    </span>
                  </button>
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
            <div className="srx-center-heading">
              <p className="sr-eyebrow"><UiText text={"Knowledge & skills"} /></p>
              <h2><UiText text={"Know your strengths. Choose your focus."} /></h2>
              <p><UiText text={"Each domain shows how you did on its questions in this attempt."} /></p>
            </div>
            <div className={`srx-domain-columns ${sections.length === 1 ? 'is-single' : ''}`}>
              {sections.map((section) => (
                <section key={section.id} className="srx-domain-col">
                  <header className="sr-card srx-domain-head">
                    <span className={`srx-domain-icon ${section.id === 'math' ? 'is-math' : ''}`}>
                      {section.id === 'math' ? <GraduationCap size={22} /> : <BookOpen size={22} />}
                    </span>
                    <div>
                      <h3><UiText text={section.label} /></h3>
                      <span>
                        {section.correct}/{section.total} <UiText text={"correct"} />
                      </span>
                    </div>
                    <b className={`srx-percent ${tier(section.percent)}`}>{section.percent}%</b>
                  </header>
                  {domains
                    .filter((d) => d.section === section.id)
                    .map((domain) => (
                      <article key={domain.key} className="sr-card srx-domain-card">
                        <div className="srx-domain-top">
                          <h4><UiText text={domain.domain} /></h4>
                          <b className={`srx-percent ${tier(domain.percent)}`}>
                            {domain.percent}
                            <small>%</small>
                          </b>
                        </div>
                        <div
                          className={`srx-segments ${tier(domain.percent)}`}
                          role="img"
                          aria-label={uiCopy("{{value1}}: {{value2}}% accuracy", { value1: String(domain.domain), value2: String(domain.percent) })}
                        >
                          {Array.from({ length: SKILL_BAR_SEGMENTS }, (_, index) => (
                            <i key={index} className={index < filledSegments(domain.percent) ? 'on' : ''} />
                          ))}
                        </div>
                        <div className="srx-domain-meta">
                          <span>
                            <b>{domain.correct}</b> / {domain.total} <UiText text={"correct"} />
                          </span>
                          <span className={`srx-badge ${tier(domain.percent)}`}>
                            {domain.percent >= 80 ? <UiText text={"Strong"} /> : domain.percent >= 50 ? <UiText text={"Developing"} /> : <UiText text={"Focus area"} />}
                          </span>
                        </div>
                        <p><UiText text={domain.guidance} /></p>
                        <button
                          type="button"
                          className="srx-domain-cta"
                          onClick={() => showReview(domain.key, domain.correct < domain.total ? 'missed' : 'all')}
                        >
                          {domain.correct < domain.total
                            ? <UiText text={"Review {{value1}} missed"} values={{ value1: String(domain.total - domain.correct) }} />
                            : <UiText text={"Review answers"} />}
                          <ArrowRight size={15} />
                        </button>
                      </article>
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
              <p className="sr-eyebrow"><UiText text={"From answer to understanding"} /></p>
              <h2><UiText text={"Question Review"} /></h2>
              <p><UiText text={"Your answer, the correct answer and a full explanation for every question."} /></p>
            </div>
            <div className="srx-review-controls">
              {sections.length > 1 && (
                <div className="srx-segment" role="group" aria-label={uiCopy("Section")}>
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
                      onClick={() => setSectionFilter(value)}
                    >
                      <UiText text={label} />
                    </button>
                  ))}
                </div>
              )}
              <div className="srx-status-chips" role="group" aria-label={uiCopy("Filter by outcome")}>
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
                    <UiText text={label} />
                    <span>{allQuestions.filter((q) => matches(q, value, moduleFilter, domainFilter)).length}</span>
                  </button>
                ))}
              </div>
              {(domainFilter || moduleFilter !== 'all') && (
                <button type="button" className="srx-clear-filter" onClick={() => chooseFilter(filter, 'all', null)}>
                  {domainFilter ? domains.find((d) => d.key === domainFilter)?.domain : <UiText text={"Module filter"} />}
                  <X size={13} />
                </button>
              )}
            </div>
            {filteredQuestions.length ? (
              <ol className="sr-card srx-question-list" aria-label={uiCopy("Questions")}>
                {filteredQuestions.map((question) => {
                  const module = modules.find((m) => m.id === question.moduleId)
                  const outcome = satAnswerStatus(question, attempt)
                  const response = attempt.answers[question.id]?.trim()
                  return (
                    <li key={question.id} className={`srx-q-row srx-row-${outcome}`} data-question-id={question.id}>
                      <div className="srx-q-id">
                        <span className={`srx-chip ${question.section === 'math' ? 'is-math' : ''}`}>
                          {moduleChip(module, bank)}
                        </span>
                        <strong>
                          <UiText text={"Question"} /> {question.number}
                          {attempt.flagged.includes(question.id) && (
                            <Flag size={12} aria-label={uiCopy("Flagged")} className="srx-flag" />
                          )}
                        </strong>
                      </div>
                      <div className="srx-q-answer">
                        <span><UiText text={"Your Answer"} /></span>
                        <b className={`tone-${outcome}`}>{response || <UiText text={"Unanswered"} />}</b>
                      </div>
                      <div className="srx-q-answer">
                        <span><UiText text={"Correct Answer"} /></span>
                        <b className="tone-correct">{question.correctAnswer}</b>
                      </div>
                      <button
                        type="button"
                        className="srx-review-button"
                        aria-label={uiCopy("Review {{value1}} question {{value2}}", { value1: String(module?.shortTitle ?? ''), value2: String(question.number) })}
                        onClick={() => openQuestion(question.id)}
                      >
                        <UiText text={"Review"} />
                        <ChevronRight size={15} />
                      </button>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <div className="sr-card srx-empty">
                <BookOpenCheck size={30} />
                <h3><UiText text={"No questions match these filters."} /></h3>
                <button
                  type="button"
                  className="sr-button"
                  onClick={() => {
                    setSectionFilter('all')
                    chooseFilter('all', 'all', null)
                  }}
                >
                  <UiText text={"Show all questions"} />
                </button>
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
              <p className="sr-eyebrow"><UiText text={"Test-day ranking"} /></p>
              <h2><UiText text={"Leaderboard"} /></h2>
              <p><UiText text={"See how your first attempt compares with every learner who took"} /> {test.title}.</p>
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
              <p className="sr-eyebrow"><UiText text={"Learn together"} /></p>
              <h2><UiText text={"Discussion"} /></h2>
              <p><UiText text={"Ask about a question, share a strategy, or help someone who is stuck."} /></p>
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

        {modal && (
          <SATQuestionModal
            questions={modal.questions}
            index={modal.index}
            attempt={attempt}
            modules={modules}
            onIndexChange={(index) => setModal((current) => (current ? { ...current, index } : current))}
            onClose={() => setModal(null)}
            onDiscuss={bank ? undefined : discussQuestion}
          />
        )}

      </div>
    </main>
  )
}
