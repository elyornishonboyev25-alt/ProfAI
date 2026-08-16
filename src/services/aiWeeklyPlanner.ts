import { callGeminiAPI, extractJSON } from '@/services/geminiAI'
import {
  generateWeeklyPlan,
  taskAutoCompleted,
  type ActivityKey,
  type ActivityLog,
  type OnboardingProfile,
  type WeeklyPlan,
} from '@/utils/weeklyPlanner'
import type { ProfileOverview } from '@/types/platform'

const ACTIVITY_KEYS: ActivityKey[] = [
  'ielts-reading',
  'ielts-listening',
  'ielts-writing',
  'ielts-speaking',
  'sat-math',
  'sat-rw',
  'vocabulary',
  'mock',
]

type AiTask = {
  title?: unknown
  durationMinutes?: unknown
  activityKey?: unknown
}

type AiDay = {
  dayIndex?: unknown
  tasks?: unknown
}

type AiPlanResponse = {
  strategySummary?: unknown
  days?: unknown
}

export type PlannerPerformanceContext = {
  recentAttempts: Array<{
    title: string
    category: string
    score: number
    accuracy: number
    completedAt: string
  }>
  skillBreakdown: Array<{
    label: string
    accuracy: number
    consistency: number
    attempts: number
  }>
  previousWeek: {
    completedTasks: number
    totalTasks: number
    completionPercent: number
  } | null
}

function createTaskId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? `ai-${crypto.randomUUID()}`
    : `ai-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function clampDuration(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 30
  return Math.max(10, Math.min(120, Math.round(numeric / 5) * 5))
}

function buildAllowedKeys(profile: OnboardingProfile) {
  if (profile.targetExam === 'IELTS') {
    return new Set<ActivityKey>(['ielts-reading', 'ielts-listening', 'ielts-writing', 'ielts-speaking', 'vocabulary', 'mock'])
  }
  if (profile.targetExam === 'SAT') {
    return new Set<ActivityKey>(['sat-math', 'sat-rw', 'vocabulary', 'mock'])
  }
  return new Set<ActivityKey>(ACTIVITY_KEYS)
}

function sanitizePlan(raw: string, profile: OnboardingProfile, fallback: WeeklyPlan): WeeklyPlan | null {
  let parsed: AiPlanResponse
  try {
    parsed = JSON.parse(extractJSON(raw)) as AiPlanResponse
  } catch {
    return null
  }

  if (!Array.isArray(parsed.days)) return null
  const allowedKeys = buildAllowedKeys(profile)
  const maxDailyMinutes = Math.max(3, profile.dailyHours) * 60
  const byIndex = new Map<number, AiDay>()
  for (const candidate of parsed.days as AiDay[]) {
    const index = Number(candidate?.dayIndex)
    if (Number.isInteger(index) && index >= 0 && index <= 6) byIndex.set(index, candidate)
  }

  const days = fallback.days.map((fallbackDay, dayIndex) => {
    const candidate = byIndex.get(dayIndex)
    const candidates = Array.isArray(candidate?.tasks) ? (candidate.tasks as AiTask[]).slice(0, 6) : []
    const safeTasks = candidates.flatMap((task) => {
      const title = typeof task.title === 'string' ? task.title.replace(/\s+/g, ' ').trim().slice(0, 90) : ''
      const activityKey = typeof task.activityKey === 'string' && allowedKeys.has(task.activityKey as ActivityKey)
        ? task.activityKey as ActivityKey
        : null
      if (!title || !activityKey) return []
      const durationMinutes = clampDuration(task.durationMinutes)
      return [{
        id: createTaskId(),
        title,
        durationMinutes,
        activityKey,
        requiredMinutes: Math.min(30, Math.max(10, Math.round((durationMinutes * 0.6) / 5) * 5)),
        generated: true as const,
      }]
    })

    if (safeTasks.length < 2) return fallbackDay

    const total = safeTasks.reduce((sum, task) => sum + task.durationMinutes, 0)
    const factor = total > maxDailyMinutes ? maxDailyMinutes / total : 1
    const fitted = safeTasks.map((task) => ({
      ...task,
      durationMinutes: Math.max(10, Math.round((task.durationMinutes * factor) / 5) * 5),
    }))

    return { ...fallbackDay, generatedTasks: fitted }
  })

  const completeDays = days.filter((day, index) => day.generatedTasks !== fallback.days[index].generatedTasks).length
  if (completeDays < 5) return null

  return {
    ...fallback,
    updatedAt: new Date().toISOString(),
    days,
    source: 'adaptive-ai',
    strategySummary: typeof parsed.strategySummary === 'string'
      ? parsed.strategySummary.replace(/\s+/g, ' ').trim().slice(0, 320)
      : 'Your workload is balanced around your target, available time, and recent performance.',
  }
}

export function buildPlannerPerformanceContext(
  overview: ProfileOverview | null,
  previousPlan: WeeklyPlan | null,
  activityLog: ActivityLog,
): PlannerPerformanceContext {
  const generatedTasks = previousPlan?.days.flatMap((day) => day.generatedTasks.map((task) => ({ task, dateISO: day.dateISO }))) ?? []
  const completedTasks = generatedTasks.filter(({ task, dateISO }) => taskAutoCompleted(task, dateISO, activityLog)).length

  return {
    recentAttempts: (overview?.recentAttempts ?? []).slice(0, 10).map((attempt) => ({
      title: attempt.test.title,
      category: attempt.test.category,
      score: attempt.finalScore,
      accuracy: attempt.percentage,
      completedAt: attempt.completedAt,
    })),
    skillBreakdown: (overview?.skillAnalytics.trackBreakdown ?? []).map((track) => ({
      label: track.label,
      accuracy: track.accuracy,
      consistency: track.consistency,
      attempts: track.attempts,
    })),
    previousWeek: previousPlan ? {
      completedTasks,
      totalTasks: generatedTasks.length,
      completionPercent: generatedTasks.length ? Math.round((completedTasks / generatedTasks.length) * 100) : 0,
    } : null,
  }
}

export async function generateAdaptiveWeeklyPlan(
  profile: OnboardingProfile,
  performance?: PlannerPerformanceContext,
  now = new Date(),
): Promise<WeeklyPlan> {
  const fallback = generateWeeklyPlan(profile, now)
  const systemPrompt = `You are ProfAI's senior IELTS and Digital SAT study-plan engine. Build a realistic Monday-to-Sunday plan from the learner profile and measured performance. Prioritize weak skills, preserve strong skills, increase mock/review work near the exam, and never exceed the learner's daily time. Return JSON only. Each day must have dayIndex 0..6 and 2..6 tasks. activityKey must be one of: ielts-reading, ielts-listening, ielts-writing, ielts-speaking, sat-math, sat-rw, vocabulary, mock. Do not include unsupported exam tracks. Titles must be specific and actionable. Output: {"strategySummary":"one concise explanation","days":[{"dayIndex":0,"tasks":[{"title":"...","durationMinutes":45,"activityKey":"..."}]}]}`
  const userMessage = JSON.stringify({
    learner: profile,
    measuredPerformance: performance ?? {
      recentAttempts: [],
      skillBreakdown: [],
      previousWeek: null,
      note: 'First week: use current and target scores as the baseline.',
    },
    week: { start: fallback.weekStartISO, end: fallback.weekEndISO },
  })

  try {
    const raw = await callGeminiAPI(systemPrompt, userMessage, 4096)
    return sanitizePlan(raw, profile, fallback) ?? fallback
  } catch {
    // Planning must never block onboarding or a Monday rollover. The deterministic
    // expert template remains a complete, safe plan when Gemini is unavailable.
    return fallback
  }
}
