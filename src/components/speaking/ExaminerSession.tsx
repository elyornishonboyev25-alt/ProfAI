import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, AudioLines, CheckCircle2, Clock3, Headphones, Loader2, MessageSquareText, Mic, Volume2 } from 'lucide-react'
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
import { examinerAudio, transcribeAnswer } from '@/lib/speakingAudio'
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

function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

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
  const [starting, setStarting] = useState(false)
  const [chat, setChat] = useState<ChatTurn[]>([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [activePart, setActivePart] = useState<0 | 1 | 2 | 3>(1)
  const [cueCard, setCueCard] = useState<CueCard | null>(null)
  const [prepLeft, setPrepLeft] = useState(0)
  const [speakLeft, setSpeakLeft] = useState(0)
  const [recording, setRecording] = useState(false)
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
  const prepDeadlineRef = useRef(0)
  const longTurnDeadlineRef = useRef(0)
  const longTurnFinishedRef = useRef(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const micStreamRef = useRef<MediaStream | null>(null)
  const examinerPlayerRef = useRef<HTMLAudioElement | null>(null)
  const examinerAudioUrlRef = useRef<string | null>(null)
  const voiceRequestRef = useRef(0)
  const captureStartedRef = useRef(false)
  const silenceTimerRef = useRef<number | null>(null)
  const captureLimitTimerRef = useRef<number | null>(null)
  const voiceContextRef = useRef<AudioContext | null>(null)
  const voiceSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const stopForSilenceRef = useRef<() => void>(() => {})
  const onSpeechEndRef = useRef<(() => void) | null>(null)
  const stopPendingRef = useRef(false)
  const beginPendingRef = useRef(false)
  const disposedRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll the transcript on new turns.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat, phase])

  // Cleanup speech on unmount.
  useEffect(() => {
    disposedRef.current = false
    return () => {
      disposedRef.current = true
      cancelSpeech()
      voiceRequestRef.current += 1
      examinerPlayerRef.current?.pause()
      if (examinerAudioUrlRef.current) URL.revokeObjectURL(examinerAudioUrlRef.current)
      micStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (silenceTimerRef.current) window.clearInterval(silenceTimerRef.current)
      if (captureLimitTimerRef.current) window.clearTimeout(captureLimitTimerRef.current)
      void voiceContextRef.current?.close()
    }
  }, [])
  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])

  const pushTurn = useCallback((role: 'examiner' | 'candidate', text: string) => {
    setChat((prev) => [...prev, { id: `${role}-${Date.now()}-${prev.length}`, role, text }])
    historyRef.current = [...historyRef.current, { role, text }]
  }, [])

  // Speak an examiner line and reveal its bubble IN SYNC with the voice (onStart),
  // so text and audio appear together rather than text-first. A short safety timer
  // reveals it anyway if onStart is slow or TTS is unavailable.
  const speakExaminer = useCallback(
    (text: string, next: () => void) => {
      const requestId = ++voiceRequestRef.current
      examinerPlayerRef.current?.pause()
      if (examinerAudioUrlRef.current) URL.revokeObjectURL(examinerAudioUrlRef.current)
      examinerAudioUrlRef.current = null
      cancelSpeech()
      setPhase('examiner_speaking')
      setCurrentPrompt(text)
      onSpeechEndRef.current = next
      let shown = false
      const reveal = () => {
        if (shown) return
        shown = true
        pushTurn('examiner', text)
      }
      const finish = () => {
        if (voiceRequestRef.current !== requestId) return
        reveal()
        if (onSpeechEndRef.current === next) {
          onSpeechEndRef.current = null
          next()
        }
      }
      const browserVoice = () => speak(text, {
        lang: 'en', voice: getExaminerVoice(), rate: 0.98,
        onStart: reveal, onEnd: finish,
      })
      void examinerAudio(text).then((url) => {
        if (voiceRequestRef.current !== requestId) { URL.revokeObjectURL(url); return }
        examinerAudioUrlRef.current = url
        const player = new Audio(url)
        examinerPlayerRef.current = player
        player.onplay = reveal
        player.onended = finish
        player.onerror = () => { if (voiceRequestRef.current === requestId) browserVoice() }
        void player.play().catch(() => { if (voiceRequestRef.current === requestId) browserVoice() })
      }).catch(() => { if (voiceRequestRef.current === requestId) browserVoice() })
      window.setTimeout(() => { if (voiceRequestRef.current === requestId) reveal() }, 350)
    },
    [pushTurn],
  )

  const runEvaluation = useCallback(async () => {
    setPhase('evaluating')
    setEvalError(null)
    cancelSpeech()
    micStreamRef.current?.getTracks().forEach((track) => track.stop())
    micStreamRef.current = null
    setMicStream(null)
    if (voiceContextRef.current) void voiceContextRef.current.close()
    voiceContextRef.current = null
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
    captureStartedRef.current = false
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
      longTurnFinishedRef.current = false
      setActivePart(2)
      const cardText = `${move.card.title}. You should say: ${move.card.bullets.join('; ')}. You have one minute to prepare.`
      speakExaminer(cardText, () => {
        prepDeadlineRef.current = Date.now() + 60_000
        setPhase('preparing')
        setPrepLeft(60)
      })
    }
  }, [runEvaluation, speakExaminer])

  // Use wall-clock deadlines so a background tab cannot stretch either exam period.
  useEffect(() => {
    if (phase !== 'preparing') return
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((prepDeadlineRef.current - Date.now()) / 1000))
      setPrepLeft(seconds)
      if (seconds === 0) {
        window.clearInterval(id)
        speakExaminer('Your preparation time is over. Please begin speaking now.', () => {
          longTurnDeadlineRef.current = Date.now() + 120_000
          setSpeakLeft(120)
          setPhase('awaiting_answer')
        })
      }
    }
    const id = window.setInterval(tick, 250)
    tick()
    return () => window.clearInterval(id)
  }, [phase, speakExaminer])

  const beginSession = useCallback(async () => {
    if (beginPendingRef.current) return
    beginPendingRef.current = true
    setStarting(true)
    setAnswerError(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setAnswerError('This browser cannot record audio. Use a browser with microphone recording support.')
      beginPendingRef.current = false
      setStarting(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false,
      })
      if (disposedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      micStreamRef.current = stream
      setMicStream(stream)
    } catch {
      setAnswerError('Microphone access is required. Allow microphone access and try again.')
      beginPendingRef.current = false
      setStarting(false)
      return
    }
    beginPendingRef.current = false
    setStarting(false)
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

  const submitAnswer = useCallback(
    (text: string, durationSec: number, skipPart2FollowUp = false) => {
      pushTurn('candidate', text.trim())
      answersRef.current = [...answersRef.current, analyseTranscript(text, durationSec)]
      moveIdxRef.current += 1
      const stage = stagesRef.current[stageIdxRef.current]
      const prevMove = stage?.moves[moveIdxRef.current - 1]
      if (prevMove?.type === 'cuecard') {
        setCueCard(null)
        if (skipPart2FollowUp) moveIdxRef.current = stage.moves.length
      }
      longTurnDeadlineRef.current = 0
      longTurnFinishedRef.current = true
      setSpeakLeft(0)
      advance()
    },
    [advance, pushTurn],
  )

  const stopAudioCapture = useCallback((): Promise<Blob | null> => new Promise((resolve) => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') { resolve(null); return }
    const chunks = audioChunksRef.current
    let settled = false
    const finish = (blob: Blob | null) => {
      if (settled) return
      settled = true
      resolve(blob)
    }
    recorder.onstop = () => {
      if (recorderRef.current === recorder) recorderRef.current = null
      const blob = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' })
      finish(blob.size > 0 ? blob : null)
    }
    try { recorder.stop() } catch { finish(null) }
    window.setTimeout(() => finish(null), 5000)
  }), [])

  const stopVoiceDetection = useCallback(() => {
    if (silenceTimerRef.current !== null) window.clearInterval(silenceTimerRef.current)
    silenceTimerRef.current = null
    if (captureLimitTimerRef.current !== null) window.clearTimeout(captureLimitTimerRef.current)
    captureLimitTimerRef.current = null
    voiceSourceRef.current?.disconnect()
    voiceSourceRef.current = null
  }, [])

  const startRecording = useCallback(() => {
    if (captureStartedRef.current || stopPendingRef.current) return
    captureStartedRef.current = true
    setEvalError(null)
    setAnswerError(null)
    const stream = micStreamRef.current
    if (!stream?.active) {
      setAnswerError('Microphone disconnected. Reconnect it, then retry this question.')
      return
    }
    audioChunksRef.current = []
    try {
      const preferred = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
        .find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred, audioBitsPerSecond: 64000 } : undefined)
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data) }
      recorder.start(1000)
      recorderRef.current = recorder
    } catch {
      setAnswerError('Could not start audio capture. Check your microphone and retry.')
      return
    }
    recognition.reset()
    if (recognition.supported) recognition.start()
    recordStartRef.current = Date.now()
    setRecording(true)
    captureLimitTimerRef.current = window.setTimeout(() => stopForSilenceRef.current(), cueCard ? 120_000 : 90_000)
    try {
      const context = voiceContextRef.current ?? new AudioContext()
      voiceContextRef.current = context
      void context.resume()
      const analyser = context.createAnalyser()
      analyser.fftSize = 2048
      voiceSourceRef.current = context.createMediaStreamSource(stream)
      voiceSourceRef.current.connect(analyser)
      const samples = new Float32Array(analyser.fftSize)
      let noiseFloor = 0.008
      let heardSpeech = false
      let speechFrames = 0
      let lastSpeech = Date.now()
      silenceTimerRef.current = window.setInterval(() => {
        analyser.getFloatTimeDomainData(samples)
        let power = 0
        for (const sample of samples) power += sample * sample
        const rms = Math.sqrt(power / samples.length)
        if (!heardSpeech && Date.now() - recordStartRef.current < 1200 && rms < 0.025) {
          noiseFloor = noiseFloor * 0.85 + rms * 0.15
        }
        const voiced = rms > Math.max(0.018, noiseFloor * 2.8)
        speechFrames = voiced ? Math.min(4, speechFrames + 1) : Math.max(0, speechFrames - 1)
        if (speechFrames >= 2) { heardSpeech = true; lastSpeech = Date.now() }
        if (heardSpeech && Date.now() - lastSpeech > (cueCard ? 8500 : 6500)) stopForSilenceRef.current()
        if (!heardSpeech && Date.now() - recordStartRef.current > 20000) stopForSilenceRef.current()
      }, 100)
    } catch {
      // The two-minute Part 2 limit remains active even if audio metering is unavailable.
    }
  }, [cueCard, recognition])

  const handleStopRecording = useCallback(async (autoFinish = false) => {
    if (stopPendingRef.current) return
    stopPendingRef.current = true
    stopVoiceDetection()
    setStopping(true)
    const [browserText, audioBlob] = await Promise.all([recognition.stop(), stopAudioCapture()])
    const durationSec = Math.max(2, (Date.now() - recordStartRef.current) / 1000)
    setRecording(false)
    let text = browserText.trim()
    if (audioBlob) {
      try { text = (await transcribeAnswer(audioBlob)) || text } catch { /* Browser transcript remains the fallback. */ }
    }
    stopPendingRef.current = false
    setStopping(false)
    if (!text) {
      if (autoFinish) {
        submitAnswer('', durationSec, true)
        return
      }
      setAnswerError('No clear answer was captured. Check your microphone and retry this question.')
      return
    }
    setAnswerError(null)
    submitAnswer(text, durationSec, autoFinish || Boolean(cueCard))
  }, [cueCard, recognition, stopAudioCapture, stopVoiceDetection, submitAnswer])

  stopForSilenceRef.current = () => { void handleStopRecording() }

  useEffect(() => {
    if (phase !== 'awaiting_answer' || captureStartedRef.current) return
    startRecording()
  }, [phase, startRecording])

  useEffect(() => {
    if (phase !== 'awaiting_answer' || !cueCard || !longTurnDeadlineRef.current) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((longTurnDeadlineRef.current - Date.now()) / 1000))
      setSpeakLeft(left)
      if (left > 0 || longTurnFinishedRef.current || stopPendingRef.current) return
      if (recording) void handleStopRecording(true)
    }
    const id = window.setInterval(tick, 250)
    tick()
    return () => window.clearInterval(id)
  }, [cueCard, handleStopRecording, phase, recording])

  const retrySession = useCallback(() => {
    cancelSpeech()
    voiceRequestRef.current += 1
    examinerPlayerRef.current?.pause()
    if (examinerAudioUrlRef.current) URL.revokeObjectURL(examinerAudioUrlRef.current)
    examinerAudioUrlRef.current = null
    micStreamRef.current?.getTracks().forEach((track) => track.stop())
    micStreamRef.current = null
    setMicStream(null)
    stopVoiceDetection()
    if (voiceContextRef.current) void voiceContextRef.current.close()
    voiceContextRef.current = null
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    prepDeadlineRef.current = 0
    longTurnDeadlineRef.current = 0
    longTurnFinishedRef.current = false
    captureStartedRef.current = false
    stopPendingRef.current = false
    setRecording(false)
    setStopping(false)
    setPhase('idle')
    setStarted(false)
    setChat([])
    setCurrentPrompt('')
    setCueCard(null)
    setPrepLeft(0)
    setSpeakLeft(0)
    setEvaluation(null)
    setEvalError(null)
    setAnswerError(null)
    stagesRef.current = []
    stageIdxRef.current = 0
    moveIdxRef.current = 0
    answersRef.current = []
    historyRef.current = []
    recognition.reset()
  }, [recognition, stopVoiceDetection])

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
  if (phase === 'result' && evalError) {
    return <div className="speaking-exam speaking-exam-v2 mx-auto max-w-xl px-4 py-12"><div className="speaking-start-guide text-center"><p className="speaking-eyebrow">Speaking session complete</p><h2 className="mt-3 text-2xl font-black text-slate-900">Your feedback is still processing</h2><p className="mt-3 text-sm text-slate-600">{evalError}</p><button onClick={() => void runEvaluation()} className="speaking-record-button mt-6">Try feedback again</button><button onClick={onExit} className="speaking-text-switch mt-3">Return to Speaking tests</button></div></div>
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
            {config.mode === 'full_mock' ? <div className="speaking-start-parts" aria-label="Speaking test structure"><div><span>01</span><strong>Interview</strong><small>Familiar topics · 4–5 min</small></div><div><span>02</span><strong>Long turn</strong><small>1 min prep · 2 min maximum</small></div><div><span>03</span><strong>Discussion</strong><small>Related ideas · 4–5 min</small></div></div> : null}
            <div className="speaking-start-tip"><span><Volume2 className="h-4 w-4" /></span><div><strong>Sound on</strong><p>Listen to one examiner question at a time.</p></div></div>
            <div className="speaking-start-tip"><span><Mic className="h-4 w-4" /></span><div><strong>Microphone ready</strong><p>Allow access when prompted and speak naturally.</p></div></div>
            {answerError ? <p role="alert" className="speaking-inline-error">{answerError}</p> : null}
            <button onClick={() => void beginSession()} disabled={starting} className="speaking-record-button mt-6 disabled:opacity-60">{starting ? 'Connecting microphone…' : 'Begin speaking test'} {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4 rotate-180" />}</button>
            <p className="speaking-start-note">AI-generated examiner voice · practice simulation · estimated score, not an official IELTS result</p>
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
              <p>{turn.text || 'No speech was captured for this question.'}</p>
            </div>
          </motion.div>
        ))}


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
              <div className="speaking-question-meta"><span>PART 02 · TASK CARD</span><strong className={canRecord && speakLeft <= 30 ? 'is-urgent' : ''}>{phase === 'preparing' ? `PREP ${formatClock(prepLeft)}` : canRecord ? `SPEAK ${formatClock(speakLeft)}` : 'LISTEN'}</strong></div>
              {(phase === 'preparing' || canRecord) ? <div className="speaking-timer-track" role="progressbar" aria-label={phase === 'preparing' ? 'Preparation time remaining' : 'Speaking time remaining'} aria-valuenow={phase === 'preparing' ? prepLeft : speakLeft} aria-valuemin={0} aria-valuemax={phase === 'preparing' ? 60 : 120}><span style={{ width: `${phase === 'preparing' ? (prepLeft / 60) * 100 : (speakLeft / 120) * 100}%` }} /></div> : null}
              <h3>{cueCard.title}</h3>
              <p className="speaking-question-hint">You should say:</p>
              <ul className="speaking-cue-list">{cueCard.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              {canRecord ? <p className="speaking-timer-help">The examiner moves on when you finish speaking or the two-minute limit is reached.</p> : null}
            </div>
          ) : (
            <div className="speaking-question-card">
              <div className="speaking-question-meta"><span>{canRecord ? 'CURRENT QUESTION' : 'EXAMINER PROMPT'}</span><span>{activePart > 0 ? `PART 0${activePart}` : 'INTERVIEW'}</span></div>
              <h3>{currentPrompt || 'The examiner is preparing your next question.'}</h3>
              <p className="speaking-question-hint">{canRecord ? activePart === 3 ? 'Develop your opinion and explain why.' : 'Answer naturally in your own words.' : 'Recording starts when the examiner finishes speaking.'}</p>
            </div>
          )}

          <div className="speaking-response-station">
            <div className="speaking-response-title"><span className="speaking-response-icon"><AudioLines className="h-[18px] w-[18px]" /></span><div><h3>Your response</h3><p>Voice answer</p></div></div>
            {isExaminerBusy ? (
              <div className="speaking-wait-state"><div className="speaking-wait-orb"><AudioLines className="h-7 w-7" /></div><strong>{phase === 'thinking' ? 'Preparing the next question…' : 'Examiner is speaking…'}</strong><p>Take a moment to listen before you answer.</p>
              </div>
            ) : canRecord ? (
              <div className="speaking-input-state">
                <div className={`speaking-waveform ${recording ? 'is-recording' : ''}`}><span className="speaking-waveform-icon"><Mic className="h-6 w-6" /></span><MicVisualizer stream={micStream} active={recording} bars={24} /><span className="speaking-waveform-label">{stopping ? 'Processing your answer…' : recording ? 'Recording automatically' : 'Microphone ready'}</span></div>
                <p className="speaking-record-hint">{stopping ? 'The examiner will continue shortly.' : 'Speak after the examiner. A short silence ends your turn automatically.'}</p>
                {answerError ? <button onClick={() => { captureStartedRef.current = false; startRecording() }} className="speaking-record-button">Retry microphone</button> : null}
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
