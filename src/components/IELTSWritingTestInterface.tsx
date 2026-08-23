import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  BookmarkIcon,
  RotateCcw,
  Send,
  Timer,
  TimerOff,
  AlertTriangle,
  CheckCircle2,
  PenLine,
  Sparkles,
  Target,
  BookOpen,
  Type,
  Pen,
  Trophy,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  Loader2,
  Crown,
  Lock,
} from 'lucide-react'
import { evaluateWriting, type WritingEvaluation, type WritingError } from '@/services/geminiAI'
import { saveWritingAnalysis, getWritingXP } from '@/utils/writingAnalysisStorage'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useBadgeStore } from '@/store/badgeStore'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import type { WritingTask, LineChartData, ChartSeries } from '@/data/writingTestData'
import TestLaunchOverlay from '@/components/common/TestLaunchOverlay'
import { markXpActivitySynced, recordXpActivity } from '@/lib/xpApi'

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

const ERROR_CATEGORY_META: Record<string, { label: string; color: string }> = {
  grammar: { label: 'Grammar', color: 'bg-red-100 text-red-700 border-red-200' },
  vocabulary: { label: 'Vocabulary', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  spelling: { label: 'Spelling', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  punctuation: { label: 'Punctuation', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  coherence: { label: 'Coherence', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  task: { label: 'Task', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
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

function ErrorCard({ error, index }: { error: WritingError; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const categoryColors: Record<string, string> = {
    grammar: 'border-red-200 bg-red-50 text-red-700',
    vocabulary: 'border-violet-200 bg-violet-50 text-violet-700',
    spelling: 'border-orange-200 bg-orange-50 text-orange-700',
    punctuation: 'border-amber-200 bg-amber-50 text-amber-700',
    coherence: 'border-blue-200 bg-blue-50 text-blue-700',
    task: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/50 transition"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-[10px] font-bold text-red-700">
          {index + 1}
        </span>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold capitalize ${categoryColors[error.category] || categoryColors.grammar}`}>
          {error.category}
        </span>
        <span className="flex-1 truncate text-sm text-slate-700">{error.original}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-2">
          <div className="rounded-lg bg-red-50/70 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Original</p>
            <p className="text-sm text-red-800 line-through">{error.original}</p>
          </div>
          <div className="rounded-lg bg-emerald-50/70 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Corrected</p>
            <p className="text-sm text-emerald-800 font-medium">{error.corrected}</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{error.explanation}</p>
        </div>
      )}
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
  const [phase, setPhase] = useState<'landing' | 'writing' | 'submitted'>('landing')
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(task.durationMinutes * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [answer, setAnswer] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [aiEvaluation, setAiEvaluation] = useState<WritingEvaluation | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [showCorrected, setShowCorrected] = useState(false)
  const [copiedCorrected, setCopiedCorrected] = useState(false)
  const autoStartHandled = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isLaunching, setIsLaunching] = useState(false)
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const user = useAuthStore((state: AuthState) => state.user)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const awardBadge = useBadgeStore((s) => s.awardIfEligible)
  const writingTrial = useFeatureTrial('writing')
  const [showWritingGate, setShowWritingGate] = useState(false)
  const wordCount = countWords(answer)
  const { min: minWords, max: maxWords } = task.suggestedWordCount
  const effectiveDuration = autoDurationMinutes && autoDurationMinutes > 0 ? autoDurationMinutes : task.durationMinutes

  useEffect(() => {
    if (!isTimerRunning || !timerEnabled) return
    if (timeRemaining <= 0) {
      setIsTimerRunning(false)
      return
    }
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isTimerRunning, timerEnabled, timeRemaining])

  const handleStart = useCallback(
    (withTimer: boolean) => {
      // Brief "your test will begin shortly" loader before the writing workspace.
      setIsLaunching(true)
      if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
      launchTimerRef.current = setTimeout(() => {
        setTimerEnabled(withTimer)
        setTimeRemaining(effectiveDuration * 60)
        setIsTimerRunning(withTimer)
        setPhase('writing')
        setIsLaunching(false)
        launchTimerRef.current = null
        setTimeout(() => textareaRef.current?.focus(), 100)
      }, 2000)
    },
    [effectiveDuration],
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

  const handleReset = useCallback(() => {
    setTimeRemaining(effectiveDuration * 60)
    setIsTimerRunning(timerEnabled)
  }, [effectiveDuration, timerEnabled])

  const handleSubmit = useCallback(async () => {
    // Non-premium learners get a limited number of free AI checks. Once spent,
    // show the premium gate instead of running another evaluation.
    if (writingTrial.locked) {
      setShowSubmitConfirm(false)
      setShowWritingGate(true)
      return
    }

    setIsTimerRunning(false)
    setPhase('submitted')
    setShowSubmitConfirm(false)
    setEvaluating(true)
    setEvalError(null)
    writingTrial.consume()

    try {
      const result = await evaluateWriting(task.taskType, task.prompt, answer, wordCount)
      setAiEvaluation(result)

      // Timed (exam) writing → award an IELTS Writing band badge with celebration.
      // Untimed practice passes mode 'practice', which never awards a badge.
      awardBadge({
        userId: user?.id ?? null,
        track: 'IELTS_WRITING',
        band: result.overallBand,
        mode: timerEnabled ? 'exam' : 'practice',
        source: 'ielts-writing',
      })

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
      )
      if (user) {
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
          markXpActivitySynced(user.id, savedEntry.attemptKey)
          updateUserProgress({ xp: reward.totalXp, level: reward.level })
        }).catch(() => {})
      }
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : 'AI evaluation failed. Please try again.')
    } finally {
      setEvaluating(false)
    }
  }, [answer, task, timerEnabled, timeRemaining, wordCount, user, updateUserProgress, effectiveDuration, writingTrial.locked, writingTrial.consume])

  const handleExitConfirm = useCallback(() => {
    setShowExitConfirm(false)
    onExit()
  }, [onExit])

  const handleCopyCorrected = useCallback(() => {
    if (!aiEvaluation?.correctedVersion) return
    navigator.clipboard.writeText(aiEvaluation.correctedVersion)
    setCopiedCorrected(true)
    setTimeout(() => setCopiedCorrected(false), 2000)
  }, [aiEvaluation])

  if (phase === 'landing') {
    return (
      <div className="min-h-screen bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)] flex items-center justify-center p-6 relative overflow-hidden">
        <AnimatePresence>
          {isLaunching ? (
            <TestLaunchOverlay title="Your test will begin shortly" subtitle="Preparing your Writing task" />
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
                    <h3 className="text-xl font-bold text-slate-900">Timed Mode</h3>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      Exam Simulation
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                  Practice under real exam conditions with a {task.durationMinutes}-minute countdown timer.
                  Build your time management skills.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Strict {task.durationMinutes}-minute limit
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Real-time word counter
                  </div>
                </div>
                <div className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:from-red-500 group-hover:to-rose-500 transition-all">
                  Start with Timer
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
                    <h3 className="text-xl font-bold text-slate-900">Free Mode</h3>
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                      No Time Limit
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                  Write at your own pace without time pressure. Perfect for learning structure and
                  vocabulary.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Unlimited writing time
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Focus on quality and structure
                  </div>
                </div>
                <div className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:from-orange-400 group-hover:to-amber-400 transition-all">
                  Start Without Timer
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
              <ArrowLeft className="w-4 h-4" /> Return to Writing Tests
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (phase === 'submitted') {
    const timeSpentDisplay = timerEnabled ? formatTime(effectiveDuration * 60 - timeRemaining) : null

    // ── Loading state while AI evaluates ──
    if (evaluating) {
      return (
        <div className="min-h-screen bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)] flex items-center justify-center p-6 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl animate-pulse" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl animate-pulse" />
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md rounded-3xl border border-red-100 bg-white/95 p-10 text-center shadow-[0_30px_70px_rgba(220,38,38,0.18)] backdrop-blur-xl"
          >
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-rose-500 opacity-20 animate-ping" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30">
                <Sparkles className="h-9 w-9 animate-pulse" />
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-black text-slate-900">AI is analyzing your writing</h2>
            <p className="mt-2 text-sm text-slate-500">
              Our examiner is scoring your response against official IELTS band descriptors, finding every
              mistake, and preparing a corrected version...
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-red-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              This usually takes 10–20 seconds
            </div>
          </motion.div>
        </div>
      )
    }

    // ── Error state ──
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
            <h2 className="mt-5 text-2xl font-black text-slate-900">Evaluation Failed</h2>
            <p className="mt-2 text-sm text-slate-600">{evalError}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void handleSubmit()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-105 transition"
              >
                <RotateCcw className="h-4 w-4" />
                Retry Evaluation
              </button>
              <button
                type="button"
                onClick={() => setPhase('writing')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Pen className="h-4 w-4" />
                Back to Editing
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
      <div className="min-h-screen bg-[linear-gradient(160deg,#fff7f7_0%,#fef2f2_45%,#fff_100%)] relative overflow-hidden">
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
              Back to Tests
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
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-105 transition"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>

          {ev && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Hero: overall band + XP */}
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-white p-6 shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)]">
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${bandColor(ev.overallBand)}`} />
                  <div className="flex items-center gap-6">
                    <BandScoreRing score={ev.overallBand} label="Overall Band" size="lg" />
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-700">
                        <Sparkles className="h-3 w-3" />
                        AI Evaluation
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <h2 className="text-2xl font-black text-slate-900">Band {ev.overallBand.toFixed(1)}</h2>
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
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-amber-600">XP Earned</p>
                    <p className="text-4xl font-black text-slate-900">
                      +{ev.xpAwarded}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-700">
                      <Zap className="h-3 w-3 fill-amber-500 text-amber-600" />
                      Total: {getWritingXP(user?.id)} XP
                    </div>
                  </div>
                </div>
              </div>

              {/* Criteria breakdown */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
                  <Target className="h-4 w-4 text-red-500" />
                  Band Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <BandScoreRing score={ev.taskAchievement} label="Task Response" />
                  <BandScoreRing score={ev.coherenceCohesion} label="Coherence" />
                  <BandScoreRing score={ev.lexicalResource} label="Vocabulary" />
                  <BandScoreRing score={ev.grammaticalRange} label="Grammar" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> {wordCount} words</span>
                  {timeSpentDisplay && <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {timeSpentDisplay}</span>}
                  <span className="inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> {ev.errors.length} corrections</span>
                </div>
              </div>

              {/* Strengths + Improvements */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6">
                  <h3 className="flex items-center gap-2 text-base font-bold text-emerald-800 mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {ev.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6">
                  <h3 className="flex items-center gap-2 text-base font-bold text-amber-800 mb-3">
                    <TrendingUp className="h-5 w-5" />
                    How to Improve
                  </h3>
                  <ul className="space-y-2">
                    {ev.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Error analysis */}
              {ev.errors.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-1">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Mistake Analysis
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Tap each item to see the correction and explanation. {ev.errors.length} issues found.
                  </p>
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {Object.entries(
                      ev.errors.reduce<Record<string, number>>((acc, e) => {
                        acc[e.category] = (acc[e.category] || 0) + 1
                        return acc
                      }, {}),
                    ).map(([cat, count]) => {
                      const meta = ERROR_CATEGORY_META[cat] || ERROR_CATEGORY_META.grammar
                      return (
                        <span
                          key={cat}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.color}`}
                        >
                          {meta.label} · {count}
                        </span>
                      )
                    })}
                  </div>
                  <div className="space-y-2">
                    {ev.errors.map((error, i) => (
                      <ErrorCard key={i} error={error} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Corrected version */}
              {ev.correctedVersion && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <BookOpen className="h-5 w-5 text-emerald-500" />
                      Corrected Version
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyCorrected}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                      >
                        {copiedCorrected ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedCorrected ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCorrected(!showCorrected)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                      >
                        {showCorrected ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {showCorrected ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {showCorrected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                            {ev.correctedVersion}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Your original response */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
                  <PenLine className="h-4 w-4" />
                  Your Original Response
                </h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  {answer || '(empty)'}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-center text-xs text-blue-700">
                <Sparkles className="inline h-3.5 w-3.5 mr-1" />
                This evaluation has been saved to <strong>Analyze Mistakes</strong>. Your XP counts toward the leaderboard.
              </div>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  const timerColor =
    timerEnabled && timeRemaining < 120
      ? 'text-red-600'
      : timerEnabled && timeRemaining < 300
        ? 'text-amber-600'
        : 'text-slate-700'

  const wordCountColor =
    wordCount >= minWords && wordCount <= maxWords
      ? 'text-emerald-600'
      : wordCount > maxWords
        ? 'text-amber-600'
        : 'text-slate-500'

  return (
    <div className="flex h-screen flex-col bg-white">
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
              onClick={() => setShowExitConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              className="relative w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 text-center shadow-[0_30px_70px_rgba(220,38,38,0.22)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-3xl bg-gradient-to-r from-red-600 via-rose-500 to-orange-400" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-900">Leave this test?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Your response will be lost. Are you sure you want to exit?
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Continue Writing
                </button>
                <button
                  type="button"
                  onClick={handleExitConfirm}
                  className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-105"
                >
                  Exit Test
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <h3 className="mt-4 text-xl font-black text-slate-900">Submit your response?</h3>
              <p className="mt-2 text-sm text-slate-600">
                You've written <strong>{wordCount}</strong> words.
                {wordCount < minWords && (
                  <span className="text-amber-600">
                    {' '}
                    The suggested minimum is {minWords} words.
                  </span>
                )}
              </p>
              {!writingTrial.isPremium && Number.isFinite(writingTrial.remaining) ? (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                  <Sparkles className="h-3 w-3" />
                  {Math.max(0, writingTrial.remaining)} of {writingTrial.limit} free AI checks left
                </span>
              ) : null}
              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Keep Writing
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-105"
                >
                  Submit
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
                Premium only
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Free AI checks used up</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You&apos;ve used your {writingTrial.limit} free AI writing evaluations. Subscribe to Premium for
                unlimited instant band scores, full error analysis and corrected versions.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <a
                  href="/premium"
                  className="cta-sheen inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(220,38,38,0.34)]"
                >
                  <Crown className="h-4 w-4" />
                  Subscribe to Premium
                </a>
                <button
                  type="button"
                  onClick={() => setShowWritingGate(false)}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Maybe later
                </button>
              </div>
              <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Lock className="h-3 w-3" />
                Your writing is saved — upgrade anytime to score it
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-white via-red-50/30 to-white px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (answer.trim() ? setShowExitConfirm(true) : onExit())}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-slate-600 shadow-sm hover:bg-red-50 hover:text-red-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900">
              {task.title} · {task.taskType === 'task1' ? 'Task 1' : 'Task 2'}
            </h1>
            <p className="text-[11px] text-slate-500">{task.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timerEnabled && (
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 font-mono text-base font-black ${timerColor} shadow-sm`}
              >
                <Clock className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setBookmarked(!bookmarked)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition ${
              bookmarked
                ? 'border-amber-300 bg-amber-100 text-amber-700'
                : 'border-red-200 bg-white text-slate-500 hover:text-amber-600 hover:border-amber-300'
            }`}
          >
            <BookmarkIcon className="h-4 w-4" fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-y-auto border-r border-red-100 bg-gradient-to-b from-white via-red-50/20 to-white p-5 sm:p-6 lg:p-8">
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-line">
              {task.prompt}
            </p>
          </div>

          {task.chart && task.chart.type === 'line' && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <LineChart chart={task.chart} />
            </div>
          )}
        </div>

        <div className="flex w-1/2 flex-col bg-gradient-to-b from-white via-slate-50/30 to-white">
          <div className="flex-1 overflow-hidden p-5 sm:p-6 lg:p-8">
            <div className="relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your response here..."
                className="flex-1 resize-none p-5 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none"
              />
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                <span className="text-xs text-slate-500">
                  Suggested word count: {minWords}–{maxWords}
                </span>
                <span className={`text-xs font-bold ${wordCountColor}`}>
                  {wordCount}/{task.maxWordCount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-slate-400" />
              <span className={`text-sm font-semibold ${wordCountColor}`}>
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </span>
              {wordCount >= minWords && wordCount <= maxWords && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Good range
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-105 transition"
            >
              <Send className="h-4 w-4" />
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
