import type { WritingEvaluation, WritingError } from '@/services/geminiAI'
import type { WritingTask } from '@/data/writingTestData'

const HISTORY_VERSION = 'v1'
const ENTRY_LIMIT = 30
const XP_KEY = 'smarttest-writing-xp'

export interface WritingAnalysisEntry {
  attemptKey: string
  savedAt: string
  testId: string
  testTitle: string
  taskType: 'task1' | 'task2'
  wordCount: number
  timeSpent: number
  timerEnabled: boolean
  studentResponse: string
  overallBand: number
  taskAchievement: number
  coherenceCohesion: number
  lexicalResource: number
  grammaticalRange: number
  summary: string
  strengths: string[]
  improvements: string[]
  errors: WritingError[]
  correctedVersion: string
  xpAwarded: number
  fullTest?: { id: string; overallBand: number }
  taskSnapshot?: WritingTask
}

function getStorageKey(userId?: string): string {
  const owner = userId?.trim() || 'guest'
  return `smarttest-writing-analysis-${HISTORY_VERSION}:${owner}`
}

function getXPKey(userId?: string): string {
  const owner = userId?.trim() || 'guest'
  return `${XP_KEY}-${HISTORY_VERSION}:${owner}`
}

function safeParseHistory(value: string | null): WritingAnalysisEntry[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e) => typeof e?.attemptKey === 'string')
  } catch {
    return []
  }
}

export function getWritingAnalysisHistory(userId?: string): WritingAnalysisEntry[] {
  if (typeof window === 'undefined') return []
  try { return safeParseHistory(window.localStorage.getItem(getStorageKey(userId))) }
  catch { return [] }
}

export function saveWritingAnalysis(
  userId: string | undefined,
  testId: string,
  testTitle: string,
  taskType: 'task1' | 'task2',
  wordCount: number,
  timeSpent: number,
  timerEnabled: boolean,
  studentResponse: string,
  evaluation: WritingEvaluation,
  fullTest?: { id: string; overallBand: number },
  taskSnapshot?: WritingTask,
): WritingAnalysisEntry {
  const entry: WritingAnalysisEntry = {
    attemptKey: `writing-${testId}-${Date.now()}`,
    savedAt: new Date().toISOString(),
    testId,
    testTitle,
    taskType,
    wordCount,
    timeSpent,
    timerEnabled,
    studentResponse,
    overallBand: evaluation.overallBand,
    taskAchievement: evaluation.taskAchievement,
    coherenceCohesion: evaluation.coherenceCohesion,
    lexicalResource: evaluation.lexicalResource,
    grammaticalRange: evaluation.grammaticalRange,
    summary: evaluation.summary,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    errors: evaluation.errors,
    correctedVersion: evaluation.correctedVersion,
    xpAwarded: evaluation.xpAwarded,
    fullTest,
    taskSnapshot,
  }

  if (typeof window === 'undefined') return entry

  try {
    const storageKey = getStorageKey(userId)
    const current = safeParseHistory(window.localStorage.getItem(storageKey))
    const merged = [entry, ...current].slice(0, ENTRY_LIMIT)
    window.localStorage.setItem(storageKey, JSON.stringify(merged))
    addWritingXP(userId, evaluation.xpAwarded)
  } catch { /* An unavailable or full local store must not hide the evaluation. */ }

  return entry
}

export function getWritingXP(userId?: string): number {
  if (typeof window === 'undefined') return 0
  try {
    const val = window.localStorage.getItem(getXPKey(userId))
    return val ? parseInt(val, 10) || 0 : 0
  } catch { return 0 }
}

function addWritingXP(userId: string | undefined, xp: number): void {
  if (typeof window === 'undefined') return
  const current = getWritingXP(userId)
  window.localStorage.setItem(getXPKey(userId), String(current + xp))
}

export function removeWritingAnalysisAttempt(attemptKey: string, userId?: string): WritingAnalysisEntry[] {
  if (typeof window === 'undefined') return []
  const storageKey = getStorageKey(userId)
  const current = safeParseHistory(window.localStorage.getItem(storageKey))
  const next = current.filter((e) => e.attemptKey !== attemptKey)
  window.localStorage.setItem(storageKey, JSON.stringify(next))
  return next
}

export function clearWritingAnalysisHistory(userId?: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(getStorageKey(userId))
}
