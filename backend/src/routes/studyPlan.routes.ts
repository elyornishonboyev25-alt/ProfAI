import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  applyAssessmentEvidence,
  buildRoadmap,
  buildWeek,
  localDate,
  normalizeSkill,
  skillKeys,
  studyAnswersSchema,
  weekStartOf,
  type SkillEvidence,
  type StudyAnswers,
  type StudyDay,
} from '../services/studyPlan.service.js'

const router = Router()
router.use(requireAuth)

const json = (value: unknown) => value as Prisma.InputJsonValue

async function loadEvidence(userId: string): Promise<SkillEvidence[]> {
  const since = new Date(Date.now() - 120 * 86_400_000)
  const [assessments, attempts] = await Promise.all([
    prisma.assessmentResult.findMany({
      where: { userId, completedAt: { gte: since } },
      orderBy: { completedAt: 'desc' },
      take: 100,
      select: { id: true, skill: true, examType: true, score: true, maxScore: true, accuracy: true, completedAt: true },
    }),
    prisma.testAttempt.findMany({
      where: { userId, completedAt: { gte: since } },
      orderBy: { completedAt: 'desc' },
      take: 100,
      select: { id: true, percentage: true, completedAt: true, test: { select: { title: true, category: true } } },
    }),
  ])
  const rows: SkillEvidence[] = []
  for (const item of assessments) {
    const skill = normalizeSkill(item.skill, item.examType)
    if (!skill) continue
    const percent = item.accuracy ?? item.score / Math.max(1, item.maxScore) * 100
    rows.push({ id: `assessment:${item.id}`, skill, percent: Math.max(0, Math.min(100, percent)), completedAt: item.completedAt })
  }
  for (const item of attempts) {
    const skill = normalizeSkill(item.test.title, item.test.category)
    if (!skill) continue
    rows.push({ id: `attempt:${item.id}`, skill, percent: Math.max(0, Math.min(100, item.percentage)), completedAt: item.completedAt })
  }
  return rows.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
}

async function loadDefaults(userId: string) {
  const [profile, diagnostic] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId }, select: {
      targetExam: true, currentIeltsScore: true, currentSatScore: true, targetIeltsScore: true, targetSatScore: true, targetCountries: true,
      targetUniversitySlug: true, fieldOfStudy: true, dailyStudyHours: true, examDate: true, timezone: true,
    } }),
    prisma.guestDiagnostic.findFirst({ where: { claimedById: userId, status: 'CLAIMED' }, orderBy: { claimedAt: 'desc' }, select: { answers: true } }),
  ])
  const diagnosticAnswers = diagnostic?.answers && typeof diagnostic.answers === 'object' && !Array.isArray(diagnostic.answers)
    ? diagnostic.answers as Record<string, unknown> : {}
  const diagnosticDestinations = Array.isArray(diagnosticAnswers.destinations)
    ? diagnosticAnswers.destinations.filter((value): value is string => typeof value === 'string') : []
  return {
    universities: profile?.targetUniversitySlug ? [profile.targetUniversitySlug] : [],
    destinationCountry: profile?.targetCountries[0] ?? diagnosticDestinations[0] ?? '',
    intendedMajor: profile?.fieldOfStudy ?? (typeof diagnosticAnswers.intendedMajor === 'string' ? diagnosticAnswers.intendedMajor : ''),
    intakeYear: typeof diagnosticAnswers.intakeYear === 'number' ? diagnosticAnswers.intakeYear : new Date().getUTCFullYear() + 1,
    examTrack: ['IELTS', 'SAT', 'BOTH'].includes(profile?.targetExam ?? '') ? profile?.targetExam : (['IELTS', 'SAT', 'BOTH'].includes(String(diagnosticAnswers.testPlan)) ? diagnosticAnswers.testPlan : 'UNSURE'),
    targetIeltsScore: profile?.targetIeltsScore ?? (typeof diagnosticAnswers.targetIeltsScore === 'number' ? diagnosticAnswers.targetIeltsScore : null),
    targetSatScore: profile?.targetSatScore ?? (typeof diagnosticAnswers.targetSatScore === 'number' ? diagnosticAnswers.targetSatScore : null),
    currentIeltsScore: profile?.currentIeltsScore ?? (typeof diagnosticAnswers.currentIeltsScore === 'number' ? diagnosticAnswers.currentIeltsScore : null),
    currentSatScore: profile?.currentSatScore ?? (typeof diagnosticAnswers.currentSatScore === 'number' ? diagnosticAnswers.currentSatScore : null),
    dailyStudyHours: profile?.dailyStudyHours ?? 1,
    timeZone: profile?.timezone ?? 'Asia/Tashkent',
  }
}

async function loadPlan(userId: string) {
  return prisma.studyPlan.findUnique({
    where: { userId },
    include: { weeks: { orderBy: { weekStart: 'desc' }, take: 12 } },
  })
}

async function currentState(userId: string) {
  const [defaults, evidence] = await Promise.all([loadDefaults(userId), loadEvidence(userId)])
  const today = localDate(new Date(), defaults.timeZone)
  const weekStart = weekStartOf(today)
  let plan = await loadPlan(userId)
  if (plan) {
    const latest = plan.weeks[0]
    let latestDays = latest?.days as StudyDay[] | undefined
    let changedWeeks = false
    for (const savedWeek of plan.weeks) {
      const synced = applyAssessmentEvidence(savedWeek.days as StudyDay[], evidence, defaults.timeZone)
      if (!synced.changed) continue
      await prisma.studyPlanWeek.update({ where: { id: savedWeek.id }, data: { days: json(synced.days) } })
      if (savedWeek.id === latest?.id) latestDays = synced.days
      changedWeeks = true
    }
    if (changedWeeks) plan = (await loadPlan(userId))!
    if (!plan.weeks.some((item) => item.weekStart === weekStart)) {
      const answers = studyAnswersSchema.parse(plan.answers)
      const generated = buildWeek(answers, evidence, weekStart, today, latestDays ?? null)
      await prisma.studyPlanWeek.createMany({
        data: [{ planId: plan.id, weekStart, days: json(generated.days), review: json(generated.review) }],
        skipDuplicates: true,
      })
      plan = await loadPlan(userId)
    }
  }
  const scores = [...new Set(evidence.map((item) => item.skill))].map((skill) => {
    const results = evidence.filter((item) => item.skill === skill).slice(0, 4)
    return { skill, attempts: results.length, accuracy: Math.round(results.reduce((sum, item) => sum + item.percent, 0) / results.length) }
  })
  return {
    today,
    defaults,
    evidence: scores,
    plan: plan ? {
      id: plan.id,
      answers: plan.answers,
      roadmap: plan.roadmap,
      currentWeek: plan.weeks.find((item) => item.weekStart === weekStart) ?? null,
      history: plan.weeks.filter((item) => item.weekStart !== weekStart).slice(0, 8).map((item) => ({ id: item.id, weekStart: item.weekStart, days: item.days })),
      updatedAt: plan.updatedAt,
    } : null,
  }
}

router.get('/', asyncHandler(async (req, res) => res.json(await currentState(req.user!.id))))

// Some IELTS and SAT experiences save attempts in the browser. Import their
// bounded summaries into the account ledger once, keyed by source and skill.
const localEvidenceSchema = z.object({ entries: z.array(z.object({
  sourceKey: z.string().min(1).max(160),
  skill: z.enum(skillKeys),
  title: z.string().min(1).max(180),
  accuracy: z.number().min(0).max(100),
  completedAt: z.string().datetime(),
})).max(60) })
router.post('/evidence', validateBody(localEvidenceSchema), asyncHandler(async (req, res) => {
  const entries = (req.body as z.infer<typeof localEvidenceSchema>).entries
  const now = Date.now()
  const valid = entries.filter((item) => {
    const at = Date.parse(item.completedAt)
    return at >= now - 120 * 86_400_000 && at <= now + 86_400_000
  })
  if (valid.length) await prisma.assessmentResult.createMany({
    data: valid.map((item) => ({
      userId: req.user!.id,
      examType: item.skill.startsWith('SAT') ? 'SAT' : 'IELTS',
      skill: item.skill,
      sourceType: 'STUDY_PLAN_LOCAL',
      sourceKey: `study:${item.sourceKey}:${item.skill}`.slice(0, 180),
      title: item.title,
      score: item.accuracy,
      maxScore: 100,
      accuracy: item.accuracy,
      completedAt: new Date(item.completedAt),
    })),
    skipDuplicates: true,
  })
  return res.json({ imported: valid.length })
}))

router.put('/', validateBody(studyAnswersSchema), asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const answers = req.body as StudyAnswers
  const defaults = await loadDefaults(userId)
  const today = localDate(new Date(), defaults.timeZone)
  const weekStart = weekStartOf(today)
  const evidence = await loadEvidence(userId)
  const roadmap = buildRoadmap(answers)
  const targetExam = ['IELTS', 'SAT', 'BOTH'].includes(answers.examTrack) ? answers.examTrack : null
  const availableDays = answers.weeklyAvailability.filter((minutes) => minutes > 0)
  const dailyStudyHours = Math.max(1, Math.round(availableDays.reduce((sum, minutes) => sum + minutes, 0) / Math.max(1, availableDays.length) / 60))
  const examDate = [
    ['IELTS', 'BOTH'].includes(answers.examTrack) ? answers.ieltsExamDate : null,
    ['SAT', 'BOTH'].includes(answers.examTrack) ? answers.satExamDate : null,
  ].filter((value): value is string => Boolean(value)).sort()[0] ?? null
  const profileValues = {
    targetExam,
    targetIeltsScore: ['IELTS', 'BOTH'].includes(answers.examTrack) ? answers.targetIeltsScore : null,
    targetSatScore: ['SAT', 'BOTH'].includes(answers.examTrack) ? answers.targetSatScore : null,
    currentIeltsScore: ['IELTS', 'BOTH'].includes(answers.examTrack) ? answers.currentIeltsScore : null,
    currentSatScore: ['SAT', 'BOTH'].includes(answers.examTrack) ? answers.currentSatScore : null,
    fieldOfStudy: answers.intendedMajor || null,
    dailyStudyHours,
    examDate,
    ...(answers.destinationCountry ? { targetCountries: [answers.destinationCountry] } : {}),
  }
  const [plan] = await prisma.$transaction([
    prisma.studyPlan.upsert({
      where: { userId },
      create: { userId, answers: json(answers), roadmap: json(roadmap) },
      update: { answers: json(answers), roadmap: json(roadmap) },
      include: { weeks: { orderBy: { weekStart: 'desc' }, take: 2 } },
    }),
    prisma.userProfile.upsert({ where: { userId }, update: profileValues, create: { userId, ...profileValues } }),
  ])
  const oldCurrent = plan.weeks.find((item) => item.weekStart === weekStart)
  const previous = plan.weeks.find((item) => item.weekStart !== weekStart)
  const generated = buildWeek(answers, evidence, weekStart, today, previous?.days as StudyDay[] | undefined ?? null)
  if (oldCurrent) {
    const oldDays = oldCurrent.days as StudyDay[]
    generated.days = generated.days.map((day, index) => day.date <= today ? oldDays[index] ?? day : day)
  }
  await prisma.studyPlanWeek.upsert({
    where: { planId_weekStart: { planId: plan.id, weekStart } },
    create: { planId: plan.id, weekStart, days: json(generated.days), review: json(generated.review) },
    update: { days: json(generated.days), review: json(generated.review) },
  })
  return res.json(await currentState(userId))
}))

router.patch('/tasks/:taskId', validateBody(z.object({ completed: z.boolean() })), asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const plan = await loadPlan(userId)
  if (!plan) return res.status(404).json({ message: 'Create a study plan first.' })
  const week = plan.weeks.find((item) => (item.days as StudyDay[]).some((day) => day.tasks.some((task) => task.id === req.params.taskId)))
  if (!week) return res.status(404).json({ message: 'Task not found.' })
  const days = week.days as StudyDay[]
  const found = days.flatMap((day) => day.tasks).find((task) => task.id === req.params.taskId)
  if (found?.completionMode !== 'MANUAL') return res.status(400).json({ message: 'This task is completed by a submitted assessment result.' })
  const completed = req.body.completed as boolean
  const nextDays = days.map((day) => ({ ...day, tasks: day.tasks.map((item) => item.id === req.params.taskId
    ? { ...item, status: completed ? 'DONE' as const : 'TODO' as const, completedAt: completed ? new Date().toISOString() : null }
    : item) }))
  await prisma.studyPlanWeek.update({ where: { id: week.id }, data: { days: json(nextDays) } })
  if (found.milestoneKey && found.milestoneKey !== 'submit') {
    const answers = studyAnswersSchema.parse(plan.answers)
    const key = found.milestoneKey as keyof StudyAnswers['applicationProgress']
    if (completed && key in answers.applicationProgress && answers.applicationProgress[key] === 'NOT_STARTED') {
      answers.applicationProgress[key] = 'IN_PROGRESS'
      await prisma.studyPlan.update({ where: { id: plan.id }, data: { answers: json(answers), roadmap: json(buildRoadmap(answers)) } })
    }
  }
  return res.json(await currentState(userId))
}))

const milestoneStatusSchema = z.object({ status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']) })
const milestoneKeySchema = z.enum(['shortlist', 'transcripts', 'essay', 'recommendations', 'activities', 'funding'])
router.patch('/milestones/:key', validateBody(milestoneStatusSchema), asyncHandler(async (req, res) => {
  const key = milestoneKeySchema.parse(req.params.key)
  const userId = req.user!.id
  const plan = await loadPlan(userId)
  if (!plan) return res.status(404).json({ message: 'Create a study plan first.' })
  const answers = studyAnswersSchema.parse(plan.answers)
  answers.applicationProgress[key] = (req.body as z.infer<typeof milestoneStatusSchema>).status
  const defaults = await loadDefaults(userId)
  const today = localDate(new Date(), defaults.timeZone)
  const currentWeek = plan.weeks.find((week) => week.weekStart === weekStartOf(today))
  await prisma.studyPlan.update({ where: { id: plan.id }, data: { answers: json(answers), roadmap: json(buildRoadmap(answers)) } })
  if (currentWeek && answers.applicationProgress[key] === 'DONE') {
    const days = (currentWeek.days as StudyDay[]).map((day) => day.date < today ? day : {
      ...day,
      tasks: day.tasks.filter((task) => task.milestoneKey !== key || task.status === 'DONE'),
    })
    await prisma.studyPlanWeek.update({ where: { id: currentWeek.id }, data: { days: json(days) } })
  }
  return res.json(await currentState(userId))
}))

export default router
