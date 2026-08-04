import { useState, useMemo, useEffect, useRef, useCallback, Fragment, type MouseEvent as ReactMouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  BookmarkIcon,
  ChatBubbleBottomCenterTextIcon,
  LightBulbIcon,
  ComputerDesktopIcon,
  CheckIcon,
  ChevronDownIcon,
  XMarkIcon,
  ClockIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Bars3Icon,
  PaperAirplaneIcon,
  SpeakerWaveIcon,
  PlayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

// Types
import { IELTSTest, TestResult, Section, Question, ListeningGroup, ListeningBlock, ListeningSegment } from '../types/ieltsTypes'

// Components
import SplitScreen from './SplitScreen'
import Timer from './Timer'
import QuestionNavigation from './QuestionNavigation'
import NotesPanel from './NotesPanel'
import WordLookupModal from './vocab/WordLookupModal'
import TestLaunchOverlay from './common/TestLaunchOverlay'

// Utils
import {
  calculateBandScore,
  evaluateReadingAnswers,
  formatQuestionNumberRange,
} from '../utils/ieltsUtils'
import { AnimatedBackground } from './AnimatedBackground'
import { useBadgeStore } from '@/store/badgeStore'
import { useAuthStore, type AuthState } from '@/store/authStore'

interface IELTSReadingInterfaceProps {
  test: IELTSTest
  onComplete: (results: TestResult) => void
  onExit: () => void
  reviewPayload?: {
    result: TestResult
    showCorrectAnswers?: boolean
  }
  launchPreset?: {
    mode?: 'practice' | 'simulation'
    partIndex?: number
    durationMinutes?: number
  }
}

// Paragraph labels (A, B, C...) are only shown when the passage has questions
// that explicitly ask students to identify paragraphs by letter (matching-headings
// or matching-information where the options are single uppercase letters).
const sectionIdsWithoutParagraphLabels = new Set([
  'day1-curie-p1',
  'day6-neuroscientist-p3',
  'day7-london-underground-p1',
  'day11-mary-rose-p1',
  'day13-neuroaesthetics-p3',
  'day14-pagodas-p1',
  'day17-story-of-silk-p1',
  'day18-great-migrations-p2',
  'day21-fishbourne-palace-p1',
  'day23-food-desert-p3',
  'pacific-voyaging-p2-v4',
])

function sectionHasLabeledParagraphs(section: Section | undefined): boolean {
  if (!section) return false
  if (typeof section.showParagraphLabels === 'boolean') return section.showParagraphLabels
  if (sectionIdsWithoutParagraphLabels.has(section.id)) return false
  return section.questions.some(
    (q) =>
      q.type === 'matching-headings' ||
      (q.type === 'matching-information' &&
        Array.isArray(q.options) &&
        q.options.some((opt) => /^[A-Z]$/.test(opt))),
  )
}

function resolvePassageNumber(section: Section | undefined, fallback: number): number {
  const match = section?.title?.match(/\bPassage\s+([1-3])\b/i)
  return match ? Number(match[1]) : fallback
}

function passageDisplayTitle(section: Section | undefined): string {
  const title = section?.title?.trim() ?? ''
  return title
    .replace(/^Day\s+\d+\s+Passage\s+\d+:?\s*/i, '')
    .replace(/^Reading\s+Passage\s+\d+:?\s*/i, '')
    .trim()
}

function formatShortDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function sanitizeSelectedParts(value: number[] | undefined, sectionCount: number): number[] {
  if (sectionCount <= 0) return []
  const fallback = [0]
  if (!value || value.length === 0) return fallback

  const normalized = Array.from(new Set(value))
    .filter((entry) => Number.isInteger(entry) && entry >= 0 && entry < sectionCount)
    .sort((left, right) => left - right)

  return normalized.length > 0 ? normalized : fallback
}

function getQuestionSlotCount(question: Question): number {
  if (
    (question.type === 'five-true-statements' || question.type === 'drag-drop-summary') &&
    Array.isArray(question.correctAnswer)
  ) {
    return Math.max(1, question.correctAnswer.length)
  }
  return 1
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function filledArrayItemsCount(value: unknown): number {
  if (!Array.isArray(value)) return 0
  return value.filter((entry) => String(entry ?? '').trim().length > 0).length
}

function CompactSelect({ options, value, onChange, disabled = false }: { options: string[], value: any, onChange: (val: any) => void, disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block align-middle" ref={containerRef}>
      <button type="button"
        onClick={(e) => { if (disabled) return; e.stopPropagation(); setIsOpen(!isOpen); }}
        disabled={disabled}
        className={`inline-flex h-10 min-w-[7.25rem] items-center justify-between gap-2 rounded-xl border px-3 text-xs font-bold uppercase tracking-[0.06em] transition-all ${value ? 'border-red-500 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_10px_20px_rgba(220,38,38,0.32)]' : 'border-red-200 bg-white text-slate-600 shadow-sm hover:border-red-400'} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <span className="truncate whitespace-nowrap">{value || '?'}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute left-0 top-full z-50 mt-1 min-w-[7.25rem] max-h-48 overflow-y-auto rounded-xl border border-red-200 bg-white shadow-[0_18px_28px_rgba(220,38,38,0.18)]"
          >
            {options.map((opt) => {
              const label = opt.split('.')[0].trim();
              return (
                <button type="button"
                  key={opt}
                  onClick={(e) => { e.stopPropagation(); onChange(label); setIsOpen(false); }}
                  className="w-full whitespace-nowrap px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.06em] transition-colors hover:bg-red-600 hover:text-white"
                >
                  {label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PremiumCard({ children, onClick, className = "", gradient = "from-red-500 to-rose-500" }: { children: React.ReactNode, onClick?: () => void, className?: string, gradient?: string }) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-3xl border border-red-100 bg-white/95 backdrop-blur-xl shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)] transition-all duration-300 group cursor-pointer ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(239, 68, 68, 0.16), transparent)`,
        }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <div className="relative h-full z-10">{children}</div>
    </motion.div>
  )
}

export default function IELTSReadingInterface({
  test,
  onComplete,
  onExit,
  reviewPayload,
  launchPreset,
}: IELTSReadingInterfaceProps) {
  const isReviewMode = Boolean(reviewPayload?.result)
  const isListening = test.module === 'Listening'
  const awardBadge = useBadgeStore((s) => s.awardIfEligible)
  const badgeUserId = useAuthStore((s: AuthState) => s.user?.id ?? null)
  // Listening audio state (continuous, non-controllable playlist)
  const [audioStarted, setAudioStarted] = useState(false)
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioDone, setAudioDone] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // True while a clip is meant to be playing. Lets us block external pauses
  // (media keys / OS controls) and avoid fighting an intentional stop.
  const shouldPlayRef = useRef(false)
  // State
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({})
  const [timeRemaining, setTimeRemaining] = useState(test.duration * 60)
  const [isTestActive, setIsTestActive] = useState(isReviewMode)
  const [showModeModal, setShowModeModal] = useState(false)
  const [testMode, setTestMode] = useState<'practice' | 'simulation'>('simulation')
  const [selectedParts, setSelectedParts] = useState<number[]>(() => sanitizeSelectedParts([0, 1, 2], test.sections.length))
  const [customTime, setCustomTime] = useState(60)
  const [showNotes, setShowNotes] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([])
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)
  const [selectedText, setSelectedText] = useState('')
  // "Ask AI about this word" lookup (Reading + Listening). Saved words land in My Words.
  const [aiLookup, setAiLookup] = useState<{ word: string; sentence: string } | null>(null)
  const [lastActiveQuestionIndex, setLastActiveQuestionIndex] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const launchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [contrastMode, setContrastMode] = useState<'normal' | 'high' | 'yellow-black' | 'sepia'>('normal')
  const [textSizeMode, setTextSizeMode] = useState<'regular' | 'large' | 'xlarge'>('regular')
  const [readingFont, setReadingFont] = useState<'sans' | 'serif'>('sans')
  const [highlightPopover, setHighlightPopover] = useState<{
    top: number
    left: number
    target: HTMLElement
    markType: 'highlight' | 'note'
    noteText?: string
  } | null>(null)
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false)
  const [showSubmitLoading, setShowSubmitLoading] = useState(false)
  const [integrityWarning, setIntegrityWarning] = useState<{
    attemptKind: 'passage' | 'full-test'
    minTimeSec: number
    actualTimeSec: number
  } | null>(null)
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false)
  const [reviewShowCorrectAnswers, setReviewShowCorrectAnswers] = useState(Boolean(reviewPayload?.showCorrectAnswers))
  const [optionsPage, setOptionsPage] = useState<'menu' | 'contrast' | 'text-size' | 'font'>('menu')
  const [activeDragSlots, setActiveDragSlots] = useState<Record<string, number | null>>({})
  const [activeDragOption, setActiveDragOption] = useState<Record<string, string | null>>({})
  const [noteComposer, setNoteComposer] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    value: string
    range: Range | null
    target: HTMLElement | null
    selectionPreview: string
  }>({
    open: false,
    mode: 'create',
    value: '',
    range: null,
    target: null,
    selectionPreview: '',
  })

  const testShellRef = useRef<HTMLDivElement>(null)
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedRangeRef = useRef<Range | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const launchPresetAppliedRef = useRef(false)
  const contrastClass =
    contrastMode === 'high'
      ? 'reading-contrast-high'
      : contrastMode === 'yellow-black'
        ? 'reading-contrast-yellow'
        : contrastMode === 'sepia'
          ? 'reading-contrast-sepia'
          : 'reading-contrast-default'

  // --- Session Persistence ---
  const sessionKey = `ielts_test_session_${test.id}`

  useEffect(() => {
    if (!isReviewMode || !reviewPayload?.result) return
    setAnswers(reviewPayload.result.answers ?? {})
    setTimeRemaining(-1)
    setIsTestActive(true)
    setShowModeModal(false)
    setShowReviewModal(false)
    setShowSubmitConfirmModal(false)
    setShowSubmitLoading(false)
    setShowExitConfirmModal(false)
    setShowNotes(false)
    setActiveDragSlots({})
    setActiveDragOption({})
    setCurrentSectionIndex(0)
    setLastActiveQuestionIndex(0)
  }, [isReviewMode, reviewPayload])

  // Load session on mount
  useEffect(() => {
    if (isReviewMode) return
    const savedSession = localStorage.getItem(sessionKey)
    if (savedSession) {
      try {
        const data = JSON.parse(savedSession)
        setCurrentSectionIndex(data.currentSectionIndex ?? 0)
        setAnswers(data.answers ?? {})
        setTimeRemaining(data.timeRemaining ?? test.duration * 60)
        setIsTestActive(false)
        setTestMode(data.testMode ?? 'simulation')
        setSelectedParts(sanitizeSelectedParts(data.selectedParts, test.sections.length))
        setCustomTime(data.customTime ?? 60)
        setFlaggedQuestions(data.flaggedQuestions ?? [])
        setLastActiveQuestionIndex(data.lastActiveQuestionIndex ?? 0)
        startedAtRef.current = typeof data.startedAt === 'number' ? data.startedAt : null

      } catch (e) {
        console.error("Failed to restore session", e)
      }
    }
  }, [isReviewMode, sessionKey, test.duration, test.id, test.sections.length])

  useEffect(() => {
    setSelectedParts((current) => sanitizeSelectedParts(current, test.sections.length))
  }, [test.sections.length])

  // Keep user's theme intact during test; instead add a small flag class to the document for test-specific styling
  useEffect(() => {
    if (isTestActive) {
      document.documentElement.classList.add('test-active')
    } else {
      document.documentElement.classList.remove('test-active')
    }
  }, [isTestActive])

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', syncFullscreenState)
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [])

  // Save session on changes
  useEffect(() => {
    if (isReviewMode) return
    if (!isTestActive) return // Only save if the test has started

    const sessionData = {
      currentSectionIndex,
      answers,
      timeRemaining,
      isTestActive,
      testMode,
      selectedParts,
      customTime,
      flaggedQuestions,
      lastActiveQuestionIndex,
      startedAt: startedAtRef.current,
      timestamp: Date.now()
    }
    localStorage.setItem(sessionKey, JSON.stringify(sessionData))
  }, [
    currentSectionIndex,
    answers,
    timeRemaining,
    isTestActive,
    testMode,
    selectedParts,
    customTime,
    flaggedQuestions,
    lastActiveQuestionIndex,
    sessionKey,
    isReviewMode,
  ])

  // Clear session helper
  const clearSession = () => {
    localStorage.removeItem(sessionKey)
    startedAtRef.current = null
  }

  const reviewActiveSectionIds = useMemo(() => {
    if (!isReviewMode || !reviewPayload?.result) return null
    const ids = reviewPayload.result.detailedBreakdown?.activeSectionIds?.filter((entry) => typeof entry === 'string' && entry.trim().length > 0) ?? []
    if (ids.length > 0) return ids

    const inferred = reviewPayload.result.detailedBreakdown?.readingAnalysis?.sectionSummaries
      ?.map((summary) => summary.sectionId)
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0) ?? []

    return inferred.length > 0 ? Array.from(new Set(inferred)) : null
  }, [isReviewMode, reviewPayload])

  // FILTER LOGIC: Use activeSections based on user selection in practice mode
  const activeSections = useMemo(() => {
    if (isReviewMode) {
      const allSections = test.sections as Section[]
      if (!reviewActiveSectionIds || reviewActiveSectionIds.length === 0) return allSections
      const filtered = allSections.filter((section) => reviewActiveSectionIds.includes(section.id))
      return filtered.length > 0 ? filtered : allSections
    }
    if (testMode === 'simulation') return test.sections as Section[]
    const safeSelectedParts = sanitizeSelectedParts(selectedParts, test.sections.length)
    return (test.sections as Section[]).filter((_, i) => safeSelectedParts.includes(i))
  }, [isReviewMode, reviewActiveSectionIds, test.sections, testMode, selectedParts])

  useEffect(() => {
    if (currentSectionIndex < activeSections.length) return
    setCurrentSectionIndex(0)
    setLastActiveQuestionIndex(0)
  }, [activeSections.length, currentSectionIndex])

  const currentSection = activeSections[currentSectionIndex] || activeSections[0]
  const isDayOneCurieSection = currentSection?.id === 'day1-curie-p1'
  const currentPassageNumber = resolvePassageNumber(currentSection, currentSectionIndex + 1)

  // ---- Listening: continuous non-controllable audio playlist ----
  const listeningAudioSources = useMemo(
    () => (isListening ? (test.continuousAudioUrl ? [test.continuousAudioUrl] : activeSections.map((section) => section.audioUrl ?? '')) : []),
    [isListening, activeSections, test.continuousAudioUrl],
  )
  const listeningQuestionByNumber = useMemo(() => {
    const map = new Map<number, Question>()
    if (isListening) {
      ;(test.sections as Section[]).forEach((section) =>
        section.questions.forEach((question) => map.set(question.number, question)),
      )
    }
    return map
  }, [isListening, test.sections])

  useEffect(() => {
    if (!isListening || !audioStarted || audioDone) return
    const audio = audioRef.current
    if (!audio) return
    shouldPlayRef.current = true
    audio.play().then(() => setIsAudioPlaying(true)).catch(() => setIsAudioPlaying(false))
  }, [isListening, audioStarted, currentAudioIndex, audioDone])

  // Fully stop the listening audio and prevent any auto-resume.
  const stopListeningAudio = useCallback(() => {
    shouldPlayRef.current = false
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      try { audio.currentTime = 0 } catch { /* ignore */ }
    }
    setIsAudioPlaying(false)
  }, [])

  // Stop for good once the test is no longer running (exit / submit).
  useEffect(() => {
    if (isListening && !isTestActive) stopListeningAudio()
  }, [isListening, isTestActive, stopListeningAudio])

  // Release the element on unmount so nothing keeps playing after you leave.
  useEffect(() => () => {
    shouldPlayRef.current = false
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  }, [])

  const startListeningAudio = () => {
    shouldPlayRef.current = true
    setAudioStarted(true)
  }

  // IELTS listening is continuous and may not be paused. If the audio is paused
  // from outside the app (media keys, OS / browser media controls) while a clip
  // should still be playing, resume it right away.
  const handleAudioPause = () => {
    const audio = audioRef.current
    if (shouldPlayRef.current && audio && !audio.ended) {
      audio.play().catch(() => { /* ignore */ })
      return
    }
    setIsAudioPlaying(false)
  }

  const handleListeningAudioEnded = () => {
    const next = currentAudioIndex + 1
    if (next < listeningAudioSources.length && listeningAudioSources[next]) {
      setCurrentAudioIndex(next)
    } else {
      shouldPlayRef.current = false
      setAudioDone(true)
      setIsAudioPlaying(false)
    }
  }

  const activeQuestionCount = useMemo(
    () =>
      activeSections.reduce(
        (total, section) => total + section.questions.reduce((sum, question) => sum + getQuestionSlotCount(question), 0),
        0,
      ),
    [activeSections],
  )
  const leaderboardAttemptKind = activeQuestionCount >= 27 ? 'full-test' : 'passage'
  const minimumLeaderboardTimeSec = leaderboardAttemptKind === 'full-test' ? 30 * 60 : 10 * 60
  const testQuestionNumberCeiling = useMemo(
    () => Math.max(
      test.totalQuestions,
      ...test.sections.flatMap((section) =>
        section.questions.map((question) => question.number + getQuestionSlotCount(question) - 1),
      ),
    ),
    [test],
  )

  const sectionMeta = useMemo(() => {
    let currentIndex = 0;
    return activeSections.map((s, sectionIndex) => {
      const start = currentIndex;
      const questionIds: string[] = [];
      const questionNumbers: number[] = [];
      s.questions.forEach(q => {
        const slotCount = getQuestionSlotCount(q)
        for (let i = 0; i < slotCount; i++) {
          questionIds.push(q.id)
          questionNumbers.push(q.number + i)
        }
        currentIndex += slotCount
      });
      const questionCount = questionIds.length;
      return {
        id: s.id,
        title: s.title,
        partNumber: resolvePassageNumber(s, sectionIndex + 1),
        startIndex: start,
        questionCount,
        questionIds,
        questionNumbers,
      }
    })
  }, [activeSections]);

  const submitPreview = useMemo(() => {
    const sections = activeSections.map((section, sectionIndex) => {
      let answered = 0
      let total = 0

      section.questions.forEach((question) => {
        const answer = answers[question.id]
        const slotCount = getQuestionSlotCount(question)

        total += slotCount

        if (question.type === 'five-true-statements') {
          const selectedCount = filledArrayItemsCount(answer)
          answered += Math.min(slotCount, selectedCount)
          return
        }

        if (question.type === 'drag-drop-summary') {
          const selectedCount = filledArrayItemsCount(answer)
          answered += Math.min(slotCount, selectedCount)
          return
        }

        if (answer !== undefined && answer !== '' && (!Array.isArray(answer) || filledArrayItemsCount(answer) > 0)) {
          answered += 1
        }
      })

      return {
        sectionId: section.id,
        partNumber: resolvePassageNumber(section, sectionIndex + 1),
        title: section.title,
        answered,
        total,
      }
    })

    const total = sections.reduce((sum, section) => sum + section.total, 0)
    const answered = sections.reduce((sum, section) => sum + section.answered, 0)
    const unanswered = Math.max(0, total - answered)

    return {
      sections,
      total,
      answered,
      unanswered,
      completion: total ? Math.round((answered / total) * 100) : 0,
    }
  }, [answers, activeSections])

  const reviewAnalysis = useMemo(() => {
    if (!isReviewMode || !reviewPayload?.result) return null
    return evaluateReadingAnswers(test.sections as Section[], reviewPayload.result.answers)
  }, [isReviewMode, reviewPayload, test.sections])

  const reviewQuestionMap = useMemo(() => {
    const map = new Map<string, { status: 'correct' | 'incorrect' | 'skipped'; correctAnswer: string | string[] }>()
    if (!reviewAnalysis) return map
    reviewAnalysis.questionResults.forEach((entry) => {
      map.set(entry.questionId, {
        status: entry.status,
        correctAnswer: entry.correctAnswer,
      })
    })
    return map
  }, [reviewAnalysis])

  const readAnswerArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return []
    return value.map((entry) => String(entry ?? ''))
  }

  const readNonEmptyAnswerArray = (value: unknown): string[] => {
    return readAnswerArray(value).filter((entry) => entry.trim().length > 0)
  }

  const normalizeChoiceToken = (value: string): string => {
    const trimmed = value.trim().toUpperCase()
    if (!trimmed) return ''
    const match = trimmed.match(/^([A-Z0-9]+)(?:[.)\]:\-\s]|$)/)
    return (match?.[1] ?? trimmed).trim()
  }

  const getQuestionReviewMeta = (question: Question) => reviewQuestionMap.get(question.id)

  const getSelectedChoiceTokens = (question: Question): string[] => {
    const rawValue = answers[question.id]
    if (Array.isArray(rawValue)) {
      return rawValue.map((entry) => normalizeChoiceToken(String(entry))).filter(Boolean)
    }
    if (rawValue === undefined || rawValue === null) return []
    return [normalizeChoiceToken(String(rawValue))].filter(Boolean)
  }

  const getCorrectChoiceTokens = (question: Question): string[] => {
    const meta = getQuestionReviewMeta(question)
    if (!meta) return []
    const candidates = Array.isArray(meta.correctAnswer) ? meta.correctAnswer : [meta.correctAnswer]
    return candidates.map((entry) => normalizeChoiceToken(String(entry))).filter(Boolean)
  }

  const getChoiceVisualState = (
    question: Question,
    optionTokenRaw: string,
  ): 'default' | 'selected' | 'correct' | 'wrong' | 'missed' => {
    const optionToken = normalizeChoiceToken(optionTokenRaw)
    const selectedTokens = getSelectedChoiceTokens(question)
    const isSelected = selectedTokens.includes(optionToken)

    if (!isReviewMode || !reviewShowCorrectAnswers) {
      return isSelected ? 'selected' : 'default'
    }

    const meta = getQuestionReviewMeta(question)
    if (!meta) return isSelected ? 'selected' : 'default'

    const correctTokens = getCorrectChoiceTokens(question)
    const isCorrectOption = correctTokens.includes(optionToken)

    if (isSelected && isCorrectOption) return 'correct'
    if (isSelected && !isCorrectOption) return 'wrong'
    if (!isSelected && isCorrectOption && meta.status !== 'correct') return 'missed'
    return 'default'
  }

  const reviewHint = (question: Question, className = 'mt-1.5') => {
    if (!isReviewMode || !reviewShowCorrectAnswers) return null
    const meta = reviewQuestionMap.get(question.id)
    if (!meta) return null
    if (meta.status === 'correct') {
      return (
        <div className={`${className} rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 shadow-[0_8px_18px_rgba(16,185,129,0.16)]`}>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-emerald-700">
            Question {question.number} - Correct
          </p>
        </div>
      )
    }
    const correct = Array.isArray(meta.correctAnswer) ? meta.correctAnswer.join(', ') : String(meta.correctAnswer)
    return (
      <div className={`${className} rounded-xl border border-red-300 bg-red-50 px-3 py-2 shadow-[0_8px_18px_rgba(239,68,68,0.16)]`}>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-red-700">
          Question {question.number} - Wrong
        </p>
        <p className="mt-1 text-xs font-bold text-slate-700">
          Correct answer:{' '}
          <span className="rounded-md border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
            {correct}
          </span>
        </p>
      </div>
    )
  }

  const unwrapMarkedNode = (node: HTMLElement) => {
    const parent = node.parentNode
    if (!parent) return
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node)
    }
    parent.removeChild(node)
  }

  const resolveMarkableContainerForNode = (node: Node | null): HTMLElement | null => {
    if (!node) return null
    if (node instanceof Element) {
      return node.closest<HTMLElement>('[data-reading-markable="1"]')
    }
    return node.parentElement?.closest<HTMLElement>('[data-reading-markable="1"]') ?? null
  }

  const resolveMarkableContainerForRange = (range: Range): HTMLElement | null => {
    const startContainer = resolveMarkableContainerForNode(range.startContainer)
    const endContainer = resolveMarkableContainerForNode(range.endContainer)
    if (!startContainer || !endContainer) return null
    return startContainer === endContainer ? startContainer : null
  }

  const isRangeInsideContainer = (range: Range, container: HTMLElement) =>
    container.contains(range.startContainer) && container.contains(range.endContainer)

  const collectIntersectingNodes = (range: Range, container: HTMLElement, selector: string) => {
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((node) => {
      try {
        return range.intersectsNode(node)
      } catch {
        return false
      }
    })
  }

  const expandRangeWithNodes = (sourceRange: Range, nodes: HTMLElement[]) => {
    const expanded = sourceRange.cloneRange()
    nodes.forEach((node) => {
      const nodeRange = document.createRange()
      nodeRange.selectNodeContents(node)
      if (nodeRange.compareBoundaryPoints(Range.START_TO_START, expanded) < 0) {
        expanded.setStart(nodeRange.startContainer, nodeRange.startOffset)
      }
      if (nodeRange.compareBoundaryPoints(Range.END_TO_END, expanded) > 0) {
        expanded.setEnd(nodeRange.endContainer, nodeRange.endOffset)
      }
    })
    return expanded
  }

  const unwrapNodes = (nodes: HTMLElement[]) => {
    nodes
      .sort((left, right) => {
        const leftDepth = getNodeDepth(left)
        const rightDepth = getNodeDepth(right)
        return rightDepth - leftDepth
      })
      .forEach((node) => unwrapMarkedNode(node))
  }

  const collectRangeTextNodes = (range: Range, container: HTMLElement) => {
    const selections: Array<{ node: Text; start: number; end: number }> = []
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: (candidate) => {
        const node = candidate as Text
        const content = node.textContent ?? ''
        if (!content.trim()) return NodeFilter.FILTER_REJECT
        try {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        } catch {
          return NodeFilter.FILTER_REJECT
        }
      },
    })

    let current = walker.nextNode()
    while (current) {
      const node = current as Text
      const length = node.textContent?.length ?? 0
      let start = 0
      let end = length
      if (node === range.startContainer) start = range.startOffset
      if (node === range.endContainer) end = range.endOffset
      if (start < end) {
        const piece = node.textContent?.slice(start, end) ?? ''
        if (piece.trim()) {
          selections.push({ node, start, end })
        }
      }
      current = walker.nextNode()
    }

    return selections
  }

  const createMarkNode = (
    type: 'highlight' | 'note',
    groupId: string,
    noteText?: string,
  ) => {
    const span = document.createElement('span')
    span.className = type === 'highlight' ? 'ielts-highlight ielts-highlight--primary' : 'ielts-note'
    span.dataset.readingMark = '1'
    span.dataset.markType = type
    span.dataset.markGroup = groupId

    if (type === 'note') {
      const resolvedNote = noteText?.trim() ?? ''
      span.dataset.note = resolvedNote
      if (resolvedNote) {
        span.title = `Note: ${resolvedNote}`
      } else {
        span.removeAttribute('title')
      }
    }

    return span
  }

  useEffect(() => {
    const handleSelection = () => {
      // Clear any pending timer
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current)

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        // Small delay to prevent flickering when clicking buttons
        selectionTimerRef.current = setTimeout(() => {
          setSelectionRect(null);
          setSelectedText('');
          selectedRangeRef.current = null
        }, 150)
        return;
      }

      const range = selection.getRangeAt(0);
      const markableContainer = resolveMarkableContainerForRange(range)

      if (markableContainer && isRangeInsideContainer(range, markableContainer)) {
        const rect = range.getBoundingClientRect();
        const selected = selection.toString().trim()
        if (!selected || rect.width <= 0 || rect.height <= 0) {
          setSelectionRect(null)
          setSelectedText('')
          selectedRangeRef.current = null
          return
        }
        selectedRangeRef.current = range.cloneRange()
        setSelectionRect(rect);
        setSelectedText(selected);
        setHighlightPopover(null)
      } else {
        setSelectionRect(null);
        setSelectedText('');
        selectedRangeRef.current = null
      }
    };
    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection)
      if (selectionTimerRef.current) {
        clearTimeout(selectionTimerRef.current)
      }
      selectedRangeRef.current = null
    };
  }, []);

  const collectRelatedMarkNodes = (node: HTMLElement, container: HTMLElement) => {
    const groupId = node.dataset.markGroup
    const selectionRange = document.createRange()
    selectionRange.selectNodeContents(node)

    return Array.from(
      container.querySelectorAll<HTMLElement>('.ielts-highlight, .ielts-note'),
    ).filter((entry) => {
      if (entry === node) return true
      if (groupId && entry.dataset.markGroup === groupId) return true
      if (entry.contains(node) || node.contains(entry)) return true
      try {
        return selectionRange.intersectsNode(entry)
      } catch {
        return false
      }
    })
  }

  const removeMarkCluster = (node: HTMLElement | null) => {
    if (!node) return false
    const markableContainer = node.closest<HTMLElement>('[data-reading-markable="1"]')
    if (!markableContainer) return false
    const markNodes = collectRelatedMarkNodes(node, markableContainer)
    if (markNodes.length === 0) return false

    markNodes
      .sort((left, right) => {
        const leftDepth = getNodeDepth(left)
        const rightDepth = getNodeDepth(right)
        return rightDepth - leftDepth
      })
      .forEach((entry) => unwrapMarkedNode(entry))

    return true
  }

  const removeActiveHighlight = () => {
    const removed = removeMarkCluster(highlightPopover?.target ?? null)
    if (!removed) return
    setHighlightPopover(null)
    setSelectionRect(null)
    setSelectedText('')
    selectedRangeRef.current = null
  }

  const closeNoteComposer = () => {
    setNoteComposer({
      open: false,
      mode: 'create',
      value: '',
      range: null,
      target: null,
      selectionPreview: '',
    })
  }

  const editActiveNote = () => {
    if (!highlightPopover || highlightPopover.markType !== 'note') return
    const node = highlightPopover.target
    const currentNote = node.dataset.note ?? ''
    setNoteComposer({
      open: true,
      mode: 'edit',
      value: currentNote,
      range: null,
      target: node,
      selectionPreview: '',
    })
    setHighlightPopover(null)
  }

  const getNodeDepth = (node: Node) => {
    let depth = 0
    let current: Node | null = node
    while (current?.parentNode) {
      depth += 1
      current = current.parentNode
    }
    return depth
  }

  const applyMarkAtRange = (
    activeRange: Range,
    type: 'highlight' | 'note',
    noteText = '',
  ): HTMLElement[] => {
    const markableContainer = resolveMarkableContainerForRange(activeRange)
    if (!markableContainer || !isRangeInsideContainer(activeRange, markableContainer)) return []

    try {
      let workingRange = activeRange.cloneRange()
      const createdNodes: HTMLElement[] = []
      if (type === 'highlight') {
        const touchingHighlights = collectIntersectingNodes(activeRange, markableContainer, '.ielts-highlight')
        if (touchingHighlights.length > 0) {
          workingRange = expandRangeWithNodes(activeRange, touchingHighlights)
          unwrapNodes(touchingHighlights)
        }
      } else {
        const touchingNotes = collectIntersectingNodes(activeRange, markableContainer, '.ielts-note')
        if (touchingNotes.length > 0) {
          unwrapNodes(touchingNotes)
        }
      }

      const targets = collectRangeTextNodes(workingRange, markableContainer)
      if (targets.length === 0) return []
      const markGroupId = `mark-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

      targets.forEach(({ node, start, end }) => {
        let selectedNode = node
        if (start > 0) {
          selectedNode = selectedNode.splitText(start)
        }
        const spanLength = end - start
        if (spanLength < selectedNode.length) {
          selectedNode.splitText(spanLength)
        }
        const markNode = createMarkNode(type, markGroupId, noteText)
        selectedNode.parentNode?.insertBefore(markNode, selectedNode)
        markNode.appendChild(selectedNode)
        createdNodes.push(markNode)
      })

      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
      }
      selectedRangeRef.current = null
      setSelectionRect(null)
      setSelectedText('')
      setHighlightPopover(null)
      return createdNodes
    } catch (error) {
      console.error('Could not apply reading mark', error)
      return []
    }
  }

  const saveNoteComposer = () => {
    const trimmed = noteComposer.value.trim()
    if ((noteComposer.mode === 'edit' || noteComposer.mode === 'create') && noteComposer.target) {
      noteComposer.target.dataset.note = trimmed
      if (trimmed) {
        noteComposer.target.title = `Note: ${trimmed}`
      } else {
        noteComposer.target.removeAttribute('title')
      }
      setHighlightPopover((current) => (current ? { ...current, noteText: trimmed } : null))
      closeNoteComposer()
      return
    }

    if (noteComposer.mode === 'create' && noteComposer.range) {
      applyMarkAtRange(noteComposer.range, 'note', trimmed)
    }
    closeNoteComposer()
  }

  const applyHighlight = (type: 'highlight' | 'note') => {
    if (!selectionRect || !selectedText) return;
    const selection = window.getSelection()
    const activeRange = selection && selection.rangeCount > 0 && !selection.isCollapsed
      ? selection.getRangeAt(0).cloneRange()
      : selectedRangeRef.current?.cloneRange()
    if (!activeRange) return

    if (type === 'note') {
      setHighlightPopover(null)
      const preview = selectedText.length > 220 ? `${selectedText.slice(0, 220)}...` : selectedText
      const createdNodes = applyMarkAtRange(activeRange, 'note', '')
      const primaryNode = createdNodes[0]
      if (!primaryNode) return
      setNoteComposer({
        open: true,
        mode: 'create',
        value: '',
        range: null,
        target: primaryNode,
        selectionPreview: preview,
      })
      return
    }

    applyMarkAtRange(activeRange, 'highlight')
  }

  const handleMarkPaneClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest('.ielts-highlight, .ielts-note') as HTMLElement | null
    if (!target) {
      setHighlightPopover(null)
      return
    }
    const rect = target.getBoundingClientRect()
    setHighlightPopover({
      top: rect.bottom + 10,
      left: rect.left + rect.width / 2,
      target,
      markType: target.classList.contains('ielts-note') ? 'note' : 'highlight',
      noteText: target.dataset.note,
    })
  }

  const getQuestionGlobalIndex = (sectionIdx: number, qIdx: number) => {
    const section = activeSections[sectionIdx]
    if (!section) return 0
    let offset = 0
    for (let j = 0; j < qIdx; j++) {
      const question = section.questions[j]
      offset += getQuestionSlotCount(question)
    }
    return sectionMeta[sectionIdx].startIndex + offset
  }

  const getCurrentSectionGlobalIndex = (questionId: string) => {
    if (!currentSection) return 0
    const localIndex = currentSection.questions.findIndex((entry) => entry.id === questionId)
    if (localIndex < 0) return 0
    return getQuestionGlobalIndex(currentSectionIndex, localIndex)
  }

  const handleStartTest = (preset?: {
    mode?: 'practice' | 'simulation'
    selectedParts?: number[]
    customTime?: number
  }) => {
    const effectiveMode = preset?.mode ?? testMode
    const effectiveCustomTime = preset?.customTime ?? customTime
    const normalizedParts = sanitizeSelectedParts(preset?.selectedParts ?? selectedParts, test.sections.length)
    setTestMode(effectiveMode)
    setCustomTime(effectiveCustomTime)
    setSelectedParts(normalizedParts)

    setAnswers({})
    setFlaggedQuestions([])
    setActiveDragSlots({})
    setActiveDragOption({})
    setSelectionRect(null)
    setSelectedText('')

    if (effectiveMode === 'practice') {
      setTimeRemaining(effectiveCustomTime === -1 ? -1 : effectiveCustomTime * 60)
    } else {
      setTimeRemaining(test.duration * 60)
    }
    setCurrentSectionIndex(0)
    setLastActiveQuestionIndex(0)
    setShowModeModal(false)

    // Brief "your test will begin shortly" loader before dropping into the exam.
    setIsLaunching(true)
    if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
    launchTimerRef.current = setTimeout(() => {
      startedAtRef.current = Date.now()
      setIsTestActive(true)
      setIsLaunching(false)
      launchTimerRef.current = null
    }, 2200)
  }

  useEffect(() => () => {
    if (launchTimerRef.current) clearTimeout(launchTimerRef.current)
    // StrictMode (dev) runs a simulated unmount that clears the launch timer
    // above; without resetting this guard the remount would not re-apply the
    // preset, leaving the "begin shortly" overlay stuck. Resetting lets the
    // auto-start re-run cleanly.
    launchPresetAppliedRef.current = false
  }, [])

  useEffect(() => {
    if (isReviewMode || isTestActive || launchPresetAppliedRef.current || !launchPreset) return

    const desiredMode = launchPreset.mode === 'practice' ? 'practice' : 'simulation'
    const desiredPart =
      typeof launchPreset.partIndex === 'number'
        ? clamp(Math.round(launchPreset.partIndex), 1, test.sections.length)
        : undefined
    const desiredDuration =
      typeof launchPreset.durationMinutes === 'number'
        ? clamp(Math.round(launchPreset.durationMinutes), 5, 180)
        : undefined

    launchPresetAppliedRef.current = true
    handleStartTest({
      mode: desiredMode,
      selectedParts: desiredMode === 'practice' && desiredPart ? [desiredPart - 1] : undefined,
      customTime: desiredMode === 'practice' && desiredDuration ? desiredDuration : undefined,
    })
  }, [isReviewMode, isTestActive, launchPreset, test.sections.length])

  const getCurrentTimeSpent = () => {
    const elapsedByClock = Math.max(0, (testMode === 'practice' && customTime !== -1 ? customTime : test.duration) * 60 - Math.max(0, timeRemaining))
    const elapsedByTimestamp = startedAtRef.current ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)) : 0
    return Math.max(elapsedByClock, elapsedByTimestamp)
  }

  const completeAndSubmitTest = (leaderboardEligible = true) => {
    const analysis = evaluateReadingAnswers(activeSections, answers)
    const correctCount = analysis.summary.correctAnswers
    const totalQuestions = analysis.summary.totalQuestions
    const isPartial = activeSections.length < test.sections.length
    const score = isPartial ? 0 : calculateBandScore(correctCount)
    const timeSpent = getCurrentTimeSpent()

    const result: TestResult = {
      testId: test.id,
      date: new Date().toISOString(),
      score,
      correctAnswers: correctCount,
      totalQuestions: totalQuestions,
      timeSpent,
      answers,
      isPartial,
      detailedBreakdown: {
        activeSectionIds: activeSections.map(s => s.id),
        readingAnalysis: analysis
      },
      leaderboardEligible,
    }
    onComplete(result)
    // Full simulation (not partial-part practice) → award an IELTS Reading/Listening
    // band badge with celebration. Practice mode never awards a badge.
    if (testMode === 'simulation' && !isPartial) {
      awardBadge({
        userId: badgeUserId,
        track: isListening ? 'IELTS_LISTENING' : 'IELTS_READING',
        band: score,
        mode: 'simulation',
        source: isListening ? 'ielts-listening-sim' : 'ielts-reading-sim',
      })
    }
    clearSession()
  }

  const beginSubmitLoading = (leaderboardEligible = true) => {
    if (showSubmitLoading) return
    stopListeningAudio()
    setShowSubmitLoading(true)
    window.setTimeout(() => {
      setShowSubmitLoading(false)
      completeAndSubmitTest(leaderboardEligible)
    }, 3000)
  }

  const warnBeforeLeaderboardSubmit = (timeSpent: number) => {
    setIntegrityWarning({
      attemptKind: leaderboardAttemptKind,
      minTimeSec: minimumLeaderboardTimeSec,
      actualTimeSec: timeSpent,
    })
  }

  const confirmSubmitTest = () => {
    setShowSubmitConfirmModal(false)
    const timeSpent = getCurrentTimeSpent()
    if (!isReviewMode && timeSpent < minimumLeaderboardTimeSec) {
      warnBeforeLeaderboardSubmit(timeSpent)
      return
    }
    beginSubmitLoading(true)
  }

  const submitWithoutLeaderboardPoints = () => {
    setIntegrityWarning(null)
    beginSubmitLoading(false)
  }

  const openSubmitModal = () => {
    if (isReviewMode) return
    if (showSubmitLoading) return
    setShowSubmitConfirmModal(true)
  }

  const handleTimeUp = () => {
    if (isReviewMode) return
    if (showSubmitLoading) return
    beginSubmitLoading(getCurrentTimeSpent() >= minimumLeaderboardTimeSec)
  }

  const handleAnswerChange = (qId: string, value: string | number | string[]) => {
    if (isReviewMode) return
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  const assignDragDropAnswer = (qId: string, slotIndex: number, value: string, slotCount: number) => {
    if (isReviewMode) return
    const normalizedValue = value.trim()
    if (!normalizedValue) return
    if (slotIndex < 0 || slotIndex >= slotCount) return
    setAnswers((prev) => {
      const current = Array.from({ length: slotCount }, (_, index) => {
        const existing = (prev[qId] as string[] | undefined)?.[index]
        return typeof existing === 'string' ? existing : ''
      })

      const duplicateIndex = current.findIndex(
        (entry, index) => index !== slotIndex && entry.trim().toLowerCase() === normalizedValue.toLowerCase(),
      )
      if (duplicateIndex >= 0) {
        current[duplicateIndex] = ''
      }

      current[slotIndex] = normalizedValue
      return { ...prev, [qId]: current }
    })
    setActiveDragSlots((prev) => ({ ...prev, [qId]: slotIndex }))
    setActiveDragOption((prev) => ({ ...prev, [qId]: null }))
  }

  const clearDragDropSlot = (qId: string, slotIndex: number, slotCount: number) => {
    if (isReviewMode) return
    if (slotIndex < 0 || slotIndex >= slotCount) return
    setAnswers((prev) => {
      const current = Array.from({ length: slotCount }, (_, index) => {
        const existing = (prev[qId] as string[] | undefined)?.[index]
        return typeof existing === 'string' ? existing : ''
      })
      current[slotIndex] = ''
      return { ...prev, [qId]: current }
    })
    setActiveDragSlots((prev) => ({ ...prev, [qId]: slotIndex }))
  }

  const queueDragDropOption = (qId: string, value: string) => {
    if (isReviewMode) return
    const normalizedValue = value.trim()
    if (!normalizedValue) return
    setActiveDragOption((prev) => ({ ...prev, [qId]: normalizedValue }))
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const target = testShellRef.current ?? document.documentElement
        await target.requestFullscreen()
        return
      }
      await document.exitFullscreen()
    } catch (error) {
      console.error('Fullscreen toggle failed', error)
    }
  }

  const proceedExitTest = () => {
    stopListeningAudio()
    clearSession()
    setIsTestActive(false)
    setShowExitConfirmModal(false)
    onExit()
  }

  const handleExitTest = () => {
    if (isReviewMode || !isTestActive) {
      proceedExitTest()
      return
    }
    setShowExitConfirmModal(true)
  }

  const handleNavigateQuestion = (globalIndex: number) => {
    setLastActiveQuestionIndex(globalIndex);
    const targetSectionIdx = sectionMeta.findIndex(s =>
      globalIndex >= s.startIndex && globalIndex < (s.startIndex + s.questionCount)
    );
    if (targetSectionIdx !== -1 && targetSectionIdx !== currentSectionIndex) {
      setCurrentSectionIndex(targetSectionIdx);
    }
    setTimeout(() => {
      if (targetSectionIdx === -1) return;
      const meta = sectionMeta[targetSectionIdx];
      const localIdx = globalIndex - meta.startIndex;
      const qId = meta.questionIds[localIdx];
      if (qId) {
        const el = document.getElementById(`question-card-${qId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }

  const handleSectionChange = (index: number) => {
    setCurrentSectionIndex(index);
    setLastActiveQuestionIndex(sectionMeta[index].startIndex);
  }

  const handleFlagQuestion = (globalIndex: number) => {
    if (flaggedQuestions.includes(globalIndex)) {
      setFlaggedQuestions(prev => prev.filter(i => i !== globalIndex))
    } else {
      setFlaggedQuestions(prev => [...prev, globalIndex])
    }
  }

  const renderPassageOneNotesGroup = (questions: Question[]) => {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black leading-tight text-slate-900">Questions 1-7</h4>
        <p className="mt-1 text-sm text-slate-700">
          Complete the notes. Write <span className="font-black text-slate-900">ONE WORD ONLY</span> from the text for each answer.
        </p>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-[#fefefe] px-3 py-2.5">
          <p className="text-lg leading-tight font-black text-slate-900 sm:text-xl">The life and work of Georgia O&apos;Keeffe</p>

          <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-slate-900">
            {questions.map((question) => {
              const globalIdx = getCurrentSectionGlobalIndex(question.id)
              const isFlagged = flaggedQuestions.includes(globalIdx)
              const meta = getQuestionReviewMeta(question)
              const isCorrect = meta?.status === 'correct'
              const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
              return (
                <li key={question.id} id={`question-card-${question.id}`} className="rounded-lg border border-transparent px-1 py-1">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleFlagQuestion(globalIdx)}
                      className={`mt-1 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                      title={`Flag question ${question.number}`}
                    >
                      <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                    </button>
                    <span className="pt-0.5 select-none text-slate-600">•</span>
                    <span className="flex-1">
                      {question.text.split(/(______|_+)/).map((part, partIndex) =>
                        /^_+$/.test(part) || part === '______' ? (
                          <input
                            key={`${question.id}-blank-${partIndex}`}
                            type="text"
                            value={(answers[question.id] as string) || ''}
                            onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                            disabled={isReviewMode}
                            className={`mx-1 inline-flex h-8 min-w-[88px] max-w-[140px] rounded-md border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                              isReviewMode && reviewShowCorrectAnswers
                                ? isWrong
                                  ? 'border-red-300 bg-red-50/70 text-red-700'
                                  : isCorrect
                                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                                    : 'border-slate-300'
                                : 'border-slate-400'
                            }`}
                            placeholder={String(question.number)}
                          />
                        ) : (
                          <span key={`${question.id}-text-${partIndex}`}>{part}</span>
                        ),
                      )}
                    </span>
                  </div>
                  {reviewHint(question, 'ml-8 mt-1')}
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    )
  }

  const renderFrozenFoodNotesGroup = (questions: Question[]) => {
    const questionByNumber = new Map<number, Question>(questions.map((question) => [question.number, question]))

    const renderLine = (questionNumber: number, prefix: string, suffix = '') => {
      const question = questionByNumber.get(questionNumber)
      if (!question) return null

      const globalIdx = getCurrentSectionGlobalIndex(question.id)
      const isFlagged = flaggedQuestions.includes(globalIdx)
      const meta = getQuestionReviewMeta(question)
      const isCorrect = meta?.status === 'correct'
      const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'

      return (
        <div key={question.id} id={`question-card-${question.id}`} className="py-1.5">
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => handleFlagQuestion(globalIdx)}
              className={`mt-0.5 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
              title={`Flag question ${question.number}`}
            >
              <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
            </button>
            <span className="pt-0.5 select-none text-slate-600">•</span>
            <p className="flex-1 text-[15px] leading-relaxed text-slate-900">
              {prefix}
              <input
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                disabled={isReviewMode}
                className={`mx-1 inline-flex h-9 min-w-[112px] max-w-[190px] rounded-lg border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                  isReviewMode && reviewShowCorrectAnswers
                    ? isWrong
                      ? 'border-red-300 bg-red-50/70 text-red-700'
                      : isCorrect
                        ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                        : 'border-red-200'
                    : 'border-red-200'
                }`}
                placeholder={String(question.number)}
              />
              {suffix}
            </p>
          </div>
          {reviewHint(question, 'ml-8 mt-1')}
        </div>
      )
    }

    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black leading-tight text-slate-900">Questions 1-7</h4>
        <p className="mt-1 text-sm text-slate-700">
          Complete the notes below. Choose <span className="font-black text-slate-900">ONE WORD ONLY</span> from the passage for each answer.
        </p>

        <div className="mt-2 rounded-xl border border-red-100 bg-white px-3 py-3">
          <p className="text-center text-3xl font-black tracking-tight text-slate-900">The history of frozen food</p>

          <div className="mt-2.5 space-y-1">
            <div>
              <p className="text-2xl font-black leading-tight text-slate-900">2,000 years ago, South America</p>
              {renderLine(1, 'People conserved the nutritional value of ', ', using a method of freezing then drying.')}
            </div>

            <div>
              <p className="text-2xl font-black leading-tight text-slate-900">1851, USA</p>
              {renderLine(2, '', ' was kept cool by ice during transportation in specially adapted trains.')}
            </div>

            <div>
              <p className="text-2xl font-black leading-tight text-slate-900">1880, Australia</p>
              {renderLine(3, 'Two kinds of ', ' were the first frozen foods shipped to England.')}
            </div>

            <div>
              <p className="text-2xl font-black leading-tight text-slate-900">1917 onwards, USA</p>
              <p className="pl-8 text-[15px] leading-relaxed text-slate-900">• Clarence Birdseye introduced innovations including:</p>
              {renderLine(4, 'quick-freezing methods, so that ', ' did not spoil the food')}
              {renderLine(5, 'packaging products with ', ', so the product was visible.')}
            </div>

            <div>
              <p className="text-2xl font-black leading-tight text-slate-900">Early 1940s, USA</p>
              {renderLine(6, 'Frozen food became popular because of a shortage of ', '')}
            </div>

            <div>
              <p className="text-2xl font-black leading-tight text-slate-900">1950s, USA</p>
              {renderLine(7, 'A large number of homes now had a ', '')}
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderCoconutPalmTableGroup = (questions: Question[]) => {
    const questionByNumber = new Map<number, Question>(questions.map((question) => [question.number, question]))

    const renderInput = (questionNumber: number) => {
      const question = questionByNumber.get(questionNumber)
      if (!question) return null

      const meta = getQuestionReviewMeta(question)
      const isCorrect = meta?.status === 'correct'
      const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'

      return (
        <span id={`question-card-${question.id}`} className="inline-flex align-middle">
          <input
            type="text"
            value={(answers[question.id] as string) || ''}
            onChange={(event) => handleAnswerChange(question.id, event.target.value)}
            disabled={isReviewMode}
            className={`mx-1 inline-flex h-8 min-w-[94px] max-w-[150px] rounded-md border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
              isReviewMode && reviewShowCorrectAnswers
                ? isWrong
                  ? 'border-red-300 bg-red-50/70 text-red-700'
                  : isCorrect
                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                    : 'border-slate-300'
                : 'border-slate-300'
            }`}
            placeholder={String(question.number)}
          />
        </span>
      )
    }

    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">Questions 1-8</h4>
        <p className="mt-1 text-sm text-slate-700">
          Choose <span className="font-black text-slate-900">ONE WORD ONLY</span> from the passage for each answer.
        </p>

        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-300">
          <table className="min-w-[760px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50">
                <th className="w-[23%] px-2 py-2 text-base font-black text-slate-900">Part</th>
                <th className="w-[27%] border-l border-slate-300 px-2 py-2 text-base font-black text-slate-900">Description</th>
                <th className="w-[50%] border-l border-slate-300 px-2 py-2 text-base font-black text-slate-900">Uses</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-2 font-semibold text-slate-900">trunk</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-800">up to 30 metres</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  timber for houses and the making of {renderInput(1)}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-2 font-semibold text-slate-900">leaves</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-800">up to 6 metres long</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">to make brushes</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-2 font-semibold text-slate-900">flowers</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-800">at the top of the trunk</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  stems provide sap, used as a drink or a source of {renderInput(2)}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-2 font-semibold text-slate-900">fruits</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-800">outer layer</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900"></td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-2"></td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-800">middle layer (coir fibres)</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  used for {renderInput(3)}, etc.
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-2"></td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-800">inner layer (shell)</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  <div className="leading-relaxed">• a source of {renderInput(4)}</div>
                  <div className="leading-relaxed">• (when halved) for {renderInput(5)}</div>
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-2"></td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-800">coconut water</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  <div className="leading-relaxed">• a drink</div>
                  <div className="leading-relaxed">• a source of {renderInput(6)} for other plants</div>
                </td>
              </tr>
              <tr>
                <td className="px-2 py-2"></td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-800">coconut flesh</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  <div className="leading-relaxed">• oil and milk for cooking and {renderInput(7)}</div>
                  <div className="leading-relaxed">• glycerine (an ingredient in {renderInput(8)})</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {isReviewMode ? (
          <div className="mt-2 space-y-1">
            {questions.map((question) => (
              <div key={`coconut-hint-${question.id}`}>{reviewHint(question)}</div>
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  const renderNutmegTimelineGroup = (questions: Question[]) => {
    const questionByNumber = new Map<number, Question>(questions.map((question) => [question.number, question]))

    const renderInput = (questionNumber: number) => {
      const question = questionByNumber.get(questionNumber)
      if (!question) return null

      const meta = getQuestionReviewMeta(question)
      const isCorrect = meta?.status === 'correct'
      const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'

      return (
        <span id={`question-card-${question.id}`} className="inline-flex align-middle">
          <input
            type="text"
            value={(answers[question.id] as string) || ''}
            onChange={(event) => handleAnswerChange(question.id, event.target.value)}
            disabled={isReviewMode}
            className={`mx-1 inline-flex h-8 min-w-[94px] max-w-[160px] rounded-md border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
              isReviewMode && reviewShowCorrectAnswers
                ? isWrong
                  ? 'border-red-300 bg-red-50/70 text-red-700'
                  : isCorrect
                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                    : 'border-slate-300'
                : 'border-slate-300'
            }`}
            placeholder={String(question.number)}
          />
        </span>
      )
    }

    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">Questions 8-13</h4>
        <p className="mt-1 text-sm text-slate-700">
          Complete the table below. Write <span className="font-black text-slate-900">ONLY ONE WORD</span> from the passage.
        </p>

        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-300">
          <table className="min-w-[760px] w-full border-collapse text-left text-sm">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="w-[22%] px-2 py-2 font-semibold text-slate-900">Middle Ages</td>
                <td className="w-[78%] border-l border-slate-300 px-2 py-2 text-slate-900">
                  Nutmeg was brought to Europe by the {renderInput(8)}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-2 py-2 font-semibold text-slate-900">16th century</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  European nations took control of the nutmeg trade
                </td>
              </tr>
              <tr className="border-b border-slate-300 align-top">
                <td className="px-2 py-2 font-semibold text-slate-900">17th century</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  <div className="leading-relaxed">• Demand for nutmeg grew, as it was believed to be effective against the disease known as the {renderInput(9)}</div>
                  <div className="leading-relaxed">• The Dutch took control of the Banda Islands</div>
                  <div className="leading-relaxed">• restricted nutmeg production to a few areas</div>
                  <div className="leading-relaxed">• put {renderInput(10)} on nutmeg to avoid it being cultivated outside the islands</div>
                  <div className="leading-relaxed">• finally obtained the island of {renderInput(11)} from the British</div>
                </td>
              </tr>
              <tr className="align-top">
                <td className="px-2 py-2 font-semibold text-slate-900">Late 18th century</td>
                <td className="border-l border-slate-300 px-2 py-2 text-slate-900">
                  <div className="leading-relaxed">• 1770 - nutmeg plants were secretly taken to {renderInput(12)}</div>
                  <div className="leading-relaxed">• 1778 - half the Banda Islands' nutmeg plantations were destroyed by a {renderInput(13)}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {isReviewMode ? (
          <div className="mt-2 space-y-1">
            {questions.map((question) => (
              <div key={`nutmeg-table-hint-${question.id}`}>{reviewHint(question)}</div>
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  const renderManateesNotesGroup = (questions: Question[]) => {
    const questionByNumber = new Map<number, Question>(questions.map((question) => [question.number, question]))

    const renderBlankLine = (questionNumber: number, prefix: string, suffix?: string) => {
      const question = questionByNumber.get(questionNumber)
      if (!question) return null

      const globalIdx = getCurrentSectionGlobalIndex(question.id)
      const isFlagged = flaggedQuestions.includes(globalIdx)
      const meta = getQuestionReviewMeta(question)
      const isCorrect = meta?.status === 'correct'
      const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'

      return (
        <div key={question.id} id={`question-card-${question.id}`} className="py-1.5">
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => handleFlagQuestion(globalIdx)}
              className={`mt-0.5 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
            >
              <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
            </button>
            <p className="flex-1 text-[15px] leading-relaxed text-slate-900">
              {prefix}
              <input
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                disabled={isReviewMode}
                className={`mx-1 inline-flex h-9 min-w-[102px] max-w-[170px] rounded-lg border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                  isReviewMode && reviewShowCorrectAnswers
                    ? isWrong
                      ? 'border-red-300 bg-red-50/70 text-red-700'
                      : isCorrect
                        ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                        : 'border-red-200'
                    : 'border-red-200'
                }`}
                placeholder={String(question.number)}
              />
              {suffix ?? ''}
            </p>
          </div>
          {reviewHint(question, 'ml-8 mt-1')}
        </div>
      )
    }

    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">Questions 1-6</h4>
        <p className="mt-1 text-sm text-slate-700">
          Complete the notes below. Choose <span className="font-black text-slate-900">ONE WORD AND/OR A NUMBER</span> from the passage for each answer.
        </p>

        <div className="mt-2 rounded-xl border border-red-100 bg-white px-3 py-3">
          <p className="text-center text-3xl font-black tracking-tight text-slate-900">Manatees</p>

          <div className="mt-2.5 space-y-1.5">
            <div className="space-y-0.5">
              <p className="text-lg font-black text-slate-900">Appearance</p>
              <div className="mt-2">
                {renderBlankLine(1, '• look similar to dugongs, but with a differently shaped ', '')}
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-lg font-black text-slate-900">Movement</p>
              <div className="mt-2 space-y-2">
                <p className="pl-7 text-[15px] leading-relaxed text-slate-900">• have fewer neck bones than most mammals</p>
                {renderBlankLine(2, '• need to use their ', ' to help to turn their bodies around in order to look sideways')}
                {renderBlankLine(3, '• sense vibrations in the water by means of ', ' on their skin')}
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-lg font-black text-slate-900">Feeding</p>
              <div className="mt-2 space-y-2">
                {renderBlankLine(4, '• eat mainly aquatic vegetation, such as ', '')}
                {renderBlankLine(5, '• grasp and pull up plants with their ', '')}
              </div>
            </div>

            <div className="space-y-0.5">
              <p className="text-lg font-black text-slate-900">Breathing</p>
              <div className="mt-2 space-y-2">
                <p className="pl-7 text-[15px] leading-relaxed text-slate-900">
                  • come to the surface for air every 2-4 minutes when awake and every 15-20 while sleeping
                </p>
                {renderBlankLine(6, '• may regulate the ', ' of their bodies by using muscles of diaphragm to store air internally')}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderPassageTwoMatrixGroup = (questions: Question[]) => {
    const optionLabels = questions[0]?.options ?? []
    const firstNumber = questions[0]?.number ?? 0
    const lastNumber = questions[questions.length - 1]?.number ?? firstNumber
    const title = firstNumber && lastNumber ? `Questions ${firstNumber}-${lastNumber}` : 'Questions'
    const instruction =
      questions[0]?.instruction ??
      'The text has sections. Which section contains the following information? Choose the correct paragraph.'

    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black leading-tight text-slate-900">{title}</h4>
        <p className="mt-1 text-sm text-slate-700">{instruction}</p>

        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-300">
          <table className="min-w-[760px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50">
                <th className="w-[44%] px-2 py-2 text-base font-black text-slate-900">Item</th>
                {optionLabels.map((label) => (
                  <th key={`matrix-head-${label}`} className="w-[9%] border-l border-slate-300 px-2 py-2 text-center text-base font-black text-slate-900">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => {
                const globalIdx = getCurrentSectionGlobalIndex(question.id)
                const isFlagged = flaggedQuestions.includes(globalIdx)
                return (
                  <tr key={question.id} id={`question-card-${question.id}`} className="border-b border-slate-300 last:border-b-0">
                    <td className="px-2 py-2 align-top">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleFlagQuestion(globalIdx)}
                          className={`mt-0.5 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                        >
                          <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                        </button>
                        <p className="text-[15px] leading-snug text-slate-900">
                          <span className="mr-2 font-black">{question.number}.</span>
                          {question.text}
                        </p>
                      </div>
                    </td>
                    {optionLabels.map((label) => {
                      const state = getChoiceVisualState(question, label)
                      const cellTone =
                        state === 'correct'
                          ? 'bg-emerald-50/80'
                          : state === 'wrong'
                            ? 'bg-red-50/85'
                            : state === 'missed'
                              ? 'bg-emerald-50/70'
                              : state === 'selected'
                                ? 'bg-red-50/45'
                                : 'bg-white'
                      const dotTone =
                        state === 'correct'
                          ? 'border-emerald-500 bg-white'
                          : state === 'wrong'
                            ? 'border-red-500 bg-white'
                            : state === 'missed'
                              ? 'border-emerald-500 bg-white'
                              : state === 'selected'
                                ? 'border-red-500 bg-white'
                                : 'border-slate-300 group-hover:border-red-300'
                      return (
                        <td
                          key={`${question.id}-${label}`}
                          className={`border-l border-slate-300 px-1 py-1 text-center ${cellTone} ${
                            isReviewMode ? '' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            if (isReviewMode) return
                            handleAnswerChange(question.id, label)
                          }}
                        >
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleAnswerChange(question.id, label)
                            }}
                            disabled={isReviewMode}
                            className="group inline-flex h-10 w-full items-center justify-center rounded-lg border border-transparent bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-not-allowed"
                            aria-label={`Question ${question.number}, choose ${label}`}
                          >
                            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border-2 transition ${dotTone}`}>
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  state === 'correct'
                                    ? 'bg-emerald-500'
                                    : state === 'wrong' || state === 'selected'
                                      ? 'bg-red-500'
                                      : state === 'missed'
                                        ? 'bg-emerald-100'
                                        : 'bg-transparent'
                                }`}
                              />
                            </span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {isReviewMode ? (
          <div className="mt-2 space-y-1">
            {questions.map((question) => (
              <div key={`matrix-hint-${question.id}`}>{reviewHint(question)}</div>
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  const renderCoralReefNotesGroup = (questions: Question[]) => {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">Questions 24-26</h4>
        <p className="mt-1 text-sm text-slate-700">
          Complete the sentences below. Choose <span className="font-black text-slate-900">ONE WORD ONLY</span> from the passage for each answer.
        </p>
        <div className="mt-2 rounded-xl border border-red-100 bg-white px-3 py-3 space-y-1.5">
          {questions.map((question) => {
            const globalIdx = getCurrentSectionGlobalIndex(question.id)
            const isFlagged = flaggedQuestions.includes(globalIdx)
            const meta = getQuestionReviewMeta(question)
            const isCorrect = meta?.status === 'correct'
            const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
            return (
              <div key={question.id} id={`question-card-${question.id}`} className="rounded-lg border border-red-100 bg-[#fffdfd] px-2.5 py-2">
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleFlagQuestion(globalIdx)}
                    className={`mt-0.5 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                  >
                    <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                  </button>
                  <span className="pt-0.5 select-none text-slate-600">•</span>
                  <p className="flex-1 text-[15px] leading-relaxed text-slate-900">
                    {question.text.split(/(______|_+)/).map((part, partIndex) =>
                      /^_+$/.test(part) || part === '______' ? (
                        <input
                          key={`${question.id}-blank-${partIndex}`}
                          type="text"
                          value={(answers[question.id] as string) || ''}
                          onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                          disabled={isReviewMode}
                          className={`mx-1 inline-flex h-9 min-w-[112px] max-w-[170px] rounded-lg border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                            isReviewMode && reviewShowCorrectAnswers
                              ? isWrong
                                ? 'border-red-300 bg-red-50/70 text-red-700'
                                : isCorrect
                                  ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                                  : 'border-red-200'
                              : 'border-red-200'
                          }`}
                          placeholder={String(question.number)}
                        />
                      ) : (
                        <span key={`${question.id}-text-${partIndex}`}>{part}</span>
                      ),
                    )}
                  </p>
                </div>
                {reviewHint(question, 'ml-8 mt-1')}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  const renderSentenceCompletionGroup = (questions: Question[], title: string, instruction: string) => {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-2.5 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">{title}</h4>
        <p className="mt-0.5 text-sm text-slate-700">{instruction}</p>
        <div className="mt-2 rounded-xl border border-red-100 bg-white px-2.5 py-2">
          {questions.map((question) => {
            const globalIdx = getCurrentSectionGlobalIndex(question.id)
            const isFlagged = flaggedQuestions.includes(globalIdx)
            const meta = getQuestionReviewMeta(question)
            const isCorrect = meta?.status === 'correct'
            const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
            return (
              <div key={question.id} id={`question-card-${question.id}`} className="py-1">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => handleFlagQuestion(globalIdx)}
                    className={`mt-0.5 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                  >
                    <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                  </button>
                  <span className="mt-[1px] text-lg font-black leading-none text-red-600">{question.number}.</span>
                  <p className="flex-1 text-[15px] leading-relaxed text-slate-900">
                    {question.text.split(/(______|_+)/).map((part, partIndex) =>
                      /^_+$/.test(part) || part === '______' ? (
                        <input
                          key={`${question.id}-sentence-${partIndex}`}
                          type="text"
                          value={(answers[question.id] as string) || ''}
                          onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                          disabled={isReviewMode}
                          className={`mx-1 inline-flex h-8 min-w-[96px] max-w-[168px] rounded-md border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                            isReviewMode && reviewShowCorrectAnswers
                              ? isWrong
                                ? 'border-red-300 bg-red-50/70 text-red-700'
                                : isCorrect
                                  ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                                  : 'border-red-200'
                              : 'border-red-200'
                          }`}
                          placeholder="..."
                        />
                      ) : (
                        <span key={`${question.id}-text-${partIndex}`}>{part}</span>
                      ),
                    )}
                  </p>
                </div>
                {reviewHint(question, 'ml-7 mt-0.5')}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  const renderShortAnswerGroup = (questions: Question[], title: string, instruction: string) => {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-2.5 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">{title}</h4>
        <p className="mt-0.5 text-sm text-slate-700">{instruction}</p>
        <div className="mt-2 space-y-2 rounded-xl border border-red-100 bg-white px-2.5 py-2">
          {questions.map((question) => {
            const globalIdx = getCurrentSectionGlobalIndex(question.id)
            const isFlagged = flaggedQuestions.includes(globalIdx)
            const meta = getQuestionReviewMeta(question)
            const isCorrect = meta?.status === 'correct'
            const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
            return (
              <div key={question.id} id={`question-card-${question.id}`} className="rounded-xl border border-red-100 bg-[#fffdfd] px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => handleFlagQuestion(globalIdx)}
                    className={`mt-0.5 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                  >
                    <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                  </button>
                  <span className="mt-[1px] text-lg font-black leading-none text-red-600">{question.number}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-relaxed text-slate-900">{question.text}</p>
                    <input
                      type="text"
                      value={(answers[question.id] as string) || ''}
                      onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                      disabled={isReviewMode}
                      placeholder="Type your answer..."
                      className={`mt-2 h-9 w-full rounded-lg border px-3 text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                        isReviewMode && reviewShowCorrectAnswers
                          ? isWrong
                            ? 'border-red-300 bg-red-50/70 text-red-700'
                            : isCorrect
                              ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                              : 'border-red-200'
                          : 'border-red-200'
                      }`}
                    />
                  </div>
                </div>
                {reviewHint(question, 'ml-8 mt-1')}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  const renderDay1CurieNotesGroup = (questions: Question[]) => {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black leading-tight text-slate-900">Questions 7-13</h4>
        <div className="mt-1 space-y-0.5 text-sm text-slate-700">
          <p>Complete the notes below.</p>
          <p>
            Choose <span className="font-black text-slate-900">ONE WORD</span> from the passage for each answer.
          </p>
          <p>Write your answers in boxes 7-13 on your answer sheet.</p>
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-[#fefefe] px-3 py-2.5">
          <p className="text-lg leading-tight font-black text-slate-900 sm:text-xl">
            Marie Curie&apos;s research on radioactivity
          </p>

          <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-slate-900">
            {questions.map((question) => {
              const globalIdx = getCurrentSectionGlobalIndex(question.id)
              const isFlagged = flaggedQuestions.includes(globalIdx)
              const meta = getQuestionReviewMeta(question)
              const isCorrect = meta?.status === 'correct'
              const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
              return (
                <li key={question.id} id={`question-card-${question.id}`} className="rounded-lg border border-transparent px-1 py-1">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleFlagQuestion(globalIdx)}
                      className={`mt-1 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                      title={`Flag question ${question.number}`}
                    >
                      <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                    </button>
                    <span className="pt-0.5 select-none text-slate-600">•</span>
                    <span className="flex-1">
                      {question.text.split(/(______|_+)/).map((part, partIndex) =>
                        /^_+$/.test(part) || part === '______' ? (
                          <input
                            key={`${question.id}-blank-${partIndex}`}
                            type="text"
                            value={(answers[question.id] as string) || ''}
                            onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                            disabled={isReviewMode}
                            className={`mx-1 inline-flex h-8 min-w-[88px] max-w-[140px] rounded-md border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                              isReviewMode && reviewShowCorrectAnswers
                                ? isWrong
                                  ? 'border-red-300 bg-red-50/70 text-red-700'
                                  : isCorrect
                                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                                    : 'border-slate-300'
                                : 'border-slate-400'
                            }`}
                            placeholder={String(question.number)}
                          />
                        ) : (
                          <span key={`${question.id}-text-${partIndex}`}>{part}</span>
                        ),
                      )}
                    </span>
                  </div>
                  {reviewHint(question, 'ml-8 mt-1')}
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    )
  }

  const renderMargaretPrestonNotesGroup = (questions: Question[]) => {
    const byNumber = new Map(questions.map((question) => [question.number, question]))
    const firstNumber = questions[0]?.number ?? 8
    const questionForSlot = (slotOffset: number) => byNumber.get(firstNumber + slotOffset)
    const renderNoteLine = (question: Question | undefined, prefix = '• ') => {
      if (!question) return null
      const meta = getQuestionReviewMeta(question)
      const isCorrect = meta?.status === 'correct'
      const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
      return (
        <div key={question.id} id={`question-card-${question.id}`} className="text-[15px] leading-relaxed text-slate-900">
          <span>{prefix}</span>
          {question.text.split(/(______|_+)/).map((part, partIndex) =>
            /^_+$/.test(part) || part === '______' ? (
              <input
                key={`${question.id}-note-${partIndex}`}
                type="text"
                value={(answers[question.id] as string) || ''}
                onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                disabled={isReviewMode}
                placeholder={String(question.number)}
                className={`mx-1 inline-flex h-8 min-w-[92px] max-w-[150px] rounded-md border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                  isReviewMode && reviewShowCorrectAnswers
                    ? isWrong
                      ? 'border-red-300 bg-red-50/70 text-red-700'
                      : isCorrect
                        ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                        : 'border-slate-300'
                    : 'border-slate-400'
                }`}
              />
            ) : (
              <span key={`${question.id}-note-text-${partIndex}`}>{part}</span>
            ),
          )}
          {reviewHint(question, 'mt-1')}
        </div>
      )
    }

    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">{questions[0]?.groupTitle ?? 'Questions 8-13'}</h4>
        <p className="mt-1 text-sm text-slate-700">{questions[0]?.instruction}</p>
        <div className="mt-2.5 rounded-xl border border-slate-200 bg-[#fefefe] px-3 py-3">
          <p className="text-center text-lg font-black leading-tight text-slate-900 sm:text-xl">Margaret Preston&apos;s later life</p>

          <div className="mt-3 space-y-3">
            <div>
              <p className="font-black text-slate-900">Aboriginal influence</p>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-900">• interest in Aboriginal art was inspired by seeing rock engravings close to her Berowra home</p>
              {renderNoteLine(questionForSlot(0))}
              {renderNoteLine(questionForSlot(1))}
            </div>
            <div>
              <p className="font-black text-slate-900">1953 exhibition</p>
              {renderNoteLine(questionForSlot(2))}
              {renderNoteLine(questionForSlot(3))}
              <p className="text-[15px] leading-relaxed text-slate-900">• combination of Chinese and Aboriginal elements</p>
            </div>
            <div>
              <p className="font-black text-slate-900">Old age</p>
              {renderNoteLine(questionForSlot(4))}
              {renderNoteLine(questionForSlot(5))}
              <p className="text-[15px] leading-relaxed text-slate-900">• dedicated to Australian art; the originality of her work is evident throughout her long career</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderMatchingSelectGroup = (
    questions: Question[],
    title: string,
    instruction: string,
    listTitle: string,
  ) => {
    const options = questions[0]?.options ?? []
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">{title}</h4>
        <p className="mt-1 text-sm text-slate-700">{instruction}</p>
        <div className="mt-2 rounded-xl border border-red-100 bg-red-50/40 p-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-red-700">{listTitle}</p>
          <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-700">
            {options.map((option) => (
              <li key={`list-${title}-${option}`}>{option}</li>
            ))}
          </ul>
        </div>
        <div className="mt-2 space-y-2.5">
          {questions.map((question) => {
            const globalIdx = getCurrentSectionGlobalIndex(question.id)
            const isFlagged = flaggedQuestions.includes(globalIdx)
            return (
              <div
                key={question.id}
                id={`question-card-${question.id}`}
                className="rounded-2xl border border-red-100 bg-white px-3 py-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-lg font-black text-slate-900">
                    {question.number}
                  </span>
                  <p className="flex-1 text-[15px] font-bold leading-relaxed text-slate-950">
                    {question.text}
                  </p>
                  <CompactSelect
                    options={options}
                    value={answers[question.id] as string}
                    onChange={(val) => handleAnswerChange(question.id, val)}
                    disabled={isReviewMode}
                  />
                  <button
                    type="button"
                    onClick={() => handleFlagQuestion(globalIdx)}
                    className={`rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                  >
                    <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                  </button>
                </div>
                {reviewHint(question, 'mt-2')}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  const renderDragDropSummaryGroup = (question: Question) => {
    const slotCount = Array.isArray(question.correctAnswer) ? Math.max(1, question.correctAnswer.length) : 1
    const blankPattern = /_{3,}/
    const allLines = question.text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    // Optional leading heading line (e.g. a summary title) that is not an answer slot.
    const hasTitleLine = allLines.length === slotCount + 1 && !blankPattern.test(allLines[0])
    const summaryTitle = hasTitleLine ? allLines[0] : null
    const lines = hasTitleLine ? allLines.slice(1) : allLines
    const answerSlots = readAnswerArray(answers[question.id] as unknown)
    const slots = Array.from({ length: slotCount }, (_, slotIndex) =>
      String(answerSlots[slotIndex] ?? '').trim(),
    )
    const queuedOption = activeDragOption[question.id]?.trim() ?? ''

    const renderInlineDropSlot = (slotIndex: number) => {
      const slotValue = slots[slotIndex] || ''
      const slotNumber = question.number + slotIndex
      const isFilled = slotValue.length > 0
      const isActiveSlot = activeDragSlots[question.id] === slotIndex

      return (
        <span
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={(event) => {
            event.preventDefault()
            if (isReviewMode) return
            setActiveDragSlots((current) => ({ ...current, [question.id]: slotIndex }))
          }}
          onDrop={(event) => {
            event.preventDefault()
            if (isReviewMode) return
            const dragged = event.dataTransfer.getData('text/plain')
            assignDragDropAnswer(question.id, slotIndex, dragged, slotCount)
          }}
          onClick={() => {
            if (isReviewMode) return
            if (isFilled) {
              clearDragDropSlot(question.id, slotIndex, slotCount)
              return
            }
            if (queuedOption) {
              assignDragDropAnswer(question.id, slotIndex, queuedOption, slotCount)
              return
            }
            setActiveDragSlots((current) => ({ ...current, [question.id]: slotIndex }))
          }}
          onDoubleClick={() => {
            if (isReviewMode) return
            if (isFilled) clearDragDropSlot(question.id, slotIndex, slotCount)
          }}
          className={`inline-flex h-8 min-w-[96px] max-w-full items-center justify-center rounded-lg border border-dashed px-2.5 py-1 text-xs font-semibold align-middle transition ${
            isFilled
              ? 'cursor-pointer border-red-300 bg-red-50 text-red-700 shadow-[0_8px_16px_rgba(220,38,38,0.12)]'
              : isActiveSlot
                ? 'cursor-pointer border-red-400 bg-red-50/70 text-red-700'
                : 'cursor-pointer border-red-200 bg-white text-slate-500 hover:border-red-300'
          }`}
        >
          <span className="text-center leading-tight">{isFilled ? slotValue : `Drop ${slotNumber}`}</span>
        </span>
      )
    }

    const renderLineWithInlineDrop = (line: string, lineIndex: number) => {
      const hasBlank = blankPattern.test(line)
      if (!hasBlank) {
        return (
          <span className="inline-flex flex-wrap items-center gap-1.5 text-[15px] leading-relaxed text-slate-900">
            <span>{line}</span>
            {renderInlineDropSlot(lineIndex)}
          </span>
        )
      }

      const parts = line.split(/(_{3,})/)
      let inserted = false

      return (
        <span className="inline-flex flex-wrap items-center gap-1.5 text-[15px] leading-relaxed text-slate-900">
          {parts.map((part, partIndex) => {
            if (!part) return null
            if (/^_{3,}$/.test(part)) {
              if (inserted) return null
              inserted = true
              return <span key={`${question.id}-slot-${lineIndex}-${partIndex}`}>{renderInlineDropSlot(lineIndex)}</span>
            }
            return <span key={`${question.id}-text-${lineIndex}-${partIndex}`}>{part}</span>
          })}
        </span>
      )
    }

    return (
      <section id={`question-card-${question.id}`} className="rounded-2xl border border-red-100 bg-white p-2.5 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">{question.groupTitle || 'Questions 23-26'}</h4>
        <p className="mt-0.5 text-sm text-slate-700">{question.instruction || 'Complete the summary by dragging the correct words into the gaps.'}</p>

        <div className="mt-2 rounded-xl border border-red-100 bg-[#fffdfd] p-2">
          {summaryTitle && (
            <p className="mb-1.5 text-center text-lg font-black leading-tight text-slate-900">{summaryTitle}</p>
          )}
          <div className="space-y-1.5">
            {lines.map((line, lineIndex) => {
              const slotNumber = question.number + lineIndex
              return (
                <div key={`${question.id}-line-${lineIndex}`} className="rounded-lg bg-white p-1.5">
                  <p className="flex flex-wrap items-center gap-1.5 text-[15px] leading-relaxed text-slate-900">
                    <span className="font-black text-red-600">{slotNumber}.</span>
                    {renderLineWithInlineDrop(line, lineIndex)}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-2 rounded-lg border border-red-100 bg-red-50/40 p-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-700">Drag these options</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(question.options || []).map((option) => {
                const isAssigned = slots.some((entry) => entry.toLowerCase() === option.toLowerCase())
                const isQueued = queuedOption.toLowerCase() === option.toLowerCase()
                return (
                  <button
                    key={`${question.id}-option-${option}`}
                    type="button"
                    draggable={!isReviewMode}
                    onMouseDown={() => queueDragDropOption(question.id, option)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', option)
                      queueDragDropOption(question.id, option)
                    }}
                    onClick={() => {
                      if (isReviewMode) return
                      queueDragDropOption(question.id, option)
                      const preferredSlot = activeDragSlots[question.id]
                      if (typeof preferredSlot === 'number' && preferredSlot >= 0 && preferredSlot < slotCount) {
                        assignDragDropAnswer(question.id, preferredSlot, option, slotCount)
                        return
                      }
                      const firstEmpty = slots.findIndex((entry) => !entry)
                      if (firstEmpty >= 0) {
                        assignDragDropAnswer(question.id, firstEmpty, option, slotCount)
                        setActiveDragSlots((current) => ({ ...current, [question.id]: firstEmpty }))
                        return
                      }
                      assignDragDropAnswer(question.id, 0, option, slotCount)
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      isAssigned
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                        : isQueued
                          ? 'border-red-400 bg-red-100 text-red-800 shadow-[0_8px_16px_rgba(220,38,38,0.16)]'
                          : 'border-red-200 bg-white text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {queuedOption ? `Selected option: ${queuedOption}` : 'Tip: press and drag an option to a blank, or click to auto-place.'}
            </p>
          </div>
        </div>
        {reviewHint(question)}
      </section>
    )
  }

  const renderStatementChoiceGroup = (
    questions: Question[],
    title: string,
    instruction: string,
    options: string[],
  ) => {
    const isDayOneLayout = isDayOneCurieSection
    return (
      <section className={`rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)] ${isDayOneLayout ? 'day1-question-group' : ''}`}>
        <h4 className={isDayOneLayout ? 'text-[1rem] font-black tracking-tight text-slate-950' : 'text-xl font-black text-slate-900'}>{title}</h4>
        <p className={isDayOneLayout ? 'mt-1 max-w-[58rem] text-[12.5px] font-medium leading-5 text-slate-600' : 'mt-1 text-sm text-slate-700'}>{instruction}</p>
        <div className="mt-2 space-y-2">
          {questions.map((question) => {
            const globalIdx = getCurrentSectionGlobalIndex(question.id)
            const isFlagged = flaggedQuestions.includes(globalIdx)
            const selectedValue = String(answers[question.id] ?? '')
            return (
              <article key={question.id} id={`question-card-${question.id}`} className={`rounded-xl border border-red-100 bg-white px-3 py-2.5 ${isDayOneLayout ? 'day1-question-card' : ''}`}>
                <div className="mb-1.5 flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => handleFlagQuestion(globalIdx)}
                    className={`rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                  >
                    <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                  </button>
                  <p className={isDayOneLayout ? 'text-[13.5px] font-medium leading-[1.55] text-slate-900' : 'text-[15px] font-bold leading-relaxed text-slate-950'}>
                    <span className="mr-2 font-black text-red-600">{question.number}</span>
                    {question.text}
                  </p>
                </div>

                <div className={`${isDayOneLayout ? 'space-y-1 pl-7' : 'space-y-1.5 pl-7'}`}>
                  {options.map((option) => {
                    const state = getChoiceVisualState(question, option)
                    const checked = selectedValue.toUpperCase() === option
                    const tone =
                      state === 'correct'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : state === 'wrong'
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : state === 'missed'
                            ? 'border-emerald-300 bg-emerald-50/70 text-emerald-700'
                            : checked
                              ? 'border-red-300 bg-red-50 text-red-700 shadow-[0_10px_18px_rgba(220,38,38,0.12)]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/40'
                    return (
                      <button
                        type="button"
                        key={`${question.id}-${option}`}
                        onClick={() => {
                          if (isReviewMode) return
                          handleAnswerChange(question.id, option)
                        }}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 ${isDayOneLayout ? 'py-1.5 text-[12.5px]' : 'py-2.5 text-sm'} text-left font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 ${tone} ${
                          isReviewMode ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            checked
                              ? 'border-red-500 bg-red-500/10'
                              : state === 'correct' || state === 'missed'
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : state === 'wrong'
                                  ? 'border-red-500 bg-red-500/10'
                                  : 'border-slate-300 bg-white'
                          }`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              state === 'correct' || state === 'missed'
                                ? 'bg-emerald-500'
                                : state === 'wrong' || checked
                                  ? 'bg-red-500'
                                  : 'bg-transparent'
                            }`}
                          />
                        </span>
                        <span className="tracking-[0.02em]">{option}</span>
                      </button>
                    )
                  })}
                </div>
                {reviewHint(question)}
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  const renderPassageThreeSummaryGroup = (questions: Question[]) => {
    const instruction = questions[0]?.instruction ?? 'Complete the summary.'
    const firstNumber = questions[0]?.number ?? 1
    const lastNumber = questions[questions.length - 1]?.number ?? firstNumber
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">{questions[0]?.groupTitle ?? `Questions ${firstNumber}-${lastNumber}`}</h4>
        <p className="mt-1 text-sm text-slate-700">{instruction}</p>
        <div className="mt-2 rounded-xl border border-slate-200 bg-[#fffdfd] px-3 py-2.5 text-[15px] leading-relaxed text-slate-900">
          {questions.map((question, index) => {
            const meta = getQuestionReviewMeta(question)
            const isCorrect = meta?.status === 'correct'
            const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
            return (
              <span key={question.id} id={`question-card-${question.id}`}>
                {question.text.split(/(______|_+)/).map((part, partIndex) =>
                  /^_+$/.test(part) || part === '______' ? (
                    <input
                      key={`${question.id}-compact-${partIndex}`}
                      type="text"
                      value={(answers[question.id] as string) || ''}
                      onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                      disabled={isReviewMode}
                      className={`mx-1 inline-flex h-8 min-w-[88px] max-w-[140px] rounded-md border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                        isReviewMode && reviewShowCorrectAnswers
                          ? isWrong
                            ? 'border-red-300 bg-red-50/70 text-red-700'
                            : isCorrect
                              ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                              : 'border-red-200'
                          : 'border-red-200'
                      }`}
                      placeholder={String(question.number)}
                    />
                  ) : (
                    <span key={`${question.id}-sentence-${partIndex}`}>{part}</span>
                  ),
                )}{' '}
                {index < questions.length - 1 ? ' ' : null}
              </span>
            )
          })}
        </div>
        {isReviewMode ? (
          <div className="mt-2 space-y-1">
            {questions.map((question) => (
              <div key={`summary-hint-${question.id}`}>{reviewHint(question)}</div>
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  // Reusable themed summary/notes box with a passage-style title heading and inline blanks.
  // The optional `title` is stripped from sentence text if it appears embedded in the first line.
  const renderTitledSummaryGroup = (
    questions: Question[],
    groupTitle: string,
    instruction: string,
    title: string,
  ) => {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">{groupTitle}</h4>
        <p className="mt-1 text-sm text-slate-700">{instruction}</p>
        <div className="mt-2.5 rounded-xl border border-slate-200 bg-[#fefefe] px-3 py-3">
          <p className="text-center text-lg font-black leading-tight text-slate-900 sm:text-xl">{title}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-900">
            {questions.map((question, index) => {
              const meta = getQuestionReviewMeta(question)
              const isCorrect = meta?.status === 'correct'
              const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
              const cleanedText = question.text
                .split('\n')
                .map((segment) => segment.trim())
                .filter((segment) => segment && segment !== title)
                .join(' ')
              return (
                <span key={question.id} id={`question-card-${question.id}`}>
                  {index > 0 ? ' ' : null}
                  {cleanedText.split(/(______|_+)/).map((part, partIndex) =>
                    /^_+$/.test(part) || part === '______' ? (
                      <input
                        key={`${question.id}-blank-${partIndex}`}
                        type="text"
                        value={(answers[question.id] as string) || ''}
                        onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                        disabled={isReviewMode}
                        className={`mx-1 inline-flex h-8 min-w-[96px] max-w-[150px] rounded-md border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                          isReviewMode && reviewShowCorrectAnswers
                            ? isWrong
                              ? 'border-red-300 bg-red-50/70 text-red-700'
                              : isCorrect
                                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                                : 'border-red-200'
                            : 'border-red-200'
                        }`}
                        placeholder={String(question.number)}
                      />
                    ) : (
                      <span key={`${question.id}-text-${partIndex}`}>{part}</span>
                    ),
                  )}
                </span>
              )
            })}
          </p>
          {isReviewMode ? (
            <div className="mt-2 space-y-1">
              {questions.map((question) => (
                <div key={`titled-summary-hint-${question.id}`}>{reviewHint(question)}</div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    )
  }

  const renderStartScreen = () => (
    <div className="min-h-screen bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)] flex items-center justify-center p-6 relative overflow-hidden w-full">
      <AnimatedBackground />
      <div className="max-w-5xl w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl lg:text-6xl font-black mb-6 tracking-tight bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 bg-clip-text text-transparent">
            {isListening ? 'Academic Listening Test' : 'Academic Reading Test'}
          </h1>
          <p className="text-slate-600 text-lg font-light max-w-2xl mx-auto italic">
            Experience the authentic IELTS Computer-Delivered environment with ProfAI precision.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PremiumCard onClick={() => { setTestMode('practice'); setShowModeModal(true); }} gradient="from-red-600 to-rose-600" className="p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                <LightBulbIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Practice Mode</h3>
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Casual Learning</span>
              </div>
            </div>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-8 flex-1 italic group-hover:text-slate-700 transition-colors">
              Focus on accuracy and comprehension at your own pace. Perfect for initial preparation and understanding complex question types.
            </p>
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Customizable session time
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Select specific parts to practice
              </div>
            </div>
            <div className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 border border-red-500 rounded-2xl text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:from-red-500 group-hover:to-rose-500 transition-all">
              Enter Practice Library
            </div>
          </PremiumCard>

          <PremiumCard onClick={() => { setTestMode('simulation'); handleStartTest(); }} gradient="from-red-700 to-rose-600" className="p-10 border-red-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                <ComputerDesktopIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Simulation Mode</h3>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Exam Simulation</span>
              </div>
            </div>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-8 flex-1 italic group-hover:text-slate-700 transition-colors">
              Authentic IELTS CD environment. Replicates the high-pressure conditions of the real exam with strict timing and official layout standards.
            </p>
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3 text-xs font-bold text-rose-400">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Strict {test.duration}-minute limit
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Official scoring algorithms
              </div>
            </div>
            <div className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-red-500/20 transform group-hover:scale-[1.02] transition-all">
              Launch Final Simulation
            </div>
          </PremiumCard>
        </div>

        <motion.div className="mt-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button type="button" onClick={onExit} className="text-sm text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2 mx-auto px-6 py-2 rounded-full border border-white/5 hover:bg-white/5">
            <ArrowLeftIcon className="w-4 h-4" /> Return to ProfAI Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  )

  const renderMarkTools = () => (
    <>
      <AnimatePresence>
        {selectionRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-[100] flex items-center gap-2 rounded-2xl border border-red-100 bg-white/95 p-2 shadow-[0_20px_40px_rgba(220,38,38,0.2)] backdrop-blur-md"
            style={{
              top: selectionRect.top - 55,
              left: Math.max(10, Math.min(window.innerWidth - 250, selectionRect.left + (selectionRect.width / 2) - 120))
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyHighlight('highlight'); }}
              className="group flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50/60"
              title="Highlight"
            >
              <div className="h-4 w-4 rounded bg-[#f3c85b] shadow-[0_4px_10px_rgba(243,200,91,0.4)]" />
              Highlight
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applyHighlight('note'); }}
              className="flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50/60"
            >
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-red-500" />
              Note
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                const sel = window.getSelection()
                const word = (selectedText || sel?.toString() || '').trim()
                if (!word) return
                const anchor = sel?.anchorNode instanceof Element ? sel.anchorNode : sel?.anchorNode?.parentElement
                const sentence = (anchor?.closest('p, div, li')?.textContent ?? word).replace(/\s+/g, ' ').trim()
                setAiLookup({ word, sentence })
                setSelectionRect(null)
              }}
              className="flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3 text-xs font-bold text-white transition hover:brightness-110"
              title="Ask AI to explain this word"
            >
              <SparklesIcon className="w-4 h-4" />
              Ask AI
            </button>
            <div className="absolute -bottom-1.5 left-1/2 -ml-1.5 h-3 w-3 rotate-45 border-b border-r border-red-200 bg-white" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {highlightPopover && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{ top: highlightPopover.top, left: highlightPopover.left, transform: 'translateX(-50%)' }}
            className="fixed z-[105] rounded-2xl border border-red-200 bg-white p-1.5 shadow-[0_20px_40px_rgba(220,38,38,0.2)]"
          >
            {highlightPopover.markType === 'note' && highlightPopover.noteText ? (
              <div className="max-w-[260px] rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-medium text-amber-900">
                {highlightPopover.noteText}
              </div>
            ) : null}
            {highlightPopover.markType === 'note' ? (
              <button
                type="button"
                onClick={editActiveNote}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"
              >
                <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                Edit note
              </button>
            ) : null}
            <button
              type="button"
              onClick={removeActiveHighlight}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-gradient-to-r from-white via-red-50/65 to-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <XMarkIcon className="h-4 w-4" />
              {highlightPopover.markType === 'note' ? 'Delete note' : 'Delete highlight'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  const renderLeftPanel = () => (
    <div className="relative h-full">
      {renderMarkTools()}
      <div
        id="reading-passage-pane"
        data-reading-markable="1"
        onClick={handleMarkPaneClick}
        className={`reading-pane reading-content h-full overflow-y-auto border-r border-red-100 bg-gradient-to-b from-white via-red-50/30 to-white p-4 sm:p-5 lg:p-6 font-sans leading-relaxed text-slate-800 transition-colors duration-300 scrollbar-thin scrollbar-thumb-red-200 ${isDayOneCurieSection ? 'day1-reading-pane' : ''}`}
      >
        <div className="mb-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-red-600 sm:text-sm">PART {currentPassageNumber}</p>
          <h2 className="mb-1.5 text-lg font-bold font-sans text-slate-900 sm:text-xl">READING PASSAGE {currentPassageNumber}</h2>
          <p className="text-xs italic text-slate-600 sm:text-sm">
            You should spend about 20 minutes on <strong>Questions {sectionMeta[currentSectionIndex]?.questionNumbers[0]}-{sectionMeta[currentSectionIndex]?.questionNumbers[sectionMeta[currentSectionIndex]?.questionNumbers.length - 1]}</strong>, which are based on Reading Passage {currentPassageNumber} below.
          </p>
        </div>
        <div className={`mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-4 py-2.5 text-white shadow-[0_14px_30px_rgba(220,38,38,0.24)] ${isDayOneCurieSection ? 'day1-reading-title-card' : ''}`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-90">Reading Passage {currentPassageNumber}</p>
          <p className="text-base font-bold sm:text-lg">{passageDisplayTitle(currentSection) || currentSection?.title}</p>
        </div>
        {currentSection?.paragraphs ? (
          (() => {
            const showLabels = sectionHasLabeledParagraphs(currentSection)
            return (
              <div className={`${showLabels ? 'space-y-5' : 'space-y-3'} ielts-reading-prose ${isDayOneCurieSection ? 'day1-reading-prose' : ''}`}>
                {currentSection.paragraphs.map((para, paraIndex) => (
                  <div key={`${currentSection.id}-${para.label || paraIndex}`} className="relative">
                    <p className="text-justify leading-relaxed text-slate-800">
                      {para.label && /^[A-Z]$/.test(para.label) && showLabels && (
                        <span className="mr-2 inline-block font-black text-slate-900">{para.label}</span>
                      )}
                      {para.content}
                    </p>
                  </div>
                ))}
              </div>
            )
          })()
        ) : currentSection?.content ? (
          <div className="ielts-reading-prose whitespace-pre-wrap text-justify text-slate-800 leading-relaxed">{currentSection.content}</div>
        ) : null}
      </div>
    </div>
  )

  // ============================ LISTENING RENDERING ============================
  // Renders the listening rich-layout blocks (notes / flow / grid / mcq / table)
  // using the exact same visual language as the Reading question panel.
  const renderListeningGroup = (group: ListeningGroup, groupKey: number) => {
    const blankInput = (number: number, width: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
      const question = listeningQuestionByNumber.get(number)
      if (!question) return null
      const meta = getQuestionReviewMeta(question)
      const isCorrect = meta?.status === 'correct'
      const isWrong = meta?.status === 'incorrect' || meta?.status === 'skipped'
      const widthCls =
        width === 'sm'
          ? 'min-w-[60px] max-w-[88px]'
          : width === 'lg'
            ? 'min-w-[140px] max-w-[200px]'
            : width === 'xl'
              ? 'min-w-[180px] max-w-[240px]'
              : 'min-w-[100px] max-w-[168px]'
      return (
        <span id={`question-card-${question.id}`} className="inline-flex align-middle">
          <input
            type="text"
            value={(answers[question.id] as string) || ''}
            onChange={(event) => handleAnswerChange(question.id, event.target.value)}
            onFocus={() => setLastActiveQuestionIndex(getCurrentSectionGlobalIndex(question.id))}
            disabled={isReviewMode}
            placeholder={String(number)}
            className={`mx-1 inline-flex h-9 ${widthCls} rounded-lg border px-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
              isReviewMode && reviewShowCorrectAnswers
                ? isWrong
                  ? 'border-red-300 bg-red-50/70 text-red-700'
                  : isCorrect
                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                    : 'border-red-200'
                : 'border-red-200'
            }`}
          />
        </span>
      )
    }

    const segs = (segments: ListeningSegment[]) =>
      segments.map((segment, index) => {
        if (typeof segment === 'string') return <span key={index}>{segment}</span>
        return (
          <span key={index}>
            {segment.before ?? ''}
            {blankInput(segment.blank, segment.width ?? 'md')}
            {segment.after ?? ''}
          </span>
        )
      })

    const renderGrid = (block: Extract<ListeningBlock, { kind: 'grid' }>) => (
      <div className="my-2">
        <div className="overflow-x-auto rounded-xl border border-slate-300">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50">
                <th className="px-2 py-2 text-base font-black text-slate-900">Item</th>
                {block.columns.map((col) => (
                  <th key={col} className="border-l border-slate-300 px-2 py-2 text-center text-base font-black text-slate-900">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => {
                const question = listeningQuestionByNumber.get(row.blank)
                if (!question) return null
                const globalIdx = getCurrentSectionGlobalIndex(question.id)
                const isFlagged = flaggedQuestions.includes(globalIdx)
                return (
                  <tr key={row.blank} id={`question-card-${question.id}`} className="border-b border-slate-300 last:border-b-0">
                    <td className="px-2 py-2 align-top">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleFlagQuestion(globalIdx)}
                          className={`mt-0.5 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                        >
                          <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
                        </button>
                        <p className="text-[15px] leading-snug text-slate-900">
                          <span className="mr-2 font-black">{row.blank}</span>
                          {row.label}
                        </p>
                      </div>
                    </td>
                    {block.columns.map((letter) => {
                      const state = getChoiceVisualState(question, letter)
                      const cellTone =
                        state === 'correct'
                          ? 'bg-emerald-50/80'
                          : state === 'wrong'
                            ? 'bg-red-50/85'
                            : state === 'missed'
                              ? 'bg-emerald-50/70'
                              : state === 'selected'
                                ? 'bg-red-50/45'
                                : 'bg-white'
                      const dotTone =
                        state === 'correct'
                          ? 'border-emerald-500'
                          : state === 'wrong'
                            ? 'border-red-500'
                            : state === 'missed'
                              ? 'border-emerald-500'
                              : state === 'selected'
                                ? 'border-red-500'
                                : 'border-slate-300'
                      return (
                        <td
                          key={letter}
                          className={`border-l border-slate-300 px-1 py-1 text-center ${cellTone} ${isReviewMode ? '' : 'cursor-pointer'}`}
                          onClick={() => { if (!isReviewMode) handleAnswerChange(question.id, letter) }}
                        >
                          <button
                            type="button"
                            disabled={isReviewMode}
                            onClick={(event) => { event.stopPropagation(); handleAnswerChange(question.id, letter) }}
                            className="inline-flex h-10 w-full items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-not-allowed"
                            aria-label={`Question ${row.blank}, choose ${letter}`}
                          >
                            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border-2 transition ${dotTone}`}>
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  state === 'correct' || state === 'missed'
                                    ? 'bg-emerald-500'
                                    : state === 'wrong' || state === 'selected'
                                      ? 'bg-red-500'
                                      : 'bg-transparent'
                                }`}
                              />
                            </span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {block.options && block.options.length > 0 ? (
          <div className="mt-3 inline-block rounded-xl border border-red-100 bg-red-50/40 p-3">
            <ul className="space-y-1 text-sm font-semibold text-slate-700">
              {block.options.map((option) => (
                <li key={option.letter}>
                  <span className="mr-2 font-black text-slate-900">{option.letter}</span>
                  {option.text}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )

    const renderMcq = (block: Extract<ListeningBlock, { kind: 'mcq' }>) => {
      const question = listeningQuestionByNumber.get(block.blank)
      if (!question) return null
      const globalIdx = getCurrentSectionGlobalIndex(question.id)
      const isFlagged = flaggedQuestions.includes(globalIdx)
      return (
        <div id={`question-card-${question.id}`} className="mt-3 rounded-2xl border border-red-100 bg-white p-3">
          <div className="mb-2 flex items-start gap-2.5">
            <button
              type="button"
              onClick={() => handleFlagQuestion(globalIdx)}
              className={`mt-0.5 rounded-md p-1 transition ${isFlagged ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
            >
              <BookmarkIcon className={`h-4 w-4 ${isFlagged ? 'fill-current' : ''}`} />
            </button>
            <p className="text-[15px] font-bold leading-relaxed text-slate-950">
              <span className="mr-2 font-black">{block.blank}</span>
              {block.prompt}
            </p>
          </div>
          <div className="space-y-2 pl-8">
            {block.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i)
              const isSelected = answers[question.id] === letter
              const state = getChoiceVisualState(question, letter)
              const tone =
                state === 'correct'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : state === 'wrong'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : state === 'missed'
                      ? 'border-emerald-300 bg-emerald-50/70 text-emerald-700'
                      : isSelected
                        ? 'border-red-300 bg-red-50 shadow-[0_10px_18px_rgba(220,38,38,0.14)]'
                        : 'border-red-100 bg-white hover:border-red-300'
              return (
                <button
                  type="button"
                  key={letter}
                  disabled={isReviewMode}
                  onClick={() => { if (!isReviewMode) handleAnswerChange(question.id, letter) }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 ${tone}`}
                >
                  <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black ${isSelected || state === 'correct' || state === 'wrong' ? 'border-current' : 'border-slate-300 text-slate-500'}`}>
                    {letter}
                  </span>
                  <span className="text-[15px] text-slate-900">{opt}</span>
                </button>
              )
            })}
          </div>
          {reviewHint(question, 'mt-2 ml-8')}
        </div>
      )
    }

    const renderTable = (block: Extract<ListeningBlock, { kind: 'table' }>) => (
      <div className="my-2 rounded-xl border border-slate-300">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-50">
              {block.columns.map((col) => (
                <th key={col} className="border-l border-slate-300 px-2 py-2 text-base font-black text-slate-900 first:border-l-0">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-300 last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border-l border-slate-300 px-2 py-2 align-top text-slate-900 first:border-l-0">
                    <span className="inline-flex flex-wrap items-center leading-loose">{segs(cell.segments)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )

    const renderBlock = (block: ListeningBlock, key: number) => {
      switch (block.kind) {
        case 'title':
          return <p key={key} className="mt-1 mb-2 text-center text-2xl font-black tracking-tight text-slate-900">{block.text}</p>
        case 'subhead':
          return <p key={key} className="mt-3 text-lg font-black text-slate-900">{block.text}</p>
        case 'text':
          return <p key={key} className="mt-2 text-[15px] text-slate-900">{block.text}</p>
        case 'example':
          return (
            <p key={key} className="mt-1 text-[15px] italic text-slate-600">
              <span className="mr-1 font-bold not-italic text-slate-500">Example:</span>
              {block.segments.map((segment, index) =>
                typeof segment === 'string' ? (
                  <span key={index} className={index === block.segments.length - 1 ? 'font-bold underline underline-offset-2' : ''}>
                    {segment}
                  </span>
                ) : null,
              )}
            </p>
          )
        case 'note':
          return (
            <p key={key} className={`text-[15px] leading-loose text-slate-900 ${block.bullet ? 'pl-6' : ''}`}>
              {block.bullet ? '• ' : ''}
              {segs(block.segments)}
            </p>
          )
        case 'flow':
          return (
            <div key={key} className="my-2 flex flex-col items-center">
              {block.boxes.map((box, boxIndex) => (
                <Fragment key={boxIndex}>
                  <div className="w-full rounded-xl border border-red-200 bg-red-50/30 px-4 py-3 text-center text-[15px] leading-relaxed text-slate-900">
                    {segs(box.segments)}
                  </div>
                  {boxIndex < block.boxes.length - 1 ? <span className="my-1 text-2xl leading-none text-red-400">↓</span> : null}
                </Fragment>
              ))}
            </div>
          )
        case 'grid':
          return <div key={key}>{renderGrid(block)}</div>
        case 'mcq':
          return <div key={key}>{renderMcq(block)}</div>
        case 'table':
          return <div key={key}>{renderTable(block)}</div>
        case 'image':
          return (
            <figure key={key} className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
              <img src={block.src} alt={block.alt} className="mx-auto h-auto w-full max-w-3xl rounded-lg bg-white" />
              {block.caption ? <figcaption className="px-1 pt-2 text-center text-xs font-medium text-slate-600">{block.caption}</figcaption> : null}
            </figure>
          )
        case 'space':
          return <div key={key} className="h-2" />
        default:
          return null
      }
    }

    return (
      <section key={groupKey} className="rounded-2xl border border-red-100 bg-white p-3 shadow-[0_8px_20px_rgba(220,38,38,0.08)]">
        <h4 className="text-xl font-black text-slate-900">{group.range}</h4>
        <p className="mt-1 text-sm text-slate-700">{group.instruction}</p>
        <div className="mt-2 rounded-xl border border-red-100 bg-white px-3 py-3">
          {group.blocks.map((block, index) => renderBlock(block, index))}
        </div>
      </section>
    )
  }

  const renderListeningRightPanel = () => {
    const sectionNumbers = sectionMeta[currentSectionIndex]?.questionNumbers ?? []
    const firstNum = sectionNumbers[0]
    const lastNum = sectionNumbers[sectionNumbers.length - 1]
    const totalNum = sectionMeta.reduce((acc, s) => acc + s.questionCount, 0)
    return (
      <div
        className="reading-pane reading-content reading-question-typography h-full overflow-y-auto bg-gradient-to-b from-white via-red-50/20 to-white font-sans scrollbar-thin scrollbar-thumb-red-200"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-10">
          {/* Compact part header bar */}
          <div className="mb-5 overflow-hidden rounded-2xl border border-red-100 shadow-[0_10px_26px_rgba(220,38,38,0.10)]">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-5 py-3 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-black uppercase tracking-[0.14em]">
                  {currentSection?.partLabel ?? `Part ${currentSectionIndex + 1}`}
                </span>
                <p className="text-sm font-semibold text-white/95">
                  {currentSection?.partInstruction ?? `Listen and answer the questions for ${currentSection?.title}.`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAudioPlaying ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] backdrop-blur-sm">
                    <SpeakerWaveIcon className="h-3.5 w-3.5 animate-pulse" />
                    Audio playing
                  </span>
                ) : audioDone ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em]">
                    Audio finished
                  </span>
                ) : null}
                <span className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wide">
                  {firstNum}-{lastNum} of {totalNum}
                </span>
              </div>
            </div>
          </div>

          {/* Questions (single column) — highlight/note enabled like the Reading panel */}
          <div
            className="space-y-6 pb-28"
            data-reading-markable="1"
            onClick={handleMarkPaneClick}
          >
            {(currentSection?.groups ?? []).map((group, groupIndex) => renderListeningGroup(group, groupIndex))}
          </div>
        </div>
      </div>
    )
  }

  const renderRightPanel = () => isListening ? renderListeningRightPanel() : (
    <div
      id="reading-questions-pane"
      data-reading-markable="1"
      onClick={handleMarkPaneClick}
      className="reading-pane reading-content reading-question-typography h-full overflow-y-auto border-l border-red-100 bg-white p-4 sm:p-5 lg:p-6 font-sans transition-colors duration-300 scrollbar-thin scrollbar-thumb-red-200"
    >
      <div className="sticky top-0 z-10 -mx-4 mb-5 flex items-center justify-between border-b border-red-100 bg-white/95 px-4 py-2.5 backdrop-blur-sm sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900">Questions Workspace</h3>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-500">Answer panel</p>
        </div>
        <span className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
          {sectionMeta[currentSectionIndex]?.questionNumbers[0]}-{sectionMeta[currentSectionIndex]?.questionNumbers[sectionMeta[currentSectionIndex]?.questionNumbers.length - 1]} of {testQuestionNumberCeiling}
        </span>
      </div>
      <div className="space-y-8 pb-20">
        {currentSection?.questions.map((q: Question, idx: number) => {
          const globalIdx = getQuestionGlobalIndex(currentSectionIndex, idx);
          const isFlagged = flaggedQuestions.includes(globalIdx);
          const isTFNG = q.type === 'true-false-not-given' || q.type === 'yes-no-not-given';
          const tfngOptions = q.type === 'yes-no-not-given' ? ['YES', 'NO', 'NOT GIVEN'] : ['TRUE', 'FALSE', 'NOT GIVEN'];
          const questionSlotCount = getQuestionSlotCount(q)
          const questionRangeDisplay = formatQuestionNumberRange(Array.from({ length: questionSlotCount }, (_, slotIndex) => q.number + slotIndex))

          const isMatching = q.type === 'matching-information' || q.type === 'matching-headings';
          const isSummary = q.type === 'summary-completion';
          const isFiveTrue = q.type === 'five-true-statements';
          const isDragDropSummary = q.type === 'drag-drop-summary';
          const selectedFive = readNonEmptyAnswerArray(answers[q.id] as unknown);
          const requiredSelectionCount =
            isFiveTrue && Array.isArray(q.correctAnswer) ? Math.max(1, q.correctAnswer.length) : 5
          const reviewMeta = getQuestionReviewMeta(q)
          const reviewIsCorrect = reviewMeta?.status === 'correct'
          const reviewIsWrong = reviewMeta?.status === 'incorrect' || reviewMeta?.status === 'skipped'
          const dragDropSlotCount =
            isDragDropSummary && Array.isArray(q.correctAnswer) ? Math.max(1, q.correctAnswer.length) : 0;
          const dragDropAnswer = Array.from({ length: dragDropSlotCount }, (_, slotIndex) =>
            String((answers[q.id] as string[] | undefined)?.[slotIndex] ?? '').trim(),
          );

          if (currentSection?.premiumQuestionGroups) {
            const groupStartIndexes = currentSection.questions.reduce<number[]>((indexes, question, questionIndex) => {
              const previousGroupTitle = currentSection.questions[questionIndex - 1]?.groupTitle
              if (question.groupTitle && question.groupTitle !== previousGroupTitle) indexes.push(questionIndex)
              return indexes
            }, [])
            const groupStartIndex = [...groupStartIndexes].reverse().find((questionIndex) => questionIndex <= idx) ?? 0
            const nextGroupStartIndex = groupStartIndexes.find((questionIndex) => questionIndex > groupStartIndex) ?? currentSection.questions.length
            const groupQuestions = currentSection.questions.slice(groupStartIndex, nextGroupStartIndex)
            const groupFirst = groupQuestions[0]
            const groupTypes = new Set(groupQuestions.map((question) => question.type))

            if (groupTypes.size === 1 && groupTypes.has('true-false-not-given')) {
              if (idx !== groupStartIndex) return null
              return (
                <div key={`${currentSection.id}-${groupFirst.groupTitle}-statements`}>
                  {renderStatementChoiceGroup(
                    groupQuestions,
                    groupFirst.groupTitle ?? questionRangeDisplay,
                    groupFirst.instruction ?? '',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }

            if (groupTypes.size === 1 && groupTypes.has('yes-no-not-given')) {
              if (idx !== groupStartIndex) return null
              return (
                <div key={`${currentSection.id}-${groupFirst.groupTitle}-claims`}>
                  {renderStatementChoiceGroup(
                    groupQuestions,
                    groupFirst.groupTitle ?? questionRangeDisplay,
                    groupFirst.instruction ?? '',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }

            if (
              groupTypes.size === 1 &&
              (groupTypes.has('matching-headings') || groupTypes.has('matching-information'))
            ) {
              if (idx !== groupStartIndex) return null
              return (
                <div key={`${currentSection.id}-${groupFirst.groupTitle}-matching`}>
                  {renderMatchingSelectGroup(
                    groupQuestions,
                    groupFirst.groupTitle ?? questionRangeDisplay,
                    groupFirst.instruction ?? '',
                    groupFirst.type === 'matching-headings' ? 'List of Headings' : 'Options',
                  )}
                </div>
              )
            }

            if (
              groupTypes.size === 1 &&
              (groupTypes.has('summary-completion') || groupTypes.has('note-completion'))
            ) {
              if (idx !== groupStartIndex) return null
              return (
                <div key={`${currentSection.id}-${groupFirst.groupTitle}-completion`}>
                  {renderSentenceCompletionGroup(
                    groupQuestions,
                    groupFirst.groupTitle ?? questionRangeDisplay,
                    groupFirst.instruction ?? '',
                  )}
                </div>
              )
            }

            if (groupTypes.size === 1 && groupTypes.has('short-answer')) {
              if (idx !== groupStartIndex) return null
              return (
                <div key={`${currentSection.id}-${groupFirst.groupTitle}-short-answer`}>
                  {renderShortAnswerGroup(
                    groupQuestions,
                    groupFirst.groupTitle ?? questionRangeDisplay,
                    groupFirst.instruction ?? '',
                  )}
                </div>
              )
            }
          }

          if (currentSection?.id === 'reading-day-26-passage-3') {
            if (q.number === 1) {
              const questions = currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 7)
              return (
                <div key="day26-handshake-statement-group">
                  {renderStatementChoiceGroup(
                    questions,
                    questions[0]?.groupTitle ?? 'Questions 1-7',
                    questions[0]?.instruction ?? '',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 7) return null
            if (q.number === 8) {
              const questions = currentSection.questions.filter((entry) => entry.number >= 8 && entry.number <= 12)
              return (
                <div key="day26-handshake-summary-group">
                  {renderTitledSummaryGroup(
                    questions,
                    questions[0]?.groupTitle ?? 'Questions 8-12',
                    questions[0]?.instruction ?? '',
                    'The history of cheek kissing',
                  )}
                </div>
              )
            }
            if (q.number > 8 && q.number <= 12) return null
            if (q.number === 13) {
              const questions = currentSection.questions.filter((entry) => entry.number >= 13 && entry.number <= 14)
              return (
                <div key="day26-handshake-short-answer-group">
                  {renderShortAnswerGroup(
                    questions,
                    questions[0]?.groupTitle ?? 'Questions 13-14',
                    questions[0]?.instruction ?? '',
                  )}
                </div>
              )
            }
            if (q.number === 14) return null
          }

          if (currentSection?.id === 'reading-day-27-passage-1') {
            if (q.number === 1) {
              const questions = currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 7)
              return (
                <div key={`${currentSection.id}-statement-group`}>
                  {renderStatementChoiceGroup(
                    questions,
                    questions[0]?.groupTitle ?? 'Questions 1-7',
                    questions[0]?.instruction ?? '',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 7) return null
            if (q.number === 8) {
              const questions = currentSection.questions.filter((entry) => entry.number >= 8 && entry.number <= 13)
              return (
                <div key={`${currentSection.id}-notes-group`}>
                  {renderMargaretPrestonNotesGroup(questions)}
                </div>
              )
            }
            if (q.number > 8 && q.number <= 13) return null
          }

          if (currentSection?.id === 'reading-day-28-passage-2') {
            const firstNumber = currentSection.questions[0]?.number ?? 1
            const headingsEnd = firstNumber + 5
            const summaryStart = firstNumber + 8
            const summaryEnd = firstNumber + 12
            if (q.number === firstNumber) {
              const questions = currentSection.questions.filter(
                (entry) => entry.number >= firstNumber && entry.number <= headingsEnd,
              )
              return (
                <div key={`${currentSection.id}-headings-group`}>
                  {renderMatchingSelectGroup(
                    questions,
                    questions[0]?.groupTitle ?? `Questions ${firstNumber}-${headingsEnd}`,
                    questions[0]?.instruction ?? '',
                    'List of Headings',
                  )}
                </div>
              )
            }
            if (q.number > firstNumber && q.number <= headingsEnd) return null
            if (q.number === summaryStart) {
              const questions = currentSection.questions.filter(
                (entry) => entry.number >= summaryStart && entry.number <= summaryEnd,
              )
              return (
                <div key={`${currentSection.id}-summary-group`}>
                  {renderTitledSummaryGroup(
                    questions,
                    questions[0]?.groupTitle ?? `Questions ${summaryStart}-${summaryEnd}`,
                    questions[0]?.instruction ?? '',
                    'Lawyers as professionals',
                  )}
                </div>
              )
            }
            if (q.number > summaryStart && q.number <= summaryEnd) return null
          }

          if (currentSection?.id === 'reading-day-29-passage-3') {
            const firstNumber = currentSection.questions[0]?.number ?? 1
            const statementsEnd = firstNumber + 4
            const summaryStart = firstNumber + 8
            const summaryEnd = firstNumber + 13
            if (q.number === firstNumber) {
              const questions = currentSection.questions.filter(
                (entry) => entry.number >= firstNumber && entry.number <= statementsEnd,
              )
              return (
                <div key={`${currentSection.id}-statement-group`}>
                  {renderStatementChoiceGroup(
                    questions,
                    questions[0]?.groupTitle ?? `Questions ${firstNumber}-${statementsEnd}`,
                    questions[0]?.instruction ?? '',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > firstNumber && q.number <= statementsEnd) return null
            if (q.number === summaryStart) {
              const questions = currentSection.questions.filter(
                (entry) => entry.number >= summaryStart && entry.number <= summaryEnd,
              )
              return (
                <div key={`${currentSection.id}-summary-group`}>
                  {renderPassageThreeSummaryGroup(questions)}
                </div>
              )
            }
            if (q.number > summaryStart && q.number <= summaryEnd) return null
          }

          if (
            currentSection?.id === 'georgia-okeeffe-p1' ||
            currentSection?.id === 'georgia-okeeffe-p1-v4' ||
            currentSection?.id === 'georgia-okeeffe-p1-v6'
          ) {
            if (q.number === 1) {
              return <div key="passage-1-notes-group">{renderPassageOneNotesGroup(currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 7))}</div>
            }
            if (q.number > 1 && q.number <= 7) return null
            if (q.number === 8) {
              return (
                <div key="passage-1-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 8 && entry.number <= 13),
                    'Questions 8-13',
                    'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 8 && q.number <= 13) return null
          }

          if (currentSection?.id === 'climate-adaptation-p2') {
            if (q.number === 14) {
              return <div key="passage-2-matrix-group">{renderPassageTwoMatrixGroup(currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 17))}</div>
            }
            if (q.number > 14 && q.number <= 17) return null
            if (q.number === 18) {
              return (
                <div key="passage-2-sentence-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 18 && entry.number <= 22),
                    'Questions 18-22',
                    'Complete the sentences. Write ONE WORD ONLY from the text for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 18 && q.number <= 22) return null
            if (q.number === 23) {
              return <div key="passage-2-drag-group">{renderDragDropSummaryGroup(q)}</div>
            }
          }

          if (
            currentSection?.id === 'climate-adaptation-p2-v4' ||
            currentSection?.id === 'climate-adaptation-p2-v6'
          ) {
            if (q.number === 14) {
              return (
                <div key={`${currentSection.id}-matrix-group`}>
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 17),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 17) return null
            if (q.number === 18) {
              return (
                <div key={`${currentSection.id}-sentence-group`}>
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 18 && entry.number <= 22),
                    'Questions 18-22',
                    'Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 18 && q.number <= 22) return null
            if (q.number === 23) {
              return (
                <div key={`${currentSection.id}-people-group`}>
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 23 && entry.number <= 26),
                    'Questions 23-26',
                    'Look at the following statements and the list of people below. Match each statement with the correct person.',
                    'List of people',
                  )}
                </div>
              )
            }
            if (q.number > 23 && q.number <= 26) return null
          }

          if (currentSection?.id === 'day1-curie-p1') {
            if (q.number === 1) {
              return (
                <div key="day1-curie-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 6),
                    'Questions 1-6',
                    'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 6) return null
            if (q.number === 7) {
              return (
                <div key="day1-curie-summary-group">
                  {renderDay1CurieNotesGroup(
                    currentSection.questions.filter((entry) => entry.number >= 7 && entry.number <= 13),
                  )}
                </div>
              )
            }
            if (q.number > 7 && q.number <= 13) return null
          }

          if (currentSection?.id === 'day2-identity-p2') {
            if (q.number === 14) {
              return (
                <div key="day2-identity-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 19),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 19) return null
            if (q.number === 20) {
              return (
                <div key="day2-identity-researcher-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 20 && entry.number <= 23),
                    'Questions 20-23',
                    'Match each sentence with the correct researcher.',
                    'List of Researchers',
                  )}
                </div>
              )
            }
            if (q.number > 20 && q.number <= 23) return null
            if (q.number === 24) {
              return (
                <div key="day2-identity-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 24 && entry.number <= 26),
                    'Questions 24-26',
                    'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 24 && q.number <= 26) return null
          }

          if (currentSection?.id === 'day3-museums-p3') {
            if (q.number === 27) {
              return (
                <div key="day3-museums-heading-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 27 && entry.number <= 30),
                    'Questions 27-30',
                    'Choose the correct heading for paragraphs B-E from the list of headings below.',
                    'List of Headings',
                  )}
                </div>
              )
            }
            if (q.number > 27 && q.number <= 30) return null
            if (q.number === 37) {
              return (
                <div key="day3-museums-ynng-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 37 && entry.number <= 40),
                    'Questions 37-40',
                    'Choose YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 37 && q.number <= 40) return null
          }

          if (currentSection?.id === 'day4-auditory-problems-p1') {
            if (q.number === 1) {
              return (
                <div key="day4-auditory-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 6),
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 6) return null
            if (q.number === 7) {
              return (
                <div key="day4-auditory-short-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 7 && entry.number <= 10),
                    'Questions 7-10',
                    'Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 7 && q.number <= 10) return null
          }

          if (currentSection?.id === 'day5-venus-transit-p2') {
            if (q.number === 14) {
              return (
                <div key="day5-venus-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 17),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 17) return null
            if (q.number === 18) {
              return (
                <div key="day5-venus-people-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 18 && entry.number <= 21),
                    'Questions 18-21',
                    'Match each statement with the correct person from the list below.',
                    'List of People',
                  )}
                </div>
              )
            }
            if (q.number > 18 && q.number <= 21) return null
            if (q.number === 22) {
              return (
                <div key="day5-venus-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 22 && entry.number <= 26),
                    'Questions 22-26',
                    'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 22 && q.number <= 26) return null
          }

          if (currentSection?.id === 'day6-neuroscientist-p3') {
            if (q.number === 32) {
              return (
                <div key="day6-neuro-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 32 && entry.number <= 37),
                    'Questions 32-37',
                    'Choose YES if the statement agrees with the claims of the writer, NO if it contradicts the claims, or NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 32 && q.number <= 37) return null
            if (q.number === 38) {
              return (
                <div key="day6-neuro-ending-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 38 && entry.number <= 40),
                    'Questions 38-40',
                    'Match each statement with the correct ending.',
                    'List of endings',
                  )}
                </div>
              )
            }
            if (q.number > 38 && q.number <= 40) return null
          }

          if (currentSection?.id === 'day7-london-underground-p1') {
            if (q.number === 1) {
              return (
                <div key="day7-london-notes-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 6),
                    'Questions 1-6',
                    'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 6) return null
            if (q.number === 7) {
              return (
                <div key="day7-london-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 7 && entry.number <= 13),
                    'Questions 7-13',
                    'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 7 && q.number <= 13) return null
          }

          if (currentSection?.id === 'day8-stadiums-p2') {
            if (q.number === 14) {
              return (
                <div key="day8-stadiums-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 17),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 17) return null
            if (q.number === 18) {
              return (
                <div key="day8-stadiums-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 18 && entry.number <= 22),
                    'Questions 18-22',
                    'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 18 && q.number <= 22) return null
          }

          if (currentSection?.id === 'day9-to-catch-a-king-p3') {
            if (q.number === 27) {
              return (
                <div key="day9-king-drag-group">
                  {renderDragDropSummaryGroup(q)}
                </div>
              )
            }
            if (q.number === 32) {
              return (
                <div key="day9-king-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 32 && entry.number <= 35),
                    'Questions 32-35',
                    'Choose YES if the statement agrees with the claims of the writer, NO if it contradicts the claims, or NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 32 && q.number <= 35) return null
          }

          if (currentSection?.id === 'day11-mary-rose-p1') {
            if (q.number === 1) {
              return (
                <div key="day11-mary-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 4),
                    'Questions 1-4',
                    'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 4) return null
            if (q.number === 5) {
              return (
                <div key="day11-mary-dates-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 5 && entry.number <= 8),
                    'Questions 5-8',
                    'Match each statement with the correct date, A-G.',
                    'List of Dates',
                  )}
                </div>
              )
            }
            if (q.number > 5 && q.number <= 8) return null
            if (q.number === 9) {
              return (
                <div key="day11-mary-short-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 9 && entry.number <= 13),
                    'Questions 9-13',
                    'Choose NO MORE THAN TWO WORDS from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 9 && q.number <= 13) return null
          }

          if (currentSection?.id === 'day12-easter-island-p2') {
            if (q.number === 14) {
              return (
                <div key="day12-easter-headings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 20),
                    'Questions 14-20',
                    'Choose the correct heading for each paragraph from the list of headings below.',
                    'List of Headings',
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 20) return null
            if (q.number === 21) {
              return (
                <div key="day12-easter-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 21 && entry.number <= 24),
                    'Questions 21-24',
                    'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 21 && q.number <= 24) return null
          }

          if (currentSection?.id === 'day13-neuroaesthetics-p3') {
            if (q.number === 31) {
              return (
                <div key="day13-neuroaesthetics-drag-group">
                  {renderDragDropSummaryGroup(q)}
                </div>
              )
            }
            if (q.number === 34) {
              return (
                <div key="day13-neuroaesthetics-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 34 && entry.number <= 39),
                    'Questions 34-39',
                    'Choose YES if the statement agrees with the claims of the writer, NO if it contradicts the claims, or NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 34 && q.number <= 39) return null
          }

          if (currentSection?.id === 'day14-pagodas-p1') {
            if (q.number === 1) {
              return (
                <div key="day14-pagodas-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 4),
                    'Questions 1-4',
                    'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 4) return null
            if (q.number === 5) {
              return (
                <div key="day14-pagodas-matching-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 5 && entry.number <= 10),
                    'Questions 5-10',
                    'Classify the following as typical of A, B or C.',
                    'Classify as A / B / C',
                  )}
                </div>
              )
            }
            if (q.number > 5 && q.number <= 10) return null
          }

          if (currentSection?.id === 'day15-true-cost-food-p2') {
            if (q.number === 14) {
              return (
                <div key="day15-food-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 17),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 17) return null
            if (q.number === 18) {
              return (
                <div key="day15-food-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 18 && entry.number <= 21),
                    'Questions 18-21',
                    'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 18 && q.number <= 21) return null
            if (q.number === 22) {
              return (
                <div key="day15-food-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 22 && entry.number <= 26),
                    'Questions 22-26',
                    'Complete the summary below. Choose NO MORE THAN THREE WORDS from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 22 && q.number <= 26) return null
          }

          if (currentSection?.id === 'day16-makete-transport-p3') {
            if (q.number === 27) {
              return (
                <div key="day16-makete-headings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 27 && entry.number <= 30),
                    'Questions 27-30',
                    'Reading Passage 3 has six sections. Choose the correct heading for each section from the list below.',
                    'List of Headings',
                  )}
                </div>
              )
            }
            if (q.number > 27 && q.number <= 30) return null
            if (q.number === 31) {
              return (
                <div key="day16-makete-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 31 && entry.number <= 35),
                    'Questions 31-35',
                    'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 31 && q.number <= 35) return null
            if (q.number === 36) {
              return (
                <div key="day16-makete-endings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 36 && entry.number <= 39),
                    'Questions 36-39',
                    'Complete each sentence with the correct ending, A-J, below.',
                    'List of Sentence Endings',
                  )}
                </div>
              )
            }
            if (q.number > 36 && q.number <= 39) return null
          }

          if (currentSection?.id === 'day17-story-of-silk-p1') {
            if (q.number === 1) {
              return (
                <div key="day17-silk-notes-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 9),
                    'Questions 1-9',
                    'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 9) return null
            if (q.number === 10) {
              return (
                <div key="day17-silk-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 10 && entry.number <= 13),
                    'Questions 10-13',
                    'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 10 && q.number <= 13) return null
          }

          if (currentSection?.id === 'day18-great-migrations-p2') {
            if (q.number === 14) {
              return (
                <div key="day18-migrations-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 18),
                    'Questions 14-18',
                    'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 18) return null
            if (q.number === 19) {
              return (
                <div key="day18-migrations-endings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 19 && entry.number <= 22),
                    'Questions 19-22',
                    'Complete each sentence with the correct ending, A-G, below.',
                    'List of Sentence Endings',
                  )}
                </div>
              )
            }
            if (q.number > 19 && q.number <= 22) return null
            if (q.number === 23) {
              return (
                <div key="day18-migrations-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 23 && entry.number <= 26),
                    'Questions 23-26',
                    'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 23 && q.number <= 26) return null
          }

          if (currentSection?.id === 'day19-math-reasoning-preface-p3') {
            if (q.number === 27) {
              return (
                <div key="day19-math-matching-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 27 && entry.number <= 34),
                    'Questions 27-34',
                    'Reading Passage 3 has seven sections. Which section contains the following information?',
                    'Sections A-G',
                  )}
                </div>
              )
            }
            if (q.number > 27 && q.number <= 34) return null
            if (q.number === 35) {
              return (
                <div key="day19-math-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 35 && entry.number <= 40),
                    'Questions 35-40',
                    'Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 35 && q.number <= 40) return null
          }

          if (currentSection?.id === 'day21-fishbourne-palace-p1') {
            if (q.number === 1) {
              return (
                <div key="day21-fishbourne-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 6),
                    'Questions 1-6',
                    'Do the following statements agree with the information given in the passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 6) return null
            if (q.number === 7) {
              return (
                <div key="day21-fishbourne-summary-group">
                  {renderTitledSummaryGroup(
                    currentSection.questions.filter((entry) => entry.number >= 7 && entry.number <= 13),
                    'Questions 7-13',
                    'Complete the summary below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.',
                    'Fishbourne Roman Palace',
                  )}
                </div>
              )
            }
            if (q.number > 7 && q.number <= 13) return null
          }

          if (currentSection?.id === 'day22-fear-unknown-p2') {
            if (q.number === 1) {
              return (
                <div key="day22-fear-matching-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 7),
                    'Questions 1-7',
                    'The passage has seven paragraphs, A-G. Which paragraph contains the following information? Write the correct letter, A-G. NB You may use any letter more than once.',
                    'Paragraphs A-G',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 7) return null
            if (q.number === 8) {
              return (
                <div key="day22-fear-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 8 && entry.number <= 11),
                    'Questions 8-11',
                    'Do the following statements agree with the information given in the passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 8 && q.number <= 11) return null
            if (q.number === 12) {
              return (
                <div key="day22-fear-endings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 12 && entry.number <= 14),
                    'Questions 12-14',
                    'Complete each sentence with the correct ending, A-D, below.',
                    'List of Sentence Endings',
                  )}
                </div>
              )
            }
            if (q.number > 12 && q.number <= 14) return null
          }

          if (currentSection?.id === 'day23-food-desert-p3') {
            if (q.number === 1) {
              return (
                <div key="day23-fooddesert-summary-group">
                  {renderTitledSummaryGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 6),
                    'Questions 1-6',
                    'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
                    'Mapping food deserts in Brooklyn',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 6) return null
            if (q.number === 7) {
              return (
                <div key="day23-fooddesert-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 7 && entry.number <= 13),
                    'Questions 7-13',
                    'Do the following statements agree with the information given in the passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 7 && q.number <= 13) return null
          }

          if (currentSection?.id === 'day24-amusia-p1') {
            if (q.number === 1) {
              return (
                <div key="day24-amusia-matching-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 5),
                    'Questions 1-5',
                    'The passage has seven paragraphs, A-G. Which paragraph contains the following information? Write the correct letter, A-G. NB You may use any letter more than once.',
                    'Paragraphs A-G',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 5) return null
            if (q.number === 6) {
              return (
                <div key="day24-amusia-yesno-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 6 && entry.number <= 9),
                    'Questions 6-9',
                    'Do the following statements agree with the claims of the writer in Reading Passage? Write YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 6 && q.number <= 9) return null
            if (q.number === 10) {
              return (
                <div key="day24-amusia-matching2-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 10 && entry.number <= 14),
                    'Questions 10-14',
                    'The passage has seven paragraphs, A-G. Which paragraph contains the following information? Write the correct letter, A-G.',
                    'Paragraphs A-G',
                  )}
                </div>
              )
            }
            if (q.number > 10 && q.number <= 14) return null
          }

          if (currentSection?.id === 'day25-stradivarius-p2') {
            if (q.number === 1) {
              return (
                <div key="day25-stradivarius-headings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 8),
                    'Questions 1-8',
                    'Reading Passage 2 has eight paragraphs, A-H. Choose the correct heading for each paragraph from the list of headings below.',
                    'List of Headings',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 8) return null
            if (q.number === 9) {
              return (
                <div key="day25-stradivarius-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 9 && entry.number <= 13),
                    'Questions 9-13',
                    'Do the following statements agree with the information given in Reading Passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 9 && q.number <= 13) return null
          }

          if (currentSection?.id === 'aus-parrots-p1-v6') {
            if (q.number === 1) {
              return (
                <div key="parrots-matching-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 6),
                    'Questions 1-6',
                    'Reading Passage 1 has ten paragraphs, A–J. Which paragraph contains the following information? Write the correct letter, A–J.',
                    'Paragraphs A–J',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 6) return null
            if (q.number === 10) {
              return (
                <div key="parrots-summary-group">
                  {renderTitledSummaryGroup(
                    currentSection.questions.filter((entry) => entry.number >= 10 && entry.number <= 13),
                    'Questions 10-13',
                    'Complete the summary below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.',
                    'Parrots in Australia',
                  )}
                </div>
              )
            }
            if (q.number > 10 && q.number <= 13) return null
          }

          if (currentSection?.id === 'yawning-p2-v6') {
            if (q.number === 14) {
              return <div key="yawning-drag-group">{renderDragDropSummaryGroup(q)}</div>
            }
            if (q.number === 25) {
              return (
                <div key="yawning-yng-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 25 && entry.number <= 27),
                    'Questions 25-27',
                    'Do the following statements agree with the claims of the writer? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 25 && q.number <= 27) return null
          }

          if (currentSection?.id === 'history-film-p3-v6') {
            if (q.number === 28) {
              return (
                <div key="history-film-matching-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 28 && entry.number <= 36),
                    'Questions 28-36',
                    'Reading Passage 3 has seven paragraphs, A–G. Which paragraph contains the following information? Write the correct letter, A–G. NB You may use any letter more than once.',
                    'Paragraphs A–G',
                  )}
                </div>
              )
            }
            if (q.number > 28 && q.number <= 36) return null
            if (q.number === 37) {
              return (
                <div key="history-film-yng-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 37 && entry.number <= 40),
                    'Questions 37-40',
                    'Do the following statements agree with the claims of the writer in Reading Passage 3? Write YES if the statement reflects the claims of the writer, NO if the statement contradicts the claims of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 37 && q.number <= 40) return null
          }

          if (currentSection?.id === 'gilbert-magnetism-p1-v4') {
            if (q.number === 1) {
              return (
                <div key="v4-gilbert-headings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 7),
                    'Questions 1-7',
                    'Reading Passage 1 has seven paragraphs A-G. Choose the correct heading for each paragraph from the list of headings below. Write the correct number i-x in boxes 1-7 on your answer sheet.',
                    'List of Headings',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 7) return null
            if (q.number === 8) {
              return (
                <div key="v4-gilbert-tfng-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 8 && entry.number <= 10),
                    'Questions 8-10',
                    'Do the following statements agree with the information given in Reading Passage 1? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 8 && q.number <= 10) return null
          }

          if (currentSection?.id === 'pacific-voyaging-p2-v4') {
            if (q.number === 14) {
              return (
                <div key="v4-pacific-yng-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 18),
                    'Questions 14-18',
                    'Do the following statements agree with the claims of the writer in Reading Passage 2? Write YES if the statement agrees with the claims of the writer, NO if the statement contradicts the claims of the writer, or NOT GIVEN if it is impossible to say what the writer thinks about this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 18) return null
            if (q.number === 24) {
              return (
                <div key="v4-pacific-endings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 24 && entry.number <= 27),
                    'Questions 24-27',
                    'Complete each sentence with the correct ending, A-F, below. Write the correct letter, A-F, in boxes 24-27 on your answer sheet.',
                    'List of Sentence Endings',
                  )}
                </div>
              )
            }
            if (q.number > 24 && q.number <= 27) return null
          }

          if (currentSection?.id === 'dingo-debate-p3-v4') {
            if (q.number === 28) {
              return (
                <div key="v4-dingo-sections-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 28 && entry.number <= 34),
                    'Questions 28-34',
                    'Reading Passage 3 has eight sections, A-H. Which section contains the following information? Write the correct letter, A-H, in boxes 28-34. NB You may use any letter more than once.',
                    'Sections A-H',
                  )}
                </div>
              )
            }
            if (q.number > 28 && q.number <= 34) return null
            if (q.number === 35) {
              return (
                <div key="v4-dingo-people-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 35 && entry.number <= 37),
                    'Questions 35-37',
                    'Look at the following statements (Questions 35-37) and the list of people below. Match each statement with the correct person, A, B, C or D.',
                    'List of People',
                  )}
                </div>
              )
            }
            if (q.number > 35 && q.number <= 37) return null
            if (q.number === 38) {
              return (
                <div key="v4-dingo-completion-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 38 && entry.number <= 40),
                    'Questions 38-40',
                    'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 38 && q.number <= 40) return null
          }

          if (currentSection?.id === 'metropolis-p3') {
            if (q.number === 27) {
              return (
                <div key="passage-3-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 27 && entry.number <= 30),
                    'Questions 27-30',
                    'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 27 && q.number <= 30) return null
            if (q.number === 31) {
              return (
                <div key="passage-3-summary-group">
                  {renderPassageThreeSummaryGroup(
                    currentSection.questions.filter((entry) => entry.number >= 31 && entry.number <= 36),
                  )}
                </div>
              )
            }
            if (q.number > 31 && q.number <= 36) return null
          }

          if (currentSection?.id === 'manatees-p1' || currentSection?.id === 'manatees-p1-v4') {
            if (q.number === 1) {
              return (
                <div key="manatees-notes-group">
                  {renderManateesNotesGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 6),
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 6) return null
            if (q.number === 7) {
              return (
                <div key="manatees-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 7 && entry.number <= 13),
                    'Questions 7-13',
                    'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 7 && q.number <= 13) return null
          }

          if (currentSection?.id === 'procrastination-p2' || currentSection?.id === 'procrastination-p2-v4') {
            if (q.number === 14) {
              return (
                <div key="procrastination-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 16),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 16) return null
            if (q.number === 17) {
              return (
                <div key="procrastination-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 17 && entry.number <= 22),
                    'Questions 17-22',
                    'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 17 && q.number <= 22) return null
          }

          if (currentSection?.id === 'robot-umpires-p3' || currentSection?.id === 'robot-umpires-p3-v4') {
            if (q.number === 27) {
              return (
                <div key="robot-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 27 && entry.number <= 32),
                    'Questions 27-32',
                    'Choose YES if the statement agrees with the information given in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 27 && q.number <= 32) return null
            if (q.number === 33) {
              return (
                <div key="robot-drag-group">
                  {renderDragDropSummaryGroup(q)}
                </div>
              )
            }
          }

          if (currentSection?.id === 'kakapo-p1') {
            if (q.number === 1) {
              return (
                <div key="kakapo-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 6),
                    'Questions 1-6',
                    'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 6) return null
            if (q.number === 7) {
              return (
                <div key="kakapo-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 7 && entry.number <= 13),
                    'Questions 7-13',
                    'Complete the notes below. Choose ONE WORD AND/OR A NUMBER from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 7 && q.number <= 13) return null
          }

          if (currentSection?.id === 'elm-return-p2') {
            if (q.number === 14) {
              return (
                <div key="elm-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 18),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 18) return null
            if (q.number === 19) {
              return (
                <div key="elm-people-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 19 && entry.number <= 23),
                    'Questions 19-23',
                    'Look at the following statements and the list of people below. Match each statement with the correct person.',
                    'List of People',
                  )}
                </div>
              )
            }
            if (q.number > 19 && q.number <= 23) return null
            if (q.number === 24) {
              return (
                <div key="elm-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 24 && entry.number <= 26),
                    'Questions 24-26',
                    'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 24 && q.number <= 26) return null
          }

          if (currentSection?.id === 'stress-judgement-p3') {
            if (q.number === 31) {
              return (
                <div key="stress-endings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 31 && entry.number <= 35),
                    'Questions 31-35',
                    'Complete each sentence with the correct ending.',
                    'List of endings',
                  )}
                </div>
              )
            }
            if (q.number > 31 && q.number <= 35) return null
            if (q.number === 36) {
              return (
                <div key="stress-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 36 && entry.number <= 40),
                    'Questions 36-40',
                    'Choose YES if the statement agrees with the information in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 36 && q.number <= 40) return null
          }

          if (currentSection?.id === 'frozen-food-p1-v5') {
            if (q.number === 1) {
              return (
                <div key="frozen-food-notes-group">
                  {renderFrozenFoodNotesGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 7),
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 7) return null
            if (q.number === 8) {
              return (
                <div key="frozen-food-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 8 && entry.number <= 13),
                    'Questions 8-13',
                    'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 8 && q.number <= 13) return null
          }

          if (currentSection?.id === 'coral-reefs-p2-v5') {
            if (q.number === 14) {
              return (
                <div key="coral-headings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 19),
                    'Questions 14-19',
                    'Reading Passage 2 has six sections. Choose the correct heading for each section from the list of headings below.',
                    'List of headings',
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 19) return null
            if (q.number === 24) {
              return (
                <div key="coral-notes-group">
                  {renderCoralReefNotesGroup(
                    currentSection.questions.filter((entry) => entry.number >= 24 && entry.number <= 26),
                  )}
                </div>
              )
            }
            if (q.number > 24 && q.number <= 26) return null
          }

          if (currentSection?.id === 'robots-and-us-p3-v5') {
            if (q.number === 27) {
              return (
                <div key="robots-experts-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 27 && entry.number <= 33),
                    'Questions 27-33',
                    'Look at the following statements and the list of experts below. Match each statement with the correct expert.',
                    'List of experts',
                  )}
                </div>
              )
            }
            if (q.number > 27 && q.number <= 33) return null
            if (q.number === 34) {
              return (
                <div key="robots-endings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 34 && entry.number <= 36),
                    'Questions 34-36',
                    'Complete each sentence with the correct ending.',
                    'List of sentence endings',
                  )}
                </div>
              )
            }
            if (q.number > 34 && q.number <= 36) return null
          }

          if (currentSection?.id === 'guard-dogs-p3-v4' || currentSection?.id === 'guard-dogs-p3-v6') {
            if (q.number === 27) {
              return (
                <div key={`${currentSection.id}-paragraph-group`}>
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 27 && entry.number <= 31),
                  )}
                </div>
              )
            }
            if (q.number > 27 && q.number <= 31) return null
            if (q.number === 32) {
              return (
                <div key={`${currentSection.id}-people-group`}>
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 32 && entry.number <= 36),
                    'Questions 32-36',
                    'Look at the following statements and the list of people below. Match each statement with the correct person.',
                    'List of people',
                  )}
                </div>
              )
            }
            if (q.number > 32 && q.number <= 36) return null
            if (q.number === 37) {
              return (
                <div key={`${currentSection.id}-summary-group`}>
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 37 && entry.number <= 40),
                    'Questions 37-40',
                    'Complete the summary below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 37 && q.number <= 40) return null
          }

          if (currentSection?.id === 'coconut-palm-p1-v7') {
            if (q.number === 1) {
              return (
                <div key="coconut-table-group">
                  {renderCoconutPalmTableGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 8),
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 8) return null
            if (q.number === 9) {
              return (
                <div key="coconut-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 9 && entry.number <= 13),
                    'Questions 9-13',
                    'Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 9 && q.number <= 13) return null
          }

          if (currentSection?.id === 'baby-talk-p2-v7') {
            if (q.number === 14) {
              return (
                <div key="baby-talk-people-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 17),
                    'Questions 14-17',
                    'Match each statement with the correct person.',
                    'List of names',
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 17) return null
            if (q.number === 18) {
              return (
                <div key="baby-talk-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 18 && entry.number <= 23),
                    'Questions 18-23',
                    'Choose NO MORE THAN TWO WORDS from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 18 && q.number <= 23) return null
            if (q.number === 24) {
              return (
                <div key="baby-talk-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 24 && entry.number <= 26),
                  )}
                </div>
              )
            }
            if (q.number > 24 && q.number <= 26) return null
          }

          if (currentSection?.id === 'harappan-civilisation-p3-v7') {
            if (q.number === 27) {
              return (
                <div key="harappan-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 27 && entry.number <= 31),
                  )}
                </div>
              )
            }
            if (q.number > 27 && q.number <= 31) return null
            if (q.number === 32) {
              return (
                <div key="harappan-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 32 && entry.number <= 36),
                    'Questions 32-36',
                    'Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 32 && q.number <= 36) return null
            if (q.number === 37) {
              return (
                <div key="harappan-people-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 37 && entry.number <= 40),
                    'Questions 37-40',
                    'Match each statement with the correct person.',
                    'List of names',
                  )}
                </div>
              )
            }
            if (q.number > 37 && q.number <= 40) return null
          }

          if (currentSection?.id === 'nutmeg-p1-v8') {
            if (q.number === 1) {
              return (
                <div key="nutmeg-notes-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 4),
                    'Questions 1-4',
                    'Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 4) return null
            if (q.number === 5) {
              return (
                <div key="nutmeg-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 5 && entry.number <= 7),
                    'Questions 5-7',
                    'Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, or NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 5 && q.number <= 7) return null
            if (q.number === 8) {
              return (
                <div key="nutmeg-table-group">
                  {renderNutmegTimelineGroup(
                    currentSection.questions.filter((entry) => entry.number >= 8 && entry.number <= 13),
                  )}
                </div>
              )
            }
            if (q.number > 8 && q.number <= 13) return null
          }

          if (currentSection?.id === 'driverless-cars-p2-v8') {
            if (q.number === 14) {
              return (
                <div key="driverless-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 18),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 18) return null
            if (q.number === 19) {
              return (
                <div key="driverless-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 19 && entry.number <= 22),
                    'Questions 19-22',
                    'Choose NO MORE THAN TWO WORDS from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 19 && q.number <= 22) return null
          }

          if (currentSection?.id === 'what-is-exploration-p3-v8') {
            if (q.number === 33) {
              return (
                <div key="exploration-people-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 33 && entry.number <= 37),
                    'Questions 33-37',
                    'Choose the correct letter. NB You may use any letter more than once.',
                    'List of names',
                  )}
                </div>
              )
            }
            if (q.number > 33 && q.number <= 37) return null
            if (q.number === 38) {
              return (
                <div key="exploration-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 38 && entry.number <= 40),
                    'Questions 38-40',
                    'Choose NO MORE THAN TWO WORDS from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 38 && q.number <= 40) return null
          }

          if (currentSection?.id === 'dead-sea-scrolls-p1-v9') {
            if (q.number === 1) {
              return (
                <div key="dead-sea-notes-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 5),
                    'Questions 1-5',
                    'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 5) return null
            if (q.number === 6) {
              return (
                <div key="dead-sea-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 6 && entry.number <= 13),
                    'Questions 6-13',
                    'Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 6 && q.number <= 13) return null
          }

          if (currentSection?.id === 'tomato-domestication-p2-v9') {
            if (q.number === 14) {
              return (
                <div key="tomato-matrix-group">
                  {renderPassageTwoMatrixGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 18),
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 18) return null
            if (q.number === 19) {
              return (
                <div key="tomato-researchers-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 19 && entry.number <= 23),
                    'Questions 19-23',
                    'Match each statement with the correct researcher.',
                    'List of names',
                  )}
                </div>
              )
            }
            if (q.number > 19 && q.number <= 23) return null
            if (q.number === 24) {
              return (
                <div key="tomato-summary-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 24 && entry.number <= 26),
                    'Questions 24-26',
                    'Complete the sentences below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 24 && q.number <= 26) return null
          }

          if (currentSection?.id === 'insight-evolution-p3-v9') {
            if (q.number === 32) {
              return (
                <div key="insight-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 32 && entry.number <= 36),
                    'Questions 32-36',
                    'Choose YES if the statement agrees with the information given in the text, choose NO if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['YES', 'NO', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 32 && q.number <= 36) return null
            if (q.number === 37) {
              return (
                <div key="insight-drag-group">
                  {renderDragDropSummaryGroup(q)}
                </div>
              )
            }
          }

          if (currentSection?.id === 'polar-bears-p1-v10') {
            if (q.number === 1) {
              return (
                <div key="polar-statement-group">
                  {renderStatementChoiceGroup(
                    currentSection.questions.filter((entry) => entry.number >= 1 && entry.number <= 7),
                    'Questions 1-7',
                    'Choose TRUE if the statement agrees with the information in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.',
                    ['TRUE', 'FALSE', 'NOT GIVEN'],
                  )}
                </div>
              )
            }
            if (q.number > 1 && q.number <= 7) return null
            if (q.number === 8) {
              return (
                <div key="polar-notes-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 8 && entry.number <= 13),
                    'Questions 8-13',
                    'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 8 && q.number <= 13) return null
          }

          if (currentSection?.id === 'step-pyramid-p2-v10') {
            if (q.number === 14) {
              return (
                <div key="step-headings-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions.filter((entry) => entry.number >= 14 && entry.number <= 20),
                    'Questions 14-20',
                    'Reading Passage 2 has seven paragraphs. Choose the correct heading for each paragraph from the list of headings below.',
                    'List of headings',
                  )}
                </div>
              )
            }
            if (q.number > 14 && q.number <= 20) return null
            if (q.number === 21) {
              return (
                <div key="step-notes-group">
                  {renderSentenceCompletionGroup(
                    currentSection.questions.filter((entry) => entry.number >= 21 && entry.number <= 24),
                    'Questions 21-24',
                    'Complete the notes below. Choose ONE WORD ONLY from the passage for each answer.',
                  )}
                </div>
              )
            }
            if (q.number > 21 && q.number <= 24) return null
          }

          if (currentSection?.id === 'future-work-p3-v10') {
            if (q.number === 31) {
              return (
                <div key="future-drag-group">
                  {renderDragDropSummaryGroup(q)}
                </div>
              )
            }
            if (q.number === 35) {
              return (
                <div key="future-people-group">
                  {renderMatchingSelectGroup(
                    currentSection.questions
                      .filter((entry) => entry.number >= 35 && entry.number <= 40)
                      .sort((left, right) => left.number - right.number),
                    'Questions 35-40',
                    'Match each statement with the correct person. NB You may use any letter more than once.',
                    'List of names',
                  )}
                </div>
              )
            }
            if (q.number > 35 && q.number <= 40) return null
          }

          return (
            <div key={q.id}>
              {(q.groupTitle || q.instruction) && (
                <div className="mb-4 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50/70 to-rose-50/60 p-4">
                  {q.groupTitle && <p className="text-sm font-bold text-red-700 mb-1">{q.groupTitle}</p>}
                  {q.instruction && (
                    <p className="text-sm text-slate-600 italic">
                      {q.instruction.includes('NO MORE THAN THREE WORDS') ? (
                        <>
                          {q.instruction.split(/(NO MORE THAN THREE WORDS)/i).map((part, i) =>
                            /NO MORE THAN THREE WORDS/i.test(part) ? (
                              <span key={i} className="text-red-600 font-bold not-italic">{part}</span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </>
                      ) : (
                        q.instruction
                      )}
                    </p>
                  )}
                </div>
              )}

              <div id={`question-card-${q.id}`} className="relative group" onClick={() => setLastActiveQuestionIndex(globalIdx)}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`min-w-[2.4rem] h-9 px-2 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all tracking-[0.02em] ${lastActiveQuestionIndex === globalIdx ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.3)]' : 'bg-red-50 text-red-700 border border-red-100'}`}>{questionRangeDisplay}</div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleFlagQuestion(globalIdx); }} className={`p-1.5 rounded-lg shrink-0 transition-all ${isFlagged ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-slate-600 hover:bg-red-50/70'}`} title="Flag">
                    <BookmarkIcon className={`w-4 h-4 ${isFlagged ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="border border-red-100 rounded-2xl p-4 bg-gradient-to-b from-white to-red-50/30 transition-colors shadow-[0_10px_26px_rgba(220,38,38,0.09)]">
                  {isMatching ? (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <CompactSelect
                        options={q.options || []}
                        value={answers[q.id] as string}
                        onChange={(val) => handleAnswerChange(q.id, val)}
                        disabled={isReviewMode}
                      />
                      <span className="text-[15px] text-slate-950 font-bold leading-relaxed">{q.text}</span>
                      {reviewHint(q)}
                    </div>
                  ) : isSummary && (q.text.includes('______') || q.text.includes('_')) ? (
                    <div className="text-[15px] text-slate-950 font-semibold leading-relaxed flex flex-wrap items-baseline gap-1">
                      {q.text.split(/(______|_+)/).map((part, i) =>
                        /^_+$/.test(part) || part === '______' ? (
                          <input
                            key={i}
                            type="text"
                            value={answers[q.id] as string || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            disabled={isReviewMode}
                            className={`px-2 py-1 min-w-[120px] max-w-[200px] rounded border bg-white text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                              isReviewMode && reviewShowCorrectAnswers
                                ? reviewIsWrong
                                  ? 'border-red-300 bg-red-50/70 text-red-700'
                                  : reviewIsCorrect
                                    ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                                    : 'border-red-200'
                                : 'border-red-200'
                            }`}
                            placeholder="..."
                          />
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                      {reviewHint(q)}
                    </div>
                  ) : isTFNG ? (
                    <div className="space-y-2">
                      <p className="text-[15px] text-slate-950 font-bold leading-relaxed">{q.text}</p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {tfngOptions.map((option) => {
                          const checked = String(answers[q.id] ?? '').toUpperCase() === option
                          const state = getChoiceVisualState(q, option)
                          const tone =
                            state === 'correct'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : state === 'wrong'
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : state === 'missed'
                                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-700'
                                  : checked
                                    ? 'border-red-300 bg-red-50 text-red-700'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/40'
                          return (
                            <button
                              type="button"
                              key={`${q.id}-tfng-${option}`}
                              onClick={() => {
                                if (isReviewMode) return
                                handleAnswerChange(q.id, option)
                              }}
                              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 ${tone} ${
                                isReviewMode ? 'cursor-default' : 'cursor-pointer'
                              }`}
                            >
                              <span
                                className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                  checked ? 'border-red-500 bg-white' : 'border-slate-300 bg-white'
                                }`}
                              >
                                <span className={`h-2 w-2 rounded-full ${checked ? 'bg-red-500' : 'bg-transparent'}`} />
                              </span>
                              {option}
                            </button>
                          )
                        })}
                      </div>
                      {reviewHint(q)}
                    </div>
                  ) : isDragDropSummary ? (
                    <div className="space-y-4">
                      {(() => {
                        const queuedOption = activeDragOption[q.id]?.trim() ?? ''
                        return (
                          <>
                      <div className="space-y-3">
                        {q.text
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line, lineIndex) => {
                            const slotValue = dragDropAnswer[lineIndex] || ''
                            const slotNumber = q.number + lineIndex
                            const isFilled = slotValue.length > 0
                            const isActiveSlot = activeDragSlots[q.id] === lineIndex
                            return (
                              <div key={`${q.id}-slot-${lineIndex}`} className="space-y-2">
                                <p className="text-[15px] text-slate-950 font-semibold leading-relaxed">
                                  <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-red-50 px-1 text-[11px] font-black text-red-700">
                                    {slotNumber}
                                  </span>
                                  {line}
                                </p>
                                <div
                                  onDragOver={(event) => event.preventDefault()}
                                  onDragEnter={(event) => {
                                    event.preventDefault()
                                    if (isReviewMode) return
                                    setActiveDragSlots((current) => ({ ...current, [q.id]: lineIndex }))
                                  }}
                                  onDrop={(event) => {
                                    event.preventDefault()
                                    if (isReviewMode) return
                                    const dragged = event.dataTransfer.getData('text/plain')
                                    assignDragDropAnswer(q.id, lineIndex, dragged, dragDropSlotCount)
                                  }}
                                  onClick={() => {
                                    if (isReviewMode) return
                                    if (isFilled) {
                                      clearDragDropSlot(q.id, lineIndex, dragDropSlotCount)
                                      return
                                    }
                                    if (queuedOption) {
                                      assignDragDropAnswer(q.id, lineIndex, queuedOption, dragDropSlotCount)
                                      return
                                    }
                                    setActiveDragSlots((current) => ({ ...current, [q.id]: lineIndex }))
                                  }}
                                  onDoubleClick={() => {
                                    if (isReviewMode) return
                                    if (isFilled) {
                                      clearDragDropSlot(q.id, lineIndex, dragDropSlotCount)
                                    }
                                  }}
                                  className={`min-h-[48px] rounded-xl border border-dashed px-3 py-2 transition-colors ${
                                    isFilled
                                      ? 'cursor-pointer border-red-300 bg-red-50/70'
                                      : isActiveSlot
                                        ? 'cursor-pointer border-red-400 bg-red-50/55'
                                        : 'cursor-pointer border-red-200 bg-white hover:border-red-300'
                                  }`}
                                >
                                  {isFilled ? (
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        draggable={!isReviewMode}
                                        onDragStart={(event) => {
                                          event.dataTransfer.setData('text/plain', slotValue)
                                          queueDragDropOption(q.id, slotValue)
                                        }}
                                        onClick={() => clearDragDropSlot(q.id, lineIndex, dragDropSlotCount)}
                                        onDoubleClick={() => clearDragDropSlot(q.id, lineIndex, dragDropSlotCount)}
                                        className="inline-flex cursor-grab items-center rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700"
                                      >
                                        {slotValue}
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                      {`Drop answer ${slotNumber} here`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>

                      <div className="rounded-xl border border-red-100 bg-red-50/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-red-700">
                          Drag these options
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(q.options || []).map((option) => {
                            const isAssigned = dragDropAnswer.some(
                              (entry) => entry.toLowerCase() === option.toLowerCase(),
                            )
                            const isQueued = queuedOption.toLowerCase() === option.toLowerCase()
                            return (
                              <button
                                key={`${q.id}-option-${option}`}
                                type="button"
                                draggable={!isReviewMode}
                                onMouseDown={() => queueDragDropOption(q.id, option)}
                                onDragStart={(event) => {
                                  event.dataTransfer.setData('text/plain', option)
                                  queueDragDropOption(q.id, option)
                                }}
                                onClick={() => {
                                  if (isReviewMode) return
                                  queueDragDropOption(q.id, option)
                                  const preferredSlot = activeDragSlots[q.id]
                                  if (typeof preferredSlot === 'number' && preferredSlot >= 0 && preferredSlot < dragDropSlotCount) {
                                    assignDragDropAnswer(q.id, preferredSlot, option, dragDropSlotCount)
                                    return
                                  }
                                  const firstEmpty = dragDropAnswer.findIndex((entry) => !entry)
                                  if (firstEmpty >= 0) {
                                    assignDragDropAnswer(q.id, firstEmpty, option, dragDropSlotCount)
                                    setActiveDragSlots((current) => ({ ...current, [q.id]: firstEmpty }))
                                    return
                                  }
                                  assignDragDropAnswer(q.id, 0, option, dragDropSlotCount)
                                }}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                  isAssigned
                                    ? 'cursor-grab border-emerald-300 bg-emerald-100 text-emerald-800'
                                    : isQueued
                                      ? 'cursor-grab border-red-400 bg-red-100 text-red-800 shadow-[0_8px_16px_rgba(220,38,38,0.16)]'
                                      : 'cursor-grab border-red-200 bg-white text-red-700 hover:bg-red-100'
                                }`}
                              >
                                {option}
                              </button>
                            )
                          })}
                        </div>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          {queuedOption
                            ? `Selected option: ${queuedOption}`
                            : 'Tip: press and drag an option to a blank, or click to auto-place.'}
                        </p>
                      </div>
                          </>
                        )
                      })()}
                      {reviewHint(q)}
                    </div>
                  ) : isFiveTrue ? (
                    <div className="space-y-3">
                      <p className="text-[15px] text-slate-950 font-bold leading-relaxed mb-3">
                        {q.text || `Select ${requiredSelectionCount} correct statements.`}
                      </p>
                      <div className="space-y-2">
                        {(q.options || []).map((opt: string, i: number) => {
                          const letter = opt.charAt(0).toUpperCase();
                          const isChecked = selectedFive.includes(letter) || selectedFive.includes(opt);
                          const canSelect = selectedFive.length < requiredSelectionCount || isChecked;
                          const state = getChoiceVisualState(q, letter)
                          const tone =
                            state === 'correct'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : state === 'wrong'
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : state === 'missed'
                                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-700'
                                  : isChecked
                                    ? 'border-red-300 bg-red-50 shadow-sm'
                                    : 'border-red-100 bg-white hover:border-red-300'
                          return (
                            <label
                              key={i}
                              className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                                isReviewMode ? 'cursor-default' : 'cursor-pointer'
                              } ${tone} ${!canSelect && !isReviewMode ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                state === 'correct' || state === 'missed'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : state === 'wrong'
                                    ? 'border-red-300 bg-red-50 text-red-700'
                                    : 'border-red-200 bg-red-50 text-red-600'
                              }`}>
                                {letter}
                              </div>
                              <span
                                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                  state === 'correct' || state === 'missed'
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : state === 'wrong' || isChecked
                                      ? 'border-red-500 bg-red-500/10'
                                      : 'border-slate-300 bg-white'
                                }`}
                              >
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    state === 'correct' || state === 'missed'
                                      ? 'bg-emerald-500'
                                      : state === 'wrong' || isChecked
                                        ? 'bg-red-500'
                                        : 'bg-transparent'
                                  }`}
                                />
                              </span>
                              <span className="text-[15px] font-semibold text-slate-950 flex-1">{opt.replace(/^[A-H]\.?\s*/, '')}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (!canSelect && !isChecked) return;
                                  const next = isChecked
                                    ? selectedFive.filter((x) => x !== letter && x !== opt)
                                    : [...selectedFive.filter((x) => x !== letter && x !== opt), letter].slice(0, requiredSelectionCount);
                                  handleAnswerChange(q.id, next);
                                }}
                                disabled={isReviewMode}
                                className="sr-only"
                              />
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Selected: {selectedFive.length} of {requiredSelectionCount}
                      </p>
                      {reviewHint(q)}
                    </div>
                  ) : q.type === 'multiple-choice' ? (
                    <div className="space-y-2">
                      <p className="text-[15px] text-slate-950 font-bold leading-relaxed mb-2">{q.text}</p>
                      {q.options?.map((opt: string, i: number) => {
                        const label = String.fromCharCode(65 + i)
                        const isSelected =
                          answers[q.id] === label ||
                          (typeof answers[q.id] === 'string' && (answers[q.id] as string).startsWith(label))
                        const state = getChoiceVisualState(q, label)
                        const tone =
                          state === 'correct'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : state === 'wrong'
                              ? 'border-red-300 bg-red-50 text-red-700'
                            : state === 'missed'
                                ? 'border-emerald-300 bg-emerald-50/70 text-emerald-700'
                                : isSelected
                                  ? 'border-red-300 bg-red-50 shadow-[0_10px_18px_rgba(220,38,38,0.14)]'
                                  : 'border-red-100 bg-white hover:border-red-300'
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => {
                              if (isReviewMode) return
                              handleAnswerChange(q.id, label)
                            }}
                            className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 ${isReviewMode ? 'cursor-default' : 'cursor-pointer'} ${tone}`}
                          >
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                              state === 'correct' || state === 'missed'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                : state === 'wrong'
                                  ? 'border-red-300 bg-red-50 text-red-700'
                                  : 'border-red-200 bg-red-50 text-red-600'
                            }`}>
                              {label}
                            </span>
                            <span
                              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                state === 'correct' || state === 'missed'
                                  ? 'border-emerald-500 bg-emerald-500/10'
                                  : state === 'wrong' || isSelected
                                    ? 'border-red-500 bg-red-500/10'
                                    : 'border-slate-300 bg-white'
                              }`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  state === 'correct' || state === 'missed'
                                    ? 'bg-emerald-500'
                                    : state === 'wrong' || isSelected
                                      ? 'bg-red-500'
                                      : 'bg-transparent'
                                }`}
                              />
                            </span>
                            <span className="text-sm font-semibold text-slate-950">{opt.replace(/^[A-Z]\.?\s*/, '')}</span>
                          </button>
                        )
                      })}
                      {reviewHint(q)}
                    </div>
                  ) : (
                    <div>
                      <p className="text-[15px] text-slate-950 font-semibold leading-relaxed mb-3">{q.text}</p>
                      <input
                        type="text"
                        value={(answers[q.id] as string) || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={isReviewMode}
                        className={`w-full rounded-xl border px-4 py-3 text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                          isReviewMode && reviewShowCorrectAnswers
                            ? reviewIsWrong
                              ? 'border-red-300 bg-red-50/70 text-red-700'
                              : reviewIsCorrect
                                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-700'
                                : 'border-red-200 bg-white'
                            : 'border-red-200 bg-white'
                        }`}
                        placeholder="Type your answer..."
                      />
                      {reviewHint(q)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )

  return (
    <div
      ref={testShellRef}
      className={`reading-shell reading-scale-120 ${contrastClass} reading-size-${textSizeMode} reading-font-${readingFont} flex flex-col h-screen overflow-hidden relative z-50 bg-[linear-gradient(160deg,#ffffff_0%,#fff5f5_52%,#fffaf8_100%)] text-slate-900 transition-colors duration-300 font-sans`}
    >
      <AnimatePresence>
        {isLaunching ? (
          <TestLaunchOverlay
            title="Your test will begin shortly"
            subtitle={isListening ? 'Preparing your Listening test' : 'Preparing your Reading test'}
          />
        ) : null}
      </AnimatePresence>
      {!isTestActive ? renderStartScreen() : (
        <>
          <header className="reading-toolbar bg-white/95 border-b border-red-100 h-16 flex items-center justify-between px-4 z-20 relative shadow-[0_10px_24px_rgba(220,38,38,0.09)] backdrop-blur-md">
            <div className="flex items-center gap-3 shrink-0">
              <button type="button" onClick={handleExitTest} className="premium-back-btn-sm normal-case tracking-normal text-slate-700" title="Exit">
                <ArrowLeftIcon className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-slate-700">Back</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-red-600">IELTS</span>
                <span className="text-xl font-semibold text-slate-500">{isListening ? 'Listening' : 'Reading'}</span>
                {isListening && isAudioPlaying ? (
                  <span className="ml-2 hidden items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-red-600 sm:inline-flex">
                    <SpeakerWaveIcon className="h-3.5 w-3.5" />
                    Audio playing
                  </span>
                ) : null}
              </div>
            </div>

            {!isReviewMode ? (
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-red-100 bg-white/95 px-2 py-1 shadow-[0_14px_30px_rgba(220,38,38,0.16)]">
                <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 bg-white px-3.5 text-slate-700">
                  <ClockIcon className="h-4 w-4 text-red-500" />
                  <Timer
                    duration={(testMode === 'practice' ? customTime : test.duration) * 60}
                    timeLeft={timeRemaining}
                    setTimeLeft={setTimeRemaining}
                    onTimeUp={handleTimeUp}
                    isActive={isTestActive}
                    variant="readingCompact"
                  />
                </span>
              </div>
            ) : (
              <div className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-2 rounded-2xl border border-red-100 bg-white px-3 py-2 shadow-[0_12px_26px_rgba(220,38,38,0.15)]">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-red-600">Review Mode</span>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={toggleFullscreen} className="p-2.5 rounded-xl text-slate-600 hover:bg-red-50 transition-colors" title="Full screen">
                {isFullscreen ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
              </button>
              <button type="button" onClick={() => { setOptionsPage('menu'); setShowOptionsModal(true) }} className="p-2.5 rounded-xl text-slate-600 hover:bg-red-50 transition-colors" title="Menu">
                <Bars3Icon className="h-5 w-5" />
              </button>
              {!isReviewMode ? (
                <>
                  <button type="button" onClick={() => setShowNotes(!showNotes)} className="p-2.5 rounded-xl text-slate-600 hover:bg-red-50 transition-colors" title="Notes">
                    <DocumentTextIcon className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => setShowReviewModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100" title="Review">
                    <EyeIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold hidden sm:inline">Review</span>
                  </button>
                  <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-red-200 bg-white px-3 py-2">
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Final Check</p>
                      <p className="text-xs font-semibold text-slate-600">{submitPreview.answered}/{submitPreview.total} answered</p>
                    </div>
                    <button type="button" onClick={openSubmitModal} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-bold shadow-[0_14px_26px_rgba(220,38,38,0.34)] transition-all border border-red-700/20">
                      <span>Submit</span>
                      <PaperAirplaneIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <button type="button" onClick={openSubmitModal} className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-bold shadow-[0_14px_26px_rgba(220,38,38,0.34)] transition-all border border-red-700/20">
                    <span>Submit</span>
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setReviewShowCorrectAnswers((value) => !value)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    reviewShowCorrectAnswers
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <EyeIcon className="h-4 w-4" />
                  {reviewShowCorrectAnswers ? 'Hide Correct Answers' : 'Show Correct Answers'}
                </button>
              )}
            </div>
          </header>
          <div className="flex-1 relative overflow-hidden" id="test-main-container">
            {isListening ? (
              <div className="relative h-full overflow-hidden">
                {renderMarkTools()}
                {renderRightPanel()}
              </div>
            ) : (
              <SplitScreen left={renderLeftPanel()} right={renderRightPanel()} className="h-full" />
            )}
            <NotesPanel testId={test.id} isOpen={showNotes} onClose={() => setShowNotes(false)} />
            <WordLookupModal
              open={Boolean(aiLookup)}
              word={aiLookup?.word ?? ''}
              sentence={aiLookup?.sentence}
              context={isListening ? 'listening' : 'reading'}
              origin={test.title}
              onClose={() => setAiLookup(null)}
            />
          </div>
          <div className="reading-toolbar z-20 bg-white border-t border-red-100 relative shadow-[0_-1px_3px_rgba(220,38,38,0.08)]">
            <QuestionNavigation sections={sectionMeta} currentSectionIndex={currentSectionIndex} currentQuestionIndex={lastActiveQuestionIndex} answers={answers} onNavigate={handleNavigateQuestion} onSectionChange={handleSectionChange} onFlag={isReviewMode ? undefined : handleFlagQuestion} flagged={flaggedQuestions} />
          </div>
        </>
      )}

      {/* LISTENING AUDIO (continuous, no user controls) */}
      {isListening && isTestActive ? (
        <audio
          ref={audioRef}
          src={listeningAudioSources[currentAudioIndex] || undefined}
          preload="auto"
          onEnded={handleListeningAudioEnded}
          onPlay={() => setIsAudioPlaying(true)}
          onPause={handleAudioPause}
        />
      ) : null}

      {/* LISTENING PLAY OVERLAY */}
      <AnimatePresence>
        {isListening && isTestActive && !audioStarted && !isReviewMode ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/55 px-4 backdrop-blur-[1px]"
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 10 }}
              className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-white">
                <SpeakerWaveIcon className="h-10 w-10" />
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-slate-700">
                You will be listening to an audio clip during this test. You will not be permitted to pause or rewind the
                audio while answering the questions.
              </p>
              <p className="mt-4 text-[15px] font-semibold text-slate-900">To continue, click Play.</p>
              <button
                type="button"
                onClick={startListeningAudio}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-base font-bold text-white shadow-lg transition hover:bg-slate-800"
              >
                <PlayIcon className="h-5 w-5" />
                Play
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setShowReviewModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-[0_24px_52px_rgba(220,38,38,0.2)] border border-red-100 overflow-hidden">
              <div className="p-6 border-b border-red-100 bg-gradient-to-r from-red-50/80 to-rose-50/70">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <EyeIcon className="h-6 w-6 text-red-500" />
                  Review your answers
                </h3>
                <p className="text-sm text-slate-500 mt-1">This window is to review your answers only. You cannot change answers here.</p>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {activeSections.map((section, sIdx) => (
                    <div key={section.id}>
                      <p className="text-sm font-bold text-slate-700 mb-2">Part {resolvePassageNumber(section, sIdx + 1)}: {section.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {section.questions.map((q, qIdx) => {
                          const startIndex = getQuestionGlobalIndex(sIdx, qIdx);
                          const slotCount = getQuestionSlotCount(q);
                          const questionNumbers = Array.from({ length: slotCount }, (_, index) => startIndex + index + 1);
                          const displayNumber = formatQuestionNumberRange(questionNumbers);
                          const ans = answers[q.id];
                          const display = Array.isArray(ans)
                            ? (ans as string[]).filter((entry) => String(entry ?? '').trim().length > 0).join(', ')
                            : String(ans ?? '').trim()
                          const isAnswered = display.length > 0
                          return (
                            <button type="button"
                              key={q.id}
                              onClick={() => { setShowReviewModal(false); handleNavigateQuestion(startIndex); }}
                              className={`px-3 py-2 rounded-xl text-sm border transition-colors text-left shadow-sm ${
                                isAnswered
                                  ? 'bg-gradient-to-r from-red-50/80 to-rose-50/70 border-red-200 text-slate-800 hover:border-red-400'
                                  : 'bg-white border-red-100 text-slate-500 hover:border-red-300'
                              }`}
                            >
                              <span className="font-bold text-red-600">{displayNumber}.</span>{' '}
                              <span className={isAnswered ? 'text-slate-900 font-semibold' : 'text-slate-400'}>{isAnswered ? display : '-'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-red-100 flex justify-end">
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors border border-red-200">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM PRACTICE SETUP MODAL */}
      <AnimatePresence>
        {showModeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[linear-gradient(160deg,#fff7f7_0%,#fee2e2_52%,#fff_100%)]/80 backdrop-blur-md" onClick={() => setShowModeModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-[44rem] overflow-hidden rounded-[30px] border border-red-100 bg-[linear-gradient(160deg,#fff_0%,#fff8f8_52%,#fffaf8_100%)] shadow-[0_34px_70px_rgba(220,38,38,0.2)]">
              <div className="p-6 sm:p-7 lg:p-8">
                <div className="mb-8 flex items-center justify-between border-b border-red-100 pb-5">
                  <div>
                    <h2 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-800">
                      <div className="p-2 bg-red-600 rounded-xl"><LightBulbIcon className="w-6 h-6 text-white" /></div>
                      Practice Setup
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Configure your casual learning session</p>
                  </div>
                  <button type="button" onClick={() => setShowModeModal(false)} className="rounded-full p-2 transition-all group hover:bg-red-500/10">
                    <XMarkIcon className="w-7 h-7 text-slate-400 group-hover:text-red-500" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Select Parts */}
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">1. Select Passages</span>
                      <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded uppercase">{selectedParts.length} Selected</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {test.sections.map((s, i) => {
                        const isSelected = selectedParts.includes(i);
                        return (
                          <button type="button"
                            key={i}
                            onClick={() => {
                              if (isSelected) {
                                if (selectedParts.length > 1) setSelectedParts(selectedParts.filter(p => p !== i))
                              } else {
                                setSelectedParts([...selectedParts, i].sort())
                              }
                            }}
                            className={`
                              w-full flex items-center justify-between rounded-2xl border-2 p-4 transition-all
                              ${isSelected
                                ? 'bg-red-50 border-red-400 text-red-700 shadow-[0_12px_24px_rgba(220,38,38,0.12)]'
                                : 'bg-white border-red-100 text-slate-600 hover:border-red-300 hover:bg-red-50/40'}
                            `}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {i + 1}
                              </div>
                              <div className="text-left">
                                <div className="font-black text-[15px]">{s.title.split(':')[0]}</div>
                                <div className="text-[11px] opacity-60 font-bold uppercase tracking-wider">{s.questions.length} Questions</div>
                              </div>
                            </div>
                            {isSelected && <CheckIcon className="w-6 h-6" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <span className="mb-5 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">2. Session Duration</span>
                    <div className="relative">
                      <button type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="group flex w-full items-center justify-between rounded-2xl border-2 border-red-100 bg-white p-4 transition-all hover:border-red-300 hover:bg-red-50/40"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-red-500/10 rounded-lg"><ClockIcon className="w-6 h-6 text-red-500" /></div>
                          <div className="text-left">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Current Limit</div>
                            <div className="text-lg font-black text-slate-800">
                              {customTime === -1 ? 'Unlimited Time' : `${customTime} Minutes`}
                            </div>
                          </div>
                        </div>
                        <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-0 right-0 z-[110] mb-3 overflow-hidden rounded-2xl border-2 border-red-100 bg-white shadow-2xl"
                          >
                            <div className="grid grid-cols-3 gap-1 p-2">
                              {[-1, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(t => (
                                <button type="button"
                                  key={t}
                                  onClick={() => { setCustomTime(t); setIsDropdownOpen(false); }}
                                  className={`py-3 rounded-xl text-sm font-black transition-all ${customTime === t ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:bg-red-50'}`}
                                >
                                  {t === -1 ? 'inf' : `${t}m`}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <button type="button"
                    onClick={() => handleStartTest()}
                    className="flex w-full items-center justify-center gap-3 rounded-3xl border border-red-700/20 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 py-5 text-lg font-black text-white shadow-2xl shadow-red-500/30 transition-all hover:scale-[1.01] hover:from-red-500 hover:via-rose-500 hover:to-red-400 active:scale-[0.98]"
                  >
                    Start Training Session
                    <CheckIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOptionsModal && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
              onClick={() => setShowOptionsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-red-100 bg-[linear-gradient(160deg,#fff_0%,#fff8f8_52%,#fffaf8_100%)] shadow-[0_30px_70px_rgba(220,38,38,0.22)]"
            >
              <div className="flex items-center justify-between border-b border-red-100 bg-white/90 px-5 py-4">
                <div className="flex items-center gap-3">
                  {optionsPage !== 'menu' ? (
                    <button
                      type="button"
                      onClick={() => setOptionsPage('menu')}
                      className="rounded-xl border border-red-100 bg-white p-2 text-slate-600 hover:bg-red-50"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                  ) : null}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-red-600">Reading menu</p>
                    <h3 className="text-xl font-black text-slate-900">
                      {optionsPage === 'contrast' ? 'Contrast' : optionsPage === 'text-size' ? 'Text size' : optionsPage === 'font' ? 'Reading font' : 'Display settings'}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOptionsModal(false)}
                  className="rounded-xl border border-red-100 bg-white p-2 text-slate-600 hover:bg-red-50"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
                {optionsPage === 'menu' ? (
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setOptionsPage('contrast')}
                      className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-white px-4 py-4 text-left shadow-[0_12px_24px_rgba(220,38,38,0.08)] hover:border-red-300"
                    >
                      <div>
                        <p className="text-lg font-black text-slate-900">Contrast</p>
                        <p className="mt-1 text-sm text-slate-600">Apply contrast to whole reading workspace.</p>
                      </div>
                      <ChevronDownIcon className="-rotate-90 h-5 w-5 text-slate-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptionsPage('text-size')}
                      className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-white px-4 py-4 text-left shadow-[0_12px_24px_rgba(220,38,38,0.08)] hover:border-red-300"
                    >
                      <div>
                        <p className="text-lg font-black text-slate-900">Text size</p>
                        <p className="mt-1 text-sm text-slate-600">Scale text across passage and questions.</p>
                      </div>
                      <ChevronDownIcon className="-rotate-90 h-5 w-5 text-slate-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptionsPage('font')}
                      className="flex w-full items-center justify-between rounded-2xl border border-red-100 bg-white px-4 py-4 text-left shadow-[0_12px_24px_rgba(220,38,38,0.08)] hover:border-red-300"
                    >
                      <div>
                        <p className="text-lg font-black text-slate-900">Reading font</p>
                        <p className="mt-1 text-sm text-slate-600">Switch the passage between Sans and a book-like Serif.</p>
                      </div>
                      <ChevronDownIcon className="-rotate-90 h-5 w-5 text-slate-500" />
                    </button>
                  </div>
                ) : null}

                {optionsPage === 'contrast' ? (
                  <div className="overflow-hidden rounded-2xl border border-red-100 bg-white">
                    {[
                      { id: 'normal', label: 'Black on white', value: 'normal' as const },
                      { id: 'sepia', label: 'Sepia (warm paper)', value: 'sepia' as const },
                      { id: 'high', label: 'White on black', value: 'high' as const },
                      { id: 'yellow-black', label: 'Yellow on black', value: 'yellow-black' as const },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setContrastMode(item.value)}
                        className="flex w-full items-center justify-between border-b border-red-100 px-4 py-3 text-left last:border-b-0 hover:bg-red-50/40"
                      >
                        <span className="text-base font-semibold text-slate-900">{item.label}</span>
                        {contrastMode === item.value ? <CheckIcon className="h-5 w-5 text-red-600" /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}

                {optionsPage === 'text-size' ? (
                  <div className="overflow-hidden rounded-2xl border border-red-100 bg-white">
                    {[
                      { id: 'regular', label: 'Regular', value: 'regular' as const },
                      { id: 'large', label: 'Large', value: 'large' as const },
                      { id: 'xlarge', label: 'Extra large', value: 'xlarge' as const },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTextSizeMode(item.value)}
                        className="flex w-full items-center justify-between border-b border-red-100 px-4 py-3 text-left last:border-b-0 hover:bg-red-50/40"
                      >
                        <span className="text-base font-semibold text-slate-900">{item.label}</span>
                        {textSizeMode === item.value ? <CheckIcon className="h-5 w-5 text-red-600" /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}

                {optionsPage === 'font' ? (
                  <div className="overflow-hidden rounded-2xl border border-red-100 bg-white">
                    {[
                      { id: 'sans', label: 'Sans (modern)', value: 'sans' as const },
                      { id: 'serif', label: 'Serif (book-like)', value: 'serif' as const },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setReadingFont(item.value)}
                        className={`flex w-full items-center justify-between border-b border-red-100 px-4 py-3 text-left last:border-b-0 hover:bg-red-50/40 ${item.value === 'serif' ? "[font-family:Georgia,'Times_New_Roman',serif]" : ''}`}
                      >
                        <span className="text-base font-semibold text-slate-900">{item.label}</span>
                        {readingFont === item.value ? <CheckIcon className="h-5 w-5 text-red-600" /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {noteComposer.open && (
          <div className="fixed inset-0 z-[117] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
              onClick={closeNoteComposer}
            />
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[26px] border border-red-100 bg-[linear-gradient(165deg,#fff_0%,#fff9f8_55%,#fffdfc_100%)] shadow-[0_30px_70px_rgba(220,38,38,0.22)]"
            >
              <div className="border-b border-red-100 bg-white/90 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-red-600">Reading note</p>
                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  {noteComposer.mode === 'edit' ? 'Edit note' : 'Add note'}
                </h3>
              </div>
              <div className="px-5 py-5">
                {noteComposer.mode === 'create' && noteComposer.selectionPreview ? (
                  <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.1em] text-amber-800">Selected text</p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-950">{noteComposer.selectionPreview}</p>
                  </div>
                ) : null}
                <textarea
                  value={noteComposer.value}
                  onChange={(event) =>
                    setNoteComposer((current) => ({ ...current, value: event.target.value }))
                  }
                  rows={5}
                  autoFocus
                  className="w-full resize-none rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  placeholder="Write your note..."
                />
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  {noteComposer.mode === 'edit'
                    ? 'Optional: you can edit note text or leave it empty and keep only the color mark.'
                    : 'Optional: start typing to attach note text. Empty note still keeps the color mark.'}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-red-100 bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={closeNoteComposer}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNoteComposer}
                  className="rounded-xl border border-red-500 bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white hover:from-red-500 hover:to-rose-500"
                >
                  Save note
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitConfirmModal && (
          <div className="fixed inset-0 z-[118] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowExitConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="relative w-full max-w-lg rounded-2xl border border-red-100 bg-white p-6 text-center shadow-[0_30px_70px_rgba(220,38,38,0.25)]"
            >
              <h3 className="text-3xl font-black text-slate-900">Close this test?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Your current test session will be closed. Do you want to continue?
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={proceedExitTest}
                  className="rounded-xl border border-red-500 bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white hover:from-red-500 hover:to-rose-500"
                >
                  Exit test
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {integrityWarning && (
          <div className="fixed inset-0 z-[121] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
              onClick={() => setIntegrityWarning(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-red-100 bg-[linear-gradient(160deg,#fff_0%,#fff8f8_52%,#fffaf8_100%)] p-7 text-center shadow-[0_38px_86px_rgba(220,38,38,0.28)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400" />
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-200/45 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-4 h-44 w-44 rounded-full bg-orange-200/30 blur-3xl" />
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-white shadow-[0_14px_30px_rgba(220,38,38,0.2)]">
                <ClockIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="relative mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Leaderboard integrity check
              </h3>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                This {integrityWarning.attemptKind === 'full-test' ? 'full test' : 'passage'} was submitted in{' '}
                <strong className="text-slate-900">{formatShortDuration(integrityWarning.actualTimeSec)}</strong>.
                To protect fair rankings, you need at least{' '}
                <strong className="text-slate-900">{Math.round(integrityWarning.minTimeSec / 60)} minutes</strong>
                {' '}before submitting for leaderboard points.
              </p>
              <div className="relative mt-5 rounded-2xl border border-red-100 bg-white/85 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">Fair-play notice</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Want the score only? Press <strong className="text-slate-900">Check score</strong> to see your result now
                  without adding leaderboard points.
                </p>
              </div>
              <div className="relative mt-5 flex flex-col-reverse items-stretch justify-center gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIntegrityWarning(null)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Continue working
                </button>
                <button
                  type="button"
                  onClick={submitWithoutLeaderboardPoints}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(220,38,38,0.32)] transition hover:brightness-105"
                >
                  Check score
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubmitConfirmModal && (
          <div className="fixed inset-0 z-[118] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowSubmitConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="relative w-full max-w-lg rounded-2xl border border-red-100 bg-white p-6 text-center shadow-[0_30px_70px_rgba(220,38,38,0.25)]"
            >
              <h3 className="text-3xl font-black text-slate-900">Submit this test?</h3>
              <p className="mt-2 text-sm text-slate-600">
                After submitting, your result will be generated and the test session will end.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSubmitTest}
                  className="rounded-xl border border-red-500 bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-bold text-white hover:from-red-500 hover:to-rose-500"
                >
                  Submit test
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubmitLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[119] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="w-full max-w-md rounded-[28px] border border-red-100 bg-[linear-gradient(160deg,#fff_0%,#fff8f8_52%,#fffaf8_100%)] p-8 text-center shadow-[0_38px_80px_rgba(220,38,38,0.28)]"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-white shadow-[0_12px_28px_rgba(220,38,38,0.22)]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="h-10 w-10 rounded-full border-4 border-red-100 border-t-red-500"
                />
              </div>
              <p className="text-3xl font-black text-slate-900">Your results are almost here</p>
              <p className="mt-2 text-sm text-slate-600">Finalizing score report and review insights...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
