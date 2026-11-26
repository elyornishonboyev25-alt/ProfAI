import type { TestCategory } from '@prisma/client'
import { ieltsBandForCorrect } from './ieltsStanding.service.js'

export type LearningResultPoint = {
  id: string
  examType: TestCategory
  skill: string
  title: string
  score: number
  maxScore: number
  accuracy: number | null
  correctAnswers?: number | null
  totalQuestions?: number | null
  durationSec: number
  completedAt: Date
  source: 'TEST_ATTEMPT' | 'ASSESSMENT_RESULT' | 'SPEAKING_SESSION'
  scoreStatus?: 'SCORED' | 'PENDING' | 'UNVERIFIED'
  scoreKind?: 'BAND' | 'SCALED' | 'PERCENT' | 'ESTIMATED'
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
  scoredAttempts: number
  pendingAttempts: number
  assignmentTotal: number
  assignmentsCompleted: number
  highestSatSource: 'TEST' | 'COMBINED_SECTIONS' | 'PROFILE' | null
  highestIeltsSource: 'TEST' | 'FOUR_SKILLS' | 'PROFILE' | null
  activityNote: string
  currentSatSource: 'TEST' | 'COMBINED_SECTIONS' | 'PROFILE' | null
  currentIeltsSource: 'TEST' | 'FOUR_SKILLS' | 'PROFILE' | null
  ieltsSkillCount: number
  latestResult: (Omit<LearningResultPoint, 'completedAt' | 'breakdown'> & { completedAt: string }) | null
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
  SAT_OVERALL: 'Overall',
}

export function round(value: number, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

export function percentToIeltsBand(percentage: number) {
  return ieltsBandForCorrect(Math.round(Math.max(0, Math.min(100, percentage)) * 40 / 100))
}

export function percentToSatScore(percentage: number) {
  return Math.max(400, Math.min(1600, Math.round((400 + percentage * 12) / 10) * 10))
}

export function inferAttemptSkill(category: TestCategory, subjects: string[], title = '') {
  const haystack = [...subjects, title].join(' ').toLowerCase()
  if (category === 'SAT') {
    const math = /math|algebra|geometry|quant|problem solving/.test(haystack)
    const verbal = /reading|writing|grammar|english|verbal|language/.test(haystack)
    if (math && verbal) return 'SAT_OVERALL'
    if (math) return 'SAT_MATH'
    if (verbal) return 'SAT_READING_WRITING'
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
  totalQuestions?: number
  correctAnswers?: number
  completedAt: Date
  test: { title: string; category: TestCategory; subjects: string[] }
}): LearningResultPoint {
  const skill = inferAttemptSkill(attempt.test.category, attempt.test.subjects, attempt.test.title)
  const score = attempt.test.category === 'SAT'
    ? skill === 'SAT_OVERALL' ? percentToSatScore(attempt.percentage) : Math.round((200 + Math.max(0, Math.min(100, attempt.percentage)) * 6) / 10) * 10
    : ieltsBandForCorrect(attempt.correctAnswers ?? Math.round(attempt.percentage * 40 / 100))
  const partial = attempt.test.category === 'IELTS' && (!['IELTS_READING', 'IELTS_LISTENING'].includes(skill) || attempt.totalQuestions !== undefined && attempt.totalQuestions !== 40)
  return {
    id: attempt.id,
    examType: attempt.test.category,
    skill,
    title: attempt.test.title,
    score: partial ? round(attempt.percentage) : score,
    maxScore: partial ? 100 : attempt.test.category === 'SAT' ? skill === 'SAT_OVERALL' ? 1600 : 800 : 9,
    accuracy: round(attempt.percentage),
    durationSec: attempt.timeSpentSec,
    completedAt: attempt.completedAt,
    source: 'TEST_ATTEMPT',
    scoreStatus: 'SCORED',
    scoreKind: partial ? 'PERCENT' : attempt.test.category === 'SAT' ? 'ESTIMATED' : 'BAND',
    breakdown: { correct: attempt.correctAnswers, total: attempt.totalQuestions },
  }
}

/** A recorded zero remains a score when grading evidence exists. Historical
 * placeholders without evidence must not become a student's measured ability. */
export function classifyResult(result: LearningResultPoint): LearningResultPoint {
  const detail = (result.breakdown ?? {}) as Record<string, unknown>
  // Legacy local full papers stored accuracy on a /100 scale. Convert only
  // when the original answer counts prove this is a full 40-question paper.
  if (result.examType === 'IELTS' && ['IELTS_READING', 'IELTS_LISTENING'].includes(result.skill)
    && result.maxScore === 100 && detail.partial === false && detail.total === 40 && typeof detail.correct === 'number') {
    result = { ...result, score: ieltsBandForCorrect(detail.correct), maxScore: 9, scoreKind: 'BAND' }
  }
  const pending = detail.assessmentStatus === 'pending' || detail.status === 'pending' || detail.pending === true
  const writingCriteria = ['taskAchievement', 'coherenceCohesion', 'lexicalResource', 'grammaticalRange']
  const speakingCriteria = ['fluency', 'lexical', 'grammar', 'pronunciation']
  const hasCriteria = (result.skill === 'IELTS_WRITING' ? writingCriteria : speakingCriteria).some(key => typeof detail[key] === 'number')
    || Array.isArray(detail.tasks) && detail.tasks.some(task => task && typeof task === 'object' && writingCriteria.some(key => typeof task[key] === 'number'))
  const unverified = result.examType === 'IELTS' && ['IELTS_WRITING', 'IELTS_SPEAKING'].includes(result.skill)
    && result.maxScore === 9 && result.score === 0 && !hasCriteria && detail.assessmentStatus !== 'graded' && result.source !== 'SPEAKING_SESSION'
    || result.examType === 'SAT' && (result.maxScore === 800 && result.score < 200 || result.maxScore === 1600 && result.score < 400)
  return {
    ...result,
    correctAnswers: result.correctAnswers ?? (typeof detail.correct === 'number' ? detail.correct : null),
    totalQuestions: result.totalQuestions ?? (typeof detail.total === 'number' ? detail.total : null),
    scoreStatus: result.scoreStatus ?? (pending ? 'PENDING' : unverified ? 'UNVERIFIED' : 'SCORED'),
    scoreKind: result.scoreKind ?? (result.maxScore === 100 ? 'PERCENT' : result.examType === 'IELTS' ? 'BAND' : 'SCALED'),
  }
}

export function isScored(result: LearningResultPoint) {
  return classifyResult(result).scoreStatus === 'SCORED' && Number.isFinite(result.score)
    && Number.isFinite(result.maxScore) && result.maxScore > 0 && result.score >= 0 && result.score <= result.maxScore
}

export function resultSeriesKey(result: LearningResultPoint) {
  return `${result.examType}:${result.skill}:${result.maxScore}:${classifyResult(result).scoreKind}`
}

export function progressGrowth(results: LearningResultPoint[]) {
  const sorted = results.map(classifyResult).filter(isScored).sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
  const series = new Map<string, LearningResultPoint[]>()
  for (const point of sorted) {
    const key = resultSeriesKey(point)
    const entries = series.get(key) ?? []
    entries.push(point)
    series.set(key, entries)
  }
  const growth = [...series.values()].flatMap(points => {
    if (points.length < 2) return []
    const size = Math.min(3, Math.floor(points.length / 2))
    const percentages = points.map(point => point.score / point.maxScore * 100)
    return [average(percentages.slice(-size)) - average(percentages.slice(0, size))]
  })
  return round(average(growth))
}

export function summarizeStudent(
  student: CenterStudentIdentity,
  results: LearningResultPoint[],
  assignmentStats?: { total: number; completed: number },
): StudentProgressSummary {
  const history = results.map(classifyResult).sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
  const sorted = history.filter(isScored)
  const sat = sorted.filter(result => result.examType === 'SAT' && result.scoreKind !== 'ESTIMATED')
  const ielts = sorted.filter(result => result.examType === 'IELTS' && result.maxScore === 9)
  const satOverall = sat.filter(result => result.skill === 'SAT_OVERALL' && result.maxScore === 1600)
  const latestMath = sat.filter(result => result.skill === 'SAT_MATH' && result.maxScore === 800).at(-1)
  const latestVerbal = sat.filter(result => result.skill === 'SAT_READING_WRITING' && result.maxScore === 800).at(-1)
  const combinedSections = latestMath && latestVerbal ? latestMath.score + latestVerbal.score : null
  const overall = satOverall.at(-1)
  const useSections = combinedSections !== null && (!overall || Math.max(latestMath!.completedAt.getTime(), latestVerbal!.completedAt.getTime()) > overall.completedAt.getTime())
  const latestSat = useSections ? combinedSections : overall?.score ?? student.profile?.currentSatScore ?? null
  const sectionScores = new Map<string, number>()
  const satEstimates: number[] = []
  for (const result of sat) {
    if (['SAT_MATH', 'SAT_READING_WRITING'].includes(result.skill) && result.maxScore === 800) sectionScores.set(result.skill, result.score)
    if (sectionScores.size === 2) satEstimates.push([...sectionScores.values()].reduce((sum, value) => sum + value, 0))
  }
  const satBest = [...satOverall.map(result => result.score), ...satEstimates]

  // Four separately completed skills form an estimate, never a full mock result.
  // Round IELTS averages to half bands and keep partial coverage explicit.
  const bands = new Map<string, number>()
  const ieltsEstimates: number[] = []
  for (const result of ielts) {
    if (result.skill in IELTS_SKILL_LABELS) bands.set(result.skill, result.score)
    if (bands.size === 4) ieltsEstimates.push(Math.round(average([...bands.values()]) * 2) / 2)
  }
  const ieltsOverall = ielts.filter(result => result.skill === 'IELTS_OVERALL')
  const lastIeltsOverall = ieltsOverall.at(-1)
  const latestSkillAt = ielts.filter(result => result.skill in IELTS_SKILL_LABELS).at(-1)?.completedAt.getTime() ?? 0
  const useSkills = bands.size === 4 && (!lastIeltsOverall || latestSkillAt > lastIeltsOverall.completedAt.getTime())
  const latestIelts = useSkills ? ieltsEstimates.at(-1)! : lastIeltsOverall?.score ?? student.profile?.currentIeltsScore ?? null
  const ieltsBest = [...ieltsOverall.map(result => result.score), ...ieltsEstimates]
  const lastActive = history.at(-1)?.completedAt ?? null
  const inactiveDays = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86_400_000) : Infinity
  const improvement = progressGrowth(sorted)
  const status = history.length && !sorted.length ? 'WATCH' : inactiveDays > 14 || improvement < -6 ? 'NEEDS_ATTENTION' : inactiveDays > 7 || improvement < 0 ? 'WATCH' : 'ON_TRACK'

  const skills = [...Object.entries(IELTS_SKILL_LABELS), ...Object.entries(SAT_SKILL_LABELS)].flatMap(([key, label]) => {
    // Percent practice and native exam scores use distinct rows and trends.
    const entries = sorted.filter(result => result.skill === key)
    const scales = [...new Set(entries.map(resultSeriesKey))]
    return scales.map(scale => {
      const points = entries.filter(result => resultSeriesKey(result) === scale)
      const latest = points.at(-1)!
      return { key: scale, label: `${latest.examType} ${label}`, score: latest.score, maxScore: latest.maxScore,
        attempts: points.length, change: round(latest.score - points[0].score) }
    })
  })
  const last = history.at(-1)
  const exams = new Set(history.map(result => result.examType))
  const targetExam = ['IELTS', 'SAT', 'BOTH'].includes(student.profile?.targetExam ?? '') ? student.profile!.targetExam : undefined
  return {
    id: student.id, fullName: student.fullName, nickname: student.nickname, avatarUrl: student.avatarUrl,
    targetExam: targetExam === 'BOTH' || exams.size === 2 || targetExam && exams.size && !exams.has(targetExam as TestCategory)
      ? 'BOTH' : targetExam ?? (exams.has('SAT') ? 'SAT' : exams.has('IELTS') ? 'IELTS' : 'UNSET'),
    targetScore: student.profile?.targetScore ?? null, currentStreak: student.currentStreak,
    currentSat: latestSat, highestSat: satBest.length ? Math.max(...satBest) : student.profile?.currentSatScore ?? null,
    targetSat: student.profile?.targetSatScore ?? null,
    currentIelts: latestIelts, highestIelts: ieltsBest.length ? Math.max(...ieltsBest) : student.profile?.currentIeltsScore ?? null,
    targetIelts: student.profile?.targetIeltsScore ?? null,
    currentSatSource: useSections ? 'COMBINED_SECTIONS' : overall ? 'TEST' : latestSat !== null ? 'PROFILE' : null,
    currentIeltsSource: useSkills ? 'FOUR_SKILLS' : lastIeltsOverall ? 'TEST' : latestIelts !== null ? 'PROFILE' : null,
    highestSatSource: satBest.length ? Math.max(...satOverall.map(result => result.score)) >= Math.max(...satEstimates) ? 'TEST' : 'COMBINED_SECTIONS' : student.profile?.currentSatScore != null ? 'PROFILE' : null,
    highestIeltsSource: ieltsBest.length ? Math.max(...ieltsOverall.map(result => result.score)) >= Math.max(...ieltsEstimates) ? 'TEST' : 'FOUR_SKILLS' : student.profile?.currentIeltsScore != null ? 'PROFILE' : null,
    activityNote: !history.length ? 'No recorded tests' : !sorted.length ? 'No verified scores yet' : inactiveDays > 14 ? 'No test in 14+ days' : improvement < -6 ? 'Scores declined in comparable tests' : inactiveDays > 7 ? 'No test in 7+ days' : improvement < 0 ? 'Recent scores are lower' : 'Recent test activity',
    ieltsSkillCount: bands.size,
    attempts: history.length, scoredAttempts: sorted.length, pendingAttempts: history.length - sorted.length,
    assignmentTotal: assignmentStats?.total ?? 0, assignmentsCompleted: assignmentStats?.completed ?? 0,
    latestResult: last ? { id: last.id, examType: last.examType, skill: last.skill, title: last.title,
      score: last.score, maxScore: last.maxScore, scoreStatus: last.scoreStatus, scoreKind: last.scoreKind,
      accuracy: last.accuracy, correctAnswers: last.correctAnswers, totalQuestions: last.totalQuestions, durationSec: last.durationSec, source: last.source, completedAt: last.completedAt.toISOString() } : null,
    averageScore: round(average(sorted.map(result => result.score / result.maxScore * 100))), improvement,
    completionRate: assignmentStats?.total ? round(assignmentStats.completed / assignmentStats.total * 100) : 0,
    lastActiveAt: lastActive?.toISOString() ?? null, status, skills,
  }
}

export function buildDataDrivenInsight(summary: StudentProgressSummary, results: LearningResultPoint[]) {
  const scored = results.filter(isScored)
  if (!scored.length) return {
    headline: 'More performance data is needed',
    summary: summary.pendingAttempts ? 'Saved submissions need verified scores before progress can be measured.' : 'Assign a diagnostic IELTS or SAT test to establish this student’s baseline.',
    priorities: ['Complete a full diagnostic test', 'Set a target score and exam date'], tone: 'neutral' as const,
  }
  const comparable = new Set(scored.map(resultSeriesKey)).size < scored.length
  const direction = summary.improvement > 3 ? 'positive' : summary.improvement < -3 ? 'declining' : 'stable'
  // Recommendations stay within each exam. SAT points never determine an IELTS weakness.
  const priorities = (['IELTS', 'SAT'] as const).flatMap(exam => {
    const skills = summary.skills.filter(skill => skill.key.startsWith(`${exam}:`) && skill.maxScore !== 100 && !skill.key.endsWith(':ESTIMATED'))
    const weakest = skills.sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)[0]
    return weakest ? [`Focus the next 7 days on ${weakest.label.replace(`${exam} `, `${exam} · `)}`] : []
  })
  return {
    headline: !comparable ? 'A baseline is recorded' : direction === 'positive' ? 'Momentum is building' : direction === 'declining' ? 'Early intervention recommended' : 'Performance is stable',
    summary: !comparable ? 'Repeat the same exam section on the same score scale to measure growth. A single result cannot establish a trend.'
      : `Growth is ${summary.improvement > 0 ? '+' : ''}${summary.improvement.toFixed(1)} percentage points across comparable sections. IELTS and SAT scores are kept on their own scales; unverified scores are excluded.`,
    priorities: [...priorities, 'Complete one timed practice and review every error'].slice(0, 3),
    tone: !comparable ? 'neutral' as const : direction === 'positive' ? 'positive' as const : direction === 'declining' ? 'warning' as const : 'neutral' as const,
  }
}
