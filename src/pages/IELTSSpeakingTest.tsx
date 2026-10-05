import UiText from '@/components/common/UiText'
import TestVocabulary from '@/components/vocab/TestVocabulary'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Eye,
  Lightbulb,
  Loader2,
  Mic,
  Pencil,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Timer,
  TriangleAlert,
} from 'lucide-react'
import {
  findIeltsSpeakingDay,
  findIeltsSpeakingFullMock,
  markSpeakingTestCompleted,
  type SpeakingDayEntry,
  type SpeakingFullMockEntry,
} from '@/utils/ieltsSpeakingCatalog'
import { useSpeechRecognition } from '@/lib/speech'
import { AnswerRecording, canRecordAudio, canRecognizeWhileRecording, microphoneError, requestSpeakingMicrophone } from '@/lib/speakingMedia'
import { transcribeAnswer } from '@/lib/speakingAudio'
import { analyzeSpeakingResponse, type SpeakingResponseAnalysis } from '@/services/speakingAI'
import ExaminerSession from '@/components/speaking/ExaminerSession'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useSpeakingStore } from '@/store/speakingStore'
import { useBadgeStore } from '@/store/badgeStore'
import TestLaunchOverlay from '@/components/common/TestLaunchOverlay'
import { saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'
import { saveSpeakingSession } from '@/lib/speakingApi'
import { learningCenterApi } from '@/features/learningCenter/api'

// Single test runner. There are 3 launch modes (Part 1, Part 2 cue card, Part 3)
// for the daily roadmap, and a 4th "full mock" that delegates to the live
// AI examiner session. The daily modes share the same flow: question → record /
// type → AI analyses the response (grammar issues, corrected version, Band 8+
// model rewrite) → next question / finish.

type DayMode = { kind: 'day'; day: SpeakingDayEntry }
type MockMode = { kind: 'mock'; mock: SpeakingFullMockEntry }

type Mode = DayMode | MockMode | null

type QuestionItem = {
  prompt: string
  /** Examiner-style sample answer from the curated bank (hidden until revealed). */
  sample?: string
}

type AnswerState = {
  question: QuestionItem
  spoken: string
  audioUrl: string | null
  analysis: SpeakingResponseAnalysis | null
  loading: boolean
  error: string | null
  revealedSample: boolean
}

function blankAnswer(question: QuestionItem): AnswerState {
  return {
    question,
    spoken: '',
    audioUrl: null,
    analysis: null,
    loading: false,
    error: null,
    revealedSample: false,
  }
}

function questionsForDay(day: SpeakingDayEntry): QuestionItem[] {
  if (day.content.kind === 'part1') {
    return day.content.topic.questions.map((qa) => ({ prompt: qa.q, sample: qa.sample }))
  }
  if (day.content.kind === 'part2') {
    const c = day.content.card
    return [
      {
        prompt: `${c.title}. You should say: ${c.bullets.join('; ')}.`,
        sample: c.sample,
      },
    ]
  }
  return day.content.theme.questions.map((qa) => ({ prompt: qa.q, sample: qa.sample }))
}

export default function IELTSSpeakingTest() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const mockContext = (location.state as { mock?: { id: string; section: string } } | null)?.mock
  const mockFrom = (location.state as { from?: string } | null)?.from
  const exitTest = () => {
    if (mockContext?.id) {
      navigate(`/mock/ielts/${mockContext.id}`, { state: { from: mockFrom } })
      return
    }
    navigate('/ielts/speaking/tests', { state: location.state })
  }
  const user = useAuthStore((state: AuthState) => state.user)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const addSession = useSpeakingStore((s) => s.addSession)
  const awardBadge = useBadgeStore((s) => s.awardIfEligible)

  const mode = useMemo<Mode>(() => {
    if (!id) return null
    const day = findIeltsSpeakingDay(id)
    if (day) return { kind: 'day', day }
    const mock = findIeltsSpeakingFullMock(id)
    if (mock) return { kind: 'mock', mock }
    return null
  }, [id])

  // Brief "your test will begin shortly" loader when entering a Speaking test.
  const [booting, setBooting] = useState(true)
  useEffect(() => {
    if (!mode) {
      setBooting(false)
      return
    }
    const t = setTimeout(() => setBooting(false), 1900)
    return () => clearTimeout(t)
  }, [mode])

  let content: ReactNode
  if (!mode) {
    content = (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <button onClick={exitTest} className="premium-back-btn mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Speaking Tests
        </button>
        <p className="text-sm text-slate-600">Speaking test not found.</p>
      </div>
    )
  } else if (mode.kind === 'mock') {
    content = (
      <FullMockRunner
        mock={mode.mock}
        landingReady={!booting}
        inFullMock={Boolean(mockContext?.id)}
        onExit={exitTest}
        onSaved={(analysis, transcript, launchMode) => {
          markSpeakingTestCompleted(mode.mock.id, user?.id)
          const localSession = addSession({
            userId: user?.id ?? null,
            modeLabel: mode.mock.title,
            kind: 'examiner',
            overallBand: analysis.overallBand,
            fluencyBand: analysis.fluencyBand,
            lexicalBand: analysis.lexicalBand,
            grammarBand: analysis.grammarBand,
            pronunciationBand: analysis.pronunciationBand,
            durationSec: analysis.stats.durationSec,
            wordCount: analysis.stats.wordCount,
            fillerCount: analysis.stats.fillerCount,
            summary: analysis.summary,
            evaluation: analysis,
            transcript,
          })
          if (user) {
            void learningCenterApi.syncResult({
              sourceKey: `speaking-${localSession.id}`,
              sourceType: 'IELTS_SPEAKING_MOCK',
              examType: 'IELTS',
              skill: 'IELTS_SPEAKING',
              title: mode.mock.title,
              score: analysis.overallBand,
              maxScore: 9,
              durationSec: Math.round(analysis.stats.durationSec),
              completedAt: new Date().toISOString(),
              assignmentId: new URLSearchParams(location.search).get('assignmentId') ?? undefined,
              breakdown: {
                fluency: analysis.fluencyBand,
                lexical: analysis.lexicalBand,
                grammar: analysis.grammarBand,
                pronunciation: analysis.pronunciationBand,
                wordCount: analysis.stats.wordCount,
              },
            }).catch(() => {})
            void saveSpeakingSession({
              eventKey: localSession.id,
              mode: 'full_mock',
              modeLabel: mode.mock.title,
              overallBand: analysis.overallBand,
              fluencyBand: analysis.fluencyBand,
              lexicalBand: analysis.lexicalBand,
              grammarBand: analysis.grammarBand,
              pronunciationBand: analysis.pronunciationBand,
              durationSec: analysis.stats.durationSec,
              wordCount: analysis.stats.wordCount,
            }, user.id).then((reward) => {
              if (reward) updateUserProgress({ xp: reward.totalXp, level: reward.level })
            })
          }
          // Simulation awards a Speaking band badge. Practice does not.
          if (launchMode === 'simulation') awardBadge({
            userId: user?.id ?? null,
            track: 'IELTS_SPEAKING',
            band: analysis.overallBand,
            mode: 'full_mock',
            source: 'ielts-speaking-mock',
          })
          // When launched from a Full Mock, mark the Speaking section done only
          // now — i.e. once the examiner grade is in.
          if (mockContext?.id) {
            saveFullMockSectionResult(mockContext.id, 'speaking', {
              band: analysis.overallBand,
              summary: analysis.summary,
              review: transcript.map((turn) => ({
                label: turn.role === 'candidate' ? 'Your answer' : 'Examiner',
                response: turn.text,
              })),
              testId: mode.mock.id,
              completedAt: new Date().toISOString(),
            })
            navigate(`/mock/ielts/${mockContext.id}`, { replace: true, state: { from: mockFrom } })
          }
        }}
      />
    )
  } else {
    content = (
      <DayRunner
        day={mode.day}
        onExit={exitTest}
        onComplete={() => markSpeakingTestCompleted(mode.day.id, user?.id)}
      />
    )
  }

  return (
    <>
      <AnimatePresence>
        {booting && mode ? (
          <TestLaunchOverlay title="Your test will begin shortly" subtitle="Preparing your Speaking test" />
        ) : null}
      </AnimatePresence>
      {content}
    </>
  )
}

// ── Day runner (one Part with N questions; AI analysis per question) ────────
function DayRunner({ day, onExit, onComplete }: { day: SpeakingDayEntry; onExit: () => void; onComplete: () => void }) {
  const recognition = useSpeechRecognition('en-US')

  const items = useMemo(() => questionsForDay(day), [day])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerState[]>(() => items.map(blankAnswer))
  const [recording, setRecording] = useState(false)
  const [stoppingRecording, setStoppingRecording] = useState(false)
  const [typingMode, setTypingMode] = useState(!canRecordAudio())
  const [drafts, setDrafts] = useState<string[]>(() => items.map(() => ''))
  const [prepLeft, setPrepLeft] = useState(0)
  const [speakLeft, setSpeakLeft] = useState(0)
  const [finished, setFinished] = useState(false)

  const audioRecorderRef = useRef<AnswerRecording | null>(null)
  const audioBlobsRef = useRef(new Map<number, Blob>())
  const capturePendingRef = useRef(false)
  const stopPendingRef = useRef(false)
  const disposedRef = useRef(false)
  const processingAbortRef = useRef<AbortController | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const recordStartRef = useRef(0)
  const latestTranscriptRef = useRef('')
  const recordingQuestionRef = useRef(0)
  const audioUrlsRef = useRef<string[]>([])

  useEffect(() => {
    latestTranscriptRef.current = `${recognition.finalTranscript} ${recognition.interimTranscript}`
      .replace(/\s+/g, ' ')
      .trim()
  }, [recognition.finalTranscript, recognition.interimTranscript])

  // Part 2 has a prep + speak window; the others don't.
  const isPart2 = day.part === 2
  useEffect(() => {
    if (!isPart2) return
    setPrepLeft(60)
    setSpeakLeft(120)
  }, [isPart2])
  useEffect(() => {
    if (!isPart2 || prepLeft <= 0) return
    const id = window.setInterval(() => setPrepLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(id)
  }, [isPart2, prepLeft])
  useEffect(() => {
    if (!isPart2 || !recording || speakLeft <= 0) return
    const id = window.setInterval(() => setSpeakLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(id)
  }, [isPart2, recording, speakLeft])

  const answer = answers[index]
  const question = items[index]
  const draft = drafts[index] ?? ''

  const updateAnswer = useCallback((patch: Partial<AnswerState>, questionIndex = index) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[questionIndex] = { ...next[questionIndex], ...patch }
      return next
    })
  }, [index])

  // Audio capture works independently of the browser's speech recognition API.
  const startRecording = useCallback(async () => {
    if (capturePendingRef.current || audioRecorderRef.current || stopPendingRef.current) return
    if (!canRecordAudio()) {
      setTypingMode(true)
      return
    }
    capturePendingRef.current = true
    setStoppingRecording(true)
    try {
      const stream = await requestSpeakingMicrophone()
      if (disposedRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
      audioStreamRef.current = stream
      const recorder = new AnswerRecording(stream)
      const questionIndex = index
      recordingQuestionRef.current = questionIndex
      audioRecorderRef.current = recorder

      recognition.reset()
      latestTranscriptRef.current = ''
      recordStartRef.current = Date.now()
      updateAnswer({ spoken: '', analysis: null, error: null }, questionIndex)
      if (isPart2) setSpeakLeft(120)
      setRecording(true)
      if (recognition.supported && canRecognizeWhileRecording()) recognition.start()
    } catch (error) {
      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null
      updateAnswer({ error: microphoneError(error) })
    } finally { capturePendingRef.current = false; if (!disposedRef.current) setStoppingRecording(false) }
  }, [index, isPart2, recognition, updateAnswer])

  const stopRecording = useCallback(async () => {
    const recorder = audioRecorderRef.current
    if (stopPendingRef.current || !recorder) return
    stopPendingRef.current = true
    setStoppingRecording(true)
    const questionIndex = recordingQuestionRef.current
    setRecording(false)
    try {
      const [blob, browserText] = await Promise.all([recorder.stop(), recognition.stop()])
      audioRecorderRef.current = null
      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null
      if (disposedRef.current) return
      let transcript = browserText
      if (blob.size) {
        audioBlobsRef.current.set(questionIndex, blob)
        const url = URL.createObjectURL(blob)
        audioUrlsRef.current.push(url)
        updateAnswer({ audioUrl: url }, questionIndex)
        const controller = new AbortController()
        processingAbortRef.current = controller
        try { transcript = await transcribeAnswer(blob, controller.signal) || transcript } catch { /* Keep the browser's final words and the audio. */ }
      }
      if (disposedRef.current) return
      latestTranscriptRef.current = transcript
      updateAnswer({ spoken: transcript, error: transcript ? null : 'Your recording is saved. Retry processing below, or record again if no voice is audible.' }, questionIndex)
    } finally { stopPendingRef.current = false; if (!disposedRef.current) setStoppingRecording(false) }
  }, [recognition, updateAnswer])

  const retryTranscription = useCallback(async () => {
    const blob = audioBlobsRef.current.get(index)
    if (!blob || stopPendingRef.current) return
    stopPendingRef.current = true
    setStoppingRecording(true)
    const questionIndex = index
    const controller = new AbortController()
    processingAbortRef.current = controller
    try {
      const text = await transcribeAnswer(blob, controller.signal)
      if (!disposedRef.current) updateAnswer({ spoken: text, error: text ? null : 'No clear words were detected. Listen to your recording and record again.' }, questionIndex)
    } catch {
      if (!disposedRef.current) updateAnswer({ error: 'Processing is unavailable. Your recording is saved; please retry.' }, questionIndex)
    } finally { stopPendingRef.current = false; if (!disposedRef.current) setStoppingRecording(false) }
  }, [index, updateAnswer])

  useEffect(() => {
    if (isPart2 && recording && speakLeft === 0) void stopRecording()
  }, [isPart2, recording, speakLeft, stopRecording])

  const submitSpoken = useCallback(async () => {
    const questionIndex = index
    const text = (answer.spoken || latestTranscriptRef.current).trim()
    if (!text) {
      updateAnswer({ error: 'No speech detected — try again or type your answer.' })
      return
    }
    updateAnswer({ spoken: text, loading: true, error: null }, questionIndex)
    const result = await analyzeSpeakingResponse({ part: day.part, question: question.prompt, transcript: text })
    updateAnswer({ analysis: result, loading: false }, questionIndex)
  }, [answer.spoken, day.part, index, question.prompt, updateAnswer])

  const submitTyped = useCallback(async () => {
    const questionIndex = index
    const text = draft.trim()
    if (!text) return
    setDrafts((current) => current.map((value, position) => position === questionIndex ? '' : value))
    updateAnswer({ spoken: text, loading: true, error: null }, questionIndex)
    const result = await analyzeSpeakingResponse({ part: day.part, question: question.prompt, transcript: text })
    updateAnswer({ analysis: result, loading: false }, questionIndex)
  }, [draft, day.part, index, question.prompt, updateAnswer])

  const reAnalyse = useCallback(async () => {
    const questionIndex = index
    if (!answer.spoken) return
    updateAnswer({ loading: true, analysis: null }, questionIndex)
    const result = await analyzeSpeakingResponse({ part: day.part, question: question.prompt, transcript: answer.spoken })
    updateAnswer({ analysis: result, loading: false }, questionIndex)
  }, [answer.spoken, day.part, index, question.prompt, updateAnswer])

  // Cleanup audio URL when leaving a card.
  useEffect(() => {
    disposedRef.current = false
    return () => {
      disposedRef.current = true
      processingAbortRef.current?.abort()
      void audioRecorderRef.current?.stop()
      audioStreamRef.current?.getTracks().forEach((t) => t.stop())
      audioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const selectQuestion = (nextIndex: number) => {
    if (recording || capturePendingRef.current || stopPendingRef.current) return
    latestTranscriptRef.current = ''
    recognition.reset()
    setIndex(Math.max(0, Math.min(items.length - 1, nextIndex)))
  }
  const goNext = () => selectQuestion(index + 1)
  const goPrev = () => selectQuestion(index - 1)
  const completedCount = answers.filter((item) => item.analysis?.source === 'ai').length
  const canComplete = completedCount === answers.length
  const practiceBand = canComplete
    ? Math.round(answers.reduce((sum, item) => sum + (item.analysis?.estimatedBand ?? 0), 0) / answers.length * 2) / 2
    : 0

  if (finished) {
    return (
      <div className="ielts-speaking-workspace mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="speaking-exam-header justify-between">
          <div><p className="speaking-eyebrow">IELTS Speaking · Practice complete</p><h1 className="mt-1 text-2xl font-black text-slate-900">{day.title}</h1></div>
          <span className="speaking-part-pill">Part {day.part}</span>
        </div>
        <div className="speaking-answer-panel mt-5 p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-3 text-xs font-black uppercase tracking-[0.15em] text-red-600">Average practice band</p>
          <p className="mt-1 text-6xl font-black text-slate-900">{practiceBand.toFixed(1)}</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">Estimated from {answers.length} transcribed responses. Pronunciation needs a human or audio based review for an accurate band.</p>
        </div>
        <div className="mt-5 space-y-4">
          {answers.map((item, questionIndex) => <div key={questionIndex} className="speaking-answer-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="speaking-eyebrow">Question {questionIndex + 1}</p><h2 className="mt-1 font-bold text-slate-900">{item.question.prompt}</h2></div><span className="speaking-part-pill">Band ~{item.analysis?.estimatedBand.toFixed(1)}</span></div>
            <p className="mt-3 border-l-2 border-red-200 pl-3 text-sm leading-6 text-slate-600">{item.spoken}</p>
            {item.analysis?.suggestions.length ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Next step:</strong> {item.analysis.suggestions[0]}</p> : null}
          </div>)}
        </div>
        <button onClick={onExit} className="arena-primary-btn mt-6 px-6 py-3"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Speaking tests</button>
      </div>
    )
  }

  return (
    <div className="ielts-speaking-workspace mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="speaking-exam-header mb-4">
        <button onClick={onExit} disabled={recording || stoppingRecording} className="speaking-icon-button disabled:opacity-50" aria-label="Back to roadmap"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1"><p className="speaking-eyebrow">IELTS Speaking · Part {day.part}</p><h1 className="truncate text-lg font-black text-slate-900">{day.title}</h1><p className="text-xs text-slate-500">{day.subtitle}</p></div>
        <span className="speaking-part-pill">{index + 1} / {items.length}</span>
      </header>

      <div className="mb-5 rounded-2xl border border-red-100 bg-white/90 p-3 shadow-sm" aria-label={`${completedCount} of ${items.length} questions reviewed`}>
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Speaking progress</span>
          <span>{completedCount}/{items.length} feedback ready</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-red-100">
          <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all" style={{ width: `${items.length ? (completedCount / items.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Question pager */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => selectQuestion(i)}
              disabled={recording}
              aria-label={`Question ${i + 1}${answers[i].analysis ? ', feedback ready' : ''}`}
              aria-current={i === index ? 'step' : undefined}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition ${
                i === index
                  ? 'bg-gradient-to-br from-rose-600 to-red-600 text-white'
                  : answers[i].analysis
                    ? 'border border-emerald-300 bg-emerald-100 text-emerald-700'
                    : 'border border-rose-200 bg-white text-slate-600 hover:bg-rose-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goPrev} disabled={index === 0 || recording} aria-label="Previous question" className="rounded-xl border border-rose-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goNext} disabled={index === items.length - 1 || recording} aria-label="Next question" className="rounded-xl border border-rose-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Question card */}
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card p-5"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-rose-600">Question {index + 1} of {items.length}</p>
        <p className="mt-2 text-lg font-bold leading-7 text-slate-900">{question.prompt}</p>

        {isPart2 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-bold text-amber-700">
              <Timer className="h-3.5 w-3.5" /> Prep {prepLeft}s
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-bold text-rose-700">
              <Mic className="h-3.5 w-3.5" /> Speak {speakLeft}s
            </span>
          </div>
        ) : null}

        {/* Sample answer (hidden by default) */}
        {question.sample ? (
          <div className="mt-4">
            <button
              onClick={() => updateAnswer({ revealedSample: !answer.revealedSample })}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
            >
              <Eye className="h-3.5 w-3.5" />
              {answer.revealedSample ? 'Hide sample answer' : 'Show sample answer'}
            </button>
            <AnimatePresence>
              {answer.revealedSample ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3"
                >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Model answer · Band 8</p>
                  <p className="text-sm leading-7 text-slate-700">{question.sample}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </motion.div>

      {/* Recorder / typer */}
      <div className="surface-card mt-4 p-5">
        {typingMode ? (
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">Type your answer:</p>
            <textarea
              value={draft}
              onChange={(e) => setDrafts((current) => current.map((value, position) => position === index ? e.target.value : value))}
              className="input min-h-[100px] w-full resize-y"
              placeholder="Type a full, developed answer here..."
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={submitTyped} disabled={!draft.trim() || answer.loading} className="arena-primary-btn justify-center disabled:opacity-50">
                <Send className="mr-2 h-4 w-4" /> Submit for AI feedback
              </button>
              {canRecordAudio() ? (
                <button onClick={() => setTypingMode(false)} className="text-xs font-medium text-slate-500 hover:text-rose-600">
                  <Mic className="mr-1 inline h-3 w-3" /> Use microphone instead
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {!recording ? (
              <button disabled={stoppingRecording} onClick={() => void startRecording()} className="arena-primary-btn cta-sheen px-6 py-3 disabled:opacity-50">
                <Mic className="mr-2 h-5 w-5" /> Record answer
              </button>
            ) : (
              <button onClick={() => void stopRecording()} disabled={stoppingRecording} className="arena-primary-btn bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-3 disabled:opacity-50">
                <Square className="mr-2 h-4 w-4 fill-white" /> {stoppingRecording ? 'Saving...' : 'Stop & save'}
              </button>
            )}

            {!recording && answer.spoken ? (
              <button onClick={submitSpoken} disabled={answer.loading || stoppingRecording} className="arena-secondary-btn text-sm disabled:opacity-50">
                <Send className="mr-1.5 h-4 w-4" /> Send for AI analysis
              </button>
            ) : null}

            <button onClick={() => setTypingMode(true)} disabled={recording || stoppingRecording} className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 disabled:opacity-50">
              <Pencil className="h-3 w-3" /> Type instead
            </button>
            {recognition.error ? <p className="text-xs text-red-600">{recognition.error}</p> : null}
          </div>
        )}

        {/* Live transcript while recording */}
        {recording ? (
          <div className="mt-3 rounded-2xl border border-dashed border-rose-300 bg-rose-50/70 px-4 py-2.5 text-sm leading-6 text-slate-600">
            {recognition.finalTranscript || '...'} <span className="text-slate-400">{recognition.interimTranscript}</span>
          </div>
        ) : null}

        {/* Recorded audio playback */}
        {answer.audioUrl && !recording ? (
          <div className="mt-3 flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-rose-700">
              <Play className="h-3.5 w-3.5" /> Your recording
            </span>
            <audio controls src={answer.audioUrl} className="h-9 max-w-[260px] flex-1">
              <track kind="captions" />
            </audio>
          </div>
        ) : null}

        {answer.error ? <p className="mt-3 text-sm text-red-600">{answer.error}</p> : null}
        {answer.audioUrl && !answer.spoken && !recording ? <button disabled={stoppingRecording} onClick={() => void retryTranscription()} className="arena-secondary-btn mt-3 disabled:opacity-50">{stoppingRecording ? 'Processing recording…' : 'Retry processing saved answer'}</button> : null}
      </div>

      {/* AI feedback */}
      {answer.loading ? (
        <div className="surface-card mt-4 flex flex-col items-center p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p className="mt-3 text-sm font-bold text-slate-900">AI is analysing your answer…</p>
          <p className="mt-1 text-xs text-slate-500">Grammar errors · corrected version · Band 8+ model</p>
        </div>
      ) : null}

      {answer.analysis ? (
        <AnalysisCard analysis={answer.analysis} onRetry={reAnalyse} />
      ) : null}

      {/* Footer nav */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <button onClick={goPrev} disabled={index === 0 || recording || stoppingRecording} className="arena-secondary-btn disabled:opacity-50">
          <ChevronLeft className="mr-1 h-4 w-4" />  <UiText text={"Previous"} /> </button>
        {index < items.length - 1 ? (
          <button onClick={goNext} disabled={recording || stoppingRecording} className="arena-primary-btn disabled:opacity-50">
            Next question <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        ) : (
          <button
            disabled={!canComplete}
            onClick={() => { onComplete(); setFinished(true) }}
            className="arena-primary-btn disabled:cursor-not-allowed disabled:opacity-50"
            title={canComplete ? 'Finish test' : 'Complete every question first'}
          >
            Finish day <CheckCircle2 className="ml-1 h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Analysis card (per answer) ──────────────────────────────────────────────
function AnalysisCard({ analysis, onRetry }: { analysis: SpeakingResponseAnalysis; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card mt-4 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-lg font-black text-slate-900">
          <Sparkles className="h-5 w-5 text-rose-600" /> AI Feedback
        </h3>
        <div className="flex items-center gap-2">
          {analysis.estimatedBand > 0 ? (
            <span className="rounded-full bg-gradient-to-r from-rose-600 to-red-600 px-3 py-1 text-sm font-black text-white">
              Band ~{analysis.estimatedBand.toFixed(1)}
            </span>
          ) : null}
          <button onClick={onRetry} className="arena-secondary-btn text-xs">
            <RefreshCw className="mr-1 h-3 w-3" /> Re-run
          </button>
        </div>
      </div>

      {analysis.source === 'offline' ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          AI is temporarily unavailable. Try again in a moment for full feedback.
        </p>
      ) : null}

      {/* Corrected version */}
      {analysis.correctedVersion ? (
        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-sky-700">AI corrected version</p>
            <CopyButton text={analysis.correctedVersion} />
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-700">{analysis.correctedVersion}</p>
        </div>
      ) : null}

      {/* Band 8+ template */}
      {analysis.band8Template ? (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
              <Sparkles className="h-3 w-3" /> Band 8+ model answer
            </p>
            <CopyButton text={analysis.band8Template} />
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-700">{analysis.band8Template}</p>
        </div>
      ) : null}

      {/* Issues */}
      {analysis.issues.length > 0 ? (
        <div className="mt-3">
          <p className="inline-flex items-center gap-1 text-sm font-black text-slate-900">
            <TriangleAlert className="h-4 w-4 text-rose-600" /> Mistakes ({analysis.issues.length})
          </p>
          <div className="mt-2 space-y-2">
            {analysis.issues.map((issue, i) => (
              <div key={i} className="rounded-xl border border-rose-100 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                    {issue.category}
                  </span>
                  <span className="text-slate-500 line-through">{issue.original}</span>
                  <span className="text-emerald-700 font-bold">→ {issue.corrected}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{issue.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Strengths + suggestions */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {analysis.strengths.length > 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Strengths</p>
            <ul className="mt-1 space-y-1 text-xs text-slate-700">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> {s}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {analysis.suggestions.length > 0 ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3">
            <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              <Lightbulb className="h-3 w-3" /> Suggestions
            </p>
            <ul className="mt-1 space-y-1 text-xs text-slate-700">
              {analysis.suggestions.map((s, i) => (
                <li key={i}>· {s}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1200)
        })
      }}
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
    >
      <Clipboard className="h-3 w-3" /> {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ── Full mock runner (delegates to live AI examiner session) ────────────────
function FullMockRunner({
  mock,
  onExit,
  onSaved,
  inFullMock = false,
  landingReady = true,
}: {
  mock: SpeakingFullMockEntry
  onExit: () => void
  inFullMock?: boolean
  landingReady?: boolean
  onSaved: (analysis: import('@/services/speakingAI').SpeakingEvaluation, transcript: import('@/services/speakingAI').ExaminerTurn[], launchMode: 'practice' | 'simulation') => void
}) {
  const [launchMode, setLaunchMode] = useState<'practice' | 'simulation' | null>(inFullMock ? 'simulation' : null)
  const { reducedMotion, allowHoverMotion } = useMotionPreferences()
  // Each numbered mock has its own fixed question set (distinct across mocks).
  const seed = {
    part1: mock.parts.part1.questions.map((q) => q.q),
    part2: {
      title: mock.parts.part2.title,
      bullets: mock.parts.part2.bullets,
      followUp: mock.parts.part2.followUp,
    },
    part3: mock.parts.part3.questions.map((q) => q.q),
  }
  if (!launchMode) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 px-4 py-10 sm:px-6">
        <div className="w-full max-w-5xl">
          <motion.header initial={reducedMotion ? false : { opacity: 0, y: -8 }} animate={landingReady ? { opacity: 1, y: 0 } : reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.4 }} className="mb-10 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-600">IELTS Speaking</p>
            <h1 className="mt-3 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">{mock.title}</h1>
            <p className="mt-4 text-sm text-slate-600"><UiText text="Practise with purpose. Simulate with confidence." /></p>
          </motion.header>
          <TestVocabulary testId={mock.id} variant="reminder" ready={landingReady} />
          <div className="grid gap-6 md:grid-cols-2">
            {(['practice', 'simulation'] as const).map((mode) => (
              <motion.section key={mode} initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={landingReady ? { opacity: 1, y: 0 } : reducedMotion ? undefined : { opacity: 0, y: 18 }} transition={{ duration: 0.45, delay: mode === 'practice' ? 0.05 : 0.12 }} whileHover={allowHoverMotion ? { y: -4 } : undefined} className={`flex flex-col rounded-3xl border p-6 shadow-[0_24px_55px_-36px_rgba(239,68,68,0.45)] sm:p-9 ${mode === 'practice' ? 'border-red-100 bg-white' : 'border-red-200 bg-rose-50/70'}`}>
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 text-white">{mode === 'practice' ? <Lightbulb className="h-7 w-7" /> : <Mic className="h-7 w-7" />}</span>
                <h2 className="text-2xl font-bold text-slate-900"><UiText text={mode === 'practice' ? 'Practice Mode' : 'Simulation Mode'} /></h2>
                <p className="mb-7 mt-3 flex-1 text-sm leading-6 text-slate-600"><UiText text={mode === 'practice' ? 'Prepare with this test’s vocabulary, then practise all three parts with the AI examiner.' : 'Complete all three parts with the AI examiner. Explore this test’s vocabulary in your review after finishing.'} /></p>
                <button type="button" onClick={() => setLaunchMode(mode)} className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"><UiText text={mode === 'practice' ? 'Start Practice' : 'Launch Final Simulation'} /></button>
                {mode === 'practice' ? <TestVocabulary testId={mock.id} variant="link" ready={landingReady} /> : null}
              </motion.section>
            ))}
          </div>
          <button type="button" onClick={onExit} className="premium-back-btn mx-auto mt-8"><ArrowLeft className="h-4 w-4" /><UiText text="Back to Speaking Tests" /></button>
        </div>
      </div>
    )
  }
  return (
    <div className="ielts-speaking-workspace ielts-speaking-live-workspace py-4">
      <ExaminerSession
        config={{ mode: 'full_mock', mockSeed: seed }}
        modeLabel={mock.title}
        onExit={onExit}
        onSaved={(analysis, transcript) => onSaved(analysis, transcript, launchMode)}
        hideVocabularyReview={inFullMock}
      />
    </div>
  )
}
