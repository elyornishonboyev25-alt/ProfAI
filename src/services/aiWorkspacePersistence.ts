import {readNovaLesson,lessonProgressSchema} from '@/lib/novaLesson'
import {novaLanguageChoiceSchema,novaLanguageSchema} from '@/lib/novaLanguage'
import { turnUnderstandingSchema, deliverySegmentSchema, performanceCueSchema } from '@/lib/novaLearning'
import { z } from 'zod'
import { novaExpressionSchema, readNovaPerformance } from '@/lib/novaPersona'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { ApiError, apiClient } from '@/lib/apiClient'
import type { AiAssistantMessage, AiAssistantThread, AiMemoryItem } from '@/store/aiAssistantStore'
import type { SpeechLang } from '@/lib/speech'

type ServerMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  locale: string
  metadata?: { expression?: unknown; performance?: unknown; delivery?: unknown; status?: unknown; understanding?: unknown; deliverySegments?: unknown; lesson?: unknown; lessonProgress?: unknown; language?: unknown; performanceTimeline?: unknown } | null
  createdAt: string
}

type ServerThread = {
  id: string
  title: string
  locale: string
  contextMode: string
  createdAt: string
  updatedAt: string
  messages: ServerMessage[]
}

const toMessage = (message: ServerMessage): AiAssistantMessage => ({
  id: message.id,
  role: message.role,
  content: message.content.replace(/\s*\[Interrupted voice response\]$/, ''),
  createdAt: message.createdAt,
  lesson: readNovaLesson(message.metadata?.lesson),
  lessonProgress: lessonProgressSchema.safeParse(message.metadata?.lessonProgress).success ? lessonProgressSchema.parse(message.metadata?.lessonProgress) : undefined,
  language: z.object({selection:novaLanguageChoiceSchema,response:novaLanguageSchema,lastReliable:novaLanguageSchema}).strict().safeParse(message.metadata?.language).success ? z.object({selection:novaLanguageChoiceSchema,response:novaLanguageSchema,lastReliable:novaLanguageSchema}).parse(message.metadata?.language) : undefined,
  ...(['en', 'uz', 'ru'].includes(message.locale) ? { locale: message.locale as SpeechLang } : {}),
  ...(novaExpressionSchema.safeParse(message.metadata?.expression).success ? { expression: novaExpressionSchema.parse(message.metadata?.expression) } : {}),
  ...(readNovaPerformance(message.metadata?.performance) ? { performance: readNovaPerformance(message.metadata?.performance) } : {}),
  ...(message.metadata?.delivery === 'voice' || message.metadata?.delivery === 'text' ? { delivery: message.metadata.delivery } : {}),
  ...(turnUnderstandingSchema.safeParse(message.metadata?.understanding).success ? { understanding: turnUnderstandingSchema.parse(message.metadata?.understanding) } : {}),
  ...(z.array(deliverySegmentSchema).max(4).safeParse(message.metadata?.deliverySegments).success ? { deliverySegments: z.array(deliverySegmentSchema).max(4).parse(message.metadata?.deliverySegments) } : {}),
  ...(z.array(performanceCueSchema).max(16).safeParse(message.metadata?.performanceTimeline).success ? { performanceTimeline: z.array(performanceCueSchema).max(16).parse(message.metadata?.performanceTimeline) } : {}),
  ...(message.metadata?.status === 'interrupted' ? { status: 'interrupted' as const } : {}),
  ...(message.content.endsWith('[Interrupted voice response]') ? { status: 'interrupted' as const, delivery: 'voice' as const } : {}),
})

const toThread = (thread: ServerThread): AiAssistantThread => ({
  id: thread.id,
  title: thread.title,
  createdAt: thread.createdAt,
  updatedAt: thread.updatedAt,
  messages: thread.messages.map(toMessage),
  synced: true,
})

export async function fetchAiThreads(): Promise<AiAssistantThread[]> {
  await retryPendingAiMessages()
  const response = await apiClient.get<{ items: ServerThread[] }>('/ai-workspace/threads')
  return response.items.filter((thread) => thread.messages.length > 0).map(toThread)
}

export async function createAiThread(language: SpeechLang): Promise<AiAssistantThread> {
  const thread = await apiClient.post<ServerThread>('/ai-workspace/threads', {
    title: 'New chat',
    locale: language,
    contextMode: 'general',
  })
  return toThread(thread)
}

export const renameAiThread = (threadId: string, title: string) =>
  apiClient.patch(`/ai-workspace/threads/${encodeURIComponent(threadId)}`, { title })

export const deleteAiThread = (threadId: string) =>
  apiClient.delete(`/ai-workspace/threads/${encodeURIComponent(threadId)}`)

const sendAiMessage = (threadId: string, message: AiAssistantMessage, language: SpeechLang, expectedUserId?: string) =>
  apiClient.post(`/ai-workspace/threads/${encodeURIComponent(threadId)}/messages`, {
    id: message.id,
    role: message.role,
    content: message.content.replace(/\s*\[Interrupted voice response\]$/, ''),
    locale: language,
    metadata: { lesson: message.lesson, lessonProgress: message.lessonProgress, language: message.language, understanding: message.understanding, deliverySegments: message.deliverySegments, performanceTimeline: message.performanceTimeline, expression: message.expression, performance: message.performance, delivery: message.delivery, ...(message.status === 'interrupted' ? { status: 'interrupted' } : {}) },
  }, { expectedUserId })

export async function fetchAiMemories(): Promise<AiMemoryItem[]> {
  const response = await apiClient.get<{ items: AiMemoryItem[] }>('/ai-workspace/memories')
  return response.items
}

export async function persistAiMemories(memories: Array<{ key: string; value: string }>): Promise<AiMemoryItem[]> {
  const response = await apiClient.put<{ items: AiMemoryItem[] }>('/ai-workspace/memories', { memories })
  return response.items
}

export const deleteAiMemory = (memoryId: string) =>
  apiClient.delete(`/ai-workspace/memories/${encodeURIComponent(memoryId)}`)

export async function persistAiMessage(threadId: string, message: AiAssistantMessage, language: SpeechLang, expectedUserId = useAuthStore.getState().user?.id) {
  const userId = expectedUserId
  if (useAuthStore.getState().user?.id !== userId) throw new Error('Account changed.')
  const owner = userId ? `user:${userId}` : 'guest'
  useAiAssistantStore.getState().updateMessage(owner, threadId, message.id, { pendingSync: true, locale: language })
  for (let attempt = 0; attempt < 2; attempt++) {
    if (useAuthStore.getState().user?.id !== userId) throw new Error('Account changed.')
    try {
      const result = await sendAiMessage(threadId, message, language, userId)
      if (message.lessonProgress) await apiClient.patch(`/ai-workspace/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(message.id)}/lesson-progress`, message.lessonProgress, {expectedUserId:userId})
      if (useAuthStore.getState().user?.id === userId) useAiAssistantStore.getState().updateMessage(owner, threadId, message.id, { pendingSync: false })
      return result
    } catch (error) {
      if (attempt || (error instanceof ApiError && ![502, 503, 504].includes(error.status))) throw error
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }
}
export async function retryPendingAiMessages() {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return
  const threads = useAiAssistantStore.getState().threadsByOwner[`user:${userId}`] ?? []
  let count = 0
  for (const thread of threads) for (const message of thread.messages) {
    if (!message.pendingSync || message.status === 'streaming' || thread.id.startsWith('local-') || count++ >= 12) continue
    if (useAuthStore.getState().user?.id !== userId) return
    await persistAiMessage(thread.id, message, message.locale ?? 'en', userId).catch(() => {})
  }
}
export const editAiMemory = (id: string, value: string, revision: number) =>
  apiClient.patch<AiMemoryItem>(`/ai-workspace/memories/${encodeURIComponent(id)}`, { value, revision })
