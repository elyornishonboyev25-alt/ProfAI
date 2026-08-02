import { apiClient } from '@/lib/apiClient'
import type { AiAssistantMessage, AiAssistantThread, AiMemoryItem } from '@/store/aiAssistantStore'
import type { SpeechLang } from '@/lib/speech'

type ServerMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  locale: string
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
  content: message.content,
  createdAt: message.createdAt,
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
  const response = await apiClient.get<{ items: ServerThread[] }>('/ai-workspace/threads')
  return response.items.map(toThread)
}

export async function createAiThread(language: SpeechLang): Promise<AiAssistantThread> {
  const thread = await apiClient.post<ServerThread>('/ai-workspace/threads', {
    title: language === 'uz' ? 'Yangi chat' : language === 'ru' ? 'Новый чат' : 'New chat',
    locale: language,
    contextMode: 'general',
  })
  return toThread(thread)
}

export const renameAiThread = (threadId: string, title: string) =>
  apiClient.patch(`/ai-workspace/threads/${encodeURIComponent(threadId)}`, { title })

export const deleteAiThread = (threadId: string) =>
  apiClient.delete(`/ai-workspace/threads/${encodeURIComponent(threadId)}`)

export const persistAiMessage = (threadId: string, message: AiAssistantMessage, language: SpeechLang) =>
  apiClient.post(`/ai-workspace/threads/${encodeURIComponent(threadId)}/messages`, {
    id: message.id,
    role: message.role,
    content: message.content,
    locale: language,
  })

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
