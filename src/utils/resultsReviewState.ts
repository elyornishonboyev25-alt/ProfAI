import { useAuthStore } from '@/store/authStore'
import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import { accountStorageFor } from './accountStorage'

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
  const value: StoredReviewPayload = {
    ...payload,
    savedAt: new Date().toISOString(),
  }
  // Independent stores: quota/privacy failures in one must not hide the result
  // or prevent the other from retaining the completed answers.
  try { window.sessionStorage.setItem(key(testId), JSON.stringify(value)) } catch { /* Keep the route payload usable. */ }
  try {
    accountStorageFor().setItem(`smarttest-completed-result:${testId}`, JSON.stringify({
      result: { ...payload.result, detailedBreakdown: { activeSectionIds: payload.result.detailedBreakdown?.activeSectionIds } },
      savedAt: value.savedAt,
    }))
  } catch { /* Session/history state can still retain this attempt. */ }
}

export function loadReviewState(testId: string): StoredReviewPayload | null {
  if (typeof window === 'undefined' || !testId) return null
  const readers = [
    () => window.sessionStorage.getItem(key(testId)),
    () => accountStorageFor().getItem(`smarttest-completed-result:${testId}`),
  ]
  for (const read of readers) {
    try {
      const raw = read()
      if (!raw) continue
      const parsed = JSON.parse(raw) as StoredReviewPayload
      if (parsed?.result?.testId !== testId || !parsed.result.answers) continue
      if (parsed.test && parsed.test.id !== testId) continue
      return parsed
    } catch { /* Try the independent backup if this store is unavailable. */ }
  }
  return null
}

