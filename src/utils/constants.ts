export const APP_CONFIG = {
  name: 'ProfAI',
  version: '1.0.0',
  description: 'AI-powered study-abroad platform — your path to top universities abroad'
}

export const TEST_CATEGORIES = {
  SAT: 'sat',
  IELTS: 'ielts'
} as const

export const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  MIXED: 'Mixed'
} as const

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  FILL_BLANK: 'fill-blank',
  ESSAY: 'essay'
} as const

export const GRADES = [
  { value: 1, label: 'Grade 1' },
  { value: 2, label: 'Grade 2' },
  { value: 3, label: 'Grade 3' },
  { value: 4, label: 'Grade 4' },
  { value: 5, label: 'Grade 5' },
  { value: 6, label: 'Grade 6' },
  { value: 7, label: 'Grade 7' },
  { value: 8, label: 'Grade 8' },
  { value: 9, label: 'Grade 9' },
  { value: 10, label: 'Grade 10' },
  { value: 11, label: 'Grade 11' }
]

export const SUBJECTS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' }
]

export const LANGUAGES = {
  EN: 'en',
  UZ: 'uz'
} as const

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  TESTS: '/tests',
  MOCK: '/mock',
  SPEAKING_COMMUNITY: '/speaking-community',
  SAT: '/sat',
  IELTS: '/ielts',
  PROFILE: '/profile',
  ACCOUNT: '/account',
  LOGIN: '/login',
  RESULTS: '/results',
  NOT_FOUND: '/404'
} as const

