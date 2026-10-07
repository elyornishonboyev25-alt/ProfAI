import React, { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import LearningCenterPortal from '../../src/pages/LearningCenterPortal'
import LearningCenterWorkspace from '../../src/pages/LearningCenterWorkspace'
import LearningCenterJoin from '../../src/pages/LearningCenterJoin'
import ProtectedRoute from '../../src/components/auth/ProtectedRoute'
import { InvitationLink } from '../../src/features/learningCenter/components'
import { learningCenterApi } from '../../src/features/learningCenter/api'
import { useAuthStore } from '../../src/store/authStore'
import { useAsyncData } from '../../src/hooks/useAsyncData'
import ClassAssignmentContext from '../../src/features/learningCenter/ClassAssignmentContext'
import { syncIeltsClassResult } from '../../src/features/learningCenter/ieltsResultSync'
import { apiClient } from '../../src/lib/apiClient'
import NotificationsBell from '../../src/components/layout/NotificationsBell'
import { useBillingStore } from '../../src/features/billing/store'

const test = window as any
const wallet = { balance: 0, canCreateClass: true, centerEligible: true, legacyAccess: false, subscriptions: [], entries: [], orders: [] }
const workspace = { id: 'center', name: 'Oxford Learning Center', slug: 'oxford', city: 'Tashkent', logoUrl: null, coverUrl: null, role: 'OWNER' as const, memberCount: 24, groupCount: 3 }
test.calls = []
test.failWorkspaces = false
test.assignmentRows = []
test.groupRows = []
test.teamRows = []
test.studentRows = []
test.leaderboardRows = []
test.failAction = false
test.notifications = [
  { id: 'teacher-note', type: 'SYSTEM', title: 'New teacher note: Oxford Learning Center', message: 'Finish Full Mock Test 1 for Exam Mode!\nReview your Listening answers and write down three things to improve before our next lesson.', metadata: { kind: 'TEACHER_NOTE', authorName: 'Alex Teacher', centerSlug: 'oxford' }, readAt: null, createdAt: new Date().toISOString() },
  { id: 'assignment-update', type: 'SYSTEM', title: 'New class assignment: IELTS Full Mock', message: 'Your next IELTS assignment is ready. Complete the full mock before the next lesson.', metadata: { kind: 'CLASS_ASSIGNMENT', centerSlug: 'oxford', examTrack: 'IELTS' }, readAt: null, createdAt: new Date().toISOString() },
]
;(apiClient as any).get = async (path: string) => {
  if (path === '/billing/wallet') return wallet
  if (path === '/dashboard/notifications') return { notifications: test.notifications, unreadCount: test.notifications.filter((item: any) => !item.readAt).length }
  if (path === '/profile/badges') return { badges: [] }
  return { weeklyProgress: [] }
}
;(apiClient as any).patch = async (path: string) => { test.notifications.forEach((item: any) => { if (path.endsWith('/read-all') || path.includes(`/${item.id}/read`)) item.readAt = new Date().toISOString() }); return {} }
const learner = { id: 'owner', fullName: 'Learner With A Long Name', nickname: 'learner', avatarUrl: null, targetExam: 'SAT' as const, targetScore: null, currentStreak: 3, currentSat: 1300, highestSat: 1400, targetSat: 1500, currentIelts: null, highestIelts: null, targetIelts: null, attempts: 2, averageScore: 81.3, improvement: 12.5, completionRate: 50, lastActiveAt: new Date().toISOString(), status: 'ON_TRACK' as const, skills: [{ key: 'SAT_MATH', label: 'Math', score: 650, maxScore: 800, attempts: 2, change: 50 }] }
test.learner = learner
test.studentAssignments = []
test.notes = []
test.action = (action: string, input: unknown) => { if (test.failAction) throw new Error('Please retry this action'); test.calls.push({ action, input }) }
test.syncIelts = syncIeltsClassResult
learningCenterApi.syncResult = async input => { test.action('result', input); return {} }
;(apiClient as any).post = async (path: string, input: unknown) => { test.action('objective-result', { path, ...(input as object) }); return {} }
test.workspace = workspace
test.guest = () => useAuthStore.setState({ user: null })
useAuthStore.setState({ user: { id: 'owner', fullName: 'Alex Teacher', onboardingCompleted: true, canCreateClass: true } as any, hydrated: true })
useBillingStore.setState({ wallet, userId: 'owner' })
learningCenterApi.workspaces = async () => { if (test.failWorkspaces) throw new Error('Workspace service unavailable'); return { workspaces: [workspace] } }
learningCenterApi.createWorkspace = async (input) => { test.calls.push({ action: 'create', input }); return { workspace } }
learningCenterApi.groups = async () => ({ groups: test.groupRows })
learningCenterApi.createGroup = async (_slug, input) => { test.action('group', input); return {} }
learningCenterApi.team = async () => ({ team: test.teamRows })
learningCenterApi.updateMemberRole = async (_slug, id, role) => { test.action('role', { id, role }); test.teamRows.find((row: any) => row.id === id).role = role; return {} }
learningCenterApi.students = async (_slug, query) => { test.calls.push({ action: 'students', query }); return { students: test.studentRows } }
learningCenterApi.student = async () => ({ student: learner, groups: [], results: [], insight: { headline: 'Keep progressing', summary: 'Your results are improving.', tone: 'positive', priorities: ['Practice math', 'Review mistakes'] }, assignments: test.studentAssignments, notes: test.notes })
learningCenterApi.analyzeStudent = async () => { test.action('analysis', {}); return { insight: { headline: 'Analysis refreshed', summary: 'Focus on math.', priorities: ['Practice', 'Review'], tone: 'positive' }, engine: 'data-analysis', model: null, fallbackUsed: true } }
learningCenterApi.addNote = async (_slug, _student, note) => { test.action('note', note); test.notes.push({ id: 'note', note, createdAt: new Date().toISOString(), author: { id: 'teacher', fullName: 'Teacher', avatarUrl: null } }); return {} }
learningCenterApi.updateWorkspace = async (_slug, input) => { test.action('settings', input); Object.assign(workspace, input); return { workspace } }
learningCenterApi.deleteWorkspace = async () => { test.action('delete', {}); return {} }
learningCenterApi.leaderboard = async (_slug, exam, metric, groupId) => { test.calls.push({ action: 'ranking', exam, metric, groupId }); return { exam, metric, rows: test.leaderboardRows } }
learningCenterApi.assignments = async () => ({ assignments: test.assignmentRows })
learningCenterApi.createAssignment = async (_slug, input) => { test.calls.push({ action: 'assignment', input }); return {} }
learningCenterApi.updateSubmission = async (_slug, id, input) => { if (test.failSubmission) throw new Error('Progress could not be saved'); test.calls.push({ action: 'submission', id, input }); return {} }
learningCenterApi.invite = async (_slug, input) => { test.calls.push({ action: 'invite', input }); return { status: 'INVITATION_CREATED', invitation: { code: 'ABC123', joinPath: '/learning-center/join/ABC123', expiresAt: '' } } }
learningCenterApi.join = async (code) => { test.calls.push({ action: 'join', code }); return { workspace } }
learningCenterApi.overview = async () => ({ workspace, metrics: { totalStudents: 24, satStudents: 12, ieltsStudents: 12, activeTeachers: 3, groups: 3, averageSat: 1280, averageIelts: 6.5, assignmentsCompleted: 75, studentsImproving: 80 }, activity: [], topImproving: [], needsAttention: [], recentStudents: [], teacherPerformance: [], assignmentPipeline: { assigned: 4, inProgress: 3, completed: 9, overdue: 1 } })

function Bridge() {
  const navigate = useNavigate()
  const location = useLocation()
  test.go = navigate
  test.route = location.pathname + location.search + location.hash
  test.routeState = location.state
  return null
}

function Race() {
  const [query, setQuery] = useState('first')
  test.query = setQuery
  const result = useAsyncData(() => new Promise<string>((resolve, reject) => { test.pending[query] = { resolve, reject } }), [query])
  return <div id="race">{result.loading ? 'loading' : result.error ?? result.data}</div>
}
test.pending = {}
createRoot(document.getElementById('root')!).render(<StrictMode><MemoryRouter initialEntries={['/learning-center']}><ClassAssignmentContext /><Bridge /><Routes>
  <Route path="/learning-center" element={<LearningCenterPortal />} />
  <Route path="/learning-center/join/:code" element={<ProtectedRoute><LearningCenterJoin /></ProtectedRoute>} />
  <Route path="/learning-center/:workspaceSlug/*" element={<LearningCenterWorkspace />} />
  <Route path="/copy" element={<InvitationLink link="http://localhost/learning-center/join/ABC123" />} />
  <Route path="/race" element={<Race />} />
  <Route path="/notifications" element={<div className="min-h-screen bg-slate-200 p-8"><NotificationsBell /></div>} />
  <Route path="/login" element={<p>Sign in</p>} />
  <Route path="/sat" element={<p>SAT destination</p>} />
  <Route path="/sat/mocks" element={<p>SAT mock catalog</p>} />
  <Route path="/mock/sat/1" element={<p>SAT mock run</p>} />
</Routes></MemoryRouter></StrictMode>)
