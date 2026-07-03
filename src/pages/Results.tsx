import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Eye,
  EyeOff,
  Home,
  RotateCcw,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react'

import { AnimatedBackground } from '@/components/AnimatedBackground'
import { Burst, CountUp, ProgressRing, Reveal } from '@/components/fx'
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
import { saveReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import {
  firstQuestionNumber,
  formatCorrectAnswer,
  formatUserAnswer,
  questionStatusBadge,
} from '@/utils/readingReview'

type ResultLocationState = {
  result?: TestResult
  test?: IELTSTest
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
  const location = useLocation()
  const navigate = useNavigate()
  const authUser = useAuthStore((state) => state.user)
  const { result, test } = (location.state as ResultLocationState) || {}

  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)

  const hasPayload = Boolean(result && test)
  const resolvedTestId = result?.testId ?? test?.id ?? ''

  const allSections = useMemo(
    () => (hasPayload ? (((test as IELTSTest).sections as Section[]) ?? []) : []),
    [hasPayload, test],
  )
  const activeSectionIds = result?.detailedBreakdown?.activeSectionIds
  const activeSections = useMemo(
    () => allSections.filter((section) => !activeSectionIds || activeSectionIds.includes(section.id)),
    [allSections, activeSectionIds],
  )

  const analysis = useMemo(() => {
    if (!result || !test) return EMPTY_ANALYSIS
    return result.detailedBreakdown?.readingAnalysis ?? evaluateReadingAnswers(activeSections, result.answers)
  }, [activeSections, result, test])

  const bandScore = calculateBandScore(analysis.summary.correctAnswers)
  const effectiveBandScore = Number((result?.score && result.score > 0 ? result.score : bandScore).toFixed(1))

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

  const rowOne = useMemo(() => flatQuestionResults.filter((item) => firstQuestionNumber(item.displayNumber) <= 20), [flatQuestionResults])
  const rowTwo = useMemo(() => flatQuestionResults.filter((item) => firstQuestionNumber(item.displayNumber) >= 21), [flatQuestionResults])

  useEffect(() => {
    if (!result || !test) return

    const focusAreas = analysis.typeInsights
      .filter((issue) => issue.incorrectAnswers > 0)
      .slice(0, 4)
      .map((issue) => ({ label: issue.label, incorrectAnswers: issue.incorrectAnswers, accuracy: issue.accuracy }))

    const persistedResultPayload: TestResult = {
      ...result,
      detailedBreakdown: {
        activeSectionIds: result.detailedBreakdown?.activeSectionIds ?? activeSections.map((section) => section.id),
        readingAnalysis: analysis,
      },
    }

    saveReadingAnalysisHistory({
      userId: authUser?.id,
      attemptKey: `${result.testId}-${result.date}`,
      savedAt: result.date,
      testId: result.testId,
      testTitle: test.title,
      score: result.score,
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
    if (window.localStorage.getItem(syncKey) === 'ok') return

    const syncAttempt = async () => {
      try {
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
        })
        window.localStorage.setItem(syncKey, 'ok')
        window.dispatchEvent(new CustomEvent('smarttest:attempt-submitted'))
      } catch {
        // silent fallback: local review remains available even if backend sync is unavailable
      }
    }

    void syncAttempt()
  }, [analysis.summary.accuracy, analysis.summary.correctAnswers, analysis.summary.totalQuestions, authUser?.id, result, test])

  const startRetake = () => {
    if (!resolvedTestId) return
    navigate(`/test/reading/${resolvedTestId}`)
  }

  const activateFullReview = () => {
    if (!resolvedTestId) return
    navigate(`/test/reading/${resolvedTestId}`, {
      state: {
        reviewPayload: {
          result,
          showCorrectAnswers,
        },
        sourceTest: test,
        fromResults: true,
      },
    })
  }

  if (!result || !test) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(155deg,#fff_0%,#fff5f5_55%,#fffaf8_100%)] px-4 py-8">
        <AnimatedBackground />
        <div className="relative z-10 w-full max-w-lg rounded-3xl border border-red-200 bg-white/95 p-8 text-center shadow-[0_24px_52px_rgba(220,38,38,0.16)]">
          <h1 className="text-3xl font-black text-slate-900">No Results Found</h1>
          <p className="mt-2 text-sm text-slate-600">Open the reading test and submit at least one attempt.</p>
          <Link to="/ielts" className="arena-primary-btn mt-6">
            Return to IELTS
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(155deg,#fff_0%,#fff8f8_55%,#fffdfc_100%)]">
      <AnimatedBackground />
      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-red-100 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/ielts')}
                className="premium-back-btn-sm normal-case tracking-normal text-slate-700"
              >
                <ArrowLeft className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-slate-700">Back</span>
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-600">Result Studio</p>
                <h1 className="text-lg font-black text-slate-900">IELTS Reading Result</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 pb-12 sm:px-6">
          <Reveal>
          <section className="relative premium-hero p-6 sm:p-8">
            <Burst count={24} play={analysis.summary.accuracy >= 80} />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="premium-top-chip">
                  Unified Result Flow
                </span>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  {test.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Completed{' '}
                  {new Date(result.date).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Open Access
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  Time spent {formatSpentTime(result.timeSpent)}
                </span>
                {!result.isPartial ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Full submit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    Partial submit
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {/* Certificate-style band ring (concept: 16-Mock-Result) */}
              <div className="hero-metric-card flex flex-col items-center justify-center py-3">
                <ProgressRing value={(Math.max(0, Math.min(9, effectiveBandScore)) / 9) * 100} size={104} stroke={10}>
                  <div className="text-center">
                    <p className="text-2xl font-black leading-none text-slate-900">
                      <CountUp value={effectiveBandScore} decimals={1} />
                    </p>
                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-red-600">Band</p>
                  </div>
                </ProgressRing>
                <p className="hero-metric-note mt-1.5">Estimated score</p>
              </div>
              <div className="hero-metric-card">
                <p className="hero-metric-label">Accuracy</p>
                <p className="hero-metric-value-sm">
                  <CountUp value={analysis.summary.accuracy} suffix="%" />
                </p>
                <p className="hero-metric-note">Overall precision</p>
              </div>
              <div className="hero-metric-card">
                <p className="hero-metric-label">Correct</p>
                <p className="hero-metric-value-sm">
                  <CountUp value={analysis.summary.correctAnswers} />
                </p>
                <p className="hero-metric-note">Right answers</p>
              </div>
              <div className="hero-metric-card">
                <p className="hero-metric-label">Incorrect</p>
                <p className="hero-metric-value-sm">
                  <CountUp value={analysis.summary.incorrectAnswers} />
                </p>
                <p className="hero-metric-note">Need correction</p>
              </div>
              <div className="hero-metric-card">
                <p className="hero-metric-label">Skipped</p>
                <p className="hero-metric-value-sm">
                  <CountUp value={analysis.summary.skippedAnswers} />
                </p>
                <p className="hero-metric-note">Unanswered</p>
              </div>
            </div>
          </section>
          </Reveal>

          <section className="mt-5 surface-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Answer Sheet</h3>
                <p className="text-sm text-slate-500">
                  Your answers and status only. Correct answers appear only when enabled.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCorrectAnswers((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  showCorrectAnswers
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {showCorrectAnswers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showCorrectAnswers ? 'Hide Correct Answers' : 'Show Correct Answers'}
              </button>
            </div>

            {[rowOne, rowTwo].map((row, rowIndex) => (
              <div key={`answer-row-${rowIndex}`} className="mb-3 last:mb-0 rounded-2xl border border-red-100 bg-white px-3 py-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                  {rowIndex === 0 ? 'Questions 1 - 20' : 'Questions 21 - 40'}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
                  {row.map((question) => {
                    const meta = questionMetaMap.get(question.questionId)
                    const userAnswer = formatUserAnswer(question.userAnswer, meta?.question.options)
                    const correctAnswer = formatCorrectAnswer(question.correctAnswer)
                    const statusBadge = questionStatusBadge(question.status)

                    const numberTone =
                      question.status === 'correct'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : question.status === 'incorrect'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'

                    return (
                      <article key={`sheet-${question.questionId}`} className="rounded-xl border border-red-100 bg-[#fffdfd] p-2.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-[10px] font-black ${numberTone}`}>
                            {question.displayNumber}
                          </span>
                          <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${statusBadge.tone}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-[11px] font-semibold text-slate-700" title={userAnswer}>
                          Your: {userAnswer}
                        </p>

                        {question.status !== 'correct' ? (
                          <p className="mt-0.5 text-[10px] font-semibold text-red-600">
                            {question.status === 'incorrect' ? 'Status: wrong' : 'Status: skipped'}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">Status: correct</p>
                        )}

                        {showCorrectAnswers && question.status !== 'correct' ? (
                          <p className="mt-0.5 truncate text-[10px] font-semibold text-emerald-700" title={correctAnswer}>
                            Correct: {correctAnswer}
                          </p>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </button>
            <button
              type="button"
              onClick={() => navigate('/ielts')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <BookOpen className="h-4 w-4" />
              Reading Tests
            </button>
            <button
              type="button"
              onClick={activateFullReview}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              <Target className="h-4 w-4" />
              Full Review
            </button>
            <button
              type="button"
              onClick={startRetake}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-gradient-to-r from-red-500 to-rose-500 px-3 py-2.5 text-sm font-bold text-white hover:from-red-400 hover:to-rose-400"
            >
              <RotateCcw className="h-4 w-4" />
              Re-Do Test
            </button>
          </section>

        </main>
      </div>
    </div>
  )
}



