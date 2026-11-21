import { relevantMemories, saveNovaMemories, memoryRevisionSnapshot } from './novaMemory.service.js'
import { loadSkillEvidence, relevantSkills, saveLearningEvidence } from './novaLearning.service.js'
import { turnUnderstandingSchema } from './novaLearning.js'
import type { NovaDiagnostics } from './novaDiagnostics.js'
import { examPerformance } from './novaPersona.js'
import { prisma } from '../lib/prisma.js'
import { AiGenerationError, generateAiText } from './aiProvider.service.js'
import { boundedHistory, buildCoachPrompt, parseAssistantReply, partialAssistantReply, type AssistantContext, type AssistantRequest } from './assistantPolicy.js'
import { researchForAssistant } from './assistantResearch.service.js'
import { arithmeticFacts } from './novaArithmetic.js'

export async function loadAssistantRecords(userId: string, threadId?: string) {
  const [user, memories, owned, evidence] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, profile: { select: { targetExam: true, targetScore: true, examDate: true, currentIeltsScore: true, targetIeltsScore: true, dailyStudyHours: true } }, aiPreference: { select: { preferredName: true } },
      assessmentResults: { orderBy: { completedAt: 'desc' }, take: 24, select: { examType: true, skill: true, title: true, score: true, maxScore: true, accuracy: true, durationSec: true, completedAt: true } },
    } }),
    prisma.aiMemory.findMany({ where: { userId, key: { not: 'last_locale' } }, orderBy: { updatedAt: 'desc' }, take: 40, select: { key: true, value: true, category: true, origin: true, revision: true, updatedAt: true, expiresAt: true, supersededAt: true } }),
    threadId ? prisma.aiConversationThread.findFirst({ where: { id: threadId, userId }, select: { id: true, messages: { where: { role: 'assistant' }, orderBy: { createdAt: 'desc' }, take: 1, select: { metadata: true } } } }) : null,
    loadSkillEvidence(userId),
  ])
  if (!user) throw new AiGenerationError(404, 'USER_NOT_FOUND', 'User not found.')
  if (threadId && !owned) throw new AiGenerationError(404, 'CHAT_NOT_FOUND', 'Chat not found.')
  const metadata = owned?.messages?.[0]?.metadata
  const state = turnUnderstandingSchema.safeParse(metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata.understanding : undefined)
  return { learner: user, memories, evidence, conversationState: state.success ? state.data : null }
}

export function assistantData(context: AssistantContext, records: Pick<Awaited<ReturnType<typeof loadAssistantRecords>>, 'learner' | 'memories'> & Partial<Pick<Awaited<ReturnType<typeof loadAssistantRecords>>, 'evidence' | 'conversationState'>>, query = '') {
  return { learner: records.learner, memories: relevantMemories(records.memories, `${query} ${context.workspace}`), skills: relevantSkills(records.evidence ?? [], query, records.conversationState?.topic), conversationState: records.conversationState ?? null, coachPreferences: context.coachPreferences, verifiedRecentResults: records.learner.assessmentResults ?? [], currentPage: context.pathname, workspace: context.workspace, studyProgress: context.studyContext, onScreen: context.screenContext, siteKnowledge: context.siteKnowledge }
}

export async function answerAssistant(userId: string, request: AssistantRequest, signal?: AbortSignal, onReply?: (reply: string) => void, diagnostics?: NovaDiagnostics, learnerUtterance = request.message) {
  const records = await loadAssistantRecords(userId, request.threadId)
  const research = await researchForAssistant(userId, request.message, signal)
  let modelRequests = 0
  const generated = await generateAiText({ userId, onModelRequest: () => { modelRequests++; diagnostics?.count('modelCalls') }, purpose: 'assistant_chat', signal,
    systemPrompt: buildCoachPrompt(request, request.delivery),
    userMessage: JSON.stringify({ request: request.message || 'Explain the attached image.', generateTitle: request.generateTitle,
      history: boundedHistory(request.history), context: assistantData(request, records, request.message), research,
      learnerUtterance, verifiedArithmetic: arithmeticFacts(request.message) }),
    images: request.images, maxOutputTokens: 4096,
    onText: onReply ? (raw) => { const reply = partialAssistantReply(raw); if (reply) onReply(reply) } : undefined,
  })
  const answer = parseAssistantReply(generated.text, learnerUtterance)
  if (request.mode === 'examiner') { answer.performance = examPerformance(); answer.expression = 'focused'; answer.deliverySegments = []; answer.learningObservations = []; answer.understanding = undefined }
  if (!answer.understanding || !['attempt', 'review'].includes(answer.understanding.intent)) answer.learningObservations = []
  signal?.throwIfAborted()
  const saved = await Promise.allSettled([
    answer.memoryUpdates.length ? saveNovaMemories(userId, answer.memoryUpdates, { threadId: request.threadId, sourceQuote: learnerUtterance, origin: 'model', signal,
      expected: memoryRevisionSnapshot(records.memories) }) : Promise.resolve([]),
    answer.learningObservations.length ? saveLearningEvidence(userId, learnerUtterance, answer.learningObservations, { threadId: request.threadId, turnId: request.turnId, history: request.history, signal }) : Promise.resolve([]),
  ])
  signal?.throwIfAborted()
  const savedMemories = saved[0].status === 'fulfilled' ? saved[0].value : []
  const persistenceWarnings = saved.flatMap((result, index) => result.status === 'rejected' ? [index === 0 ? 'memory' : 'learning'] : [])
  if (saved[0].status === 'fulfilled' && savedMemories.length < answer.memoryUpdates.length) persistenceWarnings.push('memory_changed')

  return { ...answer, savedMemories, persistenceWarnings, sources: research.sources, meta: { modelRequests, provider: generated.provider, model: generated.model, fallbackUsed: generated.fallbackUsed, research: research.status } }
}
