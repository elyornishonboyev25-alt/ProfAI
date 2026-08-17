export type UserRole = 'USER' | 'ADMIN'

export type AuthUser = {
  id: string
  fullName: string
  email: string
  role: UserRole
  premium: boolean
  xp: number
  level: number
  currentStreak: number
  /** Public unique handle shown to other users instead of the email-derived name. */
  nickname?: string | null
  /** Profile photo as a (compressed) data URL or external URL. */
  avatarUrl?: string | null
  /** Server-backed flag that makes the study-plan onboarding a one-time flow. */
  onboardingCompleted: boolean
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'OLYMPIAD'
export type TestCategory = 'SCHOOL' | 'SAT' | 'IELTS' | 'OLYMPIAD'
export type DivisionTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'ELITE'

export type TestSummary = {
  id: string
  slug?: string
  title: string
  description: string
  category: TestCategory
  difficulty: Difficulty
  durationSec: number
  premium: boolean
  xpReward: number | null
  subjects?: string[]
  questionCount?: number
}

export type DashboardOverview = {
  metrics: {
    totalTests: number
    averageScore: number
    weeklyStudySeconds: number
    currentRank: number | null
    currentStreak: number
  }
  weeklyProgress: Array<{
    date: string
    label: string
    testsCompleted: number
    questionsAnswered: number
    studyTimeSec: number
    active: boolean
  }>
  recommendedTests: TestSummary[]
  activityTimeline: Array<{
    id: string
    type: 'attempt' | 'notification'
    title: string
    description: string
    date: string
  }>
  miniLeaderboard: Array<{
    rank: number
    fullName: string
    totalXp: number
    accuracy: number
    rankTrend: 'up' | 'down' | 'same'
    isCurrentUser: boolean
  }>
  targets?: {
    targetExam: 'IELTS' | 'SAT' | 'BOTH' | null
    currentIeltsScore: number | null
    targetIeltsScore: number | null
    currentSatScore: number | null
    targetSatScore: number | null
  }
}

export type ProfileOverview = {
  profile: {
    id: string
    fullName: string
    email: string
    level: number
    xp: number
    currentStreak: number
    longestStreak: number
    memberSince: string
  }
  stats: {
    totalAttempts: number
    averageScore: number
    averageAccuracy: number
    totalXpFromAttempts: number
  }
  levelProgress: {
    currentLevelThreshold: number
    nextLevelThreshold: number
    xpIntoCurrent: number
    levelSpan: number
    progressPercent: number
  }
  competitive: {
    rank: number
    previousRank: number
    rankDelta: number
    rankTrend: 'up' | 'down' | 'same'
    division: DivisionTier
    divisionLabel: string
    rankScore: number
    uniqueTests: number
    validatedAttempts: number
    discardedAttempts: number
    integrityScore: number
    breakdown: {
      accuracy: number
      speedEfficiency: number
      consistencyScore: number
      engagementScore: number
      inactivityDays: number
      inactivityPenalty: number
      activityDecay: number
      difficultyMultiplier: number
      normalizedDifficulty: number
      improvementDelta: number
      validatedAttempts: number
      discardedAttempts: number
      integrityScore: number
      rankScore: number
    }
  } | null
  skillAnalytics: {
    overall: {
      skillPower: number
      percentile: number
      projectedSatScore: number
      projectedPercentScore: number
      growthRate: number
      totalUsers: number
    }
    radar: Array<{
      category: TestCategory
      label: string
      attempts: number
      accuracy: number
      speed: number
      consistency: number
      skillPower: number
    }>
    trackBreakdown: Array<{
      key:
        | 'IELTS_READING'
        | 'IELTS_LISTENING'
        | 'IELTS_WRITING'
        | 'IELTS_SPEAKING'
        | 'SAT_MATH'
        | 'SAT_READING_WRITING'
      label: string
      group: 'IELTS' | 'SAT'
      attempts: number
      accuracy: number
      speed: number
      consistency: number
      skillPower: number
    }>
    distribution: {
      mean: number
      standardDeviation: number
      userSkillPower: number
      curve: Array<{
        score: number
        density: number
      }>
    }
    xpMomentum: Array<{
      label: string
      xp: number
      score: number
      accuracy: number
    }>
    insights: Array<{
      id: string
      type: 'warning' | 'tip' | 'success'
      title: string
      message: string
    }>
  }
  weeklyActivity: Array<{
    date: string
    label: string
    testsCompleted: number
    questionsAnswered: number
    xpEarned: number
    active: boolean
  }>
  achievements: Array<{
    unlockedAt: string
    achievement: {
      id: string
      slug: string
      title: string
      description: string
      icon: string
      xpReward: number
    }
  }>
  recentAttempts: Array<{
    id: string
    finalScore: number
    percentage: number
    xpEarned: number
    completedAt: string
    test: {
      id: string
      title: string
      category: TestCategory
      difficulty: Difficulty
    }
  }>
}

export type GenerateAiReportRequest = {
  refresh?: boolean
}

export type AiReportResponse = {
  generatedAt: string
  model: string
  source: 'hf' | 'cache' | 'fallback'
  executiveSummary: string
  strengths: string[]
  risks: string[]
  momentumAssessment: string
  sevenDayPlan: string[]
  nextActions: string[]
  confidence: number
  disclaimer: string
}

export type RouteTargetId =
  | 'DASHBOARD'
  | 'TEST_LIBRARY'
  | 'SAT_PREP'
  | 'IELTS_PREP'
  | 'VOCABULARY'
  | 'MOCK'
  | 'LEADERBOARD'
  | 'AI_ANALYSIS'
  | 'ACCOUNT'

export type ChatLocale = 'en' | 'uz'
export type AiContextMode =
  | 'analysis'
  | 'general'
  | 'exam'
  | 'training_reading'
  | 'training_listening'
export type OpenTestTrack = 'reading' | 'listening'
export type OpenTestMode = 'practice' | 'simulation' | 'full-test'
export type SpeakingMode = 'conversation' | 'mock'
export type SpeakingPartMode = 'part1' | 'part2' | 'part3' | 'full_mock'

export type AiChatRequest = {
  message: string
  history: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  locale?: ChatLocale
  contextMode?: AiContextMode
  uiContext?: {
    pathname?: string
  }
}

export type AiChatAction =
  | {
      type: 'navigate'
      target: RouteTargetId
    }
  | {
      type: 'open_test'
      payload: {
        track: OpenTestTrack
        testId: string
        mode: OpenTestMode
        partIndex?: number
        durationMinutes?: number
      }
    }
  | {
      type: 'speaking_mode'
      payload: {
        mode: SpeakingMode
        part?: SpeakingPartMode
        englishOnly: boolean
      }
    }

export type AiChatResponse = {
  reply: string
  actions: AiChatAction[]
  meta: {
    source: 'openai' | 'hf' | 'fallback'
    locale?: ChatLocale
  }
}

export type AiRealtimeSessionResponse = {
  provider: 'openai'
  model: string
  mode: SpeakingMode
  part: SpeakingPartMode | null
  session: Record<string, unknown>
}

export type SpeakingQuestionItem = {
  id: string
  part: number
  prompt: string
  sourceType: 'CURATED' | 'USER_UPLOADED' | 'LICENSED'
  sourceLabel: string | null
}

export type AiPreferences = {
  preferredLocale: string
  preferredName: string | null
  toneStyle: string
  lastAssistantLanguage: string
  updatedAt?: string | null
}

export type VocabularyNotebookItem = {
  id: string
  notebookId: string
  term: string
  meaning: string
  notes: string | null
  sourceLang: string | null
  createdAt: string
  updatedAt: string
}

export type VocabularyNotebook = {
  id: string
  userId: string
  preferenceId: string | null
  testKey: string
  title: string
  locale: string
  createdAt: string
  updatedAt: string
  items: VocabularyNotebookItem[]
}

export type SpeakingEvaluationResponse = {
  id: string
  overallBand: number
  fluencyBand: number
  grammarBand: number
  pronunciationBand: number
  lexicalBand: number
  feedback: {
    summary: string
    strengths: string[]
    weaknesses: string[]
    improvementPriorities: Array<{
      area: string
      target: number
      action: string
    }>
    stats?: {
      wordCount: number
      uniqueWords: number
      fillerCount: number
      grammarIssueCount: number
    }
    taskLabel?: string
    transcriptLocale?: string
  }
  createdAt: string
}

export type LeaderboardResponse = {
  period: 'today' | 'week' | 'month' | 'all'
  category: TestCategory | null
  currentUserRank: number | null
  weeklyPremiumWinner: {
    userId: string
    fullName: string
    rankingScore: number
    testsCompleted: number
  } | null
  weeklyPerformanceBoard: LeaderboardRow[]
  antiCheatRules: string[]
  podium: LeaderboardRow[]
  rows: LeaderboardRow[]
}

export type LeaderboardRow = {
  rank: number
  previousRank: number
  rankDelta: number
  rankTrend: 'up' | 'down' | 'same'
  isCurrentUser: boolean
  userId: string
  fullName: string
  avatarUrl: string | null
  totalXp: number
  testsCompleted: number
  accuracy: number
  streak: number
  rankingScore: number
  division: DivisionTier
  divisionLabel: string
  uniqueTests: number
  validatedAttempts: number
  discardedAttempts: number
  integrityScore: number
  speedEfficiency: number
  consistencyScore: number
  focusConsistency: number
  dailyCompletionRate: number
  improvementDelta: number
  difficultyMultiplier: number
  breakdown: {
    accuracy: number
    speedEfficiency: number
    consistencyScore: number
    engagementScore: number
    focusConsistency: number
    dailyCompletionRate: number
    inactivityDays: number
    inactivityPenalty: number
    activityDecay: number
    difficultyMultiplier: number
    normalizedDifficulty: number
    improvementDelta: number
    validatedAttempts: number
    discardedAttempts: number
    integrityScore: number
    rankScore: number
  }
}

export type TestDetails = {
  id: string
  slug: string
  title: string
  description: string
  category: TestCategory
  difficulty: Difficulty
  durationSec: number
  premium: boolean
  xpReward: number | null
  subjects: string[]
  questions: Array<{
    id: string
    text: string
    explanation?: string
    order: number
    weight: number
    options: Array<{
      id: string
      text: string
      order: number
    }>
  }>
}

export type SubmitAttemptResponse = {
  attemptId: string
  totalQuestions: number
  correctAnswers: number
  weightedScore: number
  finalScore: number
  percentage: number
  timeBonus: number
  xpEarned: number
  totalXp: number
  baseXpEarned: number
  achievementBonusXp: number
  currentStreak: number
  longestStreak: number
  levelBefore: number
  levelAfter: number
  leveledUp: boolean
  answerReview: Array<{
    questionId: string
    selectedOptionId: string | null
    correctOptionId: string | null
    isCorrect: boolean
    weight: number
  }>
  unlockedAchievements: Array<{
    id: string
    slug: string
    title: string
    xpReward: number
  }>
}

export type PlannerTask = {
  id: string
  userId: string
  title: string
  description: string | null
  scheduledAt: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type FocusTaskKey =
  | 'IELTS_READING'
  | 'IELTS_LISTENING'
  | 'IELTS_WRITING'
  | 'IELTS_SPEAKING'
  | 'SAT_MATH'
  | 'SAT_READING_WRITING'
  | 'SHADOWING'
  | 'ENGLISH_MOVIE'
  | 'VOCABULARY'

export type FocusTaskCategory = 'IELTS' | 'SAT' | 'ENGLISH_PRACTICE'
export type FocusTaskStatus = 'LOCKED' | 'READY' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'MISSED'

export type FocusCatalogItem = {
  key: FocusTaskKey
  category: FocusTaskCategory
  title: string
  subtitle: string
  routePath: string
  estimatedMinutes: number
}

export type FocusCatalogGroup = {
  key: 'IELTS' | 'SAT' | 'ENGLISH_PRACTICE'
  label: string
  items: FocusCatalogItem[]
}

export type FocusPlanTask = {
  id: string
  orderIndex: number
  category: FocusTaskCategory
  categoryLabel: string
  moduleKey: FocusTaskKey
  title: string
  subtitle: string
  routePath: string
  estimatedMinutes: number
  status: FocusTaskStatus
  completionPercent: number
  totalTimeSec: number
  liveTimeSec: number
  focusScore: number
  startedAt: string | null
  unlockedAt: string | null
  completedAt: string | null
  activeSessionStartedAt: string | null
  isNext: boolean
  isLocked: boolean
}

export type FocusPlanSummary = {
  totalPlannedTasks: number
  completedTasks: number
  completionRate: number
  totalStudyTimeSec: number
  averageSessionSec: number
  averageFocusScore: number
  focusConsistency: number
  studyStreak: number
}

export type FocusPlan = {
  planId: string
  date: string
  allowManualOverride: boolean
  startedAt: string | null
  completedAt: string | null
  summary: FocusPlanSummary
  tasks: FocusPlanTask[]
  quote: string
  smartSuggestion: string
}

export type FocusAnalyticsDay = {
  date: string
  label: string
  totalPlannedTasks: number
  completedTasks: number
  completionRate: number
  totalStudyTimeSec: number
  averageSessionSec: number
  averageFocusScore: number
  focusConsistency: number
  studyStreak: number
  categoryBreakdown: Array<{
    category: FocusTaskCategory
    label: string
    totalTasks: number
    completedTasks: number
    timeSec: number
  }>
}

export type FocusAnalyticsPayload = {
  from: string
  to: string
  daily: FocusAnalyticsDay[]
  weeklyComparison: Array<{
    date: string
    label: string
    completionRate: number
    totalStudyTimeSec: number
    focusConsistency: number
  }>
  smartSuggestion: string
}
