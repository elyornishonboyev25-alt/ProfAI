import { accountStorageFor } from '@/utils/accountStorage'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock3,
  Crown,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Monitor,
  PenLine,
  RotateCcw,
  Send,
  Target,
} from 'lucide-react'

import { AnimatedBackground } from '@/components/AnimatedBackground'
import TestLaunchOverlay from '@/components/common/TestLaunchOverlay'
import TestVocabulary from '@/components/vocab/TestVocabulary'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import WritingTaskDiagram from '@/components/writing/WritingTaskDiagram'
import WritingDataVisual from '@/components/writing/WritingDataVisual'
import WritingTaskImage from '@/components/writing/WritingTaskImage'
import type { WritingFullTest } from '@/data/writingTestData'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import { useFullscreen } from '@/hooks/useFullscreen'
import { markXpActivitySynced, recordXpActivity } from '@/lib/xpApi'
import { evaluateWriting, type WritingEvaluation } from '@/services/geminiAI'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useBadgeStore } from '@/store/badgeStore'
import { saveWritingAnalysis } from '@/utils/writingAnalysisStorage'
import { useSearchParams } from 'react-router-dom'
import { learningCenterApi } from '@/features/learningCenter/api'

type Props = {
  fullTest: WritingFullTest
  onExit: () => void
  onComplete?: (band: number, summary: string, review: { label: string; response: string; feedback?: string }[]) => void
  autoStart?: boolean
  autoTimerEnabled?: boolean
  autoDurationMinutes?: number
  inFullMock?: boolean
}

type Phase = 'landing' | 'writing' | 'submitted'

function countWords(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function weightedBand(evaluations: Record<string, WritingEvaluation>, taskIds: string[]): number {
  const task1 = evaluations[taskIds[0]]?.overallBand ?? 0
  const task2 = evaluations[taskIds[1]]?.overallBand ?? 0
  return Math.round(((task1 + task2 * 2) / 3) * 2) / 2
}

export default function IELTSWritingFullTestInterface({
  fullTest,
  onExit,
  onComplete,
  autoStart,
  autoTimerEnabled,
  autoDurationMinutes,
  inFullMock = false,
}: Props) {
  const [searchParams] = useSearchParams()
  const tasks = fullTest.tasks
  const defaultDuration = tasks.reduce((total, task) => total + task.durationMinutes, 0)
  const effectiveDuration =
    autoDurationMinutes && autoDurationMinutes > 0 ? autoDurationMinutes : defaultDuration

  const [phase, setPhase] = useState<Phase>('landing')
  const [activeTaskIndex, setActiveTaskIndex] = useState(0)
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(effectiveDuration * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(tasks.map((task) => [task.id, ''])),
  )
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [showWritingGate, setShowWritingGate] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<Record<string, WritingEvaluation>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const submittingRef = useRef(false)
  const autoSubmittedRef = useRef(false)
  const deadlineRef = useRef<number | null>(null)
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoStartHandled = useRef(false)

  const activeTask = tasks[activeTaskIndex]
  const activeAnswer = answers[activeTask.id] ?? ''
  const activeWordCount = countWords(activeAnswer)
  const wordCounts = useMemo(
    () => Object.fromEntries(tasks.map((task) => [task.id, countWords(answers[task.id] ?? '')])),
    [answers, tasks],
  )
  const totalWordCount = tasks.reduce((total, task) => total + wordCounts[task.id], 0)
  const hasDraft = Object.values(answers).some((answer) => answer.trim().length > 0)
  const user = useAuthStore((state: AuthState) => state.user)
  const draftKey = `profai:writing:draft:${user?.id ?? 'guest'}:${fullTest.id}`
  const sessionKey = `${draftKey}:session`
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const awardBadge = useBadgeStore((state) => state.awardIfEligible)
  const writingTrial = useFeatureTrial('writing')
  const setExamModeActive = useAiAssistantStore((state) => state.setExamModeActive)
  const { isFullscreen, supported: fullscreenSupported, toggle: toggleFullscreen } = useFullscreen()

  useEffect(() => {
    const active = phase === 'writing'
    setExamModeActive(active)
    return () => setExamModeActive(false)
  }, [phase, setExamModeActive])

  useEffect(() => {
    if (!showImagePreview) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowImagePreview(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showImagePreview])

  useEffect(() => {
    try {
      const saved = accountStorageFor(user?.id ?? 'guest').getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, unknown>
        setAnswers(Object.fromEntries(tasks.map((task) => [task.id, typeof parsed[task.id] === 'string' ? parsed[task.id] : ''])) as Record<string, string>)
      }
    } catch { /* Storage can be unavailable in private browsing. */ }
    try {
      const session = accountStorageFor(user?.id ?? 'guest').getItem(sessionKey)
      if (session) {
        const parsed = JSON.parse(session) as { timerEnabled?: boolean; deadline?: number | null }
        autoStartHandled.current = true
        const timed = parsed.timerEnabled === true && typeof parsed.deadline === 'number'
        deadlineRef.current = timed ? parsed.deadline! : null
        setTimerEnabled(timed)
        setTimeRemaining(timed ? Math.max(0, Math.ceil((parsed.deadline! - Date.now()) / 1000)) : effectiveDuration * 60)
        setIsTimerRunning(timed && parsed.deadline! > Date.now())
        setPhase('writing')
      }
    } catch { /* Start from the launch screen. */ }
  }, [draftKey, effectiveDuration, sessionKey, tasks])

  useEffect(() => {
    if (phase !== 'writing') return
    try { accountStorageFor(user?.id ?? 'guest').setItem(draftKey, JSON.stringify(answers)) } catch { /* Keep the in-memory draft. */ }
  }, [answers, draftKey, phase])

  useEffect(() => {
    if (!isTimerRunning || !timerEnabled) return
    const tick = () => {
      const remaining = Math.max(0, Math.ceil(((deadlineRef.current ?? Date.now()) - Date.now()) / 1000))
      setTimeRemaining(remaining)
      if (remaining === 0) setIsTimerRunning(false)
    }
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [isTimerRunning, timerEnabled])

  useEffect(
    () => () => {
      if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
    },
    [],
  )

  const handleStart = useCallback(
    (withTimer: boolean) => {
      setIsLaunching(true)
      if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
      launchTimerRef.current = setTimeout(() => {
        setTimerEnabled(withTimer)
        setTimeRemaining(effectiveDuration * 60)
        deadlineRef.current = withTimer ? Date.now() + effectiveDuration * 60_000 : null
        try { accountStorageFor(user?.id ?? 'guest').setItem(sessionKey, JSON.stringify({ timerEnabled: withTimer, deadline: deadlineRef.current })) } catch { /* In-memory session remains active. */ }
        autoSubmittedRef.current = false
        setIsTimerRunning(withTimer)
        setPhase('writing')
        setIsLaunching(false)
        launchTimerRef.current = null
        setTimeout(() => textareaRef.current?.focus(), 100)
      }, 1200)
    },
    [effectiveDuration, sessionKey],
  )

  useEffect(() => {
    if (autoStartHandled.current || !autoStart) return
    autoStartHandled.current = true
    handleStart(autoTimerEnabled ?? true)
  }, [autoStart, autoTimerEnabled, handleStart])

  const resetTest = useCallback(() => {
    setAnswers(Object.fromEntries(tasks.map((task) => [task.id, ''])))
    setBookmarks({})
    setEvaluations({})
    setEvalError(null)
    setActiveTaskIndex(0)
    setTimeRemaining(effectiveDuration * 60)
    setIsTimerRunning(false)
    setPhase('landing')
    autoSubmittedRef.current = false
    try { accountStorageFor(user?.id ?? 'guest').removeItem(draftKey) } catch { /* No persisted draft. */ }
    try { accountStorageFor(user?.id ?? 'guest').removeItem(sessionKey) } catch { /* No persisted session. */ }
  }, [draftKey, effectiveDuration, sessionKey, tasks])

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return
    if (writingTrial.locked && !inFullMock) {
      setShowSubmitConfirm(false)
      setShowWritingGate(true)
      return
    }

    submittingRef.current = true
    setShowSubmitConfirm(false)
    setIsTimerRunning(false)
    setPhase('submitted')
    setEvaluating(true)
    setEvalError(null)

    try {
      const results: WritingEvaluation[] = []
      for (const task of tasks) {
        results.push(await evaluateWriting(task.taskType, task.prompt, answers[task.id] ?? '', wordCounts[task.id], task.visualContext))
      }
      const resultMap = Object.fromEntries(tasks.map((task, index) => [task.id, results[index]]))
      setEvaluations(resultMap)
      try { accountStorageFor(user?.id ?? 'guest').removeItem(draftKey) } catch { /* Submission still succeeds. */ }
      try { accountStorageFor(user?.id ?? 'guest').removeItem(sessionKey) } catch { /* Submission still succeeds. */ }
      if (totalWordCount > 0 && !inFullMock) writingTrial.consume()

      const overallBand = weightedBand(resultMap, tasks.map((task) => task.id))
      if (tasks.some((task) => task.taskType === 'task1') && tasks.some((task) => task.taskType === 'task2') && timerEnabled) awardBadge({
        userId: user?.id ?? null,
        track: 'IELTS_WRITING',
        band: overallBand,
        mode: 'exam',
        source: 'ielts-writing-full',
      })

      const timeSpent = timerEnabled ? effectiveDuration * 60 - timeRemaining : 0
      const savedEntries = tasks.map((task, index) =>
        saveWritingAnalysis(
          user?.id,
          task.id,
          `${fullTest.title} · ${task.taskType === 'task1' ? 'Task 1' : 'Task 2'}`,
          task.taskType,
          wordCounts[task.id],
          timeSpent,
          timerEnabled,
          answers[task.id] ?? '',
          results[index],
          { id: fullTest.id, overallBand },
          task,
        ),
      )

      if (user && savedEntries[0]) {
        void learningCenterApi.syncResult({
          sourceKey: `writing-full-${fullTest.id}-${savedEntries[0].attemptKey}`,
          sourceType: 'IELTS_WRITING_FULL_TEST',
          examType: 'IELTS',
          skill: 'IELTS_WRITING',
          title: fullTest.title,
          score: overallBand,
          maxScore: 9,
          durationSec: timeSpent,
          completedAt: savedEntries[0].savedAt,
          assignmentId: searchParams.get('assignmentId') ?? undefined,
          breakdown: {
            wordCount: totalWordCount,
            tasks: tasks.map((task, index) => ({
              taskType: task.taskType,
              score: results[index].overallBand,
              taskAchievement: results[index].taskAchievement,
              coherenceCohesion: results[index].coherenceCohesion,
              lexicalResource: results[index].lexicalResource,
              grammaticalRange: results[index].grammaticalRange,
            })),
          },
        }).catch(() => {})
        void recordXpActivity({
          source: 'WRITING',
          eventKey: savedEntries[0].attemptKey,
          band: overallBand,
          durationSec: timeSpent,
          metadata: {
            testId: fullTest.id,
            taskType: 'full-test',
            band: overallBand,
            wordCount: totalWordCount,
          },
        })
          .then((reward) => {
            if (useAuthStore.getState().user?.id !== user.id) return
            markXpActivitySynced(user.id, savedEntries[0].attemptKey)
            updateUserProgress({ xp: reward.totalXp, level: reward.level })
          })
          .catch(() => {})
      }
      onComplete?.(
        overallBand,
        `Task 1: ${results[0]?.summary ?? ''} Task 2: ${results[1]?.summary ?? ''}`,
        tasks.map((task, index) => ({
          label: `Task ${index + 1}`,
          response: answers[task.id] ?? '',
          feedback: results[index]?.summary,
        })),
      )
    } catch (error) {
      setEvalError(error instanceof Error ? error.message : 'AI evaluation failed. Please try again.')
    } finally {
      submittingRef.current = false
      setEvaluating(false)
    }
  }, [
    answers,
    awardBadge,
    draftKey,
    sessionKey,
    effectiveDuration,
    inFullMock,
    onComplete,
    fullTest.id,
    fullTest.title,
    searchParams,
    tasks,
    timeRemaining,
    timerEnabled,
    totalWordCount,
    updateUserProgress,
    user,
    wordCounts,
    writingTrial,
  ])

  useEffect(() => {
    if (phase === 'writing' && timerEnabled && timeRemaining === 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      void handleSubmit()
    }
  }, [handleSubmit, phase, timeRemaining, timerEnabled])

  if (phase === 'landing') {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)] p-6">
        <AnimatedBackground />
        <AnimatePresence>
          {isLaunching ? (
            <TestLaunchOverlay
              title="Your full test will begin shortly"
              subtitle="Preparing Task 1 and Task 2"
            />
          ) : null}
        </AnimatePresence>
        <div className="relative z-10 w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
            <h1 className="mb-6 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 bg-clip-text text-5xl font-black tracking-tight text-transparent lg:text-6xl">
              {fullTest.title}
            </h1>
            <p className="mx-auto max-w-2xl text-lg font-light italic text-slate-600">
              Experience the authentic IELTS Computer-Delivered environment with ProfAI precision.
            </p>
          </motion.div>

          {!inFullMock ? <TestVocabulary testId={fullTest.id} variant="reminder" /> : null}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <ModeCard
              icon={<Lightbulb className="h-8 w-8" />}
              title="Practice Mode"
              eyebrow="Casual Learning"
              description="Write at your own pace without time pressure. Perfect for learning structure and vocabulary."
              features={['Unlimited writing time', 'Task 1: 150+ words · Task 2: 250+ words']}
              buttonLabel="Start Practice"
              vocabularyTestId={!inFullMock ? fullTest.id : undefined}
              onClick={() => handleStart(false)}
            />
            <ModeCard
              icon={<Monitor className="h-8 w-8" />}
              title="Simulation Mode"
              eyebrow="Exam Simulation"
              description="Authentic IELTS CD environment. Replicates the high-pressure conditions of the real exam with strict timing and official layout standards."
              features={[`Strict ${effectiveDuration}-minute limit across both tasks`, 'IELTS Writing band scoring']}
              buttonLabel="Launch Final Simulation"
              simulation
              onClick={() => handleStart(true)}
            />
          </div>

          <motion.div className="mt-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <button type="button" onClick={onExit} className="mx-auto flex items-center gap-2 rounded-full border border-white/5 px-6 py-2 text-sm text-slate-500 transition-colors hover:bg-white/5 hover:text-red-600">
              <ArrowLeft className="h-4 w-4" /> Return to Writing Tests
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (phase === 'submitted') {
    if (evaluating) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)] p-6">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-9 text-center shadow-[0_30px_70px_rgba(220,38,38,0.18)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-900">Analyzing both responses</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Task 1 and Task 2 are being scored separately, then combined using IELTS Writing weighting.</p>
          </motion.div>
        </div>
      )
    }

    if (evalError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-red-50 p-6">
          <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-2xl font-black text-slate-900">Evaluation failed</h2>
            <p className="mt-2 text-sm text-slate-600">{evalError}</p>
            <div className="mt-6 flex justify-center gap-2">
              <button type="button" onClick={() => void handleSubmit()} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Retry</button>
              <button type="button" onClick={() => setPhase('writing')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Back to editing</button>
            </div>
          </div>
        </div>
      )
    }

    const overallBand = weightedBand(evaluations, tasks.map((task) => task.id))
    return (
      <div className="workspace-page ielts-writing-review min-h-screen px-4 py-6 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={onExit} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
              <ArrowLeft className="h-4 w-4" /> Back to Tests
            </button>
            <button type="button" onClick={resetTest} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/20">
              <RotateCcw className="h-4 w-4" /> Try Again
            </button>
          </div>

          <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Full test completed
                </span>
                <h1 className="mt-3 text-3xl font-black text-slate-900">Estimated Overall Band {overallBand.toFixed(1)}</h1>
                <p className="mt-1 text-sm text-slate-500">Task 2 carries twice the weight of Task 1. This AI estimate is not an official IELTS result.</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 px-6 py-4 text-center text-white shadow-lg shadow-red-500/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-100">Total words</p>
                <p className="text-3xl font-black">{totalWordCount}</p>
              </div>
            </div>
          </div>

          {!inFullMock ? <TestVocabulary testId={fullTest.id} variant="review" /> : null}
          <div className="mt-5 space-y-5">
            {tasks.map((task, index) => {
              const evaluation = evaluations[task.id]
              if (!evaluation) return null
              return (
                <section key={task.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-500">Task {index + 1}</p>
                      <h2 className="mt-1 text-xl font-black text-slate-900">Band {evaluation.overallBand.toFixed(1)}</h2>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{evaluation.summary}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">{wordCounts[task.id]} words</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Score label="Task Response" value={evaluation.taskAchievement} />
                    <Score label="Coherence" value={evaluation.coherenceCohesion} />
                    <Score label="Vocabulary" value={evaluation.lexicalResource} />
                    <Score label="Grammar" value={evaluation.grammaticalRange} />
                  </div>
                  {task.diagram ? (
                    <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-800">Review Task 1 chart</summary>
                      <div className="mx-auto mt-4 max-w-[650px]"><WritingTaskDiagram diagram={task.diagram} /></div>
                    </details>
                  ) : null}
                  {task.visual ? (
                    <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-800">Review Task 1 data</summary>
                      <div className="mx-auto mt-4 max-w-[750px]"><WritingDataVisual visual={task.visual} /></div>
                    </details>
                  ) : null}
                  {task.imageUrl ? (
                    <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-800">Review task visual</summary>
                      <WritingTaskImage task={task} className="mx-auto mt-4 h-auto max-w-full object-contain" />
                    </details>
                  ) : null}
                  <details className="mt-4 rounded-2xl border border-red-100 bg-red-50/30 p-4">
                    <summary className="cursor-pointer text-sm font-bold text-slate-800">Task prompt</summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{task.promptLead ?? task.prompt}</p>
                    {task.promptQuestion ? <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-6 text-slate-800">{task.promptQuestion}</p> : null}
                  </details>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <FeedbackList title="Strengths" items={evaluation.strengths} tone="emerald" />
                    <FeedbackList title="Improve next" items={evaluation.improvements} tone="amber" />
                  </div>
                  {evaluation.errors.length > 0 ? (
                    <details className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-800">Corrections ({evaluation.errors.length})</summary>
                      <div className="mt-4 space-y-3">
                        {evaluation.errors.map((error, errorIndex) => (
                          <div key={`${task.id}-error-${errorIndex}`} className="rounded-xl border border-amber-100 bg-white p-3 text-sm">
                            <p className="text-slate-500 line-through">{error.original}</p>
                            <p className="mt-1 font-semibold text-emerald-700">{error.corrected}</p>
                            <p className="mt-1 text-slate-600">{error.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                  {evaluation.correctedVersion ? (
                    <details className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                      <summary className="cursor-pointer text-sm font-bold text-blue-800">View corrected version</summary>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{evaluation.correctedVersion}</p>
                    </details>
                  ) : null}
                  <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                    <summary className="cursor-pointer text-sm font-bold text-slate-800">Your original response</summary>
                    <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">{answers[task.id] || '(empty)'}</p>
                  </details>
                </section>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const timerColor = timeRemaining < 120 ? 'text-red-600' : timeRemaining < 300 ? 'text-amber-600' : 'text-slate-700'
  const minWords = activeTask.suggestedWordCount.min
  const maxWords = activeTask.suggestedWordCount.max
  const wordCountColor = activeWordCount >= minWords ? 'text-emerald-600' : 'text-slate-500'

  return (
    <div className="ielts-writing-workspace flex h-dvh min-h-0 flex-col overflow-hidden bg-white">
      <ConfirmModal
        open={showExitConfirm}
        icon={<AlertTriangle className="h-7 w-7" />}
        title="Leave this full test?"
        description="Your draft is saved on this device. The exam timer continues while you are away."
        cancelLabel="Continue writing"
        confirmLabel="Exit test"
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={onExit}
      />
      <ConfirmModal
        open={showSubmitConfirm}
        icon={<Send className="h-7 w-7" />}
        title="Submit both responses?"
        description={`Task 1: ${wordCounts[tasks[0].id]} words · Task 2: ${wordCounts[tasks[1].id]} words`}
        cancelLabel="Keep writing"
        confirmLabel="Submit full test"
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={() => void handleSubmit()}
        confirmTone="emerald"
      />

      <AnimatePresence>
        {showWritingGate ? (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md rounded-3xl border border-amber-200 bg-white p-7 text-center shadow-2xl">
              <Crown className="mx-auto h-12 w-12 text-amber-500" />
              <h2 className="mt-4 text-2xl font-black text-slate-900">Free AI checks used up</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Upgrade to Premium to evaluate both full-test responses and receive detailed band feedback.</p>
              <div className="mt-5 flex justify-center gap-2">
                <a href="/premium" className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white">View Premium</a>
                <button type="button" onClick={() => setShowWritingGate(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700">Maybe later</button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <header className="ielts-writing-header shrink-0 border-b border-red-100 bg-gradient-to-r from-white via-red-50/40 to-white px-3 py-2.5 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button type="button" onClick={() => (hasDraft ? setShowExitConfirm(true) : onExit())} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-slate-600 shadow-sm hover:text-red-600">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="writing-exam-label">IELTS Writing · Full test</p>
              <h1 className="truncate text-sm font-black text-slate-900">{fullTest.title}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {timerEnabled ? (
              <div className={`inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-2.5 py-1.5 font-mono text-sm font-black shadow-sm sm:text-base ${timerColor}`}>
                <Clock3 className="h-4 w-4" /> {formatTime(timeRemaining)}
              </div>
            ) : null}
            <button type="button" onClick={() => setBookmarks((current) => ({ ...current, [activeTask.id]: !current[activeTask.id] }))} className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm ${bookmarks[activeTask.id] ? 'border-amber-300 bg-amber-100 text-amber-700' : 'border-red-200 bg-white text-slate-500'}`}>
              <Bookmark className="h-4 w-4" fill={bookmarks[activeTask.id] ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <nav className="mt-2 grid grid-cols-2 gap-2" aria-label="Writing tasks">
          {tasks.map((task, index) => {
            const isActive = index === activeTaskIndex
            const count = wordCounts[task.id]
            return (
              <button key={task.id} type="button" onClick={() => { setActiveTaskIndex(index); setTimeout(() => textareaRef.current?.focus(), 50) }} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${isActive ? 'border-red-300 bg-red-50 text-red-800 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-red-200'}`}>
                <span className="text-xs font-black sm:text-sm">Task {index + 1}</span>
                <span className={`text-[10px] font-bold ${count >= task.suggestedWordCount.min ? 'text-emerald-600' : 'text-slate-400'}`}>{count} words</span>
              </button>
            )
          })}
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <section className="shrink-0 border-b border-red-100 bg-gradient-to-b from-white via-red-50/20 to-white p-4 sm:p-5 lg:w-1/2 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-7">
          <div className="writing-exam-card p-5">
            <p className="writing-exam-label mb-3">Task {activeTaskIndex + 1} · Instructions</p>
            <p className="text-[15px] font-medium leading-7 text-slate-900">{activeTask.promptLead ?? activeTask.prompt}</p>
            {activeTask.promptQuestion ? (
              <div className="mt-4 whitespace-pre-line rounded-xl bg-slate-100 px-4 py-4 text-[15px] font-medium leading-7 text-slate-900">{activeTask.promptQuestion}</div>
            ) : null}
            {activeTask.instructions ? (
              <p className="mt-4 text-sm leading-6 text-slate-600"><strong className="font-black text-slate-700">Instructions:</strong> {activeTask.instructions}</p>
            ) : null}
          </div>
          {activeTask.imageUrl ? (
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
              <button type="button" onClick={() => setShowImagePreview(true)} aria-label="Enlarge Task 1 image" className="absolute right-4 top-4 z-10 rounded-lg border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-sm hover:bg-slate-50">
                <Maximize2 className="h-4 w-4" />
              </button>
              <WritingTaskImage task={activeTask} className="h-auto w-full object-contain" />
            </div>
          ) : null}
          {activeTask.diagram ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => setShowImagePreview(true)} aria-label="Enlarge Task 1 image" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
              <WritingTaskDiagram diagram={activeTask.diagram} />
            </div>
          ) : null}
          {activeTask.visual ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
              <WritingDataVisual visual={activeTask.visual} />
            </div>
          ) : null}
        </section>

        <section className="flex min-h-[460px] flex-1 flex-col bg-gradient-to-b from-white via-slate-50/30 to-white lg:min-h-0 lg:w-1/2">
          <div className="min-h-0 flex-1 p-4 sm:p-5 lg:p-7">
            <div className="writing-exam-card relative flex h-full min-h-[360px] flex-col overflow-hidden lg:min-h-0">
              <div className="writing-editor-label"><span>Your response</span><span>Task {activeTaskIndex + 1}</span></div>
              <textarea ref={textareaRef} value={activeAnswer} onChange={(event) => setAnswers((current) => ({ ...current, [activeTask.id]: event.target.value }))} placeholder={`Write your Task ${activeTaskIndex + 1} response here...`} className="min-h-0 flex-1 resize-none bg-transparent p-5 text-[15px] leading-7 text-slate-800 outline-none placeholder:text-slate-400" />
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                <span className="text-xs text-slate-500">Minimum {minWords} words · suggested {minWords}–{maxWords}</span>
                <span className={`text-xs font-black ${wordCountColor}`}>{activeWordCount} words</span>
              </div>
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><PenLine className="h-4 w-4 text-slate-400" /> {totalWordCount} total words</div>
            <div className="flex items-center gap-2">
              {fullscreenSupported ? (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}
                  aria-pressed={isFullscreen}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              ) : null}
              {activeTaskIndex < tasks.length - 1 ? (
                <button type="button" onClick={() => setActiveTaskIndex(activeTaskIndex + 1)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20">Next: Task 2 <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={() => setShowSubmitConfirm(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20"><Send className="h-4 w-4" /> Submit Full Test</button>
              )}
            </div>
          </footer>
        </section>
      </main>
      {showImagePreview && (activeTask.imageUrl || activeTask.diagram) ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Enlarged Task 1 image">
          <button type="button" onClick={() => setShowImagePreview(false)} aria-label="Close enlarged image" className="absolute inset-0" />
          <div className="relative max-h-[90vh] w-full max-w-[1200px] overflow-auto rounded-2xl bg-white p-3 shadow-2xl sm:p-5">
            <button type="button" onClick={() => setShowImagePreview(false)} className="absolute right-3 top-3 z-10 rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow">Close</button>
            {activeTask.diagram ? <WritingTaskDiagram diagram={activeTask.diagram} /> : <WritingTaskImage task={activeTask} className="h-auto max-w-full object-contain" />}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ModeCard({ icon, title, eyebrow, description, features, buttonLabel, simulation = false, onClick, vocabularyTestId }: { icon: React.ReactNode; title: string; eyebrow: string; description: string; features: string[]; buttonLabel: string; simulation?: boolean; onClick: () => void; vocabularyTestId?: string }) {
  const { reducedMotion, allowHoverMotion } = useMotionPreferences()
  return (
    <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: simulation ? 0.12 : 0.06 }} whileHover={allowHoverMotion ? { y: -5 } : undefined} className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white/95 p-6 text-left shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)] backdrop-blur-xl transition-all duration-300 sm:p-10 ${simulation ? 'border-red-200' : 'border-red-100'}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-5 ${simulation ? 'from-red-700 to-rose-600' : 'from-red-600 to-rose-600'}`} />
      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="mb-8 flex items-center gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br to-rose-500 text-white shadow-lg shadow-red-500/20 transition-transform group-hover:scale-110 ${simulation ? 'from-red-600' : 'from-red-500'}`}>{icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className={`text-xs font-bold uppercase tracking-widest ${simulation ? 'text-red-600' : 'text-red-500'}`}>{eyebrow}</p>
          </div>
        </div>
        <p className="mb-8 flex-1 text-[15px] italic leading-relaxed text-slate-600 transition-colors group-hover:text-slate-700">{description}</p>
        <ul className="mb-10 space-y-4">
          {features.map((feature, index) => (
            <li key={feature} className={`flex items-center gap-3 text-xs ${simulation && index === 0 ? 'font-bold text-rose-400' : 'font-semibold text-slate-500'}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${index === 0 && simulation ? 'animate-pulse bg-rose-500' : index === 1 && !simulation ? 'bg-rose-500' : 'bg-red-500'}`} />
              {feature}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onClick} className={`flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-4 text-center text-sm font-bold text-white shadow-lg transition-all ${simulation ? 'shadow-red-500/20 group-hover:scale-[1.02]' : 'border border-red-500 shadow-red-500/25 group-hover:from-red-500 group-hover:to-rose-500'}`}>{buttonLabel}</button>
        {vocabularyTestId ? <TestVocabulary testId={vocabularyTestId} variant="link" /> : null}
      </div>
    </motion.div>
  )
}

function ConfirmModal({ open, icon, title, description, cancelLabel, confirmLabel, onCancel, onConfirm, confirmTone = 'red' }: { open: boolean; icon: React.ReactNode; title: string; description: string; cancelLabel: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; confirmTone?: 'red' | 'emerald' }) {
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.button type="button" aria-label="Close confirmation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" onClick={onCancel} />
          <motion.div initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }} className="relative w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">{icon}</div>
            <h2 className="mt-4 text-xl font-black text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">{cancelLabel}</button>
              <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white ${confirmTone === 'emerald' ? 'bg-emerald-600' : 'bg-red-600'}`}>{confirmLabel}</button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center"><p className="text-2xl font-black text-slate-900">{value.toFixed(1)}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p></div>
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: 'emerald' | 'amber' }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === 'emerald' ? 'border-emerald-100 bg-emerald-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
      <h3 className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${tone === 'emerald' ? 'text-emerald-700' : 'text-amber-700'}`}><Target className="h-4 w-4" /> {title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul>
    </div>
  )
}
