import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Eye,
  Gem,
  Keyboard,
  Layers,
  Link2,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Sparkles,
  Square,
  Trophy,
  Volume2,
  X,
} from 'lucide-react'
import { Burst } from '@/components/fx'
import type { VocabularyEntry } from '@/data/vocabularyCollections'

export type ActivityMode = 'flashcards' | 'matching' | 'quiz' | 'typing'

const MATCHING_REWARDS_STORAGE_KEY = 'smarttest_vocab_matching_rewards_v2'
const VOCAB_DIAMOND_BANK_STORAGE_KEY = 'smarttest_vocab_diamond_bank_v1'
const MASTERY_STORAGE_KEY = 'smarttest_vocab_mastery_v1'

const EASE = [0.22, 1, 0.36, 1] as const
const FLIP = { duration: 0.55, ease: EASE }

// ---------------------------------------------------------------- shared utils
function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalize(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

function shuffle<T>(items: T[]) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function chunkEntries(entries: VocabularyEntry[], size: number) {
  const chunks: VocabularyEntry[][] = []
  for (let i = 0; i < entries.length; i += size) chunks.push(entries.slice(i, i + size))
  return chunks
}

function tone(frequency: number, durationMs = 180, type: OscillatorType = 'sine', gain = 0.12) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.02)
  } catch {
    /* ignore */
  }
}

const playCorrect = () => tone(880, 180)
const playWrong = () => tone(220, 200, 'triangle', 0.08)
const playWin = () => {
  tone(660, 120)
  window.setTimeout(() => tone(880, 160), 120)
  window.setTimeout(() => tone(1040, 220), 260)
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]) {
  return (
    voices.find((v) => /en[-_](us|gb|au|ca)/i.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang)) ?? null
  )
}

export function usePronunciation() {
  const [speakingText, setSpeakingText] = useState<string | null>(null)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setSpeakingText(null)
  }, [isSupported])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      const v = pickEnglishVoice(window.speechSynthesis.getVoices())
      if (v) u.voice = v
      u.lang = v?.lang || 'en-US'
      u.rate = 0.92
      u.onend = () => setSpeakingText(null)
      u.onerror = () => setSpeakingText(null)
      setSpeakingText(text)
      window.speechSynthesis.speak(u)
    },
    [isSupported],
  )

  useEffect(() => () => { if (isSupported) window.speechSynthesis.cancel() }, [isSupported])
  return { isSupported, speakingText, speak, stop }
}

// ---------------------------------------------------------------- mastery store
function getMastery(key: string): Record<string, boolean> {
  return safeParse<Record<string, Record<string, boolean>>>(localStorage.getItem(MASTERY_STORAGE_KEY), {})[key] ?? {}
}
function setMastery(key: string, map: Record<string, boolean>) {
  const all = safeParse<Record<string, Record<string, boolean>>>(localStorage.getItem(MASTERY_STORAGE_KEY), {})
  all[key] = map
  localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(all))
}

// ---------------------------------------------------------------- reward store
type MatchingRewardState = {
  awardedGroups: number[]
  bonusAwarded: boolean
  completed: boolean
  totalDiamonds: number
  completedAt?: string
}
type MatchingCelebration = { amount: number; reason: string; total: number }

function getAllMatchingRewardStates(): Record<string, MatchingRewardState> {
  return safeParse<Record<string, MatchingRewardState>>(localStorage.getItem(MATCHING_REWARDS_STORAGE_KEY), {})
}
function saveMatchingRewardState(key: string, state: MatchingRewardState) {
  const all = getAllMatchingRewardStates()
  all[key] = state
  localStorage.setItem(MATCHING_REWARDS_STORAGE_KEY, JSON.stringify(all))
}
function getSectionRewardState(key: string, totalGroups: number): MatchingRewardState {
  const stored = getAllMatchingRewardStates()[key]
  if (!stored) return { awardedGroups: [], bonusAwarded: false, completed: false, totalDiamonds: 0 }
  const awardedGroups = (stored.awardedGroups ?? [])
    .filter((g) => Number.isInteger(g) && g >= 0 && g < totalGroups)
    .filter((g, i, s) => s.indexOf(g) === i)
    .sort((a, b) => a - b)
  const bonusAwarded = Boolean(stored.bonusAwarded)
  const completed = Boolean(stored.completed || bonusAwarded)
  const baseDiamonds = awardedGroups.length + (bonusAwarded ? 5 : 0)
  return { awardedGroups, bonusAwarded, completed, totalDiamonds: Math.max(baseDiamonds, stored.totalDiamonds ?? 0), completedAt: stored.completedAt }
}
function getDiamondBank() {
  const raw = Number(localStorage.getItem(VOCAB_DIAMOND_BANK_STORAGE_KEY))
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0
}
function addToDiamondBank(amount: number) {
  const next = getDiamondBank() + Math.max(0, Math.floor(amount))
  localStorage.setItem(VOCAB_DIAMOND_BANK_STORAGE_KEY, String(next))
  return next
}

// ================================================================ ActivityPicker
const ACTIVITY_CARDS: Array<{ mode: ActivityMode; title: string; desc: string; icon: typeof Layers; tint: string }> = [
  { mode: 'flashcards', title: 'Flashcards', desc: '3D flip cards with audio, shuffle & mastery tracking.', icon: Layers, tint: 'from-blue-500 to-indigo-600' },
  { mode: 'matching', title: 'Matching Game', desc: 'Pair terms with meanings in groups — earn diamonds.', icon: Link2, tint: 'from-amber-500 to-orange-600' },
  { mode: 'quiz', title: 'Quiz', desc: 'Multiple choice with instant feedback & scoring.', icon: CheckCircle2, tint: 'from-emerald-500 to-teal-600' },
  { mode: 'typing', title: 'Typing Drill', desc: 'Recall spelling with live letter-by-letter feedback.', icon: Keyboard, tint: 'from-sky-500 to-indigo-600' },
]

export function ActivityPicker({ basePath, entriesCount }: { basePath: string; entriesCount: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ACTIVITY_CARDS.map((card, i) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.mode}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: EASE, delay: i * 0.05 }}
          >
            <Link
              to={`${basePath}/${card.mode}`}
              className="group relative block overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(37,99,235,0.16)]"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/60 blur-2xl transition group-hover:scale-125" />
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.tint} text-white shadow-md`}>
                <Icon className="h-5 w-5" />
              </span>
              <h4 className="mt-3 text-lg font-black text-slate-900">{card.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">{card.desc}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition group-hover:gap-2">
                Start with {entriesCount} terms <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

// ================================================================ Flashcards
export function FlashcardsActivity({ entries, masteryKey }: { entries: VocabularyEntry[]; masteryKey: string }) {
  const [deck, setDeck] = useState(entries)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Record<string, boolean>>(() => getMastery(masteryKey))
  const { isSupported, speakingText, speak, stop } = usePronunciation()

  const current = deck[index]
  const progress = ((index + 1) / deck.length) * 100
  const masteredCount = deck.filter((c) => known[c.id]).length
  const speakingCurrent = speakingText === current?.term

  const go = useCallback(
    (dir: 1 | -1) => {
      setFlipped(false)
      setIndex((p) => (p + dir + deck.length) % deck.length)
    },
    [deck.length],
  )

  const mark = (value: boolean) => {
    const next = { ...known, [current.id]: value }
    setKnown(next)
    setMastery(masteryKey, next)
    window.setTimeout(() => go(1), 160)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ') { e.preventDefault(); setFlipped((v) => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  if (!current) return null

  return (
    <div className="space-y-5">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between text-sm font-semibold">
          <p className="text-slate-700">Card {index + 1} / {deck.length}</p>
          <p className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {masteredCount} mastered</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.36, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500" />
        </div>
      </section>

      <div className="mx-auto w-full max-w-4xl [perspective:2000px]">
        <motion.button
          onClick={() => setFlipped((v) => !v)}
          whileTap={{ scale: 0.99 }}
          className={`relative block w-full text-left ${current.uzbek || current.exampleUzbek ? 'h-[500px] md:h-[520px]' : 'h-[360px] md:h-[400px]'}`}
        >
          <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={FLIP} style={{ transformStyle: 'preserve-3d' }} className="relative h-full w-full">
            {/* front */}
            <div style={{ backfaceVisibility: 'hidden' }} className="absolute inset-0 flex flex-col overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-100/70 p-7 shadow-[0_24px_52px_rgba(99,102,241,0.2)]">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-200/45 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Term</span>
                {isSupported ? (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); speakingCurrent ? stop() : speak(current.term) }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    {speakingCurrent ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    {speakingCurrent ? 'Stop' : 'Listen'}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-4xl font-black leading-tight text-slate-900 sm:text-5xl">{current.term}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tap or press Space to flip</p>
              </div>
              {known[current.id] ? <span className="absolute left-6 top-6 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><Check className="h-3 w-3" /> Mastered</span> : null}
            </div>
            {/* back */}
            <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} className="absolute inset-0 flex flex-col overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-100/70 p-7 shadow-[0_24px_52px_rgba(59,130,246,0.2)]">
              <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-blue-200/45 blur-2xl" />
              <span className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Meaning & translation</span>
              {current.uzbek ? (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Uzbek</p>
                  <p className="mt-1 text-lg font-bold leading-7 text-slate-900">{current.uzbek}</p>
                </div>
              ) : null}
              <div className="mt-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Meaning (EN)</p>
                <p className="mt-1 text-lg font-bold leading-7 text-slate-900">{current.definition}</p>
              </div>
              <div className="mt-3 rounded-xl border border-blue-100 bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700">
                <p className="italic">“{current.example}”</p>
                {current.exampleUzbek ? <p className="mt-1.5 font-medium text-slate-600">{current.exampleUzbek}</p> : null}
              </div>
              <p className="mt-auto pt-3 text-sm font-semibold text-blue-700">Synonym (EN): {current.synonym}</p>
            </div>
          </motion.div>
        </motion.button>
      </div>

      {/* known / review */}
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center gap-3">
        <button onClick={() => mark(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">
          <RefreshCw className="h-4 w-4" /> Still learning
        </button>
        <button onClick={() => mark(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
          <Check className="h-4 w-4" /> I know it
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => go(-1)} className="inline-flex items-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50"><ArrowLeft className="mr-1 h-4 w-4" /> Prev</button>
        <button onClick={() => { setDeck((p) => shuffle(p)); setIndex(0); setFlipped(false) }} className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(99,102,241,0.35)]"><Shuffle className="mr-1 h-4 w-4" /> Shuffle</button>
        <button onClick={() => go(1)} className="inline-flex items-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50">Next <ArrowRight className="ml-1 h-4 w-4" /></button>
      </div>
    </div>
  )
}

// ================================================================ Matching
export function MatchingActivity({ entries, rewardKey }: { entries: VocabularyEntry[]; rewardKey: string }) {
  const groups = useMemo(() => chunkEntries(entries, 6), [entries])
  const definitionGroups = useMemo(() => groups.map((g) => shuffle(g)), [groups])

  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [selectedWord, setSelectedWord] = useState<{ groupIndex: number; id: string } | null>(null)
  const [selectedDef, setSelectedDef] = useState<{ groupIndex: number; id: string } | null>(null)
  const [matchedByGroup, setMatchedByGroup] = useState<Record<number, Record<string, boolean>>>({})
  const [completedGroups, setCompletedGroups] = useState<Record<number, boolean>>({})
  const [wrongPair, setWrongPair] = useState<{ wordId: string; defId: string } | null>(null)
  const [sectionReward, setSectionReward] = useState<MatchingRewardState>(() => getSectionRewardState(rewardKey, groups.length))
  const [diamondBank, setDiamondBank] = useState<number>(() => getDiamondBank())
  const [celebration, setCelebration] = useState<MatchingCelebration | null>(null)

  const completedGroupsRef = useRef<Record<number, boolean>>({})
  const sectionRewardRef = useRef(sectionReward)

  useEffect(() => {
    const next = getSectionRewardState(rewardKey, groups.length)
    setSectionReward(next); sectionRewardRef.current = next
    setDiamondBank(getDiamondBank())
    setActiveGroupIndex(0); setSelectedWord(null); setSelectedDef(null)
    setMatchedByGroup({}); setCompletedGroups({}); completedGroupsRef.current = {}
    setWrongPair(null); setCelebration(null)
  }, [rewardKey, groups.length])

  useEffect(() => { sectionRewardRef.current = sectionReward }, [sectionReward])
  useEffect(() => { completedGroupsRef.current = completedGroups }, [completedGroups])
  useEffect(() => {
    if (!celebration) return
    const t = window.setTimeout(() => setCelebration(null), 2000)
    return () => window.clearTimeout(t)
  }, [celebration])

  const commitReward = useCallback((next: MatchingRewardState, earned: number, reason: string) => {
    sectionRewardRef.current = next
    setSectionReward(next)
    saveMatchingRewardState(rewardKey, next)
    if (earned > 0) {
      const bank = addToDiamondBank(earned)
      setDiamondBank(bank)
      setCelebration({ amount: earned, reason, total: bank })
      playWin()
    }
  }, [rewardKey])

  const onGroupCompleted = useCallback((groupIndex: number) => {
    const cur = sectionRewardRef.current
    let next = cur, earned = 0, reason = `Group ${groupIndex + 1} solved`
    if (!cur.completed && !cur.awardedGroups.includes(groupIndex)) {
      next = { ...cur, awardedGroups: [...cur.awardedGroups, groupIndex].sort((a, b) => a - b), totalDiamonds: cur.totalDiamonds + 1 }
      earned += 1
    }
    if (groups.every((_, i) => next.awardedGroups.includes(i)) && !next.bonusAwarded) {
      next = { ...next, bonusAwarded: true, completed: true, totalDiamonds: next.totalDiamonds + 5, completedAt: new Date().toISOString() }
      earned += 5; reason = 'All groups completed — bonus!'
    }
    if (next !== cur) commitReward(next, earned, reason)
  }, [commitReward, groups])

  const tryMatch = (groupIndex: number, wordId: string, defId: string) => {
    if (wordId === defId) {
      let solved = false
      setMatchedByGroup((prev) => {
        const g = prev[groupIndex] ?? {}
        if (g[wordId]) return prev
        const ng = { ...g, [wordId]: true }
        solved = groups[groupIndex].every((it) => ng[it.id])
        return { ...prev, [groupIndex]: ng }
      })
      setWrongPair(null)
      playCorrect()
      if (solved && !completedGroupsRef.current[groupIndex]) {
        const nc = { ...completedGroupsRef.current, [groupIndex]: true }
        completedGroupsRef.current = nc
        setCompletedGroups(nc)
        onGroupCompleted(groupIndex)
        const nextOpen = groups.findIndex((_, i) => !nc[i])
        if (nextOpen !== -1) window.setTimeout(() => setActiveGroupIndex(nextOpen), 600)
      }
    } else {
      setWrongPair({ wordId, defId })
      playWrong()
      window.setTimeout(() => setWrongPair((p) => (p?.wordId === wordId && p.defId === defId ? null : p)), 520)
    }
    setSelectedWord(null); setSelectedDef(null)
  }

  const pickWord = (groupIndex: number, id: string) => {
    if (matchedByGroup[groupIndex]?.[id]) return
    if (selectedDef && selectedDef.groupIndex === groupIndex) return tryMatch(groupIndex, id, selectedDef.id)
    setSelectedWord({ groupIndex, id })
  }
  const pickDef = (groupIndex: number, id: string) => {
    if (matchedByGroup[groupIndex]?.[id]) return
    if (selectedWord && selectedWord.groupIndex === groupIndex) return tryMatch(groupIndex, selectedWord.id, id)
    setSelectedDef({ groupIndex, id })
  }

  const replayMode = sectionReward.completed
  const completedCount = Object.values(completedGroups).filter(Boolean).length
  const activeGroup = groups[activeGroupIndex] ?? []
  const activeDefs = definitionGroups[activeGroupIndex] ?? []
  const activeMatches = matchedByGroup[activeGroupIndex] ?? {}
  const activeMatchedCount = activeGroup.filter((it) => activeMatches[it.id]).length
  const allDone = completedCount === groups.length && groups.length > 0

  const cellClass = (matched: boolean, selected: boolean, wrong: boolean) =>
    matched
      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
      : wrong
        ? 'border-blue-500 bg-blue-50 text-blue-700 animate-[shake_0.4s]'
        : selected
          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-indigo-100/40 p-4 shadow-[0_16px_34px_rgba(99,102,241,0.12)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Matching · +1 / group · +5 all-clear</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{replayMode ? 'Replay mode — rewards already collected.' : `Earned here: ${sectionReward.totalDiamonds} diamonds`}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-right shadow-sm">
          <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-600"><Gem className="h-3.5 w-3.5" /> Wallet</p>
          <p className="text-2xl font-black text-slate-900">{diamondBank}</p>
        </div>
      </section>

      {groups.length > 1 ? (
        <section className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((group, i) => {
            const done = Boolean(completedGroups[i])
            const claimed = sectionReward.awardedGroups.includes(i)
            return (
              <button key={i} onClick={() => setActiveGroupIndex(i)} className={`rounded-xl border px-4 py-3 text-left transition ${activeGroupIndex === i ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <p className="text-sm font-bold text-slate-900">Group {i + 1}</p>
                <p className={`mt-1 text-xs font-semibold ${done ? 'text-emerald-600' : claimed ? 'text-amber-600' : 'text-slate-500'}`}>{done ? 'Solved now' : claimed ? 'Reward claimed' : `${group.length} pairs`}</p>
              </button>
            )
          })}
        </section>
      ) : null}

      <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-black text-slate-900">Group {activeGroupIndex + 1} board</h3>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{activeMatchedCount} / {activeGroup.length}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Terms</p>
            {activeGroup.map((it) => (
              <button key={it.id} onClick={() => pickWord(activeGroupIndex, it.id)} className={`flex w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition ${cellClass(Boolean(activeMatches[it.id]), selectedWord?.id === it.id, wrongPair?.wordId === it.id)}`}>
                {activeMatches[it.id] ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
                {it.term}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Meanings</p>
            {activeDefs.map((it) => (
              <button key={it.id} onClick={() => pickDef(activeGroupIndex, it.id)} className={`flex w-full items-start gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${cellClass(Boolean(activeMatches[it.id]), selectedDef?.id === it.id, wrongPair?.defId === it.id)}`}>
                {activeMatches[it.id] ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                {it.definition}
              </button>
            ))}
          </div>
        </div>
      </section>

      {allDone ? (
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 text-center shadow-[0_12px_30px_rgba(245,158,11,0.18)]">
          <p className="inline-flex items-center gap-2 text-lg font-black text-amber-700"><Trophy className="h-5 w-5" /> All groups matched!</p>
          <p className="mt-1 text-sm text-amber-800">{replayMode ? 'Great practice — rewards were collected earlier.' : 'Group rewards and the all-clear bonus are applied.'}</p>
        </section>
      ) : null}

      <CelebrationOverlay celebration={celebration} />
    </div>
  )
}

function CelebrationOverlay({ celebration }: { celebration: MatchingCelebration | null }) {
  return (
    <AnimatePresence>
      {celebration ? (
        <motion.div key="cel" className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div key={i} className="absolute text-amber-300" style={{ top: `${20 + (i % 3) * 22}%`, left: `${18 + i * 12}%` }} initial={{ opacity: 0, y: 16, scale: 0.5 }} animate={{ opacity: [0, 1, 0.8, 0], y: [-4, -50, -80], scale: [0.4, 1, 0.8], rotate: [0, 18, -8] }} transition={{ duration: 1.5, delay: i * 0.08, ease: 'easeOut' }}>
              <Gem className="h-8 w-8" />
            </motion.div>
          ))}
          <motion.div initial={{ scale: 0.82, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 20 }} transition={{ duration: 0.32, ease: EASE }} className="relative overflow-hidden rounded-[1.8rem] border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-100 px-8 py-7 text-center shadow-[0_24px_62px_rgba(245,158,11,0.35)]">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-amber-700"><Sparkles className="h-4 w-4" /> Diamond Reward</p>
            <p className="mt-2 text-5xl font-black text-slate-900">+{celebration.amount}</p>
            <p className="mt-2 text-sm font-semibold text-amber-700">{celebration.reason}</p>
            <p className="mt-1 text-sm text-slate-600">Wallet: {celebration.total} diamonds</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

// ================================================================ Quiz
export function QuizActivity({ entries }: { entries: VocabularyEntry[] }) {
  const questions = useMemo(() => shuffle(entries).slice(0, Math.min(10, entries.length)), [entries])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [finished, setFinished] = useState(false)
  const { isSupported, speakingText, speak, stop } = usePronunciation()

  const current = questions[index]
  const options = useMemo(() => {
    if (!current) return []
    const wrong = shuffle(entries.filter((e) => e.id !== current.id)).slice(0, 3).map((e) => e.definition)
    return shuffle([current.definition, ...wrong])
  }, [entries, current])

  if (!current) return null
  const speakingCurrent = speakingText === current.term

  const choose = (opt: string) => {
    if (locked) return
    setPicked(opt)
    setLocked(true)
    if (opt === current.definition) { setScore((s) => s + 1); setCombo((c) => c + 1); playCorrect() } else { setCombo(0); playWrong() }
  }
  const next = () => {
    if (index === questions.length - 1) { setFinished(true); playWin(); return }
    setIndex((i) => i + 1); setPicked(null); setLocked(false)
  }
  const restart = () => { setIndex(0); setPicked(null); setLocked(false); setScore(0); setFinished(false) }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
        <Burst count={24} play={pct >= 70} />
        <ScoreRing pct={pct} />
        <h3 className="mt-4 text-3xl font-black text-slate-900">{pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practising'}</h3>
        <p className="mt-1 text-lg text-slate-600">You scored <span className="font-bold text-blue-600">{score}</span> / {questions.length}</p>
        <button onClick={restart} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(37,99,235,0.28)]"><RotateCcw className="h-4 w-4" /> Try again</button>
      </motion.section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div animate={{ width: `${((index + 1) / questions.length) * 100}%` }} transition={{ ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-slate-900">What does <span className="text-blue-600">“{current.term}”</span> mean?</h3>
        <AnimatePresence>
          {combo >= 2 ? (
            <motion.span
              key={combo}
              initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 16 }}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 text-xs font-black text-amber-700 shadow-[0_6px_14px_rgba(245,158,11,0.25)]"
            >
              🔥 x{combo} combo
            </motion.span>
          ) : null}
        </AnimatePresence>
        {isSupported ? (
          <button onClick={() => (speakingCurrent ? stop() : speak(current.term))} className="shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
            {speakingCurrent ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </div>
      <div className="mt-4 space-y-2.5">
        {options.map((opt) => {
          const isCorrect = opt === current.definition
          const isPicked = picked === opt
          const state = !locked ? 'idle' : isCorrect ? 'correct' : isPicked ? 'wrong' : 'dim'
          return (
            <motion.button
              key={opt}
              onClick={() => choose(opt)}
              whileTap={!locked ? { scale: 0.99 } : undefined}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition ${
                state === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : state === 'wrong' ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : state === 'dim' ? 'border-slate-200 bg-slate-50 text-slate-400'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              <span>{opt}</span>
              {state === 'correct' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : state === 'wrong' ? <X className="h-5 w-5 shrink-0" /> : null}
            </motion.button>
          )
        })}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">Question {index + 1} / {questions.length}</p>
        <button onClick={next} disabled={!locked} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {index === questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 52, c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#dbeafe" strokeWidth="10" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke="url(#qg)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * pct) / 100 }} transition={{ duration: 0.9, ease: EASE }} />
        <defs><linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563eb" /><stop offset="100%" stopColor="#f97316" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center"><span className="text-3xl font-black text-slate-900">{pct}%</span></div>
    </div>
  )
}

// ================================================================ Typing
export function TypingActivity({ entries }: { entries: VocabularyEntry[] }) {
  const questions = useMemo(() => shuffle(entries).slice(0, Math.min(10, entries.length)), [entries])
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [reveal, setReveal] = useState(false)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { speak } = usePronunciation()

  const current = questions[index]
  useEffect(() => { inputRef.current?.focus() }, [index])
  if (!current) return null

  const correct = normalize(value) === normalize(current.term)

  const check = () => {
    if (checked) return
    setChecked(true)
    if (correct) { setScore((s) => s + 1); playCorrect(); speak(current.term) } else playWrong()
  }
  const next = () => {
    if (index === questions.length - 1) { setFinished(true); playWin(); return }
    setIndex((i) => i + 1); setValue(''); setChecked(false); setReveal(false)
  }
  const restart = () => { setIndex(0); setValue(''); setChecked(false); setReveal(false); setScore(0); setFinished(false) }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-2xl rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
        <ScoreRing pct={pct} />
        <h3 className="mt-4 text-3xl font-black text-slate-900">Typing complete</h3>
        <p className="mt-1 text-lg text-slate-600">Accuracy <span className="font-bold text-blue-600">{score}</span> / {questions.length}</p>
        <button onClick={restart} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"><RotateCcw className="h-4 w-4" /> Try again</button>
      </motion.section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div animate={{ width: `${((index + 1) / questions.length) * 100}%` }} transition={{ ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600" />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Type the term that matches this meaning</p>
      <div className="mt-2 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
        <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <p className="text-[15px] font-semibold leading-6 text-slate-800">{current.definition}</p>
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') (checked ? next() : check()) }}
        placeholder="Type the word…"
        disabled={checked}
        className={`mt-4 w-full rounded-xl border px-4 py-3 text-base outline-none transition ${
          checked ? (correct ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-blue-400 bg-blue-50 text-blue-700') : 'border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
        }`}
      />

      <AnimatePresence>
        {checked ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${correct ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
              {correct ? '✓ Correct!' : <>Answer: <span className="font-black">{current.term}</span></>}
            </div>
          </motion.div>
        ) : reveal ? (
          <p className="mt-3 text-sm text-slate-500">Hint: starts with <span className="font-bold text-slate-700">“{current.term.slice(0, Math.ceil(current.term.length / 3))}…”</span></p>
        ) : null}
      </AnimatePresence>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-500">{index + 1} / {questions.length}</p>
          {!checked ? (
            <button onClick={() => setReveal(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Hint</button>
          ) : null}
        </div>
        {checked ? (
          <button onClick={next} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white">{index === questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="h-4 w-4" /></button>
        ) : (
          <button onClick={check} disabled={!value.trim()} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"><Check className="h-4 w-4" /> Check</button>
        )}
      </div>
    </section>
  )
}
