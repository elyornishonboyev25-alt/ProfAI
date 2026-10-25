import { apiClient } from '@/lib/apiClient'

export type SATStandingRow = {
  rank: number
  name: string
  nickname: string | null
  avatarUrl: string | null
  country: string | null
  total: number
  maxScore: number
  rw: number | null
  math: number | null
  correct: number
  durationSec: number
  completedAt: string
  isMe: boolean
}

export type SATStanding = {
  participants: number
  percentiles: { total: number | null; rw: number | null; math: number | null }
  average: number | null
  rows: SATStandingRow[]
  me: SATStandingRow | null
}

export type TestDiscussionPost = {
  id: string
  parentId: string | null
  body: string
  questionRef: string | null
  createdAt: string
  author: { name: string; nickname: string | null; avatarUrl: string | null }
  /** Learners who marked the post as helpful. */
  checks: number
  checked: boolean
  mine: boolean
  canDelete: boolean
  /** Top-level posts carry their thread, oldest reply first. */
  replies?: TestDiscussionPost[]
}

export const examResultsApi = {
  satStanding: (testId: string, scores: { total?: number | null; rw?: number | null; math?: number | null }) => {
    const params = new URLSearchParams()
    Object.entries(scores).forEach(([key, value]) => {
      if (typeof value === 'number') params.set(key, String(value))
    })
    return apiClient.get<SATStanding>(`/exam-results/sat/${encodeURIComponent(testId)}/standing?${params}`)
  },
  discussion: (exam: 'SAT' | 'IELTS', testId: string) =>
    apiClient.get<{ posts: TestDiscussionPost[] }>(`/exam-results/${exam}/${encodeURIComponent(testId)}/discussion`),
  postDiscussion: (
    exam: 'SAT' | 'IELTS',
    testId: string,
    body: string,
    target: { questionRef?: string; parentId?: string } = {},
  ) =>
    apiClient.post<{ post: TestDiscussionPost }>(`/exam-results/${exam}/${encodeURIComponent(testId)}/discussion`, {
      body,
      ...(target.questionRef ? { questionRef: target.questionRef } : {}),
      ...(target.parentId ? { parentId: target.parentId } : {}),
    }),
  deleteDiscussion: (id: string) => apiClient.delete<void>(`/exam-results/discussion/${encodeURIComponent(id)}`),
  checkDiscussion: (id: string, checked: boolean) => {
    const path = `/exam-results/discussion/${encodeURIComponent(id)}/check`
    return checked
      ? apiClient.put<{ checks: number; checked: boolean }>(path, {})
      : apiClient.delete<{ checks: number; checked: boolean }>(path)
  },
}

/** Platform percentiles need a meaningful crowd before they replace the national estimate. */
export const MIN_PLATFORM_PARTICIPANTS = 5

// Approximate College Board SAT user percentiles, interpolated between anchors.
const TOTAL_ANCHORS: Array<[number, number]> = [
  [400, 1],
  [600, 1],
  [700, 3],
  [800, 10],
  [900, 23],
  [1000, 40],
  [1100, 58],
  [1200, 74],
  [1300, 86],
  [1400, 94],
  [1500, 98],
  [1600, 99],
]
const SECTION_ANCHORS: Array<[number, number]> = [
  [200, 1],
  [300, 1],
  [350, 4],
  [400, 11],
  [450, 24],
  [500, 42],
  [550, 60],
  [600, 75],
  [650, 87],
  [700, 94],
  [750, 98],
  [800, 99],
]

export function nationalPercentile(score: number, scale: 800 | 1600) {
  const anchors = scale === 1600 ? TOTAL_ANCHORS : SECTION_ANCHORS
  if (score <= anchors[0][0]) return anchors[0][1]
  for (let index = 1; index < anchors.length; index++) {
    const [high, highValue] = anchors[index]
    if (score <= high) {
      const [low, lowValue] = anchors[index - 1]
      return Math.round(lowValue + ((score - low) / (high - low)) * (highValue - lowValue))
    }
  }
  return anchors[anchors.length - 1][1]
}

export function ordinal(value: number) {
  const whole = Math.round(value * 10) / 10
  if (!Number.isInteger(whole)) return `${whole}th`
  const mod100 = whole % 100
  if (mod100 >= 11 && mod100 <= 13) return `${whole}th`
  return `${whole}${['th', 'st', 'nd', 'rd'][whole % 10] ?? 'th'}`
}

/** Digital SAT content-domain weights published in the College Board test specifications. */
export const SAT_DOMAIN_SPECS: Record<string, { share: number; questions: string }> = {
  'Craft and Structure': { share: 28, questions: '13–15' },
  'Information and Ideas': { share: 26, questions: '12–14' },
  'Standard English Conventions': { share: 26, questions: '11–15' },
  'Expression of Ideas': { share: 20, questions: '8–12' },
  Algebra: { share: 35, questions: '13–15' },
  'Advanced Math': { share: 35, questions: '13–15' },
  'Problem-Solving and Data Analysis': { share: 15, questions: '5–7' },
  'Geometry and Trigonometry': { share: 15, questions: '5–7' },
}

export const SAT_REPORT_DOMAIN_ORDER = {
  'reading-writing': [
    'Craft and Structure',
    'Information and Ideas',
    'Standard English Conventions',
    'Expression of Ideas',
  ],
  math: ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'],
} as const

export const SKILL_BAR_SEGMENTS = 7

export function filledSegments(percent: number) {
  return Math.max(0, Math.min(SKILL_BAR_SEGMENTS, Math.round((percent / 100) * SKILL_BAR_SEGMENTS)))
}
