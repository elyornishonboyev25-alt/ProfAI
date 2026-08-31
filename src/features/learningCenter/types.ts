export type CenterRole = 'OWNER' | 'ADMIN' | 'TEACHER' | 'STUDENT'
export type CenterExamTrack = 'IELTS' | 'SAT' | 'BOTH'
export type StudentStatus = 'ON_TRACK' | 'WATCH' | 'NEEDS_ATTENTION'

export type CenterWorkspace = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  city: string | null
  role: CenterRole
  memberCount: number
  groupCount: number
}

export type CenterStudent = {
  id: string
  fullName: string
  nickname: string | null
  avatarUrl: string | null
  targetExam: string
  targetScore: string | null
  currentStreak: number
  currentSat: number | null
  highestSat: number | null
  targetSat: number | null
  currentIelts: number | null
  highestIelts: number | null
  targetIelts: number | null
  attempts: number
  averageScore: number
  improvement: number
  completionRate: number
  lastActiveAt: string | null
  status: StudentStatus
  skills: Array<{ key: string; label: string; score: number; maxScore: number; attempts: number; change: number }>
}

export type CenterOverview = {
  workspace: {
    id: string
    name: string
    slug: string
    city: string | null
    logoUrl: string | null
    role: CenterRole
  }
  metrics: {
    totalStudents: number
    satStudents: number
    ieltsStudents: number
    activeTeachers: number
    groups: number
    averageSat: number
    averageIelts: number
    assignmentsCompleted: number
    studentsImproving: number
  }
  activity: Array<{ date: string; attempts: number; activeStudents: number }>
  topImproving: CenterStudent[]
  needsAttention: CenterStudent[]
  recentStudents: CenterStudent[]
  assignmentPipeline: { assigned: number; inProgress: number; completed: number; overdue: number }
  teacherPerformance: Array<{
    id: string
    fullName: string
    avatarUrl: string | null
    groupName: string
    students: number
    averageScore: number
    improving: number
  }>
}

export type CenterGroup = {
  id: string
  name: string
  examTrack: CenterExamTrack
  targetScore: string | null
  schedule: string | null
  teacher: { id: string; fullName: string; avatarUrl: string | null } | null
  students: CenterStudent[]
  studentCount: number
  assignmentCount: number
  averageSat: number
  averageIelts: number
  averageScore: number
  improving: number
  needsAttention: number
}

export type AssignmentPipeline = { assigned: number; inProgress: number; completed: number; overdue: number }

export type CenterAssignment = {
  id: string
  title: string
  description: string | null
  kind: 'TEST' | 'PRACTICE' | 'WRITING' | 'SPEAKING' | 'VOCABULARY'
  examTrack: CenterExamTrack
  routePath: string
  targetScore: string | null
  dueAt: string
  publishedAt: string
  group: { id: string; name: string } | null
  studentId: string | null
  createdBy: { id: string; fullName: string }
  submissions: Array<{
    id: string
    studentId: string
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
    progress: number
    student: { id: string; fullName: string; avatarUrl: string | null }
  }>
  pipeline: AssignmentPipeline
}

export type TeamMember = {
  id: string
  userId: string
  role: CenterRole
  status: 'ACTIVE' | 'SUSPENDED' | 'LEFT'
  title: string | null
  joinedAt: string
  groupCount: number
  user: { id: string; fullName: string; email: string | null; avatarUrl: string | null }
}

export type LearningResult = {
  id: string
  examType: 'IELTS' | 'SAT'
  skill: string
  title: string
  score: number
  maxScore: number
  accuracy: number | null
  durationSec: number
  completedAt: string
  source: 'TEST_ATTEMPT' | 'ASSESSMENT_RESULT' | 'SPEAKING_SESSION'
  breakdown?: Record<string, unknown>
}

export type PerformanceInsight = {
  headline: string
  summary: string
  priorities: string[]
  tone: 'positive' | 'neutral' | 'warning'
}

export type StudentDetail = {
  student: CenterStudent
  groups: Array<{ id: string; name: string; examTrack: CenterExamTrack; teacher: { id: string; fullName: string } | null }>
  results: LearningResult[]
  insight: PerformanceInsight
  assignments: Array<{
    id: string
    assignmentId: string
    title: string
    description: string | null
    kind: string
    examTrack: CenterExamTrack
    routePath: string
    targetScore: string | null
    dueAt: string
    groupName: string | null
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
    progress: number
    submittedAt: string | null
  }>
  notes: Array<{
    id: string
    note: string
    createdAt: string
    author: { id: string; fullName: string; avatarUrl: string | null }
  }>
}

export type LeaderboardRow = {
  rank: number
  id: string
  fullName: string
  nickname: string | null
  avatarUrl: string | null
  score: number
  highest: number
  improvement: number
  attempts: number
  currentStreak: number
}
