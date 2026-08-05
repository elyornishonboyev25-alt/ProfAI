import type { SATAttempt } from './practiceTest4'

const LEGACY_PRACTICE_4_KEY = 'profai:sat:practice-test-4:attempt:v1'

function storageKey(testId: string) {
  return `profai:sat:${testId}:attempt:v1`
}

export function loadSATAttempt(testId: string): SATAttempt | null {
  try {
    const key = storageKey(testId)
    const raw = window.localStorage.getItem(key)
      ?? (testId === 'practice-test-4' ? window.localStorage.getItem(LEGACY_PRACTICE_4_KEY) : null)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SATAttempt
    if (parsed.version !== 1 || parsed.testId !== testId) return null
    if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, raw)
    return parsed
  } catch {
    return null
  }
}

export function saveSATAttempt(attempt: SATAttempt) {
  window.localStorage.setItem(
    storageKey(attempt.testId),
    JSON.stringify({ ...attempt, updatedAt: Date.now() }),
  )
}

export function clearSATAttempt(testId: string) {
  window.localStorage.removeItem(storageKey(testId))
  if (testId === 'practice-test-4') window.localStorage.removeItem(LEGACY_PRACTICE_4_KEY)
}
