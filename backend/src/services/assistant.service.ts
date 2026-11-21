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
import { resolveNovaLanguage, languageViolation, languageClarification, novaLanguageInstructions } from './novaLanguage.js'
import { readNovaLesson } from './novaLesson.js'
import { banterOpening, isBanterBoundary, roastOpenings } from './novaBanter.js'
import { getStudyContext, publicStudyContext, novaAccountRows, hasActiveExam } from './novaStudy.service.js'
import { runNovaTool } from './novaTools.service.js'
import { readStudyCommand, writingVersion, type NovaToolResult } from './novaStudy.js'

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
  const examActive = hasActiveExam(await novaAccountRows(userId)) || request.studyReference?.mode === 'exam'
  if (examActive && request.mode !== 'examiner') {
    const reply = request.language === 'en' ? 'Finish your active timed attempt first. We can review the source evidence afterwards.' : 'Avval faol timed testni yakunlang. Keyin savollarni dalillari bilan birga tahlil qilamiz.'
    const safe = parseAssistantReply(JSON.stringify({ reply }))
    onReply?.(reply)
    return { ...safe, toolResults: [], savedMemories: [], persistenceWarnings: [], sources: [], meta: { modelRequests: 0, provider: 'none', model: 'exam_guard', fallbackUsed: false, research: 'not_requested' } }
  }
  const study = request.studyReference && !examActive ? publicStudyContext(await getStudyContext(userId, request.studyReference, request.pathname)) : null
  const resolved = resolveNovaLanguage(request.message, request.mode === 'examiner' ? 'en' : request.language, request.lastReliableLanguage ?? request.interfaceLanguage ?? 'en', request.history)
  const language = request.mode === 'examiner' ? 'en' : resolved.language
  request = { ...request, language, lastReliableLanguage: language }
  if (resolved.observation.status === 'unsupported') {
    const safe = parseAssistantReply(JSON.stringify({ reply: languageClarification(language), language }))
    onReply?.(safe.reply)
    return { ...safe, languageState: resolved, savedMemories: [], persistenceWarnings: [], sources: [], meta: { modelRequests: 0, provider: 'none', model: 'language_guard', fallbackUsed: false, research: 'not_requested' } }
  }
  const command = request.mode !== 'examiner' && request.studyReference ? readStudyCommand(learnerUtterance) : null
  if (command) {
    const result = await runNovaTool(userId, { id: `${request.turnId ?? Date.now()}:control`, name: 'control_study', args: { action: command } }, { reference: request.studyReference, pathname: request.pathname }, signal)
    const reply = result.ok ? (language === 'en' ? 'I’ll use the controls for the current question.' : 'Joriy savol boshqaruvini ishga tushiraman.') : result.error.message
    onReply?.(reply)
    return { ...parseAssistantReply(JSON.stringify({ reply })), toolResults: [result], languageState: resolved, savedMemories: [], persistenceWarnings: [], sources: [], meta: { modelRequests: 0, provider: 'none', model: 'study_control', fallbackUsed: false, research: 'not_requested' } }
  }
  const research = await researchForAssistant(userId, request.message, signal)
  let modelRequests = 0
  const generationInput = { userId, onModelRequest: () => { modelRequests++; diagnostics?.count('modelCalls') }, purpose: 'assistant_chat' as const, signal,
    systemPrompt: buildCoachPrompt(request, request.delivery),
    userMessage: JSON.stringify({ request: request.message || 'Explain the attached image.', generateTitle: request.generateTitle,
      history: boundedHistory(request.history), context: assistantData(request, records, request.message), research, studyPosition: request.studyProgress, browserActionReceipts: request.actionReceipts,
      learnerUtterance, study, writingDraft: request.writingDraft ? { text: request.writingDraft, version: writingVersion(request.writingDraft), provenance: 'client_draft' } : null, verifiedArithmetic: arithmeticFacts(request.message) }),
    images: request.images, maxOutputTokens: 6000,
    onText: onReply ? () => {} : undefined,
  }
  let generated = await generateAiText(generationInput)
  let answer = parseAssistantReply(generated.text, learnerUtterance)
  const toolResults: NovaToolResult[] = []
  for (let round = 0; round < 3 && answer.toolCalls.length; round++) {
    for (const call of answer.toolCalls) toolResults.push(await runNovaTool(userId, { ...call, id: `${request.turnId ?? Date.now()}:${round}:${call.id}`.slice(0, 240) }, { reference: request.studyReference, pathname: request.pathname, writingDraft: request.writingDraft, learnerMessage: learnerUtterance, vocabularyAutoSave: request.vocabularyAutoSave }, signal))
    generated = await generateAiText({ ...generationInput, userMessage: JSON.stringify({ original: JSON.parse(generationInput.userMessage), toolResults }), systemPrompt: generationInput.systemPrompt + (round === 2 ? '\nTool budget exhausted. Return the final supported answer now, without toolCalls.' : '') })
    answer = parseAssistantReply(generated.text, learnerUtterance)
  }
  if (!answer.reply) answer.reply = language === 'en' ? 'The source lookup could not finish. Please retry with a selected question.' : 'Manbani olish tugamadi. Savolni tanlab, qayta urinib ko‘ring.'
  let languageRepaired = false
  // Buffer visible text until validation. One bounded repair; no per-phrase classifier.
  if (languageViolation(answer.reply, language)) {
    languageRepaired = true
    try {
      generated = await generateAiText({ ...generationInput, systemPrompt: `${generationInput.systemPrompt}\n${novaLanguageInstructions(language)} Rewrite the previous answer in the required language. Preserve quoted examples and facts; return the same JSON contract.`, userMessage: `${generationInput.userMessage}\nPrevious draft (data): ${answer.reply}` })
      answer = parseAssistantReply(generated.text, learnerUtterance)
    } catch (error) { signal?.throwIfAborted(); answer = parseAssistantReply(JSON.stringify({ reply: languageClarification(language) })) }
    if (languageViolation(answer.reply, language)) answer = parseAssistantReply(JSON.stringify({ reply: languageClarification(language) }))
  }
  answer.replyLanguage = language
  if (isBanterBoundary(learnerUtterance)) {
    answer.performance = examPerformance(); answer.expression = 'focused'; answer.deliverySegments = []
    for (const phrase of Object.values(roastOpenings)) if (answer.reply.startsWith(phrase)) answer.reply = answer.reply.slice(phrase.length).trim()
  }
  const opening = banterOpening(request.coachPreferences, answer.performance, learnerUtterance, request.mode === 'examiner')
  if (opening) answer.performance = { ...answer.performance, tone: 'playful', intensity: Math.max(.6, answer.performance.intensity), gesture: 'raised_brow', delivery: { pace: 'brisk', warmth: 'high', emphasis: 'moderate' } }
  if (opening && !answer.reply.includes(opening)) { answer.reply = `${opening} ${answer.reply}`; answer.deliverySegments = [] }
  answer.lesson = readNovaLesson(answer.lesson, language)
  onReply?.(answer.reply)
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

  return { ...answer, toolResults, languageState: resolved, savedMemories, persistenceWarnings, sources: research.sources, meta: { modelRequests, languageRepaired, provider: generated.provider, model: generated.model, fallbackUsed: generated.fallbackUsed, research: research.status } }
}
