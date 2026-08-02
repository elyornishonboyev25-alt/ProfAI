import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

const threadIdSchema = z.object({ threadId: z.string().min(1).max(191) })
const memoryIdSchema = z.object({ memoryId: z.string().min(1).max(191) })
const createThreadSchema = z.object({
  title: z.string().trim().min(1).max(80).default('New chat'),
  locale: z.enum(['en', 'uz', 'ru']).default('en'),
  contextMode: z.string().trim().min(1).max(40).default('general'),
})
const renameThreadSchema = z.object({ title: z.string().trim().min(1).max(80) })
const createMessageSchema = z.object({
  id: z.string().min(1).max(191).optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(12000),
  locale: z.enum(['en', 'uz', 'ru']).default('en'),
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
      where: { userId },
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
      const created = await tx.aiConversationMessage.create({
        data: {
          ...(payload.id ? { id: payload.id } : {}),
          threadId,
          role: payload.role,
          content: payload.content,
          locale: payload.locale,
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
    const saved = await prisma.$transaction(
      memories.map((memory) =>
        prisma.aiMemory.upsert({
          where: { userId_key: { userId, key: memory.key } },
          update: { value: memory.value },
          create: { userId, key: memory.key, value: memory.value },
        }),
      ),
    )
    return res.json({ items: saved })
  }),
)

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
