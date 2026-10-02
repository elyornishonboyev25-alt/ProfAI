import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, AudioLines, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Headphones, Loader2, MessageSquareText, Mic, ShieldCheck, Square, Volume2 } from 'lucide-react'
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
import { cancelSpeech, useSpeechRecognition } from '@/lib/speech'
import { transcribeAnswer, type ExaminerVoice } from '@/lib/speakingAudio'
import { ExaminerPlayback } from '@/lib/examinerPlayback'
import { AnswerRecording, canRecordAudio, canRecognizeWhileRecording, createAudioContext, microphoneError } from '@/lib/speakingMedia'
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

type ChatTurn = { id: string; role: 'examiner' | 'candidate'; text: string; durationSec?: number }

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
    intro: 'Now we’ll move on to Part 2.',
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

function examinerGreeting(name: string): string {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return `${greeting}. My name is ${name}, and I will be your examiner today.`
}

function chooseExaminer(modeLabel: string): { name: string; voice: ExaminerVoice; gender: 'male' | 'female' } {
  const number = Number(modeLabel.match(/\d+/)?.[0])
  const isFemale = Number.isFinite(number)
    ? number % 2 === 0
    : [...modeLabel].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 2 === 0
  return isFemale
    ? { name: 'Maya', voice: 'marin', gender: 'female' }
    : { name: 'Alex', voice: 'cedar', gender: 'male' }
}

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
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [speechDetected, setSpeechDetected] = useState(false)
  const [voiceSource, setVoiceSource] = useState<'connecting' | 'neural' | 'device'>('connecting')
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [stopping, setStopping] = useState(false)
  const [examinerLabel, setExaminerLabel] = useState('Examiner')
  const [logOffset, setLogOffset] = useState(0)
  const examiner = useRef(chooseExaminer(modeLabel)).current

  const stagesRef = useRef<Stage[]>([])
  const stageIdxRef = useRef(0)
  const moveIdxRef = useRef(0)
  const answersRef = useRef<SpeechStats[]>([])
  const historyRef = useRef<ExaminerTurn[]>([])
  const recordStartRef = useRef(0)
  const prepDeadlineRef = useRef(0)
  const longTurnDeadlineRef = useRef(0)
  const longTurnFinishedRef = useRef(false)
  const recorderRef = useRef<AnswerRecording | null>(null)
  const pendingAnswerRef = useRef<{ blob: Blob; duration: number } | null>(null)
  const pendingAudioUrlRef = useRef<string | null>(null)
  const transcriptionAbortRef = useRef<AbortController | null>(null)
  const sessionVersionRef = useRef(0)
  const playbackRef = useRef<ExaminerPlayback | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const captureStartedRef = useRef(false)
  const silenceTimerRef = useRef<number | null>(null)
  const captureLimitTimerRef = useRef<number | null>(null)
  const voiceContextRef = useRef<AudioContext | null>(null)
  const voiceSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const stopForSilenceRef = useRef<() => void>(() => {})
  const promptReplayRef = useRef<((device?: boolean) => void) | null>(null)
  const deviceVoiceRef = useRef(false)
  const stopPendingRef = useRef(false)
  const microphoneInterruptedRef = useRef(false)
  const beginPendingRef = useRef(false)
  const disposedRef = useRef(false)

  // Cleanup speech on unmount.
  useEffect(() => {
    disposedRef.current = false
    return () => {
      disposedRef.current = true
      sessionVersionRef.current++
      cancelSpeech()
      playbackRef.current?.cancel()
      transcriptionAbortRef.current?.abort()
      if (pendingAudioUrlRef.current) URL.revokeObjectURL(pendingAudioUrlRef.current)
      micStreamRef.current?.getTracks().forEach((track) => track.stop())
      if (silenceTimerRef.current) window.clearInterval(silenceTimerRef.current)
      if (captureLimitTimerRef.current) window.clearTimeout(captureLimitTimerRef.current)
      void voiceContextRef.current?.close().catch(() => {})
    }
  }, [])
  useEffect(() => () => {
    void recorderRef.current?.stop()
  }, [])

  const pushTurn = useCallback((role: 'examiner' | 'candidate', text: string, durationSec?: number) => {
    setChat((prev) => [...prev, { id: `${role}-${Date.now()}-${prev.length}`, role, text, durationSec }])
    setLogOffset(0)
    historyRef.current = [...historyRef.current, { role, text }]
  }, [])

  const attachMicrophone = useCallback((stream: MediaStream) => {
    micStreamRef.current = stream
    setMicStream(stream)
    for (const track of stream.getAudioTracks()) {
      track.onended = () => {
        if (disposedRef.current || micStreamRef.current !== stream) return
        microphoneInterruptedRef.current = true
        setAnswerError('Microphone disconnected. Reconnect it and retry this question.')
        if (recorderRef.current?.recorder.state === 'recording') stopForSilenceRef.current()
      }
    }
  }, [])

  // Reveal the examiner's turn when playback starts. The recording phase begins
  // only after the actual audio ends, including for long Part 2 instructions.
  const speakExaminer = useCallback(
    (text: string, next: () => void) => {
      if (disposedRef.current) return
      const playback = playbackRef.current ?? new ExaminerPlayback()
      playbackRef.current = playback
      cancelSpeech()
      setPhase('examiner_speaking')
      setCurrentPrompt(text)
      let shown = false
      const reveal = () => {
        if (shown) return
        shown = true
        pushTurn('examiner', text)
      }
      const play = (device = deviceVoiceRef.current) => {
        deviceVoiceRef.current = device
        setVoiceError(null)
        playback.ask(text, examiner.voice, examiner.gender, {
          loading: setVoiceLoading,
          started: (source) => { setVoiceError(null); setVoiceSource(source); reveal() },
          ended: () => { promptReplayRef.current = null; next() },
          failed: setVoiceError,
        }, device)
      }
      promptReplayRef.current = play
      play()
    },
    [examiner, pushTurn],
  )

  const runEvaluation = useCallback(async () => {
    setPhase('evaluating')
    setEvalError(null)
    cancelSpeech()
    playbackRef.current?.cancel()
    sessionVersionRef.current++
    const stream = micStreamRef.current
    micStreamRef.current = null
    stream?.getTracks().forEach((track) => track.stop())
    setMicStream(null)
    if (voiceContextRef.current) void voiceContextRef.current.close().catch(() => {})
    voiceContextRef.current = null
    const version = sessionVersionRef.current
    const stats = mergeStats(answersRef.current.length ? answersRef.current : [analyseTranscript('', 0)])
    try {
      const result = await evaluateSpeaking({ modeLabel, history: historyRef.current, stats })
      if (disposedRef.current || version !== sessionVersionRef.current) return
      setEvaluation(result)
      setPhase('result')
      onSaved(result, [...historyRef.current])
    } catch {
      if (disposedRef.current || version !== sessionVersionRef.current) return
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
      const version = sessionVersionRef.current
      void getExaminerReply({
        part: stage.part,
        persona: stage.persona,
        history: historyRef.current,
        directive: 'follow_up',
        style: stage.conversational ? 'friend' : 'examiner',
      }).then((reply) => {
        if (disposedRef.current || version !== sessionVersionRef.current) return
        speakExaminer(reply, () => setPhase('awaiting_answer'))
      })
    } else if (move.type === 'cuecard') {
      setCueCard(move.card)
      longTurnFinishedRef.current = false
      setActivePart(2)
      const cardText = `I’m going to give you a topic, and I’d like you to talk about it for one to two minutes. You have one minute to prepare. Here is your topic: ${move.card.title}.`
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
        speakExaminer('All right. Please begin speaking now.', () => {
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
    // Both calls must happen inside the button gesture, before getUserMedia.
    playbackRef.current ??= new ExaminerPlayback()
    playbackRef.current.unlock()
    try {
      voiceContextRef.current ??= createAudioContext()
      void voiceContextRef.current?.resume().catch(() => {})
    } catch { /* Recording and playback can work without audio metering. */ }
    if (!canRecordAudio()) {
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
      attachMicrophone(stream)
    } catch (error) {
      setAnswerError(microphoneError(error))
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
    setExaminerLabel(examiner.name)
    const greeting = firstStage?.conversational ? pickRandom(FRIENDLY_GREETINGS).replace(/Alex/g, examiner.name) : examinerGreeting(examiner.name)
    speakExaminer(greeting, () => {
      if (firstStage?.intro) {
        speakExaminer(firstStage.intro, () => advance())
      } else {
        advance()
      }
    })
  }, [config, advance, speakExaminer, attachMicrophone, examiner])

  const submitAnswer = useCallback(
    (text: string, durationSec: number) => {
      pushTurn('candidate', text.trim(), durationSec)
      answersRef.current = [...answersRef.current, analyseTranscript(text, durationSec)]
      moveIdxRef.current += 1
      const stage = stagesRef.current[stageIdxRef.current]
      const prevMove = stage?.moves[moveIdxRef.current - 1]
      if (prevMove?.type === 'cuecard') {
        setCueCard(null)
      }
      longTurnDeadlineRef.current = 0
      longTurnFinishedRef.current = true
      setSpeakLeft(0)
      advance()
    },
    [advance, pushTurn],
  )

  const stopAudioCapture = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current
    if (!recorder) return null
    try {
      const blob = await recorder.stop()
      return blob.size ? blob : null
    } finally { if (recorderRef.current === recorder) recorderRef.current = null }
  }, [])

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
    setRecordSeconds(0)
    setSpeechDetected(false)
    microphoneInterruptedRef.current = false
    const stream = micStreamRef.current
    if (!stream?.active || !stream.getAudioTracks().some((track) => track.readyState === 'live')) {
      setAnswerError('Microphone disconnected. Reconnect it, then retry this question.')
      return
    }
    try {
      recorderRef.current = new AnswerRecording(stream, () => {
        microphoneInterruptedRef.current = true
        stopForSilenceRef.current()
      })
    } catch {
      setAnswerError('Could not start audio capture. Check your microphone and retry.')
      return
    }
    recognition.reset()
    if (recognition.supported && canRecognizeWhileRecording()) recognition.start()
    recordStartRef.current = Date.now()
    if (cueCard) {
      longTurnDeadlineRef.current = recordStartRef.current + 120_000
      longTurnFinishedRef.current = false
      setSpeakLeft(120)
    }
    setRecording(true)
    captureLimitTimerRef.current = window.setTimeout(() => stopForSilenceRef.current(), cueCard ? 120_000 : 90_000)
    try {
      const context = voiceContextRef.current ?? createAudioContext()
      if (!context) return
      voiceContextRef.current = context
      void context.resume().catch(() => {})
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
        // A suspended audio context produces zeros, not microphone silence.
        if (context.state !== 'running' || document.hidden) return
        analyser.getFloatTimeDomainData(samples)
        let power = 0
        for (const sample of samples) power += sample * sample
        const rms = Math.sqrt(power / samples.length)
        if (!heardSpeech && Date.now() - recordStartRef.current < 1200 && rms < 0.025) {
          noiseFloor = noiseFloor * 0.85 + rms * 0.15
        }
        const voiced = rms > Math.max(0.006, noiseFloor * 2)
        speechFrames = voiced ? Math.min(5, speechFrames + 1) : Math.max(0, speechFrames - 1)
        if (speechFrames >= 3) {
          if (!heardSpeech) setSpeechDetected(true)
          heardSpeech = true
          lastSpeech = Date.now()
        }
        if (heardSpeech && Date.now() - lastSpeech > (cueCard ? 8500 : 6500)) stopForSilenceRef.current()
        // Do not discard a quiet answer because the meter missed the voice.
      }, 100)
    } catch {
      // The two-minute Part 2 limit remains active even if audio metering is unavailable.
    }
  }, [cueCard, recognition])

  const retryMicrophone = useCallback(async () => {
    if (stopPendingRef.current || beginPendingRef.current) return
    beginPendingRef.current = true
    setAnswerError(null)
    void voiceContextRef.current?.resume().catch(() => {})
    try {
      if (!micStreamRef.current?.active || !micStreamRef.current.getAudioTracks().some((track) => track.readyState === 'live')) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false,
        })
        if (disposedRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
        attachMicrophone(stream)
      }
      captureStartedRef.current = false
      if (cueCard) { longTurnDeadlineRef.current = Date.now() + 120_000; setSpeakLeft(120) }
      startRecording()
    } catch (error) {
      setAnswerError(microphoneError(error))
    } finally { beginPendingRef.current = false }
  }, [attachMicrophone, cueCard, startRecording])

  useEffect(() => {
    if (!recording) return
    const id = window.setInterval(() => setRecordSeconds(Math.floor((Date.now() - recordStartRef.current) / 1000)), 500)
    return () => window.clearInterval(id)
  }, [recording])

  useEffect(() => {
    if (!recording || (!recognition.interimTranscript && !recognition.finalTranscript)) return
    setSpeechDetected(true)
  }, [recording, recognition.interimTranscript, recognition.finalTranscript])

  const handleStopRecording = useCallback(async () => {
    if (stopPendingRef.current || !recorderRef.current) return
    stopPendingRef.current = true
    const version = sessionVersionRef.current
    const durationSec = Math.max(0.1, (Date.now() - recordStartRef.current) / 1000)
    longTurnFinishedRef.current = true
    stopVoiceDetection()
    setStopping(true)
    setRecording(false)
    const [browserText, audioBlob] = await Promise.all([recognition.stop(), stopAudioCapture().catch(() => null)])
    if (disposedRef.current || version !== sessionVersionRef.current) return
    let text = browserText.trim()
    let transcriptionFailed = false
    if (audioBlob) {
      pendingAnswerRef.current = { blob: audioBlob, duration: durationSec }
      if (pendingAudioUrlRef.current) URL.revokeObjectURL(pendingAudioUrlRef.current)
      pendingAudioUrlRef.current = URL.createObjectURL(audioBlob)
      setPendingAudioUrl(pendingAudioUrlRef.current)
      const controller = new AbortController()
      transcriptionAbortRef.current = controller
      try { text = (await transcribeAnswer(audioBlob, controller.signal)) || text }
      catch { transcriptionFailed = true }
    }
    if (disposedRef.current || version !== sessionVersionRef.current) return
    stopPendingRef.current = false
    setStopping(false)
    if (microphoneInterruptedRef.current) {
      setAnswerError('Recording was interrupted. Listen to your saved answer, then retry processing or record again.')
      return
    }
    if (!text) {
      setAnswerError(transcriptionFailed
        ? 'Your recording is saved, but transcription is unavailable. Listen to it and retry processing, or record again.'
        : 'No clear words were detected. Listen to your recording, then retry processing or record again.')
      return
    }
    setAnswerError(null)
    pendingAnswerRef.current = null
    setPendingAudioUrl(null)
    submitAnswer(text, durationSec)
  }, [cueCard, recognition, stopAudioCapture, stopVoiceDetection, submitAnswer])

  stopForSilenceRef.current = () => { void handleStopRecording() }

  const retryProcessing = useCallback(async () => {
    const pending = pendingAnswerRef.current
    if (!pending || stopPendingRef.current) return
    stopPendingRef.current = true
    const version = sessionVersionRef.current
    const controller = new AbortController()
    transcriptionAbortRef.current = controller
    setStopping(true)
    setAnswerError(null)
    try {
      const text = await transcribeAnswer(pending.blob, controller.signal)
      if (disposedRef.current || version !== sessionVersionRef.current) return
      if (!text) { setAnswerError('No clear words were detected. Listen to your recording and record again.'); return }
      pendingAnswerRef.current = null
      setPendingAudioUrl(null)
      submitAnswer(text, pending.duration)
    } catch {
      if (!disposedRef.current && version === sessionVersionRef.current) setAnswerError('Your recording is still saved. Processing is unavailable; try again when your connection returns.')
    } finally {
      if (!disposedRef.current && version === sessionVersionRef.current) { stopPendingRef.current = false; setStopping(false) }
    }
  }, [submitAnswer])

  useEffect(() => {
    const interrupt = () => {
      if (!document.hidden || !recorderRef.current || stopPendingRef.current) return
      microphoneInterruptedRef.current = true
      void handleStopRecording()
    }
    document.addEventListener('visibilitychange', interrupt)
    return () => document.removeEventListener('visibilitychange', interrupt)
  }, [handleStopRecording])

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
      if (recording) void handleStopRecording()
    }
    const id = window.setInterval(tick, 250)
    tick()
    return () => window.clearInterval(id)
  }, [cueCard, handleStopRecording, phase, recording, stopping, submitAnswer])

  const retrySession = useCallback(() => {
    cancelSpeech()
    sessionVersionRef.current++
    playbackRef.current?.cancel()
    transcriptionAbortRef.current?.abort()
    pendingAnswerRef.current = null
    if (pendingAudioUrlRef.current) URL.revokeObjectURL(pendingAudioUrlRef.current)
    pendingAudioUrlRef.current = null
    setPendingAudioUrl(null)
    setVoiceError(null)
    micStreamRef.current?.getTracks().forEach((track) => track.stop())
    micStreamRef.current = null
    setMicStream(null)
    stopVoiceDetection()
    if (voiceContextRef.current) void voiceContextRef.current.close().catch(() => {})
    voiceContextRef.current = null
    void recorderRef.current?.stop()
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
    setLogOffset(0)
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
            <h2>Step into the<br />speaking room.</h2>
            <p>Listen to the examiner and answer naturally. Recording starts automatically, and you can finish a turn early when you are done.</p>
            <div className="speaking-start-examiner"><span className="speaking-start-examiner-avatar">{examiner.name[0]}</span><span><strong>{examiner.name}</strong><small>AI examiner · English voice</small></span><span className="speaking-start-examiner-wave" aria-hidden><i /><i /><i /><i /><i /></span></div>
            <div className="speaking-start-features"><span><AudioLines className="h-4 w-4" /> Natural questions</span><span><Mic className="h-4 w-4" /> Automatic recording</span><span><CheckCircle2 className="h-4 w-4" /> Band estimate</span></div>
          </section>
          <section className="speaking-start-guide">
            <p className="speaking-eyebrow">Before you begin</p>
            <h3>{config.mode === 'full_mock' ? 'Three parts. One conversation.' : 'Get ready to speak.'}</h3>
            {config.mode === 'full_mock' ? <div className="speaking-start-parts" aria-label="Speaking test structure"><div><span>01</span><strong>Interview</strong><small>Familiar topics · 4–5 min</small></div><div><span>02</span><strong>Long turn</strong><small>1 min prep · 2 min maximum</small></div><div><span>03</span><strong>Discussion</strong><small>Related ideas · 4–5 min</small></div></div> : null}
            <div className="speaking-start-tip"><span><Volume2 className="h-4 w-4" /></span><div><strong>Listen first</strong><p>Your microphone starts after the examiner finishes speaking.</p></div></div>
            <div className="speaking-start-tip"><span><Mic className="h-4 w-4" /></span><div><strong>Speak freely</strong><p>Recording ends after a short pause. No buttons are needed.</p></div></div>
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
  const visibleLogStart = Math.max(0, chat.length - 3 - logOffset * 3)
  const visibleTurns = chat.slice(visibleLogStart, visibleLogStart + 3)

  return (
    <div className="speaking-exam speaking-exam-v2 mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6">
      <header className="speaking-session-header">
        <button onClick={onExit} className="speaking-icon-button" aria-label="End session"><ArrowLeft className="h-5 w-5" /></button>
        <span className="speaking-session-mark"><Mic className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="speaking-eyebrow">IELTS Speaking <span className="speaking-header-divider">/</span> AI examiner</p>
          <h1 className="truncate text-lg font-black tracking-tight text-slate-950 sm:text-xl">{modeLabel}</h1>
        </div>
        <span className="speaking-header-status"><span /> {recording ? 'Recording your answer' : phase === 'examiner_speaking' ? 'Examiner speaking' : 'Session in progress'}</span>
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
          <div><h2>Session log</h2><p>Questions and captured turns</p></div>
          <span className="speaking-turn-count">{answeredCount} {answeredCount === 1 ? 'answer' : 'answers'}</span>
        </div>
        <div className="speaking-conversation" role="log" aria-live="polite" aria-relevant="additions text">
        {visibleTurns.map((turn) => (
          <motion.div
            key={turn.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`speaking-turn ${turn.role === 'candidate' ? 'speaking-turn--candidate' : 'speaking-turn--examiner'}`}
          >
            <span className="speaking-turn-avatar" aria-hidden>{turn.role === 'candidate' ? <Mic className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}</span>
            <div className="speaking-turn-bubble">
              <span className="speaking-turn-name">{turn.role === 'candidate' ? 'You' : examinerLabel}</span>
              <p>{turn.role === 'candidate' ? (turn.text ? 'Spoken answer captured' : 'No clear speech captured') : turn.text}</p>
              {turn.role === 'candidate' && turn.durationSec ? <span className="speaking-answer-duration">{formatClock(Math.round(turn.durationSec))} recorded</span> : null}
            </div>
          </motion.div>
        ))}

        {answeredCount === 0 ? <div className="speaking-transcript-empty"><span><Headphones className="h-5 w-5" /></span><strong>Stay with the conversation</strong><p>Your spoken answers will appear here as captured turns. Keep your attention on the examiner’s question.</p></div> : null}


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
        <div className="speaking-transcript-footer"><ShieldCheck className="h-3.5 w-3.5" /><span>All turns are saved for review</span>{chat.length > 3 ? <div className="speaking-log-nav"><button type="button" onClick={() => setLogOffset((offset) => Math.min(offset + 1, Math.ceil(chat.length / 3) - 1))} disabled={visibleLogStart === 0} aria-label="Earlier turns"><ChevronLeft className="h-4 w-4" /></button><span>{visibleLogStart + 1}–{Math.min(chat.length, visibleLogStart + 3)} / {chat.length}</span><button type="button" onClick={() => setLogOffset((offset) => Math.max(0, offset - 1))} disabled={logOffset === 0} aria-label="Later turns"><ChevronRight className="h-4 w-4" /></button></div> : null}</div>
      </section>

      <section className="speaking-focus-panel" aria-label="Current question and response controls">
        <div className="speaking-panel-heading speaking-panel-heading--focus">
          <span className="speaking-panel-icon"><Headphones className="h-[18px] w-[18px]" /></span>
          <div><h2>{canRecord ? 'Your turn' : 'Examiner room'}</h2><p>{canRecord ? 'Respond to the question below' : 'Listen and get ready to respond'}</p></div>
          <span className={`speaking-phase-chip ${recording ? 'is-recording' : answerError ? 'is-error' : ''}`}><span />{recording ? 'Recording' : answerError ? 'Mic check' : phase === 'preparing' ? 'Preparing' : isExaminerBusy ? 'Examiner live' : canRecord ? 'Ready' : 'In progress'}</span>
        </div>
        <div className="speaking-focus-content">
          <div className={`speaking-examiner-stage ${phase === 'examiner_speaking' ? 'is-speaking' : ''} ${recording ? 'is-listening' : ''}`}>
            <div className="speaking-examiner-avatar" aria-hidden><span>{examiner.name[0]}</span><i /></div>
            <div className="speaking-examiner-identity"><span>YOUR EXAMINER</span><strong>{examiner.name}</strong><small>{voiceSource === 'neural' ? 'Natural AI voice' : voiceSource === 'device' ? 'English device voice' : 'English voice'}</small></div>
            <div className="speaking-examiner-state"><span className="speaking-examiner-state-icon">{voiceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : recording || answerError ? <Mic className="h-4 w-4" /> : phase === 'examiner_speaking' ? <Volume2 className="h-4 w-4" /> : <AudioLines className="h-4 w-4" />}</span><span>{voiceLoading ? 'Preparing the question' : voiceError ? 'Tap to resume examiner audio' : stopping ? 'Processing answer' : answerError ? pendingAudioUrl ? 'Recording saved · retry processing' : 'Microphone needs attention' : recording ? 'Listening to you' : phase === 'examiner_speaking' ? 'Asking a question' : phase === 'preparing' ? 'Preparation time' : phase === 'thinking' ? 'Preparing the next question' : 'In the exam room'}</span></div>
          </div>
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

          <div className={`speaking-response-station ${recording ? 'is-live' : ''}`}>
            <div className="speaking-response-title"><span className="speaking-response-icon"><AudioLines className="h-[18px] w-[18px]" /></span><div><h3>Your response</h3><p>Voice answer</p></div></div>
            {isExaminerBusy ? (
              <div className="speaking-wait-state"><div className="speaking-wait-orb"><AudioLines className="h-7 w-7" /></div><strong>{voiceError ? 'Examiner audio paused' : phase === 'thinking' ? 'Preparing the next question…' : 'Examiner is speaking…'}</strong><p>Take a moment to listen before you answer.</p>
                {voiceError ? <><p role="alert" className="speaking-inline-error">{voiceError}</p><button className="speaking-record-button" onClick={() => { setVoiceError(null); if (playbackRef.current?.canResume) playbackRef.current.resume(); else promptReplayRef.current?.(false) }}><Volume2 className="h-4 w-4" /> Play examiner</button><button className="speaking-text-switch" onClick={() => promptReplayRef.current?.(true)}>Use matching device voice</button></> : null}
              </div>
            ) : canRecord ? (
              <div className="speaking-input-state">
                <div className={`speaking-waveform ${recording ? 'is-recording' : ''}`}><span className="speaking-waveform-icon"><Mic className="h-6 w-6" /></span><MicVisualizer stream={micStream} active={recording} bars={24} audioContext={voiceContextRef.current} /><span className="speaking-waveform-label">{stopping ? 'Processing your answer…' : answerError ? pendingAudioUrl ? 'Recording saved' : 'Recording needs attention' : recording ? speechDetected ? 'Voice detected' : 'Listening for your voice' : 'Microphone ready'}</span>{recording || stopping ? <span className="speaking-record-clock">{formatClock(recordSeconds)}</span> : null}</div>
                <p className="speaking-record-hint">{stopping ? 'Processing your saved recording.' : answerError ? pendingAudioUrl ? 'Listen to your saved answer below.' : 'Check your microphone, then retry this question.' : recording ? speechDetected ? 'Keep speaking naturally. Your turn ends after a short pause.' : 'Start speaking whenever you are ready.' : 'Recording starts automatically when the examiner finishes.'}</p>
                {recording ? <button type="button" className="speaking-finish-answer" onClick={() => void handleStopRecording()}><Square className="h-3 w-3 fill-current" /> Finish answer</button> : null}
                {answerError ? <p role="alert" className="speaking-inline-error">{answerError}</p> : null}
                {pendingAudioUrl && !recording ? <audio controls preload="metadata" src={pendingAudioUrl} className="mt-3 w-full" aria-label="Your saved answer" /> : null}
                {pendingAudioUrl && answerError ? <button disabled={stopping} onClick={() => void retryProcessing()} className="speaking-record-button">Retry processing saved answer</button> : null}
                {answerError ? <button disabled={stopping} onClick={() => void retryMicrophone()} className="speaking-record-button">{pendingAudioUrl ? 'Record this answer again' : 'Retry microphone'}</button> : null}
              </div>
            ) : (
              <div className="speaking-wait-state"><div className="speaking-wait-orb"><Loader2 className="h-7 w-7 animate-spin" /></div><strong>{phase === 'evaluating' ? 'Preparing your feedback…' : 'Get ready to answer'}</strong><p>{phase === 'preparing' ? 'Use this time to plan your long turn.' : 'Your next prompt is coming up.'}</p></div>
            )}
          </div>
          {evalError ? <p role="alert" className="speaking-inline-error">{evalError}</p> : null}
        </div>
        <div className="speaking-focus-footer"><CheckCircle2 className="h-4 w-4" /> Detailed feedback and an estimated band appear after the session.</div>
      </section>
      </main>
    </div>
  )
}
