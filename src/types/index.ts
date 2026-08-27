export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  grade?: number
  joinedAt: string
  lastLogin: string
  stats: UserStats
  preferences: UserPreferences
}

export interface UserStats {
  totalTests: number
  completedTests: number
  averageScore: number
  studyStreak: number
  totalStudyTime: number
  rank: number
  achievements: Achievement[]
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'uz'
  notifications: boolean
  soundEffects: boolean
  autoSave: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string
  category: 'tests' | 'streak' | 'scores' | 'time'
}

export interface Test {
  id: string
  title: string
  type: TestType
  category: TestCategory
  difficulty: DifficultyLevel
  duration: number
  questions: Question[]
  description: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: number
  type: QuestionType
  question: string
  options?: string[]
  correctAnswer: string | number
  explanation?: string
  points: number
  timeLimit?: number
  image?: string
  audio?: string
}

export interface TestResult {
  id: string
  testId: string
  userId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  answers: Record<number, string | number>
  startedAt: string
  completedAt: string
  status: 'in-progress' | 'completed' | 'abandoned'
}

export type TestType = 'sat' | 'ielts'
export type TestCategory = 'mathematics' | 'english' | 'science' | 'history' | 'geography'
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Mixed'
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'essay'

export interface SATTest extends Test {
  section: 'reading' | 'writing' | 'math' | 'full'
  calculatorAllowed?: boolean
}

export interface IELTSTest extends Test {
  skill: 'listening' | 'reading' | 'writing' | 'speaking'
  bandScore?: number
}

export interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    name: string
    avatar?: string
  }
  score: number
  testsCompleted: number
  averageScore: number
}

export interface StudySession {
  id: string
  userId: string
  testId: string
  startTime: string
  endTime?: string
  duration: number
  questionsAnswered: number
  correctAnswers: number
  focusScore: number
}

export interface Notification {
  id: string
  userId: string
  type: 'reminder' | 'achievement' | 'result' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

