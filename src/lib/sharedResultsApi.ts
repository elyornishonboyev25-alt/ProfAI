import { apiClient } from '@/lib/apiClient'

export type SharedSectionSummary = {
  title: string
  correctAnswers: number
  totalQuestions: number
  accuracy: number
}

export type CreateSharedResultInput = {
  attemptKey: string
  testId: string
  testTitle: string
  attemptedAt: string
  bandScore: number
  accuracy: number
  correctAnswers: number
  incorrectAnswers: number
  skippedAnswers: number
  totalQuestions: number
  timeSpentSec: number
  sectionSummaries: SharedSectionSummary[]
  recommendations: string[]
}

export type PublicSharedResult = Omit<CreateSharedResultInput, 'attemptKey'> & {
  id: string
  createdAt: string
  user: {
    fullName: string
    nickname: string | null
    avatarUrl: string | null
  }
}

export async function createSharedResult(input: CreateSharedResultInput) {
  return apiClient.post<{ shareId: string; path: string }>('/shared-results', input)
}

export async function getSharedResult(shareId: string) {
  return apiClient.get<{ result: PublicSharedResult }>(`/shared-results/${encodeURIComponent(shareId)}`, {
    auth: false,
  })
}
