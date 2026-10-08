import { useAuthStore } from '@/store/authStore'
import type { IELTSTest, TestResult } from '@/types/ieltsTypes'

type StoredReviewPayload = {
  result: TestResult
  test: IELTSTest
  savedAt: string
}

function key(testId: string) {
  return `smarttest-review-state:${useAuthStore.getState().user?.id ?? 'guest'}:${testId}`
}

export function saveReviewState(testId: string, payload: { result: TestResult; test: IELTSTest }) {
  if (typeof window === 'undefined' || !testId) return
  const value: StoredReviewPayload = {
    ...payload,
    savedAt: new Date().toISOString(),
  }
  window.sessionStorage.setItem(key(testId), JSON.stringify(value))
}

export function loadReviewState(testId: string): StoredReviewPayload | null {
  if (typeof window === 'undefined' || !testId) return null
  const raw = window.sessionStorage.getItem(key(testId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as StoredReviewPayload
    if (!parsed?.result || !parsed?.test) return null
    return parsed
  } catch {
    return null
  }
}

