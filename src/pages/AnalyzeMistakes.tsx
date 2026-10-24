import MistakeLabNavigation from '@/components/results/MistakeLabNavigation'
import FullMockAttemptHistory from '@/components/ielts/FullMockAttemptHistory'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { recoverSpeakingDayHistory } from '@/utils/speakingDayHistory'
import UiText from '@/components/common/UiText'
import '@/styles/mistake-labs.css'
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
  const analysis = test
    ? evaluateReadingAnswers(test.sections.filter(section => !sectionIds?.length || sectionIds.includes(section.id)), entry.resultPayload.answers)
    : null
  const summary = analysis?.summary ?? entry
  const band = analysis ? calculateBandScore(summary.correctAnswers, analysis.summary.totalQuestions - analysis.summary.skippedAnswers) : entry.bandScore
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
  const revision = useAccountDataRevision()
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
    recoverSpeakingDayHistory(user?.id ?? 'guest')
    setReadingHistory(getReadingAnalysisHistory(user?.id))
    setWritingHistory(getWritingAnalysisHistory(user?.id))
  }, [user?.id, revision])

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
      <div className="workspace-page mlab">
        <div className="mlab-shell">
        <Reveal>
        <section className="mlab-card mlab-hero">
          <div className="mlab-hero-top">
            <button type="button" onClick={() => navigate('/review-mistakes')} className="mlab-back">
              <ArrowLeft aria-hidden="true" /><UiText text="Review mistakes" />
            </button>
            <MistakeLabNavigation />
          </div>
          <div className="mlab-hero-body">
            <div>
              <span className="mlab-eyebrow">IELTS</span>
              <h1><UiText text="IELTS Mistake Lab" /></h1>
              <p><UiText text="Review Listening, Reading, Writing and Speaking feedback." /></p>
            </div>
            <span className="mlab-hero-mark" aria-hidden="true"><BrainCircuit /></span>
          </div>
        </section>
        </Reveal>
        <section className="mlab-stats">
          {[
            { label: 'Saved attempts', value: attempts.length.toString(), icon: CheckCircle2, text: false },
            { label: 'Reading accuracy', value: readingHistory.length ? `${insights.averageAccuracy.toFixed(0)}%` : '—', icon: Target, text: false },
            { label: 'Weakest area', value: insights.weakest, icon: TriangleAlert, text: true },
          ].map(({ label, value, icon: Icon, text }) => (
            <article key={label} className="mlab-card mlab-stat">
              <span className="mlab-stat-icon"><Icon aria-hidden="true" /></span>
              <div>
                <p className="mlab-stat-label"><UiText text={label} /></p>
                <p className={`mlab-stat-value${text ? ' is-text' : ''}`} title={value}>{value}</p>
              </div>
            </article>
          ))}
        </section>
        <FullMockAttemptHistory />
        <section className="mlab-card mlab-section">
          {error ? (
            <div className="mlab-alert mlab-gap-bottom">{error}</div>
          ) : null}

          <div className="mlab-insights">
            <article className="mlab-panel">
              <p className="mlab-panel-title">
                <BarChart3 aria-hidden="true" />
                <UiText text={"Accuracy by question type"} />
              </p>
              <p className="mlab-panel-note"><UiText text={"Aggregated from your saved Reading reviews."} /></p>
              {insights.focusAreas.length ? (
                <div className="mlab-focus-grid">
                  {insights.focusAreas.map((area) => (
                    <div key={area.label} className="mlab-focus">
                      <div className="mlab-focus-head">
                        <b>{area.label}</b>
                        <span>{area.accuracy.toFixed(0)}%</span>
                      </div>
                      <div className="mlab-meter">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(4, area.accuracy)}%` }}
                        />
                      </div>
                      <small>{area.incorrect} <UiText text={"recurring errors"} /></small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mlab-empty mlab-gap-top">
                  <span className="mlab-empty-icon"><BarChart3 aria-hidden="true" /></span>
                  <p><UiText text={"Finish an IELTS Reading test to unlock question-type analytics."} /></p>
                </div>
              )}
            </article>

            <aside className="mlab-priorities">
              <span className="mlab-eyebrow"><Sparkles size={14} aria-hidden="true" /><UiText text="Practice priorities" /></span>
              <h2><UiText text="What to work on next" /></h2>
              <p><UiText text="Based on your saved mistakes. Review a weak area, then practise Reading." /></p>
              {insights.focusAreas.length ? <ol className="mlab-priority-list">{insights.focusAreas.slice(0,3).map((area,index)=><li key={area.label}><span>{index+1}</span><div><strong>{area.label}</strong><small>{area.incorrect} <UiText text="recurring errors" /> · {area.accuracy.toFixed(0)}%</small></div></li>)}</ol> : <p><UiText text="Start with a Reading test to discover your practice priorities." /></p>}
              <div className="mlab-priorities-actions">
                <button type="button" className="mlab-button is-primary" onClick={() => navigate('/ielts/reading/tests')}><UiText text="Practice Reading" /><ExternalLink aria-hidden="true" /></button>
                {insights.latestReading && <button type="button" className="mlab-button" onClick={() => openReview(buildReadingAttempt(insights.latestReading!))}><UiText text="Review your answers" /></button>}
              </div>
            </aside>
          </div>

          {insights.latestReading?.incorrectQuestions.length ? (
            <section className="mlab-panel mlab-gap-top">
              <div className="mlab-section-head">
                <div>
                  <h2 className="mlab-panel-title"><UiText text={"Latest Reading answer review"} /></h2>
                  <p className="mlab-panel-note">{insights.latestReading.testTitle} <UiText text={"· incorrect and skipped answers"} /></p>
                </div>
                <button
                  type="button"
                  onClick={() => openReview(buildReadingAttempt(insights.latestReading!))}
                  className="mlab-button"
                >
                  <ExternalLink aria-hidden="true" />
                  <UiText text={"Open full review"} />
                </button>
              </div>
              <div className="mlab-list">
                {insights.latestReading.incorrectQuestions.slice(0, 5).map((question) => (
                  <div key={question.questionId} className="mlab-question">
                    <span><XCircle size={16} aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <p>Q{question.displayNumber}. {question.prompt}</p>
                      <small><UiText text={"Part"} /> {question.partNumber} · {question.typeLabel}</small>
                    </div>
                    <span className="mlab-chip is-accent"><UiText text={"Needs review"} /></span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </section>
        <section className="mlab-card mlab-section">
          <div className="mlab-section-head">
            <div>
              <span className="mlab-eyebrow"><Clock3 size={14} aria-hidden="true" />IELTS</span>
              <h2><UiText text="Your IELTS review queue" /></h2>
            </div>
            <button type="button" onClick={() => setConfirmState({ type: 'clear-all', backendCount: backendAttemptCount, localCount: localAttemptCount })} disabled={clearableAttemptCount === 0 || isClearingAll} className="mlab-button is-danger">
              <Trash2 aria-hidden="true" />{isClearingAll ? 'Clearing...' : `Clear All (${clearableAttemptCount})`}
            </button>
          </div>
          <div className="mlab-list">
            {loading ? (
              <div className="mlab-empty"><p><UiText text={"Loading attempts..."} /></p></div>
            ) : attempts.length === 0 ? (
              <div className="mlab-empty">
                <span className="mlab-empty-icon"><BrainCircuit aria-hidden="true" /></span>
                <p><UiText text={"No attempts found yet. Complete a test and submit to populate this page."} /></p>
              </div>
            ) : (
              attempts.map((attempt) => {
                const isDeleting = busyAttemptId === attempt.id

                return (
                  <article key={attempt.id} className="mlab-row">
                    <div className="mlab-row-main">
                      <div>
                        <p className="mlab-row-category">{attempt.category}</p>
                        <div className="mlab-row-title"><strong>{attempt.title}</strong></div>
                        <p className="mlab-row-meta">
                          <Clock3 aria-hidden="true" />
                          {new Date(attempt.savedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="mlab-row-actions">
                        <span className="mlab-chip is-accent">{attempt.score}</span>
                        <span className="mlab-chip">{attempt.accuracy}</span>
                        <span className="mlab-chip">{attempt.mistakes}</span>
                        <button
                          type="button"
                          onClick={() => openReview(attempt)}
                          disabled={!attempt.reviewable || isDeleting || isClearingAll}
                          className="mlab-button is-primary"
                        >
                          <ExternalLink aria-hidden="true" />
                          <UiText text={"Review"} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmState({ type: 'delete', attempt })}
                          disabled={isDeleting || isClearingAll}
                          className="mlab-button"
                        >
                          <Trash2 aria-hidden="true" />
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
