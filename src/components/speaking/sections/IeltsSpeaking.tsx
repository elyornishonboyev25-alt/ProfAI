import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Eye, EyeOff, Mic, Pause, Play, Square, Timer } from 'lucide-react'
import {
  CUE_CARDS,
  PART1_TOPICS,
  PART3_THEMES,
  PART_LABELS,
  type Part2Card,
} from '@/data/ieltsSpeakingQuestionBank'

type Part = 1 | 2 | 3

// IELTS Speaking practice library — Part 1/2/3 questions with model sample answers
// hidden behind a toggle. No AI: this is a self-study reference + practice space.
export default function IeltsSpeaking() {
  const [part, setPart] = useState<Part>(1)

  return (
    <div className="space-y-5">
      <div className="surface-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-900">
            <BookOpen className="h-5 w-5 text-red-600" /> IELTS Speaking Library
          </h2>
          <span className="soft-chip">Questions + model answers</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Practise real exam-style questions. Each one has a hidden Band 8 model answer — try answering aloud first, then
          reveal it to compare.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {([1, 2, 3] as Part[]).map((p) => (
            <button
              key={p}
              onClick={() => setPart(p)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                part === p
                  ? 'border-red-300 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_8px_20px_rgba(220,38,38,0.28)]'
                  : 'border-red-200 bg-white text-slate-700 hover:border-red-300'
              }`}
            >
              Part {p}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">{PART_LABELS[part]}</p>
      </div>

      {part === 1 ? <Part1View /> : part === 3 ? <Part3View /> : <Part2View />}
    </div>
  )
}

// ── Part 1 ────────────────────────────────────────────────────────────────────
function Part1View() {
  const [topicId, setTopicId] = useState(PART1_TOPICS[0].id)
  const topic = PART1_TOPICS.find((t) => t.id === topicId) ?? PART1_TOPICS[0]
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <TopicList
        items={PART1_TOPICS.map((t) => ({ id: t.id, label: t.topic, icon: t.icon }))}
        activeId={topicId}
        onSelect={setTopicId}
      />
      <div className="space-y-3">
        {topic.questions.map((qa, i) => (
          <QACard key={i} index={i + 1} question={qa.q} sample={qa.sample} />
        ))}
      </div>
    </div>
  )
}

// ── Part 3 ────────────────────────────────────────────────────────────────────
function Part3View() {
  const [themeId, setThemeId] = useState(PART3_THEMES[0].id)
  const theme = PART3_THEMES.find((t) => t.id === themeId) ?? PART3_THEMES[0]
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <TopicList
        items={PART3_THEMES.map((t) => ({ id: t.id, label: t.theme }))}
        activeId={themeId}
        onSelect={setThemeId}
      />
      <div className="space-y-3">
        {theme.questions.map((qa, i) => (
          <QACard key={i} index={i + 1} question={qa.q} sample={qa.sample} />
        ))}
      </div>
    </div>
  )
}

// ── Part 2 ────────────────────────────────────────────────────────────────────
function Part2View() {
  const [cardId, setCardId] = useState(CUE_CARDS[0].id)
  const card = CUE_CARDS.find((c) => c.id === cardId) ?? CUE_CARDS[0]
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <TopicList
        items={CUE_CARDS.map((c) => ({ id: c.id, label: c.title.replace('Describe ', '') }))}
        activeId={cardId}
        onSelect={setCardId}
      />
      <CueCardPractice card={card} />
    </div>
  )
}

function CueCardPractice({ card }: { card: Part2Card }) {
  const [revealed, setRevealed] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'prep' | 'speak'>('idle')
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<number | null>(null)

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }
  const runTimer = (from: number, onZero: () => void) => {
    stopTimer()
    setSeconds(from)
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          stopTimer()
          onZero()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }
  const startPrep = () => { setPhase('prep'); setRevealed(false); runTimer(60, () => startSpeak()) }
  const startSpeak = () => { setPhase('speak'); runTimer(120, () => setPhase('idle')) }
  const reset = () => { stopTimer(); setPhase('idle'); setSeconds(0) }

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface-card border-red-200 p-5">
        <div className="flex items-center justify-between">
          <p className="text-lg font-black text-slate-900">{card.title}</p>
          {phase !== 'idle' ? (
            <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${phase === 'prep' ? 'bg-amber-500' : 'bg-red-600'}`}>
              {phase === 'prep' ? `Prep ${seconds}s` : `Speak ${seconds}s`}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-red-600">You should say:</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {card.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          {phase === 'idle' ? (
            <button onClick={startPrep} className="arena-primary-btn text-sm">
              <Timer className="mr-1.5 h-4 w-4" /> Start 1-min prep
            </button>
          ) : (
            <button onClick={reset} className="arena-secondary-btn text-sm">Reset timer</button>
          )}
          {phase === 'prep' ? (
            <button onClick={startSpeak} className="arena-secondary-btn text-sm">Skip to speaking</button>
          ) : null}
        </div>
      </motion.div>

      <SelfRecorder />

      <SampleToggle revealed={revealed} onToggle={() => setRevealed((v) => !v)} sample={card.sample} />

      <div className="surface-card p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rounding-off question</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{card.followUp}</p>
      </div>
    </div>
  )
}

// ── Shared pieces ─────────────────────────────────────────────────────────────
function TopicList({
  items,
  activeId,
  onSelect,
}: {
  items: Array<{ id: string; label: string; icon?: string }>
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="surface-card max-h-[60vh] space-y-1 overflow-y-auto p-2">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onSelect(it.id)}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
            activeId === it.id ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white' : 'text-slate-700 hover:bg-red-50'
          }`}
        >
          {it.icon ? <span>{it.icon}</span> : null}
          <span className="truncate capitalize">{it.label}</span>
        </button>
      ))}
    </div>
  )
}

function QACard({ index, question, sample }: { index: number; question: string; sample: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-black text-red-700">
          {index}
        </span>
        <p className="flex-1 text-sm font-semibold leading-6 text-slate-900">{question}</p>
      </div>
      <SampleToggle revealed={revealed} onToggle={() => setRevealed((v) => !v)} sample={sample} compact />
    </motion.div>
  )
}

function SampleToggle({ revealed, onToggle, sample, compact }: { revealed: boolean; onToggle: () => void; sample: string; compact?: boolean }) {
  return (
    <div className={compact ? 'mt-3 pl-10' : ''}>
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {revealed ? 'Hide sample answer' : 'Show sample answer'}
      </button>
      {revealed ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3"
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Model answer · Band 8</p>
          <p className="text-sm leading-7 text-slate-700">{sample}</p>
        </motion.div>
      ) : null}
    </div>
  )
}

// Optional self-recording (record yourself → play it back). No scoring.
function SelfRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [unsupported, setUnsupported] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = async () => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setUnsupported(true)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(blob)
        })
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch {
      setUnsupported(true)
    }
  }
  const stop = () => {
    recorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="surface-card flex flex-wrap items-center gap-3 p-4">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-600">
        <Mic className="h-4 w-4" /> Record yourself
      </span>
      {!recording ? (
        <button onClick={() => void start()} className="arena-secondary-btn text-sm">
          <Play className="mr-1.5 h-3.5 w-3.5" /> Record
        </button>
      ) : (
        <button onClick={stop} className="arena-primary-btn bg-gradient-to-r from-slate-800 to-slate-700 text-sm">
          <Square className="mr-1.5 h-3.5 w-3.5 fill-white" /> Stop
        </button>
      )}
      {audioUrl ? (
        <audio controls src={audioUrl} className="h-9 max-w-[260px] flex-1">
          <track kind="captions" />
        </audio>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Pause className="h-3.5 w-3.5" /> {unsupported ? 'Recording not supported here' : 'Record to compare with the model answer'}
        </span>
      )}
    </div>
  )
}
