import MistakeLabNavigation from '@/components/results/MistakeLabNavigation'
import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  X,
  XCircle,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import type { ProfileOverview } from '@/types/platform'
import { Reveal } from '@/components/fx'
import {
  clearReadingAnalysisHistory,
  getReadingAnalysisHistory,
  removeReadingAnalysisAttempt,
  type ReadingAnalysisHistoryEntry,
} from '@/utils/readingAnalysisStorage'
import {
  clearWritingAnalysisHistory,
  getWritingAnalysisHistory,
  removeWritingAnalysisAttempt,
  type WritingAnalysisEntry,
} from '@/utils/writingAnalysisStorage'
import { resolveIeltsTestById } from '@/utils/ieltsTestCatalog'
import { calculateBandScore, evaluateReadingAnswers } from '@/utils/ieltsUtils'
import { saveReviewState } from '@/utils/resultsReviewState'
import WritingResultModal from '@/components/WritingResultModal'
import SpeakingResult from '@/components/speaking/SpeakingResult'
import { useSpeakingStore, type SpeakingSessionRecord } from '@/store/speakingStore'

type UnifiedAttempt = {
  id: string
  title: string
  category: string
  savedAt: string
  source: 'reading-local' | 'writing-local' | 'speaking-local' | 'backend'
  score: string
  accuracy: string
  mistakes: string
  reviewable: boolean
  backendAttemptId?: string
  readingEntry?: ReadingAnalysisHistoryEntry
  writingEntry?: WritingAnalysisEntry
  speakingEntry?: SpeakingSessionRecord
}

type ConfirmState =
  | {
      type: 'delete'
      attempt: UnifiedAttempt
    }
  | {
      type: 'clear-all'
      backendCount: number
      localCount: number
    }
  | null

function buildReadingAttempt(entry: ReadingAnalysisHistoryEntry): UnifiedAttempt {
  const test = resolveIeltsTestById(entry.testId, entry.resultPayload)
  const isListening = test?.module === 'Listening'
  const sectionIds = entry.resultPayload.detailedBreakdown?.activeSectionIds
  const analysis = isListening
    ? evaluateReadingAnswers(test.sections.filter(section => !sectionIds?.length || sectionIds.includes(section.id)), entry.resultPayload.answers)
    : null
  const summary = analysis?.summary ?? entry
  const band = analysis ? calculateBandScore(summary.correctAnswers) : entry.bandScore
  return {
    id: `reading-${entry.attemptKey}`,
    title: entry.testTitle,
    category: isListening ? 'IELTS Listening' : 'IELTS Reading',
    savedAt: entry.savedAt,
    source: 'reading-local',
    score: entry.isPartial ? 'Partial' : `Band ${band.toFixed(1)}`,
    accuracy: `${summary.accuracy.toFixed(1)}%`,
    mistakes: `${summary.incorrectAnswers} incorrect | ${summary.skippedAnswers} skipped`,
    reviewable: Boolean(test),
    readingEntry: entry,
  }
}

function buildWritingAttempt(entry: WritingAnalysisEntry): UnifiedAttempt {
  return {
    id: `writing-${entry.attemptKey}`,
    title: `IELTS Writing ${entry.testTitle}`,
    category: entry.taskType === 'task1' ? 'Task 1' : 'Task 2',
    savedAt: entry.savedAt,
    source: 'writing-local',
    score: `Band ${entry.overallBand.toFixed(1)}`,
    accuracy: `${entry.wordCount} words`,
    mistakes: `${entry.errors.length} fixes · +${entry.xpAwarded} XP`,
    reviewable: true,
    writingEntry: entry,
  }
}

function buildSpeakingAttempt(entry: SpeakingSessionRecord): UnifiedAttempt {
  return {
    id: `speaking-${entry.id}`,
    title: entry.modeLabel,
    category: 'IELTS Speaking',
    savedAt: entry.date,
    source: 'speaking-local',
    score: `Band ${entry.overallBand.toFixed(1)}`,
    accuracy: `${entry.wordCount} words`,
    mistakes: entry.evaluation ? `${entry.evaluation.improvementPriorities.length} priorities` : 'Summary saved',
    reviewable: Boolean(entry.evaluation),
    speakingEntry: entry,
  }
}

function buildBackendAttempt(entry: ProfileOverview['recentAttempts'][number]): UnifiedAttempt {
  return {
    id: `backend-${entry.id}`,
    title: entry.test.title,
    category: entry.test.category,
    savedAt: entry.completedAt,
    source: 'backend',
    score: `${entry.finalScore.toFixed(1)}%`,
    accuracy: `${entry.percentage.toFixed(1)}%`,
    mistakes: `+${entry.xpEarned} XP`,
    reviewable: false,
    backendAttemptId: entry.id,
  }
}

export default function AnalyzeMistakes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const writingTest = searchParams.get('writingTest')
  const user = useAuthStore((state: AuthState) => state.user)
  const [readingHistory, setReadingHistory] = useState<ReadingAnalysisHistoryEntry[]>([])
  const [writingHistory, setWritingHistory] = useState<WritingAnalysisEntry[]>([])
  const [overview, setOverview] = useState<ProfileOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyAttemptId, setBusyAttemptId] = useState<string | null>(null)
  const [isClearingAll, setIsClearingAll] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [writingModalEntry, setWritingModalEntry] = useState<WritingAnalysisEntry | null>(null)
  const [speakingModalEntry, setSpeakingModalEntry] = useState<SpeakingSessionRecord | null>(null)
  const speakingSessions = useSpeakingStore((state) => state.sessions)
  const removeSpeakingSession = useSpeakingStore((state) => state.removeSession)
  const userSpeakingSessions = useMemo(() => speakingSessions.filter((entry) => entry.userId === (user?.id ?? null) && entry.kind === 'examiner'), [speakingSessions, user?.id])

  useEffect(() => {
    setReadingHistory(getReadingAnalysisHistory(user?.id))
    setWritingHistory(getWritingAnalysisHistory(user?.id))
  }, [user?.id])

  useEffect(() => {
    if (!writingTest) return
    const match = writingHistory.find(entry => entry.testId === writingTest)
    if (match) setWritingModalEntry(match)
  }, [writingHistory, writingTest])

  useEffect(() => {
    let active = true

    if (!user) {
      setOverview(null)
      setError(null)
      setLoading(false)
      return () => {
        active = false
      }
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.get<ProfileOverview>('/profile/overview')
        if (!active) return
        setOverview(data)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load attempts history')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!confirmState || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirmState(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [confirmState])

  const attempts = useMemo(() => {
    const localReading = readingHistory.map(buildReadingAttempt)
    const localWriting = writingHistory.map(buildWritingAttempt)
    const localSpeaking = userSpeakingSessions.map(buildSpeakingAttempt)
    const backendAttempts = (overview?.recentAttempts ?? [])
      .filter((entry) => entry.test.category !== 'SAT')
      .map(buildBackendAttempt)

    return [...localReading, ...localWriting, ...localSpeaking, ...backendAttempts]
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  }, [overview?.recentAttempts, readingHistory, writingHistory, userSpeakingSessions])

  const localAttemptCount = readingHistory.length + writingHistory.length + userSpeakingSessions.length
  const backendAttemptCount = (overview?.recentAttempts ?? []).filter((entry) => entry.test.category !== 'SAT').length
  const clearableAttemptCount = localAttemptCount + backendAttemptCount

  const insights = useMemo(() => {
    const averageAccuracy =
      readingHistory.length > 0
        ? readingHistory.reduce((total, entry) => total + entry.accuracy, 0) / readingHistory.length
        : 0
    const focusMap = new Map<string, { incorrect: number; accuracyTotal: number; count: number }>()
    readingHistory.forEach((entry) => {
      entry.focusAreas.forEach((area) => {
        const current = focusMap.get(area.label) ?? { incorrect: 0, accuracyTotal: 0, count: 0 }
        current.incorrect += area.incorrectAnswers
        current.accuracyTotal += area.accuracy
        current.count += 1
        focusMap.set(area.label, current)
      })
    })
    const focusAreas = [...focusMap.entries()]
      .map(([label, value]) => ({
        label,
        incorrect: value.incorrect,
        accuracy: value.count ? value.accuracyTotal / value.count : 0,
      }))
      .sort((a, b) => b.incorrect - a.incorrect)
      .slice(0, 4)

    return {
      averageAccuracy,
      weakest: focusAreas[0]?.label ?? 'Complete a Reading test',
      focusAreas,
      latestReading: readingHistory[0] ?? null,
    }
  }, [readingHistory])

  const openReview = (attempt: UnifiedAttempt) => {
    if (attempt.source === 'speaking-local' && attempt.speakingEntry?.evaluation) {
      setSpeakingModalEntry(attempt.speakingEntry)
      return
    }
    if (attempt.source === 'writing-local' && attempt.writingEntry) {
      setWritingModalEntry(attempt.writingEntry)
      return
    }

    if (attempt.source !== 'reading-local' || !attempt.readingEntry) return
    const resolvedTest = resolveIeltsTestById(attempt.readingEntry.testId, attempt.readingEntry.resultPayload)
    if (!resolvedTest) return

    saveReviewState(attempt.readingEntry.testId, {
      result: attempt.readingEntry.resultPayload,
      test: resolvedTest,
    })

    navigate(`/test/${resolvedTest.module === 'Listening' ? 'listening' : 'reading'}/${attempt.readingEntry.testId}`, {
      state: {
        reviewPayload: {
          result: attempt.readingEntry.resultPayload,
          showCorrectAnswers: false,
        },
        sourceTest: resolvedTest,
        fromResults: true,
      },
    })
  }

  const removeBackendAttemptFromState = (attemptId: string) => {
    setOverview((current) => {
      if (!current) return current
      return {
        ...current,
        recentAttempts: current.recentAttempts.filter((entry) => entry.id !== attemptId),
      }
    })
  }

  const executeDeleteAttempt = async (attempt: UnifiedAttempt) => {
    setError(null)
    setBusyAttemptId(attempt.id)

    try {
      if (attempt.source === 'reading-local' && attempt.readingEntry) {
        const next = removeReadingAnalysisAttempt(attempt.readingEntry.attemptKey, user?.id)
        setReadingHistory(next)
        return
      }

      if (attempt.source === 'writing-local' && attempt.writingEntry) {
        const next = removeWritingAnalysisAttempt(attempt.writingEntry.attemptKey, user?.id)
        setWritingHistory(next)
        return
      }

      if (attempt.source === 'speaking-local' && attempt.speakingEntry) {
        removeSpeakingSession(attempt.speakingEntry.id)
        return
      }

      if (attempt.source === 'backend' && attempt.backendAttemptId) {
        await apiClient.delete(`/profile/attempts/${attempt.backendAttemptId}`)
        removeBackendAttemptFromState(attempt.backendAttemptId)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete attempt')
    } finally {
      setBusyAttemptId(null)
    }
  }

  const executeClearAll = async () => {
    if (clearableAttemptCount === 0 || isClearingAll) return

    setError(null)
    setIsClearingAll(true)

    try {
      if (localAttemptCount > 0) {
        clearReadingAnalysisHistory(user?.id)
        clearWritingAnalysisHistory(user?.id)
        userSpeakingSessions.forEach((entry) => removeSpeakingSession(entry.id))
        setReadingHistory([])
        setWritingHistory([])
      }

      const backendIds = (overview?.recentAttempts ?? [])
        .filter((entry) => entry.test.category !== 'SAT')
        .map((entry) => entry.id)
      if (backendIds.length > 0) {
        await Promise.all(backendIds.map((attemptId) => apiClient.delete(`/profile/attempts/${attemptId}`)))
        setOverview((current) =>
          current
            ? {
                ...current,
                recentAttempts: current.recentAttempts.filter((entry) => entry.test.category === 'SAT'),
              }
            : current,
        )
      }
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'Failed to clear attempts')
    } finally {
      setIsClearingAll(false)
    }
  }

  const confirmDelete = async () => {
    if (!confirmState) return

    if (confirmState.type === 'delete') {
      const selectedAttempt = confirmState.attempt
      setConfirmState(null)
      await executeDeleteAttempt(selectedAttempt)
      return
    }

    setConfirmState(null)
    await executeClearAll()
  }

  const confirmModal = confirmState ? (
    <div
      className="fixed inset-0 z-[260] bg-slate-950/55 px-4 py-6"
      onClick={() => setConfirmState(null)}
    >
      <div className="flex min-h-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-lg rounded-[1.8rem] border border-red-200/85 bg-white p-6 shadow-[0_34px_80px_rgba(15,23,42,0.32)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600"> <UiText text={"Delete Confirmation"} /> </p>
              <h3 className="mt-1 text-2xl font-black text-slate-900"> <UiText text={"Are you sure?"} /> </h3>
            </div>
            <button
              type="button"
              onClick={() => setConfirmState(null)}
              className="rounded-xl border border-red-100 bg-white p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm leading-6 text-slate-700">
            {confirmState.type === 'delete'
              ? 'This attempt will be permanently removed from Analyze Mistakes.'
              : `This will delete all saved attempts (${confirmState.backendCount} synced + ${confirmState.localCount} local).`}
          </p>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmState(null)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
               <UiText text={"Cancel"} /> </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(220,38,38,0.34)] hover:opacity-95"
            >
               <UiText text={"Yes, Delete"} /> </button>
          </div>
        </motion.div>
      </div>
    </div>
  ) : null

  return (
    <>
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-7 sm:px-6 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,#fff1f2_0%,#fffafa_52%,#fff3f4_100%)]" />
        <div className="relative mx-auto w-full max-w-6xl space-y-5">
        <MistakeLabNavigation />
        <Reveal>
        <section className="rounded-[2rem] border border-white/90 bg-white/78 p-6 shadow-[0_24px_60px_rgba(220,38,38,0.1)] backdrop-blur-2xl sm:p-8">
          <button type="button" onClick={() => navigate('/review-mistakes')} className="route-back-button">
            <ArrowLeft className="h-3.5 w-3.5" /><UiText text="Review mistakes" />
          </button>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">IELTS</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-950"><UiText text="IELTS Mistake Lab" /></h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600"><UiText text="Review Listening, Reading, Writing and Speaking feedback." /></p>
            </div>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-[0_14px_30px_rgba(220,38,38,.25)]"><BrainCircuit className="h-6 w-6" /></span>
          </div>
        </section>
        </Reveal>
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Saved attempts', value: attempts.length.toString(), icon: CheckCircle2 },
            { label: 'Reading accuracy', value: readingHistory.length ? `${insights.averageAccuracy.toFixed(0)}%` : '—', icon: Target },
            { label: 'Weakest area', value: insights.weakest, icon: TriangleAlert },
          ].map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-white bg-white/75 p-4 shadow-[0_12px_30px_rgba(220,38,38,.07)] backdrop-blur">
              <Icon className="h-4 w-4 text-red-600" />
              <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-400"><UiText text={label} /></p>
              <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
            </article>
          ))}
        </section>
        <section className="rounded-[2rem] border border-white/90 bg-white/78 p-5 shadow-[0_22px_55px_rgba(220,38,38,.08)] backdrop-blur-2xl sm:p-6">
          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
            <div className="space-y-4">
              <article className="rounded-2xl border border-slate-200 bg-white/88 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-black text-slate-950">
                      <BarChart3 className="h-4 w-4 text-red-600" />
                       <UiText text={"Accuracy by question type"} /> </p>
                    <p className="mt-1 text-xs text-slate-500"> <UiText text={"Aggregated from your saved Reading reviews."} /> </p>
                  </div>
                </div>
                {insights.focusAreas.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {insights.focusAreas.map((area) => (
                      <div key={area.label} className="rounded-xl border border-slate-100 bg-slate-50/75 p-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <b className="truncate text-slate-800">{area.label}</b>
                          <span className="font-black text-red-600">{area.accuracy.toFixed(0)}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(4, area.accuracy)}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-red-800 via-red-500 to-rose-400"
                          />
                        </div>
                        <p className="mt-1.5 text-[10px] font-bold text-slate-400">{area.incorrect}  <UiText text={"recurring errors"} /> </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500"> <UiText text={"Finish an IELTS Reading test to unlock question-type analytics."} /> </p>
                )}
              </article>
            </div>

            <aside className="practice-priorities">
              <span className="priority-eyebrow"><Sparkles size={15} /><UiText text="Practice priorities" /></span>
              <h2><UiText text="What to work on next" /></h2>
              <p><UiText text="Based on your saved mistakes. Review a weak area, then practise Reading." /></p>
              {insights.focusAreas.length ? <ol className="priority-list">{insights.focusAreas.slice(0,3).map((area,index)=><li key={area.label}><span>{index+1}</span><div><strong>{area.label}</strong><small>{area.incorrect} <UiText text="recurring errors" /> · {area.accuracy.toFixed(0)}%</small></div></li>)}</ol> : <p className="my-6"><UiText text="Start with a Reading test to discover your practice priorities." /></p>}
              <button className="liquid-button primary w-full mt-5" onClick={() => navigate('/ielts/reading/tests')}><UiText text="Practice Reading" /><ExternalLink size={15} /></button>
              {insights.latestReading && <button className="liquid-button secondary w-full mt-3" onClick={() => openReview(buildReadingAttempt(insights.latestReading!))}><UiText text="Review your answers" /></button>}
            </aside>
          </div>

          {insights.latestReading?.incorrectQuestions.length ? (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white/88 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-slate-950"> <UiText text={"Latest Reading answer review"} /> </h2>
                  <p className="mt-1 text-xs text-slate-500">{insights.latestReading.testTitle}  <UiText text={"· incorrect and skipped answers"} /> </p>
                </div>
                <button
                  onClick={() => openReview(buildReadingAttempt(insights.latestReading!))}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-black text-red-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                   <UiText text={"Open full review"} /> </button>
              </div>
              <div className="mt-4 space-y-2">
                {insights.latestReading.incorrectQuestions.slice(0, 5).map((question) => (
                  <div key={question.questionId} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <XCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-900">Q{question.displayNumber}. {question.prompt}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-500"> <UiText text={"Part"} /> {question.partNumber} · {question.typeLabel}</p>
                    </div>
                    <span className="rounded-full border border-red-200 bg-white px-2.5 py-1 text-[10px] font-black text-red-700"> <UiText text={"Needs review"} /> </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

        </section>
        <section className="rounded-[2rem] border border-white/90 bg-white/78 p-5 shadow-[0_22px_55px_rgba(220,38,38,.08)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950"><UiText text="Your IELTS review queue" /></h2>
            <button type="button" onClick={() => setConfirmState({ type: 'clear-all', backendCount: backendAttemptCount, localCount: localAttemptCount })} disabled={clearableAttemptCount === 0 || isClearingAll} className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45">
              <Trash2 className="h-3.5 w-3.5" />{isClearingAll ? 'Clearing...' : `Clear All (${clearableAttemptCount})`}
            </button>
          </div>
          <div className="mt-5 space-y-2.5">
            {loading ? (
              <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm text-slate-500"> <UiText text={"Loading attempts..."} /> </div>
            ) : attempts.length === 0 ? (
              <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm text-slate-500">
                 <UiText text={"No attempts found yet. Complete a test and submit to populate this page."} /> </div>
            ) : (
              attempts.map((attempt) => {
                const isDeleting = busyAttemptId === attempt.id

                return (
                  <article
                    key={attempt.id}
                    className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-600">{attempt.category}</p>
                        <h2 className="mt-1 text-base font-bold text-slate-900">{attempt.title}</h2>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          {new Date(attempt.savedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          {attempt.score}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {attempt.accuracy}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {attempt.mistakes}
                        </span>
                        <button
                          onClick={() => openReview(attempt)}
                          disabled={!attempt.reviewable || isDeleting || isClearingAll}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                           <UiText text={"Review"} /> </button>
                        <button
                          onClick={() => setConfirmState({ type: 'delete', attempt })}
                          disabled={isDeleting || isClearingAll}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
        </div>
      </div>

      {typeof document !== 'undefined' && confirmModal ? createPortal(confirmModal, document.body) : confirmModal}

      {writingModalEntry ? (
        <WritingResultModal entry={writingModalEntry} onClose={() => setWritingModalEntry(null)} />
      ) : null}

      {speakingModalEntry?.evaluation ? createPortal(
        <div className="fixed inset-0 z-[250] overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Speaking review">
          <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-white via-red-50 to-white py-6 shadow-2xl">
            <SpeakingResult evaluation={speakingModalEntry.evaluation} transcript={speakingModalEntry.transcript} modeLabel={speakingModalEntry.modeLabel} reviewMode onRetry={() => {}} onExit={() => setSpeakingModalEntry(null)} />
          </div>
        </div>, document.body) : null}
    </>
  )
}
