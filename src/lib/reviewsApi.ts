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
  /** Where the review came from — used so locally-stored entries are clearly the visitor's own. */
  source: 'server' | 'local' | 'seed'
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

/** Hand-written launch testimonials shown until real submissions arrive. They
 *  always render last so genuine student stories take the spotlight. */
const SEED_REVIEWS: LandingReview[] = [
  {
    id: 'seed-1',
    name: 'Nurmukhammad N.',
    exam: 'IELTS',
    rating: 5,
    bandBefore: '5.5',
    bandAfter: '7.5',
    text: 'The mock felt exactly like the real exam — no pausing, no restarting the audio. That pressure is what got me ready. Huge thanks to the team.',
    createdAt: '2026-05-02T09:00:00.000Z',
    source: 'seed',
  },
  {
    id: 'seed-2',
    name: 'Saltanat S.',
    exam: 'IELTS',
    rating: 5,
    bandBefore: '6.0',
    bandAfter: '7.5',
    text: 'I finished the full marathon and sat the real test 23 days later. The explanation videos pushed my reading up a lot, and the site itself is so easy to use.',
    createdAt: '2026-05-18T14:30:00.000Z',
    source: 'seed',
  },
  {
    id: 'seed-3',
    name: 'Samandar R.',
    exam: 'SAT',
    rating: 5,
    bandBefore: '1180',
    bandAfter: '1450',
    text: 'One of the coolest study projects I have ever used. The route told me exactly what to fix instead of random practice.',
    createdAt: '2026-06-01T11:15:00.000Z',
    source: 'seed',
  },
]

function readLocal(): LandingReview[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LandingReview[]
    return Array.isArray(parsed) ? parsed.map((r) => ({ ...r, source: 'local' as const })) : []
  } catch {
    return []
  }
}

function writeLocal(reviews: LandingReview[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(reviews.slice(0, 40)))
  } catch {
    // Storage unavailable (private mode / quota) — non-fatal for the landing page.
  }
}

function dedupe(reviews: LandingReview[]): LandingReview[] {
  const seen = new Set<string>()
  return reviews.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })
}

/**
 * Load the testimonials for the landing page. Tries the shared backend first
 * (so every visitor sees the same wall of reviews); on any failure it falls
 * back to whatever this device submitted locally. Seed stories always round
 * out the list so the section is never empty.
 */
export async function loadReviews(): Promise<LandingReview[]> {
  const local = readLocal()

  try {
    const { reviews } = await apiClient.get<{ reviews: Omit<LandingReview, 'source'>[] }>('/reviews?limit=36', {
      auth: false,
    })
    const server: LandingReview[] = reviews.map((r) => ({ ...r, source: 'server' }))
    // Server is the source of truth; keep local entries that haven't synced yet, then seeds.
    return dedupe([...server, ...local, ...SEED_REVIEWS])
  } catch {
    return dedupe([...local, ...SEED_REVIEWS])
  }
}

/**
 * Submit a review. Posts to the backend so it becomes visible to everyone; if
 * the backend is unreachable it is stored locally so the visitor still sees
 * their own story immediately (and it will show on this device).
 */
export async function submitReview(input: ReviewInput): Promise<LandingReview> {
  const payload: ReviewInput = {
    ...input,
    bandBefore: input.bandBefore?.trim() || undefined,
    bandAfter: input.bandAfter?.trim() || undefined,
  }

  try {
    const { review } = await apiClient.post<{ review: Omit<LandingReview, 'source'> }>('/reviews', payload, {
      auth: false,
    })
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
