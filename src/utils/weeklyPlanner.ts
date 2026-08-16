export type ExamTarget = 'IELTS' | 'SAT' | 'BOTH'

export type OnboardingProfile = {
  firstName: string
  lastName: string
  gender?: 'FEMALE' | 'MALE' | 'PREFER_NOT_TO_SAY'
  country?: string
  gradeLevel?: string
  targetCountries?: string[]
  fieldOfStudy?: string
  targetExam: ExamTarget
  daysToExam: number
  dailyHours: number
  ieltsExamDate?: string
  satExamDate?: string
  currentIeltsScore?: number
  targetIeltsScore?: number
  currentSatScore?: number
  targetSatScore?: number
  createdAt: string
}

export type ActivityKey =
  | 'ielts-reading'
  | 'ielts-listening'
  | 'ielts-writing'
  | 'ielts-speaking'
  | 'sat-math'
  | 'sat-rw'
  | 'vocabulary'
  | 'mock'

export type GeneratedTask = {
  id: string
  title: string
  durationMinutes: number
  activityKey: ActivityKey
  requiredMinutes: number
  generated: true
}

export type CustomTask = {
  id: string
  title: string
  durationMinutes: number
  completed: boolean
  generated: false
}

export type WeeklyPlanDay = {
  id: string
  dateISO: string
  weekdayLabel: string
  generatedTasks: GeneratedTask[]
  customTasks: CustomTask[]
}

export type WeeklyPlan = {
  weekStartISO: string
  weekEndISO: string
  updatedAt: string
  days: WeeklyPlanDay[]
  source?: 'adaptive-ai' | 'smart-fallback'
  strategySummary?: string
}

export type ActivityLog = Record<string, Partial<Record<ActivityKey, number>>>

const ONBOARDING_KEY_PREFIX = 'smarttest-onboarding-v2'
const WEEKLY_PLAN_KEY_PREFIX = 'smarttest-weekly-plan-v2'
const ACTIVITY_LOG_KEY_PREFIX = 'smarttest-activity-log-v2'

const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const IELTS_ROTATION_STANDARD = {
  listening: ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Full Mock', 'Part 1', 'Part 2'],
  reading: ['Part 3', 'Part 2', 'Part 1', 'Full Mock', 'Part 3', 'Part 2', 'Review'],
  writing: ['Task 1', 'Task 2', 'Task 1', 'Task 2', 'Task 1', 'Task 2', 'Review'],
} as const

const IELTS_ROTATION_URGENT = {
  listening: ['Full Mock', 'Part 4', 'Full Mock', 'Part 3', 'Full Mock', 'Part 2', 'Review'],
  reading: ['Full Mock', 'Part 3', 'Full Mock', 'Part 2', 'Full Mock', 'Part 1', 'Review'],
  writing: ['Task 2', 'Task 1', 'Task 2', 'Task 2', 'Task 1', 'Task 2', 'Review'],
} as const

function createLocalId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function withOwner(prefix: string, userId?: string) {
  const owner = userId?.trim() ? userId.trim() : 'device'
  return `${prefix}:${owner}`
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function roundToFive(value: number) {
  return Math.max(10, Math.round(value / 5) * 5)
}

function getWeekStart(date: Date) {
  const local = new Date(date)
  local.setHours(0, 0, 0, 0)
  const day = local.getDay()
  const diff = day === 0 ? -6 : 1 - day
  local.setDate(local.getDate() + diff)
  return local
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function toDateISO(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function scaleDurations(totalMinutes: number, baseDurations: number[]) {
  const baseTotal = baseDurations.reduce((sum, value) => sum + value, 0)
  const factor = totalMinutes / Math.max(1, baseTotal)
  return baseDurations.map((value) => roundToFive(value * factor))
}

function isUrgentWindow(daysToExam: number) {
  return daysToExam <= 21
}

function buildIeltsDayPlan(dayIndex: number, totalMinutes: number, daysToExam: number): GeneratedTask[] {
  if (dayIndex === 6) {
    const [speakingMinutes, vocabMinutes, mockReviewMinutes] = scaleDurations(totalMinutes, [90, 45, 45])
    return [
      {
        id: createLocalId('gen'),
        title: 'Speaking Fluency Session',
        durationMinutes: speakingMinutes,
        activityKey: 'ielts-speaking',
        requiredMinutes: 30,
        generated: true,
      },
      {
        id: createLocalId('gen'),
        title: 'Vocabulary Recovery Session',
        durationMinutes: vocabMinutes,
        activityKey: 'vocabulary',
        requiredMinutes: 30,
        generated: true,
      },
      {
        id: createLocalId('gen'),
        title: 'IELTS Mock Strategy Review',
        durationMinutes: mockReviewMinutes,
        activityKey: 'mock',
        requiredMinutes: 30,
        generated: true,
      },
    ]
  }

  const rotation = isUrgentWindow(daysToExam) ? IELTS_ROTATION_URGENT : IELTS_ROTATION_STANDARD
  const listeningLabel = rotation.listening[dayIndex]
  const readingLabel = rotation.reading[dayIndex]
  const writingLabel = rotation.writing[dayIndex]

  const [listeningMinutes, readingMinutes, writingMinutes, speakingMinutes, vocabMinutes, speakingDrillMinutes] =
    scaleDurations(totalMinutes, [30, 45, 40, 35, 20, 20])

  return [
    {
      id: createLocalId('gen'),
      title: `Listening ${listeningLabel}`,
      durationMinutes: listeningMinutes,
      activityKey: listeningLabel === 'Full Mock' ? 'mock' : 'ielts-listening',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: `Reading ${readingLabel}`,
      durationMinutes: readingMinutes,
      activityKey: readingLabel === 'Full Mock' ? 'mock' : 'ielts-reading',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: `Writing ${writingLabel}`,
      durationMinutes: writingMinutes,
      activityKey: 'ielts-writing',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'Speaking Community Practice',
      durationMinutes: speakingMinutes,
      activityKey: 'ielts-speaking',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'Vocabulary Session',
      durationMinutes: vocabMinutes,
      activityKey: 'vocabulary',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'Speaking Accuracy Drill',
      durationMinutes: speakingDrillMinutes,
      activityKey: 'ielts-speaking',
      requiredMinutes: 30,
      generated: true,
    },
  ]
}

function buildSatDayPlan(dayIndex: number, totalMinutes: number, daysToExam: number): GeneratedTask[] {
  const [mathMinutes, rwMinutes, vocabMinutes, speakingMinutes, mockMinutes] =
    scaleDurations(totalMinutes, [70, 65, 25, 20, 20])

  const urgent = isUrgentWindow(daysToExam)
  const isMockDay = urgent ? dayIndex === 1 || dayIndex === 3 || dayIndex === 5 : dayIndex === 3 || dayIndex === 5

  return [
    {
      id: createLocalId('gen'),
      title: isMockDay ? 'SAT Full Mock Segment' : 'SAT Math Drill',
      durationMinutes: isMockDay ? mockMinutes : mathMinutes,
      activityKey: isMockDay ? 'mock' : 'sat-math',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'SAT Reading/Writing Session',
      durationMinutes: rwMinutes,
      activityKey: 'sat-rw',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'Vocabulary Review',
      durationMinutes: vocabMinutes,
      activityKey: 'vocabulary',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'Speaking Confidence Drill',
      durationMinutes: speakingMinutes,
      activityKey: 'ielts-speaking',
      requiredMinutes: 30,
      generated: true,
    },
  ]
}

function buildBothDayPlan(dayIndex: number, totalMinutes: number, daysToExam: number): GeneratedTask[] {
  const [ieltsMinutes, satMinutes, speakingMinutes, vocabMinutes, speakingDrillMinutes] =
    scaleDurations(totalMinutes, [45, 45, 35, 20, 20])

  const urgent = isUrgentWindow(daysToExam)
  const ieltsMockDay = urgent && (dayIndex === 2 || dayIndex === 4)
  const satMockDay = urgent && (dayIndex === 1 || dayIndex === 5)

  return [
    {
      id: createLocalId('gen'),
      title: ieltsMockDay ? 'IELTS Full Mock Focus' : `IELTS ${dayIndex % 2 === 0 ? 'Reading' : 'Listening'} Focus`,
      durationMinutes: ieltsMinutes,
      activityKey: ieltsMockDay ? 'mock' : dayIndex % 2 === 0 ? 'ielts-reading' : 'ielts-listening',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: satMockDay ? 'SAT Mock Segment Focus' : `SAT ${dayIndex % 2 === 0 ? 'Math' : 'Reading/Writing'} Focus`,
      durationMinutes: satMinutes,
      activityKey: satMockDay ? 'mock' : dayIndex % 2 === 0 ? 'sat-math' : 'sat-rw',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'Speaking Community Practice',
      durationMinutes: speakingMinutes,
      activityKey: 'ielts-speaking',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'Vocabulary Session',
      durationMinutes: vocabMinutes,
      activityKey: 'vocabulary',
      requiredMinutes: 30,
      generated: true,
    },
    {
      id: createLocalId('gen'),
      title: 'Speaking Fluency Drill',
      durationMinutes: speakingDrillMinutes,
      activityKey: 'ielts-speaking',
      requiredMinutes: 30,
      generated: true,
    },
  ]
}

export function generateWeeklyPlan(profile: OnboardingProfile, now = new Date()): WeeklyPlan {
  const weekStart = getWeekStart(now)
  const weekEnd = addDays(weekStart, 6)
  const dailyMinutes = Math.max(3, profile.dailyHours) * 60

  const days = WEEKDAY_LABELS.map((label, index) => {
    const date = addDays(weekStart, index)
    let generatedTasks: GeneratedTask[] = []

    if (profile.targetExam === 'IELTS') {
      generatedTasks = buildIeltsDayPlan(index, dailyMinutes, profile.daysToExam)
    } else if (profile.targetExam === 'SAT') {
      generatedTasks = buildSatDayPlan(index, dailyMinutes, profile.daysToExam)
    } else {
      generatedTasks = buildBothDayPlan(index, dailyMinutes, profile.daysToExam)
    }

    return {
      id: createLocalId('day'),
      dateISO: toDateISO(date),
      weekdayLabel: label,
      generatedTasks,
      customTasks: [],
    }
  })

  return {
    weekStartISO: toDateISO(weekStart),
    weekEndISO: toDateISO(weekEnd),
    updatedAt: new Date().toISOString(),
    days,
    source: 'smart-fallback',
  }
}

export function ensureRollingWeek(profile: OnboardingProfile, plan: WeeklyPlan | null, now = new Date()) {
  const expectedWeekStart = toDateISO(getWeekStart(now))
  if (!plan || plan.weekStartISO !== expectedWeekStart) {
    return generateWeeklyPlan(profile, now)
  }

  return plan
}

export function loadOnboardingProfile(userId?: string): OnboardingProfile | null {
  if (typeof window === 'undefined') return null
  return safeParse<OnboardingProfile>(window.localStorage.getItem(withOwner(ONBOARDING_KEY_PREFIX, userId)))
}

export function saveOnboardingProfile(profile: OnboardingProfile, userId?: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(withOwner(ONBOARDING_KEY_PREFIX, userId), JSON.stringify(profile))
}

export function loadWeeklyPlan(userId?: string): WeeklyPlan | null {
  if (typeof window === 'undefined') return null
  return safeParse<WeeklyPlan>(window.localStorage.getItem(withOwner(WEEKLY_PLAN_KEY_PREFIX, userId)))
}

export function saveWeeklyPlan(plan: WeeklyPlan, userId?: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(withOwner(WEEKLY_PLAN_KEY_PREFIX, userId), JSON.stringify(plan))
}

export function addCustomTaskToDay(
  plan: WeeklyPlan,
  dayId: string,
  input: { title: string; durationMinutes: number }
): WeeklyPlan {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    days: plan.days.map((day) => {
      if (day.id !== dayId) return day
      return {
        ...day,
        customTasks: [
          ...day.customTasks,
          {
            id: createLocalId('custom'),
            title: input.title.trim(),
            durationMinutes: Math.max(10, input.durationMinutes),
            completed: false,
            generated: false,
          },
        ],
      }
    }),
  }
}

export function toggleCustomTask(plan: WeeklyPlan, dayId: string, taskId: string): WeeklyPlan {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    days: plan.days.map((day) => {
      if (day.id !== dayId) return day
      return {
        ...day,
        customTasks: day.customTasks.map((task) => {
          if (task.id !== taskId) return task
          return {
            ...task,
            completed: !task.completed,
          }
        }),
      }
    }),
  }
}

export function loadActivityLog(userId?: string): ActivityLog {
  if (typeof window === 'undefined') return {}
  return safeParse<ActivityLog>(window.localStorage.getItem(withOwner(ACTIVITY_LOG_KEY_PREFIX, userId))) ?? {}
}

function saveActivityLog(log: ActivityLog, userId?: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(withOwner(ACTIVITY_LOG_KEY_PREFIX, userId), JSON.stringify(log))
}

export function addTrackedMinutes(userId: string | undefined, dateISO: string, key: ActivityKey, minutes: number) {
  if (typeof window === 'undefined') return
  const current = loadActivityLog(userId)
  const dayEntry = current[dateISO] ?? {}
  const previous = dayEntry[key] ?? 0

  current[dateISO] = {
    ...dayEntry,
    [key]: previous + Math.max(0, minutes),
  }

  saveActivityLog(current, userId)
}

export function taskAutoCompleted(task: GeneratedTask, dayDateISO: string, log: ActivityLog) {
  const dayEntry = log[dayDateISO]
  const spent = dayEntry?.[task.activityKey] ?? 0
  return spent >= task.requiredMinutes
}

export function routeToActivityKey(pathname: string): ActivityKey | null {
  const normalized = pathname.toLowerCase()

  if (normalized.startsWith('/vocabulary')) return 'vocabulary'
  if (normalized.startsWith('/speaking-community') || normalized.startsWith('/speaking-lab') || normalized.startsWith('/ielts/speaking')) return 'ielts-speaking'
  if (normalized.startsWith('/ielts/writing') || normalized.startsWith('/writing-lab')) return 'ielts-writing'
  if (normalized.startsWith('/ielts/listening') || normalized.startsWith('/test/listening')) return 'ielts-listening'
  if (normalized.startsWith('/ielts/reading') || normalized.startsWith('/test/reading')) return 'ielts-reading'
  if (normalized.startsWith('/sat/mock/')) return 'mock'
  if (normalized.startsWith('/sat/math')) return 'sat-math'
  if (normalized.startsWith('/sat/reading-writing')) return 'sat-rw'
  if (normalized.startsWith('/mock')) return 'mock'

  return null
}
