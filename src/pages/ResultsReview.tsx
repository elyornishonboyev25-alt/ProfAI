import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, RotateCcw } from 'lucide-react'

import type { IELTSTest, ReadingAnalysisReport, Section, TestResult } from '@/types/ieltsTypes'
import { useAuthStore } from '@/store/authStore'
import { evaluateReadingAnswers, formatQuestionTypeLabel } from '@/utils/ieltsUtils'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { loadReviewState, saveReviewState } from '@/utils/resultsReviewState'
import {
  firstQuestionNumber,
  formatCorrectAnswer,
  formatUserAnswer,
  questionCardTone,
  questionStatusBadge,
} from '@/utils/readingReview'

type ReviewLocationState = {
  result?: TestResult
  test?: IELTSTest
  initialPart?: number
  initialQuestionId?: string
  showCorrectAnswers?: boolean
}

type SelectedPart = number | 'all'

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

export default function ResultsReview() {
  const navigate = useNavigate()
  const location = useLocation()
  const { testId } = useParams<{ testId: string }>()
  const user = useAuthStore((state) => state.user)

  const state = (location.state as ReviewLocationState) || {}
  const sessionState = useMemo(() => (testId ? loadReviewState(testId) : null), [testId])
  const fallbackEntry = useMemo(
    () => getReadingAnalysisHistory(user?.id).find((entry) => entry.testId === testId),
    [testId, user?.id],
  )

  const result = state.result ?? sessionState?.result ?? fallbackEntry?.resultPayload
  const test =
    state.test ??
    sessionState?.test ??
    (fallbackEntry ? resolveIeltsTestById(fallbackEntry.testId) ?? undefined : undefined) ??
    (result ? resolveIeltsTestById(result.testId) ?? undefined : undefined)
  const resolvedTestId = result?.testId ?? test?.id ?? testId ?? ''

  const [showCorrectAnswers, setShowCorrectAnswers] = useState(Boolean(state.showCorrectAnswers))
  const [selectedPart, setSelectedPart] = useState<SelectedPart>(state.initialPart ?? 'all')
  const [focusedQuestionId, setFocusedQuestionId] = useState<string | null>(state.initialQuestionId ?? null)

  const allSections = useMemo(() => ((test?.sections as Section[]) ?? []), [test])
  const activeSectionIds = result?.detailedBreakdown?.activeSectionIds
  const activeSections = useMemo(
    () => allSections.filter((section) => !activeSectionIds || activeSectionIds.includes(section.id)),
    [allSections, activeSectionIds],
  )

  const analysis = useMemo(() => {
    if (!result || !test) return EMPTY_ANALYSIS
    return result.detailedBreakdown?.readingAnalysis ?? evaluateReadingAnswers(activeSections, result.answers)
  }, [activeSections, result, test])

  useEffect(() => {
    if (selectedPart === 'all') return
    const exists = analysis.sectionSummaries.some((summary) => summary.partNumber === selectedPart)
    if (!exists) setSelectedPart('all')
  }, [analysis.sectionSummaries, selectedPart])

  useEffect(() => {
    if (!resolvedTestId || !result || !test) return
    saveReviewState(resolvedTestId, { result, test })
  }, [resolvedTestId, result, test])

  const visibleQuestions = useMemo(
    () =>
      analysis.questionResults
        .filter((question) => selectedPart === 'all' || question.partNumber === selectedPart)
        .slice()
        .sort((a, b) => firstQuestionNumber(a.displayNumber) - firstQuestionNumber(b.displayNumber)),
    [analysis.questionResults, selectedPart],
  )

  useEffect(() => {
    if (!focusedQuestionId) return
    const exists = visibleQuestions.some((item) => item.questionId === focusedQuestionId)
    if (!exists) setFocusedQuestionId(null)
  }, [focusedQuestionId, visibleQuestions])

  const questionMetaMap = useMemo(() => {
    const map = new Map<string, Section['questions'][number]>()
    activeSections.forEach((section) => {
      section.questions.forEach((question) => map.set(question.id, question))
    })
    return map
  }, [activeSections])

  const selectedSummary = useMemo(() => {
    if (selectedPart === 'all') return analysis.summary

    const sectionSummary = analysis.sectionSummaries.find((item) => item.partNumber === selectedPart)
    if (!sectionSummary) return analysis.summary

    return {
      totalQuestions: sectionSummary.totalQuestions,
      correctAnswers: sectionSummary.correctAnswers,
      incorrectAnswers: sectionSummary.incorrectAnswers,
      skippedAnswers: sectionSummary.skippedAnswers,
      accuracy: sectionSummary.accuracy,
    }
  }, [analysis.sectionSummaries, analysis.summary, selectedPart])

  const goBackToResults = () => {
    if (result && test) {
      navigate(`/results/${resolvedTestId}`, { state: { result, test } })
      return
    }
    navigate('/ielts')
  }

  const startRetake = () => {
    if (!resolvedTestId) return
    navigate(`/test/reading/${resolvedTestId}`)
  }

  if (!result || !test) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(155deg,#fff_0%,#fff5f5_55%,#fffaf8_100%)] px-4">
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_20px_46px_rgba(220,38,38,0.16)]">
          <h1 className="text-3xl font-black text-slate-900">Review Data Not Found</h1>
          <p className="mt-2 text-sm text-slate-600">
            This attempt is not available right now. Open it from Results or Analyze Mistakes.
          </p>
          <button type="button"
            onClick={() => navigate('/ielts/reading/tests')}
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Back to Reading Tests
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(155deg,#fff_0%,#fff8f8_56%,#fffdfb_100%)]">
      <header className="sticky top-0 z-30 border-b border-red-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button"
              onClick={goBackToResults}
              className="premium-back-btn-sm normal-case tracking-normal text-slate-700"
            >
              Back to Results
            </button>
            <button type="button"
              onClick={() => navigate('/ielts')}
              className="premium-back-btn-sm normal-case tracking-normal text-slate-700"
            >
              Reading Catalog
            </button>
            <span className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-black tracking-wide text-white">
              FULL REVIEW
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button"
              onClick={() => setShowCorrectAnswers((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                showCorrectAnswers
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              {showCorrectAnswers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showCorrectAnswers ? 'Hide Correct Answers' : 'Show Correct Answers'}
            </button>
            <button type="button"
              onClick={startRetake}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              <RotateCcw className="h-4 w-4" />
              Re-Do Test
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 pb-8 sm:px-6">
        <section className="surface-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
                Worked Test Window
              </p>
              <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">{test.title}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {selectedPart === 'all' ? 'All parts' : `Part ${selectedPart}`} | Accuracy {selectedSummary.accuracy}%
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button"
                onClick={() => setSelectedPart('all')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                  selectedPart === 'all'
                    ? 'border-red-300 bg-red-100 text-red-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Parts
              </button>
              {analysis.sectionSummaries.map((summary) => (
                <button type="button"
                  key={`review-part-${summary.partNumber}`}
                  onClick={() => setSelectedPart(summary.partNumber)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    selectedPart === summary.partNumber
                      ? 'border-red-300 bg-red-100 text-red-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Part {summary.partNumber}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">Correct</p>
              <p className="mt-1 text-xl font-black text-emerald-700">{selectedSummary.correctAnswers}</p>
            </article>
            <article className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-700">Incorrect</p>
              <p className="mt-1 text-xl font-black text-red-700">{selectedSummary.incorrectAnswers}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Skipped</p>
              <p className="mt-1 text-xl font-black text-slate-700">{selectedSummary.skippedAnswers}</p>
            </article>
            <article className="rounded-xl border border-red-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-700">Questions</p>
              <p className="mt-1 text-xl font-black text-slate-900">{selectedSummary.totalQuestions}</p>
            </article>
          </div>
        </section>

        <section className="mt-4 surface-card p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Worked Questions ({visibleQuestions.length})
            </h2>
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              Red = incorrect, Green = correct
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleQuestions.map((question) => {
              const badge = questionStatusBadge(question.status)
              const sourceQuestion = questionMetaMap.get(question.questionId)
              const userAnswer = formatUserAnswer(question.userAnswer, sourceQuestion?.options)
              const correctAnswer = formatCorrectAnswer(question.correctAnswer)
              const isIncorrect = question.status === 'incorrect'
              const isCorrect = question.status === 'correct'
              const showCorrectAnswer = showCorrectAnswers && (isIncorrect || question.status === 'skipped')
              const numberTone = isCorrect
                ? 'bg-emerald-100 text-emerald-700'
                : isIncorrect
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-600'
              const answerTone = isCorrect
                ? 'text-emerald-700'
                : isIncorrect
                  ? 'text-red-700'
                  : 'text-slate-600'

              return (
                <article
                  key={`review-question-${question.questionId}`}
                  onClick={() => setFocusedQuestionId(question.questionId)}
                  className={`cursor-pointer rounded-xl border p-3 ${questionCardTone(question.status)} ${
                    focusedQuestionId === question.questionId ? 'ring-2 ring-red-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${numberTone}`}>
                        {question.displayNumber}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Part {question.partNumber}
                      </span>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.tone}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {formatQuestionTypeLabel(question.questionType)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{question.prompt}</p>
                  <p className={`mt-2 text-xs font-semibold ${answerTone}`}>Your answer: {userAnswer}</p>
                  {showCorrectAnswer ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">Correct answer: {correctAnswer}</p>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>

        <div className="mt-4">
          <button type="button"
            onClick={goBackToResults}
            className="premium-back-btn-sm normal-case tracking-normal text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Answer Sheet
          </button>
        </div>
      </main>
    </div>
  )
}

