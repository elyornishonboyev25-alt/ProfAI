import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock3, AlertTriangle, Sparkles, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import type { SubmitAttemptResponse, TestDetails } from '@/types/platform'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useTestAttempts } from '@/hooks/useTestAttempts'
import { Skeleton } from '@/components/common/Skeleton'

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function LevelUpConfetti() {
  const pieces = Array.from({ length: 36 }).map((_, index) => ({
    id: index,
    left: (index * 100) / 36,
    color: ['#4F46E5', '#7C3AED', '#EC4899', '#14B8A6', '#F97316'][index % 5],
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: 260 + (piece.id % 3) * 20,
            x: (piece.id % 2 === 0 ? -1 : 1) * (20 + (piece.id % 5) * 12),
            opacity: 0,
            rotate: 320,
          }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: (piece.id % 8) * 0.03 }}
          className="absolute top-2 h-2.5 w-2.5 rounded-sm"
          style={{ left: `${piece.left}%`, backgroundColor: piece.color }}
        />
      ))}
    </div>
  )
}

export default function TestRunner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const authUser = useAuthStore((state: AuthState) => state.user)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const { increment: recordAttempt } = useTestAttempts()

  const [test, setTest] = useState<TestDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | null>>({})
  const [remainingSec, setRemainingSec] = useState(0)
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    const loadTest = async () => {
      if (!id) {
        setError('Test ID is missing')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const payload = await apiClient.get<{ test: TestDetails }>(`/tests/${id}`)
        if (!active) return

        const initialAnswers = Object.fromEntries(payload.test.questions.map((question) => [question.id, null]))
        setTest(payload.test)
        setAnswers(initialAnswers)
        setRemainingSec(payload.test.durationSec)
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load test')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadTest()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!test || result) return
    if (remainingSec <= 0) return

    const timer = window.setInterval(() => {
      setRemainingSec((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [remainingSec, result, test])

  useEffect(() => {
    if (remainingSec === 0 && test && !result && !loading) {
      pushToast({
        type: 'info',
        title: 'Time is up',
        message: 'Submit your attempt to receive scoring and XP.',
      })
    }
  }, [remainingSec, test, result, loading, pushToast])

  const answeredCount = useMemo(() => Object.values(answers).filter((value) => value !== null).length, [answers])

  const progressPercent = test ? (answeredCount / test.questions.length) * 100 : 0

  const submitAttempt = async () => {
    if (!test || !id) return

    setSubmitting(true)
    try {
      const timeSpentSec = Math.max(1, test.durationSec - remainingSec)
      const payload = await apiClient.post<SubmitAttemptResponse>(`/tests/${id}/submit`, {
        timeSpentSec,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      })

      setResult(payload)
      recordAttempt()
      updateUserProgress({
        xp: payload.totalXp ?? Math.max(0, (authUser?.xp ?? 0) + payload.xpEarned),
        level: payload.levelAfter,
        currentStreak: payload.currentStreak,
      })

      pushToast({
        type: 'success',
        title: 'Attempt submitted',
        message: `Score ${payload.finalScore.toFixed(1)}% | +${payload.xpEarned} XP`,
      })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smarttest:attempt-submitted'))
      }
    } catch (submitError) {
      pushToast({
        type: 'error',
        title: 'Submission failed',
        message: submitError instanceof Error ? submitError.message : 'Unable to submit attempt',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const reviewMap = useMemo(() => {
    if (!result) return new Map<string, { selectedOptionId: string | null; correctOptionId: string | null; isCorrect: boolean }>()

    return new Map(
      result.answerReview.map((answer) => [
        answer.questionId,
        {
          selectedOptionId: answer.selectedOptionId,
          correctOptionId: answer.correctOptionId,
          isCorrect: answer.isCorrect,
        },
      ]),
    )
  }, [result])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="mt-4 h-6 w-full" />
        <Skeleton className="mt-6 h-72 w-full" />
      </div>
    )
  }

  if (error || !test) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p>{error ?? 'Unable to load this test.'}</p>
          <button className="premium-back-btn mt-3" onClick={() => navigate('/test-preparation')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Test Preparation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(31,41,55,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1F2937]">{test.title}</h1>
            <p className="mt-1 text-sm text-[#6B7280]">{test.category} | {test.difficulty} | {test.questions.length} questions</p>
          </div>
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
            <Clock3 className="mr-2 h-4 w-4" />
            {formatClock(remainingSec)}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-[#6B7280]">
            <span>Progress</span>
            <span>{answeredCount}/{test.questions.length} answered</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
              className="h-2.5 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {test.questions.map((question, index) => {
          const review = reviewMap.get(question.id)

          return (
            <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_20px_rgba(31,41,55,0.06)]">
              <p className="text-sm font-semibold text-[#1F2937]">Q{index + 1}. {question.text}</p>
              <div className="mt-3 space-y-2">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.id
                  const isCorrectOption = review?.correctOptionId === option.id
                  const isSelectedWrong = review && selected && !review.isCorrect

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={Boolean(result)}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))
                      }
                      className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                        result
                          ? isCorrectOption
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : isSelectedWrong
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-slate-200 bg-white text-slate-700'
                          : selected
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50'
                      }`}
                    >
                      {option.text}
                    </button>
                  )
                })}
              </div>

              {result ? (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {review?.isCorrect ? (
                    <span className="inline-flex items-center text-green-700">
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-700">
                      <AlertTriangle className="mr-1 h-4 w-4" /> Incorrect
                    </span>
                  )}
                </div>
              ) : null}
            </article>
          )
        })}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(31,41,55,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#6B7280]">Submit your answers to compute weighted score, XP, and level progression.</p>
          <button
            disabled={submitting || Boolean(result)}
            onClick={() => void submitAttempt()}
            className="rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : result ? 'Submitted' : 'Submit Attempt'}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {result ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="relative mt-6 overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50 p-6"
          >
            {result.leveledUp ? <LevelUpConfetti /> : null}
            <div className="relative z-10">
              <h2 className="text-2xl font-semibold text-indigo-900">Attempt Results</h2>
              <p className="mt-2 text-sm text-indigo-800">
                Final Score <span className="font-bold">{result.finalScore.toFixed(1)}%</span> | XP Earned{' '}
                <span className="font-bold">+{result.xpEarned}</span>
              </p>
              <p className="mt-1 text-sm text-indigo-800">
                Correct {result.correctAnswers}/{result.totalQuestions} | Level {result.levelBefore} to {result.levelAfter}
              </p>

              {result.leveledUp ? (
                <p className="mt-3 inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                  <Sparkles className="mr-1.5 h-4 w-4" /> Level up unlocked
                </p>
              ) : null}

              {result.unlockedAchievements.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {result.unlockedAchievements.map((achievement) => (
                    <p key={achievement.id} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-800">
                      Achievement: <span className="font-semibold">{achievement.title}</span> (+{achievement.xpReward} XP)
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
