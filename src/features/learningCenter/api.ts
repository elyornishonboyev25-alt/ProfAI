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
  createWorkspace: (input: { name: string; city?: string; timezone: string; coverUrl?: string | null }) =>
    apiClient.post<{ workspace: CenterWorkspace }>('/learning-centers/workspaces', input),
  updateWorkspace: (slug: string, input: { name: string; city: string | null; coverUrl: string | null }) =>
    apiClient.patch<{ workspace: CenterWorkspace }>(`/learning-centers/${encodeURIComponent(slug)}/settings`, input),
  deleteWorkspace: (slug: string) => apiClient.delete(`/learning-centers/${encodeURIComponent(slug)}/settings`),
  join: (code: string) => apiClient.post<{ workspace: CenterWorkspace }>(`/learning-centers/join/${encodeURIComponent(code)}`),
  overview: (slug: string, days = 90) =>
    apiClient.get<CenterOverview>(`/learning-centers/${encodeURIComponent(slug)}/overview?days=${days}`),
  students: async (slug: string, query: { search?: string; groupId?: string; exam?: string; status?: string; days?: number; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams()
    if (query.search) params.set('search', query.search)
    if (query.groupId) params.set('groupId', query.groupId)
    if (query.exam) params.set('exam', query.exam)
    if (query.status) params.set('status', query.status)
    // Omit the all-time default: older deployed APIs reject an explicit zero.
    if (query.days && query.days > 0) params.set('days', String(query.days))
    if (query.page) params.set('page', String(query.page))
    if (query.pageSize) params.set('pageSize', String(query.pageSize))
    const response = await apiClient.get<{ students: CenterStudent[]; pagination?: { page: number; pageSize: number; total: number; pages: number } }>(`/learning-centers/${encodeURIComponent(slug)}/students?${params}`)
    // Web and API deploy independently. Older APIs ignore pagination and return
    // the entire filtered roster; keep every learner reachable during rollout.
    if (!response.pagination && query.page) {
      const pageSize = query.pageSize ?? 25
      const pages = Math.max(1, Math.ceil(response.students.length / pageSize))
      const page = Math.min(Math.max(1, query.page), pages)
      return { students: response.students.slice((page - 1) * pageSize, page * pageSize),
        pagination: { page, pageSize, pages, total: response.students.length } }
    }
    return response
  },
  studentOptions: (slug: string) => apiClient.get<{ students: Array<{ id: string; fullName: string }> }>(`/learning-centers/${encodeURIComponent(slug)}/students?compact=1`),
  student: (slug: string, studentId: string) =>
    apiClient.get<StudentDetail>(`/learning-centers/${encodeURIComponent(slug)}/students/${encodeURIComponent(studentId)}`),
  addNote: (slug: string, studentId: string, note: string) =>
    apiClient.post(`/learning-centers/${encodeURIComponent(slug)}/students/${encodeURIComponent(studentId)}/notes`, { note }),
  analyzeStudent: (slug: string, studentId: string) =>
    apiClient.post<{ insight: PerformanceInsight; engine: string; model: string | null; fallbackUsed: boolean }>(
      `/learning-centers/${encodeURIComponent(slug)}/students/${encodeURIComponent(studentId)}/ai-analysis`,
    ),
  groups: (slug: string) => apiClient.get<{ groups: CenterGroup[] }>(`/learning-centers/${encodeURIComponent(slug)}/groups`),
  groupOptions: (slug: string) => apiClient.get<{ groups: Array<{ id: string; name: string; examTrack: CenterExamTrack }> }>(`/learning-centers/${encodeURIComponent(slug)}/groups?compact=1`),
  createGroup: (slug: string, input: { name: string; examTrack: CenterExamTrack; teacherId?: string; targetScore?: string; schedule?: string }) =>
    apiClient.post(`/learning-centers/${encodeURIComponent(slug)}/groups`, input),
  team: (slug: string) => apiClient.get<{ team: TeamMember[] }>(`/learning-centers/${encodeURIComponent(slug)}/team`),
  invite: (slug: string, input: { email?: string; nickname?: string; role: Exclude<CenterRole, 'OWNER'>; groupId?: string; title?: string }) =>
    apiClient.post<{
      status: 'MEMBER_ADDED' | 'INVITATION_CREATED'
      memberId?: string
      invitation?: { code: string; expiresAt: string; joinPath: string }
    }>(`/learning-centers/${encodeURIComponent(slug)}/invitations`, input),
  updateMemberRole: (slug: string, memberId: string, role: 'ADMIN' | 'TEACHER' | 'STUDENT') =>
    apiClient.patch(`/learning-centers/${encodeURIComponent(slug)}/members/${encodeURIComponent(memberId)}/role`, { role }),
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
    preserveExisting?: boolean
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
  }) => apiClient.post(input.preserveExisting ? '/learning-centers/results/recover' : '/learning-centers/results/sync', input).then(result => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('smarttest:attempt-submitted'))
    return result
  }),
}
