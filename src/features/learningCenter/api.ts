import { apiClient } from '@/lib/apiClient'
import type {
  CenterAssignment,
  CenterExamTrack,
  CenterGroup,
  CenterOverview,
  CenterRole,
  CenterStudent,
  CenterWorkspace,
  LeaderboardRow,
  PerformanceInsight,
  StudentDetail,
  TeamMember,
} from './types'

export const learningCenterApi = {
  workspaces: () => apiClient.get<{ workspaces: CenterWorkspace[] }>('/learning-centers/workspaces'),
  createWorkspace: (input: { name: string; city?: string; timezone: string }) =>
    apiClient.post<{ workspace: CenterWorkspace }>('/learning-centers/workspaces', input),
  join: (code: string) => apiClient.post<{ workspace: CenterWorkspace }>(`/learning-centers/join/${encodeURIComponent(code)}`),
  overview: (slug: string, days = 90) =>
    apiClient.get<CenterOverview>(`/learning-centers/${encodeURIComponent(slug)}/overview?days=${days}`),
  students: (slug: string, query: { search?: string; groupId?: string; exam?: string; status?: string; days?: number } = {}) => {
    const params = new URLSearchParams()
    if (query.search) params.set('search', query.search)
    if (query.groupId) params.set('groupId', query.groupId)
    if (query.exam) params.set('exam', query.exam)
    if (query.status) params.set('status', query.status)
    if (query.days) params.set('days', String(query.days))
    return apiClient.get<{ students: CenterStudent[] }>(`/learning-centers/${encodeURIComponent(slug)}/students?${params}`)
  },
  student: (slug: string, studentId: string) =>
    apiClient.get<StudentDetail>(`/learning-centers/${encodeURIComponent(slug)}/students/${encodeURIComponent(studentId)}`),
  addNote: (slug: string, studentId: string, note: string) =>
    apiClient.post(`/learning-centers/${encodeURIComponent(slug)}/students/${encodeURIComponent(studentId)}/notes`, { note }),
  analyzeStudent: (slug: string, studentId: string) =>
    apiClient.post<{ insight: PerformanceInsight; engine: string; model: string | null; fallbackUsed: boolean }>(
      `/learning-centers/${encodeURIComponent(slug)}/students/${encodeURIComponent(studentId)}/ai-analysis`,
    ),
  groups: (slug: string) => apiClient.get<{ groups: CenterGroup[] }>(`/learning-centers/${encodeURIComponent(slug)}/groups`),
  createGroup: (slug: string, input: { name: string; examTrack: CenterExamTrack; teacherId?: string; targetScore?: string; schedule?: string }) =>
    apiClient.post(`/learning-centers/${encodeURIComponent(slug)}/groups`, input),
  team: (slug: string) => apiClient.get<{ team: TeamMember[] }>(`/learning-centers/${encodeURIComponent(slug)}/team`),
  invite: (slug: string, input: { email?: string; role: Exclude<CenterRole, 'OWNER'>; groupId?: string; title?: string }) =>
    apiClient.post<{
      status: 'MEMBER_ADDED' | 'INVITATION_CREATED'
      memberId?: string
      invitation?: { code: string; expiresAt: string; joinPath: string }
    }>(`/learning-centers/${encodeURIComponent(slug)}/invitations`, input),
  assignments: (slug: string) =>
    apiClient.get<{ assignments: CenterAssignment[] }>(`/learning-centers/${encodeURIComponent(slug)}/assignments`),
  createAssignment: (slug: string, input: {
    title: string
    description?: string
    kind: CenterAssignment['kind']
    examTrack: CenterExamTrack
    routePath: string
    targetScore?: string
    dueAt: string
    groupId?: string
    studentId?: string
  }) => apiClient.post(`/learning-centers/${encodeURIComponent(slug)}/assignments`, input),
  updateSubmission: (slug: string, submissionId: string, input: { status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'; progress: number }) =>
    apiClient.patch(`/learning-centers/${encodeURIComponent(slug)}/submissions/${encodeURIComponent(submissionId)}`, input),
  leaderboard: (slug: string, exam: 'SAT' | 'IELTS', metric: 'SCORE' | 'IMPROVEMENT', groupId?: string) => {
    const params = new URLSearchParams({ exam, metric })
    if (groupId) params.set('groupId', groupId)
    return apiClient.get<{ exam: 'SAT' | 'IELTS'; metric: 'SCORE' | 'IMPROVEMENT'; rows: LeaderboardRow[] }>(
      `/learning-centers/${encodeURIComponent(slug)}/leaderboard?${params}`,
    )
  },
  syncResult: (input: {
    sourceKey: string
    sourceType: string
    examType: 'IELTS' | 'SAT'
    skill: string
    title: string
    score: number
    maxScore: number
    accuracy?: number | null
    durationSec: number
    completedAt?: string
    breakdown?: Record<string, unknown>
    assignmentId?: string
  }) => apiClient.post('/learning-centers/results/sync', input),
}
