import { SaveWordButton } from './SaveWordButton'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
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
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { TextDetailsButton, VocabularyLibrary, WordDetailsButton } from './VocabularyDetails'
import { normalizeVocabularyAnswer, uniqueWrongDefinitions } from '@/utils/vocabularyAnswers'
import { Burst } from '@/components/fx'
import type { VocabularyEntry } from '@/data/vocabularyCollections'
import { isSpeechSynthesisSupported, speak as speakText } from '@/lib/speech'
import '@/styles/vocabulary-practice.css'

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
    osc.onended = () => { void ctx.close().catch(() => {}) }
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

export function usePronunciation() {
  const [speakingText, setSpeakingText] = useState<string | null>(null)
  const stopSpeechRef = useRef<() => void>(() => {})
  const isSupported = isSpeechSynthesisSupported()

  const stop = useCallback(() => {
    if (!isSupported) return
    stopSpeechRef.current()
    stopSpeechRef.current = () => {}
    setSpeakingText(null)
  }, [isSupported])

  const speak = useCallback(
    (text: string) => {
      const term = text.trim()
      if (!isSupported || !term) return

      stopSpeechRef.current()
      setSpeakingText(term)
      stopSpeechRef.current = speakText(term, {
        lang: 'en',
        rate: 0.92,
        onEnd: () => {
          stopSpeechRef.current = () => {}
          setSpeakingText(null)
        },
      })
    },
    [isSupported],
  )

  useEffect(() => () => stopSpeechRef.current(), [])
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
const ACTIVITY_CARDS: Array<{ mode: ActivityMode; title: string; desc: string; xp: string; icon: typeof Layers }> = [
  { mode: 'flashcards', title: 'Flashcards', desc: 'Flip cards with audio, shuffle & mastery tracking.', xp: '+12 XP', icon: Layers },
  { mode: 'matching', title: 'Matching Game', desc: 'Pair terms with meanings in groups — earn diamonds.', xp: '+20 XP', icon: Link2 },
  { mode: 'quiz', title: 'Quiz', desc: 'Multiple choice with instant feedback & scoring.', xp: '+26–30 XP', icon: CheckCircle2 },
  { mode: 'typing', title: 'Typing Drill', desc: 'Recall spelling with hints and instant feedback.', xp: '+30–35 XP', icon: Keyboard },
]

function ActivityPreview({ mode, entry }: { mode: ActivityMode; entry?: VocabularyEntry }) {
  const term = entry?.term ?? 'discover'
  return <div className={`vocab-activity-preview vocab-preview-${mode}`} aria-hidden="true">
    {mode === 'flashcards' ? <><div className="vocab-mini-card vocab-mini-card-back" /><div className="vocab-mini-card"><span>ENGLISH</span><strong>{term}</strong><div className="vocab-mini-rule" /><span>FLIP TO EXPLORE <RotateCcw size={12} /></span></div></> : null}
    {mode === 'matching' ? <><div className="vocab-mini-pair"><span>{term}</span><Link2 size={16} /><span>{entry?.synonym ?? 'find out'}</span></div><div className="vocab-mini-pair is-matched"><span><Check size={12} /> paired</span><span>+1 <Gem size={12} /></span></div></> : null}
    {mode === 'quiz' ? <><div className="vocab-mini-question">What does <strong>{term}</strong> mean?</div><div className="vocab-mini-options"><span><i>A</i><b /></span><span className="is-correct"><i>B</i><b /><Check size={12} /></span><span><i>C</i><b /></span></div></> : null}
    {mode === 'typing' ? <><div className="vocab-mini-keyboard">{term.slice(0, 8).split('').map((char, index) => <span key={index}>{char}</span>)}<i /></div><div className="vocab-mini-caption"><Keyboard size={13} /> A little recall. A lasting memory.</div></> : null}
  </div>
}

export function ActivityPicker({ basePath, entriesCount, navigationState, previewEntry }: { basePath: string; entriesCount: number; navigationState?: unknown; previewEntry?: VocabularyEntry }) {
  const { reducedMotion } = useMotionPreferences()
  return (
    <div className="vocab-activity-picker">
      {ACTIVITY_CARDS.map((card, i) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.mode}
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: EASE, delay: i * 0.05 }}
          >
            <Link
              to={`${basePath}/${card.mode}`}
              state={navigationState}
              className="vocab-activity-card group" data-activity={card.mode}
            >
              <div className="vocab-activity-topline">
                <span className="vocab-activity-icon"><Icon className="h-5 w-5" /></span>
                <span className="vocab-activity-step">0{i + 1} / {['EXPLORE', 'CONNECT', 'RECOGNISE', 'RECALL'][i]}</span>
                <span className="vocab-xp-chip">{card.xp}</span>
              </div>
              <div className="vocab-activity-body">
                <div><h4>{card.title}</h4><p className="vocab-activity-description">{card.desc}</p></div>
                <ActivityPreview mode={card.mode} entry={previewEntry} />
              </div>
              <div className="vocab-activity-card-footer">
                <p className="inline-flex items-center gap-1">Start with {entriesCount} terms <ArrowRight className="h-3.5 w-3.5" /></p>
                <span className="vocab-activity-arrow"><ArrowRight className="h-4 w-4" /></span>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

// ================================================================ Flashcards
export function FlashcardsActivity({ entries, masteryKey, onComplete }: { entries: VocabularyEntry[]; masteryKey: string; onComplete?: (accuracy: number) => void }) {
  const { reducedMotion } = useMotionPreferences()
  const meaningId = useId()
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])
  const [deck, setDeck] = useState(entries)
  const completionReported = useRef(false)
  const sessionAnswers = useRef<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)
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
      window.clearTimeout(advanceTimer.current)
      stop()
      setFlipped(false)
      if (finished) return
      if (dir === 1 && index === deck.length - 1) {
        setFinished(true)
        if (!completionReported.current) {
          completionReported.current = true
          onComplete?.((deck.filter((card) => sessionAnswers.current[card.id]).length / deck.length) * 100)
        }
        return
      }
      setIndex((p) => Math.max(0, Math.min(deck.length - 1, p + dir)))
    },
    [deck, index, finished, onComplete, stop],
  )

  const mark = (value: boolean) => {
    window.clearTimeout(advanceTimer.current)
    if (finished) return
    sessionAnswers.current[current.id] = value
    const next = { ...known, [current.id]: value }
    setKnown(next)
    setMastery(masteryKey, next)
    advanceTimer.current = window.setTimeout(() => go(1), 160)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return
      const target = e.target instanceof HTMLElement ? e.target : null
      if (target?.closest('input, textarea, select, a') || (target?.closest('button') && !target.closest('.vocab-flash-card'))) return
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ' && !target?.closest('.vocab-flash-card')) { e.preventDefault(); setFlipped((v) => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, finished])

  if (finished) {
    const count = deck.filter((card) => sessionAnswers.current[card.id]).length
    const pct = Math.round((count / deck.length) * 100)
    return (
      <motion.section initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="vocab-result text-center">
        <ScoreRing pct={pct} />
        <h3 className="mt-4 text-3xl font-black text-slate-900">Flashcards complete</h3>
        <p className="mt-2 text-lg text-slate-600">{count} / {deck.length} marked “I know it”</p>
        <p className="mt-2 text-sm text-slate-500">Reach at least 80% to earn XP once for this activity.</p>
        <button onClick={() => { sessionAnswers.current = {}; completionReported.current = false; setIndex(0); setFlipped(false); setFinished(false) }} className="mt-5 inline-flex items-center gap-2 rounded-xl vocab-primary-button px-5 py-2.5 text-sm font-semibold text-white"><RotateCcw className="h-4 w-4" /> Try again</button>
      </motion.section>
    )
  }
  if (!current) return null

  return (
    <div className="vocab-flashcards">
      <div className="vocab-session-heading"><span className="vocab-session-icon"><Layers size={20} /></span><div><p className="vocab-content-label">EXPLORE & REMEMBER</p><h2>One word. A new possibility.</h2></div></div>
      <section className="vocab-flash-progress">
        <div className="flex items-center justify-between text-sm font-semibold">
          <p className="text-slate-700">Card {index + 1} / {deck.length}</p>
          <p className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> {masteredCount} mastered</p>
        </div>
        <div className="vocab-progress-track" role="progressbar" aria-label="Cards explored" aria-valuenow={index + 1} aria-valuemin={0} aria-valuemax={deck.length}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.36, ease: EASE }} className="vocab-progress-fill" />
        </div>
      </section>

      <div className="vocab-flash-save"><SaveWordButton entry={current} /><WordDetailsButton entry={current} label="Meaning & examples" /></div>
      <div className="vocab-flash-scene">
        <motion.button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          whileTap={reducedMotion ? undefined : { scale: 0.99 }}
          className="vocab-flash-card"
          aria-label={`${current.term}: ${flipped ? 'show term' : 'show meaning'}`}
          aria-pressed={flipped}
          aria-describedby={flipped ? meaningId : undefined}
        >
          <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={reducedMotion ? { duration: 0 } : FLIP} style={{ transformStyle: 'preserve-3d' }} className="relative h-full w-full">
            {/* front */}
            <div style={{ backfaceVisibility: 'hidden' }} aria-hidden={flipped} className="vocab-flash-face vocab-flash-front">
              <div className="flex items-center justify-between pr-24">
                <span className="vocab-flash-label">Term</span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="vocab-flash-ornament" aria-hidden="true"><Layers size={30} strokeWidth={1.2} /></span>
                <p className="vocab-flash-term" lang="en">{current.term}</p>
                <p className="vocab-flash-instruction">Tap or press Space to flip</p>
              </div>
              {known[current.id] ? <span className="absolute bottom-4 left-5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><Check className="h-3 w-3" /> Mastered</span> : null}
            </div>
            {/* back */}
            <div id={meaningId} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }} aria-hidden={!flipped} className="vocab-flash-face vocab-flash-back">
              <span className="vocab-flash-label">Meaning & translation</span>
              <p className="vocab-flash-back-term" lang="en">{current.term}</p>
              <div className="vocab-flash-meaning" data-bilingual={Boolean(current.uzbek)}>
              {current.uzbek ? (
                <div className="vocab-flash-translation">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Uzbek</p>
                  <p className="vocab-flash-definition">{current.uzbek}</p>
                </div>
              ) : null}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Meaning (EN)</p>
                <p className="vocab-flash-definition">{current.definition}</p>
              </div>
              </div>
              <p className="vocab-flash-detail-note">Open Meaning & examples for the full word guide.</p>
              {current.synonym ? <p className="vocab-flash-synonym"><span>Synonym</span> {current.synonym}</p> : null}
            </div>
          </motion.div>
        </motion.button>
        {isSupported ? (
          <button
            type="button"
            onClick={() => {
              if (speakingCurrent) stop()
              else speak(current.term)
            }}
            className="vocab-flash-listen"
            aria-label={speakingCurrent ? `Stop pronunciation of ${current.term}` : `Listen to pronunciation of ${current.term}`}
          >
            {speakingCurrent ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {speakingCurrent ? 'Stop' : 'Listen'}
          </button>
        ) : null}
      </div>

      {/* known / review */}
      <div className="vocab-flash-controls">
      <div className="vocab-flash-mastery">
        <button onClick={() => mark(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100">
          <RefreshCw className="h-4 w-4" /> Still learning
        </button>
        <button onClick={() => mark(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
          <Check className="h-4 w-4" /> I know it
        </button>
      </div>

      <p className="vocab-flash-shortcuts"><kbd>Space</kbd> flip · <kbd>←</kbd> <kbd>→</kbd> navigate</p>
      <div className="vocab-flash-navigation">
        <button disabled={index === 0} onClick={() => go(-1)} className="inline-flex items-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50"><ArrowLeft className="mr-1 h-4 w-4" /> Prev</button>
        <button onClick={() => { window.clearTimeout(advanceTimer.current); stop(); setDeck((p) => [...p.slice(0, index), ...shuffle(p.slice(index))]); setFlipped(false) }} className="inline-flex items-center rounded-xl vocab-primary-button px-4 py-2 text-sm font-semibold text-white"><Shuffle className="mr-1 h-4 w-4" /> Shuffle</button>
        <button onClick={() => go(1)} className="inline-flex items-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50">{index === deck.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="ml-1 h-4 w-4" /></button>
      </div>
      </div>
    </div>
  )
}

// ================================================================ Matching
export function MatchingActivity({ entries, rewardKey, onComplete }: { entries: VocabularyEntry[]; rewardKey: string; onComplete?: (accuracy: number) => void }) {
  const [rows, setRows] = useState(() => window.innerWidth < 640 || window.innerHeight < 650 ? 3 : 6)
  const [wordPage, setWordPage] = useState(0)
  const [meaningPage, setMeaningPage] = useState(0)
  useEffect(() => {
    const resize = () => { setRows(window.innerWidth < 640 || window.innerHeight < 650 ? 3 : 6); setWordPage(0); setMeaningPage(0) }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
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
  const matchedByGroupRef = useRef<Record<number, Record<string, boolean>>>({})
  const sectionRewardRef = useRef(sectionReward)
  const groupAdvanceTimer = useRef<ReturnType<typeof setTimeout>>()
  const wrongPairTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => {
    window.clearTimeout(groupAdvanceTimer.current)
    window.clearTimeout(wrongPairTimer.current)
  }, [])

  useEffect(() => {
    const next = getSectionRewardState(rewardKey, groups.length)
    setSectionReward(next); sectionRewardRef.current = next
    setDiamondBank(getDiamondBank())
    setActiveGroupIndex(0); setSelectedWord(null); setSelectedDef(null)
    setMatchedByGroup({}); matchedByGroupRef.current = {}; setCompletedGroups({}); completedGroupsRef.current = {}
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
    const word = groups[groupIndex].find((entry) => entry.id === wordId)
    const meaning = groups[groupIndex].find((entry) => entry.id === defId)
    if (word && meaning && normalizeVocabularyAnswer(word.definition) === normalizeVocabularyAnswer(meaning.definition)) {
      const previous = matchedByGroupRef.current
      const group = previous[groupIndex] ?? {}
      if (group[`term:${wordId}`] || group[`definition:${defId}`]) return
      const nextGroup = { ...group, [`term:${wordId}`]: true, [`definition:${defId}`]: true }
      const nextMatches = { ...previous, [groupIndex]: nextGroup }
      matchedByGroupRef.current = nextMatches
      setMatchedByGroup(nextMatches)
      const solved = groups[groupIndex].every((entry) => nextGroup[`term:${entry.id}`])
      setWrongPair(null)
      playCorrect()
      if (solved && !completedGroupsRef.current[groupIndex]) {
        const nc = { ...completedGroupsRef.current, [groupIndex]: true }
        completedGroupsRef.current = nc
        setCompletedGroups(nc)
        onGroupCompleted(groupIndex)
        // XP is independent of locally collected diamonds; retries and other devices
        // are deduplicated by the server using the stable activity event key.
        if (groups.every((_, index) => nc[index])) onComplete?.(100)
        const nextOpen = groups.findIndex((_, i) => !nc[i])
        if (nextOpen !== -1) groupAdvanceTimer.current = window.setTimeout(() => setActiveGroupIndex(nextOpen), 600)
      }
    } else {
      setWrongPair({ wordId, defId })
      playWrong()
      window.clearTimeout(wrongPairTimer.current)
      wrongPairTimer.current = window.setTimeout(() => setWrongPair((p) => (p?.wordId === wordId && p.defId === defId ? null : p)), 520)
    }
    setSelectedWord(null); setSelectedDef(null)
  }

  const pickWord = (groupIndex: number, id: string) => {
    if (matchedByGroup[groupIndex]?.[`term:${id}`]) return
    if (selectedDef && selectedDef.groupIndex === groupIndex) return tryMatch(groupIndex, id, selectedDef.id)
    setSelectedWord({ groupIndex, id })
  }
  const pickDef = (groupIndex: number, id: string) => {
    if (matchedByGroup[groupIndex]?.[`definition:${id}`]) return
    if (selectedWord && selectedWord.groupIndex === groupIndex) return tryMatch(groupIndex, selectedWord.id, id)
    setSelectedDef({ groupIndex, id })
  }

  const replayMode = sectionReward.completed
  const completedCount = Object.values(completedGroups).filter(Boolean).length
  const activeGroup = groups[activeGroupIndex] ?? []
  const activeDefs = definitionGroups[activeGroupIndex] ?? []
  const visibleTerms = activeGroup.slice(wordPage * rows, (wordPage + 1) * rows)
  const visibleMeanings = activeDefs.slice(meaningPage * rows, (meaningPage + 1) * rows)
  useEffect(() => { setWordPage(0); setMeaningPage(0) }, [activeGroupIndex])
  const activeMatches = matchedByGroup[activeGroupIndex] ?? {}
  const activeMatchedCount = activeGroup.filter((it) => activeMatches[`term:${it.id}`]).length
  const allDone = completedCount === groups.length && groups.length > 0

  const cellClass = (matched: boolean, selected: boolean, wrong: boolean) =>
    matched
      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
      : wrong
        ? 'border-red-400 bg-red-50 text-red-700 animate-[shake_0.4s]'
        : selected
          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'

  return (
    <div className="vocab-matching">
      <div className="vocab-session-heading"><span className="vocab-session-icon"><Link2 size={20} /></span><div><p className="vocab-content-label">CONNECT THE MEANING</p><h2>Find the perfect pair.</h2></div></div>
      <section className="vocab-matching-rewards" role={allDone ? 'status' : undefined}>
        <div>
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{allDone ? <><Trophy className="h-3.5 w-3.5" /> All groups matched!</> : 'Matching · +1 / group · +5 all-clear'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{allDone ? (replayMode ? 'Great practice — rewards already collected.' : 'Group rewards and the all-clear bonus are applied.') : replayMode ? 'Replay mode — rewards already collected.' : `Earned here: ${sectionReward.totalDiamonds} diamonds`}</p>
        </div>
        <div className="vocab-wallet">
          <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-600"><Gem className="h-3.5 w-3.5" /> Wallet</p>
          <p className="text-2xl font-black text-slate-900">{diamondBank}</p>
        </div>
      </section>

      {groups.length > 1 ? (
        <section className="vocab-matching-groups" aria-label="Matching groups">
          {groups.map((group, i) => {
            const done = Boolean(completedGroups[i])
            const claimed = sectionReward.awardedGroups.includes(i)
            return (
              <button key={i} aria-pressed={activeGroupIndex === i} onClick={() => { window.clearTimeout(groupAdvanceTimer.current); window.clearTimeout(wrongPairTimer.current); setWrongPair(null); setActiveGroupIndex(i); setSelectedWord(null); setSelectedDef(null) }} className={`rounded-xl border text-left transition ${activeGroupIndex === i ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <p className="text-sm font-bold text-slate-900">Group {i + 1}</p>
                <p className={`mt-1 text-xs font-semibold ${done ? 'text-emerald-600' : claimed ? 'text-amber-600' : 'text-slate-500'}`}>{done ? 'Solved now' : claimed ? 'Reward claimed' : `${group.length} pairs`}</p>
              </button>
            )
          })}
        </section>
      ) : null}

      <section className="vocab-matching-board">
        <div className="vocab-matching-board-heading">
          <h3 className="text-lg font-black text-slate-900">Group {activeGroupIndex + 1} board</h3>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{activeMatchedCount} / {activeGroup.length}</span>
        </div>
        <p className="vocab-matching-instruction" role="status">{allDone ? 'Every pair is connected. Well done!' : wrongPair ? 'That pair does not match. Try another meaning.' : selectedWord || selectedDef ? 'Now choose its match in the other column.' : 'Select a term and its meaning, in either order.'}</p>
        <div className="vocab-matching-columns">
          <div className="vocab-matching-column" style={{ gridTemplateRows: `auto repeat(${visibleTerms.length}, minmax(0, 1fr)) auto` }}>
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Terms</p>
            {visibleTerms.map((it) => (
              <div key={it.id} className="relative">
                <button disabled={Boolean(activeMatches[`term:${it.id}`])} aria-pressed={selectedWord?.id === it.id} onClick={() => pickWord(activeGroupIndex, it.id)} className={`vocab-matching-cell vocab-matching-term font-semibold ${cellClass(Boolean(activeMatches[`term:${it.id}`]), selectedWord?.id === it.id, wrongPair?.wordId === it.id)}`}>
                  {activeMatches[`term:${it.id}`] ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
                  <span title={it.term}>{it.term}</span>
                </button>
                <div className="absolute inset-y-0 right-1 flex items-center">
                  <SaveWordButton entry={it} iconOnly />
                </div>
              </div>
            ))}
            <ColumnPager label="terms" page={wordPage} count={Math.ceil(activeGroup.length / rows)} onChange={setWordPage} />
          </div>
          <div className="vocab-matching-column" style={{ gridTemplateRows: `auto repeat(${visibleMeanings.length}, minmax(0, 1fr)) auto` }}>
            <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Meanings</p>
            {visibleMeanings.map((it) => (
              <div key={it.id} className="vocab-matching-meaning-cell"><button disabled={Boolean(activeMatches[`definition:${it.id}`])} aria-pressed={selectedDef?.id === it.id} onClick={() => pickDef(activeGroupIndex, it.id)} className={`vocab-matching-cell ${cellClass(Boolean(activeMatches[`definition:${it.id}`]), selectedDef?.id === it.id, wrongPair?.defId === it.id)}`}>
                {activeMatches[`definition:${it.id}`] ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                <span title={it.definition}>{it.definition}</span>
              </button><TextDetailsButton text={it.definition} /></div>
            ))}
            <ColumnPager label="meanings" page={meaningPage} count={Math.ceil(activeDefs.length / rows)} onChange={setMeaningPage} />
          </div>
        </div>
      </section>

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
export function QuizActivity({ entries, onComplete }: { entries: VocabularyEntry[]; onComplete?: (accuracy: number) => void }) {
  const questions = useMemo(() => shuffle(entries).slice(0, Math.min(10, entries.length)), [entries])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [finished, setFinished] = useState(false)
  const [mistakes, setMistakes] = useState<VocabularyEntry[]>([])
  const { isSupported, speakingText, speak, stop } = usePronunciation()

  const current = questions[index]
  const options = useMemo(() => {
    if (!current) return []
    const wrong = shuffle(uniqueWrongDefinitions(entries.map((e) => e.definition), current.definition)).slice(0, 3)
    return shuffle([current.definition, ...wrong])
  }, [entries, current])

  if (!current) return null
  const speakingCurrent = speakingText === current.term

  const choose = (opt: string) => {
    if (locked) return
    setPicked(opt)
    setLocked(true)
    if (opt === current.definition) { setScore((s) => s + 1); setCombo((c) => c + 1); playCorrect() } else { setCombo(0); setMistakes((previous) => [...previous, current]); playWrong() }
  }
  const next = () => {
    if (index === questions.length - 1) { setFinished(true); playWin(); onComplete?.((score / questions.length) * 100); return }
    setIndex((i) => i + 1); setPicked(null); setLocked(false)
  }
  const restart = () => { setIndex(0); setPicked(null); setLocked(false); setScore(0); setCombo(0); setFinished(false); setMistakes([]) }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="vocab-result relative overflow-hidden text-center">
        <Burst count={24} play={pct >= 70} />
        <ScoreRing pct={pct} />
        <h3 className="mt-4 text-3xl font-black text-slate-900">{pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practising'}</h3>
        <p className="mt-1 text-lg text-slate-600">You scored <span className="font-bold text-blue-600">{score}</span> / {questions.length}</p>
        <MistakeReview entries={mistakes} />
        <button onClick={restart} className="mt-5 inline-flex items-center gap-2 rounded-xl vocab-primary-button px-5 py-2.5 text-sm font-semibold text-white"><RotateCcw className="h-4 w-4" /> Try again</button>
      </motion.section>
    )
  }

  return (
    <section className="vocab-question vocab-quiz">
      <div className="vocab-session-heading"><span className="vocab-session-icon"><CheckCircle2 size={20} /></span><div><p className="vocab-content-label">RECOGNISE & UNDERSTAND</p><h2>Put your knowledge to the test.</h2></div><span className="vocab-session-score">{score} correct</span></div>
      <div className="vocab-progress-track" role="progressbar" aria-label="Quiz progress" aria-valuenow={index + 1} aria-valuemin={0} aria-valuemax={questions.length}>
        <motion.div animate={{ width: `${((index + 1) / questions.length) * 100}%` }} transition={{ ease: EASE }} className="vocab-progress-fill" />
      </div>
      <SaveWordButton entry={current} />
      <div className="vocab-quiz-heading flex items-start justify-between gap-3">
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
          <button aria-label={speakingCurrent ? `Stop pronunciation of ${current.term}` : `Listen to pronunciation of ${current.term}`} onClick={() => (speakingCurrent ? stop() : speak(current.term))} className="shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
            {speakingCurrent ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </div>
      <div className="vocab-quiz-options">
        {options.map((opt, optionIndex) => {
          const isCorrect = opt === current.definition
          const isPicked = picked === opt
          const state = !locked ? 'idle' : isCorrect ? 'correct' : isPicked ? 'wrong' : 'dim'
          return (
            <div key={opt} className="vocab-quiz-option"><motion.button
              data-letter={String.fromCharCode(65 + optionIndex)}
              data-state={state}
              onClick={() => choose(opt)}
              disabled={locked}
              whileTap={!locked ? { scale: 0.99 } : undefined}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition ${
                state === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : state === 'wrong' ? 'border-red-400 bg-red-50 text-red-700'
                  : state === 'dim' ? 'border-slate-200 bg-slate-50 text-slate-400'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
              }`}
            >
              <span title={opt}>{opt}</span>
              {state === 'correct' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : state === 'wrong' ? <X className="h-5 w-5 shrink-0" /> : null}
            </motion.button><TextDetailsButton text={opt} /></div>
          )
        })}
      </div>
      {locked ? <div className="vocab-answer-feedback" data-correct={picked === current.definition}><p role="status">{picked === current.definition ? 'Correct — well remembered!' : 'Not quite. The correct meaning is highlighted.'}</p><WordDetailsButton entry={current} /></div> : null}
      <div className="vocab-question-footer">
        <p className="text-sm font-semibold text-slate-500">Question {index + 1} / {questions.length}</p>
        <button onClick={next} disabled={!locked} className="inline-flex items-center gap-1 rounded-xl vocab-primary-button px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {index === questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

function ScoreRing({ pct }: { pct: number }) {
  const gradientId = useId()
  const { reducedMotion } = useMotionPreferences()
  const r = 52, c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#dbeafe" strokeWidth="10" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} initial={reducedMotion ? false : { strokeDashoffset: c }} animate={{ strokeDashoffset: c - (c * pct) / 100 }} transition={{ duration: reducedMotion ? 0 : 0.9, ease: EASE }} />
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#34b58a" /><stop offset="100%" stopColor="#11644d" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center"><span className="text-3xl font-black text-slate-900">{pct}%</span></div>
    </div>
  )
}

// ================================================================ Typing
export function TypingActivity({ entries, onComplete }: { entries: VocabularyEntry[]; onComplete?: (accuracy: number) => void }) {
  const questions = useMemo(() => shuffle(entries).slice(0, Math.min(10, entries.length)), [entries])
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [reveal, setReveal] = useState(false)
  const [finished, setFinished] = useState(false)
  const [mistakes, setMistakes] = useState<VocabularyEntry[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const { speak } = usePronunciation()

  const current = questions[index]
  useEffect(() => { if (!finished) inputRef.current?.focus() }, [index, finished])
  useEffect(() => { if (checked) nextRef.current?.focus() }, [checked])
  if (!current) return null

  const correct = normalizeVocabularyAnswer(value) === normalizeVocabularyAnswer(current.term)

  const check = () => {
    if (checked || !value.trim()) return
    setChecked(true)
    if (correct) { setScore((s) => s + 1); playCorrect(); speak(current.term) } else { setMistakes((previous) => [...previous, current]); playWrong() }
  }
  const next = () => {
    if (index === questions.length - 1) { setFinished(true); playWin(); onComplete?.((score / questions.length) * 100); return }
    setIndex((i) => i + 1); setValue(''); setChecked(false); setReveal(false)
  }
  const restart = () => { setIndex(0); setValue(''); setChecked(false); setReveal(false); setScore(0); setFinished(false); setMistakes([]) }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="vocab-result text-center">
        <ScoreRing pct={pct} />
        <h3 className="mt-4 text-3xl font-black text-slate-900">Typing complete</h3>
        <p className="mt-1 text-lg text-slate-600">Accuracy <span className="font-bold text-blue-600">{score}</span> / {questions.length}</p>
        <MistakeReview entries={mistakes} />
        <button onClick={restart} className="mt-5 inline-flex items-center gap-2 rounded-xl vocab-primary-button px-5 py-2.5 text-sm font-semibold text-white"><RotateCcw className="h-4 w-4" /> Try again</button>
      </motion.section>
    )
  }

  return (
    <section className="vocab-question vocab-typing">
      <div className="vocab-session-heading"><span className="vocab-session-icon"><Keyboard size={20} /></span><div><p className="vocab-content-label">RECALL & SPELL</p><h2>Make the word your own.</h2></div><span className="vocab-session-score">{score} correct</span></div>
      <div className="vocab-progress-track" role="progressbar" aria-label="Typing progress" aria-valuenow={index + 1} aria-valuemin={0} aria-valuemax={questions.length}>
        <motion.div animate={{ width: `${((index + 1) / questions.length) * 100}%` }} transition={{ ease: EASE }} className="vocab-progress-fill" />
      </div>
      {checked ? <SaveWordButton entry={current} /> : null}
      <label htmlFor="vocab-typing-answer" className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Type the term that matches this meaning</label>
      <div className="vocab-typing-prompt">
        <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <p className="text-[15px] font-semibold leading-6 text-slate-800">{current.definition}</p>
      </div>

      <input
        ref={inputRef}
        id="vocab-typing-answer"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          if (checked) next()
          else check()
        }}
        placeholder="Type the word…"
        disabled={checked}
        className={`mt-4 w-full rounded-xl border px-4 py-3 text-base outline-none transition ${
          checked ? (correct ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-red-400 bg-red-50 text-red-700') : 'border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
        }`}
      />

      <AnimatePresence>
        {checked ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div role="status" className={`vocab-answer-feedback mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${correct ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              <p>{correct ? '✓ Correct!' : <>Answer: <span className="font-black">{current.term}</span></>}</p>
              <WordDetailsButton entry={current} />
            </div>
          </motion.div>
        ) : reveal ? (
          <p className="mt-3 text-sm text-slate-500">Hint: starts with <span className="font-bold text-slate-700">“{current.term.slice(0, Math.ceil(current.term.length / 3))}…”</span></p>
        ) : null}
      </AnimatePresence>

      <div className="vocab-question-footer">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-500">{index + 1} / {questions.length}</p>
          {!checked ? (
            <button onClick={() => setReveal(true)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Hint</button>
          ) : null}
        </div>
        {checked ? (
          <button ref={nextRef} onClick={next} className="inline-flex items-center gap-1 rounded-xl vocab-primary-button px-5 py-2 text-sm font-semibold text-white">{index === questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="h-4 w-4" /></button>
        ) : (
          <button onClick={check} disabled={!value.trim()} className="inline-flex items-center gap-1 rounded-xl vocab-primary-button px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"><Check className="h-4 w-4" /> Check</button>
        )}
      </div>
    </section>
  )
}

function MistakeReview({ entries }: { entries: VocabularyEntry[] }) {
  if (!entries.length) return <p className="vocab-result-note">Every answer correct. Keep the momentum going.</p>
  return <div className="vocab-mistake-review"><VocabularyLibrary entries={entries} label="Review words to practise" /></div>
}

function ColumnPager({ label, page, count, onChange }: { label: string; page: number; count: number; onChange: (page: number) => void }) {
  if (count <= 1) return null
  return <div className="vocab-column-pager"><button type="button" aria-label={`Previous ${label}`} disabled={page === 0} onClick={() => onChange(page - 1)}><ArrowLeft size={13} /></button><span>{page + 1} / {count}</span><button type="button" aria-label={`Next ${label}`} disabled={page >= count - 1} onClick={() => onChange(page + 1)}><ArrowRight size={13} /></button></div>
}
