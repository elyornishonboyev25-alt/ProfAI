import { randomUUID } from 'node:crypto'
import { z } from 'zod'

export const skillKeys = ['IELTS_READING', 'IELTS_LISTENING', 'IELTS_WRITING', 'IELTS_SPEAKING', 'SAT_MATH', 'SAT_READING_WRITING'] as const
export type SkillKey = typeof skillKeys[number]
export type TaskStatus = 'TODO' | 'DONE'
export type StudyTask = {
  id: string
  title: string
  outcome: string
  minutes: number
  category: 'IELTS' | 'SAT' | 'APPLICATION'
  skill: SkillKey | null
  milestoneKey: string | null
  route: string
  completionMode: 'ASSESSMENT' | 'MANUAL'
  status: TaskStatus
  completedAt: string | null
}
export type StudyDay = { date: string; tasks: StudyTask[] }
export type StudyReview = {
  headline: string
  reasons: string[]
  completed: number
  total: number
  focusSkill: SkillKey | null
}
export type SkillEvidence = { id: string; skill: SkillKey; percent: number; completedAt: Date }
export type RoadmapItem = { key: string; title: string; detail: string; timing: string; route: string; status: 'DONE' | 'IN_PROGRESS' | 'TODO' }

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}, 'Invalid date')
const progress = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE'])
export const studyAnswersSchema = z.object({
  universities: z.array(z.string().trim().min(2).max(100)).max(5),
  destinationCountry: z.string().trim().max(80),
  intendedMajor: z.string().trim().max(100),
  intakeYear: z.number().int().min(new Date().getUTCFullYear()).max(new Date().getUTCFullYear() + 7),
  applicationDeadline: dateField.nullable(),
  examTrack: z.enum(['IELTS', 'SAT', 'BOTH', 'NONE', 'UNSURE']),
  ieltsExamDate: dateField.nullable(),
  satExamDate: dateField.nullable(),
  currentIeltsScore: z.number().min(0).max(9).multipleOf(0.5).nullable(),
  currentSatScore: z.number().int().min(400).max(1600).nullable(),
  targetIeltsScore: z.number().min(4).max(9).multipleOf(0.5).nullable(),
  targetSatScore: z.number().int().min(400).max(1600).nullable(),
  weeklyAvailability: z.array(z.number().int().min(0).max(360)).length(7).refine((days) => days.some((minutes) => minutes >= 20), 'Choose at least one study day.'),
  applicationProgress: z.object({
    shortlist: progress,
    transcripts: progress,
    essay: progress,
    recommendations: progress,
    activities: progress,
    funding: progress,
  }),
  needsFunding: z.boolean(),
}).superRefine((answers, context) => {
  if (['IELTS', 'BOTH'].includes(answers.examTrack) && answers.targetIeltsScore === null) context.addIssue({ code: 'custom', path: ['targetIeltsScore'], message: 'Add an IELTS target score.' })
  if (['SAT', 'BOTH'].includes(answers.examTrack) && answers.targetSatScore === null) context.addIssue({ code: 'custom', path: ['targetSatScore'], message: 'Add a SAT target score.' })
  if (['IELTS', 'BOTH'].includes(answers.examTrack) && answers.currentIeltsScore !== null && answers.targetIeltsScore !== null && answers.currentIeltsScore > answers.targetIeltsScore) context.addIssue({ code: 'custom', path: ['targetIeltsScore'], message: 'IELTS target must be at least the current score.' })
  if (['SAT', 'BOTH'].includes(answers.examTrack) && answers.currentSatScore !== null && answers.targetSatScore !== null && answers.currentSatScore > answers.targetSatScore) context.addIssue({ code: 'custom', path: ['targetSatScore'], message: 'SAT target must be at least the current score.' })
})
export type StudyAnswers = z.infer<typeof studyAnswersSchema>

export function localDate(value: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value)
    const get = (kind: string) => parts.find((part) => part.type === kind)?.value ?? ''
    return `${get('year')}-${get('month')}-${get('day')}`
  } catch {
    return value.toISOString().slice(0, 10)
  }
}

export function weekStartOf(dateISO: string): string {
  const date = new Date(`${dateISO}T12:00:00Z`)
  const day = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1))
  return date.toISOString().slice(0, 10)
}

function plusDays(dateISO: string, days: number): string {
  const date = new Date(`${dateISO}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const skillMeta: Record<SkillKey, { label: string; category: 'IELTS' | 'SAT'; route: string; practice: string; outcome: string }> = {
  IELTS_READING: { label: 'IELTS Reading', category: 'IELTS', route: '/ielts/reading', practice: 'Complete a timed Reading passage and review every missed answer', outcome: 'Record the question types you missed and one correction for each.' },
  IELTS_LISTENING: { label: 'IELTS Listening', category: 'IELTS', route: '/ielts/listening', practice: 'Complete one Listening section under timed conditions', outcome: 'Review the transcript and classify every missed answer.' },
  IELTS_WRITING: { label: 'IELTS Writing', category: 'IELTS', route: '/ielts/writing/tests', practice: 'Write one IELTS task and review the feedback', outcome: 'Save a revised introduction and two improvements from feedback.' },
  IELTS_SPEAKING: { label: 'IELTS Speaking', category: 'IELTS', route: '/ielts/speaking/tests', practice: 'Complete a Speaking practice and review the recording', outcome: 'Note two fluency or vocabulary improvements to use next time.' },
  SAT_MATH: { label: 'SAT Math', category: 'SAT', route: '/sat/math', practice: 'Complete a timed SAT Math set and review mistakes', outcome: 'Write the correct method for every missed question.' },
  SAT_READING_WRITING: { label: 'SAT Reading & Writing', category: 'SAT', route: '/sat/reading-writing', practice: 'Complete a timed SAT Reading & Writing set', outcome: 'Group missed questions by grammar or evidence skill.' },
}

export function normalizeSkill(value: string, exam: string): SkillKey | null {
  const text = value.toUpperCase().replace(/[^A-Z]+/g, '_')
  if (text.includes('LISTEN')) return exam === 'IELTS' ? 'IELTS_LISTENING' : null
  if (text.includes('SPEAK')) return exam === 'IELTS' ? 'IELTS_SPEAKING' : null
  if (text.includes('MATH')) return exam === 'SAT' ? 'SAT_MATH' : null
  if (text.includes('WRITING') && exam === 'SAT') return 'SAT_READING_WRITING'
  if (text.includes('READ') && exam === 'SAT') return 'SAT_READING_WRITING'
  if (text.includes('WRITING') && exam === 'IELTS') return 'IELTS_WRITING'
  if (text.includes('READ') && exam === 'IELTS') return 'IELTS_READING'
  return null
}

function eligibleSkills(answers: StudyAnswers): SkillKey[] {
  return skillKeys.filter((key) => (answers.examTrack === 'BOTH' || (answers.examTrack === 'IELTS' && key.startsWith('IELTS')) || (answers.examTrack === 'SAT' && key.startsWith('SAT'))))
}

function skillScores(evidence: SkillEvidence[]) {
  return new Map(skillKeys.map((skill) => {
    const values = evidence.filter((row) => row.skill === skill).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()).slice(0, 4)
    return [skill, values.length ? Math.round(values.reduce((sum, row) => sum + row.percent, 0) / values.length) : null] as const
  }))
}

export function buildRoadmap(answers: StudyAnswers): RoadmapItem[] {
  const status = answers.applicationProgress
  const deadline = answers.applicationDeadline ? `Your entered deadline: ${answers.applicationDeadline}` : 'Confirm each university’s official deadline'
  const universityLabel = answers.universities.length ? answers.universities.join(', ') : answers.destinationCountry || 'target universities'
  const courseLabel = answers.intendedMajor || 'your chosen course'
  const shortlistTitle = answers.universities.length
    ? `Research ${answers.universities[0]}${answers.universities.length > 1 ? ` + ${answers.universities.length - 1} more` : ''}`
    : `Build a ${answers.destinationCountry || 'university'} shortlist`
  const items: RoadmapItem[] = [
    { key: 'shortlist', title: shortlistTitle, detail: `Compare ${courseLabel} entry requirements, costs and deadlines for ${universityLabel} on official university pages.`, timing: 'Start early', route: '/admission/universities', status: status.shortlist },
    { key: 'transcripts', title: 'Academic documents', detail: 'List required transcripts and certificates, then prepare verified copies.', timing: 'Before applications', route: '/admission', status: status.transcripts },
    { key: 'essay', title: 'Personal statement', detail: 'Draft, revise and proofread a university-specific statement.', timing: 'Before applications', route: '/admission/lessons', status: status.essay },
    { key: 'recommendations', title: 'Recommendations', detail: 'Confirm recommenders and give them enough time and context.', timing: 'Before applications', route: '/admission', status: status.recommendations },
    { key: 'activities', title: 'Activities and evidence', detail: 'Collect accurate examples of work, leadership and impact.', timing: 'Before applications', route: '/admission', status: status.activities },
  ].map((item) => ({ ...item, status: item.status === 'DONE' ? 'DONE' as const : item.status === 'IN_PROGRESS' ? 'IN_PROGRESS' as const : 'TODO' as const }))
  if (answers.needsFunding) items.push({ key: 'funding', title: 'Funding and scholarships', detail: 'Check eligibility, documents and separate funding deadlines on official pages.', timing: 'Alongside applications', route: '/admission/universities', status: status.funding === 'DONE' ? 'DONE' : status.funding === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'TODO' })
  items.push({ key: 'submit', title: 'Final application review', detail: 'Verify requirements, documents and submission confirmation for each university.', timing: deadline, route: '/admission', status: 'TODO' })
  return items
}

function task(input: Omit<StudyTask, 'id' | 'status' | 'completedAt'>): StudyTask {
  return { id: randomUUID(), status: 'TODO', completedAt: null, ...input }
}

function applicationTask(item: RoadmapItem, minutes: number, carryover = false): StudyTask {
  return task({
    title: `${carryover ? 'Continue: ' : ''}${item.title}`,
    outcome: item.detail,
    minutes,
    category: 'APPLICATION',
    skill: null,
    milestoneKey: item.key,
    route: item.route,
    completionMode: 'MANUAL',
  })
}

export function summarizeWeek(days: StudyDay[]): { completed: number; total: number; missed: StudyTask[] } {
  const tasks = days.flatMap((day) => day.tasks)
  return { completed: tasks.filter((item) => item.status === 'DONE').length, total: tasks.length, missed: tasks.filter((item) => item.status !== 'DONE') }
}

export function buildWeek(
  answers: StudyAnswers,
  evidence: SkillEvidence[],
  weekStart: string,
  today: string,
  previousDays: StudyDay[] | null,
): { days: StudyDay[]; review: StudyReview } {
  const scores = skillScores(evidence)
  const previous = previousDays ? summarizeWeek(previousDays) : null
  const missedSkills = new Map(skillKeys.map((key) => [key, previous?.missed.filter((item) => item.skill === key).length ?? 0] as const))
  const skills = eligibleSkills(answers).sort((a, b) => ((scores.get(a) ?? 68) - (missedSkills.get(a) ?? 0) * 7) - ((scores.get(b) ?? 68) - (missedSkills.get(b) ?? 0) * 7))
  const focusSkill = skills[0] ?? null
  const carryover = previous?.missed.find((item) => item.category === 'APPLICATION') ?? null
  const deadlineDays = answers.applicationDeadline ? Math.ceil((Date.parse(`${answers.applicationDeadline}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000) : null
  const examDates = [
    ['IELTS', 'BOTH'].includes(answers.examTrack) ? answers.ieltsExamDate : null,
    ['SAT', 'BOTH'].includes(answers.examTrack) ? answers.satExamDate : null,
  ].filter((date): date is string => Boolean(date))
  const examDays = examDates.length ? Math.min(...examDates.map((date) => Math.ceil((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000))) : null
  const urgentExam = examDays !== null && examDays >= 0 && examDays <= 30
  const largeScoreGap = (['IELTS', 'BOTH'].includes(answers.examTrack) && !evidence.some((row) => row.skill.startsWith('IELTS')) && answers.currentIeltsScore !== null && answers.targetIeltsScore !== null && answers.targetIeltsScore - answers.currentIeltsScore >= 1.5)
    || (['SAT', 'BOTH'].includes(answers.examTrack) && !evidence.some((row) => row.skill.startsWith('SAT')) && answers.currentSatScore !== null && answers.targetSatScore !== null && answers.targetSatScore - answers.currentSatScore >= 200)
  const urgentApplication = deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 30
  const roadmap = buildRoadmap(answers).filter((item) => item.status !== 'DONE' && (item.key !== 'submit' || urgentApplication))
  if (urgentApplication && deadlineDays !== null && deadlineDays <= 7) roadmap.sort((a, b) => Number(b.key === 'submit') - Number(a.key === 'submit'))
  if (!roadmap.length && !skills.length) roadmap.push(buildRoadmap(answers).find((item) => item.key === 'submit')!)
  const reasons: string[] = []
  if (focusSkill) reasons.push(scores.get(focusSkill) !== null
    ? `${skillMeta[focusSkill].label} needs the most attention (${scores.get(focusSkill)}% across recent results${missedSkills.get(focusSkill) ? ', with unfinished practice' : ''}).`
    : `Start with ${skillMeta[focusSkill].label}; there is no measured skill result yet.`)
  if (previous) reasons.push(`${previous.completed} of ${previous.total} tasks were completed in the previous saved week.`)
  if (carryover) reasons.push(`${carryover.title} remains in progress and is carried into this week.`)
  if (urgentExam) reasons.push(`Your next exam is in ${examDays} day${examDays === 1 ? '' : 's'}, so timed practice receives more attention.`)
  if (largeScoreGap) reasons.push('Your reported score is well below your target; the week includes extra review and practice.')
  if (urgentApplication) reasons.push(`Your entered application deadline is in ${deadlineDays} day${deadlineDays === 1 ? '' : 's'}; application work is prioritized.`)
  if (deadlineDays !== null && deadlineDays < 0) reasons.push('Your entered application deadline has passed. Update it before relying on this roadmap.')
  if (examDays !== null && examDays < 0) reasons.push('Your entered exam date has passed. Update it to restore date-based planning.')
  const previousWeekStart = plusDays(weekStart, -7)
  const olderWeekStart = plusDays(weekStart, -14)
  if (focusSkill) {
    const recent = evidence.filter((row) => row.skill === focusSkill && localDate(row.completedAt, 'UTC') >= previousWeekStart && localDate(row.completedAt, 'UTC') < weekStart)
    const older = evidence.filter((row) => row.skill === focusSkill && localDate(row.completedAt, 'UTC') >= olderWeekStart && localDate(row.completedAt, 'UTC') < previousWeekStart)
    if (recent.length && older.length) {
      const average = (rows: SkillEvidence[]) => Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length)
      const change = average(recent) - average(older)
      reasons.push(`${skillMeta[focusSkill].label} changed by ${change > 0 ? '+' : ''}${change} points across the last two measured weeks.`)
    }
  }
  if (!answers.applicationDeadline) reasons.push('Application dates must be checked on each university’s official site.')
  const availableDays = answers.weeklyAvailability.filter((minutes, index) => minutes >= 20 && plusDays(weekStart, index) >= today).length
  let plannedDay = 0
  const assignedMilestones = new Set<string>()
  const days = Array.from({ length: 7 }, (_, index): StudyDay => {
    const date = plusDays(weekStart, index)
    const budget = date < today ? 0 : answers.weeklyAvailability[index]
    if (budget < 20) return { date, tasks: [] }
    const dayTasks: StudyTask[] = []
    const skill = skills.length ? skills[(plannedDay === 0 || plannedDay % 3 === 0 ? 0 : plannedDay) % skills.length] : null
    const needsAdmission = roadmap.length > assignedMilestones.size && (urgentApplication || !skill || ((urgentExam || largeScoreGap) ? plannedDay % 3 === 0 : plannedDay % 2 === 0) || budget >= 100)
    if (skill) {
      const meta = skillMeta[skill]
      const minutes = Math.min(budget, needsAdmission ? Math.max(20, Math.min(60, Math.round(budget * .6 / 5) * 5)) : Math.min(75, budget))
      dayTasks.push(task({ title: meta.practice, outcome: meta.outcome, minutes, category: meta.category, skill, milestoneKey: null, route: meta.route, completionMode: 'ASSESSMENT' }))
    }
    let remaining = budget - dayTasks.reduce((sum, item) => sum + item.minutes, 0)
    if (needsAdmission && remaining >= 20) {
      const carryItem = carryover && plannedDay === 0 ? roadmap.find((item) => !assignedMilestones.has(item.key) && carryover.title.includes(item.title)) : null
      const next = carryItem ?? roadmap.find((item) => !assignedMilestones.has(item.key))!
      dayTasks.push(applicationTask(next, Math.min(remaining, 60), Boolean(carryItem)))
      assignedMilestones.add(next.key)
      remaining = budget - dayTasks.reduce((sum, item) => sum + item.minutes, 0)
    }
    if (skill && remaining >= 25) {
      const secondary = skills.length > 1 ? skills[(plannedDay + 1) % skills.length] : skill
      const meta = skillMeta[secondary]
      dayTasks.push(task({ title: `Review ${meta.label} mistakes and retry weak questions`, outcome: 'Write down the error pattern and solve or answer it correctly once.', minutes: Math.min(remaining, urgentExam ? 50 : 35), category: meta.category, skill: secondary, milestoneKey: null, route: meta.route, completionMode: 'MANUAL' }))
      remaining = budget - dayTasks.reduce((sum, item) => sum + item.minutes, 0)
    }
    if (!dayTasks.length && roadmap.length > assignedMilestones.size) {
      const next = roadmap.find((item) => !assignedMilestones.has(item.key))!
      dayTasks.push(applicationTask(next, Math.min(budget, 75)))
      assignedMilestones.add(next.key)
    }
    plannedDay += 1
    return { date, tasks: dayTasks }
  })
  const review: StudyReview = {
    headline: previous ? 'This week responds to your recent work' : 'Your first focused week is ready',
    reasons: availableDays ? reasons : [...reasons, 'Add an available day this week to schedule new tasks.'],
    completed: previous?.completed ?? 0,
    total: previous?.total ?? 0,
    focusSkill,
  }
  return { days, review }
}

export function applyAssessmentEvidence(days: StudyDay[], evidence: SkillEvidence[], timeZone: string): { days: StudyDay[]; changed: boolean } {
  let changed = false
  const updated = days.map((day) => ({
    ...day,
    tasks: day.tasks.map((item) => {
      if (item.status === 'DONE' || item.completionMode !== 'ASSESSMENT' || !item.skill) return item
      const match = evidence.find((row) => row.skill === item.skill && localDate(row.completedAt, timeZone) === day.date)
      if (!match) return item
      changed = true
      return { ...item, status: 'DONE' as const, completedAt: match.completedAt.toISOString() }
    }),
  }))
  return { days: updated, changed }
}
