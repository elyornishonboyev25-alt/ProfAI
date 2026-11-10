import AssessmentPending from '@/components/ielts/AssessmentPending'
import WritingReviewWorkbench from '@/components/writing/WritingReviewWorkbench'
import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useActiveTest } from '@/hooks/useActiveTest'
import TestLeaderboard from '@/components/results/TestLeaderboard'
import SubmittedWritingAnswers from '@/components/ielts/SubmittedWritingAnswers'
import { saveActiveTestPaper, clearActiveTestPaper } from '@/utils/activeTestPaper'
import { useIeltsAttemptResume } from '@/hooks/useIeltsAttemptResume'
import { accountStorageFor } from '@/utils/accountStorage'
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, RotateCcw, Send, Timer, TimerOff, Sparkles, Target, Type, Pen, Trophy, Zap, AlertCircle, Crown, Lock } from 'lucide-react'
import { evaluateWriting, type WritingEvaluation } from '@/services/geminiAI'
import { writingVisualContext } from '@/lib/writingScoring'
import WritingScoreExplanation from '@/components/writing/WritingScoreExplanation'
import { saveWritingAnalysis, getWritingXP } from '@/utils/writingAnalysisStorage'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import type { WritingTask, LineChartData, ChartSeries } from '@/data/writingTestData'
import TestLaunchOverlay from '@/components/common/TestLaunchOverlay'
import WritingTaskDiagram from '@/components/writing/WritingTaskDiagram'
import WritingDataVisual from '@/components/writing/WritingDataVisual'
import WritingTaskImage from '@/components/writing/WritingTaskImage'
import WritingWorkspace from '@/components/writing/WritingWorkspace'
import WritingTaskPrompt from '@/components/writing/WritingTaskPrompt'
import { markXpActivitySynced, recordXpActivity } from '@/lib/xpApi'
import { useSearchParams } from 'react-router-dom'
import { learningCenterApi } from '@/features/learningCenter/api'

type Props = {
  task: WritingTask
  onExit: () => void
  autoStart?: boolean
  autoTimerEnabled?: boolean
  autoDurationMinutes?: number
}

function LineChart({ chart }: { chart: LineChartData }) {
  const padding = { top: 40, right: 30, bottom: 50, left: 60 }
  const width = 520
  const height = 340
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  const allYears = chart.series[0]?.data.map((d) => d.year) ?? []
  const allValues = chart.series.flatMap((s) => s.data.map((d) => d.value))
  const minYear = Math.min(...allYears)
  const maxYear = Math.max(...allYears)
  const maxVal = Math.ceil(Math.max(...allValues) / 1000) * 1000

  const xScale = (year: number) => padding.left + ((year - minYear) / (maxYear - minYear)) * plotW
  const yScale = (val: number) => padding.top + plotH - (val / maxVal) * plotH

  const yTicks: number[] = []
  for (let v = 0; v <= maxVal; v += 1000) yTicks.push(v)

  function buildPath(series: ChartSeries) {
    return series.data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.year)} ${yScale(d.value)}`)
      .join(' ')
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[520px]">
        <text
          x={width / 2}
          y={18}
          textAnchor="middle"
          className="fill-slate-800 text-[13px] font-bold"
        >
          {chart.title}
        </text>

        <g className="legend" transform={`translate(${width / 2 - 100}, 28)`}>
          <line x1="0" y1="4" x2="24" y2="4" stroke="#1e293b" strokeWidth="2" />
          <circle cx="12" cy="4" r="3" fill="#1e293b" />
          <text x="30" y="8" className="fill-slate-700 text-[10px]">Closures</text>
          <line x1="100" y1="4" x2="124" y2="4" stroke="#1e293b" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="112" cy="4" r="3" fill="#1e293b" />
          <text x="130" y="8" className="fill-slate-700 text-[10px]">Openings</text>
        </g>

        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={yScale(v)}
              x2={padding.left + plotW}
              y2={yScale(v)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={yScale(v) + 4}
              textAnchor="end"
              className="fill-slate-500 text-[10px]"
            >
              {v === 0 ? '0' : v.toLocaleString()}
            </text>
          </g>
        ))}

        {allYears.map((year) => (
          <text
            key={year}
            x={xScale(year)}
            y={height - 10}
            textAnchor="middle"
            className="fill-slate-600 text-[10px]"
          >
            {year}
          </text>
        ))}

        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotH}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top + plotH}
          x2={padding.left + plotW}
          y2={padding.top + plotH}
          stroke="#94a3b8"
          strokeWidth="1"
        />

        {chart.series.map((series, idx) => (
          <g key={series.label}>
            <path
              d={buildPath(series)}
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
              strokeDasharray={series.style === 'dashed' ? '8 5' : 'none'}
            />
            {series.data.map((d) => (
              <circle
                key={`${idx}-${d.year}`}
                cx={xScale(d.year)}
                cy={yScale(d.value)}
                r="4"
                fill={idx === 0 ? '#1e293b' : '#fff'}
                stroke="#1e293b"
                strokeWidth="2"
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  // IELTS-style counting: a token only counts as a word if it contains at least
  // one letter or digit. This ignores stray punctuation ( — • , - ... ) that the
  // naive whitespace split would otherwise count as extra words, while keeping
  // hyphenated words, contractions and numbers (e.g. "well-known", "don't", "2,000") as one.
  return trimmed.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length
}

function bandLabel(band: number): string {
  if (band >= 9) return 'Expert User'
  if (band >= 8) return 'Very Good User'
  if (band >= 7) return 'Good User'
  if (band >= 6) return 'Competent User'
  if (band >= 5) return 'Modest User'
  if (band >= 4) return 'Limited User'
  if (band >= 3) return 'Extremely Limited'
  return 'Intermittent User'
}

function BandScoreRing({ score, label, size = 'md' }: { score: number; label: string; size?: 'lg' | 'md' }) {
  const isLg = size === 'lg'
  const r = isLg ? 42 : 28
  const stroke = isLg ? 6 : 4
  const circumference = 2 * Math.PI * r
  const progress = (score / 9) * circumference
  const svgSize = (r + stroke) * 2

  const color =
    score >= 7 ? '#059669' : score >= 5.5 ? '#d97706' : score >= 4 ? '#ea580c' : '#dc2626'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle cx={r + stroke} cy={r + stroke} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle
            cx={r + stroke} cy={r + stroke} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-black ${isLg ? 'text-2xl' : 'text-sm'}`} style={{ color }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <span className={`font-semibold text-slate-600 ${isLg ? 'text-xs' : 'text-[10px]'}`}>{label}</span>
    </div>
  )
}

export default function IELTSWritingTestInterface({
  task,
  onExit,
  autoStart,
  autoTimerEnabled,
  autoDurationMinutes,
}: Props) {
  const { c: uiCopy } = useCopy()
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState<'landing' | 'writing' | 'submitted'>('landing')
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(task.durationMinutes * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [answer, setAnswer] = useState('')
  const [bookmarked, setBookmarked] = useState(false)

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [aiEvaluation, setAiEvaluation] = useState<WritingEvaluation | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)
  const autoStartHandled = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isLaunching, setIsLaunching] = useState(false)
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const submittingRef = useRef(false)
  const autoSubmittedRef = useRef(false)
  const deadlineRef = useRef<number | null>(null)

  const user = useAuthStore((state: AuthState) => state.user)
  const draftKey = `profai:writing:draft:${user?.id ?? 'guest'}:${task.id}`
  const sessionKey = `${draftKey}:session`
  const submittedTimeRemaining = phase === 'submitted' ? timeRemaining : undefined
  useIeltsAttemptResume(phase === 'writing' || evaluating, sessionKey, task.title)
  useActiveTest(phase === 'writing' || evaluating)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const writingTrial = useFeatureTrial('writing')
  const [showWritingGate, setShowWritingGate] = useState(false)
  const wordCount = countWords(answer)
  const minWords = task.suggestedWordCount.min
  const effectiveDuration = autoDurationMinutes && autoDurationMinutes > 0 ? autoDurationMinutes : task.durationMinutes

  useEffect(() => {
    try {
      const saved = accountStorageFor(user?.id ?? 'guest').getItem(draftKey)
      if (saved !== null) setAnswer(saved)
    } catch { /* Storage can be unavailable. */ }
    try {
      const session = accountStorageFor(user?.id ?? 'guest').getItem(sessionKey)
      if (session) {
        const parsed = JSON.parse(session) as { phase?: string; evaluation?: WritingEvaluation | null; timeRemaining?: number; answer?: string; timerEnabled?: boolean; deadline?: number | null; bookmarked?: boolean; activeTaskIndex?: number; bookmarks?: Record<string, boolean> }
        if (typeof parsed.answer === 'string') setAnswer(parsed.answer)
        autoStartHandled.current = true
        const timed = parsed.timerEnabled === true && typeof parsed.deadline === 'number'
        deadlineRef.current = timed ? parsed.deadline! : null
        setTimerEnabled(timed)
        setTimeRemaining(timed ? Math.max(0, Math.ceil((parsed.deadline! - Date.now()) / 1000)) : effectiveDuration * 60)
        setIsTimerRunning(timed && parsed.deadline! > Date.now())
        setBookmarked(parsed.bookmarked === true)
        if (parsed.phase === 'submitted') {
          setAiEvaluation(parsed.evaluation ?? null)
          setIsTimerRunning(false)
          setTimeRemaining(parsed.timeRemaining ?? 0)
          if (!parsed.evaluation) setEvalError('Your submitted response is saved. Retry to finish the assessment.')
          setPhase('submitted')
        } else setPhase('writing')
      }
    } catch { /* Start from launch screen. */ }
  }, [draftKey, effectiveDuration, sessionKey])

  useLayoutEffect(() => {
    if (phase !== 'writing') return
    saveActiveTestPaper(sessionKey, task, user?.id ?? 'guest')
  }, [phase, sessionKey, task, user?.id])

  useLayoutEffect(() => {
    if (phase === 'landing') return
    try { accountStorageFor(user?.id ?? 'guest').setItem(sessionKey, JSON.stringify({ phase, evaluation: phase === 'submitted' ? aiEvaluation : null, timeRemaining: submittedTimeRemaining, answer, timerEnabled, deadline: deadlineRef.current, bookmarked })) } catch { /* Keep the current session. */ }
    accountStorageFor(user?.id ?? 'guest').setItem(draftKey, answer)
  }, [answer, phase, sessionKey, draftKey, timerEnabled, bookmarked, user?.id, aiEvaluation, submittedTimeRemaining])

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

  const handleStart = useCallback(
    (withTimer: boolean) => {
      // Brief "your test will begin shortly" loader before the writing workspace.
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
      }, 2000)
    },
    [effectiveDuration, sessionKey],
  )

  useEffect(() => () => {
    if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
  }, [])

  // Auto-start when the AI assistant opens a test with specific settings.
  useEffect(() => {
    if (autoStartHandled.current || !autoStart) return
    autoStartHandled.current = true
    handleStart(autoTimerEnabled ?? true)
  }, [autoStart, autoTimerEnabled, handleStart])

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return
    // Non-premium learners get a limited number of free AI checks. Once spent,
    // show the premium gate instead of running another evaluation.
    if (writingTrial.locked) {
      setShowSubmitConfirm(false)
      setShowWritingGate(true)
      return
    }

    submittingRef.current = true
    setIsTimerRunning(false)
    setPhase('submitted')
    setShowSubmitConfirm(false)
    setEvaluating(true)
    setEvalError(null)
    setAiEvaluation(null)

    try {
      const result = await evaluateWriting(task.taskType, task.prompt, answer, wordCount, writingVisualContext(task))
      if ((useAuthStore.getState().user?.id ?? 'guest') !== (user?.id ?? 'guest')) return
      setAiEvaluation(result)
      if (answer.trim()) writingTrial.consume()

      const timeSpent = timerEnabled ? effectiveDuration * 60 - timeRemaining : 0
      const savedEntry = saveWritingAnalysis(
        user?.id,
        task.id,
        task.title,
        task.taskType,
        wordCount,
        timeSpent,
        timerEnabled,
        answer,
        result,
        undefined,
        task,
      )
      accountStorageFor(user?.id ?? 'guest').removeItem(draftKey)
      // Keep the submitted report and its paper available after refresh.
      if (user) {
        void learningCenterApi.syncResult({
          sourceKey: savedEntry.attemptKey,
          sourceType: 'IELTS_WRITING_AI_EVALUATION',
          examType: 'IELTS',
          skill: 'IELTS_WRITING',
          title: task.title,
          score: result.overallBand,
          maxScore: 9,
          durationSec: timeSpent,
          completedAt: savedEntry.savedAt,
          assignmentId: searchParams.get('assignmentId') ?? undefined,
          breakdown: {
            testId: task.id,
            taskType: task.taskType,
            taskAchievement: result.taskAchievement,
            coherenceCohesion: result.coherenceCohesion,
            lexicalResource: result.lexicalResource,
            grammaticalRange: result.grammaticalRange,
            wordCount,
          },
        }).catch(() => {})
        void recordXpActivity({
          source: 'WRITING',
          eventKey: savedEntry.attemptKey,
          band: result.overallBand,
          durationSec: timeSpent,
          metadata: {
            testId: task.id,
            taskType: task.taskType,
            band: result.overallBand,
            wordCount,
          },
        }).then((reward) => {
          if (useAuthStore.getState().user?.id !== user.id) return
          markXpActivitySynced(user.id, savedEntry.attemptKey)
          updateUserProgress({ xp: reward.totalXp, level: reward.level })
        }).catch(() => {})
      }
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : 'AI evaluation failed. Please try again.')
    } finally {
      submittingRef.current = false
      setEvaluating(false)
    }
  }, [answer, task, timerEnabled, timeRemaining, wordCount, user, updateUserProgress, effectiveDuration, searchParams, writingTrial.locked, writingTrial.consume, draftKey, sessionKey])

  useEffect(() => {
    if (phase === 'writing' && timerEnabled && timeRemaining === 0 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      void handleSubmit()
    }
  }, [handleSubmit, phase, timeRemaining, timerEnabled])

  if (phase === 'landing') {
    return (
      <div className="min-h-screen bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)] flex items-center justify-center p-6 relative overflow-hidden">
        <AnimatePresence>
          {isLaunching ? (
            <TestLaunchOverlay title={uiCopy("Your test will begin shortly")} subtitle="Preparing your Writing task" />
          ) : null}
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl" />
        </div>

        <div className="max-w-4xl w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tight bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 bg-clip-text text-transparent">
              IELTS Writing {task.taskType === 'task1' ? 'Task 1' : 'Task 2'}
            </h1>
            <p className="text-slate-500 text-base font-light max-w-xl mx-auto">
              {task.taskType === 'task1'
                ? 'Summarise visual information in at least 150 words. Choose your preferred mode below.'
                : 'Write an essay of at least 250 words in response to a point of view, argument, or problem.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStart(true)}
              className="group relative overflow-hidden rounded-3xl border border-red-100 bg-white/95 p-8 text-left shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)] backdrop-blur-xl transition-all cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-rose-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                    <Timer className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900"><UiText text={"Simulation Mode"} /></h3>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      <UiText text={"Exam Simulation"} />
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                  <UiText text={"Practice under real exam conditions with a"} /> {task.durationMinutes}<UiText text={"-minute countdown timer. Build your time management skills."} />
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <UiText text={"Strict"} /> {task.durationMinutes}<UiText text={"-minute limit"} />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <UiText text={"Real-time word counter"} />
                  </div>
                </div>
                <div className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:from-red-500 group-hover:to-rose-500 transition-all">
                  <UiText text={"Start Simulation"} />
                </div>
              </div>
            </motion.button>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleStart(false)}
              className="group relative overflow-hidden rounded-3xl border border-red-100 bg-white/95 p-8 text-left shadow-[0_24px_55px_-36px_rgba(239,68,68,0.35)] backdrop-blur-xl transition-all cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                    <TimerOff className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900"><UiText text={"Practice Mode"} /></h3>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                      <UiText text={"No Time Limit"} />
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                  <UiText text={"Write at your own pace without time pressure. Perfect for learning structure and vocabulary."} />
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <UiText text={"Unlimited writing time"} />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <UiText text={"Focus on quality and structure"} />
                  </div>
                </div>
                <div className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:from-orange-400 group-hover:to-amber-400 transition-all">
                  <UiText text={"Start Practice"} />
                </div>
              </div>
            </motion.button>
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              type="button"
              onClick={onExit}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2 mx-auto px-6 py-2 rounded-full border border-slate-200 hover:border-red-200 hover:bg-red-50/30"
            >
              <ArrowLeft className="w-4 h-4" /> <UiText text={"Return to Writing Tests"} />
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (phase === 'submitted') {
    const timeSpentDisplay = timerEnabled ? formatTime(effectiveDuration * 60 - timeRemaining) : null

    // ── Loading state while AI evaluates ──
    if (evaluating) return <AssessmentPending />

    if (evalError) {
      return (
        <div className="min-h-screen bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-[0_30px_60px_rgba(220,38,38,0.15)]"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-2xl font-black text-slate-900"><UiText text={"Evaluation Failed"} /></h2>
            <p className="mt-2 text-sm text-slate-600">{evalError}</p>
            <SubmittedWritingAnswers tasks={[task]} answers={{ [task.id]: answer }} />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-105 transition"
              >
                <RotateCcw className="h-4 w-4" />
                <UiText text={"Retry Evaluation"} />
              </button>
              <button
                type="button"
                onClick={() => setPhase('writing')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Pen className="h-4 w-4" />
                <UiText text={"Back to Editing"} />
              </button>
            </div>
          </motion.div>
        </div>
      )
    }

    // ── Full AI results ──
    const ev = aiEvaluation
    const bandColor = (b: number) =>
      b >= 7 ? 'from-emerald-500 to-green-600' : b >= 5.5 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600'

    return (
      <div className="workspace-page ielts-writing-review min-h-screen relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-orange-200/20 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-red-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <UiText text={"Back to Tests"} />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAnswer('')
                  setAiEvaluation(null)
                  setEvalError(null)
                  setTimeRemaining(task.durationMinutes * 60)
                  setPhase('landing')
                  autoSubmittedRef.current = false
                  accountStorageFor(user?.id ?? 'guest').removeItem(draftKey)
                  accountStorageFor(user?.id ?? 'guest').removeItem(sessionKey)
                  clearActiveTestPaper(sessionKey, user?.id ?? 'guest')
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-105 transition"
              >
                <RotateCcw className="h-4 w-4" />
                <UiText text={"Try Again"} />
              </button>
            </div>
          </div>

          {ev && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <details className="ir-glass p-5"><summary className="cursor-pointer font-bold"><UiText text={"Test leaderboard"} /></summary><div className="mt-5"><TestLeaderboard testId={task.id} title={task.title} /></div></details>
              {/* Hero: overall band + XP */}
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-white p-6 shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)]">
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${bandColor(ev.overallBand)}`} />
                  <div className="flex items-center gap-6">
                    <BandScoreRing score={ev.overallBand} label={uiCopy("Estimated task band")} size="lg" />
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-700">
                        <Sparkles className="h-3 w-3" />
                        <UiText text={"AI Evaluation"} />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <h2 className="text-2xl font-black text-slate-900"><UiText text={"Band"} /> {ev.overallBand.toFixed(1)}</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                          {bandLabel(ev.overallBand)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{ev.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-[0_24px_55px_-36px_rgba(245,158,11,0.5)]">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                      <Trophy className="h-7 w-7" />
                    </div>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-amber-600"><UiText text={"XP Earned"} /></p>
                    <p className="text-4xl font-black text-slate-900">
                      +{ev.xpAwarded}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700">
                      <Zap className="h-3 w-3 fill-amber-500 text-amber-600" />
                      <UiText text={"Total:"} /> {getWritingXP(user?.id)} XP
                    </div>
                  </div>
                </div>
              </div>

              {/* Criteria breakdown */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
                  <Target className="h-4 w-4 text-red-500" />
                  <UiText text={"Band Breakdown"} />
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <BandScoreRing score={ev.taskAchievement} label={task.taskType === 'task1' ? 'Task Achievement' : 'Task Response'} />
                  <BandScoreRing score={ev.coherenceCohesion} label={uiCopy("Coherence")} />
                  <BandScoreRing score={ev.lexicalResource} label={uiCopy("Vocabulary")} />
                  <BandScoreRing score={ev.grammaticalRange} label={uiCopy("Grammar")} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> {wordCount} <UiText text={"words"} /></span>
                  {timeSpentDisplay && <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {timeSpentDisplay}</span>}
                  <span className="inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> {ev.errors.length} <UiText text={"corrections"} /></span>
                </div>
              </div>

              <WritingScoreExplanation feedback={ev.criterionFeedback} taskType={task.taskType} />
              {/* Strengths + Improvements */}
              <details className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
                <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review task prompt"} /></summary>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">{task.prompt}</p>
              </details>
              {task.chart?.type === 'line' ? (
                <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 chart"} /></summary>
                  <div className="mt-4"><LineChart chart={task.chart} /></div>
                </details>
              ) : null}
              {task.diagram ? (
                <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 chart"} /></summary>
                  <div className="mx-auto mt-4 max-w-[650px]"><WritingTaskDiagram diagram={task.diagram} /></div>
                </details>
              ) : null}
              {task.visual ? (
                <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 data"} /></summary>
                  <div className="mx-auto mt-4 max-w-[750px]"><WritingDataVisual visual={task.visual} /></div>
                </details>
              ) : null}
              {task.imageUrl ? (
                <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="cursor-pointer text-sm font-bold text-slate-800"><UiText text={"Review Task 1 image"} /></summary>
                  <WritingTaskImage task={task} className="mx-auto mt-4 h-auto max-w-full" />
                </details>
              ) : null}
              <WritingReviewWorkbench evaluation={ev} original={answer} />

              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-center text-xs text-blue-700">
                <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                <UiText text={"This evaluation has been saved to"} /> <strong><UiText text={"Analyze Mistakes"} /></strong><UiText text={". Your XP counts toward the leaderboard."} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ielts-writing-workspace flex h-dvh min-h-0 flex-col bg-white">
      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
              onClick={() => setShowSubmitConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              className="relative w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-[0_30px_70px_rgba(16,185,129,0.2)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-emerald-500 to-green-500" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Send className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-900"><UiText text={"Submit your response?"} /></h3>
              <p className="mt-2 text-sm text-slate-600">
                <UiText text={"You've written"} /> <strong>{wordCount}</strong> <UiText text={"words."} />
                {wordCount < minWords && (
                  <span className="text-amber-600">
                    {' '}
                    <UiText text={"The suggested minimum is"} /> {minWords} <UiText text={"words."} />
                  </span>
                )}
              </p>
              {!writingTrial.isPremium && Number.isFinite(writingTrial.remaining) ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                  <Sparkles className="h-3 w-3" />
                  {Math.max(0, writingTrial.remaining)} <UiText text={"of"} /> {writingTrial.limit} <UiText text={"free AI checks left"} />
                </span>
              ) : null}
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <UiText text={"Keep Writing"} />
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-105"
                >
                  <UiText text={"Submit"} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWritingGate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
              onClick={() => setShowWritingGate(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-amber-200 bg-white p-7 text-center shadow-[0_34px_78px_rgba(127,29,29,0.28)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-red-500 to-rose-500" />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-[0_16px_32px_rgba(245,158,11,0.4)]">
                <Crown className="h-8 w-8" />
              </div>
              <span className="premium-top-chip mt-5 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <UiText text={"Premium only"} />
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900"><UiText text={"Free AI checks used up"} /></h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                <UiText text={"You've used your"} /> {writingTrial.limit} <UiText text={"free AI writing evaluations. Subscribe to Premium for unlimited instant band scores, full error analysis and corrected versions."} />
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <a
                  href="/premium"
                  className="cta-sheen inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(220,38,38,0.34)]"
                >
                  <Crown className="h-4 w-4" />
                  <UiText text={"Subscribe to Premium"} />
                </a>
                <button
                  type="button"
                  onClick={() => setShowWritingGate(false)}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <UiText text={"Maybe later"} />
                </button>
              </div>
              <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Lock className="h-3 w-3" />
                <UiText text={"Your writing is saved — upgrade anytime to score it"} />
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <WritingWorkspace
        title={task.title}
        tasks={[{ id: task.id, label: task.taskType === 'task1' ? 'Task 1' : 'Task 2', minutes: task.durationMinutes, minimum: minWords, words: wordCount, marked: bookmarked }]}
        activeIndex={0}
        onExit={onExit}
        onBookmark={() => setBookmarked(value => !value)}
        timed={timerEnabled}
        seconds={timeRemaining}
        answer={answer}
        onAnswerChange={setAnswer}
        textareaRef={textareaRef}
        action={<button type="button" onClick={() => setShowSubmitConfirm(true)} className="writing-primary"><Send size={15} /><UiText text={"Submit"} /></button>}
        prompt={<>
          <WritingTaskPrompt task={task} />

          {task.chart && task.chart.type === 'line' && (
            <div className="writing-source-visual">
              <LineChart chart={task.chart} />
            </div>
          )}
          {task.diagram ? (
            <div className="writing-source-visual">
              <WritingTaskDiagram diagram={task.diagram} />
            </div>
          ) : null}
          {task.visual ? (
            <div className="writing-source-visual">
              <WritingDataVisual visual={task.visual} />
            </div>
          ) : null}
          {task.imageUrl ? (
            <div className="writing-source-visual">
              <WritingTaskImage task={task} className="mx-auto h-auto max-w-full" />
            </div>
          ) : null}
        </>}
      />
    </div>
  )
}
