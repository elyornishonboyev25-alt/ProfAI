import { apiClient } from '@/lib/apiClient'

export type ReviewExam = 'IELTS' | 'SAT' | 'General'

export interface LandingReview {
  id: string
  name: string
  exam: ReviewExam
  rating: number | null
  bandBefore: string | null
  bandAfter: string | null
  text: string
  createdAt: string
  approved?: boolean
}

export interface ReviewInput {
  name: string
  exam: ReviewExam
  rating?: number
  bandBefore?: string
  bandAfter?: string
  text: string
}

/** Only server-approved public reviews are returned. */
export async function loadReviews(): Promise<LandingReview[]> {
  const { reviews } = await apiClient.get<{ reviews: LandingReview[] }>('/reviews?limit=36', { auth: false })
  return reviews
}

/** A submission succeeds only when the API confirms storage. */
export async function submitReview(input: ReviewInput): Promise<LandingReview> {
  const { review } = await apiClient.post<{ review: LandingReview }>('/reviews', {
    ...input,
    name: input.name.trim(),
    text: input.text.trim(),
    bandBefore: input.bandBefore?.trim() || undefined,
    bandAfter: input.bandAfter?.trim() || undefined,
  }, { auth: false })
  return review
}
