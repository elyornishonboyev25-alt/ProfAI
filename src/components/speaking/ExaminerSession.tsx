import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, AudioLines, CheckCircle2, Clock3, Headphones, Loader2, MessageSquareText, Mic, Pencil, Send, SkipForward, Square, Volume2 } from 'lucide-react'
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
import { getIeltsSpeakingFullMockCatalog } from '@/utils/ieltsSpeakingCatalog'
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

  return unique.flatMap((text, index): Move[] => [
    { type: 'seed', text },
    ...((index === 0 || index === 2) ? [{ type: 'followup' } as Move] : []),
  ])
}

function buildStages(config: SessionConfig): Stage[] {
  const part1StageFrom = (questions: string[], includeIntroduction = false): Stage => ({
    part: 1,
    label: PART_LABELS[1],
    intro: 'Now, in this first part, I’d like to ask you some questions about yourself.',
    moves: [
      ...(includeIntroduction ? [{ type: 'seed', text: 'Could you tell me your full name, please?' } as Move] : []),
      ...uniqueQuestionMoves(questions),
    ],
  })
  const part2StageFrom = (card: CueCard): Stage => ({
    part: 2,
    label: PART_LABELS[2],
    intro: 'Now I’m going to give you a topic. You’ll have one minute to prepare, then please speak for one to two minutes.',
    moves: [
      { type: 'cuecard', card },
      { type: 'seed', text: card.followUp },
    ],
  })
  const part3StageFrom = (questions: string[], topic?: string): Stage => ({
    part: 3,
    label: PART_LABELS[3],
    intro: topic ? `We’ve been talking about ${topic}. Now I’d like to discuss some more general questions related to that topic.` : 'Now I’d like to discuss some more general questions.',
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
          part1StageFrom(seed.part1, true),
          part2StageFrom({ id: 'mock-cue', theme: 'mock', ...seed.part2 }),
          part3StageFrom(seed.part3, seed.part2.title.replace(/^Describe /i, '')),
        ]
      }
      const mock = pickRandom(getIeltsSpeakingFullMockCatalog())
      const card = mock.parts.part2
      return [
        part1StageFrom(mock.parts.part1.questions.map((question) => question.q), true),
        part2StageFrom(card),
        part3StageFrom(mock.parts.part3.questions.map((question) => question.q), card.title.replace(/^Describe /i, '')),
      ]
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

const GREETINGS = [
  'Good morning. My name is Alex, and I’m your examiner for this speaking practice.',
  'Good afternoon. My name is Alex, and I’m your examiner for this speaking practice.',
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
  onSaved: (evaluation: SpeakingEvaluation, transcript: ExaminerTurn[]) => void
}) {
  const recognition = useSpeechRecognition('en-US')

  const [phase, setPhase] = useState<Phase>('idle')
  const [started, setStarted] = useState(false)
  const [chat, setChat] = useState<ChatTurn[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [activePart, setActivePart] = useState<0 | 1 | 2 | 3>(1)
  const [cueCard, setCueCard] = useState<CueCard | null>(null)
  const [prepLeft, setPrepLeft] = useState(0)
  const [prepNotes, setPrepNotes] = useState('')
  const [speakLeft, setSpeakLeft] = useState(0)
  const [recording, setRecording] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [typingMode, setTypingMode] = useState(false)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [stopping, setStopping] = useState(false)
  const [examinerLabel, setExaminerLabel] = useState('Examiner')

  const stagesRef = useRef<Stage[]>([])
  const stageIdxRef = useRef(0)
  const moveIdxRef = useRef(0)
  const answersRef = useRef<SpeechStats[]>([])
  const historyRef = useRef<ExaminerTurn[]>([])
  const recordStartRef = useRef(0)
  const onSpeechEndRef = useRef<(() => void) | null>(null)
  const stopPendingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Ask for microphone access only after the candidate starts the test.
  useEffect(() => {
    if (!started) return
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
  }, [started])

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
          if (onSpeechEndRef.current === next) {
            onSpeechEndRef.current = null
            next()
          }
        },
      })
      window.setTimeout(reveal, 350)
    },
    [pushTurn],
  )

  const runEvaluation = useCallback(async () => {
    setPhase('evaluating')
    setEvalError(null)
    cancelSpeech()
    const stats = mergeStats(answersRef.current.length ? answersRef.current : [analyseTranscript('', 0)])
    try {
      const result = await evaluateSpeaking({ modeLabel, history: historyRef.current, stats })
      setEvaluation(result)
      setPhase('result')
      onSaved(result, [...historyRef.current])
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
      setPrepNotes('')
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
      speakExaminer('Your preparation time is over. Please begin speaking now.', () => {
        setSpeakLeft(120)
        setPhase('awaiting_answer')
      })
      return
    }
    const id = window.setInterval(() => setPrepLeft((v) => v - 1), 1000)
    return () => window.clearInterval(id)
  }, [phase, prepLeft, speakExaminer])

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
    setAnswerError(null)
    if (!recognition.supported) {
      setTypingMode(true)
      setAnswerError('Speech recognition is unavailable. Type your answer to continue.')
      return
    }
    recognition.reset()
    recordStartRef.current = Date.now()
    setRecording(true)
    recognition.start()
  }, [recognition])

  const handleStopRecording = useCallback(async () => {
    if (stopPendingRef.current) return
    stopPendingRef.current = true
    setStopping(true)
    const text = (await recognition.stop()).trim()
    setRecording(false)
    const duration = Math.max(2, (Date.now() - recordStartRef.current) / 1000)
    stopPendingRef.current = false
    setStopping(false)
    if (!text) {
      setAnswerError('No clear speech was detected. Record again or type your answer.')
      if (cueCard) setSpeakLeft(120)
      return
    }
    submitAnswer(text, duration)
  }, [recognition])

  const submitTyped = useCallback(() => {
    const text = typedAnswer.trim()
    if (!text) return
    setAnswerError(null)
    const words = text.split(/\s+/).length
    const duration = Math.max(20, Math.round(words / 2.3))
    setTypedAnswer('')
    submitAnswer(text, duration)
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

  const retrySession = useCallback(() => {
    cancelSpeech()
    setPhase('idle')
    setStarted(false)
    setChat([])
    setCurrentPrompt('')
    setCueCard(null)
    setPrepLeft(0)
    setPrepNotes('')
    setSpeakLeft(0)
    setTypedAnswer('')
    setEvaluation(null)
    setEvalError(null)
    setAnswerError(null)
    stagesRef.current = []
    stageIdxRef.current = 0
    moveIdxRef.current = 0
    answersRef.current = []
    historyRef.current = []
    recognition.reset()
  }, [recognition])

  // ── Render: result screen ────────────────────────────────────────────────
  if (phase === 'result' && evaluation) {
    return (
      <SpeakingResult
        evaluation={evaluation}
        modeLabel={modeLabel}
        transcript={historyRef.current}
        onRetry={retrySession}
        onExit={onExit}
      />
    )
  }

  // ── Render: pre-start gate ───────────────────────────────────────────────
  if (!started) {
    return (
      <div className="speaking-exam speaking-exam-v2 mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <header className="speaking-session-header mb-5">
          <button onClick={onExit} className="speaking-icon-button" aria-label="Back to Speaking tests"><ArrowLeft className="h-5 w-5" /></button>
          <span className="speaking-session-mark"><Mic className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1"><p className="speaking-eyebrow">IELTS Speaking <span className="speaking-header-divider">/</span> AI examiner</p><h1 className="truncate text-lg font-black text-slate-900">{modeLabel}</h1></div>
          <span className="speaking-part-pill">Ready to begin</span>
        </header>
        <div className="speaking-start-layout">
          <section className="speaking-start-hero">
            <div className="speaking-start-topline"><span className="speaking-start-orb"><Mic className="h-8 w-8" /></span><span className="speaking-start-duration"><Clock3 className="h-4 w-4" /> {config.mode === 'full_mock' ? '11–14 min' : 'Speaking practice'}</span></div>
            <p className="speaking-start-kicker">IELTS SPEAKING · AI EXAMINER</p>
            <h2>A real conversation.<br />A clearer next step.</h2>
            <p>Answer aloud as the examiner moves through each part. Your estimated band and feedback appear when the session ends.</p>
            <div className="speaking-start-features"><span><AudioLines className="h-4 w-4" /> Spoken examiner</span><span><MessageSquareText className="h-4 w-4" /> Follow-up questions</span><span><CheckCircle2 className="h-4 w-4" /> Band estimate</span></div>
          </section>
          <section className="speaking-start-guide">
            <p className="speaking-eyebrow">Before you begin</p>
            <h3>{config.mode === 'full_mock' ? 'Three parts. One conversation.' : 'Get ready to speak.'}</h3>
            {config.mode === 'full_mock' ? <div className="speaking-start-parts" aria-label="Speaking test structure"><div><span>01</span><strong>Interview</strong><small>Familiar topics · 4–5 min</small></div><div><span>02</span><strong>Long turn</strong><small>1 min prep · up to 2 min speaking</small></div><div><span>03</span><strong>Discussion</strong><small>Related ideas · 4–5 min</small></div></div> : null}
            <div className="speaking-start-tip"><span><Volume2 className="h-4 w-4" /></span><div><strong>Sound on</strong><p>Listen to one examiner question at a time.</p></div></div>
            <div className="speaking-start-tip"><span><Mic className="h-4 w-4" /></span><div><strong>Microphone ready</strong><p>Allow access when prompted and speak naturally.</p></div></div>
            {typingMode ? <p className="speaking-inline-error">Microphone access is unavailable. You can type your answers to continue.</p> : null}
            <button onClick={beginSession} className="speaking-record-button mt-6">Begin speaking test <ArrowLeft className="h-4 w-4 rotate-180" /></button>
            <p className="speaking-start-note">AI practice simulation · estimated score, not an official IELTS result</p>
          </section>
        </div>
      </div>
    )
  }

  const isExaminerBusy = phase === 'examiner_speaking' || phase === 'thinking'
  const canRecord = phase === 'awaiting_answer'
  const isFullMock = config.mode === 'full_mock'
  const answeredCount = chat.filter((turn) => turn.role === 'candidate').length

  return (
    <div className="speaking-exam speaking-exam-v2 mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6">
      <header className="speaking-session-header">
        <button onClick={onExit} className="speaking-icon-button" aria-label="End session"><ArrowLeft className="h-5 w-5" /></button>
        <span className="speaking-session-mark"><Mic className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="speaking-eyebrow">IELTS Speaking <span className="speaking-header-divider">/</span> AI examiner</p>
          <h1 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">{modeLabel}</h1>
        </div>
        <span className="speaking-header-status"><span /> Session in progress</span>
        <span className="speaking-part-pill">{activePart > 0 ? isFullMock ? `Part ${activePart} of 3` : `Part ${activePart}` : 'Interview'}</span>
      </header>

      {isFullMock ? <nav className="speaking-journey" aria-label="Speaking test parts">
        {[1, 2, 3].map((part) => <div key={part} className={`speaking-journey-step ${activePart === part ? 'is-active' : activePart > part ? 'is-complete' : ''}`} aria-current={activePart === part ? 'step' : undefined}>
          <span className="speaking-journey-number">{activePart > part ? <CheckCircle2 className="h-4 w-4" /> : String(part).padStart(2, '0')}</span>
          <span className="speaking-journey-text"><strong>Part {part}</strong><small>{part === 1 ? 'Interview' : part === 2 ? 'Long turn' : 'Discussion'}</small></span>
          {part < 3 ? <span className="speaking-journey-line" /> : null}
        </div>)}
      </nav> : null}

      <main className="speaking-session-grid">
      <section className="speaking-transcript-panel" aria-label="Speaking conversation">
        <div className="speaking-panel-heading">
          <span className="speaking-panel-icon"><MessageSquareText className="h-[18px] w-[18px]" /></span>
          <div><h2>Conversation</h2><p>Your exchange with the examiner</p></div>
          <span className="speaking-turn-count">{answeredCount} {answeredCount === 1 ? 'answer' : 'answers'}</span>
        </div>
        <div ref={scrollRef} className="speaking-conversation" role="log" aria-live="polite" aria-relevant="additions text">
        {chat.map((turn) => (
          <motion.div
            key={turn.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`speaking-turn ${turn.role === 'candidate' ? 'speaking-turn--candidate' : 'speaking-turn--examiner'}`}
          >
            <span className="speaking-turn-avatar" aria-hidden>{turn.role === 'candidate' ? <Mic className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}</span>
            <div className="speaking-turn-bubble">
              <span className="speaking-turn-name">{turn.role === 'candidate' ? 'You' : examinerLabel}</span>
              <p>{turn.text}</p>
            </div>
          </motion.div>
        ))}

        {/* Live interim transcript while recording */}
        {recording && (recognition.interimTranscript || recognition.finalTranscript) ? (
          <div className="speaking-turn speaking-turn--candidate">
            <span className="speaking-turn-avatar" aria-hidden><Mic className="h-4 w-4" /></span>
            <div className="speaking-turn-bubble speaking-turn-bubble--draft">
              <span className="speaking-turn-name">Live transcript</span>
              <p>{recognition.finalTranscript} <span className="opacity-70">{recognition.interimTranscript}</span></p>
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
        <div className="speaking-transcript-footer"><span className="speaking-live-dot" /> Live transcript <span className="speaking-footer-end">Scroll to revisit earlier turns</span></div>
      </section>

      <section className="speaking-focus-panel" aria-label="Current question and response controls">
        <div className="speaking-panel-heading speaking-panel-heading--focus">
          <span className="speaking-panel-icon"><Headphones className="h-[18px] w-[18px]" /></span>
          <div><h2>{canRecord ? 'Your turn' : 'Examiner room'}</h2><p>{canRecord ? 'Respond to the question below' : 'Listen and get ready to respond'}</p></div>
          <span className={`speaking-phase-chip ${recording ? 'is-recording' : ''}`}><span />{recording ? 'Recording' : phase === 'preparing' ? 'Preparing' : isExaminerBusy ? 'Examiner live' : canRecord ? 'Ready' : 'In progress'}</span>
        </div>
        <div className="speaking-focus-content">
          {cueCard && (phase === 'preparing' || isExaminerBusy || canRecord) ? (
            <div className="speaking-question-card speaking-question-card--cue">
              <div className="speaking-question-meta"><span>PART 02 · TASK CARD</span><strong>{phase === 'preparing' ? `Prep ${prepLeft}s` : canRecord ? `Speak ${speakLeft}s` : 'Listen'}</strong></div>
              <h3>{cueCard.title}</h3>
              <p className="speaking-question-hint">You should say:</p>
              <ul className="speaking-cue-list">{cueCard.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              <label className="speaking-notes-label" htmlFor="speaking-prep-notes">Your notes <span>{phase === 'preparing' ? 'Write keywords during preparation' : 'Available while you speak'}</span></label>
              <textarea id="speaking-prep-notes" className="speaking-prep-notes" value={prepNotes} onChange={(event) => setPrepNotes(event.target.value)} disabled={phase !== 'preparing'} placeholder="A few keywords to guide your talk…" />
            </div>
          ) : (
            <div className="speaking-question-card">
              <div className="speaking-question-meta"><span>{canRecord ? 'CURRENT QUESTION' : 'EXAMINER PROMPT'}</span><span>{activePart > 0 ? `PART 0${activePart}` : 'INTERVIEW'}</span></div>
              <h3>{currentPrompt || 'The examiner is preparing your next question.'}</h3>
              <p className="speaking-question-hint">{canRecord ? activePart === 3 ? 'Develop your opinion and explain why.' : 'Answer naturally in your own words.' : 'Your response controls will appear when the examiner finishes.'}</p>
            </div>
          )}

          <div className="speaking-response-station">
            <div className="speaking-response-title"><span className="speaking-response-icon"><AudioLines className="h-[18px] w-[18px]" /></span><div><h3>Your response</h3><p>{typingMode ? 'Written answer' : 'Voice answer'}</p></div></div>
            {isExaminerBusy ? (
              <div className="speaking-wait-state"><div className="speaking-wait-orb"><AudioLines className="h-7 w-7" /></div><strong>{phase === 'thinking' ? 'Preparing the next question…' : 'Examiner is speaking…'}</strong><p>Take a moment to listen before you answer.</p>
                {phase === 'examiner_speaking' ? <button onClick={skipAudio} className="speaking-quiet-button mt-3"><SkipForward className="h-4 w-4" /> Skip audio</button> : null}
              </div>
            ) : canRecord ? typingMode ? (
              <div className="speaking-input-state">
                <textarea value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} className="speaking-answer-input" placeholder="Type a full, developed answer here…" aria-label="Your answer" />
                <button onClick={submitTyped} disabled={!typedAnswer.trim()} className="speaking-record-button disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-5 w-5" /> Submit answer</button>
                {recognition.supported ? <button onClick={() => setTypingMode(false)} className="speaking-text-switch"><Mic className="h-4 w-4" /> Use microphone</button> : null}
              </div>
            ) : (
              <div className="speaking-input-state">
                <div className={`speaking-waveform ${recording ? 'is-recording' : ''}`}><span className="speaking-waveform-icon"><Mic className="h-6 w-6" /></span><MicVisualizer stream={micStream} active={recording} bars={24} /><span className="speaking-waveform-label">{recording ? 'Recording your answer' : 'Microphone ready'}</span></div>
                {!recording ? <button onClick={startRecording} disabled={stopping} className="speaking-record-button disabled:opacity-50"><Mic className="h-5 w-5" /> Record answer</button> : <button onClick={() => void handleStopRecording()} disabled={stopping} className="speaking-record-button speaking-record-button--stop disabled:opacity-50"><Square className="h-4 w-4 fill-current" />{stopping ? 'Transcribing…' : 'Stop & submit'}</button>}
                <button onClick={() => setTypingMode(true)} disabled={recording || stopping} className="speaking-text-switch disabled:opacity-40"><Pencil className="h-4 w-4" /> Type instead</button>
                {recognition.error ? <p role="alert" className="speaking-inline-error">{recognition.error}</p> : null}
              </div>
            ) : (
              <div className="speaking-wait-state"><div className="speaking-wait-orb"><Loader2 className="h-7 w-7 animate-spin" /></div><strong>{phase === 'evaluating' ? 'Preparing your feedback…' : 'Get ready to answer'}</strong><p>{phase === 'preparing' ? 'Use this time to plan your long turn.' : 'Your next prompt is coming up.'}</p></div>
            )}
          </div>
          {answerError ? <p role="alert" className="speaking-inline-error">{answerError}</p> : null}
          {evalError ? <p role="alert" className="speaking-inline-error">{evalError}</p> : null}
        </div>
        <div className="speaking-focus-footer"><CheckCircle2 className="h-4 w-4" /> Detailed feedback and an estimated band appear after the session.</div>
      </section>
      </main>
    </div>
  )
}
