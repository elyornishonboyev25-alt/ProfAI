import { turnUnderstandingSchema, deliverySegmentSchema, performanceCueSchema } from '../services/novaLearning.js'
import { lessonSchema, lessonProgressSchema, readNovaLesson } from '../services/novaLesson.js'
import { novaLanguageChoiceSchema, novaLanguageSchema } from '../services/novaLanguage.js'
import { editNovaMemory, MemoryConflict, InvalidMemory, saveNovaMemories } from '../services/novaMemory.service.js'
import { loadSkillEvidence, summarizeSkillEvidence } from '../services/novaLearning.service.js'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

import { novaExpressionSchema, novaPerformanceSchema } from '../services/novaPersona.js'

export const messageMetadataSchema = z.object({
  lesson: lessonSchema.refine(value => Boolean(readNovaLesson(value)), 'Invalid lesson graph, language or block identifiers').optional(),
  lessonProgress: lessonProgressSchema.optional(),
  language: z.object({ selection: novaLanguageChoiceSchema, response: novaLanguageSchema, lastReliable: novaLanguageSchema }).strict().optional(),
  understanding: turnUnderstandingSchema.optional(),
  deliverySegments: z.array(deliverySegmentSchema).max(4).optional(),
  performanceTimeline: z.array(performanceCueSchema).max(16).optional(),
  expression: novaExpressionSchema.optional(),
  performance: novaPerformanceSchema.optional(),
  delivery: z.enum(['text', 'voice']).optional(),
  status: z.literal('interrupted').optional(),
}).strict()
const router = Router()
router.patch('/threads/:threadId/messages/:messageId/lesson-progress', requireAuth, asyncHandler(async (req, res) => {
  const { threadId, messageId } = z.object({ threadId: z.string().min(1).max(191), messageId: z.string().min(1).max(191) }).parse(req.params)
  const progress = lessonProgressSchema.parse(req.body)
  const owned = await prisma.aiConversationThread.findFirst({ where: { id: threadId, userId: req.user!.id }, select: { id: true } })
  if (!owned) return res.status(404).json({ message: 'Chat not found.' })
  const message = await prisma.aiConversationMessage.findFirst({ where: { id: messageId, threadId } })
  const metadata = message?.metadata && typeof message.metadata === 'object' && !Array.isArray(message.metadata) ? message.metadata : {}
  if (!message || !lessonSchema.safeParse(metadata.lesson).success) return res.status(404).json({ message: 'Lesson not found.' })
  await prisma.aiConversationMessage.update({ where: { id: messageId }, data: { metadata: { ...metadata, lessonProgress: progress } } })
  return res.status(204).send()
}))

const threadIdSchema = z.object({ threadId: z.string().min(1).max(191) })
const memoryIdSchema = z.object({ memoryId: z.string().min(1).max(191) })
const createThreadSchema = z.object({
  title: z.string().trim().min(1).max(80).default('New chat'),
  locale: z.enum(['en', 'uz', 'ru']).default('en'),
  contextMode: z.string().trim().min(1).max(40).default('general'),
})
const renameThreadSchema = z.object({ title: z.string().trim().min(1).max(80) })
export const createMessageSchema = z.object({
  id: z.string().min(1).max(191).optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(12000),
  locale: z.enum(['en', 'uz', 'ru']).default('en'),
  metadata: messageMetadataSchema.optional(),
})
const saveMemoriesSchema = z.object({
  memories: z
    .array(
      z.object({
        key: z.string().trim().regex(/^[a-z][a-z0-9_]{1,63}$/),
        value: z.string().trim().min(1).max(600),
      }),
    )
    .min(1)
    .max(12),
})

router.use(requireAuth)

router.get(
  '/threads',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const threads = await prisma.aiConversationThread.findMany({
      where: { userId, messages: { some: {} } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: -100,
        },
      },
    })

    return res.json({ items: threads })
  }),
)

router.post(
  '/threads',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const payload = createThreadSchema.parse(req.body ?? {})
    const thread = await prisma.aiConversationThread.create({
      data: { userId, ...payload },
      include: { messages: true },
    })
    return res.status(201).json(thread)
  }),
)

router.patch(
  '/threads/:threadId',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const { threadId } = threadIdSchema.parse(req.params)
    const payload = renameThreadSchema.parse(req.body ?? {})
    const owned = await prisma.aiConversationThread.findFirst({ where: { id: threadId, userId }, select: { id: true } })
    if (!owned) return res.status(404).json({ message: 'Chat not found.' })

    const thread = await prisma.aiConversationThread.update({
      where: { id: threadId },
      data: { title: payload.title },
    })
    return res.json(thread)
  }),
)

router.delete(
  '/threads/:threadId',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const { threadId } = threadIdSchema.parse(req.params)
    const result = await prisma.aiConversationThread.deleteMany({ where: { id: threadId, userId } })
    if (result.count === 0) return res.status(404).json({ message: 'Chat not found.' })
    return res.status(204).send()
  }),
)

router.post(
  '/threads/:threadId/messages',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const { threadId } = threadIdSchema.parse(req.params)
    const payload = createMessageSchema.parse(req.body ?? {})
    const owned = await prisma.aiConversationThread.findFirst({ where: { id: threadId, userId }, select: { id: true } })
    if (!owned) return res.status(404).json({ message: 'Chat not found.' })

    const message = await prisma.$transaction(async (tx) => {
      const existing = payload.id ? await tx.aiConversationMessage.findFirst({ where: { id: payload.id, threadId } }) : null
      const created = existing ?? await tx.aiConversationMessage.create({
        data: {
          ...(payload.id ? { id: payload.id } : {}),
          threadId,
          role: payload.role,
          content: payload.content,
          locale: payload.locale,
          ...(payload.metadata ? { metadata: payload.metadata } : {}),
        },
      })
      await tx.aiConversationThread.update({
        where: { id: threadId },
        data: { locale: payload.locale, updatedAt: new Date() },
      })
      return created
    })
    return res.status(201).json(message)
  }),
)

router.get(
  '/memories',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const memories = await prisma.aiMemory.findMany({
      where: { userId, key: { not: 'last_locale' } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })
    return res.json({ items: memories })
  }),
)

router.put(
  '/memories',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const { memories } = saveMemoriesSchema.parse(req.body ?? {})
    const saved = await saveNovaMemories(userId, memories)
    return res.json({ items: saved })
  }),
)

router.patch('/memories/:memoryId', asyncHandler(async (req, res) => {
  const { memoryId } = memoryIdSchema.parse(req.params)
  const { value, revision } = z.object({ value: z.string().trim().min(1).max(600), revision: z.number().int().positive() }).strict().parse(req.body)
  try {
    const memory = await editNovaMemory(req.user!.id, memoryId, value, revision)
    if (!memory) return res.status(404).json({ message: 'Memory not found.' })
    return res.json(memory)
  } catch (error) {
    if (error instanceof MemoryConflict) return res.status(409).json({ code: 'MEMORY_CHANGED', message: error.message })
    if (error instanceof InvalidMemory) return res.status(400).json({ code: 'INVALID_MEMORY', message: error.message })
    throw error
  }
}))
router.get('/skills', asyncHandler(async (req, res) => {
  const rows = await loadSkillEvidence(req.user!.id)
  return res.json({ items: summarizeSkillEvidence(rows) })
}))

router.delete(
  '/memories/:memoryId',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id
    const { memoryId } = memoryIdSchema.parse(req.params)
    const result = await prisma.aiMemory.deleteMany({ where: { id: memoryId, userId } })
    if (result.count === 0) return res.status(404).json({ message: 'Memory not found.' })
    return res.status(204).send()
  }),
)

export default router
