import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Calculator,
  Check,
  ChevronDown,
  Clock3,
  EyeOff,
  Flag,
  Highlighter,
  Lightbulb,
  ListChecks,
  NotebookPen,
  PauseCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  X,
  ZoomIn,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BrandLockup } from '@/components/brand/BrandLogo'
import DesmosDrawer from '@/components/sat/DesmosDrawer'
import SATQuestionCanvas from '@/components/sat/SATQuestionCanvas'
import SATReview from '@/components/sat/SATReview'
import {
  SAT_PRACTICE_TEST_4_MODULES,
  isSATAnswerCorrect,
  type HighlightStroke,
  type SATAttempt,
} from '@/features/sat/practiceTest4'
import {
  clearSATPracticeTest4Attempt,
  loadSATPracticeTest4Attempt,
  saveSATPracticeTest4Attempt,
} from '@/features/sat/attemptStorage'
import { useFullscreen } from '@/hooks/useFullscreen'

const HIGHLIGHT_COLORS = ['#fde047', '#86efac', '#7dd3fc', '#f9a8d4']

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

function fullscreenElement() {
  const webkitDocument = document as Document & { webkitFullscreenElement?: Element | null }
  return document.fullscreenElement ?? webkitDocument.webkitFullscreenElement ?? null
}

export default function SATMockRun() {
  const navigate = useNavigate()
  const { isFullscreen, enter, exit } = useFullscreen()
  const [attempt, setAttempt] = useState<SATAttempt | null>(() => loadSATPracticeTest4Attempt())
  const [now, setNow] = useState(Date.now())
  const [timerVisible, setTimerVisible] = useState(true)
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [highlightEnabled, setHighlightEnabled] = useState(false)
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0])
  const [zoom, setZoom] = useState(1)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [checkedQuestions, setCheckedQuestions] = useState<string[]>([])
  const [violationDeadline, setViolationDeadline] = useState<number | null>(null)
  const violationFrozenRef = useRef(false)

  const moduleIndex = attempt?.currentModuleIndex ?? 0
  const currentModule = SAT_PRACTICE_TEST_4_MODULES[moduleIndex] ?? SAT_PRACTICE_TEST_4_MODULES[0]
  const questionIndex = Math.min(
    attempt?.currentQuestionIndex ?? 0,
    currentModule.questions.length - 1,
  )
  const currentQuestion = currentModule.questions[questionIndex]
  const currentAnswer = attempt?.answers[currentQuestion.id] ?? ''
  const currentStrokes = attempt?.highlights[currentQuestion.id] ?? []
  const isFlagged = attempt?.flagged.includes(currentQuestion.id) ?? false
  const answeredInModule = currentModule.questions.filter(
    (question) => attempt?.answers[question.id]?.trim(),
  ).length
  const violationSeconds = violationDeadline
    ? Math.max(0, Math.ceil((violationDeadline - now) / 1000))
    : 0

  const moduleSeconds = useMemo(() => {
    if (!attempt) return currentModule.durationSeconds
    if (attempt.mode === 'exam') {
      if (violationDeadline && attempt.pausedModuleSeconds !== undefined) {
        return attempt.pausedModuleSeconds
      }
      const deadline = attempt.moduleDeadlines[currentModule.id]
      return deadline
        ? Math.max(0, Math.ceil((deadline - now) / 1000))
        : currentModule.durationSeconds
    }
    const started = attempt.moduleStartedAt[currentModule.id] ?? attempt.startedAt
    return Math.max(0, Math.floor((now - started) / 1000))
  }, [attempt, currentModule, now, violationDeadline])

  const persistUpdate = useCallback((updater: (current: SATAttempt) => SATAttempt) => {
    setAttempt((current) => {
      if (!current) return current
      return { ...updater(current), updatedAt: Date.now() }
    })
  }, [])

  const submitAttempt = useCallback(() => {
    persistUpdate((current) => ({
      ...current,
      status: 'submitted',
      submittedAt: Date.now(),
      pausedModuleSeconds: undefined,
    }))
    setModuleComplete(false)
    setConfirmSubmit(false)
    setNavigatorOpen(false)
    setNotesOpen(false)
    setCalculatorOpen(false)
    if (fullscreenElement()) void exit()
  }, [exit, persistUpdate])

  const advanceModule = useCallback(() => {
    if (!attempt) return
    const nextModuleIndex = attempt.currentModuleIndex + 1
    if (nextModuleIndex >= SAT_PRACTICE_TEST_4_MODULES.length) {
      submitAttempt()
      return
    }
    const nextModule = SAT_PRACTICE_TEST_4_MODULES[nextModuleIndex]
    const startedAt = Date.now()
    persistUpdate((current) => ({
      ...current,
      currentModuleIndex: nextModuleIndex,
      currentQuestionIndex: 0,
      moduleStartedAt: { ...current.moduleStartedAt, [nextModule.id]: startedAt },
      moduleDeadlines:
        current.mode === 'exam'
          ? {
              ...current.moduleDeadlines,
              [nextModule.id]: startedAt + nextModule.durationSeconds * 1000,
            }
          : current.moduleDeadlines,
      pausedModuleSeconds: undefined,
    }))
    setModuleComplete(false)
    setZoom(1)
    setHighlightEnabled(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [attempt, persistUpdate, submitAttempt])

  const endCurrentModule = useCallback(() => {
    if (moduleIndex === SAT_PRACTICE_TEST_4_MODULES.length - 1) {
      setConfirmSubmit(true)
    } else {
      setModuleComplete(true)
    }
  }, [moduleIndex])

  useEffect(() => {
    if (attempt) saveSATPracticeTest4Attempt(attempt)
  }, [attempt])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!attempt || attempt.status !== 'active' || attempt.mode !== 'exam') return
    const preventClose = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', preventClose)
    return () => window.removeEventListener('beforeunload', preventClose)
  }, [attempt])

  useEffect(() => {
    if (!attempt || attempt.status !== 'active' || attempt.mode !== 'exam') return

    if (!isFullscreen && !violationDeadline) {
      const deadline = attempt.moduleDeadlines[currentModule.id]
      const remaining = deadline
        ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
        : currentModule.durationSeconds
      violationFrozenRef.current = true
      persistUpdate((current) => ({
        ...current,
        pausedModuleSeconds: remaining,
        moduleDeadlines: { ...current.moduleDeadlines, [currentModule.id]: 0 },
      }))
      setViolationDeadline(Date.now() + 10_000)
      return
    }

    if (isFullscreen && violationDeadline) {
      const remaining = attempt.pausedModuleSeconds ?? currentModule.durationSeconds
      setViolationDeadline(null)
      violationFrozenRef.current = false
      persistUpdate((current) => ({
        ...current,
        pausedModuleSeconds: undefined,
        moduleDeadlines: {
          ...current.moduleDeadlines,
          [currentModule.id]: Date.now() + remaining * 1000,
        },
      }))
    }
  }, [
    attempt,
    currentModule.durationSeconds,
    currentModule.id,
    isFullscreen,
    persistUpdate,
    violationDeadline,
  ])

  useEffect(() => {
    if (!attempt || attempt.status !== 'active' || attempt.mode !== 'exam') return
    if (!violationDeadline || violationSeconds > 0) return
    setViolationDeadline(null)
    violationFrozenRef.current = false
    persistUpdate((current) => ({
      ...current,
      status: 'terminated',
      terminatedAt: Date.now(),
      terminationReason: 'Fullscreen recovery window expired.',
    }))
    if (fullscreenElement()) void exit()
  }, [attempt, exit, persistUpdate, violationDeadline, violationSeconds])

  useEffect(() => {
    if (
      !attempt ||
      attempt.status !== 'active' ||
      attempt.mode !== 'exam' ||
      violationDeadline ||
      moduleComplete ||
      confirmSubmit
    ) return
    if (moduleSeconds <= 0) endCurrentModule()
  }, [
    attempt,
    confirmSubmit,
    endCurrentModule,
    moduleComplete,
    moduleSeconds,
    violationDeadline,
  ])

  useEffect(() => {
    if (!attempt || attempt.status !== 'active') return
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        calculatorOpen ||
        notesOpen ||
        navigatorOpen ||
        violationDeadline
      ) {
        return
      }
      const key = event.key.toLowerCase()
      if (['a', 'b', 'c', 'd'].includes(key) && currentQuestion.kind === 'multiple-choice') {
        event.preventDefault()
        persistUpdate((current) => ({
          ...current,
          answers: { ...current.answers, [currentQuestion.id]: key.toUpperCase() },
        }))
      } else if (event.key === 'ArrowRight' && questionIndex < currentModule.questions.length - 1) {
        persistUpdate((current) => ({ ...current, currentQuestionIndex: current.currentQuestionIndex + 1 }))
      } else if (event.key === 'ArrowLeft' && questionIndex > 0) {
        persistUpdate((current) => ({ ...current, currentQuestionIndex: current.currentQuestionIndex - 1 }))
      } else if (key === 'f') {
        event.preventDefault()
        persistUpdate((current) => ({
          ...current,
          flagged: current.flagged.includes(currentQuestion.id)
            ? current.flagged.filter((id) => id !== currentQuestion.id)
            : [...current.flagged, currentQuestion.id],
        }))
      } else if (key === 'h') {
        event.preventDefault()
        setHighlightEnabled((value) => !value)
      } else if (key === 'n') {
        event.preventDefault()
        setNotesOpen(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [
    attempt,
    calculatorOpen,
    currentModule.questions.length,
    currentQuestion.id,
    currentQuestion.kind,
    navigatorOpen,
    notesOpen,
    persistUpdate,
    questionIndex,
    violationDeadline,
  ])

  if (!attempt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mt-4 text-2xl font-black">No SAT attempt found</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Choose Practice or Exam Mode before opening the test.</p>
          <button type="button" onClick={() => navigate('/mock/sat')} className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white">
            Choose test mode
          </button>
        </div>
      </main>
    )
  }

  if (attempt.status === 'submitted') {
    return (
      <SATReview
        attempt={attempt}
        onStartAgain={() => {
          clearSATPracticeTest4Attempt()
          navigate('/mock/sat')
        }}
      />
    )
  }

  if (attempt.status === 'terminated') {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(239,68,68,.22),transparent_42%)]" />
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-lg rounded-[2rem] border border-white/15 bg-white/8 p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,.35)] backdrop-blur-2xl sm:p-10"
        >
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/15 text-red-300 ring-1 ring-red-400/25">
            <ShieldAlert className="h-8 w-8" />
          </span>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-red-300">Exam integrity</p>
          <h1 className="mt-2 text-3xl font-black">Attempt ended</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-white/65">
            You did not return to fullscreen within the 10-second recovery window. This exam attempt
            has been locked and cannot be resumed.
          </p>
          <button
            type="button"
            onClick={() => {
              clearSATPracticeTest4Attempt()
              navigate('/sat')
            }}
            className="mt-6 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-slate-950"
          >
            Return to SAT Arena
          </button>
        </motion.section>
      </main>
    )
  }

  const updateAnswer = (value: string) => {
    setCheckedQuestions((current) => current.filter((id) => id !== currentQuestion.id))
    persistUpdate((current) => ({
      ...current,
      answers: { ...current.answers, [currentQuestion.id]: value },
    }))
  }

  const goToQuestion = (index: number) => {
    persistUpdate((current) => ({ ...current, currentQuestionIndex: index }))
    setNavigatorOpen(false)
    setZoom(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changeHighlights = (strokes: HighlightStroke[]) => {
    persistUpdate((current) => ({
      ...current,
      highlights: { ...current.highlights, [currentQuestion.id]: strokes },
    }))
  }

  const timerProgress =
    attempt.mode === 'exam'
      ? Math.max(0, Math.min(1, moduleSeconds / currentModule.durationSeconds))
      : 1
  const practiceChecked = checkedQuestions.includes(currentQuestion.id)
  const practiceCorrect = practiceChecked && isSATAnswerCorrect(currentQuestion, currentAnswer)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(145deg,#f0f9ff_0%,#f8fafc_46%,#fff5f4_100%)] text-slate-950">
      <header className="sticky top-0 z-[80] border-b border-white/80 bg-white/82 px-3 py-2 shadow-[0_10px_35px_rgba(15,23,42,.08)] backdrop-blur-2xl sm:px-5">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-3">
          <BrandLockup iconSize={38} titleClassName="text-base sm:text-lg" subtitle={currentModule.title} subtitleClassName="hidden text-[9px] sm:block" />
          <button
            type="button"
            onClick={() => setNavigatorOpen(true)}
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600 shadow-sm md:inline-flex"
          >
            <ListChecks className="h-3.5 w-3.5 text-red-500" />
            Question {questionIndex + 1} of {currentModule.questions.length}
            <ChevronDown className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-2">
            <span className={`hidden rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-[0.13em] sm:inline-flex ${
              attempt.mode === 'exam' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {attempt.mode === 'exam' ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> : <PauseCircle className="mr-1.5 h-3.5 w-3.5" />}
              {attempt.mode} mode
            </span>
            {currentModule.section === 'math' ? (
              <button
                type="button"
                aria-label="Open calculator"
                onClick={() => setCalculatorOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-3 py-2 text-[10px] font-black text-white shadow-[0_9px_22px_rgba(220,38,38,.25)] sm:px-4"
              >
                <Calculator className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Calculator</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setTimerVisible((value) => !value)}
              className="relative flex h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white px-2 shadow-sm"
              title={timerVisible ? 'Hide timer' : 'Show timer'}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: `conic-gradient(#dc2626 ${timerProgress * 360}deg,#e2e8f0 0deg)` }}
              />
              <span className="absolute inset-[3px] rounded-full bg-white" />
              <span className="relative text-[10px] font-black tabular-nums">
                {timerVisible ? formatTime(moduleSeconds) : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[100rem] px-3 py-3 pb-24 sm:px-5 sm:py-5 sm:pb-24">
        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <article className="w-full min-w-0 rounded-[1.8rem] border border-white/90 bg-white/78 p-3 shadow-[0_22px_60px_rgba(15,23,42,.09)] backdrop-blur-xl sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-600">{currentModule.shortTitle}</p>
                <h1 className="mt-0.5 text-xl font-black">Question {currentQuestion.number}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHighlightEnabled((value) => !value)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-black ${
                    highlightEnabled ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <Highlighter className="h-3.5 w-3.5" /> Highlight
                </button>
                {highlightEnabled ? (
                  <div className="flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        aria-label={`Use ${color} highlighter`}
                        onClick={() => setHighlightColor(color)}
                        className={`h-5 w-5 rounded-full border-2 ${highlightColor === color ? 'border-slate-950' : 'border-white ring-1 ring-slate-200'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => changeHighlights(currentStrokes.slice(0, -1))}
                  disabled={currentStrokes.length === 0}
                  title="Undo last highlight"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-35"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => changeHighlights([])}
                  disabled={currentStrokes.length === 0}
                  title="Clear highlights"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-35"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.15).toFixed(2))))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500"
                  title="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                {zoom > 1 ? (
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-[9px] font-black text-slate-500"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                ) : null}
              </div>
            </div>

            <SATQuestionCanvas
              question={currentQuestion}
              answer={currentAnswer}
              onAnswer={updateAnswer}
              strokes={currentStrokes}
              highlightEnabled={highlightEnabled}
              highlightColor={highlightColor}
              zoom={zoom}
              onChange={changeHighlights}
            />
          </article>

          <aside className="min-w-0 space-y-3 xl:sticky xl:top-[5.5rem] xl:self-start">
            <div className="rounded-[1.5rem] border border-white/90 bg-white/82 p-4 shadow-[0_18px_42px_rgba(15,23,42,.08)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Your response</p>
                  <p className="mt-1 text-sm font-black">{currentQuestion.kind === 'multiple-choice' ? (currentAnswer ? `Choice ${currentAnswer} selected` : 'Select an answer in the question') : 'Enter your answer'}</p>
                </div>
                {currentAnswer ? (
                  <button type="button" onClick={() => updateAnswer('')} className="text-[9px] font-black text-red-600">Clear</button>
                ) : null}
              </div>

              {currentQuestion.kind === 'multiple-choice' ? (
                <div className="mt-4">
                  <div className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${currentAnswer ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-dashed border-slate-200 bg-slate-50 text-slate-500'}`}>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${currentAnswer ? 'bg-blue-600 text-white' : 'bg-white ring-1 ring-slate-200'}`}>{currentAnswer || '—'}</span>
                    <span className="text-[10px] font-black">{currentAnswer ? 'Response saved automatically' : 'No response yet'}</span>
                    {currentAnswer ? <Check className="ml-auto h-4 w-4" /> : null}
                  </div>
                  {attempt.mode === 'practice' ? (
                    <button
                      type="button"
                      disabled={!currentAnswer || practiceChecked}
                      onClick={() => setCheckedQuestions((current) => [...new Set([...current, currentQuestion.id])])}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[10px] font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <Lightbulb className="h-3.5 w-3.5" /> {practiceChecked ? 'Answer checked' : 'Check answer'}
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4">
                  <label htmlFor="student-response" className="sr-only">Student response</label>
                  <input
                    id="student-response"
                    value={currentAnswer}
                    onChange={(event) => updateAnswer(event.target.value)}
                    onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                      if (event.key === 'Enter' && questionIndex < currentModule.questions.length - 1) {
                        persistUpdate((current) => ({ ...current, currentQuestionIndex: current.currentQuestionIndex + 1 }))
                      }
                    }}
                    inputMode="decimal"
                    placeholder="e.g. 3/10 or 0.3"
                    className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-lg font-black text-slate-900 outline-none focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                  <p className="mt-2 text-[9px] font-semibold leading-4 text-slate-400">
                    Fractions and equivalent decimals are accepted. Do not enter mixed numbers or symbols.
                  </p>
                </div>
              )}
            </div>

            {attempt.mode === 'practice' && practiceChecked ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[1.5rem] border p-4 shadow-sm ${practiceCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${practiceCorrect ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {practiceCorrect ? <Sparkles className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className={`text-sm font-black ${practiceCorrect ? 'text-emerald-900' : 'text-amber-950'}`}>
                      {practiceCorrect ? 'Excellent — that is correct!' : 'Strong attempt — review the key idea.'}
                    </p>
                    <p className="mt-1 text-[10px] font-bold leading-5 text-slate-600">
                      {practiceCorrect ? 'You identified the right reasoning. Keep the momentum going.' : `The correct answer is ${currentQuestion.correctAnswer}. Study the explanation, then try the next question.`}
                    </p>
                  </div>
                </div>
                <details className="mt-3 rounded-xl border border-white/80 bg-white/75 px-3 py-2.5">
                  <summary className="cursor-pointer text-[10px] font-black text-slate-700">Step-by-step explanation</summary>
                  <p className="mt-2 text-[11px] font-medium leading-5 text-slate-600">{currentQuestion.explanation}</p>
                </details>
              </motion.div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
              <button
                type="button"
                onClick={() =>
                  persistUpdate((current) => ({
                    ...current,
                    flagged: current.flagged.includes(currentQuestion.id)
                      ? current.flagged.filter((id) => id !== currentQuestion.id)
                      : [...current.flagged, currentQuestion.id],
                  }))
                }
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-[10px] font-black ${
                  isFlagged ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-white bg-white/82 text-slate-600'
                }`}
              >
                <Flag className={`h-3.5 w-3.5 ${isFlagged ? 'fill-amber-500' : ''}`} />
                {isFlagged ? 'Flagged' : 'Mark for review'}
              </button>
              <button
                type="button"
                onClick={() => setNotesOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white bg-white/82 p-3 text-[10px] font-black text-slate-600"
              >
                <NotebookPen className="h-3.5 w-3.5 text-violet-600" />
                {attempt.notes[currentQuestion.id] ? 'Edit note' : 'Add note'}
              </button>
            </div>

            <div className="rounded-[1.4rem] border border-white/90 bg-white/75 p-4 shadow-sm">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                <span>Module progress</span>
                <span>{answeredInModule}/{currentModule.questions.length}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all"
                  style={{ width: `${(answeredInModule / currentModule.questions.length) * 100}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => setNavigatorOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-600"
              >
                <ListChecks className="h-3.5 w-3.5" /> Open question navigator
              </button>
            </div>
          </aside>
        </section>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/80 bg-white/88 px-3 py-2.5 shadow-[0_-12px_36px_rgba(15,23,42,.08)] backdrop-blur-2xl sm:px-5">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-2">
          <button
            type="button"
            disabled={questionIndex === 0}
            onClick={() => goToQuestion(questionIndex - 1)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            {currentModule.questions.slice(Math.max(0, questionIndex - 2), questionIndex + 3).map((question, index, visible) => {
              const actualIndex = currentModule.questions.indexOf(question)
              const answered = Boolean(attempt.answers[question.id]?.trim())
              const flagged = attempt.flagged.includes(question.id)
              return (
                <button
                  type="button"
                  key={question.id}
                  onClick={() => goToQuestion(actualIndex)}
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    actualIndex === questionIndex
                      ? 'bg-red-600 text-white shadow-[0_8px_20px_rgba(220,38,38,.28)]'
                      : answered
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {question.number}
                  {flagged ? <Bookmark className="absolute -right-0.5 -top-1 h-3 w-3 fill-amber-400 text-amber-500" /> : null}
                  {index < visible.length - 1 ? null : null}
                </button>
              )
            })}
          </div>
          {questionIndex < currentModule.questions.length - 1 ? (
            <button
              type="button"
              onClick={() => goToQuestion(questionIndex + 1)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-5 text-[11px] font-black text-white shadow-[0_10px_24px_rgba(220,38,38,.24)]"
            >
              <span className="hidden sm:inline">Next</span> <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={endCurrentModule}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-[11px] font-black text-white shadow-lg"
            >
              Review module <ListChecks className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </footer>

      <DesmosDrawer open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />

      <AnimatePresence>
        {navigatorOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/35 p-3 backdrop-blur-sm"
          >
            <motion.section
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,.28)]"
            >
              <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white to-red-50 px-5 py-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-red-600">{currentModule.shortTitle}</p>
                  <h2 className="mt-1 text-xl font-black">Question navigator</h2>
                </div>
                <button type="button" onClick={() => setNavigatorOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="max-h-[62vh] overflow-y-auto p-5">
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-11">
                  {currentModule.questions.map((question, index) => {
                    const answered = Boolean(attempt.answers[question.id]?.trim())
                    const flagged = attempt.flagged.includes(question.id)
                    return (
                      <button
                        type="button"
                        key={question.id}
                        onClick={() => goToQuestion(index)}
                        className={`relative aspect-square rounded-xl text-xs font-black ${
                          index === questionIndex
                            ? 'bg-red-600 text-white ring-4 ring-red-100'
                            : answered
                              ? 'bg-slate-950 text-white'
                              : 'border border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                      >
                        {question.number}
                        {flagged ? <Flag className="absolute right-1 top-1 h-2.5 w-2.5 fill-amber-400 text-amber-500" /> : null}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-5 flex flex-wrap gap-3 text-[9px] font-black text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-950" /> Answered</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-slate-300 bg-slate-50" /> Unanswered</span>
                  <span className="inline-flex items-center gap-1.5"><Flag className="h-3 w-3 fill-amber-400 text-amber-500" /> Flagged</span>
                </div>
              </div>
              <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
                <p className="text-[10px] font-bold text-slate-500">
                  {answeredInModule} answered · {currentModule.questions.length - answeredInModule} remaining
                </p>
                <button type="button" onClick={endCurrentModule} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[10px] font-black text-white">
                  Finish module
                </button>
              </footer>
            </motion.section>
          </motion.div>
        ) : null}

        {notesOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[145] flex items-end justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center"
          >
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-lg rounded-[1.8rem] border border-white/80 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,.28)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-600">Private note</p>
                  <h2 className="mt-1 text-xl font-black">Question {currentQuestion.number}</h2>
                </div>
                <button type="button" onClick={() => setNotesOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                autoFocus
                value={attempt.notes[currentQuestion.id] ?? ''}
                onChange={(event) =>
                  persistUpdate((current) => ({
                    ...current,
                    notes: { ...current.notes, [currentQuestion.id]: event.target.value },
                  }))
                }
                placeholder="Write your reasoning, a formula to revisit, or why an option felt tempting..."
                className="mt-4 min-h-44 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium leading-6 outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => setNotesOpen(false)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-[11px] font-black text-white">
                  Save note
                </button>
              </div>
            </motion.section>
          </motion.div>
        ) : null}

        {moduleComplete || confirmSubmit ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-md"
          >
            <motion.section
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_34px_100px_rgba(15,23,42,.34)] sm:p-8"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ListChecks className="h-7 w-7" />
              </span>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">
                {confirmSubmit ? 'Final submission' : 'Module ready'}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                {confirmSubmit ? 'Submit your SAT attempt?' : `${currentModule.shortTitle} complete`}
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                You answered {answeredInModule} of {currentModule.questions.length} questions.
                {currentModule.questions.length - answeredInModule > 0
                  ? ` ${currentModule.questions.length - answeredInModule} unanswered question(s) will remain blank.`
                  : ' Every question has a response.'}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModuleComplete(false)
                    setConfirmSubmit(false)
                    setNavigatorOpen(true)
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black text-slate-600"
                >
                  Review answers
                </button>
                <button
                  type="button"
                  onClick={confirmSubmit ? submitAttempt : advanceModule}
                  className="rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-4 py-3 text-[11px] font-black text-white shadow-[0_12px_26px_rgba(220,38,38,.24)]"
                >
                  {confirmSubmit ? 'Submit & score' : 'Continue to next module'}
                </button>
              </div>
              {!confirmSubmit && moduleIndex === 1 ? (
                <p className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-center text-[10px] font-bold text-blue-700">
                  Recommended: take a 10-minute break before beginning Math.
                </p>
              ) : null}
            </motion.section>
          </motion.div>
        ) : null}

        {violationDeadline ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/95 px-4 text-white"
          >
            <motion.section
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg text-center"
            >
              <div
                className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#ef4444 ${(violationSeconds / 10) * 360}deg,rgba(255,255,255,.1) 0deg)`,
                }}
              >
                <div className="absolute inset-2 rounded-full bg-slate-950" />
                <div className="relative">
                  <p className="text-6xl font-black tabular-nums">{violationSeconds}</p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">seconds</p>
                </div>
              </div>
              <ShieldAlert className="mx-auto mt-7 h-7 w-7 text-red-400" />
              <h1 className="mt-3 text-3xl font-black">Return to fullscreen</h1>
              <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-white/60">
                Your test and module timer are paused. Re-enter fullscreen before the countdown ends
                to continue from this exact question.
              </p>
              <button
                type="button"
                onClick={() => void enter()}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 shadow-xl"
              >
                <ZoomIn className="h-4 w-4" /> Re-enter fullscreen
              </button>
              <p className="mt-4 text-[10px] font-bold text-red-300">
                If time expires, this exam attempt will be terminated.
              </p>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
