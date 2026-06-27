import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  Headphones,
  Lightbulb,
  Mic,
  PenSquare,
  Play,
  RotateCcw,
  Square,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react'
import { getToeflTest, type ToeflChoiceQuestion } from '@/data/toefl/toeflTests'

type Step = 'intro' | 'reading' | 'listening' | 'speaking' | 'writing' | 'results'

const STEP_ORDER: Step[] = ['reading', 'listening', 'speaking', 'writing', 'results']

const STEP_META: Record<Exclude<Step, 'intro'>, { label: string; icon: typeof BookOpen }> = {
  reading: { label: 'Reading', icon: BookOpen },
  listening: { label: 'Listening', icon: Headphones },
  speaking: { label: 'Speaking', icon: Mic },
  writing: { label: 'Writing', icon: PenSquare },
  results: { label: 'Results', icon: Trophy },
}

const EASE = [0.22, 1, 0.36, 1] as const

function scaleTo30(correct: number, total: number) {
  if (total === 0) return 0
  return Math.round((correct / total) * 30)
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function cefrFromPercent(pct: number) {
  if (pct >= 0.9) return 'C1 / C2'
  if (pct >= 0.75) return 'B2+'
  if (pct >= 0.6) return 'B2'
  if (pct >= 0.4) return 'B1'
  return 'A2 / B1'
}

/* ── Multiple-choice question ──────────────────────────────────────────── */

function ChoiceQuestion({
  index,
  question,
  selected,
  onSelect,
  reveal,
}: {
  index: number
  question: ToeflChoiceQuestion
  selected: number | undefined
  onSelect: (i: number) => void
  reveal?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-800">
        <span className="text-teal-600">{index + 1}.</span> {question.prompt}
      </p>
      <div className="mt-3 space-y-2">
        {question.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === question.answerIndex
          let tone = 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/40'
          if (reveal) {
            if (isCorrect) tone = 'border-green-300 bg-green-50 text-green-800'
            else if (isSelected) tone = 'border-red-300 bg-red-50 text-red-700'
            else tone = 'border-slate-200 bg-white text-slate-400'
          } else if (isSelected) {
            tone = 'border-teal-400 bg-teal-50 text-teal-800'
          }
          return (
            <button
              key={i}
              type="button"
              disabled={reveal}
              onClick={() => onSelect(i)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition ${tone}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-black">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {reveal && isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : null}
              {reveal && isSelected && !isCorrect ? <XCircle className="h-4 w-4 text-red-500" /> : null}
            </button>
          )
        })}
      </div>
      {reveal && question.explanation ? (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[12px] leading-5 text-slate-600">
          <span className="font-bold text-slate-700">Why:</span> {question.explanation}
        </p>
      ) : null}
    </div>
  )
}

/* ── Speaking task runner ──────────────────────────────────────────────── */

function SpeakingTaskCard({
  task,
  onComplete,
}: {
  task: { id: string; kind: string; title: string; prompt: string; prepSeconds: number; responseSeconds: number; tips: string[] }
  onComplete: () => void
}) {
  type Phase = 'ready' | 'prep' | 'respond' | 'done'
  const [phase, setPhase] = useState<Phase>('ready')
  const [remaining, setRemaining] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Reset everything when the task changes.
  useEffect(() => {
    setPhase('ready')
    setRemaining(0)
    setAudioUrl(null)
    setRecording(false)
  }, [task.id])

  // Countdown driver for prep / respond phases.
  useEffect(() => {
    if (phase !== 'prep' && phase !== 'respond') return
    if (remaining <= 0) return
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => window.clearTimeout(id)
  }, [phase, remaining])

  const stopRecording = useCallback(() => {
    try {
      recorderRef.current?.stop()
    } catch {
      /* ignore */
    }
    setRecording(false)
  }, [])

  // When a timed phase hits zero, advance.
  useEffect(() => {
    if (remaining !== 0) return
    if (phase === 'prep') {
      setRemaining(task.responseSeconds)
      setPhase('respond')
    } else if (phase === 'respond') {
      stopRecording()
      setPhase('done')
    }
  }, [remaining, phase, task.responseSeconds, stopRecording])

  const startPrep = () => {
    setRemaining(task.prepSeconds)
    setPhase('prep')
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
      }
      recorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch {
      // Mic blocked/unavailable — the timed practice still works without it.
    }
  }

  const total = phase === 'prep' ? task.prepSeconds : task.responseSeconds
  const pct = total > 0 ? (remaining / total) * 100 : 0

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-black text-teal-700">{task.kind}</span>
        <span className="text-[11px] font-bold text-slate-400">
          Prep {task.prepSeconds}s · Speak {task.responseSeconds}s
        </span>
      </div>
      <h3 className="mt-3 text-base font-black tracking-tight text-slate-900">{task.title}</h3>
      <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] leading-6 text-slate-600">{task.prompt}</p>

      {/* Phase UI */}
      <div className="mt-4">
        {phase === 'ready' ? (
          <button
            onClick={startPrep}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(13,148,136,0.28)] transition hover:bg-teal-700"
          >
            <Play className="h-4 w-4" /> Start prep time
          </button>
        ) : null}

        {phase === 'prep' || phase === 'respond' ? (
          <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-black ${phase === 'respond' ? 'text-red-600' : 'text-teal-700'}`}>
                {phase === 'prep' ? 'Preparation' : 'Speak now'}
              </span>
              <span className="font-mono text-lg font-black text-slate-900">{fmtTime(remaining)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <motion.div
                className={`h-full rounded-full ${phase === 'respond' ? 'bg-red-500' : 'bg-teal-500'}`}
                animate={{ width: `${pct}%` }}
                transition={{ ease: 'linear', duration: 0.9 }}
              />
            </div>
            {phase === 'respond' ? (
              <div className="mt-3 flex items-center gap-2">
                {!recording ? (
                  <button
                    onClick={startRecording}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-50"
                  >
                    <Mic className="h-3.5 w-3.5" /> Record (optional)
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-bold text-white"
                  >
                    <Square className="h-3.5 w-3.5" /> Stop
                  </button>
                )}
                <button
                  onClick={() => {
                    stopRecording()
                    setRemaining(0)
                    setPhase('done')
                  }}
                  className="text-[12px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Skip
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {phase === 'done' ? (
          <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-black text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Response complete
            </p>
            {audioUrl ? (
              <audio controls src={audioUrl} className="mt-3 w-full" />
            ) : (
              <p className="mt-1 text-[12px] text-slate-500">Tip: enable the mic next time to record and review your answer.</p>
            )}
          </div>
        ) : null}
      </div>

      {/* Tips */}
      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-amber-700">
          <Lightbulb className="h-3.5 w-3.5" /> Model tips
        </p>
        <ul className="mt-1.5 space-y-1">
          {task.tips.map((tip) => (
            <li key={tip} className="text-[12px] leading-5 text-amber-800/90">• {tip}</li>
          ))}
        </ul>
      </div>

      {phase === 'done' ? (
        <button
          onClick={onComplete}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

/* ── Writing task ──────────────────────────────────────────────────────── */

function WritingTaskCard({
  task,
  value,
  onChange,
}: {
  task: { id: string; kind: string; title: string; prompt: string; minutes: number; minWords: number; tips: string[] }
  value: string
  onChange: (v: string) => void
}) {
  const [remaining, setRemaining] = useState(task.minutes * 60)
  const [running, setRunning] = useState(false)
  const words = countWords(value)

  useEffect(() => {
    setRemaining(task.minutes * 60)
    setRunning(false)
  }, [task.id, task.minutes])

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => window.clearTimeout(id)
  }, [running, remaining])

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-black text-teal-700">{task.kind}</span>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-black ${remaining <= 30 ? 'text-red-600' : 'text-slate-700'}`}>
            <Clock3 className="mr-1 inline h-3.5 w-3.5" />
            {fmtTime(remaining)}
          </span>
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
          >
            {running ? 'Pause' : 'Start timer'}
          </button>
        </div>
      </div>
      <h3 className="mt-3 text-base font-black tracking-tight text-slate-900">{task.title}</h3>
      <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] leading-6 text-slate-600">{task.prompt}</p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your response here…"
        rows={9}
        className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
      />
      <div className="mt-1.5 flex items-center justify-between text-[12px] font-semibold">
        <span className={words >= task.minWords ? 'text-green-600' : 'text-slate-400'}>
          {words} words {words >= task.minWords ? '✓' : `(aim ${task.minWords}+)`}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-amber-700">
          <Lightbulb className="h-3.5 w-3.5" /> Rubric tips
        </p>
        <ul className="mt-1.5 space-y-1">
          {task.tips.map((tip) => (
            <li key={tip} className="text-[12px] leading-5 text-amber-800/90">• {tip}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function TOEFLTest() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const test = useMemo(() => getToeflTest(id ?? ''), [id])

  const [step, setStep] = useState<Step>('intro')
  const [readingAnswers, setReadingAnswers] = useState<Record<string, number>>({})
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, number>>({})
  const [speakingIndex, setSpeakingIndex] = useState(0)
  const [writingDrafts, setWritingDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  if (!test) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#eef9f8] px-4 text-center">
        <p className="text-lg font-black text-slate-800">Test not found.</p>
        <button onClick={() => navigate('/toefl')} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white">
          Back to TOEFL
        </button>
      </div>
    )
  }

  const readingCorrect = test.reading.questions.filter((q) => readingAnswers[q.id] === q.answerIndex).length
  const listeningCorrect = test.listening.questions.filter((q) => listeningAnswers[q.id] === q.answerIndex).length
  const readingScore = scaleTo30(readingCorrect, test.reading.questions.length)
  const listeningScore = scaleTo30(listeningCorrect, test.listening.questions.length)
  const subtotal = readingScore + listeningScore
  const pct = (readingCorrect + listeningCorrect) / (test.reading.questions.length + test.listening.questions.length)

  const goNext = (current: Exclude<Step, 'intro' | 'results'>) => {
    const i = STEP_ORDER.indexOf(current)
    setStep(STEP_ORDER[i + 1])
  }

  const currentIndex = step === 'intro' ? -1 : STEP_ORDER.indexOf(step)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef9f8] to-[#e3f3f5]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-teal-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/toefl')}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Exit
          </button>
          <div className="flex items-center gap-1.5">
            {STEP_ORDER.map((s, i) => {
              const Meta = STEP_META[s as Exclude<Step, 'intro'>]
              const done = currentIndex > i
              const active = currentIndex === i
              const Icon = Meta.icon
              return (
                <div
                  key={s}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                    active ? 'bg-teal-600 text-white' : done ? 'bg-teal-50 text-teal-700' : 'text-slate-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{Meta.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
        >
            {/* INTRO */}
            {step === 'intro' ? (
              <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-sm sm:p-8">
                <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-teal-700">
                  {test.level}
                </span>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{test.title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">{test.blurb}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {(['reading', 'listening', 'speaking', 'writing'] as const).map((s) => {
                    const Meta = STEP_META[s]
                    const Icon = Meta.icon
                    const detail =
                      s === 'reading'
                        ? `${test.reading.questions.length} questions · scored 0–30`
                        : s === 'listening'
                          ? `${test.listening.questions.length} questions · scored 0–30`
                          : s === 'speaking'
                            ? `${test.speaking.length} tasks · timed`
                            : `${test.writing.length} tasks · timed`
                    return (
                      <div key={s} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-900">{Meta.label}</p>
                          <p className="text-[12px] text-slate-500">{detail}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => setStep('reading')}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(13,148,136,0.3)] transition hover:-translate-y-0.5"
                >
                  Begin test <ArrowRight className="h-4 w-4" />
                </button>
              </section>
            ) : null}

            {/* READING */}
            {step === 'reading' ? (
              <section className="space-y-4">
                <SectionHeading icon={BookOpen} title={test.reading.title} note={test.reading.source} />
                <article className="rounded-2xl border border-slate-100 bg-white p-5 text-[14px] leading-7 text-slate-700 shadow-sm">
                  {test.reading.passage.map((p, i) => (
                    <p key={i} className={i > 0 ? 'mt-3' : ''}>
                      {p}
                    </p>
                  ))}
                </article>
                <div className="space-y-3">
                  {test.reading.questions.map((q, i) => (
                    <ChoiceQuestion
                      key={q.id}
                      index={i}
                      question={q}
                      selected={readingAnswers[q.id]}
                      onSelect={(v) => setReadingAnswers((a) => ({ ...a, [q.id]: v }))}
                    />
                  ))}
                </div>
                <ContinueBar
                  answered={Object.keys(readingAnswers).length}
                  total={test.reading.questions.length}
                  onContinue={() => goNext('reading')}
                  label="Continue to Listening"
                />
              </section>
            ) : null}

            {/* LISTENING */}
            {step === 'listening' ? (
              <section className="space-y-4">
                <SectionHeading icon={Headphones} title={test.listening.title} note="Read the lecture as if listening, then answer" />
                <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-bold text-teal-700">
                    <Headphones className="h-3.5 w-3.5" /> {test.listening.context}
                  </p>
                  <div className="text-[14px] leading-7 text-slate-700">
                    {test.listening.transcript.map((p, i) => (
                      <p key={i} className={i > 0 ? 'mt-3' : ''}>
                        {p}
                      </p>
                    ))}
                  </div>
                </article>
                <div className="space-y-3">
                  {test.listening.questions.map((q, i) => (
                    <ChoiceQuestion
                      key={q.id}
                      index={i}
                      question={q}
                      selected={listeningAnswers[q.id]}
                      onSelect={(v) => setListeningAnswers((a) => ({ ...a, [q.id]: v }))}
                    />
                  ))}
                </div>
                <ContinueBar
                  answered={Object.keys(listeningAnswers).length}
                  total={test.listening.questions.length}
                  onContinue={() => goNext('listening')}
                  label="Continue to Speaking"
                />
              </section>
            ) : null}

            {/* SPEAKING */}
            {step === 'speaking' ? (
              <section className="space-y-4">
                <SectionHeading
                  icon={Mic}
                  title="Speaking"
                  note={`Task ${speakingIndex + 1} of ${test.speaking.length}`}
                />
                <SpeakingTaskCard
                  key={test.speaking[speakingIndex].id}
                  task={test.speaking[speakingIndex]}
                  onComplete={() => {
                    if (speakingIndex < test.speaking.length - 1) setSpeakingIndex((i) => i + 1)
                    else goNext('speaking')
                  }}
                />
                <button
                  onClick={() => (speakingIndex < test.speaking.length - 1 ? setSpeakingIndex((i) => i + 1) : goNext('speaking'))}
                  className="text-[12px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Skip this task →
                </button>
              </section>
            ) : null}

            {/* WRITING */}
            {step === 'writing' ? (
              <section className="space-y-4">
                <SectionHeading icon={PenSquare} title="Writing" note={`${test.writing.length} tasks`} />
                {test.writing.map((task) => (
                  <WritingTaskCard
                    key={task.id}
                    task={task}
                    value={writingDrafts[task.id] ?? ''}
                    onChange={(v) => setWritingDrafts((d) => ({ ...d, [task.id]: v }))}
                  />
                ))}
                <ContinueBar answered={1} total={1} onContinue={() => setStep('results')} label="Finish & see score" hideCount />
              </section>
            ) : null}

            {/* RESULTS */}
            {step === 'results' ? (
              <section className="space-y-5">
                <div className="overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-600 to-cyan-600 p-6 text-white shadow-[0_22px_50px_rgba(13,148,136,0.3)] sm:p-8">
                  <p className="flex items-center gap-2 text-sm font-bold text-teal-50">
                    <Trophy className="h-4 w-4" /> Test complete
                  </p>
                  <div className="mt-3 flex flex-wrap items-end gap-6">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-teal-100">Scored sections (R + L)</p>
                      <p className="text-5xl font-black tracking-tight">
                        {subtotal}
                        <span className="text-2xl text-teal-100">/60</span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-4 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-teal-100">Est. level</p>
                      <p className="text-xl font-black">{cefrFromPercent(pct)}</p>
                    </div>
                  </div>
                  <p className="mt-3 max-w-lg text-[12px] leading-5 text-teal-50/90">
                    Reading and Listening are auto-scored. Speaking and Writing are timed practice — record/submit them to your
                    teacher or the AI coach for the remaining 60 points.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ScoreCard icon={BookOpen} label="Reading" correct={readingCorrect} total={test.reading.questions.length} score={readingScore} />
                  <ScoreCard
                    icon={Headphones}
                    label="Listening"
                    correct={listeningCorrect}
                    total={test.listening.questions.length}
                    score={listeningScore}
                  />
                </div>

                {/* Review answers */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                    <Target className="h-4 w-4 text-teal-600" /> Reading review
                  </h3>
                  {test.reading.questions.map((q, i) => (
                    <ChoiceQuestion key={q.id} index={i} question={q} selected={readingAnswers[q.id]} onSelect={() => {}} reveal />
                  ))}
                  <h3 className="flex items-center gap-2 pt-2 text-base font-black text-slate-900">
                    <Target className="h-4 w-4 text-teal-600" /> Listening review
                  </h3>
                  {test.listening.questions.map((q, i) => (
                    <ChoiceQuestion key={q.id} index={i} question={q} selected={listeningAnswers[q.id]} onSelect={() => {}} reveal />
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setReadingAnswers({})
                      setListeningAnswers({})
                      setWritingDrafts({})
                      setSpeakingIndex(0)
                      setStep('intro')
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" /> Retake
                  </button>
                  <button
                    onClick={() => navigate('/toefl')}
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700"
                  >
                    More TOEFL tests <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>
            ) : null}
        </motion.div>
      </main>
    </div>
  )
}

/* ── Small shared bits ─────────────────────────────────────────────────── */

function SectionHeading({ icon: Icon, title, note }: { icon: typeof BookOpen; title: string; note: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-[0_8px_18px_rgba(13,148,136,0.3)]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
        <p className="text-[12px] font-semibold text-slate-500">{note}</p>
      </div>
    </div>
  )
}

function ContinueBar({
  answered,
  total,
  onContinue,
  label,
  hideCount,
}: {
  answered: number
  total: number
  onContinue: () => void
  label: string
  hideCount?: boolean
}) {
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-white/90 px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.1)] backdrop-blur">
      {!hideCount ? (
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
          {answered >= total ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
          {answered}/{total} answered
        </span>
      ) : (
        <span />
      )}
      <button
        onClick={onContinue}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(13,148,136,0.3)] transition hover:-translate-y-0.5"
      >
        {label} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function ScoreCard({
  icon: Icon,
  label,
  correct,
  total,
  score,
}: {
  icon: typeof BookOpen
  label: string
  correct: number
  total: number
  score: number
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
          <Icon className="h-4 w-4 text-teal-600" /> {label}
        </span>
        <span className="text-2xl font-black text-teal-600">
          {score}
          <span className="text-sm text-slate-400">/30</span>
        </span>
      </div>
      <p className="mt-1 text-[12px] font-semibold text-slate-500">
        {correct} of {total} correct
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${(correct / total) * 100}%` }} />
      </div>
    </div>
  )
}
