import { accountStorageFor } from '@/utils/accountStorage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExaminerTurn, SpeakingEvaluation } from '@/services/speakingAI'

// Persistent speaking history. Powers the hub stats, the speaking profile charts,
// the streak/retention features and (later) the social leaderboard. Stored locally
// per user id; a backend sync can be layered on top without changing this shape.

export type SpeakingSessionRecord = {
  id: string
  userId: string | null
  date: string // ISO timestamp
  /** e.g. "IELTS Part 1", "Full Mock", "Job Interview", "Live Partner" */
  modeLabel: string
  kind: 'examiner' | 'live'
  overallBand: number
  fluencyBand: number
  lexicalBand: number
  grammarBand: number
  pronunciationBand: number
  durationSec: number
  wordCount: number
  fillerCount: number
  summary: string
  /** Stored for the detailed review after a full mock. Older records omit these. */
  evaluation?: SpeakingEvaluation
  transcript?: ExaminerTurn[]
}

type SpeakingState = {
  sessions: SpeakingSessionRecord[]
  addSession: (record: Omit<SpeakingSessionRecord, 'id' | 'date'> & { date?: string }) => SpeakingSessionRecord
  removeSession: (id: string) => void
  clearForUser: (userId: string | null) => void
}

export const useSpeakingStore = create<SpeakingState>()(
  persist(
    (set, get) => ({
      sessions: [],
      addSession: (record) => {
        const full: SpeakingSessionRecord = {
          ...record,
          id: `spk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: record.date ?? new Date().toISOString(),
        }
        set((state) => ({ sessions: [full, ...state.sessions].slice(0, 200) }))
        saveSpeakingAccount(full.userId, get().sessions)
        return full
      },
      removeSession: (id) => {
        const owner = get().sessions.find((session) => session.id === id)?.userId
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) }))
        if (owner !== undefined) saveSpeakingAccount(owner, get().sessions)
      },
      clearForUser: (userId) => {
        set((state) => ({ sessions: state.sessions.filter((s) => s.userId !== userId) }))
        saveSpeakingAccount(userId, get().sessions)
      },
    }),
    { name: 'smarttest-speaking-history-v1' },
  ),
)

const SPEAKING_KEY = 'speaking-sessions'
function saveSpeakingAccount(owner: string | null, sessions: SpeakingSessionRecord[]) {
  try { accountStorageFor(owner ?? 'guest').setItem(SPEAKING_KEY, JSON.stringify(sessions.filter((session) => session.userId === owner))) } catch { /* Keep in-memory results. */ }
}
export function restoreSpeakingAccount(owner: string) {
  const storage = accountStorageFor(owner)
  const raw = storage.getItem(SPEAKING_KEY)
  if (raw === null) {
    const existing = useSpeakingStore.getState().sessions.filter((session) => session.userId === owner)
    if (existing.length) saveSpeakingAccount(owner, existing)
    return
  }
  try {
    const records = JSON.parse(raw)
    if (!Array.isArray(records)) return
    const sessions = records.filter((session) => session.userId === owner)
    useSpeakingStore.setState((state) => ({ sessions: [...state.sessions.filter((session) => session.userId !== owner), ...sessions] }))
  } catch { /* Ignore malformed cached records. */ }
}

// ── Derived analytics (pure helpers) ────────────────────────────────────────

export function selectUserSessions(
  sessions: SpeakingSessionRecord[],
  userId: string | null,
): SpeakingSessionRecord[] {
  return sessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
}

export type SpeakingSummary = {
  sessionCount: number
  totalMinutes: number
  averageBand: number
  bestBand: number
  currentStreak: number
  totalWords: number
}

function dayKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function computeStreak(sessions: SpeakingSessionRecord[]): number {
  if (sessions.length === 0) return 0
  const days = new Set(sessions.map((s) => dayKey(s.date)))
  let streak = 0
  const cursor = new Date()
  // Allow the streak to count if they practised today OR yesterday (grace day).
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(dayKey(cursor))) return 0
  }
  while (days.has(dayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeSummary(sessions: SpeakingSessionRecord[]): SpeakingSummary {
  if (sessions.length === 0) {
    return { sessionCount: 0, totalMinutes: 0, averageBand: 0, bestBand: 0, currentStreak: 0, totalWords: 0 }
  }
  const totalSec = sessions.reduce((s, x) => s + x.durationSec, 0)
  const avg = sessions.reduce((s, x) => s + x.overallBand, 0) / sessions.length
  const best = sessions.reduce((m, x) => Math.max(m, x.overallBand), 0)
  const words = sessions.reduce((s, x) => s + x.wordCount, 0)
  return {
    sessionCount: sessions.length,
    totalMinutes: Math.round(totalSec / 60),
    averageBand: Math.round(avg * 10) / 10,
    bestBand: best,
    currentStreak: computeStreak(sessions),
    totalWords: words,
  }
}

/** Skill radar averages across the 4 IELTS criteria + a derived coherence proxy. */
export function computeSkillRadar(
  sessions: SpeakingSessionRecord[],
): Array<{ skill: string; band: number }> {
  if (sessions.length === 0) {
    return [
      { skill: 'Fluency', band: 0 },
      { skill: 'Lexical', band: 0 },
      { skill: 'Grammar', band: 0 },
      { skill: 'Pronunciation', band: 0 },
      { skill: 'Coherence', band: 0 },
    ]
  }
  const avg = (pick: (s: SpeakingSessionRecord) => number) =>
    Math.round((sessions.reduce((acc, s) => acc + pick(s), 0) / sessions.length) * 10) / 10
  const fluency = avg((s) => s.fluencyBand)
  const overall = avg((s) => s.overallBand)
  return [
    { skill: 'Fluency', band: fluency },
    { skill: 'Lexical', band: avg((s) => s.lexicalBand) },
    { skill: 'Grammar', band: avg((s) => s.grammarBand) },
    { skill: 'Pronunciation', band: avg((s) => s.pronunciationBand) },
    { skill: 'Coherence', band: Math.round(((fluency + overall) / 2) * 10) / 10 },
  ]
}

/** Overall-band trend across the most recent sessions (oldest → newest). */
export function computeBandTrend(
  sessions: SpeakingSessionRecord[],
  limit = 12,
): Array<{ label: string; band: number }> {
  return sessions.slice(-limit).map((s, i) => ({
    label: `#${i + 1}`,
    band: s.overallBand,
  }))
}

/** Minutes spoken per day for the last `days` days (oldest → newest). */
export function computeDailyActivity(
  sessions: SpeakingSessionRecord[],
  days = 7,
): Array<{ label: string; minutes: number }> {
  const out: Array<{ label: string; minutes: number }> = []
  const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    const minutes = Math.round(
      sessions
        .filter((s) => dayKey(s.date) === key)
        .reduce((acc, s) => acc + s.durationSec, 0) / 60,
    )
    out.push({ label: weekdayFmt.format(d), minutes })
  }
  return out
}

/** Criteria breakdown for a radial / bar chart (latest-weighted average). */
export function computeCriteriaBreakdown(
  sessions: SpeakingSessionRecord[],
): Array<{ criterion: string; band: number; fill: string }> {
  const recent = sessions.slice(-6)
  const avg = (pick: (s: SpeakingSessionRecord) => number) =>
    recent.length ? Math.round((recent.reduce((a, s) => a + pick(s), 0) / recent.length) * 10) / 10 : 0
  return [
    { criterion: 'Fluency', band: avg((s) => s.fluencyBand), fill: '#ef4444' },
    { criterion: 'Lexical', band: avg((s) => s.lexicalBand), fill: '#f97316' },
    { criterion: 'Grammar', band: avg((s) => s.grammarBand), fill: '#e11d48' },
    { criterion: 'Pronunc.', band: avg((s) => s.pronunciationBand), fill: '#fb7185' },
  ]
}
