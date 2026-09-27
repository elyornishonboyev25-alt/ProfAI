import { apiClient } from '@/lib/apiClient'

export type StudySkill = 'IELTS_READING' | 'IELTS_LISTENING' | 'IELTS_WRITING' | 'IELTS_SPEAKING' | 'SAT_MATH' | 'SAT_READING_WRITING'
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'
export type StudyAnswers = {
  universities: string[]
  destinationCountry: string
  intendedMajor: string
  intakeYear: number
  applicationDeadline: string | null
  examTrack: 'IELTS' | 'SAT' | 'BOTH' | 'NONE' | 'UNSURE'
  ieltsExamDate: string | null
  satExamDate: string | null
  currentIeltsScore: number | null
  currentSatScore: number | null
  targetIeltsScore: number | null
  targetSatScore: number | null
  weeklyAvailability: number[]
  applicationProgress: Record<'shortlist' | 'transcripts' | 'essay' | 'recommendations' | 'activities' | 'funding', ProgressStatus>
  needsFunding: boolean
}
export type StudyTask = {
  id: string
  title: string
  outcome: string
  minutes: number
  category: 'IELTS' | 'SAT' | 'APPLICATION'
  skill: StudySkill | null
  milestoneKey: string | null
  route: string
  completionMode: 'ASSESSMENT' | 'MANUAL'
  status: 'TODO' | 'DONE'
  completedAt: string | null
}
export type StudyDay = { date: string; tasks: StudyTask[] }
export type StudyWeek = {
  id: string
  weekStart: string
  days: StudyDay[]
  review: { headline: string; reasons: string[]; completed: number; total: number; focusSkill: StudySkill | null }
  generatedAt: string
}
export type StudyRoadmapItem = {
  key: string
  title: string
  detail: string
  timing: string
  route: string
  status: 'DONE' | 'IN_PROGRESS' | 'TODO'
}
export type StudyPlanResponse = {
  today: string
  defaults: {
    universities: string[]
    destinationCountry: string
    intendedMajor: string
    intakeYear: number
    examTrack: StudyAnswers['examTrack']
    targetIeltsScore: number | null
    targetSatScore: number | null
    currentIeltsScore: number | null
    currentSatScore: number | null
    dailyStudyHours: number
    timeZone: string
  }
  evidence: Array<{ skill: StudySkill; attempts: number; accuracy: number }>
  plan: null | {
    id: string
    answers: StudyAnswers
    roadmap: StudyRoadmapItem[]
    currentWeek: StudyWeek | null
    history: Array<{ id: string; weekStart: string; days: StudyDay[] }>
    updatedAt: string
  }
}

export const studyPlanApi = {
  get: () => apiClient.get<StudyPlanResponse>('/study-plan'),
  save: (answers: StudyAnswers) => apiClient.put<StudyPlanResponse>('/study-plan', answers),
  complete: (taskId: string, completed: boolean) => apiClient.patch<StudyPlanResponse>(`/study-plan/tasks/${encodeURIComponent(taskId)}`, { completed }),
  milestone: (key: keyof StudyAnswers['applicationProgress'], status: ProgressStatus) => apiClient.patch<StudyPlanResponse>(`/study-plan/milestones/${key}`, { status }),
}

export async function syncLocalStudyEvidence(userId: string) {
  const { getLocalDashboardAttempts } = await import('@/utils/localProfilePerformance')
  const attempts = getLocalDashboardAttempts(userId).filter((item) => !item.synced).slice(-30)
  const entries = attempts.flatMap((attempt) => attempt.tracks.map((skill) => ({
    sourceKey: attempt.sourceKey.slice(0, 130),
    skill,
    title: attempt.title.slice(0, 180),
    accuracy: Math.max(0, Math.min(100, attempt.accuracy)),
    completedAt: attempt.completedAt,
  })))
  if (entries.length) await apiClient.post('/study-plan/evidence', { entries: entries.slice(0, 60) })
}
