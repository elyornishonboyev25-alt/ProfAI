import { accountStorageFor } from '@/utils/accountStorage'
import UiText from '@/components/common/UiText'
import LeaderboardEligibilityNotice from '@/components/common/LeaderboardEligibilityNotice'
import { testReturnLabel, testReturnPath } from '@/utils/testNavigation'
import TestLeaderboard from '@/components/results/TestLeaderboard'
import { BrandLogo } from '@/components/brand/BrandLogo'
import '@/styles/ielts-results.css'
import ResultBoundary from '@/components/ielts/ResultBoundary'
import { downloadTestResult } from '@/utils/downloadTestResult'
import { waitForIeltsClassSync } from '@/features/learningCenter/ieltsResultSync'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Eye,
  EyeOff,
  RotateCcw,
  Share2,
  TriangleAlert,
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Download,
} from 'lucide-react'

import { AnimatedBackground } from '@/components/AnimatedBackground'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type {
  IELTSTest,
  ReadingAnalysisReport,
  Section,
  TestResult,
} from '@/types/ieltsTypes'
import {
  calculateBandScore,
  evaluateReadingAnswers,
  formatQuestionTypeLabel,
} from '@/utils/ieltsUtils'
import { getReadingAnalysisHistory, saveReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { loadReviewState, saveReviewState } from '@/utils/resultsReviewState'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { createSharedResult } from '@/lib/sharedResultsApi'
import { useToastStore } from '@/store/toastStore'
import {
  firstQuestionNumber,
  formatCorrectAnswer,
  formatUserAnswer,
  questionStatusBadge,
} from '@/utils/readingReview'

type ResultLocationState = {
  result?: TestResult
  test?: IELTSTest
  mock?: { id: string; section: string }
  from?: string
  returnTo?: string
}

const EMPTY_ANALYSIS: ReadingAnalysisReport = {
  generatedAt: '',
  summary: {
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    skippedAnswers: 0,
    accuracy: 0,
  },
  sectionSummaries: [],
  questionResults: [],
  locationInsights: [],
  typeInsights: [],
}

function formatSpentTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return 'N/A'
  const total = Math.max(0, Math.round(value))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`
  }

  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}

export default function Results() {
  return <ResultBoundary><ResultsContent /></ResultBoundary>
}

function ResultsContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { testId } = useParams<{ testId: string }>()
  const authUser = useAuthStore((state) => state.user)
  const state = (location.state as ResultLocationState) || {}
  const restored = useMemo(() => {
    if (state.result && state.test) return null
    const saved = testId ? loadReviewState(testId) : null
    if (saved) return saved
    try {
      const entry = getReadingAnalysisHistory(authUser?.id).find(item => item.testId === testId)
      return entry ? { result: entry.resultPayload } : null
    } catch { return null }
  }, [testId, authUser?.id, state.result, state.test])
  const result = state.result ?? restored?.result
  const storedTest = state.test ?? (restored && 'test' in restored ? restored.test : undefined)
  const { mock, from } = state
  const test = useMemo(() => storedTest?.module === 'Listening' || storedTest?.module === 'Reading' || !storedTest
    ? resolveIeltsTestById(result?.testId ?? testId ?? '', result) ?? storedTest
    : storedTest, [storedTest, result, testId])

  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)
  const [resultTab, setResultTab] = useState<'answers' | 'leaderboard'>('answers')
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all')
  const [sharingResult, setSharingResult] = useState(false)
  const pushToast = useToastStore((state) => state.pushToast)

  const hasPayload = Boolean(result && test)
  const resolvedTestId = result?.testId ?? test?.id ?? testId ?? ''
  const isListeningTest = `${resolvedTestId} ${test?.title ?? ''} ${test?.module ?? ''}`.toLowerCase().includes('listening')
  const testType = isListeningTest ? 'listening' : 'reading'
  const catalogPath = `/ielts/${testType}/tests`
  const backPath = testReturnPath(state, mock?.id ? `/mock/ielts/${mock.id}` : catalogPath)
  const backLabel = testReturnLabel(backPath, mock?.id ? 'Full Mock' : `${isListeningTest ? 'Listening' : 'Reading'} Tests`)
  const goBack = () => navigate(backPath, mock?.id ? { state: { from } } : undefined)

  const allSections = useMemo(
    () => (hasPayload ? (((test as IELTSTest).sections as Section[]) ?? []) : []),
    [hasPayload, test],
  )
  const activeSectionIds = result?.detailedBreakdown?.activeSectionIds
  const activeSections = useMemo(
    () => allSections.filter((section) => !activeSectionIds?.length || activeSectionIds.includes(section.id)),
    [allSections, activeSectionIds],
  )

  const analysis = useMemo(() => {
    if (!result || !test) return EMPTY_ANALYSIS
    return evaluateReadingAnswers(activeSections, result.answers)
  }, [activeSections, result, test])

  const answeredCount = analysis.summary.totalQuestions - analysis.summary.skippedAnswers
  const bandScore = calculateBandScore(analysis.summary.correctAnswers, answeredCount)
  const readingScoreChanged = !isListeningTest && result?.correctAnswers !== analysis.summary.correctAnswers
  const effectiveBandScore = Number((answeredCount > 0 && !isListeningTest && !readingScoreChanged && result?.score && result.score > 0 ? result.score : bandScore).toFixed(1))
  const reviewedResult = useMemo(() => result ? {
    ...result, score: effectiveBandScore,
    correctAnswers: analysis.summary.correctAnswers, totalQuestions: analysis.summary.totalQuestions,
  } : undefined, [result, effectiveBandScore, analysis.summary.correctAnswers, analysis.summary.totalQuestions])
  const questionMetaMap = useMemo(() => {
    const map = new Map<string, { question: Section['questions'][number]; section: Section }>()
    activeSections.forEach((section) => {
      section.questions.forEach((question) => map.set(question.id, { question, section }))
    })
    return map
  }, [activeSections])

  const flatQuestionResults = useMemo(
    () =>
      analysis.questionResults
        .slice()
        .sort((a, b) => firstQuestionNumber(a.displayNumber) - firstQuestionNumber(b.displayNumber)),
    [analysis.questionResults],
  )

  useEffect(() => {
    if (!result || !test) return

    const focusAreas = analysis.typeInsights
      .filter((issue) => issue.incorrectAnswers > 0)
      .slice(0, 4)
      .map((issue) => ({ label: issue.label, incorrectAnswers: issue.incorrectAnswers, accuracy: issue.accuracy }))

    const persistedResultPayload: TestResult = {
      ...result,
      ...(test.module === 'Listening' || test.module === 'Reading' ? {
        score: effectiveBandScore,
        correctAnswers: analysis.summary.correctAnswers,
        totalQuestions: analysis.summary.totalQuestions,
      } : {}),
      detailedBreakdown: {
        ...result.detailedBreakdown,
        activeSectionIds: result.detailedBreakdown?.activeSectionIds ?? activeSections.map((section) => section.id),
        readingAnalysis: analysis,
        paperSnapshot: test,
      },
    }

    saveReviewState(result.testId, { result: persistedResultPayload, test })
    try {
      saveReadingAnalysisHistory({
        userId: authUser?.id,
        attemptKey: `${result.testId}-${result.date}`,
        savedAt: result.date,
        testId: result.testId,
        testTitle: test.title,
        score: persistedResultPayload.score,
        bandScore: effectiveBandScore,
        isPartial: Boolean(result.isPartial),
        accuracy: analysis.summary.accuracy,
        correctAnswers: analysis.summary.correctAnswers,
        totalQuestions: analysis.summary.totalQuestions,
        incorrectAnswers: analysis.summary.incorrectAnswers,
        skippedAnswers: analysis.summary.skippedAnswers,
        timeSpent: result.timeSpent,
        sectionSummaries: analysis.sectionSummaries,
        focusAreas,
        incorrectQuestions: analysis.questionResults
          .filter((question) => question.status !== 'correct')
          .map((question) => ({
            questionId: question.questionId,
            displayNumber: question.displayNumber,
            partNumber: question.partNumber,
            prompt: question.prompt,
            paragraphLabel: question.paragraphLabel,
            location: question.location,
            typeLabel: formatQuestionTypeLabel(question.questionType),
          })),
        questionResults: analysis.questionResults,
        resultPayload: persistedResultPayload,
      })
    } catch { /* Saving history must never replace a completed result with an error page. */ }
  }, [activeSections, analysis, authUser?.id, effectiveBandScore, result, test])

  useEffect(() => {
    if (!result || !test) return
    if (result.isPartial) return
    if (result.leaderboardEligible === false) return
    if (typeof window === 'undefined') return

    const attemptKey = `${result.testId}-${result.date}`
    const moduleLabel = String(test.module ?? '').toLowerCase()
    const isListeningModule = moduleLabel.includes('listening')
    const syncScope = isListeningModule ? 'listening' : 'reading'
    const syncKey = `smarttest-${syncScope}-sync:${authUser?.id ?? 'guest'}:${attemptKey}`
    try {
      if (accountStorageFor(authUser?.id ?? 'guest').getItem(syncKey) === 'ok') return
    } catch { /* Still try the idempotent server sync without browser storage. */ }

    const syncAttempt = async () => {
      try {
        await waitForIeltsClassSync(result.testId, result.date)
        if (useAuthStore.getState().user?.id !== authUser?.id) return
        try {
          if (accountStorageFor(authUser?.id ?? 'guest').getItem(syncKey) === 'ok') return
        } catch { /* The server also deduplicates completed attempts. */ }
        await apiClient.post(isListeningModule ? '/tests/listening-sync' : '/tests/reading-sync', {
          externalAttemptKey: attemptKey,
          externalTestId: result.testId,
          title: test.title,
          completedAt: result.date,
          durationSec: Math.max(600, test.duration * 60),
          timeSpentSec: Math.max(60, Math.round(result.timeSpent || 0)),
          totalQuestions: analysis.summary.totalQuestions,
          correctAnswers: analysis.summary.correctAnswers,
          accuracy: analysis.summary.accuracy,
          finalScore: analysis.summary.accuracy,
          difficulty: 'HARD',
          isPartial: false,
          subjects: isListeningModule
            ? ['IELTS Listening', 'Listening', 'Audio', 'Comprehension']
            : ['IELTS Reading', 'Reading', 'Passage', 'Comprehension'],
        }, { expectedUserId: authUser?.id })
        accountStorageFor(authUser?.id ?? 'guest').setItem(syncKey, 'ok')
        window.dispatchEvent(new CustomEvent('smarttest:attempt-submitted'))
      } catch {
        // silent fallback: local review remains available even if backend sync is unavailable
      }
    }

    void syncAttempt()
  }, [analysis.summary.accuracy, analysis.summary.correctAnswers, analysis.summary.totalQuestions, authUser?.id, result, test])

  const startRetake = () => {
    if (!resolvedTestId) return
    navigate(`/test/${testType}/${resolvedTestId}`)
  }

  const activateFullReview = (initialQuestionId?: string) => {
    if (!resolvedTestId) return
    navigate(`/test/${testType}/${resolvedTestId}`, {
      state: {
        reviewPayload: {
          result: reviewedResult,
          showCorrectAnswers: Boolean(initialQuestionId) || showCorrectAnswers,
          initialQuestionId,
        },
        sourceTest: test,
        fromResults: true,
        resultBackTo: backPath,
        mock,
        from,
      },
    })
  }

  const shareResult = async () => {
    if (!result || !test || sharingResult) return
    setSharingResult(true)

    try {
      const attemptedAt = new Date(result.date)
      const response = await createSharedResult({
        attemptKey: `${result.testId}-${result.date}`,
        testId: result.testId,
        testTitle: test.title,
        attemptedAt: Number.isNaN(attemptedAt.getTime()) ? new Date().toISOString() : attemptedAt.toISOString(),
        bandScore: effectiveBandScore,
        accuracy: analysis.summary.accuracy,
        correctAnswers: analysis.summary.correctAnswers,
        incorrectAnswers: analysis.summary.incorrectAnswers,
        skippedAnswers: analysis.summary.skippedAnswers,
        totalQuestions: analysis.summary.totalQuestions,
        timeSpentSec: Math.max(0, Math.round(result.timeSpent || 0)),
        sectionSummaries: analysis.sectionSummaries.map((section) => ({
          title: section.sectionTitle,
          correctAnswers: section.correctAnswers,
          totalQuestions: section.totalQuestions,
          accuracy: section.accuracy,
        })),
        recommendations: [],
      })

      const url = new URL(response.path, window.location.origin).toString()
      const sharePayload = {
        title: `${test.title} result`,
        text: `IELTS Band ${effectiveBandScore.toFixed(1)} · ${analysis.summary.accuracy}% accuracy`,
        url,
      }

      if (navigator.share) {
        await navigator.share(sharePayload)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        pushToast({ type: 'success', title: 'Result link copied', message: 'Anyone with the link can open this result page.' })
      } else {
        throw new Error('Sharing is not supported by this browser.')
      }
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      pushToast({
        type: 'error',
        title: 'Result was not shared',
        message: shareError instanceof Error ? shareError.message : 'Please try again.',
      })
    } finally {
      setSharingResult(false)
    }
  }

  if (result && test && result.leaderboardEligible === false && result.eligibilityNoticeAcknowledged === false) {
    return <main className="exam-flow attempt-entry"><LeaderboardEligibilityNotice seconds={result.timeSpent}
      minimumSeconds={result.leaderboardMinimumSeconds ?? (result.totalQuestions >= 30 ? 1800 : 600)} onContinue={() => {
        const acknowledged = { ...result, eligibilityNoticeAcknowledged: true }
        saveReviewState(result.testId, { result: acknowledged, test })
        navigate(location.pathname + location.search + location.hash, { replace: true, state: { ...state, result: acknowledged, test, mock, from } })
      }} /></main>
  }

  if (!result || !test) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(155deg,#fff_0%,#fff5f5_55%,#fffaf8_100%)] px-4 py-8">
        <AnimatedBackground />
        <div className="relative z-10 w-full max-w-lg rounded-3xl border border-red-200 bg-white/95 p-8 text-center shadow-[0_24px_52px_rgba(220,38,38,0.16)]">
          <h1 className="text-3xl font-black text-slate-900"> <UiText text={"No Results Found"} /> </h1>
          <p className="mt-2 text-sm text-slate-600"> <UiText text={isListeningTest ? 'Open the listening test and submit at least one attempt.' : 'Open the reading test and submit at least one attempt.'} /> </p>
          <Link to={catalogPath} className="arena-primary-btn mt-6">
             <UiText text={isListeningTest ? 'Return to Listening Tests' : 'Return to Reading Tests'} /> </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="workspace-page ielts-results-page exam-flow">
      <div className="ir-shell">
        <header className="ir-topbar">
          <button type="button" onClick={goBack} className="flow-button ir-back"><ArrowLeft size={17} /><UiText text={backLabel} /></button>
          <BrandLogo height={34} />
          <button type="button" className="flow-button ir-download" onClick={() => downloadTestResult(reviewedResult ?? result)}><Download size={16} /><UiText text="Download result" /></button>
        </header>
        <section className="ir-glass ir-hero" aria-label="Test result">
          <div className="ir-hero-copy">
            <span className="ir-exam-label">IELTS {isListeningTest ? 'Listening' : 'Reading'}</span>
            <h1>{test.title.split(/\s+-\s+/, 2)[0]}</h1>
            {test.title.includes(' - ') && <p className="ir-paper-topics">{test.title.split(' - ').slice(1).join(' - ')}</p>}
            <div className="ir-meta"><span>{result.isPartial ? <TriangleAlert size={15} /> : <CheckCircle2 size={15} />}<UiText text={result.isPartial ? 'Partial submit' : 'Completed'} /></span><time dateTime={result.date}>{new Date(result.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div>
            <p className="ir-summary">{analysis.summary.correctAnswers} of {analysis.summary.totalQuestions} correct <span>&middot;</span> {Math.round(analysis.summary.accuracy)}% accuracy</p>
            <div className="ir-hero-actions"><button type="button" className="flow-button is-primary" onClick={() => activateFullReview()}><BookOpen size={17} /><UiText text="Full Review" /></button><button type="button" className="flow-button" onClick={startRetake}><RotateCcw size={16} /><UiText text="Re-Do Test" /></button></div>
          </div>
          <div className="ir-band" aria-label={`IELTS band ${effectiveBandScore.toFixed(1)}`}>
            <svg viewBox="0 0 180 180" aria-hidden="true"><circle className="ir-band-track" cx="90" cy="90" r="75" /><circle className="ir-band-progress" cx="90" cy="90" r="75" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - effectiveBandScore / 9 * 100} transform="rotate(-90 90 90)" /></svg>
            <div><small>IELTS band</small><strong>{effectiveBandScore.toFixed(1)}</strong><span>out of 9.0</span></div>
          </div>
        </section>
        <section className="ir-metrics" aria-label="Attempt summary">
          {[
            { label: 'Correct', value: analysis.summary.correctAnswers, icon: CheckCircle2, tone: 'correct', note: 'Right answers' },
            { label: 'Incorrect', value: analysis.summary.incorrectAnswers, icon: XCircle, tone: 'incorrect', note: 'Answers to review' },
            { label: 'Skipped', value: analysis.summary.skippedAnswers, icon: EyeOff, tone: 'skipped', note: 'Unanswered' },
            { label: 'Time spent', value: formatSpentTime(result.timeSpent), icon: Clock3, tone: 'time', note: 'Time on this attempt' },
          ].map(({ label, value, icon: Icon, tone, note }) => <article className={`ir-glass ir-metric is-${tone}`} key={label}><span className="ir-metric-icon"><Icon size={20} /></span><div><p><UiText text={label} /></p><strong>{value}</strong><small><UiText text={note} /></small></div></article>)}
        </section>
        <div className="ir-tabs" role="tablist" aria-label="Result views" onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 'answers' : event.key === 'End' ? 'leaderboard' : resultTab === 'answers' ? 'leaderboard' : 'answers'
          setResultTab(next); document.getElementById(`ielts-result-tab-${next}`)?.focus()
        }}>
          {([{ id: 'answers', label: 'Answer Sheet', icon: BookOpen }, { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }] as const).map(({ id, label, icon: Icon }) => <button key={id} id={`ielts-result-tab-${id}`} type="button" role="tab" aria-selected={resultTab === id} aria-controls={`ielts-result-panel-${id}`} tabIndex={resultTab === id ? 0 : -1} onClick={() => setResultTab(id)}><Icon size={18} /><UiText text={label} /></button>)}
        </div>
        {resultTab === 'answers' ? <section className="ir-glass ir-answers" role="tabpanel" id="ielts-result-panel-answers" aria-labelledby="ielts-result-tab-answers">
          <header className="ir-section-heading"><div><BookOpen size={22} /><h2><UiText text="Answer Sheet" /></h2></div><button type="button" className="flow-button" aria-pressed={showCorrectAnswers} onClick={() => setShowCorrectAnswers(value => !value)}>{showCorrectAnswers ? <EyeOff size={16} /> : <Eye size={16} />}<UiText text={showCorrectAnswers ? 'Hide Correct Answers' : 'Show Correct Answers'} /></button></header>
          <div className="ir-outcomes" role="group" aria-label="Filter answers">{(['all', 'correct', 'incorrect', 'skipped'] as const).map(status => <button type="button" key={status} aria-pressed={outcomeFilter === status} onClick={() => setOutcomeFilter(status)}>{status === 'all' ? 'All answers' : status === 'skipped' ? 'Skipped' : status === 'correct' ? 'Correct' : 'Incorrect'} <span>{status === 'all' ? flatQuestionResults.length : flatQuestionResults.filter(question => question.status === status).length}</span></button>)}</div>
          <div className={`ir-answer-groups${activeSections.length === 3 ? ' has-three-parts' : ''}${showCorrectAnswers ? ' shows-correct' : ''}`}>
            {activeSections.map((section, index) => {
              const sectionQuestions = flatQuestionResults.filter(question => questionMetaMap.get(question.questionId)?.section.id === section.id && (outcomeFilter === 'all' || question.status === outcomeFilter))
              if (!sectionQuestions.length) return null
              return <section className="ir-answer-group" key={section.id} aria-labelledby={`ir-part-${section.id}`}>
                <header className="ir-answer-group-heading"><h3 id={`ir-part-${section.id}`}>Part {sectionQuestions[0].partNumber ?? index + 1}</h3><p>{section.title}</p><span>{sectionQuestions.length}</span></header>
                <div className="ir-answer-columns" aria-hidden="true"><span>No.</span><span>Your answer</span>{showCorrectAnswers && <span>Correct answer</span>}<span>Status</span><span /></div>
                <div className="ir-answer-grid">{sectionQuestions.map(question => {
                  const meta = questionMetaMap.get(question.questionId)
                  const userAnswer = formatUserAnswer(question.userAnswer, meta?.question.options)
                  const status = questionStatusBadge(question.status)
                  const StatusIcon = question.status === 'correct' ? CheckCircle2 : question.status === 'incorrect' ? XCircle : EyeOff
                  return <button type="button" className={`ir-answer is-${question.status}`} key={question.questionId} onClick={() => activateFullReview(question.questionId)} aria-label={`Review question ${question.displayNumber} in ${isListeningTest ? 'listening' : 'passage'}`}>
                    <b className="ir-answer-number">{question.displayNumber}</b>
                    <span className="ir-answer-response"><span className="sr-only">Your answer: </span><strong>{question.status === 'skipped' ? <span className="ir-answer-unanswered">Unanswered</span> : userAnswer}</strong></span>
                    {showCorrectAnswers && <span className="ir-answer-correct"><span className="sr-only">Correct answer: </span><strong>{formatCorrectAnswer(question.correctAnswer)}</strong></span>}
                    <span className="ir-answer-status"><StatusIcon size={15} /><span>{status.label}</span></span>
                    <ChevronRight className="ir-answer-link" size={15} aria-hidden="true" />
                  </button>
                })}</div>
              </section>
            })}
          </div>
          {!flatQuestionResults.some(question => outcomeFilter === 'all' || question.status === outcomeFilter) && <p className="ir-empty">No answers match this filter.</p>}
        </section> : <section className="ir-glass ir-leaderboard-panel" role="tabpanel" id="ielts-result-panel-leaderboard" aria-labelledby="ielts-result-tab-leaderboard"><TestLeaderboard testId={resolvedTestId} title={test.title} eligible={!result.isPartial} /></section>}
        <footer className="ir-footer"><button type="button" className="flow-button" onClick={goBack}><ArrowLeft size={16} /><UiText text={backLabel} /></button><button type="button" className="flow-button" disabled={sharingResult} onClick={() => void shareResult()}><Share2 size={16} />{sharingResult ? 'Creating link…' : 'Share result'}</button></footer>
      </div>
    </main>
  )
}
