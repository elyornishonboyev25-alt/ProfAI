import { apiClient } from '@/lib/apiClient'

export type ReviewExam = 'IELTS' | 'SAT' | 'General'

export interface LandingReview {
  id: string
  name: string
  exam: ReviewExam
  rating: number
  bandBefore?: string | null
  bandAfter?: string | null
  text: string
  createdAt: string
  source: 'server' | 'local'
}

export interface ReviewInput {
  name: string
  exam: ReviewExam
  rating: number
  bandBefore?: string
  bandAfter?: string
  text: string
}

const LOCAL_KEY = 'profai.landing.reviews.v1'

function readLocal(): LandingReview[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LandingReview[]
    return Array.isArray(parsed) ? parsed.map((review) => ({ ...review, source: 'local' as const })) : []
  } catch {
    return []
  }
}

function writeLocal(reviews: LandingReview[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(reviews.slice(0, 40)))
  } catch {
    // Review storage is optional and must never block the product.
  }
}

function dedupe(reviews: LandingReview[]) {
  const seen = new Set<string>()
  return reviews.filter((review) => {
    if (seen.has(review.id)) return false
    seen.add(review.id)
    return true
  })
}

/** Loads genuine server or locally submitted reviews without seeded stories. */
export async function loadReviews(): Promise<LandingReview[]> {
  const local = readLocal()
  try {
    const { reviews } = await apiClient.get<{ reviews: Omit<LandingReview, 'source'>[] }>('/reviews?limit=36', { auth: false })
    const server = reviews.map((review): LandingReview => ({ ...review, source: 'server' }))
    return dedupe([...server, ...local])
  } catch {
    return dedupe(local)
  }
}

export async function submitReview(input: ReviewInput): Promise<LandingReview> {
  const payload: ReviewInput = {
    ...input,
    bandBefore: input.bandBefore?.trim() || undefined,
    bandAfter: input.bandAfter?.trim() || undefined,
  }

  try {
    const { review } = await apiClient.post<{ review: Omit<LandingReview, 'source'> }>('/reviews', payload, { auth: false })
    return { ...review, source: 'server' }
  } catch {
    const fallback: LandingReview = {
      id: `local-${Date.now()}`,
      name: input.name,
      exam: input.exam,
      rating: input.rating,
      bandBefore: payload.bandBefore ?? null,
      bandAfter: payload.bandAfter ?? null,
      text: input.text,
      createdAt: new Date().toISOString(),
      source: 'local',
    }
    writeLocal([fallback, ...readLocal()])
    return fallback
  }
}
