import { useCopy } from '@/i18n/interface'
import { isSATLeaderboardEligible } from '@/features/sat/leaderboardEligibility'
import AttemptEntryBoundary from '@/components/tests/AttemptEntryBoundary'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { testReturnPath } from '@/utils/testNavigation'
import { accountStorageFor } from '@/utils/accountStorage'
import { useActiveTest } from '@/hooks/useActiveTest'
import { saveActiveTestPaper } from '@/utils/activeTestPaper'
import UiText from '@/components/common/UiText'
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
  Lightbulb,
  NotebookPen,
  Save,
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
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DesmosDrawer from '@/components/sat/DesmosDrawer'
import SATFormulaSheet from '@/components/sat/SATFormulaSheet'
import SATQuestionCanvas from '@/components/sat/SATQuestionCanvas'
import SATSubmissionScreen, { useSATSubmission } from '@/components/sat/SATSubmissionScreen'
import SATModuleReview from '@/components/sat/SATModuleReview'
import SATSectionBreak from '@/components/sat/SATSectionBreak'
import SATNotes, { SATNoteList } from '@/components/sat/SATNotes'
import { readSATNotes } from '@/features/sat/notes'
import SATExplanation from '@/components/sat/SATExplanation'
import '@/components/sat/sat-exam-layout.css'
import {
  isSATAnswerCorrect,
  scoreSATModules,
  type HighlightStroke,
  type SATAttempt,
} from '@/features/sat/practiceTest4'
import {
  loadSATAttempt,
  saveSATAttempt,
  saveSATAttemptToHistory,
} from '@/features/sat/attemptStorage'
import { isSATSection, isSATTestComplete, resolveSATTest } from '@/features/sat/catalog'
import { getSATSessionTest } from '@/features/sat/sessionTest'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { markXpActivitySynced, recordXpActivity } from '@/lib/xpApi'
import { syncSATAttemptResult } from '@/features/sat/resultSync'
import { advanceSATModule, needsSATSectionBreak } from '@/features/sat/sectionBreak'

import { finishModule, migrateModuleTiming, moduleSeconds, pauseModule, resumeModule, totalTime } from '@/features/sat/timing'

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
  return <AttemptEntryBoundary exam="SAT"><SATMockRunContent /></AttemptEntryBoundary>
}

function SATMockRunContent() {
  const { c: uiCopy } = useCopy()
  const navigate = useNavigate()
  const location = useLocation()
  const { mockId = '1' } = useParams<{ mockId: string }>()
  const [searchParams] = useSearchParams()
  const section = isSATSection(searchParams.get('section')) ? searchParams.get('section')! : null
  const requestedTestId = searchParams.get('testId')
  const baseTest = useMemo(() => getSATSessionTest(mockId, section, requestedTestId), [mockId, section, requestedTestId])
  const diagnostic = !section && searchParams.get('diagnostic') === '1'
  const sectionQuery = section ? `?section=${section}` : diagnostic ? '?diagnostic=1' : ''
  const backPath = testReturnPath(location.state, section ? `/sat/${section}` : '/sat')
  const user = useAuthStore((state: AuthState) => state.user)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const { isFullscreen, supported, toggle, exit } = useFullscreen()
  const [attempt, setAttempt] = useState<SATAttempt | null>(() => {
    const saved = loadSATAttempt(baseTest.id)
    return saved ? migrateModuleTiming(saved, baseTest.modules) : null
  })
  const test = useMemo(() => attempt ? resolveSATTest(baseTest, attempt) : baseTest,
    [baseTest, attempt?.answers, attempt?.adaptiveRoutes])
  const modules = test.modules
  const modulesRef = useRef(modules)
  modulesRef.current = modules
  useActiveTest(attempt?.status === 'active')
  const [now, setNow] = useState(Date.now())
  const uiKey = `profai:sat:${test.id}:workspace`
  const [savedUi] = useState(() => {
    try { return JSON.parse(accountStorageFor().getItem(uiKey) ?? '{}') as { attemptId?: string; timerVisible?: boolean; zoom?: number; checkedQuestions?: string[] } } catch { return {} }
  })
  const sameAttempt = savedUi.attemptId === attempt?.attemptId
  const [timerVisible, setTimerVisible] = useState(sameAttempt ? savedUi.timerVisible ?? true : true)
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorDocked, setCalculatorDocked] = useState(false)
  const [formulaSheetOpen, setFormulaSheetOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [zoom, setZoom] = useState(sameAttempt ? savedUi.zoom ?? 1 : 1)
  const [moduleComplete, setModuleComplete] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const submission = useSATSubmission()
  const [checkedQuestions, setCheckedQuestions] = useState<string[]>(sameAttempt ? savedUi.checkedQuestions ?? [] : [])
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const attemptRef = useRef<SATAttempt | null>(attempt)
  const questionViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!attempt) return
    try { accountStorageFor().setItem(uiKey, JSON.stringify({ attemptId: attempt.attemptId, timerVisible, zoom, checkedQuestions })) } catch { /* Keep the current workspace usable. */ }
  }, [attempt?.attemptId, timerVisible, zoom, checkedQuestions, uiKey])

  const moduleIndex = attempt?.currentModuleIndex ?? 0
  const currentModule = modules[moduleIndex] ?? modules[0]
  const questionIndex = Math.min(
    attempt?.currentQuestionIndex ?? 0,
    currentModule.questions.length - 1,
  )
  const currentQuestion = currentModule.questions[questionIndex]

  useEffect(() => {
    if (questionViewportRef.current) questionViewportRef.current.scrollTop = 0
  }, [currentQuestion.id])
  const currentAnswer = attempt?.answers[currentQuestion.id] ?? ''
  const currentStrokes = attempt?.highlights[currentQuestion.id] ?? []
  const isFlagged = attempt?.flagged.includes(currentQuestion.id) ?? false
  const answeredInModule = currentModule.questions.filter(
    (question) => attempt?.answers[question.id]?.trim(),
  ).length

  const testSeconds = attempt ? moduleSeconds(attempt, modules, now) : currentModule.durationSeconds

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
    const assignmentId = searchParams.get('assignmentId') ?? undefined
    void syncSATAttemptResult(user.id, test, attempt, assignmentId).catch(() => {})
    if (!isSATLeaderboardEligible(attempt, modules)) return
    void recordXpActivity({
      source: 'SAT_PRACTICE',
      eventKey: sourceKey,
      accuracy: report.percent,
      durationSec: Math.round(totalTime(attempt, modules)),
      metadata: { testId: test.id, title: test.title, ...(isSATTestComplete(test) ? { score: report.midpoint } : {}), accuracy: report.percent },
    }).then((reward) => {
      markXpActivitySynced(user.id, sourceKey)
      updateUserProgress({ xp: reward.totalXp, level: reward.level })
    }).catch(() => {})
  }, [attempt, searchParams, section, test, updateUserProgress, user?.id])

  const pauseAndSaveAttempt = useCallback(() => {
    const current = attemptRef.current
    if (!current || current.status !== 'active') return
    const paused = pauseModule(current, modulesRef.current)
    attemptRef.current = paused
    saveSATAttempt(paused)
    saveSATAttemptToHistory(paused, 'exit')
  }, [])

  const saveAndExit = useCallback(() => {
    pauseAndSaveAttempt()
    setExitConfirmOpen(false)
    if (fullscreenElement()) void exit()
    navigate(backPath)
  }, [backPath, exit, navigate, pauseAndSaveAttempt])

  const exitTest = useCallback(() => {
    if (attemptRef.current?.status === 'active') {
      setMoreOpen(false)
      setExitConfirmOpen(true)
      return
    }
    saveAndExit()
  }, [saveAndExit])

  const continueExam = useCallback(() => {
    setExitConfirmOpen(false)
  }, [])

  const openNotes = useCallback(() => {
    setNotesOpen(true)
    setToolsOpen(false)
  }, [])

  const submitAttempt = useCallback(() => submission.run(() => {
    const current = attemptRef.current
    if (!current || current.status !== 'active') return
    const completed: SATAttempt = {
      ...finishModule(current, modules),
      status: 'submitted',
      leaderboardEligible: isSATLeaderboardEligible(current, modules),
      eligibilityNoticeAcknowledged: false,
      submittedAt: Date.now(),
      pausedModuleSeconds: undefined,
      timerPausedAt: undefined,
    }
    saveSATAttempt(completed)
    persistUpdate(() => completed)
    setModuleComplete(false)
    setConfirmSubmit(false)
    setNavigatorOpen(false)
    setNotesOpen(false)
    setCalculatorOpen(false)
    setFormulaSheetOpen(false)
    if (fullscreenElement()) void exit()
  }), [exit, modules, persistUpdate, submission.run])

  const closeCalculator = useCallback(() => {
    setCalculatorOpen(false)
  }, [])

  const advanceModule = useCallback((endBreakEarly = false) => {
    const current = attemptRef.current
    if (!current || current.status !== 'active') return
    if (current.currentModuleIndex + 1 >= modules.length) {
      submitAttempt()
      return
    }
    const startedAt = Date.now()
    persistUpdate(value => value.currentModuleIndex === current.currentModuleIndex
      ? advanceSATModule(value, modules, startedAt, endBreakEarly) : value)
    setNow(startedAt)
    setModuleComplete(false)
    setConfirmSubmit(false)
    setNavigatorOpen(false)
    setNotesOpen(false)
    setCalculatorOpen(false)
    setFormulaSheetOpen(false)
    setToolsOpen(false)
    setMoreOpen(false)
    setDirectionsOpen(false)
    setExitConfirmOpen(false)
    setZoom(1)
  }, [modules, persistUpdate, submitAttempt])

  const endCurrentModule = useCallback(() => {
    if (moduleIndex === modules.length - 1) {
      setConfirmSubmit(true)
    } else {
      setModuleComplete(true)
    }
  }, [moduleIndex, modules.length])

  useEffect(() => {
    if (attempt) {
      saveSATAttempt(attempt)
      saveActiveTestPaper(`profai:sat:${test.id}:attempt:v1`, baseTest)
    }
  }, [attempt, test, baseTest])

  useEffect(() => {
    const current = attemptRef.current
    if (!current || current.status !== 'active' || current.pausedModuleSeconds === undefined) return
    persistUpdate((value) => resumeModule(value, modules))
  }, [modules, persistUpdate])

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
    if (
      !attempt ||
      attempt.status !== 'active' ||
      attempt.mode !== 'exam' ||
      attempt.pausedModuleSeconds !== undefined
    ) return
    if (attempt.sectionBreak) {
      if (now >= attempt.sectionBreak.endsAt) advanceModule()
      return
    }
    if (testSeconds <= 0) advanceModule()
  }, [
    attempt,
    advanceModule,
    now,
    testSeconds,
  ])

  useEffect(() => {
    if (!attempt || attempt.status !== 'active' || attempt.sectionBreak) return
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        calculatorOpen ||
        notesOpen ||
        navigatorOpen ||
        exitConfirmOpen || moduleComplete || confirmSubmit || directionsOpen
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
        setToolsOpen((value) => !value)
      } else if (key === 'n') {
        event.preventDefault()
        openNotes()
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
    openNotes,
    persistUpdate,
    questionIndex,
    exitConfirmOpen, moduleComplete, confirmSubmit, directionsOpen,
  ])

  if (!attempt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mt-4 text-2xl font-black"><UiText text={"No SAT attempt found"} /></h1>
          <p className="mt-2 text-sm leading-6 text-slate-500"><UiText text={"Choose Practice or Exam Mode before opening the test."} /></p>
          <button type="button" onClick={() => navigate(`/mock/sat/${test.mockId}${sectionQuery}`)} className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white">
            <UiText text={"Choose test mode"} />
          </button>
        </div>
      </main>
    )
  }

  if (submission.pending) return <SATSubmissionScreen />
  if (submission.error) return (
    <main className="exam-flow attempt-entry">
      <section role="alert" className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-bold"><UiText text="Your answers are still here" /></h1>
        <p className="my-4"><UiText text="Your results could not be saved. Free up browser storage, then try again." /></p>
        <button type="button" className="rounded-xl bg-red-700 px-5 py-3 font-bold text-white" onClick={submitAttempt}>
          <UiText text="Try again" />
        </button>
      </section>
    </main>
  )

  if (attempt.status === 'submitted') {
    return <Navigate replace to={`/sat/results/${encodeURIComponent(attempt.attemptId)}`} state={{ returnTo: backPath, justCompleted: true, diagnostic }} />
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
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-red-300"><UiText text={"Exam integrity"} /></p>
          <h1 className="mt-2 text-3xl font-black"><UiText text={"Attempt ended"} /></h1>
          <p className="mt-3 text-sm font-medium leading-6 text-white/65">
            <UiText text={"This exam attempt has ended and cannot be resumed. Start a new attempt to take the test again."} />
          </p>
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="mt-6 w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-slate-950"
          >
            <UiText text={"Return to SAT Arena"} />
          </button>
        </motion.section>
      </main>
    )
  }

  if (attempt.sectionBreak) {
    return <SATSectionBreak endsAt={attempt.sectionBreak.endsAt} now={now} onContinue={() => advanceModule(true)} onExit={() => {
      pauseAndSaveAttempt()
      if (fullscreenElement()) void exit()
      navigate(backPath)
    }} />
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
  const learnerName = user?.fullName || 'Ivygoo Student'

  if (moduleComplete || confirmSubmit) return <SATModuleReview
    module={currentModule} attempt={attempt} time={formatTime(testSeconds)} final={confirmSubmit}
    continueLabel={confirmSubmit ? 'Submit & score' : needsSATSectionBreak(attempt, modules) ? 'Start 10-minute break' : 'Continue to next module'}
    onBack={() => { setModuleComplete(false); setConfirmSubmit(false) }}
    onQuestion={index => { setModuleComplete(false); setConfirmSubmit(false); goToQuestion(index) }}
    onContinue={confirmSubmit ? submitAttempt : () => advanceModule()}
  />

  return (
    <main className="sat-exam-run flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#f7f8fa] text-[#151515]">
      <header className="relative z-[80] shrink-0 border-b border-slate-200 bg-white">
        <div className="relative mx-auto grid max-w-[112rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-8">
          <div className="min-w-0 font-serif">
            <h1 className="truncate font-serif text-base font-bold text-slate-800 sm:text-xl lg:text-2xl">
              <UiText text={"Section"} /> {sectionNumber}<UiText text={", Module"} /> {moduleNumber}: {sectionTitle}
            </h1>
            <button type="button" onClick={() => setDirectionsOpen(true)} className="mt-0.5 text-sm font-bold text-[#2355ed] hover:underline sm:text-base">
              <UiText text={"Directions"} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTimerVisible((value) => !value)}
            className="flex min-w-24 items-center justify-center gap-2 font-serif text-2xl font-bold tabular-nums sm:text-3xl"
            title={timerVisible ? 'Hide timer' : 'Show timer'}
          >
            {timerVisible ? formatTime(testSeconds) : <UiText text={"Hidden"} />}
            <EyeOff className="h-5 w-5 text-slate-600" />
          </button>

          <div className="col-span-2 flex items-center justify-end gap-1 sm:gap-3 md:col-span-1">
            {currentModule.section === 'math' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFormulaSheetOpen((value) => !value)
                    setCalculatorOpen(false)
                    setToolsOpen(false)
                    setMoreOpen(false)
                  }}
                  aria-label={uiCopy("Open SAT formula sheet")}
                  aria-expanded={formulaSheetOpen}
                  aria-controls="sat-formula-sheet"
                  title={uiCopy("Formula Sheet")}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl px-3 font-serif text-sm font-bold transition sm:px-4 ${formulaSheetOpen ? 'bg-[#4053d7] text-white' : 'bg-sky-50 text-sky-800 hover:bg-sky-100'}`}
                >
                  <Sheet className="h-5 w-5" /> <span className="hidden xl:inline"><UiText text={"Formula Sheet"} /></span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalculatorOpen((value) => !value)
                    setFormulaSheetOpen(false)
                    setToolsOpen(false)
                    setMoreOpen(false)
                  }}
                  aria-expanded={calculatorOpen}
                  aria-label={calculatorOpen ? 'Close Desmos calculator' : 'Open Desmos calculator'}
                  title={calculatorOpen ? uiCopy("Close Desmos") : 'Open Desmos'}
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
            <button type="button" onClick={() => setNavigatorOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600" aria-label={uiCopy("Open question navigator")}>
              <FileText className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label={uiCopy("Highlights & Notes")} aria-expanded={toolsOpen}
              onClick={() => { setToolsOpen((open) => !open); setMoreOpen(false) }}
              className="flex items-center gap-2 px-2 py-2 font-serif text-sm font-bold text-slate-700 sm:text-base"
            >
              <NotebookPen className="h-6 w-6" /> <span className="hidden sm:inline"><UiText text={"Highlights & Notes"} /></span>
            </button>
            <button
              type="button"
              aria-label={uiCopy("More")}
              onClick={() => { setMoreOpen((open) => !open); setToolsOpen(false) }}
              className="flex flex-col items-center px-2 py-1 font-serif text-xs font-bold text-slate-700"
            >
              <EllipsisVertical className="h-6 w-6" /> <span className="hidden sm:block"> <UiText text={"More"} /> </span>
            </button>
          </div>

          {toolsOpen ? (
            <div className="absolute right-4 top-[calc(100%+.5rem)] z-50 max-h-[calc(100dvh-8rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-300 bg-white p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black"><UiText text={"Highlights & Notes"} /></p>
                <button type="button" aria-label={uiCopy("Close highlights and notes")} onClick={() => setToolsOpen(false)} className="text-slate-500"><X className="h-4 w-4" /></button>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-600"><UiText text={"Select text to highlight it in one of four colors. Click a highlight to remove it."} /></p>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => changeHighlights(currentStrokes.slice(0, -1))} disabled={!currentStrokes.length} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-30" title={uiCopy("Undo")}><Undo2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => changeHighlights([])} disabled={!currentStrokes.length} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-30" title={uiCopy("Clear")}><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 max-h-[min(18rem,40dvh)] overflow-y-auto"><SATNoteList value={attempt.notes[currentQuestion.id]} /></div>
              <button type="button" onClick={openNotes} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-3 py-3 text-xs font-black text-white">
                <NotebookPen className="h-4 w-4" /> {readSATNotes(attempt.notes[currentQuestion.id]).length ? <UiText text={"Manage notes ({{value1}})"} values={{ value1: String(readSATNotes(attempt.notes[currentQuestion.id]).length) }} /> : <UiText text={"Add note"} />}
              </button>
            </div>
          ) : null}

          {moreOpen ? (
            <div className="absolute right-4 top-[calc(100%+.5rem)] z-50 w-56 rounded-2xl border border-slate-300 bg-white p-2 shadow-2xl">
              <div className="flex items-center gap-1 rounded-xl px-2 py-2">
                <button type="button" aria-label={uiCopy("Zoom out")} disabled={zoom <= 0.7} onClick={() => setZoom((value) => Math.max(0.7, Number((value - 0.1).toFixed(2))))} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30"><ZoomOut className="h-4 w-4" /></button>
                <span className="min-w-16 flex-1 text-center text-xs font-black tabular-nums">{Math.round(zoom * 100)}%</span>
                <button type="button" aria-label={uiCopy("Zoom in")} disabled={zoom >= 1.6} onClick={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(2))))} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30"><ZoomIn className="h-4 w-4" /></button>
              </div>
              <button type="button" onClick={() => { setZoom(1); setMoreOpen(false) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black hover:bg-slate-100"><Undo2 className="h-4 w-4" /> <UiText text={"Reset zoom"} /></button>
              {supported && <button type="button" onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black hover:bg-slate-100">
                <ZoomIn className="h-4 w-4" /> {isFullscreen ? <UiText text={"Exit fullscreen"} /> : <UiText text={"Enter fullscreen"} />}
              </button>}
              <button type="button" onClick={exitTest} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black text-[#4053d7] hover:bg-indigo-50"><Save className="h-4 w-4" /> <UiText text="Save and exit" /></button>
            </div>
          ) : null}
        </div>
        <div className="h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" />
      </header>

      <div className="sat-exam-workspace">
      <div ref={questionViewportRef} className={`sat-exam-viewport min-h-0 flex-1 overflow-y-auto overflow-x-hidden transition-[padding] duration-300 ${calculatorOpen && calculatorDocked ? 'lg:pr-[50vw]' : ''}`}>
        <div
          className="sat-exam-paper-wrap origin-top-left"
          style={{ zoom } as CSSProperties}
        >
        <SATQuestionCanvas
          question={currentQuestion}
          answer={currentAnswer}
          onAnswer={updateAnswer}
          strokes={currentStrokes}
          eliminatedChoices={attempt.eliminatedChoices?.[currentQuestion.id] ?? []}
          onEliminatedChoicesChange={(choices) => persistUpdate((current) => ({
            ...current,
            eliminatedChoices: { ...current.eliminatedChoices, [currentQuestion.id]: choices },
            answers: { ...current.answers, [currentQuestion.id]: choices.includes(current.answers[currentQuestion.id]) ? '' : current.answers[currentQuestion.id] ?? '' },
          }))}
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
                <p className="text-xs font-bold text-slate-500"><UiText text={"Your response is saved automatically."} /></p>
                {currentAnswer ? <button type="button" onClick={() => updateAnswer('')} className="text-xs font-black text-red-700"> <UiText text={"Clear"} /> </button> : null}
              </div>
              <button
                type="button"
                disabled={!currentAnswer || practiceChecked}
                onClick={() => setCheckedQuestions((current) => [...new Set([...current, currentQuestion.id])])}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Lightbulb className="h-4 w-4" /> {practiceChecked ? <UiText text={"Answer checked"} /> : <UiText text={"Check answer"} />}
              </button>
              {practiceChecked ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 rounded-xl border-2 p-4 ${practiceCorrect ? 'border-emerald-600 bg-emerald-50' : 'border-red-600 bg-red-50'}`}>
                  <div className="flex items-start gap-3">
                    {practiceCorrect ? <Sparkles className="mt-0.5 h-5 w-5 text-emerald-700" /> : <XCircle className="mt-0.5 h-5 w-5 text-red-700" />}
                    <div>
                      <p className={`font-serif text-base font-bold ${practiceCorrect ? 'text-emerald-900' : 'text-red-900'}`}>{practiceCorrect ? <UiText text={"Correct answer"} /> : <UiText text={"Incorrect — correct answer: {{value1}}"} values={{ value1: String(currentQuestion.correctAnswer) }} />}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600"><UiText text={"Review the reasoning before moving to the next question."} /></p>
                    </div>
                  </div>
                  <details className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-3">
                    <summary className="cursor-pointer text-xs font-black text-slate-800"><UiText text={"Step-by-step explanation"} /></summary>
                    <SATExplanation question={currentQuestion} response={attempt.answers[currentQuestion.id]} className="mt-3" />
                  </details>
                </motion.div>
              ) : null}
            </div>
          ) : null}
        />
        </div>
      </div>
      <SATFormulaSheet open={formulaSheetOpen && currentModule.section === 'math'} onClose={() => setFormulaSheetOpen(false)} />
      </div>

      <footer className="relative z-[70] shrink-0 bg-[#e7edf8]">
        <div className="h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" />
        <div className="mx-auto grid min-h-20 max-w-[112rem] grid-cols-[1fr_auto] items-center gap-3 px-4 py-2 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <p className="hidden truncate font-serif text-lg font-bold text-slate-800 md:block">{learnerName}</p>
          <button type="button" onClick={() => setNavigatorOpen(true)} className="inline-flex h-12 items-center justify-center gap-3 rounded-2xl bg-black px-5 font-serif text-base font-bold text-white sm:text-lg">
            <UiText text={"Question"} /> {questionIndex + 1} <UiText text={"of"} /> {currentModule.questions.length} <ChevronDown className="h-4 w-4" />
          </button>
          <div className="flex items-center justify-end gap-2">
            <button type="button" disabled={questionIndex === 0} onClick={() => goToQuestion(questionIndex - 1)} className="h-12 rounded-full bg-[#4053d7] px-5 font-serif text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-7 sm:text-lg"> <UiText text={"Back"} /> </button>
            {questionIndex < currentModule.questions.length - 1 ? (
              <button type="button" onClick={() => goToQuestion(questionIndex + 1)} className="h-12 rounded-full bg-[#4053d7] px-5 font-serif text-base font-bold text-white sm:px-7 sm:text-lg"> <UiText text={"Next"} /> </button>
            ) : (
              <button type="button" onClick={endCurrentModule} className="h-12 rounded-full bg-black px-5 font-serif text-sm font-bold text-white sm:px-7 sm:text-base"><UiText text={"Review module"} /></button>
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

      <AnimatePresence>
        {directionsOpen ? (
          <motion.div
            key="directions"
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
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4053d7]"><UiText text={"Test directions"} /></p>
                  <h2 className="mt-1 font-serif text-xl font-bold sm:text-2xl"><UiText text={"Section"} /> {sectionNumber}<UiText text={", Module"} /> {moduleNumber}: {sectionTitle}</h2>
                </div>
                <button type="button" onClick={() => setDirectionsOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300"><X className="h-4 w-4" /></button>
              </header>
              <div className="px-5 py-6 font-serif text-base leading-7 text-slate-700 sm:px-7 sm:text-lg">
                {currentModule.section === 'reading-writing' ? (
                  <p><UiText text={"Read each passage carefully and choose the answer that is best supported by the text and standard written English. You may move between questions in this module and mark any question for review."} /></p>
                ) : (
                  <p><UiText text={"Solve each problem and select or enter the best answer. Desmos is built into the Math toolbar and opens without leaving the test. You may move between questions in this module and mark any question for review."} /></p>
                )}
                <p className="mt-4"><UiText text={"Your answers, notes, highlights, and current position are saved automatically on this device."} /></p>
              </div>
              <footer className="flex justify-end border-t border-slate-300 bg-slate-50 px-5 py-4 sm:px-7">
                <button type="button" onClick={() => setDirectionsOpen(false)} className="rounded-full bg-[#4053d7] px-6 py-3 font-serif text-base font-bold text-white"> <UiText text={"Continue"} /> </button>
              </footer>
            </motion.section>
          </motion.div>
        ) : null}

        {navigatorOpen ? (
          <motion.div
            key="question-navigator"
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
                  <h2 className="mt-1 font-serif text-xl font-bold"><UiText text={"Question navigator"} /></h2>
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
                  {attempt.mode === 'practice' ? <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-600" />  <UiText text={"Correct"} /> </span> : null}
                  {attempt.mode === 'practice' ? <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-600" />  <UiText text={"Incorrect"} /> </span> : null}
                  <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-950" /> <UiText text={"Answered"} /></span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-slate-300 bg-slate-50" />  <UiText text={"Unanswered"} /> </span>
                  <span className="inline-flex items-center gap-1.5"><Flag className="h-3 w-3 fill-amber-400 text-amber-500" /> <UiText text={"Flagged"} /></span>
                </div>
              </div>
              <footer className="flex items-center justify-between gap-3 border-t border-slate-300 bg-[#e7edf8] px-5 py-4">
                <p className="text-[10px] font-bold text-slate-500">
                  {answeredInModule} <UiText text={"answered ·"} /> {currentModule.questions.length - answeredInModule} <UiText text={"remaining"} />
                </p>
                <button type="button" onClick={endCurrentModule} className="rounded-full bg-[#4053d7] px-5 py-2.5 text-[10px] font-black text-white">
                  <UiText text={"Finish module"} />
                </button>
              </footer>
            </motion.section>
          </motion.div>
        ) : null}

        {notesOpen ? (
          <motion.div
            key="question-notes"
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
              className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-300 bg-white p-5 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sat-note-title"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#4053d7]"><UiText text={"Private notes"} /></p>
                  <h2 id="sat-note-title" className="mt-1 font-serif text-xl font-bold"><UiText text={"Question"} /> {currentQuestion.number}</h2>
                </div>
                <button type="button" aria-label={uiCopy("Close notes")} onClick={() => setNotesOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SATNotes key={currentQuestion.id} value={attempt.notes[currentQuestion.id]} onChange={notes => {
                persistUpdate(current => ({ ...current, notes: { ...current.notes, [currentQuestion.id]: notes } }))
              }} />
            </motion.section>
          </motion.div>
        ) : null}

        <ConfirmDialog open={exitConfirmOpen} title={uiCopy("Save and exit?")} description={uiCopy("Your answers, notes and remaining SAT time will be saved. Continue later from SAT / In process.")} confirmLabel={uiCopy("Save & exit")} cancelLabel={uiCopy("Continue test")} onClose={continueExam} onConfirm={saveAndExit} />
      </AnimatePresence>
    </main>
  )
}
