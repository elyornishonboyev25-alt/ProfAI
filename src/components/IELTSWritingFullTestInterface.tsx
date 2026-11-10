import AssessmentPending from '@/components/ielts/AssessmentPending'
import WritingReviewWorkbench from '@/components/writing/WritingReviewWorkbench'
import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useActiveTest } from '@/hooks/useActiveTest'
import TestLeaderboard from '@/components/results/TestLeaderboard'
import { useIeltsAttemptResume } from '@/hooks/useIeltsAttemptResume'
import { saveActiveTestPaper, clearActiveTestPaper } from '@/utils/activeTestPaper'
import { accountStorageFor } from '@/utils/accountStorage'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Crown, Lightbulb, Maximize2, Monitor, RotateCcw, Send } from 'lucide-react'

import { AnimatedBackground } from '@/components/AnimatedBackground'
import TestLaunchOverlay from '@/components/common/TestLaunchOverlay'
import SubmittedWritingAnswers from '@/components/ielts/SubmittedWritingAnswers'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import WritingTaskDiagram from '@/components/writing/WritingTaskDiagram'
import WritingDataVisual from '@/components/writing/WritingDataVisual'
import WritingTaskImage from '@/components/writing/WritingTaskImage'
import type { WritingFullTest } from '@/data/writingTestData'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import WritingWorkspace from '@/components/writing/WritingWorkspace'
import WritingTaskPrompt from '@/components/writing/WritingTaskPrompt'
import { markXpActivitySynced, recordXpActivity } from '@/lib/xpApi'
import { evaluateWriting, type WritingEvaluation } from '@/services/geminiAI'
import { writingSectionBand, writingVisualContext } from '@/lib/writingScoring'
import WritingScoreExplanation from '@/components/writing/WritingScoreExplanation'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useBadgeStore } from '@/store/badgeStore'
import { saveWritingAnalysis } from '@/utils/writingAnalysisStorage'
import { useSearchParams } from 'react-router-dom'
import { learningCenterApi } from '@/features/learningCenter/api'

type Props = {
  fullTest: WritingFullTest
  onExit: () => void
  onComplete?: (band: number, summary: string, review: { label: string; response: string; feedback?: string; improvedVersion?: string }[]) => void
  autoStart?: boolean
  autoTimerEnabled?: boolean
  autoDurationMinutes?: number
  inFullMock?: boolean
  fullMockId?: string
}

type Phase = 'landing' | 'writing' | 'submitted'

function countWords(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length
}

function weightedBand(evaluations: Record<string, WritingEvaluation>, taskIds: string[]): number {
  return writingSectionBand(evaluations[taskIds[0]], evaluations[taskIds[1]])
}

export default function IELTSWritingFullTestInterface({
  fullTest,
  onExit,
  onComplete,
  autoStart,
  autoTimerEnabled,
  autoDurationMinutes,
  inFullMock = false,
  fullMockId,
}: Props) {
  const { c: uiCopy, language } = useCopy()
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

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [showWritingGate, setShowWritingGate] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<Record<string, WritingEvaluation>>({})
  const assessmentCache = useRef<Record<string, { answer: string; evaluation: WritingEvaluation }>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const submittingRef = useRef(false)
  const autoSubmittedRef = useRef(false)
  const deadlineRef = useRef<number | null>(null)
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoStartHandled = useRef(false)

  const activeTask = tasks[activeTaskIndex]
  const activeAnswer = answers[activeTask.id] ?? ''
  const wordCounts = useMemo(
    () => Object.fromEntries(tasks.map((task) => [task.id, countWords(answers[task.id] ?? '')])),
    [answers, tasks],
  )
  const totalWordCount = tasks.reduce((total, task) => total + wordCounts[task.id], 0)
  const user = useAuthStore((state: AuthState) => state.user)
  const draftKey = `profai:writing:draft:${user?.id ?? 'guest'}:${fullTest.id}${fullMockId ? `:mock:${fullMockId}` : ''}`
  const sessionKey = `${draftKey}:session`
  const submittedTimeRemaining = phase === 'submitted' ? timeRemaining : undefined
  useIeltsAttemptResume(phase === 'writing' || evaluating, sessionKey, fullTest.title)
  useActiveTest(phase === 'writing' || evaluating)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const awardBadge = useBadgeStore((state) => state.awardIfEligible)
  const writingTrial = useFeatureTrial('writing')
  const setExamModeActive = useAiAssistantStore((state) => state.setExamModeActive)

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
        const parsed = JSON.parse(session) as { phase?: Phase; evaluations?: Record<string, WritingEvaluation>; timeRemaining?: number; answers?: Record<string, string>; timerEnabled?: boolean; deadline?: number | null; bookmarked?: boolean; activeTaskIndex?: number; bookmarks?: Record<string, boolean> }
        if (parsed.answers) setAnswers(Object.fromEntries(tasks.map(task => [task.id, typeof parsed.answers?.[task.id] === 'string' ? parsed.answers[task.id] : ''])))
        autoStartHandled.current = true
        const timed = parsed.timerEnabled === true && typeof parsed.deadline === 'number'
        deadlineRef.current = timed ? parsed.deadline! : null
        setTimerEnabled(timed)
        setTimeRemaining(timed ? Math.max(0, Math.ceil((parsed.deadline! - Date.now()) / 1000)) : effectiveDuration * 60)
        setIsTimerRunning(timed && parsed.deadline! > Date.now())
        setActiveTaskIndex(Math.max(0, Math.min(tasks.length - 1, parsed.activeTaskIndex ?? 0)))
        setBookmarks(parsed.bookmarks ?? {})
        if (parsed.phase === 'submitted') {
          const restored = parsed.evaluations ?? {}
          setEvaluations(restored)
          assessmentCache.current = Object.fromEntries(tasks.filter(task => restored[task.id]).map(task => [task.id, { answer: parsed.answers?.[task.id] ?? '', evaluation: restored[task.id] }]))
          setIsTimerRunning(false)
          setTimeRemaining(parsed.timeRemaining ?? 0)
          if (!tasks.every(task => restored[task.id])) setEvalError('Your submitted responses are saved. Retry to finish the assessment.')
          setPhase('submitted')
        } else setPhase('writing')
      }
    } catch { /* Start from the launch screen. */ }
  }, [draftKey, effectiveDuration, sessionKey, tasks])

  useLayoutEffect(() => {
    if (phase !== 'writing') return
    saveActiveTestPaper(sessionKey, fullTest, user?.id ?? 'guest')
  }, [phase, sessionKey, fullTest, user?.id])

  useLayoutEffect(() => {
    if (phase === 'landing') return
    try { accountStorageFor(user?.id ?? 'guest').setItem(sessionKey, JSON.stringify({ phase, evaluations: phase === 'submitted' ? evaluations : {}, timeRemaining: submittedTimeRemaining, answers, timerEnabled, deadline: deadlineRef.current, activeTaskIndex, bookmarks })) } catch { /* Keep the current session. */ }
    accountStorageFor(user?.id ?? 'guest').setItem(draftKey, JSON.stringify(answers))
  }, [answers, phase, sessionKey, draftKey, timerEnabled, activeTaskIndex, bookmarks, user?.id, evaluations, submittedTimeRemaining])

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
      const activate = () => {
        const timed = inFullMock || withTimer
        setTimerEnabled(timed)
        setTimeRemaining(effectiveDuration * 60)
        deadlineRef.current = timed ? Date.now() + effectiveDuration * 60_000 : null
        try { accountStorageFor(user?.id ?? 'guest').setItem(sessionKey, JSON.stringify({ timerEnabled: timed, deadline: deadlineRef.current })) } catch { /* In-memory session remains active. */ }
        autoSubmittedRef.current = false
        setIsTimerRunning(timed)
        setPhase('writing')
        setIsLaunching(false)
        launchTimerRef.current = null
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
      if (inFullMock) activate()
      else launchTimerRef.current = setTimeout(activate, 1200)
    },
    [effectiveDuration, sessionKey, inFullMock, user?.id],
  )

  useEffect(() => {
    if (autoStartHandled.current || (!autoStart && !inFullMock)) return
    autoStartHandled.current = true
    handleStart(autoTimerEnabled ?? true)
  }, [autoStart, autoTimerEnabled, inFullMock, handleStart])

  const resetTest = useCallback(() => {
    setAnswers(Object.fromEntries(tasks.map((task) => [task.id, ''])))
    setBookmarks({})
    setEvaluations({})
    assessmentCache.current = {}
    setEvalError(null)
    setActiveTaskIndex(0)
    setTimeRemaining(effectiveDuration * 60)
    setIsTimerRunning(false)
    setPhase('landing')
    autoSubmittedRef.current = false
    try { accountStorageFor(user?.id ?? 'guest').removeItem(draftKey) } catch { /* No persisted draft. */ }
    try { accountStorageFor(user?.id ?? 'guest').removeItem(sessionKey); clearActiveTestPaper(sessionKey, user?.id ?? 'guest') } catch { /* No persisted session. */ }
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
    setEvaluations(Object.fromEntries(tasks.flatMap(task => {
      const cached = assessmentCache.current[task.id]
      return cached?.answer === (answers[task.id] ?? '') ? [[task.id, cached.evaluation]] : []
    })))

    try {
      const results: WritingEvaluation[] = []
      for (const task of tasks) {
        const answer = answers[task.id] ?? ''
        const cached = assessmentCache.current[task.id]
        const evaluation = cached?.answer === answer ? cached.evaluation : await evaluateWriting(task.taskType, task.prompt, answer, wordCounts[task.id], writingVisualContext(task))
        if ((useAuthStore.getState().user?.id ?? 'guest') !== (user?.id ?? 'guest')) return
        assessmentCache.current[task.id] = { answer, evaluation }
        results.push(evaluation)
        setEvaluations(Object.fromEntries(tasks.flatMap(item => {
          const entry = assessmentCache.current[item.id]
          return entry?.answer === (answers[item.id] ?? '') ? [[item.id, entry.evaluation]] : []
        })))
      }
      const resultMap = Object.fromEntries(tasks.map((task, index) => [task.id, results[index]]))
      setEvaluations(resultMap)
      if (totalWordCount > 0 && !inFullMock) writingTrial.consume()

      const overallBand = weightedBand(resultMap, tasks.map((task) => task.id))
      if (!inFullMock && tasks.some((task) => task.taskType === 'task1') && tasks.some((task) => task.taskType === 'task2') && timerEnabled) awardBadge({
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
            testId: fullTest.id,
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
          improvedVersion: results[index]?.improvedVersion,
        })),
      )
      // Clear recovery only after both tasks and the mock result are durable.
      accountStorageFor(user?.id ?? 'guest').removeItem(draftKey)
      if (inFullMock) {
        accountStorageFor(user?.id ?? 'guest').removeItem(sessionKey)
        clearActiveTestPaper(sessionKey, user?.id ?? 'guest')
      }
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
    if (inFullMock) return <div className="flex min-h-dvh items-center justify-center bg-white p-6 text-center" role="status"><h1 className="text-2xl font-black text-slate-900"><UiText text={"Preparing your"} /> <span className="text-red-600"><UiText text={"Writing test"} /></span></h1></div>
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)] p-6">
        <AnimatedBackground />
        <AnimatePresence>
          {isLaunching ? (
            <TestLaunchOverlay
              title={uiCopy("Your full test will begin shortly")}
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
              <UiText text={"Experience the authentic IELTS Computer-Delivered environment with Ivygoo precision."} />
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <ModeCard
              icon={<Lightbulb className="h-8 w-8" />}
              title={uiCopy("Practice Mode")}
              eyebrow="Casual Learning"
              description={uiCopy("Write at your own pace without time pressure. Perfect for learning structure and vocabulary.")}
              features={['Unlimited writing time', 'Task 1: 150+ words · Task 2: 250+ words']}
              buttonLabel={uiCopy("Start Practice")}
              onClick={() => handleStart(false)}
            />
            <ModeCard
              icon={<Monitor className="h-8 w-8" />}
              title={uiCopy("Simulation Mode")}
              eyebrow="Exam Simulation"
              description={uiCopy("Authentic IELTS CD environment. Replicates the high-pressure conditions of the real exam with strict timing and official layout standards.")}
              features={[`Strict ${effectiveDuration}-minute limit across both tasks`, 'IELTS Writing band scoring']}
              buttonLabel={uiCopy("Launch Final Simulation")}
              simulation
              onClick={() => handleStart(true)}
            />
          </div>

          <motion.div className="mt-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <button type="button" onClick={onExit} className="mx-auto flex items-center gap-2 rounded-full border border-white/5 px-6 py-2 text-sm text-slate-500 transition-colors hover:bg-white/5 hover:text-red-600">
              <ArrowLeft className="h-4 w-4" /> <UiText text={"Return to Writing Tests"} />
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (phase === 'submitted') {
    if (evaluating) return <AssessmentPending />

    if (evalError) {
      return (
        <div className="min-h-screen bg-red-50 p-6">
          <div role="alert" className="mx-auto w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-2xl font-black text-slate-900"><UiText text={"Evaluation failed"} /></h2>
            <p className="mt-2 text-sm text-slate-600">{evalError}</p>
            <div className="mt-6 flex justify-center gap-2">
              <button type="button" onClick={() => void handleSubmit()} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"><UiText text={"Retry"} /></button>
              <button type="button" onClick={() => setPhase('writing')} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"><UiText text={"Back to editing"} /></button>
            </div>
          </div>
          <SubmittedWritingAnswers tasks={tasks} answers={answers} />
        </div>
      )
    }

    const overallBand = weightedBand(evaluations, tasks.map((task) => task.id))
    const correctedOverall = tasks.every(task => !answers[task.id]?.trim() || evaluations[task.id]?.correctedAssessment)
      ? writingSectionBand(evaluations[tasks[0]?.id]?.correctedAssessment, evaluations[tasks[1]?.id]?.correctedAssessment) : null
    return (
      <div className="workspace-page ielts-writing-review min-h-screen px-4 py-6 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={onExit} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
              <ArrowLeft className="h-4 w-4" /> <UiText text={"Back to Tests"} />
            </button>
            <button type="button" onClick={resetTest} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/20">
              <RotateCcw className="h-4 w-4" /> <UiText text={"Try Again"} />
            </button>
          </div>

          <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> <UiText text={"Full test completed"} />
                </span>
                <h1 className="mt-3 text-3xl font-black text-slate-900"><UiText text={"Estimated Overall Band"} /> {overallBand.toFixed(1)}</h1>
                {correctedOverall !== null && <p className="mt-2 text-sm font-semibold text-emerald-700">{language.startsWith('uz') ? 'Tuzatilgan ikkala javob uchun umumiy taxminiy band' : language.startsWith('ru') ? 'Общая оценка исправленных ответов' : 'Estimated overall with both answers corrected'}: {correctedOverall.toFixed(1)}</p>}
                <p className="mt-1 text-sm text-slate-500"><UiText text={"Task 2 carries twice the weight of Task 1. This AI estimate is not an official IELTS result."} /></p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 px-6 py-4 text-center text-white shadow-lg shadow-red-500/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-100"><UiText text={"Total words"} /></p>
                <p className="text-3xl font-black">{totalWordCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <details className="ir-glass p-5 mt-5"><summary className="cursor-pointer font-bold"><UiText text={"Test leaderboard"} /></summary><div className="mt-5"><TestLeaderboard testId={fullTest.id} title={fullTest.title} /></div></details>
            {tasks.map((task, index) => {
              const evaluation = evaluations[task.id]
              if (!evaluation) return null
              return (
                <section key={task.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-500"><UiText text={"Task"} /> {index + 1}</p>
                      <h2 className="mt-1 text-xl font-black text-slate-900"><UiText text={"Band"} /> {evaluation.overallBand.toFixed(1)}</h2>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{evaluation.summary}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">{wordCounts[task.id]} <UiText text={"words"} /></span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Score label={task.taskType === 'task1' ? 'Task Achievement' : 'Task Response'} value={evaluation.taskAchievement} />
                    <Score label={uiCopy("Coherence")} value={evaluation.coherenceCohesion} />
                    <Score label={uiCopy("Vocabulary")} value={evaluation.lexicalResource} />
                    <Score label={uiCopy("Grammar")} value={evaluation.grammaticalRange} />
                  </div>
                  <WritingScoreExplanation feedback={evaluation.criterionFeedback} taskType={task.taskType} />
                  {task.diagram ? (
                    <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 chart"} /></summary>
                      <div className="mx-auto mt-4 max-w-[650px]"><WritingTaskDiagram diagram={task.diagram} /></div>
                    </details>
                  ) : null}
                  {task.visual ? (
                    <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 data"} /></summary>
                      <div className="mx-auto mt-4 max-w-[750px]"><WritingDataVisual visual={task.visual} /></div>
                    </details>
                  ) : null}
                  {task.imageUrl ? (
                    <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review task visual"} /></summary>
                      <WritingTaskImage task={task} className="mx-auto mt-4 h-auto max-w-full object-contain" />
                    </details>
                  ) : null}
                  <details className="mt-4 rounded-2xl border border-red-100 bg-red-50/30 p-4">
                    <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Task prompt"} /></summary>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{task.promptLead ?? task.prompt}</p>
                    {task.promptQuestion ? <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-6 text-slate-800">{task.promptQuestion}</p> : null}
                  </details>
                  <WritingReviewWorkbench evaluation={evaluation} original={answers[task.id] || ""} />
                </section>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ielts-writing-workspace flex h-dvh min-h-0 flex-col overflow-hidden bg-white">
      <ConfirmModal
        open={showSubmitConfirm}
        icon={<Send className="h-7 w-7" />}
        title={uiCopy("Submit both responses?")}
        description={uiCopy("Task 1: {{value1}} words · Task 2: {{value2}} words", { value1: String(wordCounts[tasks[0].id]), value2: String(wordCounts[tasks[1].id]) })}
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
              <h2 className="mt-4 text-2xl font-black text-slate-900"><UiText text={"Free AI checks used up"} /></h2>
              <p className="mt-2 text-sm leading-6 text-slate-600"><UiText text={"Upgrade to Premium to evaluate both full-test responses and receive detailed band feedback."} /></p>
              <div className="mt-5 flex justify-center gap-2">
                <a href="/premium" className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white"><UiText text={"View Premium"} /></a>
                <button type="button" onClick={() => setShowWritingGate(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700"><UiText text={"Maybe later"} /></button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <WritingWorkspace
        title={fullTest.title}
        tasks={tasks.map((task, index) => ({ id: task.id, label: `Task ${index + 1}`, minutes: task.durationMinutes, minimum: task.suggestedWordCount.min, words: wordCounts[task.id], marked: Boolean(bookmarks[task.id]) }))}
        activeIndex={activeTaskIndex}
        onTaskChange={index => { setActiveTaskIndex(index); setShowImagePreview(false) }}
        onExit={onExit}
        onBookmark={() => setBookmarks(current => ({ ...current, [activeTask.id]: !current[activeTask.id] }))}
        timed={timerEnabled}
        seconds={timeRemaining}
        answer={activeAnswer}
        onAnswerChange={value => setAnswers(current => ({ ...current, [activeTask.id]: value }))}
        textareaRef={textareaRef}
        action={activeTaskIndex < tasks.length - 1 ? (
          <button type="button" onClick={() => setActiveTaskIndex(activeTaskIndex + 1)} className="writing-primary"><UiText text={"Next: Task 2"} /> <ArrowRight size={15} /></button>
        ) : (
          <button type="button" onClick={() => setShowSubmitConfirm(true)} className="writing-primary"><Send size={15} /><UiText text={"Submit Full Test"} /></button>
        )}
        prompt={<>
          <WritingTaskPrompt task={activeTask} />
          {activeTask.imageUrl ? (
            <div className="writing-source-visual">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => setShowImagePreview(true)} aria-label={uiCopy("Enlarge Task 1 image")} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
              <WritingTaskImage task={activeTask} className="h-auto w-full object-contain" />
            </div>
          ) : null}
          {activeTask.diagram ? (
            <div className="writing-source-visual">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => setShowImagePreview(true)} aria-label={uiCopy("Enlarge Task 1 image")} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50">
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
              <WritingTaskDiagram diagram={activeTask.diagram} />
            </div>
          ) : null}
          {activeTask.visual ? (
            <div className="writing-source-visual">
              <WritingDataVisual visual={activeTask.visual} />
            </div>
          ) : null}
        </>}
      />
      {showImagePreview && (activeTask.imageUrl || activeTask.diagram) ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={uiCopy("Enlarged Task 1 image")}>
          <button type="button" onClick={() => setShowImagePreview(false)} aria-label={uiCopy("Close enlarged image")} className="absolute inset-0" />
          <div className="relative max-h-[90vh] w-full max-w-[1200px] overflow-auto rounded-2xl bg-white p-3 shadow-2xl sm:p-5">
            <button type="button" onClick={() => setShowImagePreview(false)} className="absolute right-3 top-3 z-10 rounded-lg bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow"><UiText text={"Close"} /></button>
            {activeTask.diagram ? <WritingTaskDiagram diagram={activeTask.diagram} /> : <WritingTaskImage task={activeTask} className="h-auto max-w-full object-contain" />}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ModeCard({ icon, title, eyebrow, description, features, buttonLabel, simulation = false, onClick }: { icon: React.ReactNode; title: string; eyebrow: string; description: string; features: string[]; buttonLabel: string; simulation?: boolean; onClick: () => void }) {
  const { reducedMotion, allowHoverMotion } = useMotionPreferences()
  return (
    <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: simulation ? 0.12 : 0.06 }} whileHover={allowHoverMotion ? { y: -5 } : undefined} className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white/95 p-6 text-left shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)] backdrop-blur-xl transition-all duration-300 sm:p-10 ${simulation ? 'border-red-200' : 'border-red-100'}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-5 ${simulation ? 'from-red-700 to-rose-600' : 'from-red-600 to-rose-600'}`} />
      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="mb-8 flex items-center gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br to-rose-500 text-white shadow-lg shadow-red-500/20 transition-transform group-hover:scale-110 ${simulation ? 'from-red-600' : 'from-red-500'}`}>{icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-slate-900"><UiText text={title} /></h2>
            <p className={`text-xs font-bold uppercase tracking-widest ${simulation ? 'text-red-600' : 'text-red-500'}`}><UiText text={eyebrow} /></p>
          </div>
        </div>
        <p className="mb-8 flex-1 text-[15px] italic leading-relaxed text-slate-600 transition-colors group-hover:text-slate-700"><UiText text={description} /></p>
        <ul className="mb-10 space-y-4">
          {features.map((feature, index) => (
            <li key={feature} className={`flex items-center gap-3 text-xs ${simulation && index === 0 ? 'font-bold text-rose-400' : 'font-semibold text-slate-500'}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${index === 0 && simulation ? 'animate-pulse bg-rose-500' : index === 1 && !simulation ? 'bg-rose-500' : 'bg-red-500'}`} />
              <UiText text={feature} />
            </li>
          ))}
        </ul>
        <button type="button" onClick={onClick} className={`flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-4 text-center text-sm font-bold text-white shadow-lg transition-all ${simulation ? 'shadow-red-500/20 group-hover:scale-[1.02]' : 'border border-red-500 shadow-red-500/25 group-hover:from-red-500 group-hover:to-rose-500'}`}><UiText text={buttonLabel} /></button>
      </div>
    </motion.div>
  )
}

function ConfirmModal({ open, icon, title, description, cancelLabel, confirmLabel, onCancel, onConfirm, confirmTone = 'red' }: { open: boolean; icon: React.ReactNode; title: string; description: string; cancelLabel: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; confirmTone?: 'red' | 'emerald' }) {
  const { c: uiCopy } = useCopy()
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.button type="button" aria-label={uiCopy("Close confirmation")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" onClick={onCancel} />
          <motion.div initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.97 }} className="relative w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">{icon}</div>
            <h2 className="mt-4 text-xl font-black text-slate-900"><UiText text={title} /></h2>
            <p className="mt-2 text-sm text-slate-600"><UiText text={description} /></p>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"><UiText text={cancelLabel} /></button>
              <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white ${confirmTone === 'emerald' ? 'bg-emerald-600' : 'bg-red-600'}`}><UiText text={confirmLabel} /></button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center"><p className="text-2xl font-black text-slate-900">{value.toFixed(1)}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500"><UiText text={label} /></p></div>
}
