import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { applyEvidence, buildExamWeek, examAnswersSchema, examSkills, localDate, summarize, weekStartOf, type ExamAnswers, type ExamDay, type ExamEvidence, type ExamWeekReview, type StudyMedia } from '../services/examStudyPlan.service.js'

const router = Router()
router.use(requireAuth)
const json = (value: unknown) => value as Prisma.InputJsonValue
const weekDays = (value: unknown): ExamDay[] => Array.isArray(value) ? value as ExamDay[] : []

async function defaultsFor(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { targetExam: true, currentIeltsScore: true, currentSatScore: true, targetIeltsScore: true, targetSatScore: true, dailyStudyHours: true, timezone: true, examDate: true } })
  const track = profile?.targetExam === 'SAT' || profile?.targetExam === 'BOTH' ? profile.targetExam : 'IELTS'
  const minutes = Math.max(30, Math.min(360, Math.round((profile?.dailyStudyHours ?? 1) * 60)))
  return {
    examTrack: track,
    ieltsExamDate: track !== 'SAT' && profile?.examDate ? profile.examDate.slice(0, 10) : null,
    satExamDate: track !== 'IELTS' && profile?.examDate ? profile.examDate.slice(0, 10) : null,
    currentIeltsScore: profile?.currentIeltsScore ?? null,
    currentSatScore: profile?.currentSatScore ?? null,
    targetIeltsScore: profile?.targetIeltsScore ?? 7.5,
    targetSatScore: profile?.targetSatScore ?? 1450,
    weeklyAvailability: [minutes, minutes, minutes, minutes, minutes, Math.min(360, minutes + 30), 0],
    timeZone: profile?.timezone ?? 'Asia/Tashkent',
  }
}

function inferContentKey(item: { sourceType: string; sourceKey: string; title: string; skill: string; breakdown: unknown }): string | null {
  const breakdown = item.breakdown && typeof item.breakdown === 'object' && !Array.isArray(item.breakdown) ? item.breakdown as Record<string, unknown> : {}
  if (typeof breakdown.contentKey === 'string') return breakdown.contentKey
  if (item.sourceType === 'SAT_BLUEBOOK_MOCK') {
    const match = item.title.match(/Practice Test (\d+)/i)
    if (match && item.skill === 'SAT_OVERALL') return `sat:full:${Number(match[1])}`
    const section = item.skill === 'SAT_MATH' ? 'math' : item.skill === 'SAT_READING_WRITING' ? 'reading-writing' : null
    if (match && section) return `sat:${section}:${Number(match[1])}`
  }
  if (item.sourceType === 'IELTS_WRITING_AI_EVALUATION') {
    const match = item.sourceKey.match(/^writing-(.+)-\d{13}$/)
    if (match) return `ielts:writing:${match[1]}`
  }
  return null
}

async function evidenceFor(userId: string): Promise<ExamEvidence[]> {
  const [rows, attempts] = await Promise.all([
    prisma.assessmentResult.findMany({ where: { userId }, orderBy: { completedAt: 'desc' }, take: 1000, select: { id: true, sourceType: true, sourceKey: true, title: true, skill: true, score: true, maxScore: true, accuracy: true, completedAt: true, breakdown: true } }),
    prisma.testAttempt.findMany({ where: { userId, test: { category: 'IELTS' } }, orderBy: { completedAt: 'desc' }, take: 1000, select: { id: true, percentage: true, completedAt: true, test: { select: { description: true } } } }),
  ])
  const result: ExamEvidence[] = rows.flatMap(row => {
    if (!examSkills.includes(row.skill as typeof examSkills[number])) return []
    const breakdown = row.breakdown && typeof row.breakdown === 'object' && !Array.isArray(row.breakdown) ? row.breakdown as Record<string, unknown> : {}
    const skills = Array.isArray(breakdown.skills) ? breakdown.skills.filter((item): item is { skill: string; correct: number; total: number } => Boolean(item && typeof item === 'object' && typeof item.skill === 'string' && typeof item.correct === 'number' && typeof item.total === 'number')) : undefined
    return [{ id: row.id, contentKey: inferContentKey(row), skill: row.skill as typeof examSkills[number], percent: row.accuracy ?? row.score / Math.max(1, row.maxScore) * 100, completedAt: row.completedAt, skills }]
  })
  for (const attempt of attempts) {
    const match = attempt.test.description?.match(/Synced IELTS (Reading|Listening) attempt \(([^)]+)\)/i)
    if (!match) continue
    const listening = match[1].toLowerCase() === 'listening'
    const contentKey = `ielts:${listening ? 'listening' : 'reading'}:${match[2]}`
    if (result.some(row => row.contentKey === contentKey && Math.abs(row.completedAt.getTime() - attempt.completedAt.getTime()) < 60_000)) continue
    result.push({ id: `attempt:${attempt.id}`, contentKey, skill: listening ? 'IELTS_LISTENING' : 'IELTS_READING', percent: attempt.percentage, completedAt: attempt.completedAt })
  }
  return result.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
}

async function loadPlan(userId: string) {
  return prisma.studyPlan.findUnique({ where: { userId }, include: { weeks: { orderBy: { weekStart: 'desc' } } } })
}

async function mediaFor(): Promise<StudyMedia> {
  const [shadowing, podcasts] = await Promise.all([
    prisma.shadowingVideo.findMany({ where: { language: 'en' }, orderBy: { createdAt: 'asc' }, take: 100, select: { youtubeId: true, title: true, durationSec: true } }),
    prisma.podcastVideo.findMany({ where: { language: 'en' }, orderBy: { createdAt: 'asc' }, take: 100, select: { youtubeId: true, title: true, durationSec: true } }),
  ])
  return { shadowing, podcasts }
}

async function currentState(userId: string) {
  const [defaults, evidence, media] = await Promise.all([defaultsFor(userId), evidenceFor(userId), mediaFor()])
  const today = localDate(new Date(), defaults.timeZone)
  const start = weekStartOf(today)
  let plan = await loadPlan(userId)
  if (plan) {
    let answers = examAnswersSchema.safeParse(plan.answers)
    if (!answers.success || (plan.roadmap as { version?: number } | null)?.version !== 2) {
      const legacy = plan.answers as Record<string, unknown>
      const migrated = examAnswersSchema.parse({
        ...defaults,
        ...legacy,
        examTrack: ['IELTS', 'SAT', 'BOTH'].includes(String(legacy.examTrack)) ? legacy.examTrack : defaults.examTrack,
        targetIeltsScore: typeof legacy.targetIeltsScore === 'number' ? legacy.targetIeltsScore : defaults.targetIeltsScore,
        targetSatScore: typeof legacy.targetSatScore === 'number' ? legacy.targetSatScore : defaults.targetSatScore,
      })
      const current = plan.weeks.find(week => week.weekStart === start)
      const previousMarker = plan.roadmap && typeof plan.roadmap === 'object' && !Array.isArray(plan.roadmap) ? plan.roadmap as Record<string, unknown> : {}
      const legacyCurrentWeek = previousMarker.legacyCurrentWeek ?? (current ? { weekStart: start, days: current.days, review: current.review } : undefined)
      await prisma.studyPlan.update({ where: { id: plan.id }, data: { answers: json(migrated), roadmap: json({ version: 2, ...(legacyCurrentWeek ? { legacyCurrentWeek } : {}) }) } })
      if (current) await prisma.studyPlanWeek.delete({ where: { id: current.id } })
      answers = { success: true, data: migrated } as typeof answers
      plan = await loadPlan(userId)
    }
    const parsed = answers.data as ExamAnswers
    const weeks = plan!.weeks
    for (const week of weeks) {
      if (week.weekStart !== start && (week.review as { asOf?: string } | null)?.asOf === undefined) continue
      const synced = applyEvidence(weekDays(week.days), evidence, defaults.timeZone)
      if (synced.changed) await prisma.studyPlanWeek.update({ where: { id: week.id }, data: { days: json(synced.days) } })
    }
    plan = await loadPlan(userId)
    const current = plan!.weeks.find(week => week.weekStart === start)
    const previousDays = plan!.weeks.filter(week => week.weekStart < start && (week.review as { asOf?: string } | null)?.asOf).flatMap(week => weekDays(week.days))
    if (!current || (current.review as unknown as ExamWeekReview).asOf !== today) {
      const built = buildExamWeek(parsed, evidence, start, today, previousDays.length ? previousDays : null, current ? weekDays(current.days) : [], media)
      await prisma.studyPlanWeek.upsert({ where: { planId_weekStart: { planId: plan!.id, weekStart: start } }, create: { planId: plan!.id, weekStart: start, days: json(built.days), review: json(built.review) }, update: { days: json(built.days), review: json(built.review) } })
      plan = await loadPlan(userId)
    }
  }
  const current = plan?.weeks.find(week => week.weekStart === start)
  const history = plan?.weeks.filter(week => week.weekStart < start).map(week => ({ id: week.id, weekStart: week.weekStart, days: week.days, legacy: !(week.review as { asOf?: string } | null)?.asOf })) ?? []
  const summary = current ? summarize(weekDays(current.days).filter(day => day.date <= today)) : { completed: 0, total: 0 }
  return { today, timeZone: defaults.timeZone, defaults, evidence: examSkills.map(skill => { const rows = evidence.filter(row => row.skill === skill).slice(0, 4); return { skill, attempts: rows.length, accuracy: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length) : null } }), plan: plan ? { id: plan.id, answers: plan.answers, currentWeek: current ? { id: current.id, weekStart: current.weekStart, days: weekDays(current.days).filter(day => day.date <= today), review: current.review } : null, history, summary, updatedAt: plan.updatedAt } : null }
}

router.get('/', asyncHandler(async (req, res) => res.json(await currentState(req.user!.id))))

const exactEvidenceSchema = z.object({ entries: z.array(z.object({
  sourceKey: z.string().min(1).max(150), contentKey: z.string().min(1).max(160), skill: z.enum(examSkills), title: z.string().min(1).max(180), accuracy: z.number().min(0).max(100), completedAt: z.string().datetime(), skills: z.array(z.object({ skill: z.string().min(1).max(100), correct: z.number().int().min(0), total: z.number().int().min(1) })).max(30).optional(),
})).max(100) })
router.post('/evidence', validateBody(exactEvidenceSchema), asyncHandler(async (req, res) => {
  const entries = (req.body as z.infer<typeof exactEvidenceSchema>).entries
  const now = Date.now()
  const valid = entries.filter(item => { const at = Date.parse(item.completedAt); return at <= now + 86_400_000 && at >= now - 3 * 365 * 86_400_000 })
  if (valid.length) await prisma.assessmentResult.createMany({ data: valid.map(item => ({ userId: req.user!.id, sourceType: 'STUDY_PLAN_EXACT', sourceKey: `study-exact:${item.sourceKey}`.slice(0, 180), examType: item.skill.startsWith('SAT') ? 'SAT' : 'IELTS', skill: item.skill, title: item.title, score: item.accuracy, maxScore: 100, accuracy: item.accuracy, completedAt: new Date(item.completedAt), breakdown: json({ contentKey: item.contentKey, skills: item.skills ?? [] }) })), skipDuplicates: true })
  res.json({ imported: valid.length })
}))

router.put('/', validateBody(examAnswersSchema), asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const answers = req.body as ExamAnswers
  const defaults = await defaultsFor(userId)
  const today = localDate(new Date(), defaults.timeZone)
  const start = weekStartOf(today)
  const [evidence, media] = await Promise.all([evidenceFor(userId), mediaFor()])
  const previousPlan = await loadPlan(userId)
  const marker = previousPlan?.roadmap && typeof previousPlan.roadmap === 'object' && !Array.isArray(previousPlan.roadmap) ? previousPlan.roadmap as Record<string, unknown> : {}
  const oldCurrent = previousPlan?.weeks.find(week => week.weekStart === start)
  const legacyCurrentWeek = marker.legacyCurrentWeek ?? (marker.version !== 2 && oldCurrent ? { weekStart: start, days: oldCurrent.days, review: oldCurrent.review } : undefined)
  const roadmap = { version: 2, ...(legacyCurrentWeek ? { legacyCurrentWeek } : {}) }
  const plan = await prisma.studyPlan.upsert({ where: { userId }, create: { userId, answers: json(answers), roadmap: json(roadmap) }, update: { answers: json(answers), roadmap: json(roadmap) }, include: { weeks: { orderBy: { weekStart: 'desc' } } } })
  const current = plan.weeks.find(week => week.weekStart === start)
  const previousDays = plan.weeks.filter(week => week.weekStart < start && (week.review as { asOf?: string } | null)?.asOf).flatMap(week => weekDays(week.days))
  const built = buildExamWeek(answers, evidence, start, today, previousDays.length ? previousDays : null, current ? weekDays(current.days) : [], media)
  if (current) {
    const oldToday = weekDays(current.days).find(day => day.date === today)
    if (oldToday && marker.version === 2 && examAnswersSchema.safeParse(previousPlan?.answers).success && (previousPlan?.answers as ExamAnswers).examTrack === answers.examTrack) built.days = built.days.map(day => day.date === today ? oldToday : day)
  }
  await prisma.studyPlanWeek.upsert({ where: { planId_weekStart: { planId: plan.id, weekStart: start } }, create: { planId: plan.id, weekStart: start, days: json(built.days), review: json(built.review) }, update: { days: json(built.days), review: json(built.review) } })
  await prisma.userProfile.upsert({ where: { userId }, update: { targetExam: answers.examTrack, targetIeltsScore: answers.targetIeltsScore, targetSatScore: answers.targetSatScore, currentIeltsScore: answers.currentIeltsScore, currentSatScore: answers.currentSatScore, dailyStudyHours: Math.max(1, Math.round(answers.weeklyAvailability.filter(Boolean).reduce((a, b) => a + b, 0) / Math.max(1, answers.weeklyAvailability.filter(Boolean).length) / 60)), examDate: [answers.ieltsExamDate, answers.satExamDate].filter((value): value is string => Boolean(value)).sort()[0] ?? null }, create: { userId, targetExam: answers.examTrack, targetIeltsScore: answers.targetIeltsScore, targetSatScore: answers.targetSatScore, currentIeltsScore: answers.currentIeltsScore, currentSatScore: answers.currentSatScore, dailyStudyHours: 1 } })
  res.json(await currentState(userId))
}))

router.patch('/tasks/:taskId', validateBody(z.object({ completed: z.boolean() })), asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const state = await currentState(userId)
  if (!state.plan?.currentWeek) return res.status(404).json({ message: 'Create a study plan first.' })
  const plan = await loadPlan(userId)
  const week = plan?.weeks.find(item => item.id === state.plan?.currentWeek?.id)
  if (!week) return res.status(404).json({ message: 'Current week not found.' })
  const days = weekDays(week.days)
  const day = days.find(item => item.tasks.some(task => task.id === req.params.taskId))
  const task = day?.tasks.find(item => item.id === req.params.taskId)
  if (!task) return res.status(404).json({ message: 'Task not found.' })
  if (day?.date !== state.today) return res.status(400).json({ message: 'Only today’s checklist can be changed.' })
  if (task.completionMode !== 'MANUAL') return res.status(400).json({ message: 'Submit the matching test to complete this task.' })
  const sameDayPractice = task.reviewOf ? day.tasks.find(item => item.contentKey === task.reviewOf) : null
  if (sameDayPractice && sameDayPractice.status !== 'DONE') return res.status(400).json({ message: 'Finish the practice before marking its analysis done.' })
  const completed = req.body.completed as boolean
  const changed = days.map(item => ({ ...item, tasks: item.tasks.map(entry => entry.id === task.id ? { ...entry, status: completed ? 'DONE' as const : 'TODO' as const, completedAt: completed ? new Date().toISOString() : null } : entry) }))
  await prisma.studyPlanWeek.update({ where: { id: week.id }, data: { days: json(changed) } })
  res.json(await currentState(userId))
}))

export default router
