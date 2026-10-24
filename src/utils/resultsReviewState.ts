import { useAuthStore } from '@/store/authStore'
import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import { accountStorageFor } from './accountStorage'
import { compactIeltsResult, readIeltsPaperSnapshot } from './ieltsPaperSnapshots'

type StoredReviewPayload = {
  result: TestResult
  test?: IELTSTest
  savedAt: string
}

function key(testId: string) {
  return `smarttest-review-state:${useAuthStore.getState().user?.id ?? 'guest'}:${testId}`
}

export function saveReviewState(testId: string, payload: { result: TestResult; test: IELTSTest }) {
  if (typeof window === 'undefined' || !testId) return
  if (payload.result.testId !== testId || payload.test.id !== testId) return
  const previous = loadReviewState(testId)
  const value: StoredReviewPayload = {
    result: compactIeltsResult(payload.result, payload.test),
    savedAt: payload.result.date,
  }
  // Independent stores: quota/privacy failures in one must not hide the result
  // or prevent the other from retaining the completed answers.
  try { window.sessionStorage.setItem(key(testId), JSON.stringify(value)) } catch { /* Keep the route payload usable. */ }
  try {
    const backup = JSON.stringify({
      result: value.result,
      savedAt: value.savedAt,
    })
    accountStorageFor().setItem(`smarttest-completed-attempt:${testId}:${payload.result.date}`, backup)
    if (!previous || (Date.parse(payload.result.date) || 0) >= (Date.parse(previous.result.date) || 0)) {
      accountStorageFor().setItem(`smarttest-completed-result:${testId}`, backup)
    }
  } catch { /* Session/history state can still retain this attempt. */ }
}

export function loadReviewState(testId: string): StoredReviewPayload | null {
  if (typeof window === 'undefined' || !testId) return null
  const readers = [
    () => window.sessionStorage.getItem(key(testId)),
    () => accountStorageFor().getItem(`smarttest-completed-result:${testId}`),
  ]
  let newest: StoredReviewPayload | null = null
  for (const read of readers) {
    try {
      const raw = read()
      if (!raw) continue
      const parsed = JSON.parse(raw) as StoredReviewPayload
      if (parsed?.result?.testId !== testId || !parsed.result.answers || typeof parsed.result.answers !== 'object' || Array.isArray(parsed.result.answers)) continue
      if (parsed.test && parsed.test.id !== testId) continue
      parsed.test ??= readIeltsPaperSnapshot(parsed.result.detailedBreakdown?.paperSnapshotKey, testId) ?? undefined
      if (!newest || (Date.parse(parsed.result.date) || 0) > (Date.parse(newest.result.date) || 0)) newest = parsed
    } catch { /* Try the independent backup if this store is unavailable. */ }
  }
  return newest
}

