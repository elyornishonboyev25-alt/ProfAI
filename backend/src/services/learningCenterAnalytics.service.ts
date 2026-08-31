import type { TestCategory } from '@prisma/client'

export type LearningResultPoint = {
  id: string
  examType: TestCategory
  skill: string
  title: string
  score: number
  maxScore: number
  accuracy: number | null
  durationSec: number
  completedAt: Date
  source: 'TEST_ATTEMPT' | 'ASSESSMENT_RESULT' | 'SPEAKING_SESSION'
  breakdown?: unknown
}

export type CenterStudentIdentity = {
  id: string
  fullName: string
  nickname: string | null
  avatarUrl: string | null
  currentStreak: number
  profile: {
    targetExam: string | null
    targetScore: string | null
    currentIeltsScore: number | null
    targetIeltsScore: number | null
    currentSatScore: number | null
    targetSatScore: number | null
  } | null
}

export type StudentProgressSummary = {
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
  status: 'ON_TRACK' | 'WATCH' | 'NEEDS_ATTENTION'
  skills: Array<{ key: string; label: string; score: number; maxScore: number; attempts: number; change: number }>
}

const IELTS_SKILL_LABELS: Record<string, string> = {
  IELTS_LISTENING: 'Listening',
  IELTS_READING: 'Reading',
  IELTS_WRITING: 'Writing',
  IELTS_SPEAKING: 'Speaking',
}

const SAT_SKILL_LABELS: Record<string, string> = {
  SAT_MATH: 'Math',
  SAT_READING_WRITING: 'Reading & Writing',
  SAT_OVERALL: 'SAT Overall',
}

export function round(value: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

export function percentToIeltsBand(percentage: number) {
  if (percentage >= 97.5) return 9
  if (percentage >= 92.5) return 8.5
  if (percentage >= 87.5) return 8
  if (percentage >= 80) return 7.5
  if (percentage >= 72.5) return 7
  if (percentage >= 65) return 6.5
  if (percentage >= 57.5) return 6
  if (percentage >= 50) return 5.5
  if (percentage >= 42.5) return 5
  if (percentage >= 35) return 4.5
  if (percentage >= 27.5) return 4
  return Math.max(1, round(percentage / 10, 1))
}

export function percentToSatScore(percentage: number) {
  return Math.max(400, Math.min(1600, Math.round((400 + percentage * 12) / 10) * 10))
}

export function inferAttemptSkill(category: TestCategory, subjects: string[], title = '') {
  const haystack = [...subjects, title].join(' ').toLowerCase()
  if (category === 'SAT') {
    if (/math|algebra|geometry|quant|problem solving/.test(haystack)) return 'SAT_MATH'
    if (/reading|writing|grammar|english|verbal|language/.test(haystack)) return 'SAT_READING_WRITING'
    return 'SAT_OVERALL'
  }
  if (/listening|audio/.test(haystack)) return 'IELTS_LISTENING'
  if (/writing|essay|task 1|task 2/.test(haystack)) return 'IELTS_WRITING'
  if (/speaking|oral|pronunciation/.test(haystack)) return 'IELTS_SPEAKING'
  return 'IELTS_READING'
}

export function normalizeTestAttempt(attempt: {
  id: string
  finalScore: number
  percentage: number
  timeSpentSec: number
  completedAt: Date
  test: { title: string; category: TestCategory; subjects: string[] }
}): LearningResultPoint {
  const skill = inferAttemptSkill(attempt.test.category, attempt.test.subjects, attempt.test.title)
  const score = attempt.test.category === 'SAT'
    ? percentToSatScore(attempt.finalScore)
    : percentToIeltsBand(attempt.percentage)
  return {
    id: attempt.id,
    examType: attempt.test.category,
    skill,
    title: attempt.test.title,
    score,
    maxScore: attempt.test.category === 'SAT' ? 1600 : 9,
    accuracy: round(attempt.percentage),
    durationSec: attempt.timeSpentSec,
    completedAt: attempt.completedAt,
    source: 'TEST_ATTEMPT',
  }
}

export function summarizeStudent(
  student: CenterStudentIdentity,
  results: LearningResultPoint[],
  assignmentStats?: { total: number; completed: number },
): StudentProgressSummary {
  const sorted = [...results].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
  const sat = sorted.filter((result) => result.examType === 'SAT')
  const ielts = sorted.filter((result) => result.examType === 'IELTS')
  const satOverall = sat.filter((result) => result.skill === 'SAT_OVERALL')
  const latestSat = satOverall.at(-1)?.score ?? sat.at(-1)?.score ?? student.profile?.currentSatScore ?? null
  const highestSat = sat.length ? Math.max(...sat.map((result) => result.score)) : student.profile?.currentSatScore ?? null

  const latestIeltsBySkill = Object.keys(IELTS_SKILL_LABELS)
    .map((skill) => ielts.filter((result) => result.skill === skill).at(-1)?.score)
    .filter((score): score is number => typeof score === 'number')
  const derivedCurrentIelts = latestIeltsBySkill.length ? round(average(latestIeltsBySkill), 1) : null
  const latestIelts = derivedCurrentIelts ?? ielts.at(-1)?.score ?? student.profile?.currentIeltsScore ?? null
  const highestIelts = ielts.length ? Math.max(...ielts.map((result) => result.score)) : student.profile?.currentIeltsScore ?? null

  const normalizedScores = sorted.map((result) => (result.score / result.maxScore) * 100)
  const firstWindow = normalizedScores.slice(0, Math.min(3, normalizedScores.length))
  const lastWindow = normalizedScores.slice(-Math.min(3, normalizedScores.length))
  const improvement = normalizedScores.length > 1 ? round(average(lastWindow) - average(firstWindow)) : 0
  const lastActive = sorted.at(-1)?.completedAt ?? null
  const inactiveDays = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86_400_000) : Number.POSITIVE_INFINITY
  const status = inactiveDays > 14 || improvement < -6
    ? 'NEEDS_ATTENTION'
    : inactiveDays > 7 || improvement < 0
      ? 'WATCH'
      : 'ON_TRACK'

  const skillKeys = [...Object.keys(IELTS_SKILL_LABELS), ...Object.keys(SAT_SKILL_LABELS)]
  const skills = skillKeys.flatMap((key) => {
    const entries = sorted.filter((result) => result.skill === key)
    if (!entries.length) return []
    const first = entries[0]
    const latest = entries.at(-1)!
    return [{
      key,
      label: IELTS_SKILL_LABELS[key] ?? SAT_SKILL_LABELS[key] ?? key,
      score: latest.score,
      maxScore: latest.maxScore,
      attempts: entries.length,
      change: round(latest.score - first.score),
    }]
  })

  return {
    id: student.id,
    fullName: student.fullName,
    nickname: student.nickname,
    avatarUrl: student.avatarUrl,
    targetExam: student.profile?.targetExam ?? (sat.length && ielts.length ? 'BOTH' : sat.length ? 'SAT' : 'IELTS'),
    targetScore: student.profile?.targetScore ?? null,
    currentStreak: student.currentStreak,
    currentSat: latestSat,
    highestSat,
    targetSat: student.profile?.targetSatScore ?? null,
    currentIelts: latestIelts,
    highestIelts,
    targetIelts: student.profile?.targetIeltsScore ?? null,
    attempts: sorted.length,
    averageScore: round(average(normalizedScores)),
    improvement,
    completionRate: assignmentStats?.total ? round((assignmentStats.completed / assignmentStats.total) * 100) : 0,
    lastActiveAt: lastActive?.toISOString() ?? null,
    status,
    skills,
  }
}

export function buildDataDrivenInsight(summary: StudentProgressSummary, results: LearningResultPoint[]) {
  if (!results.length) {
    return {
      headline: 'More performance data is needed',
      summary: 'Assign a diagnostic IELTS or SAT test to establish this student’s baseline.',
      priorities: ['Complete a full diagnostic test', 'Set a target score and exam date'],
      tone: 'neutral' as const,
    }
  }

  const weakest = [...summary.skills]
    .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore))[0]
  const strongest = [...summary.skills]
    .sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))[0]
  const direction = summary.improvement > 3 ? 'positive' : summary.improvement < -3 ? 'declining' : 'stable'
  const priorities = weakest
    ? [`Focus the next 7 days on ${weakest.label}`, 'Complete one timed practice and review every error']
    : ['Complete another full-length test', 'Review missed questions by topic']

  return {
    headline: direction === 'positive' ? 'Momentum is building' : direction === 'declining' ? 'Early intervention recommended' : 'Performance is stable',
    summary: weakest
      ? `${summary.fullName}'s strongest measured area is ${strongest?.label ?? 'their latest track'}, while ${weakest.label} has the clearest growth opportunity. Recent normalized performance is ${Math.abs(summary.improvement).toFixed(1)} points ${summary.improvement >= 0 ? 'above' : 'below'} the starting window.`
      : `${summary.fullName} has a measurable baseline. Add section-level practice to unlock a more precise skill diagnosis.`,
    priorities,
    tone: direction === 'positive' ? 'positive' as const : direction === 'declining' ? 'warning' as const : 'neutral' as const,
  }
}
