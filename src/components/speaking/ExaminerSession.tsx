import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Mic, Pencil, Send, SkipForward, Square, Volume2 } from 'lucide-react'
import {
  CUE_CARDS,
  INTERVIEW_PACKS,
  PART1_TOPICS,
  PART3_THEMES,
  PART_LABELS,
  pickRandom,
  type CueCard,
  type ExaminerMode,
  type InterviewKind,
} from '@/data/speakingQuestions'
import {
  evaluateSpeaking,
  getExaminerReply,
  type ExaminerTurn,
  type SpeakingEvaluation,
} from '@/services/speakingAI'
import { analyseTranscript, mergeStats, type SpeechStats } from '@/lib/speakingScoring'
import { cancelSpeech, getExaminerVoice, speak, useSpeechRecognition } from '@/lib/speech'
import MicVisualizer from './MicVisualizer'
import SpeakingResult from './SpeakingResult'

export type SessionConfig = {
  mode: ExaminerMode
  interviewKind?: InterviewKind
  /** Free Talk topic (only used when mode === 'free_talk'). */
  topic?: string
  /**
   * Fixed question set for a numbered full mock (so Mock 1, Mock 2… each have their
   * own distinct, stable questions instead of a random draw). When omitted, the
   * full mock picks questions at random.
   */
  mockSeed?: {
    part1: string[]
    part2: { title: string; bullets: string[]; followUp: string }
    part3: string[]
  }
}

type ChatTurn = { id: string; role: 'examiner' | 'candidate'; text: string }

type Move =
  | { type: 'seed'; text: string }
  | { type: 'followup' }
  | { type: 'cuecard'; card: CueCard }
  | { type: 'closing'; text: string }

type Stage = {
  part: 0 | 1 | 2 | 3
  label: string
  persona?: string
  intro?: string
  /** Friendly chat style instead of strict examiner style. */
  conversational?: boolean
  moves: Move[]
}

type Phase = 'idle' | 'examiner_speaking' | 'awaiting_answer' | 'preparing' | 'thinking' | 'evaluating' | 'result'

function uniqueQuestionMoves(questions: readonly string[]): Move[] {
  const seen = new Set<string>()
  const unique = questions.filter((question) => {
    const key = question.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  const moves: Move[] = []
  if (unique[0]) moves.push({ type: 'seed', text: unique[0] }, { type: 'followup' })
  if (unique[1]) moves.push({ type: 'seed', text: unique[1] })
  if (unique[2]) moves.push({ type: 'seed', text: unique[2] }, { type: 'followup' })
  return moves
}

function buildStages(config: SessionConfig): Stage[] {
  const part1StageFrom = (questions: string[]): Stage => ({
    part: 1,
    label: PART_LABELS[1],
    intro: 'Let’s begin with some questions about you.',
    moves: uniqueQuestionMoves(questions),
  })
  const part2StageFrom = (card: CueCard): Stage => ({
    part: 2,
    label: PART_LABELS[2],
    intro: 'Now I’m going to give you a topic, and I’d like you to talk about it for one to two minutes.',
    moves: [
      { type: 'cuecard', card },
      { type: 'seed', text: card.followUp },
    ],
  })
  const part3StageFrom = (questions: string[]): Stage => ({
    part: 3,
    label: PART_LABELS[3],
    intro: `We’ve been talking about ${pickRandom(PART2_THEME_WORDS)}. I’d like to discuss some broader questions.`,
    moves: uniqueQuestionMoves(questions),
  })

  const part1Stage = (): Stage => part1StageFrom(pickRandom(PART1_TOPICS).questions)
  const part2Stage = (): Stage => part2StageFrom(pickRandom(CUE_CARDS))
  const part3Stage = (): Stage => part3StageFrom(pickRandom(PART3_THEMES).questions)

  switch (config.mode) {
    case 'part1':
      return [part1Stage()]
    case 'part2':
      return [part2Stage()]
    case 'part3':
      return [part3Stage()]
    case 'full_mock': {
      // A numbered mock supplies a fixed seed so each mock has its own distinct,
      // stable questions; otherwise (e.g. AI Coach) draw a fresh random mock.
      if (config.mockSeed) {
        const seed = config.mockSeed
        return [
          part1StageFrom(seed.part1),
          part2StageFrom({ id: 'mock-cue', theme: 'mock', ...seed.part2 }),
          part3StageFrom(seed.part3),
        ]
      }
      return [part1Stage(), part2Stage(), part3Stage()]
    }
    case 'interview': {
      const pack = INTERVIEW_PACKS.find((p) => p.id === config.interviewKind) ?? INTERVIEW_PACKS[0]
      return [
        {
          part: 0,
          label: pack.title,
          persona: pack.persona,
          intro: undefined,
          moves: [
            { type: 'seed', text: pack.openers[0] },
            { type: 'followup' },
            { type: 'seed', text: pack.openers[1] },
            { type: 'followup' },
            { type: 'followup' },
          ],
        },
      ]
    }
    case 'free_talk': {
      const topic = (config.topic ?? '').trim()
      const opener = topic
        ? `I’d love to chat about ${topic}. To start, what first got you interested in it?`
        : 'Let’s just have a relaxed conversation in English. What’s something interesting that’s happened to you recently?'
      return [
        {
          part: 0,
          label: 'Free Talk',
          persona: 'a warm, curious and encouraging English-speaking friend having a casual conversation',
          conversational: true,
          moves: [
            { type: 'seed', text: opener },
            { type: 'followup' },
            { type: 'followup' },
            { type: 'followup' },
            { type: 'followup' },
            { type: 'followup' },
            { type: 'followup' },
          ],
        },
      ]
    }
    default:
      return [part1Stage()]
  }
}

const PART2_THEME_WORDS = ['that experience', 'that topic', 'the subject you described']

const GREETINGS = [
  'Hello, and welcome. My name is Alex, and I’ll be your speaking examiner today. Are you ready to begin?',
  'Good to see you. I’m Alex, your examiner for today’s speaking practice. Let’s get started.',
]

const FRIENDLY_GREETINGS = [
  'Hey, great to chat with you! I’m Alex. Let’s just talk in English for a bit — relax and speak freely.',
  'Hi there! I’m Alex, your conversation partner. There’s no exam here — let’s just have a friendly chat.',
]

export default function ExaminerSession({
  config,
  modeLabel,
  onExit,
  onSaved,
}: {
  config: SessionConfig
  modeLabel: string
  onExit: () => void
  onSaved: (evaluation: SpeakingEvaluation) => void
}) {
  const recognition = useSpeechRecognition('en-US')

  const [phase, setPhase] = useState<Phase>('idle')
  const [started, setStarted] = useState(false)
  const [chat, setChat] = useState<ChatTurn[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [activePart, setActivePart] = useState<0 | 1 | 2 | 3>(1)
  const [cueCard, setCueCard] = useState<CueCard | null>(null)
  const [prepLeft, setPrepLeft] = useState(0)
  const [speakLeft, setSpeakLeft] = useState(0)
  const [recording, setRecording] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [typingMode, setTypingMode] = useState(false)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [examinerLabel, setExaminerLabel] = useState('Examiner')

  const stagesRef = useRef<Stage[]>([])
  const stageIdxRef = useRef(0)
  const moveIdxRef = useRef(0)
  const answersRef = useRef<SpeechStats[]>([])
  const historyRef = useRef<ExaminerTurn[]>([])
  const recordStartRef = useRef(0)
  const latestTranscriptRef = useRef('')
  const onSpeechEndRef = useRef<(() => void) | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Mirror the live transcript into a ref so we read the freshest value on stop.
  useEffect(() => {
    latestTranscriptRef.current = `${recognition.finalTranscript} ${recognition.interimTranscript}`
      .replace(/\s+/g, ' ')
      .trim()
  }, [recognition.finalTranscript, recognition.interimTranscript])

  // Acquire a mic stream once for the live visualizer (recognition manages its own).
  useEffect(() => {
    let cancelled = false
    let localStream: MediaStream | null = null
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          localStream = stream
          setMicStream(stream)
        })
        .catch(() => {
          if (!cancelled) setTypingMode(true)
        })
    } else {
      setTypingMode(true)
    }
    return () => {
      cancelled = true
      localStream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // Auto-scroll the transcript on new turns.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat, phase])

  // Cleanup speech on unmount.
  useEffect(() => () => cancelSpeech(), [])

  const pushTurn = useCallback((role: 'examiner' | 'candidate', text: string) => {
    setChat((prev) => [...prev, { id: `${role}-${Date.now()}-${prev.length}`, role, text }])
    historyRef.current = [...historyRef.current, { role, text }]
  }, [])

  // Speak an examiner line and reveal its bubble IN SYNC with the voice (onStart),
  // so text and audio appear together rather than text-first. A short safety timer
  // reveals it anyway if onStart is slow or TTS is unavailable.
  const speakExaminer = useCallback(
    (text: string, next: () => void) => {
      setPhase('examiner_speaking')
      setCurrentPrompt(text)
      onSpeechEndRef.current = next
      let shown = false
      const reveal = () => {
        if (shown) return
        shown = true
        pushTurn('examiner', text)
      }
      speak(text, {
        // Examiner prompts are always English. Do not auto-detect here: words such
        // as "test" also occur in Uzbek and could select a non-English TTS voice.
        lang: 'en',
        voice: getExaminerVoice(),
        rate: 0.98,
        onStart: reveal,
        onEnd: () => {
          reveal()
          if (onSpeechEndRef.current === next) onSpeechEndRef.current = null
          next()
        },
      })
      window.setTimeout(reveal, 350)
    },
    [pushTurn],
  )

  const runEvaluation = useCallback(async () => {
    setPhase('evaluating')
    cancelSpeech()
    const stats = mergeStats(answersRef.current.length ? answersRef.current : [analyseTranscript('', 0)])
    try {
      const result = await evaluateSpeaking({ modeLabel, history: historyRef.current, stats })
      setEvaluation(result)
      setPhase('result')
      onSaved(result)
    } catch {
      setEvalError('Could not complete the evaluation. Please try again.')
      setPhase('result')
    }
  }, [modeLabel, onSaved])

  // Core engine: process the next move, advancing across stages.
  const advance = useCallback(() => {
    const stages = stagesRef.current
    let stageIdx = stageIdxRef.current
    let moveIdx = moveIdxRef.current

    // Move past finished stages.
    while (stageIdx < stages.length && moveIdx >= stages[stageIdx].moves.length) {
      stageIdx += 1
      moveIdx = 0
      stageIdxRef.current = stageIdx
      moveIdxRef.current = 0
      if (stageIdx < stages.length) {
        const stage = stages[stageIdx]
        setActivePart(stage.part)
        if (stage.intro) {
          speakExaminer(stage.intro, () => advance())
          return
        }
      }
    }

    if (stageIdx >= stages.length) {
      void runEvaluation()
      return
    }

    const stage = stages[stageIdx]
    const move = stage.moves[moveIdx]
    setActivePart(stage.part)

    if (move.type === 'seed') {
      speakExaminer(move.text, () => setPhase('awaiting_answer'))
    } else if (move.type === 'closing') {
      speakExaminer(move.text, () => {
        moveIdxRef.current += 1
        advance()
      })
    } else if (move.type === 'followup') {
      setPhase('thinking')
      void getExaminerReply({
        part: stage.part,
        persona: stage.persona,
        history: historyRef.current,
        directive: 'follow_up',
        style: stage.conversational ? 'friend' : 'examiner',
      }).then((reply) => {
        speakExaminer(reply, () => setPhase('awaiting_answer'))
      })
    } else if (move.type === 'cuecard') {
      setCueCard(move.card)
      setActivePart(2)
      const cardText = `${move.card.title}. You should say: ${move.card.bullets.join('; ')}. You have one minute to prepare.`
      speakExaminer(cardText, () => {
        setPhase('preparing')
        setPrepLeft(60)
      })
    }
  }, [runEvaluation, speakExaminer])

  // Part 2 preparation countdown → then start the 2-minute long turn.
  useEffect(() => {
    if (phase !== 'preparing') return
    if (prepLeft <= 0) {
      setPhase('awaiting_answer')
      setSpeakLeft(120)
      return
    }
    const id = window.setInterval(() => setPrepLeft((v) => v - 1), 1000)
    return () => window.clearInterval(id)
  }, [phase, prepLeft])

  // Long-turn speaking countdown (auto-submits at 0 while recording).
  useEffect(() => {
    if (phase !== 'awaiting_answer' || cueCard === null || speakLeft <= 0) return
    if (!recording) return
    const id = window.setInterval(() => setSpeakLeft((v) => v - 1), 1000)
    return () => window.clearInterval(id)
  }, [phase, cueCard, speakLeft, recording])

  useEffect(() => {
    if (cueCard && recording && speakLeft === 0) {
      handleStopRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakLeft, recording, cueCard])

  const beginSession = useCallback(() => {
    setStarted(true)
    stagesRef.current = buildStages(config)
    stageIdxRef.current = 0
    moveIdxRef.current = 0
    const firstStage = stagesRef.current[0]
    setActivePart(firstStage?.part ?? 1)
    setExaminerLabel(firstStage?.conversational ? 'Alex' : 'Examiner')
    const greeting = firstStage?.conversational ? pickRandom(FRIENDLY_GREETINGS) : pickRandom(GREETINGS)
    speakExaminer(greeting, () => {
      if (firstStage?.intro) {
        speakExaminer(firstStage.intro, () => advance())
      } else {
        advance()
      }
    })
  }, [config, advance, speakExaminer])

  const startRecording = useCallback(() => {
    setEvalError(null)
    recognition.reset()
    latestTranscriptRef.current = ''
    recordStartRef.current = Date.now()
    setRecording(true)
    recognition.start()
  }, [recognition])

  const handleStopRecording = useCallback(() => {
    recognition.stop()
    setRecording(false)
    const duration = Math.max(2, (Date.now() - recordStartRef.current) / 1000)
    window.setTimeout(() => {
      const text = latestTranscriptRef.current.trim()
      submitAnswer(text || '(no clear speech detected)', duration)
    }, 380)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition])

  const submitTyped = useCallback(() => {
    const text = typedAnswer.trim()
    if (!text) return
    const words = text.split(/\s+/).length
    const duration = Math.max(20, Math.round(words / 2.3))
    setTypedAnswer('')
    submitAnswer(text, duration)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedAnswer])

  const submitAnswer = useCallback(
    (text: string, durationSec: number) => {
      pushTurn('candidate', text)
      answersRef.current = [...answersRef.current, analyseTranscript(text, durationSec)]
      moveIdxRef.current += 1
      // Clear the cue card once its long-turn answer is in.
      const stage = stagesRef.current[stageIdxRef.current]
      const prevMove = stage?.moves[moveIdxRef.current - 1]
      if (prevMove?.type === 'cuecard') setCueCard(null)
      setSpeakLeft(0)
      advance()
    },
    [advance, pushTurn],
  )

  const skipAudio = useCallback(() => {
    cancelSpeech()
    const pending = onSpeechEndRef.current
    onSpeechEndRef.current = null
    pending?.()
  }, [])

  // ── Render: result screen ────────────────────────────────────────────────
  if (phase === 'result' && evaluation) {
    return (
      <SpeakingResult
        evaluation={evaluation}
        modeLabel={modeLabel}
        onRetry={onExit}
        onExit={onExit}
      />
    )
  }

  // ── Render: pre-start gate ───────────────────────────────────────────────
  if (!started) {
    return (
      <div className="surface-card mx-auto max-w-2xl p-6 sm:p-8">
        <button onClick={onExit} className="premium-back-btn mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h2 className="text-2xl font-black text-slate-900">{modeLabel}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your AI examiner will speak each question aloud. Tap the microphone, answer naturally, then tap stop. The
          examiner asks adaptive follow-ups and grades you with an IELTS band score at the end.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-red-600" /> Turn your sound on to hear the examiner.</li>
          <li className="flex items-center gap-2"><Mic className="h-4 w-4 text-red-600" /> Allow microphone access when prompted.</li>
        </ul>
        {typingMode ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Microphone or speech recognition isn’t available here — you can type your answers instead and still get a full band score.
          </p>
        ) : null}
        <button onClick={beginSession} className="arena-primary-btn cta-sheen mt-6 w-full justify-center py-3">
          Start Session
        </button>
      </div>
    )
  }

  const isExaminerBusy = phase === 'examiner_speaking' || phase === 'thinking'
  const canRecord = phase === 'awaiting_answer'

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onExit} className="premium-back-btn">
          <ArrowLeft className="h-3.5 w-3.5" /> End session
        </button>
        <div className="flex items-center gap-2">
          <span className="soft-chip">{modeLabel}</span>
          {activePart > 0 ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
              Part {activePart}
            </span>
          ) : null}
        </div>
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="surface-card h-[46vh] min-h-[320px] space-y-3 overflow-y-auto p-4 sm:p-5"
      >
        {chat.map((turn) => (
          <motion.div
            key={turn.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${turn.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
                turn.role === 'examiner'
                  ? 'rounded-tl-sm border border-red-100 bg-white text-slate-800'
                  : 'rounded-tr-sm bg-gradient-to-br from-red-600 to-rose-600 text-white'
              }`}
            >
              {turn.role === 'examiner' ? (
                <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">
                  {examinerLabel}
                </span>
              ) : null}
              {turn.text}
            </div>
          </motion.div>
        ))}

        {/* Live interim transcript while recording */}
        {recording && (recognition.interimTranscript || recognition.finalTranscript) ? (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-dashed border-red-300 bg-red-50/70 px-4 py-2.5 text-sm leading-6 text-slate-600">
              {recognition.finalTranscript} <span className="text-slate-400">{recognition.interimTranscript}</span>
            </div>
          </div>
        ) : null}

        {phase === 'thinking' ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm border border-red-100 bg-white px-4 py-2.5 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-red-500" /> Examiner is thinking…
            </div>
          </div>
        ) : null}

        {phase === 'evaluating' ? (
          <div className="flex justify-center py-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-red-500" /> Grading your speaking…
            </div>
          </div>
        ) : null}
      </div>

      {/* Cue card (Part 2) */}
      {cueCard && (phase === 'preparing' || (phase === 'awaiting_answer' && speakLeft > 0)) ? (
        <div className="surface-card mt-4 border-red-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-900">{cueCard.title}</p>
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
              {phase === 'preparing' ? `Prep ${prepLeft}s` : `Speak ${speakLeft}s`}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-600">You should say:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
            {cueCard.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {phase === 'preparing' ? (
            <button onClick={() => { setPhase('awaiting_answer'); setPrepLeft(0); setSpeakLeft(120) }} className="arena-secondary-btn mt-3 text-sm">
              I’m ready — start speaking
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Current question reminder */}
      {canRecord && currentPrompt && !cueCard ? (
        <div className="mt-4 rounded-2xl border border-red-100 bg-white/80 px-4 py-3 text-center text-sm font-medium text-slate-700">
          <span className="mr-1 font-bold text-red-500">Q:</span>
          {currentPrompt}
        </div>
      ) : null}

      {/* Controls */}
      <div className="surface-card mt-4 p-4 sm:p-5">
        {isExaminerBusy ? (
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              {phase === 'thinking' ? 'Preparing the next question…' : 'Examiner is speaking…'}
            </div>
            {phase === 'examiner_speaking' ? (
              <button onClick={skipAudio} className="arena-secondary-btn text-sm">
                <SkipForward className="mr-1.5 h-4 w-4" /> Skip
              </button>
            ) : null}
          </div>
        ) : canRecord ? (
          typingMode ? (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">Type your answer:</p>
              <textarea
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                className="input min-h-[90px] w-full resize-y"
                placeholder="Type a full, developed answer here…"
              />
              <button onClick={submitTyped} disabled={!typedAnswer.trim()} className="arena-primary-btn mt-3 justify-center disabled:opacity-50">
                <Send className="mr-2 h-4 w-4" /> Submit answer
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <MicVisualizer stream={micStream} active={recording} />
              {!recording ? (
                <button onClick={startRecording} className="arena-primary-btn cta-sheen px-6 py-3">
                  <Mic className="mr-2 h-5 w-5" /> Record answer
                </button>
              ) : (
                <button onClick={handleStopRecording} className="arena-primary-btn bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-3">
                  <Square className="mr-2 h-4 w-4 fill-white" /> Stop & submit
                </button>
              )}
              <button
                onClick={() => setTypingMode(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
              >
                <Pencil className="h-3 w-3" /> Type instead
              </button>
              {recognition.error ? <p className="text-xs text-red-600">{recognition.error}</p> : null}
            </div>
          )
        ) : (
          <p className="text-center text-sm text-slate-500">Preparing…</p>
        )}
      </div>

      {evalError ? <p className="mt-3 text-center text-sm text-red-600">{evalError}</p> : null}
    </div>
  )
}
