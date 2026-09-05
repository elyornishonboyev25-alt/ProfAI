import type { SATAttempt } from './practiceTest4'

const LEGACY_PRACTICE_4_KEY = 'profai:sat:practice-test-4:attempt:v1'
const HISTORY_KEY = 'profai:sat:attempt-history:v1'

export type SATAttemptSaveReason = 'exit' | 'submitted'

export type SATAttemptHistoryEntry = {
  id: string
  attempt: SATAttempt
  savedAt: number
  saveReason: SATAttemptSaveReason
}

function storageKey(testId: string) {
  return `profai:sat:${testId}:attempt:v1`
}

function withAttemptId(attempt: SATAttempt): SATAttempt {
  if (attempt.attemptId) return attempt
  return {
    ...attempt,
    attemptId: `${attempt.testId}-${attempt.startedAt}`,
  }
}

function readHistory(): SATAttemptHistoryEntry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]') as SATAttemptHistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry) => entry?.attempt?.testId && Number.isFinite(entry.savedAt))
      .map((entry) => {
        const attempt = withAttemptId(entry.attempt)
        return {
          ...entry,
          id: entry.id || attempt.attemptId,
          attempt,
        }
      })
  } catch {
    return []
  }
}

function writeHistory(entries: SATAttemptHistoryEntry[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
}

export function saveSATAttemptToHistory(
  attempt: SATAttempt,
  saveReason: SATAttemptSaveReason,
) {
  const normalizedAttempt = withAttemptId(attempt)
  const savedAt = normalizedAttempt.submittedAt ?? normalizedAttempt.updatedAt ?? Date.now()
  // A result only needs answer/review data. Excluding freehand stroke points keeps
  // repeated full mocks small enough to preserve a long, uncapped history.
  const historyAttempt: SATAttempt = { ...normalizedAttempt, highlights: {} }
  const entry: SATAttemptHistoryEntry = {
    id: normalizedAttempt.attemptId,
    attempt: historyAttempt,
    savedAt,
    saveReason,
  }
  const history = readHistory()
  const existingIndex = history.findIndex((item) => item.id === entry.id)
  if (existingIndex >= 0) history[existingIndex] = entry
  else history.push(entry)
  writeHistory(history)
}

export function loadSATAttemptHistory(): SATAttemptHistoryEntry[] {
  return readHistory().sort((a, b) => b.savedAt - a.savedAt)
}

export function deleteSATAttemptHistoryEntry(id: string) {
  writeHistory(readHistory().filter((entry) => entry.id !== id))
}

export function loadSATAttempt(testId: string): SATAttempt | null {
  try {
    const key = storageKey(testId)
    const raw = window.localStorage.getItem(key)
      ?? (testId === 'practice-test-4' ? window.localStorage.getItem(LEGACY_PRACTICE_4_KEY) : null)
    if (!raw) return null
    const parsed = withAttemptId(JSON.parse(raw) as SATAttempt)
    if (parsed.version !== 1 || parsed.testId !== testId) return null
    if (!window.localStorage.getItem(key) || !JSON.parse(raw).attemptId) {
      window.localStorage.setItem(key, JSON.stringify(parsed))
    }
    if (parsed.status === 'submitted') saveSATAttemptToHistory(parsed, 'submitted')
    return parsed
  } catch {
    return null
  }
}

export function saveSATAttempt(attempt: SATAttempt) {
  const normalizedAttempt = withAttemptId(attempt)
  const storedAttempt = { ...normalizedAttempt, updatedAt: Date.now() }
  window.localStorage.setItem(
    storageKey(normalizedAttempt.testId),
    JSON.stringify(storedAttempt),
  )
  if (storedAttempt.status === 'submitted') {
    saveSATAttemptToHistory(storedAttempt, 'submitted')
  }
}

export function clearSATAttempt(testId: string) {
  window.localStorage.removeItem(storageKey(testId))
  if (testId === 'practice-test-4') window.localStorage.removeItem(LEGACY_PRACTICE_4_KEY)
}
