import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock3, ExternalLink, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { saveReviewState } from '@/utils/resultsReviewState'
import WritingResultModal from '@/components/WritingResultModal'

type UnifiedAttempt = {
  id: string
  title: string
  category: string
  savedAt: string
  source: 'reading-local' | 'writing-local' | 'backend'
  score: string
  accuracy: string
  mistakes: string
  reviewable: boolean
  backendAttemptId?: string
  readingEntry?: ReadingAnalysisHistoryEntry
  writingEntry?: WritingAnalysisEntry
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
  return {
    id: `reading-${entry.attemptKey}`,
    title: entry.testTitle,
    category: 'IELTS Reading',
    savedAt: entry.savedAt,
    source: 'reading-local',
    score: entry.isPartial ? 'Partial' : `Band ${entry.bandScore.toFixed(1)}`,
    accuracy: `${entry.accuracy.toFixed(1)}%`,
    mistakes: `${entry.incorrectAnswers} incorrect | ${entry.skippedAnswers} skipped`,
    reviewable: Boolean(resolveIeltsTestById(entry.testId)),
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

  useEffect(() => {
    setReadingHistory(getReadingAnalysisHistory(user?.id))
    setWritingHistory(getWritingAnalysisHistory(user?.id))
  }, [user?.id])

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
    const backendAttempts = (overview?.recentAttempts ?? [])
      .filter((entry) => entry.test.category !== 'SAT')
      .map(buildBackendAttempt)

    return [...localReading, ...localWriting, ...backendAttempts]
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  }, [overview?.recentAttempts, readingHistory, writingHistory])

  const localAttemptCount = readingHistory.length + writingHistory.length
  const backendAttemptCount = (overview?.recentAttempts ?? []).filter((entry) => entry.test.category !== 'SAT').length
  const clearableAttemptCount = localAttemptCount + backendAttemptCount

  const openReview = (attempt: UnifiedAttempt) => {
    if (attempt.source === 'writing-local' && attempt.writingEntry) {
      setWritingModalEntry(attempt.writingEntry)
      return
    }

    if (attempt.source !== 'reading-local' || !attempt.readingEntry) return
    const resolvedTest = resolveIeltsTestById(attempt.readingEntry.testId)
    if (!resolvedTest) return

    saveReviewState(attempt.readingEntry.testId, {
      result: attempt.readingEntry.resultPayload,
      test: resolvedTest,
    })

    navigate(`/test/reading/${attempt.readingEntry.testId}`, {
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600">Delete Confirmation</p>
              <h3 className="mt-1 text-2xl font-black text-slate-900">Are you sure?</h3>
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
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(220,38,38,0.34)] hover:opacity-95"
            >
              Yes, Delete
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  ) : null

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Reveal>
        <section className="rounded-[2rem] border border-red-100 bg-white p-6 shadow-[0_24px_56px_rgba(220,38,38,0.12)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <button
                type="button"
                onClick={() => navigate('/ielts')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-red-700 hover:bg-red-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back To IELTS Prep
              </button>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600">Premium Lab</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">Analyze IELTS Mistakes</h1>
              <p className="mt-1 text-sm text-slate-600">
                Recent solved tests sorted by latest activity. Review IELTS Reading attempts and AI-evaluated Writing tasks in detail.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700">Saved Attempts</p>
                <p className="text-2xl font-black text-slate-900">{attempts.length}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    type: 'clear-all',
                    backendCount: backendAttemptCount,
                    localCount: localAttemptCount,
                  })
                }
                disabled={clearableAttemptCount === 0 || isClearingAll}
                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isClearingAll ? 'Clearing...' : `Clear All (${clearableAttemptCount})`}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="mt-5 space-y-2">
            {loading ? (
              <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm text-slate-500">Loading attempts...</div>
            ) : attempts.length === 0 ? (
              <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm text-slate-500">
                No attempts found yet. Complete a test and submit to populate this page.
              </div>
            ) : (
              attempts.map((attempt) => {
                const isDeleting = busyAttemptId === attempt.id

                return (
                  <article
                    key={attempt.id}
                    className="rounded-2xl border border-red-100 bg-white p-3 sm:p-4"
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
                          Review
                        </button>
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
        </Reveal>
      </div>

      {typeof document !== 'undefined' && confirmModal ? createPortal(confirmModal, document.body) : confirmModal}

      {writingModalEntry ? (
        <WritingResultModal entry={writingModalEntry} onClose={() => setWritingModalEntry(null)} />
      ) : null}
    </>
  )
}
