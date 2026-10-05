import { prisma } from '../lib/prisma.js'
import { AiGenerationError, generateAiText } from './aiProvider.service.js'
import { boundedHistory, buildCoachPrompt, parseAssistantReply, partialAssistantReply, type AssistantContext, type AssistantRequest } from './assistantPolicy.js'
import { researchForAssistant } from './assistantResearch.service.js'

export async function loadAssistantRecords(userId: string, threadId?: string) {
  const [user, memories] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, profile: { select: { targetExam: true, targetScore: true, examDate: true, currentIeltsScore: true, targetIeltsScore: true, dailyStudyHours: true } }, aiPreference: { select: { preferredName: true } } } }),
    prisma.aiMemory.findMany({ where: { userId, key: { not: 'last_locale' } }, orderBy: { updatedAt: 'desc' }, take: 40, select: { key: true, value: true } }),
  ])
  if (!user) throw new AiGenerationError(404, 'USER_NOT_FOUND', 'User not found.')
  if (threadId) {
    const owned = await prisma.aiConversationThread.findFirst({ where: { id: threadId, userId }, select: { id: true } })
    if (!owned) throw new AiGenerationError(404, 'CHAT_NOT_FOUND', 'Chat not found.')
  }
  return { learner: user, memories }
}

export function assistantData(context: AssistantContext, records: Awaited<ReturnType<typeof loadAssistantRecords>>) {
  return { ...records, currentPage: context.pathname, workspace: context.workspace, studyProgress: context.studyContext, onScreen: context.screenContext, siteKnowledge: context.siteKnowledge }
}

export async function answerAssistant(userId: string, request: AssistantRequest, signal?: AbortSignal, onReply?: (reply: string) => void) {
  const records = await loadAssistantRecords(userId, request.threadId)
  const research = await researchForAssistant(userId, request.message, signal)
  const generated = await generateAiText({ userId, purpose: 'assistant_chat', signal,
    systemPrompt: buildCoachPrompt(request, request.delivery),
    userMessage: JSON.stringify({ request: request.message || 'Explain the attached image.', generateTitle: request.generateTitle,
      history: boundedHistory(request.history), context: assistantData(request, records), research }),
    images: request.images, maxOutputTokens: 4096,
    onText: onReply ? (raw) => { const reply = partialAssistantReply(raw); if (reply) onReply(reply) } : undefined,
  })
  const answer = parseAssistantReply(generated.text)
  signal?.throwIfAborted()
  const savedMemories = answer.memoryUpdates.length ? await prisma.$transaction(answer.memoryUpdates.map((memory) => prisma.aiMemory.upsert({
    where: { userId_key: { userId, key: memory.key } }, update: { value: memory.value }, create: { userId, ...memory },
  }))) : []
  return { ...answer, savedMemories, sources: research.sources, meta: { provider: generated.provider, model: generated.model, fallbackUsed: generated.fallbackUsed, research: research.status } }
}
