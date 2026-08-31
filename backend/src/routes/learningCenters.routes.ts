import crypto from 'crypto'
import {
  LearningAssignmentKind,
  LearningCenterExamTrack,
  LearningCenterMemberStatus,
  LearningCenterRole,
  LearningSubmissionStatus,
  Prisma,
  TestCategory,
} from '@prisma/client'
import { Router, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { generateAiText } from '../services/aiProvider.service.js'
import {
  average,
  buildDataDrivenInsight,
  normalizeTestAttempt,
  round,
  summarizeStudent,
  type CenterStudentIdentity,
  type LearningResultPoint,
  type StudentProgressSummary,
} from '../services/learningCenterAnalytics.service.js'

const router = Router()

const STAFF_ROLES: LearningCenterRole[] = [
  LearningCenterRole.OWNER,
  LearningCenterRole.ADMIN,
  LearningCenterRole.TEACHER,
]
const MANAGER_ROLES: LearningCenterRole[] = [LearningCenterRole.OWNER, LearningCenterRole.ADMIN]

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(3).max(120),
  city: z.string().trim().max(100).optional(),
  timezone: z.string().trim().min(3).max(80).default('Asia/Tashkent'),
})

const resultSyncSchema = z.object({
  sourceKey: z.string().trim().min(6).max(180),
  sourceType: z.string().trim().min(2).max(60),
  examType: z.nativeEnum(TestCategory),
  skill: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(220),
  score: z.coerce.number().min(0).max(2000),
  maxScore: z.coerce.number().positive().max(2000),
  accuracy: z.coerce.number().min(0).max(100).nullable().optional(),
  durationSec: z.coerce.number().int().min(0).max(8 * 60 * 60).default(0),
  completedAt: z.string().datetime().optional(),
  breakdown: z.record(z.unknown()).optional(),
  assignmentId: z.string().trim().min(1).max(191).optional(),
})

const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  examTrack: z.nativeEnum(LearningCenterExamTrack),
  teacherId: z.string().trim().min(1).max(191).nullable().optional(),
  targetScore: z.string().trim().max(40).optional(),
  schedule: z.string().trim().max(140).optional(),
})

const invitationSchema = z.object({
  email: z.string().trim().email().max(220).optional(),
  role: z.nativeEnum(LearningCenterRole).refine((role) => role !== LearningCenterRole.OWNER, {
    message: 'Owner invitations are not supported.',
  }),
  groupId: z.string().trim().min(1).max(191).optional(),
  title: z.string().trim().max(100).optional(),
})

const assignmentSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(1000).optional(),
  kind: z.nativeEnum(LearningAssignmentKind),
  examTrack: z.nativeEnum(LearningCenterExamTrack),
  routePath: z.string().trim().startsWith('/').max(300),
  targetScore: z.string().trim().max(40).optional(),
  dueAt: z.string().datetime(),
  groupId: z.string().trim().min(1).max(191).optional(),
  studentId: z.string().trim().min(1).max(191).optional(),
}).refine((input) => Boolean(input.groupId) !== Boolean(input.studentId), {
  message: 'Choose exactly one assignment audience: a group or one student.',
})

const submissionSchema = z.object({
  status: z.nativeEnum(LearningSubmissionStatus),
  progress: z.coerce.number().int().min(0).max(100),
})

const noteSchema = z.object({ note: z.string().trim().min(2).max(2000) })

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  groupId: z.string().trim().max(191).optional(),
  exam: z.enum(['IELTS', 'SAT', 'BOTH']).optional(),
  status: z.enum(['ON_TRACK', 'WATCH', 'NEEDS_ATTENTION']).optional(),
  days: z.coerce.number().int().min(7).max(365).default(90),
})

type CenterAccess = Awaited<ReturnType<typeof findCenterAccess>>

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'learning-center'
}

async function uniqueSlug(name: string) {
  const base = slugify(name)
  const existing = await prisma.learningCenter.findUnique({ where: { slug: base }, select: { id: true } })
  if (!existing) return base
  return `${base}-${crypto.randomBytes(3).toString('hex')}`
}

function inviteCode() {
  return crypto.randomBytes(6).toString('base64url').toUpperCase()
}

async function findCenterAccess(slug: string, userId: string) {
  return prisma.learningCenterMember.findFirst({
    where: {
      userId,
      status: LearningCenterMemberStatus.ACTIVE,
      center: { slug },
    },
    include: {
      center: true,
      groups: { select: { groupId: true } },
    },
  })
}

async function requireCenterAccess(
  res: Response,
  slug: string,
  userId: string,
  roles?: LearningCenterRole[],
): Promise<NonNullable<CenterAccess> | null> {
  const membership = await findCenterAccess(slug, userId)
  if (!membership) {
    res.status(404).json({ message: 'Learning center workspace not found.' })
    return null
  }
  if (roles && !roles.includes(membership.role)) {
    res.status(403).json({ message: 'You do not have permission to perform this workspace action.' })
    return null
  }
  return membership
}

async function studentScope(access: NonNullable<CenterAccess>) {
  if (access.role === LearningCenterRole.OWNER || access.role === LearningCenterRole.ADMIN) {
    const members = await prisma.learningCenterMember.findMany({
      where: { centerId: access.centerId, role: LearningCenterRole.STUDENT, status: LearningCenterMemberStatus.ACTIVE },
      select: { userId: true },
    })
    return members.map((member) => member.userId)
  }
  if (access.role === LearningCenterRole.STUDENT) return [access.userId]
  const members = await prisma.learningCenterGroupMember.findMany({
    where: {
      group: { centerId: access.centerId, teacherId: access.userId, archivedAt: null },
      member: { role: LearningCenterRole.STUDENT, status: LearningCenterMemberStatus.ACTIVE },
    },
    select: { member: { select: { userId: true } } },
  })
  return [...new Set(members.map((entry) => entry.member.userId))]
}

async function loadStudentIdentities(centerId: string, studentIds: string[]) {
  if (!studentIds.length) return []
  return prisma.user.findMany({
    where: {
      id: { in: studentIds },
      learningCenterMemberships: {
        some: { centerId, role: LearningCenterRole.STUDENT, status: LearningCenterMemberStatus.ACTIVE },
      },
    },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      avatarUrl: true,
      currentStreak: true,
      profile: {
        select: {
          targetExam: true,
          targetScore: true,
          currentIeltsScore: true,
          targetIeltsScore: true,
          currentSatScore: true,
          targetSatScore: true,
        },
      },
    },
  })
}

async function loadResults(studentIds: string[], since?: Date) {
  const byStudent = new Map<string, LearningResultPoint[]>()
  for (const id of studentIds) byStudent.set(id, [])
  if (!studentIds.length) return byStudent

  const [attempts, assessments, speakingSessions] = await Promise.all([
    prisma.testAttempt.findMany({
      where: { userId: { in: studentIds }, ...(since ? { completedAt: { gte: since } } : {}) },
      orderBy: { completedAt: 'asc' },
      select: {
        id: true,
        userId: true,
        finalScore: true,
        percentage: true,
        timeSpentSec: true,
        completedAt: true,
        test: { select: { title: true, category: true, subjects: true } },
      },
    }),
    prisma.assessmentResult.findMany({
      where: { userId: { in: studentIds }, ...(since ? { completedAt: { gte: since } } : {}) },
      orderBy: { completedAt: 'asc' },
    }),
    prisma.speakingSession.findMany({
      where: { userId: { in: studentIds }, ...(since ? { createdAt: { gte: since } } : {}) },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  for (const attempt of attempts) byStudent.get(attempt.userId)?.push(normalizeTestAttempt(attempt))
  for (const result of assessments) {
    byStudent.get(result.userId)?.push({
      id: result.id,
      examType: result.examType,
      skill: result.skill,
      title: result.title,
      score: result.score,
      maxScore: result.maxScore,
      accuracy: result.accuracy,
      durationSec: result.durationSec,
      completedAt: result.completedAt,
      source: 'ASSESSMENT_RESULT',
      breakdown: result.breakdown,
    })
  }
  for (const session of speakingSessions) {
    byStudent.get(session.userId)?.push({
      id: session.id,
      examType: TestCategory.IELTS,
      skill: 'IELTS_SPEAKING',
      title: session.modeLabel,
      score: session.overallBand,
      maxScore: 9,
      accuracy: null,
      durationSec: session.durationSec,
      completedAt: session.createdAt,
      source: 'SPEAKING_SESSION',
      breakdown: {
        fluency: session.fluencyBand,
        lexical: session.lexicalBand,
        grammar: session.grammarBand,
        pronunciation: session.pronunciationBand,
      },
    })
  }
  for (const points of byStudent.values()) points.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
  return byStudent
}

async function loadAssignmentStats(centerId: string, studentIds: string[]) {
  const map = new Map<string, { total: number; completed: number }>()
  for (const id of studentIds) map.set(id, { total: 0, completed: 0 })
  if (!studentIds.length) return map
  const submissions = await prisma.learningCenterAssignmentSubmission.findMany({
    where: { studentId: { in: studentIds }, assignment: { centerId, archivedAt: null } },
    select: { studentId: true, status: true },
  })
  for (const submission of submissions) {
    const current = map.get(submission.studentId) ?? { total: 0, completed: 0 }
    current.total += 1
    if (submission.status === LearningSubmissionStatus.COMPLETED) current.completed += 1
    map.set(submission.studentId, current)
  }
  return map
}

async function loadStudentSummaries(access: NonNullable<CenterAccess>, days = 90, groupId?: string) {
  let ids = await studentScope(access)
  if (groupId) {
    const groupMembers = await prisma.learningCenterGroupMember.findMany({
      where: { groupId, group: { centerId: access.centerId }, member: { userId: { in: ids } } },
      select: { member: { select: { userId: true } } },
    })
    ids = groupMembers.map((entry) => entry.member.userId)
  }
  const since = new Date(Date.now() - days * 86_400_000)
  const [students, results, assignmentStats] = await Promise.all([
    loadStudentIdentities(access.centerId, ids),
    loadResults(ids, since),
    loadAssignmentStats(access.centerId, ids),
  ])
  const summaries = students.map((student) => summarizeStudent(
    student as CenterStudentIdentity,
    results.get(student.id) ?? [],
    assignmentStats.get(student.id),
  ))
  return { summaries, results, students }
}

function assignmentStatus(submission: { status: LearningSubmissionStatus; assignment: { dueAt: Date } }) {
  if (submission.status === LearningSubmissionStatus.COMPLETED) return 'COMPLETED'
  if (submission.assignment.dueAt.getTime() < Date.now()) return 'OVERDUE'
  return submission.status
}

router.post(
  '/results/sync',
  requireAuth,
  validateBody(resultSyncSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof resultSyncSchema>
    if (payload.score > payload.maxScore) {
      return res.status(400).json({ message: 'Score cannot exceed maximum score.' })
    }
    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date()
    const result = await prisma.assessmentResult.upsert({
      where: { userId_sourceKey: { userId: req.user!.id, sourceKey: payload.sourceKey } },
      update: {
        title: payload.title,
        score: payload.score,
        maxScore: payload.maxScore,
        accuracy: payload.accuracy ?? null,
        durationSec: payload.durationSec,
        breakdown: payload.breakdown as Prisma.InputJsonValue | undefined,
        completedAt,
      },
      create: {
        userId: req.user!.id,
        examType: payload.examType,
        skill: payload.skill,
        sourceType: payload.sourceType,
        sourceKey: payload.sourceKey,
        title: payload.title,
        score: payload.score,
        maxScore: payload.maxScore,
        accuracy: payload.accuracy ?? null,
        durationSec: payload.durationSec,
        breakdown: payload.breakdown as Prisma.InputJsonValue | undefined,
        completedAt,
      },
    })

    if (payload.assignmentId) {
      await prisma.learningCenterAssignmentSubmission.updateMany({
        where: { assignmentId: payload.assignmentId, studentId: req.user!.id },
        data: { resultId: result.id, status: LearningSubmissionStatus.COMPLETED, progress: 100, submittedAt: completedAt },
      })
    }
    return res.status(201).json({ result: { ...result, completedAt: result.completedAt.toISOString() } })
  }),
)

router.get(
  '/workspaces',
  requireAuth,
  asyncHandler(async (req, res) => {
    const memberships = await prisma.learningCenterMember.findMany({
      where: { userId: req.user!.id, status: LearningCenterMemberStatus.ACTIVE },
      orderBy: { joinedAt: 'asc' },
      include: {
        center: {
          include: {
            _count: {
              select: {
                members: { where: { status: LearningCenterMemberStatus.ACTIVE } },
                groups: { where: { archivedAt: null } },
              },
            },
          },
        },
      },
    })
    return res.json({
      workspaces: memberships.map((membership) => ({
        id: membership.center.id,
        name: membership.center.name,
        slug: membership.center.slug,
        logoUrl: membership.center.logoUrl,
        city: membership.center.city,
        role: membership.role,
        memberCount: membership.center._count.members,
        groupCount: membership.center._count.groups,
      })),
    })
  }),
)

router.post(
  '/workspaces',
  requireAuth,
  validateBody(createWorkspaceSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as z.infer<typeof createWorkspaceSchema>
    const slug = await uniqueSlug(payload.name)
    const center = await prisma.learningCenter.create({
      data: {
        name: payload.name,
        slug,
        city: payload.city || null,
        timezone: payload.timezone,
        createdById: req.user!.id,
        members: {
          create: { userId: req.user!.id, role: LearningCenterRole.OWNER, title: 'Center owner' },
        },
      },
    })
    return res.status(201).json({ workspace: center })
  }),
)

router.post(
  '/join/:code',
  requireAuth,
  asyncHandler(async (req, res) => {
    const invitation = await prisma.learningCenterInvitation.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: { center: true },
    })
    if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() < Date.now()) {
      return res.status(404).json({ message: 'This invitation is invalid or has expired.' })
    }
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true } })
    if (invitation.email && user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({ message: 'This invitation was issued to a different email address.' })
    }
    const member = await prisma.$transaction(async (tx) => {
      const joined = await tx.learningCenterMember.upsert({
        where: { centerId_userId: { centerId: invitation.centerId, userId: req.user!.id } },
        update: { role: invitation.role, status: LearningCenterMemberStatus.ACTIVE },
        create: { centerId: invitation.centerId, userId: req.user!.id, role: invitation.role },
      })
      if (invitation.groupId && invitation.role === LearningCenterRole.STUDENT) {
        await tx.learningCenterGroupMember.upsert({
          where: { groupId_memberId: { groupId: invitation.groupId, memberId: joined.id } },
          update: {},
          create: { groupId: invitation.groupId, memberId: joined.id },
        })
      }
      await tx.learningCenterInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } })
      return joined
    })
    return res.json({ workspace: invitation.center, membership: member })
  }),
)

router.get(
  '/:slug/overview',
  requireAuth,
  validateQuery(z.object({ days: z.coerce.number().int().min(7).max(365).default(90) })),
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id)
    if (!access) return
    const days = Number(req.query.days ?? 90)
    const { summaries, results } = await loadStudentSummaries(access, days)
    const scopedGroupWhere: Prisma.LearningCenterGroupWhereInput = {
      centerId: access.centerId,
      archivedAt: null,
      ...(access.role === LearningCenterRole.TEACHER ? { teacherId: access.userId } : {}),
      ...(access.role === LearningCenterRole.STUDENT ? { members: { some: { memberId: access.id } } } : {}),
    }
    const [teacherCount, groupCount, submissions, groups] = await Promise.all([
      MANAGER_ROLES.includes(access.role)
        ? prisma.learningCenterMember.count({
            where: { centerId: access.centerId, role: { in: [LearningCenterRole.TEACHER, LearningCenterRole.ADMIN] }, status: LearningCenterMemberStatus.ACTIVE },
          })
        : Promise.resolve(access.role === LearningCenterRole.TEACHER ? 1 : 0),
      prisma.learningCenterGroup.count({ where: scopedGroupWhere }),
      prisma.learningCenterAssignmentSubmission.findMany({
        where: { assignment: { centerId: access.centerId, archivedAt: null }, studentId: { in: summaries.map((item) => item.id) } },
        include: { assignment: { select: { dueAt: true } } },
      }),
      prisma.learningCenterGroup.findMany({
        where: scopedGroupWhere,
        include: {
          teacher: { select: { id: true, fullName: true, avatarUrl: true } },
          members: { include: { member: { select: { userId: true } } } },
        },
      }),
    ])
    const satStudents = summaries.filter((student) => student.targetExam === 'SAT' || student.targetExam === 'BOTH' || student.currentSat)
    const ieltsStudents = summaries.filter((student) => student.targetExam === 'IELTS' || student.targetExam === 'BOTH' || student.currentIelts)
    const completed = submissions.filter((submission) => submission.status === LearningSubmissionStatus.COMPLETED).length

    const activityMap = new Map<string, { attempts: number; activeStudents: Set<string> }>()
    for (const [studentId, points] of results) {
      for (const point of points) {
        const key = point.completedAt.toISOString().slice(0, 10)
        const bucket = activityMap.get(key) ?? { attempts: 0, activeStudents: new Set<string>() }
        bucket.attempts += 1
        bucket.activeStudents.add(studentId)
        activityMap.set(key, bucket)
      }
    }
    const activity = [...activityMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, attempts: value.attempts, activeStudents: value.activeStudents.size }))

    const teacherPerformance = groups.flatMap((group) => {
      if (!group.teacher) return []
      const studentIds = new Set(group.members.map((member) => member.member.userId))
      const groupStudents = summaries.filter((student) => studentIds.has(student.id))
      return [{
        id: group.teacher.id,
        fullName: group.teacher.fullName,
        avatarUrl: group.teacher.avatarUrl,
        groupName: group.name,
        students: groupStudents.length,
        averageScore: round(average(groupStudents.map((student) => student.averageScore))),
        improving: groupStudents.filter((student) => student.improvement > 0).length,
      }]
    })

    return res.json({
      workspace: {
        id: access.center.id,
        name: access.center.name,
        slug: access.center.slug,
        city: access.center.city,
        logoUrl: access.center.logoUrl,
        role: access.role,
      },
      metrics: {
        totalStudents: summaries.length,
        satStudents: satStudents.length,
        ieltsStudents: ieltsStudents.length,
        activeTeachers: teacherCount,
        groups: groupCount,
        averageSat: Math.round(average(satStudents.map((student) => student.currentSat).filter((score): score is number => score !== null))),
        averageIelts: round(average(ieltsStudents.map((student) => student.currentIelts).filter((score): score is number => score !== null))),
        assignmentsCompleted: submissions.length ? round((completed / submissions.length) * 100) : 0,
        studentsImproving: summaries.length ? round((summaries.filter((student) => student.improvement > 0).length / summaries.length) * 100) : 0,
      },
      activity,
      topImproving: [...summaries].sort((a, b) => b.improvement - a.improvement).slice(0, 5),
      needsAttention: summaries.filter((student) => student.status === 'NEEDS_ATTENTION').sort((a, b) => a.improvement - b.improvement).slice(0, 6),
      recentStudents: [...summaries].sort((a, b) => (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? '')).slice(0, 6),
      assignmentPipeline: {
        assigned: submissions.filter((item) => assignmentStatus(item) === 'ASSIGNED').length,
        inProgress: submissions.filter((item) => assignmentStatus(item) === 'IN_PROGRESS').length,
        completed,
        overdue: submissions.filter((item) => assignmentStatus(item) === 'OVERDUE').length,
      },
      teacherPerformance,
    })
  }),
)

router.get(
  '/:slug/students',
  requireAuth,
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id)
    if (!access) return
    const query = req.query as unknown as z.infer<typeof listQuerySchema>
    const { summaries } = await loadStudentSummaries(access, query.days, query.groupId)
    const search = query.search?.toLowerCase()
    const filtered = summaries.filter((student) => {
      if (search && !`${student.fullName} ${student.nickname ?? ''}`.toLowerCase().includes(search)) return false
      if (query.exam && query.exam !== 'BOTH' && student.targetExam !== query.exam && student.targetExam !== 'BOTH') return false
      if (query.status && student.status !== query.status) return false
      return true
    })
    return res.json({ students: filtered })
  }),
)

router.get(
  '/:slug/students/:studentId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id)
    if (!access) return
    const allowed = await studentScope(access)
    if (!allowed.includes(req.params.studentId)) return res.status(404).json({ message: 'Student not found in your accessible groups.' })
    const [students, resultMap, assignmentStats, groups, assignments, notes] = await Promise.all([
      loadStudentIdentities(access.centerId, [req.params.studentId]),
      loadResults([req.params.studentId]),
      loadAssignmentStats(access.centerId, [req.params.studentId]),
      prisma.learningCenterGroup.findMany({
        where: { centerId: access.centerId, members: { some: { member: { userId: req.params.studentId } } } },
        select: { id: true, name: true, examTrack: true, teacher: { select: { id: true, fullName: true } } },
      }),
      prisma.learningCenterAssignmentSubmission.findMany({
        where: { studentId: req.params.studentId, assignment: { centerId: access.centerId, archivedAt: null } },
        orderBy: { assignment: { dueAt: 'desc' } },
        include: { assignment: { include: { group: { select: { name: true } } } } },
      }),
      STAFF_ROLES.includes(access.role)
        ? prisma.learningCenterTeacherNote.findMany({
            where: { centerId: access.centerId, studentId: req.params.studentId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
          })
        : Promise.resolve([]),
    ])
    const student = students[0]
    if (!student) return res.status(404).json({ message: 'Student not found.' })
    const results = resultMap.get(student.id) ?? []
    const summary = summarizeStudent(student as CenterStudentIdentity, results, assignmentStats.get(student.id))
    return res.json({
      student: summary,
      groups,
      results: [...results].reverse().map((result) => ({ ...result, completedAt: result.completedAt.toISOString() })),
      insight: buildDataDrivenInsight(summary, results),
      assignments: assignments.map((submission) => ({
        id: submission.id,
        assignmentId: submission.assignmentId,
        title: submission.assignment.title,
        description: submission.assignment.description,
        kind: submission.assignment.kind,
        examTrack: submission.assignment.examTrack,
        routePath: submission.assignment.routePath,
        targetScore: submission.assignment.targetScore,
        dueAt: submission.assignment.dueAt.toISOString(),
        groupName: submission.assignment.group?.name ?? null,
        status: assignmentStatus(submission),
        progress: submission.progress,
        submittedAt: submission.submittedAt?.toISOString() ?? null,
      })),
      notes: notes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() })),
    })
  }),
)

router.post(
  '/:slug/students/:studentId/notes',
  requireAuth,
  validateBody(noteSchema),
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id, STAFF_ROLES)
    if (!access) return
    const allowed = await studentScope(access)
    if (!allowed.includes(req.params.studentId)) return res.status(404).json({ message: 'Student not found in your accessible groups.' })
    const note = await prisma.learningCenterTeacherNote.create({
      data: { centerId: access.centerId, studentId: req.params.studentId, authorId: req.user!.id, note: req.body.note },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    })
    return res.status(201).json({ note })
  }),
)

router.post(
  '/:slug/students/:studentId/ai-analysis',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id, STAFF_ROLES)
    if (!access) return
    const allowed = await studentScope(access)
    if (!allowed.includes(req.params.studentId)) return res.status(404).json({ message: 'Student not found in your accessible groups.' })
    const [students, resultMap, assignmentStats] = await Promise.all([
      loadStudentIdentities(access.centerId, [req.params.studentId]),
      loadResults([req.params.studentId]),
      loadAssignmentStats(access.centerId, [req.params.studentId]),
    ])
    const student = students[0]
    if (!student) return res.status(404).json({ message: 'Student not found.' })
    const results = resultMap.get(student.id) ?? []
    const summary = summarizeStudent(student as CenterStudentIdentity, results, assignmentStats.get(student.id))
    const fallback = buildDataDrivenInsight(summary, results)
    try {
      const generated = await generateAiText({
        userId: req.user!.id,
        purpose: 'center_performance_analysis',
        systemPrompt: 'You are ProfAI Learning Center intelligence. Return strict JSON with headline, summary, priorities (2-4 short strings), and tone (positive, neutral, warning). Base every claim only on supplied metrics. Never diagnose personality or invent topics.',
        userMessage: JSON.stringify({ student: { ...summary, id: undefined, fullName: 'Student' }, recentResults: results.slice(-12) }),
        maxOutputTokens: 520,
      })
      const parsed = JSON.parse(generated.text) as { headline?: string; summary?: string; priorities?: string[]; tone?: string }
      if (!parsed.headline || !parsed.summary || !Array.isArray(parsed.priorities)) throw new Error('Invalid AI analysis payload')
      return res.json({ insight: parsed, engine: generated.provider, model: generated.model, fallbackUsed: generated.fallbackUsed })
    } catch {
      return res.json({ insight: fallback, engine: 'data-analysis', model: null, fallbackUsed: true })
    }
  }),
)

router.get(
  '/:slug/groups',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id)
    if (!access) return
    const where: Prisma.LearningCenterGroupWhereInput = {
      centerId: access.centerId,
      archivedAt: null,
      ...(access.role === LearningCenterRole.TEACHER ? { teacherId: access.userId } : {}),
      ...(access.role === LearningCenterRole.STUDENT ? { members: { some: { memberId: access.id } } } : {}),
    }
    const groups = await prisma.learningCenterGroup.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        teacher: { select: { id: true, fullName: true, avatarUrl: true } },
        members: {
          include: { member: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } } },
        },
        _count: { select: { assignments: { where: { archivedAt: null } } } },
      },
    })
    const allIds = [...new Set(groups.flatMap((group) => group.members.map((entry) => entry.member.userId)))]
    const [students, resultMap, assignmentStats] = await Promise.all([
      loadStudentIdentities(access.centerId, allIds),
      loadResults(allIds, new Date(Date.now() - 90 * 86_400_000)),
      loadAssignmentStats(access.centerId, allIds),
    ])
    const summaryMap = new Map(students.map((student) => [student.id, summarizeStudent(student as CenterStudentIdentity, resultMap.get(student.id) ?? [], assignmentStats.get(student.id))]))
    return res.json({
      groups: groups.map((group) => {
        const memberSummaries = group.members.map((entry) => summaryMap.get(entry.member.userId)).filter((entry): entry is StudentProgressSummary => Boolean(entry))
        return {
          id: group.id,
          name: group.name,
          examTrack: group.examTrack,
          targetScore: group.targetScore,
          schedule: group.schedule,
          teacher: group.teacher,
          students: memberSummaries,
          studentCount: memberSummaries.length,
          assignmentCount: group._count.assignments,
          averageSat: Math.round(average(memberSummaries.map((student) => student.currentSat).filter((value): value is number => value !== null))),
          averageIelts: round(average(memberSummaries.map((student) => student.currentIelts).filter((value): value is number => value !== null))),
          averageScore: round(average(memberSummaries.map((student) => student.averageScore))),
          improving: memberSummaries.filter((student) => student.improvement > 0).length,
          needsAttention: memberSummaries.filter((student) => student.status === 'NEEDS_ATTENTION').length,
        }
      }),
    })
  }),
)

router.post(
  '/:slug/groups',
  requireAuth,
  validateBody(createGroupSchema),
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id, MANAGER_ROLES)
    if (!access) return
    const payload = req.body as z.infer<typeof createGroupSchema>
    if (payload.teacherId) {
      const teacher = await prisma.learningCenterMember.findFirst({
        where: { centerId: access.centerId, userId: payload.teacherId, role: { in: STAFF_ROLES }, status: LearningCenterMemberStatus.ACTIVE },
      })
      if (!teacher) return res.status(400).json({ message: 'Selected teacher is not an active team member.' })
    }
    const group = await prisma.learningCenterGroup.create({
      data: {
        centerId: access.centerId,
        name: payload.name,
        examTrack: payload.examTrack,
        teacherId: payload.teacherId || null,
        targetScore: payload.targetScore || null,
        schedule: payload.schedule || null,
      },
      include: { teacher: { select: { id: true, fullName: true, avatarUrl: true } } },
    })
    return res.status(201).json({ group })
  }),
)

router.get(
  '/:slug/team',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id, STAFF_ROLES)
    if (!access) return
    const members = await prisma.learningCenterMember.findMany({
      where: { centerId: access.centerId, role: { in: STAFF_ROLES } },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
    })
    const groupCounts = await prisma.learningCenterGroup.groupBy({
      by: ['teacherId'],
      where: { centerId: access.centerId, archivedAt: null, teacherId: { not: null } },
      _count: true,
    })
    const counts = new Map(groupCounts.map((entry) => [entry.teacherId, entry._count]))
    const canSeeEmails = MANAGER_ROLES.includes(access.role)
    return res.json({ team: members.map((member) => ({
      ...member,
      user: { ...member.user, email: canSeeEmails ? member.user.email : null },
      groupCount: counts.get(member.userId) ?? 0,
    })) })
  }),
)

router.post(
  '/:slug/invitations',
  requireAuth,
  validateBody(invitationSchema),
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id, MANAGER_ROLES)
    if (!access) return
    const payload = req.body as z.infer<typeof invitationSchema>
    if (payload.groupId) {
      const group = await prisma.learningCenterGroup.findFirst({ where: { id: payload.groupId, centerId: access.centerId } })
      if (!group) return res.status(400).json({ message: 'Selected group does not belong to this workspace.' })
    }
    const existingUser = payload.email
      ? await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() }, select: { id: true } })
      : null
    if (existingUser) {
      const member = await prisma.learningCenterMember.upsert({
        where: { centerId_userId: { centerId: access.centerId, userId: existingUser.id } },
        update: { role: payload.role, status: LearningCenterMemberStatus.ACTIVE, title: payload.title || null },
        create: { centerId: access.centerId, userId: existingUser.id, role: payload.role, title: payload.title || null },
      })
      if (payload.groupId && payload.role === LearningCenterRole.STUDENT) {
        await prisma.learningCenterGroupMember.upsert({
          where: { groupId_memberId: { groupId: payload.groupId, memberId: member.id } },
          update: {},
          create: { groupId: payload.groupId, memberId: member.id },
        })
      }
      return res.status(201).json({ status: 'MEMBER_ADDED', memberId: member.id })
    }
    const invitation = await prisma.learningCenterInvitation.create({
      data: {
        centerId: access.centerId,
        groupId: payload.groupId || null,
        invitedById: req.user!.id,
        email: payload.email?.toLowerCase() || null,
        code: inviteCode(),
        role: payload.role,
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
      },
    })
    return res.status(201).json({
      status: 'INVITATION_CREATED',
      invitation: {
        code: invitation.code,
        expiresAt: invitation.expiresAt.toISOString(),
        joinPath: `/learning-center/join/${invitation.code}`,
      },
    })
  }),
)

router.get(
  '/:slug/assignments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id)
    if (!access) return
    const allowedStudents = await studentScope(access)
    const assignments = await prisma.learningCenterAssignment.findMany({
      where: {
        centerId: access.centerId,
        archivedAt: null,
        ...(access.role === LearningCenterRole.STUDENT
          ? { submissions: { some: { studentId: access.userId } } }
          : access.role === LearningCenterRole.TEACHER
            ? { OR: [{ createdById: access.userId }, { group: { teacherId: access.userId } }] }
            : {}),
      },
      orderBy: { dueAt: 'asc' },
      include: {
        group: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        submissions: {
          where: { studentId: { in: allowedStudents } },
          include: { student: { select: { id: true, fullName: true, avatarUrl: true } } },
        },
      },
    })
    return res.json({
      assignments: assignments.map((assignment) => {
        const pipeline = { assigned: 0, inProgress: 0, completed: 0, overdue: 0 }
        for (const submission of assignment.submissions) {
          const status = assignmentStatus({ ...submission, assignment })
          if (status === 'COMPLETED') pipeline.completed += 1
          else if (status === 'IN_PROGRESS') pipeline.inProgress += 1
          else if (status === 'OVERDUE') pipeline.overdue += 1
          else pipeline.assigned += 1
        }
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          kind: assignment.kind,
          examTrack: assignment.examTrack,
          routePath: assignment.routePath,
          targetScore: assignment.targetScore,
          dueAt: assignment.dueAt.toISOString(),
          publishedAt: assignment.publishedAt.toISOString(),
          group: assignment.group,
          studentId: assignment.studentId,
          createdBy: assignment.createdBy,
          submissions: assignment.submissions.map((submission) => ({ ...submission, status: assignmentStatus({ ...submission, assignment }) })),
          pipeline,
        }
      }),
    })
  }),
)

router.post(
  '/:slug/assignments',
  requireAuth,
  validateBody(assignmentSchema),
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id, STAFF_ROLES)
    if (!access) return
    const payload = req.body as z.infer<typeof assignmentSchema>
    const allowedStudents = await studentScope(access)
    let studentIds: string[] = []
    if (payload.groupId) {
      const group = await prisma.learningCenterGroup.findFirst({
        where: {
          id: payload.groupId,
          centerId: access.centerId,
          ...(access.role === LearningCenterRole.TEACHER ? { teacherId: access.userId } : {}),
        },
        include: { members: { include: { member: { select: { userId: true } } } } },
      })
      if (!group) return res.status(400).json({ message: 'Group is outside your teaching scope.' })
      studentIds = group.members.map((entry) => entry.member.userId).filter((id) => allowedStudents.includes(id))
    } else if (payload.studentId && allowedStudents.includes(payload.studentId)) {
      studentIds = [payload.studentId]
    } else {
      return res.status(400).json({ message: 'Student is outside your teaching scope.' })
    }
    if (!studentIds.length) return res.status(400).json({ message: 'The selected audience has no active students.' })
    const assignment = await prisma.learningCenterAssignment.create({
      data: {
        centerId: access.centerId,
        groupId: payload.groupId || null,
        studentId: payload.studentId || null,
        createdById: req.user!.id,
        title: payload.title,
        description: payload.description || null,
        kind: payload.kind,
        examTrack: payload.examTrack,
        routePath: payload.routePath,
        targetScore: payload.targetScore || null,
        dueAt: new Date(payload.dueAt),
        submissions: { create: studentIds.map((studentId) => ({ studentId })) },
      },
      include: { group: { select: { id: true, name: true } }, submissions: true },
    })
    return res.status(201).json({ assignment })
  }),
)

router.patch(
  '/:slug/submissions/:submissionId',
  requireAuth,
  validateBody(submissionSchema),
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id)
    if (!access) return
    const existing = await prisma.learningCenterAssignmentSubmission.findFirst({
      where: { id: req.params.submissionId, assignment: { centerId: access.centerId } },
    })
    if (!existing) return res.status(404).json({ message: 'Assignment submission not found.' })
    if (access.role === LearningCenterRole.STUDENT && existing.studentId !== access.userId) {
      return res.status(403).json({ message: 'You can update only your own assignment.' })
    }
    if (access.role === LearningCenterRole.TEACHER) {
      const allowed = await studentScope(access)
      if (!allowed.includes(existing.studentId)) return res.status(403).json({ message: 'Student is outside your teaching scope.' })
    }
    const payload = req.body as z.infer<typeof submissionSchema>
    const now = new Date()
    const updated = await prisma.learningCenterAssignmentSubmission.update({
      where: { id: existing.id },
      data: {
        status: payload.status,
        progress: payload.status === LearningSubmissionStatus.COMPLETED ? 100 : payload.progress,
        startedAt: existing.startedAt ?? (payload.status === LearningSubmissionStatus.IN_PROGRESS ? now : undefined),
        submittedAt: payload.status === LearningSubmissionStatus.COMPLETED ? now : null,
      },
    })
    return res.json({ submission: updated })
  }),
)

router.get(
  '/:slug/leaderboard',
  requireAuth,
  validateQuery(z.object({
    exam: z.enum(['SAT', 'IELTS']).default('SAT'),
    metric: z.enum(['SCORE', 'IMPROVEMENT']).default('SCORE'),
    days: z.coerce.number().int().min(7).max(365).default(31),
    groupId: z.string().trim().max(191).optional(),
  })),
  asyncHandler(async (req, res) => {
    const access = await requireCenterAccess(res, req.params.slug, req.user!.id)
    if (!access) return
    const exam = String(req.query.exam ?? 'SAT') as 'SAT' | 'IELTS'
    const metric = String(req.query.metric ?? 'SCORE') as 'SCORE' | 'IMPROVEMENT'
    const days = Number(req.query.days ?? 31)
    const groupId = typeof req.query.groupId === 'string' ? req.query.groupId : undefined
    const { summaries } = await loadStudentSummaries(access, days, groupId)
    const rows = summaries
      .map((student) => ({
        id: student.id,
        fullName: student.fullName,
        nickname: student.nickname,
        avatarUrl: student.avatarUrl,
        score: exam === 'SAT' ? student.currentSat : student.currentIelts,
        highest: exam === 'SAT' ? student.highestSat : student.highestIelts,
        improvement: student.improvement,
        attempts: student.attempts,
        currentStreak: student.currentStreak,
      }))
      .filter((row) => row.score !== null)
      .sort((a, b) => metric === 'IMPROVEMENT' ? b.improvement - a.improvement : (b.score ?? 0) - (a.score ?? 0))
      .map((row, index) => ({ rank: index + 1, ...row }))
    return res.json({ exam, metric, rows })
  }),
)

export default router
