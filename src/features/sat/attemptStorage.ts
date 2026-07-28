import type { SATAttempt } from './practiceTest4'

export const SAT_ATTEMPT_STORAGE_KEY = 'profai:sat:practice-test-4:attempt:v1'

export function loadSATPracticeTest4Attempt(): SATAttempt | null {
  try {
    const raw = window.localStorage.getItem(SAT_ATTEMPT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SATAttempt
    if (parsed.version !== 1 || parsed.testId !== 'practice-test-4') return null
    return parsed
  } catch {
    return null
  }
}
export function saveSATPracticeTest4Attempt(attempt: SATAttempt) {
  window.localStorage.setItem(
    SAT_ATTEMPT_STORAGE_KEY,
    JSON.stringify({ ...attempt, updatedAt: Date.now() }),
  )
}

export function clearSATPracticeTest4Attempt() {
  window.localStorage.removeItem(SAT_ATTEMPT_STORAGE_KEY)
}
