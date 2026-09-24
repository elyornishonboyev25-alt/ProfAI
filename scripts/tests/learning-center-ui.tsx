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

const test = window as any
const workspace = { id: 'center', name: 'Oxford Learning Center', slug: 'oxford', city: 'Tashkent', logoUrl: null, role: 'OWNER' as const, memberCount: 24, groupCount: 3 }
test.calls = []
test.failWorkspaces = false
test.assignmentRows = []
test.workspace = workspace
test.guest = () => useAuthStore.setState({ user: null })
useAuthStore.setState({ user: { id: 'owner', fullName: 'Alex Teacher', onboardingCompleted: true } as any, hydrated: true })
learningCenterApi.workspaces = async () => { if (test.failWorkspaces) throw new Error('Workspace service unavailable'); return { workspaces: [workspace] } }
learningCenterApi.createWorkspace = async (input) => { test.calls.push({ action: 'create', input }); return { workspace } }
learningCenterApi.groups = async () => ({ groups: [] })
learningCenterApi.team = async () => ({ team: [] })
learningCenterApi.students = async (_slug, query) => { test.calls.push({ action: 'students', query }); return { students: [] } }
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
  test.route = location.pathname + location.search
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
createRoot(document.getElementById('root')!).render(<StrictMode><MemoryRouter initialEntries={['/learning-center']}><Bridge /><Routes>
  <Route path="/learning-center" element={<LearningCenterPortal />} />
  <Route path="/learning-center/join/:code" element={<ProtectedRoute><LearningCenterJoin /></ProtectedRoute>} />
  <Route path="/learning-center/:workspaceSlug/*" element={<LearningCenterWorkspace />} />
  <Route path="/copy" element={<InvitationLink link="http://localhost/learning-center/join/ABC123" />} />
  <Route path="/race" element={<Race />} />
  <Route path="/login" element={<p>Sign in</p>} />
  <Route path="/sat" element={<p>SAT destination</p>} />
</Routes></MemoryRouter></StrictMode>)
