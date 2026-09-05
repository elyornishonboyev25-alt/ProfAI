import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calculator,
  ChevronDown,
  EllipsisVertical,
  EyeOff,
  Flag,
  FileText,
  Highlighter,
  Lightbulb,
  ListChecks,
  NotebookPen,
  ShieldAlert,
  Sheet,
  Sparkles,
  Trash2,
  Undo2,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DesmosDrawer from '@/components/sat/DesmosDrawer'
import SATFormulaSheet from '@/components/sat/SATFormulaSheet'
import SATQuestionCanvas from '@/components/sat/SATQuestionCanvas'
import SATReview from '@/components/sat/SATReview'
import SATRichText from '@/components/sat/SATRichText'
import {
  isSATAnswerCorrect,
  SAT_TEST_TIMER_KEY,
  scoreSATModules,
  type SATModule,
  type HighlightStroke,
  type SATAttempt,
} from '@/features/sat/practiceTest4'
import {
  clearSATAttempt,
  loadSATAttempt,
  saveSATAttempt,
  saveSATAttemptToHistory,
} from '@/features/sat/attemptStorage'
import { getSATSectionTest, isSATSection } from '@/features/sat/catalog'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { markXpActivitySynced, recordXpActivity } from '@/lib/xpApi'
import { learningCenterApi } from '@/features/learningCenter/api'

const HIGHLIGHT_COLORS = ['#fde047', '#86efac', '#7dd3fc', '#f9a8d4']
const FULLSCREEN_RECOVERY_SECONDS = 30
const FULLSCREEN_RECOVERY_MS = FULLSCREEN_RECOVERY_SECONDS * 1000

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

function testDeadlineFor(attempt: SATAttempt, modules: SATModule[]) {
  const testDeadline = attempt.moduleDeadlines[SAT_TEST_TIMER_KEY]
  if (testDeadline !== undefined) return testDeadline

  // Migrate an active attempt created before the timer became test-wide.
  const moduleIndex = Math.min(attempt.currentModuleIndex, modules.length - 1)
  const currentModule = modules[moduleIndex]
  const currentDeadline = currentModule ? attempt.moduleDeadlines[currentModule.id] : undefined
  if (currentDeadline) {
    const futureSeconds = modules
      .slice(moduleIndex + 1)
      .reduce((total, module) => total + module.durationSeconds, 0)
    return currentDeadline + futureSeconds * 1000
  }

  const totalSeconds = modules.reduce((total, module) => total + module.durationSeconds, 0)
  return attempt.startedAt + totalSeconds * 1000
}

export default function SATMockRun() {
  const navigate = useNavigate()
  const { mockId = '1' } = useParams<{ mockId: string }>()
  const [searchParams] = useSearchParams()
  const section = isSATSection(searchParams.get('section')) ? searchParams.get('section')! : null
  const test = useMemo(() => getSATSectionTest(mockId, section), [mockId, section])
  const sectionQuery = section ? `?section=${section}` : ''
  const backPath = section ? `/sat/${section}` : '/sat'
  const modules = test.modules
  const user = useAuthStore((state: AuthState) => state.user)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const { isFullscreen, enter, exit } = useFullscreen()
  const [attempt, setAttempt] = useState<SATAttempt | null>(() => loadSATAttempt(test.id))
  const [now, setNow] = useState(Date.now())
  const [timerVisible, setTimerVisible] = useState(true)
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorDocked, setCalculatorDocked] = useState(false)
  const [formulaSheetOpen, setFormulaSheetOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [highlightEnabled, setHighlightEnabled] = useState(false)
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0])
  const [zoom, setZoom] = useState(1)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [checkedQuestions, setCheckedQuestions] = useState<string[]>([])
  const [violationDeadline, setViolationDeadline] = useState<number | null>(null)
  const violationFrozenRef = useRef(false)
  const attemptRef = useRef<SATAttempt | null>(attempt)

  const moduleIndex = attempt?.currentModuleIndex ?? 0
  const currentModule = modules[moduleIndex] ?? modules[0]
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

  const testSeconds = useMemo(() => {
    if (!attempt) return test.totalDurationSeconds
    if (attempt.pausedModuleSeconds !== undefined) return attempt.pausedModuleSeconds
    if (attempt.mode === 'exam') {
      const deadline = testDeadlineFor(attempt, modules)
      return Math.max(0, Math.ceil((deadline - now) / 1000))
    }
    return Math.max(0, Math.floor((now - attempt.startedAt) / 1000))
  }, [attempt, modules, now, test.totalDurationSeconds])

  const persistUpdate = useCallback((updater: (current: SATAttempt) => SATAttempt) => {
    setAttempt((current) => {
      if (!current) return current
      const next = { ...updater(current), updatedAt: Date.now() }
      attemptRef.current = next
      return next
    })
  }, [])

  attemptRef.current = attempt

  useEffect(() => {
    if (!user || !attempt || attempt.status !== 'submitted' || !attempt.submittedAt) return
    const sourceKey = `${test.id}-${attempt.submittedAt}`
    const report = scoreSATModules(test.modules, attempt.answers)
    const topicStats = new Map<string, { correct: number; total: number }>()
    test.modules.flatMap((module) => module.questions).forEach((question) => {
      const current = topicStats.get(question.domain) ?? { correct: 0, total: 0 }
      current.total += 1
      if (isSATAnswerCorrect(question, attempt.answers[question.id])) current.correct += 1
      topicStats.set(question.domain, current)
    })
    const assignmentId = searchParams.get('assignmentId') ?? undefined
    void learningCenterApi.syncResult({
      sourceKey: `sat-${sourceKey}`,
      sourceType: 'SAT_BLUEBOOK_MOCK',
      examType: 'SAT',
      skill: section === 'math' ? 'SAT_MATH' : section === 'reading-writing' ? 'SAT_READING_WRITING' : 'SAT_OVERALL',
      title: test.title,
      score: section === 'math'
        ? Math.round((report.mathRange[0] + report.mathRange[1]) / 20) * 10
        : section === 'reading-writing'
          ? Math.round((report.readingWritingRange[0] + report.readingWritingRange[1]) / 20) * 10
          : report.midpoint,
      maxScore: section ? 800 : 1600,
      accuracy: report.percent,
      durationSec: Math.max(0, Math.round((attempt.submittedAt - attempt.startedAt) / 1000)),
      completedAt: new Date(attempt.submittedAt).toISOString(),
      assignmentId,
      breakdown: {
        readingWritingRange: report.readingWritingRange,
        mathRange: report.mathRange,
        correct: report.correct,
        incorrect: report.incorrect,
        unanswered: report.unanswered,
        topics: [...topicStats].map(([topic, value]) => ({
          topic,
          correct: value.correct,
          total: value.total,
          accuracy: Math.round((value.correct / Math.max(1, value.total)) * 100),
        })),
      },
    }).catch(() => {})
    void recordXpActivity({
      source: 'SAT_PRACTICE',
      eventKey: sourceKey,
      accuracy: report.percent,
      durationSec: test.totalDurationSeconds,
      metadata: { testId: test.id, title: test.title, score: report.midpoint, accuracy: report.percent },
    }).then((reward) => {
      markXpActivitySynced(user.id, sourceKey)
      updateUserProgress({ xp: reward.totalXp, level: reward.level })
    }).catch(() => {})
  }, [attempt, searchParams, section, test, updateUserProgress, user?.id])

  const pauseAndSaveAttempt = useCallback(() => {
    const current = attemptRef.current
    if (!current || current.status !== 'active') return
    const timestamp = Date.now()
    const pausedSeconds = current.pausedModuleSeconds ?? (
      current.mode === 'exam'
        ? Math.max(0, Math.ceil((testDeadlineFor(current, modules) - timestamp) / 1000))
        : Math.max(0, Math.floor((timestamp - current.startedAt) / 1000))
    )
    const paused: SATAttempt = {
      ...current,
      pausedModuleSeconds: pausedSeconds,
      timerPausedAt: timestamp,
      moduleDeadlines: current.mode === 'exam'
        ? { ...current.moduleDeadlines, [SAT_TEST_TIMER_KEY]: 0 }
        : current.moduleDeadlines,
      updatedAt: timestamp,
    }
    attemptRef.current = paused
    saveSATAttempt(paused)
    saveSATAttemptToHistory(paused, 'exit')
  }, [modules])

  const exitTest = useCallback(() => {
    pauseAndSaveAttempt()
    if (fullscreenElement()) void exit()
    navigate(backPath)
  }, [backPath, exit, navigate, pauseAndSaveAttempt])

  const openNotes = useCallback(() => {
    setNoteDraft(attemptRef.current?.notes[currentQuestion.id] ?? '')
    setNotesOpen(true)
  }, [currentQuestion.id])

  const saveNote = useCallback(() => {
    persistUpdate((current) => {
      const notes = { ...current.notes }
      const trimmedNote = noteDraft.trim()
      if (trimmedNote) notes[currentQuestion.id] = trimmedNote
      else delete notes[currentQuestion.id]
      return { ...current, notes }
    })
    setNotesOpen(false)
  }, [currentQuestion.id, noteDraft, persistUpdate])

  const submitAttempt = useCallback(() => {
    persistUpdate((current) => ({
      ...current,
      status: 'submitted',
      submittedAt: Date.now(),
      pausedModuleSeconds: undefined,
      timerPausedAt: undefined,
    }))
    setModuleComplete(false)
    setConfirmSubmit(false)
    setNavigatorOpen(false)
    setNotesOpen(false)
    setCalculatorOpen(false)
    setFormulaSheetOpen(false)
    if (fullscreenElement()) void exit()
  }, [exit, persistUpdate])

  const closeCalculator = useCallback(() => {
    setCalculatorOpen(false)
  }, [])

  const advanceModule = useCallback(() => {
    if (!attempt) return
    const nextModuleIndex = attempt.currentModuleIndex + 1
    if (nextModuleIndex >= modules.length) {
      submitAttempt()
      return
    }
    const nextModule = modules[nextModuleIndex]
    const startedAt = Date.now()
    persistUpdate((current) => ({
      ...current,
      currentModuleIndex: nextModuleIndex,
      currentQuestionIndex: 0,
      moduleStartedAt: { ...current.moduleStartedAt, [nextModule.id]: startedAt },
      pausedModuleSeconds: undefined,
      timerPausedAt: undefined,
    }))
    setModuleComplete(false)
    setZoom(1)
    setHighlightEnabled(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [attempt, modules, persistUpdate, submitAttempt])

  const endCurrentModule = useCallback(() => {
    if (moduleIndex === modules.length - 1) {
      setConfirmSubmit(true)
    } else {
      setModuleComplete(true)
    }
  }, [moduleIndex, modules.length])

  useEffect(() => {
    if (attempt) saveSATAttempt(attempt)
  }, [attempt])

  useEffect(() => {
    if (
      !attempt ||
      attempt.status !== 'active' ||
      attempt.mode !== 'exam' ||
      attempt.moduleDeadlines[SAT_TEST_TIMER_KEY] !== undefined
    ) return
    const deadline = testDeadlineFor(attempt, modules)
    persistUpdate((current) => ({
      ...current,
      moduleDeadlines: { ...current.moduleDeadlines, [SAT_TEST_TIMER_KEY]: deadline },
    }))
  }, [attempt, modules, persistUpdate])

  useEffect(() => {
    const current = attemptRef.current
    if (!current || current.status !== 'active' || current.pausedModuleSeconds === undefined) return
    if (current.mode === 'exam') return
    const timestamp = Date.now()
    persistUpdate((value) => ({
      ...value,
      pausedModuleSeconds: undefined,
      timerPausedAt: undefined,
      startedAt: timestamp - (value.pausedModuleSeconds ?? 0) * 1000,
    }))
  }, [persistUpdate])

  useEffect(() => {
    const pauseForPageExit = () => pauseAndSaveAttempt()
    window.addEventListener('pagehide', pauseForPageExit)
    return () => {
      window.removeEventListener('pagehide', pauseForPageExit)
      pauseForPageExit()
    }
  }, [pauseAndSaveAttempt])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const pauseBeforeUnload = () => pauseAndSaveAttempt()
    window.addEventListener('beforeunload', pauseBeforeUnload)
    return () => window.removeEventListener('beforeunload', pauseBeforeUnload)
  }, [pauseAndSaveAttempt])

  useEffect(() => {
    if (!attempt || attempt.status !== 'active' || attempt.mode !== 'exam') return

    if (!isFullscreen && !violationDeadline) {
      const deadline = testDeadlineFor(attempt, modules)
      const remaining = attempt.pausedModuleSeconds ?? (deadline
        ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
        : test.totalDurationSeconds)
      violationFrozenRef.current = true
      persistUpdate((current) => ({
        ...current,
        pausedModuleSeconds: remaining,
        moduleDeadlines: { ...current.moduleDeadlines, [SAT_TEST_TIMER_KEY]: 0 },
      }))
      setViolationDeadline(Date.now() + FULLSCREEN_RECOVERY_MS)
      return
    }

    if (isFullscreen && (violationDeadline || attempt.pausedModuleSeconds !== undefined)) {
      const remaining = attempt.pausedModuleSeconds ?? test.totalDurationSeconds
      setViolationDeadline(null)
      violationFrozenRef.current = false
      persistUpdate((current) => ({
        ...current,
        pausedModuleSeconds: undefined,
        timerPausedAt: undefined,
        moduleDeadlines: {
          ...current.moduleDeadlines,
          [SAT_TEST_TIMER_KEY]: Date.now() + remaining * 1000,
        },
      }))
    }
  }, [
    attempt,
    isFullscreen,
    modules,
    persistUpdate,
    test.totalDurationSeconds,
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
      violationDeadline
    ) return
    if (testSeconds <= 0) submitAttempt()
  }, [
    attempt,
    submitAttempt,
    testSeconds,
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
        formulaSheetOpen ||
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
        openNotes()
      } else if (event.key === 'Escape' && highlightEnabled) {
        setHighlightEnabled(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [
    attempt,
    calculatorOpen,
    formulaSheetOpen,
    currentModule.questions.length,
    currentQuestion.id,
    currentQuestion.kind,
    navigatorOpen,
    notesOpen,
    highlightEnabled,
    openNotes,
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
          <button type="button" onClick={() => navigate(`/mock/sat/${test.mockId}${sectionQuery}`)} className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white">
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
        test={test}
        onStartAgain={() => {
          clearSATAttempt(test.id)
          navigate(`/mock/sat/${test.mockId}${sectionQuery}`)
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
            You did not return to fullscreen within the {FULLSCREEN_RECOVERY_SECONDS}-second recovery window. This exam attempt
            has been locked and cannot be resumed.
          </p>
          <button
            type="button"
            onClick={() => {
              clearSATAttempt(test.id)
              navigate(backPath)
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

  const practiceChecked = checkedQuestions.includes(currentQuestion.id)
  const practiceCorrect = practiceChecked && isSATAnswerCorrect(currentQuestion, currentAnswer)
  const sectionNumber = currentModule.section === 'reading-writing' ? 1 : 2
  const moduleNumber = currentModule.id.endsWith('1') ? 1 : 2
  const sectionTitle = currentModule.section === 'reading-writing' ? 'Reading and Writing' : 'Math'
  const learnerName = user?.fullName || 'ProfAI Student'

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8fa] text-[#151515]">
      <header className="sticky top-0 z-[80] border-b border-slate-200 bg-white">
        <div className="relative mx-auto grid max-w-[112rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-8">
          <div className="min-w-0 font-serif">
            <h1 className="truncate font-serif text-base font-bold text-slate-800 sm:text-xl lg:text-2xl">
              Section {sectionNumber}, Module {moduleNumber}: {sectionTitle}
            </h1>
            <button type="button" onClick={() => setDirectionsOpen(true)} className="mt-0.5 text-sm font-bold text-[#2355ed] hover:underline sm:text-base">
              Directions
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTimerVisible((value) => !value)}
            className="flex min-w-24 items-center justify-center gap-2 font-serif text-2xl font-bold tabular-nums sm:text-3xl"
            title={timerVisible ? 'Hide timer' : 'Show timer'}
          >
            {timerVisible ? formatTime(testSeconds) : 'Hidden'}
            <EyeOff className="h-5 w-5 text-slate-600" />
          </button>

          <div className="col-span-2 flex items-center justify-end gap-1 sm:gap-3 md:col-span-1">
            {currentModule.section === 'math' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFormulaSheetOpen(true)
                    setToolsOpen(false)
                    setMoreOpen(false)
                  }}
                  aria-label="Open SAT formula sheet"
                  title="Formula Sheet"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-50 px-3 font-serif text-sm font-bold text-sky-800 transition hover:bg-sky-100 sm:px-4"
                >
                  <Sheet className="h-5 w-5" /> <span className="hidden xl:inline">Formula Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalculatorOpen((value) => !value)
                    setToolsOpen(false)
                    setMoreOpen(false)
                  }}
                  aria-expanded={calculatorOpen}
                  aria-label={calculatorOpen ? 'Close Desmos calculator' : 'Open Desmos calculator'}
                  title={calculatorOpen ? 'Close Desmos' : 'Open Desmos'}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl px-3 font-serif text-sm font-bold transition sm:px-4 ${
                    calculatorOpen
                      ? 'bg-red-600 text-white shadow-[0_8px_20px_rgba(220,38,38,.22)]'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <Calculator className="h-5 w-5" /> <span className="hidden lg:inline">Desmos</span>
                </button>
              </>
            ) : null}
            <button type="button" onClick={() => setNavigatorOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600" aria-label="Open question navigator">
              <FileText className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => { setToolsOpen((open) => !open); setMoreOpen(false) }}
              className="flex items-center gap-2 px-2 py-2 font-serif text-sm font-bold text-slate-700 sm:text-base"
            >
              <NotebookPen className="h-6 w-6" /> <span className="hidden sm:inline">Highlights & Notes</span>
            </button>
            <button
              type="button"
              onClick={() => { setMoreOpen((open) => !open); setToolsOpen(false) }}
              className="flex flex-col items-center px-2 py-1 font-serif text-xs font-bold text-slate-700"
            >
              <EllipsisVertical className="h-6 w-6" /> <span className="hidden sm:block">More</span>
            </button>
          </div>

          {toolsOpen ? (
            <div className="absolute right-4 top-[calc(100%+.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-300 bg-white p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black">Highlights & Notes</p>
                <button type="button" onClick={() => setToolsOpen(false)} className="text-slate-500"><X className="h-4 w-4" /></button>
              </div>
              <button
                type="button"
                aria-pressed={highlightEnabled}
                onClick={() => {
                  setHighlightEnabled((value) => {
                    if (!value) setToolsOpen(false)
                    return !value
                  })
                }}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black ${highlightEnabled ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-black bg-white text-black'}`}
              >
                <Highlighter className="h-4 w-4" /> {highlightEnabled ? 'Highlight mode on' : 'Turn on highlight mode'}
              </button>
              <div className="mt-3 flex items-center gap-2">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button type="button" key={color} aria-label={`Use ${color} highlighter`} onClick={() => setHighlightColor(color)} className={`h-7 w-7 rounded-full border-2 ${highlightColor === color ? 'border-black' : 'border-white ring-1 ring-slate-300'}`} style={{ backgroundColor: color }} />
                ))}
                <button type="button" onClick={() => changeHighlights(currentStrokes.slice(0, -1))} disabled={!currentStrokes.length} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-30" title="Undo"><Undo2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => changeHighlights([])} disabled={!currentStrokes.length} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-30" title="Clear"><Trash2 className="h-4 w-4" /></button>
              </div>
              <button type="button" onClick={() => { openNotes(); setToolsOpen(false) }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-3 py-3 text-xs font-black text-white">
                <NotebookPen className="h-4 w-4" /> {attempt.notes[currentQuestion.id] ? 'Edit note' : 'Add note'}
              </button>
            </div>
          ) : null}

          {moreOpen ? (
            <div className="absolute right-4 top-[calc(100%+.5rem)] z-50 w-56 rounded-2xl border border-slate-300 bg-white p-2 shadow-2xl">
              <div className="flex items-center gap-1 rounded-xl px-2 py-2">
                <button type="button" aria-label="Zoom out" disabled={zoom <= 0.7} onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30"><ZoomOut className="h-4 w-4" /></button>
                <span className="min-w-16 flex-1 text-center text-xs font-black tabular-nums">{Math.round(zoom * 100)}%</span>
                <button type="button" aria-label="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30"><ZoomIn className="h-4 w-4" /></button>
              </div>
              <button type="button" onClick={() => { setZoom(1); setMoreOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black hover:bg-slate-100"><Undo2 className="h-4 w-4" /> Reset zoom</button>
              <button type="button" onClick={exitTest} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black text-red-700 hover:bg-red-50"><X className="h-4 w-4" /> Exit &amp; Save</button>
            </div>
          ) : null}
        </div>
        <div className="h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" />
      </header>

      {highlightEnabled ? (
        <div
          role="status"
          className="fixed right-4 top-28 z-[65] flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-3 text-amber-950 shadow-xl backdrop-blur sm:right-6"
        >
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: highlightColor }} />
          <div>
            <p className="text-xs font-black">Highlighter active</p>
            <p className="text-[9px] font-bold text-amber-700">Draw anywhere on the question · Esc to stop</p>
          </div>
          <button
            type="button"
            onClick={() => setHighlightEnabled(false)}
            className="rounded-lg bg-amber-900 px-3 py-1.5 text-[10px] font-black text-white"
          >
            Done
          </button>
        </div>
      ) : null}

      <div className={`overflow-auto pb-[5.4rem] transition-[padding] duration-300 ${calculatorOpen && calculatorDocked ? 'lg:pr-[calc(min(44vw,46rem)+0.75rem)]' : ''}`}>
        <div
          className="origin-top-left"
          style={{ zoom } as CSSProperties}
        >
        <SATQuestionCanvas
          question={currentQuestion}
          answer={currentAnswer}
          onAnswer={updateAnswer}
          strokes={currentStrokes}
          highlightEnabled={highlightEnabled}
          highlightColor={highlightColor}
          onChange={changeHighlights}
          flagged={isFlagged}
          answerState={practiceChecked ? (practiceCorrect ? 'correct' : 'incorrect') : undefined}
          onToggleFlag={() => persistUpdate((current) => ({
            ...current,
            flagged: current.flagged.includes(currentQuestion.id)
              ? current.flagged.filter((id) => id !== currentQuestion.id)
              : [...current.flagged, currentQuestion.id],
          }))}
          practicePanel={attempt.mode === 'practice' ? (
            <div className="mt-7 border-t border-slate-300 pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-500">Your response is saved automatically.</p>
                {currentAnswer ? <button type="button" onClick={() => updateAnswer('')} className="text-xs font-black text-red-700">Clear</button> : null}
              </div>
              <button
                type="button"
                disabled={!currentAnswer || practiceChecked}
                onClick={() => setCheckedQuestions((current) => [...new Set([...current, currentQuestion.id])])}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Lightbulb className="h-4 w-4" /> {practiceChecked ? 'Answer checked' : 'Check answer'}
              </button>
              {practiceChecked ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 rounded-xl border-2 p-4 ${practiceCorrect ? 'border-emerald-600 bg-emerald-50' : 'border-red-600 bg-red-50'}`}>
                  <div className="flex items-start gap-3">
                    {practiceCorrect ? <Sparkles className="mt-0.5 h-5 w-5 text-emerald-700" /> : <XCircle className="mt-0.5 h-5 w-5 text-red-700" />}
                    <div>
                      <p className={`font-serif text-base font-bold ${practiceCorrect ? 'text-emerald-900' : 'text-red-900'}`}>{practiceCorrect ? 'Correct answer' : `Incorrect — correct answer: ${currentQuestion.correctAnswer}`}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">Review the reasoning before moving to the next question.</p>
                    </div>
                  </div>
                  <details className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-3">
                    <summary className="cursor-pointer text-xs font-black text-slate-800">Step-by-step explanation</summary>
                    <SATRichText text={currentQuestion.explanation} className="mt-3 text-sm font-medium leading-6 text-slate-700" />
                  </details>
                </motion.div>
              ) : null}
            </div>
          ) : null}
        />
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-[70] bg-[#e7edf8]">
        <div className="h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" />
        <div className="mx-auto grid min-h-20 max-w-[112rem] grid-cols-[1fr_auto] items-center gap-3 px-4 py-2 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <p className="hidden truncate font-serif text-lg font-bold text-slate-800 md:block">{learnerName}</p>
          <button type="button" onClick={() => setNavigatorOpen(true)} className="inline-flex h-12 items-center justify-center gap-3 rounded-2xl bg-black px-5 font-serif text-base font-bold text-white sm:text-lg">
            Question {questionIndex + 1} of {currentModule.questions.length} <ChevronDown className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-end gap-2">
            <button type="button" disabled={questionIndex === 0} onClick={() => goToQuestion(questionIndex - 1)} className="h-12 rounded-full bg-[#4053d7] px-5 font-serif text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-7 sm:text-lg">Back</button>
            {questionIndex < currentModule.questions.length - 1 ? (
              <button type="button" onClick={() => goToQuestion(questionIndex + 1)} className="h-12 rounded-full bg-[#4053d7] px-5 font-serif text-base font-bold text-white sm:px-7 sm:text-lg">Next</button>
            ) : (
              <button type="button" onClick={endCurrentModule} className="h-12 rounded-full bg-black px-5 font-serif text-sm font-bold text-white sm:px-7 sm:text-base">Review module</button>
            )}
          </div>
        </div>
      </footer>

      <DesmosDrawer
        open={calculatorOpen}
        preload={currentModule.section === 'math'}
        docked={calculatorDocked}
        onDockedChange={setCalculatorDocked}
        onClose={closeCalculator}
      />

      <SATFormulaSheet open={formulaSheetOpen} onClose={() => setFormulaSheetOpen(false)} />

      <AnimatePresence>
        {directionsOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[145] flex items-center justify-center bg-black/45 p-4"
          >
            <motion.section
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-slate-300 px-5 py-4 sm:px-7">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4053d7]">Test directions</p>
                  <h2 className="mt-1 font-serif text-xl font-bold sm:text-2xl">Section {sectionNumber}, Module {moduleNumber}: {sectionTitle}</h2>
                </div>
                <button type="button" onClick={() => setDirectionsOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300"><X className="h-4 w-4" /></button>
              </header>
              <div className="px-5 py-6 font-serif text-base leading-7 text-slate-700 sm:px-7 sm:text-lg">
                {currentModule.section === 'reading-writing' ? (
                  <p>Read each passage carefully and choose the answer that is best supported by the text and standard written English. You may move between questions in this module and mark any question for review.</p>
                ) : (
                  <p>Solve each problem and select or enter the best answer. Desmos is built into the Math toolbar and opens without leaving the test. You may move between questions in this module and mark any question for review.</p>
                )}
                <p className="mt-4">Your answers, notes, highlights, and current position are saved automatically on this device.</p>
              </div>
              <footer className="flex justify-end border-t border-slate-300 bg-slate-50 px-5 py-4 sm:px-7">
                <button type="button" onClick={() => setDirectionsOpen(false)} className="rounded-full bg-[#4053d7] px-6 py-3 font-serif text-base font-bold text-white">Continue</button>
              </footer>
            </motion.section>
          </motion.div>
        ) : null}

        {navigatorOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/45 p-3"
          >
            <motion.section
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl"
            >
              <header className="flex items-center justify-between border-b border-slate-300 bg-white px-5 py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#4053d7]">{currentModule.shortTitle}</p>
                  <h2 className="mt-1 font-serif text-xl font-bold">Question navigator</h2>
                </div>
                <button type="button" onClick={() => setNavigatorOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" />
              <div className="max-h-[62vh] overflow-y-auto p-5">
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-11">
                  {currentModule.questions.map((question, index) => {
                    const answered = Boolean(attempt.answers[question.id]?.trim())
                    const flagged = attempt.flagged.includes(question.id)
                    const checked = attempt.mode === 'practice' && checkedQuestions.includes(question.id)
                    const checkedCorrect = checked && isSATAnswerCorrect(question, attempt.answers[question.id])
                    return (
                      <button
                        type="button"
                        key={question.id}
                        onClick={() => goToQuestion(index)}
                        className={`relative aspect-square rounded-xl text-xs font-black ${
                          checked
                            ? checkedCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 text-white'
                            : answered
                              ? 'bg-black text-white'
                              : 'border-2 border-slate-400 bg-white text-slate-700'
                        } ${index === questionIndex ? 'ring-4 ring-indigo-200' : ''}`}
                      >
                        {question.number}
                        {flagged ? <Flag className="absolute right-1 top-1 h-2.5 w-2.5 fill-amber-400 text-amber-500" /> : null}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-5 flex flex-wrap gap-3 text-[9px] font-black text-slate-500">
                  {attempt.mode === 'practice' ? <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-600" /> Correct</span> : null}
                  {attempt.mode === 'practice' ? <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-600" /> Incorrect</span> : null}
                  <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-950" /> Answered</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-slate-300 bg-slate-50" /> Unanswered</span>
                  <span className="inline-flex items-center gap-1.5"><Flag className="h-3 w-3 fill-amber-400 text-amber-500" /> Flagged</span>
                </div>
              </div>
              <footer className="flex items-center justify-between gap-3 border-t border-slate-300 bg-[#e7edf8] px-5 py-4">
                <p className="text-[10px] font-bold text-slate-500">
                  {answeredInModule} answered · {currentModule.questions.length - answeredInModule} remaining
                </p>
                <button type="button" onClick={endCurrentModule} className="rounded-full bg-[#4053d7] px-5 py-2.5 text-[10px] font-black text-white">
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
            className="fixed inset-0 z-[145] flex items-end justify-center bg-black/45 p-3 sm:items-center"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setNotesOpen(false)
            }}
          >
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sat-note-title"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#4053d7]">Private note</p>
                  <h2 id="sat-note-title" className="mt-1 font-serif text-xl font-bold">Question {currentQuestion.number}</h2>
                </div>
                <button type="button" onClick={() => setNotesOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                autoFocus
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Write your reasoning, a formula to revisit, or why an option felt tempting..."
                className="mt-4 min-h-44 w-full resize-y rounded-xl border-2 border-slate-400 bg-slate-50 p-4 text-sm font-medium leading-6 outline-none focus:border-[#4053d7] focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNoteDraft('')
                    persistUpdate((current) => {
                      const notes = { ...current.notes }
                      delete notes[currentQuestion.id]
                      return { ...current, notes }
                    })
                    setNotesOpen(false)
                  }}
                  disabled={!attempt.notes[currentQuestion.id]}
                  className="rounded-full px-4 py-2.5 text-[11px] font-black text-red-700 disabled:invisible"
                >
                  Delete note
                </button>
                <button type="button" onClick={saveNote} className="rounded-full bg-black px-5 py-2.5 text-[11px] font-black text-white">
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
              className="w-full max-w-xl rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl sm:p-8"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#4053d7]">
                <ListChecks className="h-7 w-7" />
              </span>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#4053d7]">
                {confirmSubmit ? 'Final submission' : 'Module ready'}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight">
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
                  className="rounded-xl bg-[#4053d7] px-4 py-3 text-[11px] font-black text-white"
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
                  background: `conic-gradient(#ef4444 ${(violationSeconds / FULLSCREEN_RECOVERY_SECONDS) * 360}deg,rgba(255,255,255,.1) 0deg)`,
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
                Your test timer is paused. Re-enter fullscreen before the countdown ends
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
