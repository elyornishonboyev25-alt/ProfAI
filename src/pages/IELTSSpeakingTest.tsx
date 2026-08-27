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
import { analyzeSpeakingResponse, type SpeakingResponseAnalysis } from '@/services/speakingAI'
import ExaminerSession from '@/components/speaking/ExaminerSession'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useSpeakingStore } from '@/store/speakingStore'
import { useBadgeStore } from '@/store/badgeStore'
import TestLaunchOverlay from '@/components/common/TestLaunchOverlay'
import { markFullMockSectionComplete } from '@/utils/ieltsMockCatalog'
import { saveSpeakingSession } from '@/lib/speakingApi'

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
        <button onClick={() => navigate('/ielts/speaking/tests')} className="premium-back-btn mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Speaking Tests
        </button>
        <p className="text-sm text-slate-600">Speaking test not found.</p>
      </div>
    )
  } else if (mode.kind === 'mock') {
    content = (
      <FullMockRunner
        mock={mode.mock}
        onExit={() => navigate('/ielts/speaking/tests')}
        onSaved={(analysis) => {
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
          })
          if (user) {
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
          // Full mock → award a Speaking band badge (with celebration). Daily
          // practice in DayRunner intentionally does not award badges.
          awardBadge({
            userId: user?.id ?? null,
            track: 'IELTS_SPEAKING',
            band: analysis.overallBand,
            mode: 'full_mock',
            source: 'ielts-speaking-mock',
          })
          // When launched from a Full Mock, mark the Speaking section done only
          // now — i.e. once the examiner grade is in.
          if (mockContext?.id) {
            markFullMockSectionComplete(mockContext.id, 'speaking')
          }
        }}
      />
    )
  } else {
    content = (
      <DayRunner
        day={mode.day}
        onExit={() => navigate('/ielts/speaking/tests')}
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
  const [typingMode, setTypingMode] = useState(!recognition.supported)
  const [draft, setDraft] = useState('')
  const [prepLeft, setPrepLeft] = useState(0)
  const [speakLeft, setSpeakLeft] = useState(0)

  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)
  const recordStartRef = useRef(0)
  const latestTranscriptRef = useRef('')

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

  const updateAnswer = useCallback((patch: Partial<AnswerState>) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }, [index])

  // Audio capture (MediaRecorder) — saves a playback URL on stop.
  const startRecording = useCallback(async () => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setTypingMode(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        updateAnswer({ audioUrl: url })
        stream.getTracks().forEach((t) => t.stop())
        audioStreamRef.current = null
      }
      recorder.start()
      audioRecorderRef.current = recorder

      recognition.reset()
      latestTranscriptRef.current = ''
      recordStartRef.current = Date.now()
      setRecording(true)
      recognition.start()
    } catch {
      setTypingMode(true)
    }
  }, [recognition, updateAnswer])

  const stopRecording = useCallback(() => {
    audioRecorderRef.current?.stop()
    audioRecorderRef.current = null
    recognition.stop()
    setRecording(false)
  }, [recognition])

  const submitSpoken = useCallback(async () => {
    const text = latestTranscriptRef.current.trim()
    if (!text) {
      updateAnswer({ error: 'No speech detected — try again or type your answer.' })
      return
    }
    updateAnswer({ spoken: text, loading: true, error: null })
    const result = await analyzeSpeakingResponse({ part: day.part, question: question.prompt, transcript: text })
    updateAnswer({ analysis: result, loading: false })
  }, [day.part, question.prompt, updateAnswer])

  const submitTyped = useCallback(async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    updateAnswer({ spoken: text, loading: true, error: null })
    const result = await analyzeSpeakingResponse({ part: day.part, question: question.prompt, transcript: text })
    updateAnswer({ analysis: result, loading: false })
  }, [draft, day.part, question.prompt, updateAnswer])

  const reAnalyse = useCallback(async () => {
    if (!answer.spoken) return
    updateAnswer({ loading: true, analysis: null })
    const result = await analyzeSpeakingResponse({ part: day.part, question: question.prompt, transcript: answer.spoken })
    updateAnswer({ analysis: result, loading: false })
  }, [answer.spoken, day.part, question.prompt, updateAnswer])

  // Cleanup audio URL when leaving a card.
  useEffect(() => {
    return () => {
      audioStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const goNext = useCallback(() => setIndex((i) => Math.min(items.length - 1, i + 1)), [items.length])
  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const canComplete = answers.every((item) => Boolean(item.analysis))

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button onClick={onExit} className="premium-back-btn">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to roadmap
        </button>
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
          {day.title} · {day.subtitle}
        </span>
      </div>

      {/* Question pager */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
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
          <button onClick={goPrev} disabled={index === 0} className="rounded-xl border border-rose-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goNext} disabled={index === items.length - 1} className="rounded-xl border border-rose-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 disabled:opacity-40">
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
              onChange={(e) => setDraft(e.target.value)}
              className="input min-h-[100px] w-full resize-y"
              placeholder="Type a full, developed answer here..."
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={submitTyped} disabled={!draft.trim() || answer.loading} className="arena-primary-btn justify-center disabled:opacity-50">
                <Send className="mr-2 h-4 w-4" /> Submit for AI feedback
              </button>
              {recognition.supported ? (
                <button onClick={() => setTypingMode(false)} className="text-xs font-medium text-slate-500 hover:text-rose-600">
                  <Mic className="mr-1 inline h-3 w-3" /> Use microphone instead
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {!recording ? (
              <button onClick={() => void startRecording()} className="arena-primary-btn cta-sheen px-6 py-3">
                <Mic className="mr-2 h-5 w-5" /> Record answer
              </button>
            ) : (
              <button onClick={stopRecording} className="arena-primary-btn bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-3">
                <Square className="mr-2 h-4 w-4 fill-white" /> Stop & save
              </button>
            )}

            {!recording && (recognition.finalTranscript || answer.spoken) ? (
              <button onClick={submitSpoken} disabled={answer.loading} className="arena-secondary-btn text-sm disabled:opacity-50">
                <Send className="mr-1.5 h-4 w-4" /> Send for AI analysis
              </button>
            ) : null}

            <button onClick={() => setTypingMode(true)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600">
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
        <button onClick={goPrev} disabled={index === 0} className="arena-secondary-btn disabled:opacity-50">
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </button>
        {index < items.length - 1 ? (
          <button onClick={goNext} className="arena-primary-btn">
            Next question <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        ) : (
          <button
            disabled={!canComplete}
            onClick={() => { onComplete(); onExit() }}
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
}: {
  mock: SpeakingFullMockEntry
  onExit: () => void
  onSaved: (analysis: import('@/services/speakingAI').SpeakingEvaluation) => void
}) {
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
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <ExaminerSession
        config={{ mode: 'full_mock', mockSeed: seed }}
        modeLabel={mock.title}
        onExit={onExit}
        onSaved={onSaved}
      />
    </div>
  )
}
