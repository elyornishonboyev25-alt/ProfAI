import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AiReportResponse } from '@/types/platform'
import type { AiWorkspaceId } from '@/services/ai/workspaces'
import type { SpeechLang } from '@/lib/speech'

export type AiAssistantMessageRole = 'user' | 'assistant'

export type AiAssistantMessage = {
  id: string
  role: AiAssistantMessageRole
  content: string
  createdAt: string
  /** Optional image attachments remain local and are not uploaded to chat history. */
  images?: string[]
}

export type AiAssistantThread = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: AiAssistantMessage[]
  /** False for offline-created chats that have not reached the backend. */
  synced: boolean
}

export type AiMemoryItem = {
  id: string
  key: string
  value: string
  createdAt: string
  updatedAt: string
}

// Drives the animated voice orb everywhere it appears.
export type AiVoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'

type AiAssistantState = {
  isOpen: boolean
  isSending: boolean
  error: string | null
  threadsByOwner: Record<string, AiAssistantThread[]>
  activeThreadIds: Record<string, string | null>
  threadsLoading: Record<string, boolean>
  threadsLoaded: Record<string, boolean>
  memoriesByOwner: Record<string, AiMemoryItem[]>
  reportSnapshot: AiReportResponse | null
  reportUpdatedAt: string | null
  talkOpen: boolean
  voiceState: AiVoiceState
  voiceLevel: number
  voiceLang: SpeechLang
  activeWorkspace: AiWorkspaceId
  isExamModeActive: boolean
  open: () => void
  close: () => void
  toggle: () => void
  openTalk: () => void
  closeTalk: () => void
  setVoiceState: (state: AiVoiceState) => void
  setVoiceLevel: (level: number) => void
  setVoiceLang: (language: SpeechLang) => void
  setActiveWorkspace: (workspace: AiWorkspaceId) => void
  setExamModeActive: (active: boolean) => void
  setSending: (value: boolean) => void
  setError: (value: string | null) => void
  setThreadLoading: (ownerKey: string, loading: boolean) => void
  setThreads: (ownerKey: string, threads: AiAssistantThread[]) => void
  addThread: (ownerKey: string, thread: AiAssistantThread) => void
  setActiveThread: (ownerKey: string, threadId: string) => void
  pushMessage: (ownerKey: string, threadId: string, message: AiAssistantMessage) => void
  renameThread: (ownerKey: string, threadId: string, title: string) => void
  removeThread: (ownerKey: string, threadId: string) => void
  clearMessages: (ownerKey: string) => void
  setMemories: (ownerKey: string, memories: AiMemoryItem[]) => void
  upsertMemories: (ownerKey: string, memories: AiMemoryItem[]) => void
  removeMemory: (ownerKey: string, memoryId: string) => void
  setReportSnapshot: (report: AiReportResponse | null) => void
}

const sortThreads = (threads: AiAssistantThread[]) =>
  [...threads].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))

export const useAiAssistantStore = create<AiAssistantState>()(
  persist(
    (set) => ({
      isOpen: false,
      isSending: false,
      error: null,
      threadsByOwner: {},
      activeThreadIds: {},
      threadsLoading: {},
      threadsLoaded: {},
      memoriesByOwner: {},
      reportSnapshot: null,
      reportUpdatedAt: null,
      talkOpen: false,
      voiceState: 'idle',
      voiceLevel: 0,
      voiceLang: 'en',
      activeWorkspace: 'general',
      isExamModeActive: false,
      open: () => set((state) => (state.isExamModeActive ? state : { isOpen: true })),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => (state.isExamModeActive ? state : { isOpen: !state.isOpen })),
      openTalk: () =>
        set((state) => (state.isExamModeActive ? state : { talkOpen: true, isOpen: false })),
      closeTalk: () => set({ talkOpen: false, voiceState: 'idle', voiceLevel: 0 }),
      setVoiceState: (voiceState) => set({ voiceState }),
      setVoiceLevel: (voiceLevel) => set({ voiceLevel: Math.max(0, Math.min(1, voiceLevel)) }),
      setVoiceLang: (voiceLang) => set({ voiceLang }),
      setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
      setExamModeActive: (isExamModeActive) =>
        set(
          isExamModeActive
            ? {
                isExamModeActive: true,
                isOpen: false,
                talkOpen: false,
                voiceState: 'idle',
                voiceLevel: 0,
              }
            : { isExamModeActive: false },
        ),
      setSending: (isSending) => set({ isSending }),
      setError: (error) => set({ error }),
      setThreadLoading: (ownerKey, loading) =>
        set((state) => ({
          threadsLoading: { ...state.threadsLoading, [ownerKey]: loading },
          threadsLoaded: loading ? state.threadsLoaded : { ...state.threadsLoaded, [ownerKey]: true },
        })),
      setThreads: (ownerKey, serverThreads) =>
        set((state) => {
          const localOnly = (state.threadsByOwner[ownerKey] ?? []).filter(
            (thread) => !thread.synced && !serverThreads.some((server) => server.id === thread.id),
          )
          const threads = sortThreads([...localOnly, ...serverThreads])
          const currentActive = state.activeThreadIds[ownerKey]
          const activeThreadId = threads.some((thread) => thread.id === currentActive)
            ? currentActive ?? null
            : threads[0]?.id ?? null
          return {
            threadsByOwner: { ...state.threadsByOwner, [ownerKey]: threads },
            activeThreadIds: { ...state.activeThreadIds, [ownerKey]: activeThreadId },
            threadsLoading: { ...state.threadsLoading, [ownerKey]: false },
            threadsLoaded: { ...state.threadsLoaded, [ownerKey]: true },
          }
        }),
      addThread: (ownerKey, thread) =>
        set((state) => ({
          threadsByOwner: {
            ...state.threadsByOwner,
            [ownerKey]: sortThreads([thread, ...(state.threadsByOwner[ownerKey] ?? []).filter((item) => item.id !== thread.id)]),
          },
          activeThreadIds: { ...state.activeThreadIds, [ownerKey]: thread.id },
        })),
      setActiveThread: (ownerKey, threadId) =>
        set((state) => ({ activeThreadIds: { ...state.activeThreadIds, [ownerKey]: threadId } })),
      pushMessage: (ownerKey, threadId, message) =>
        set((state) => {
          const now = message.createdAt
          const threads = (state.threadsByOwner[ownerKey] ?? []).map((thread) =>
            thread.id === threadId
              ? { ...thread, updatedAt: now, messages: [...thread.messages, message].slice(-100) }
              : thread,
          )
          return { threadsByOwner: { ...state.threadsByOwner, [ownerKey]: sortThreads(threads) } }
        }),
      renameThread: (ownerKey, threadId, title) =>
        set((state) => ({
          threadsByOwner: {
            ...state.threadsByOwner,
            [ownerKey]: (state.threadsByOwner[ownerKey] ?? []).map((thread) =>
              thread.id === threadId ? { ...thread, title: title.trim().slice(0, 80) || thread.title } : thread,
            ),
          },
        })),
      removeThread: (ownerKey, threadId) =>
        set((state) => {
          const threads = (state.threadsByOwner[ownerKey] ?? []).filter((thread) => thread.id !== threadId)
          const active = state.activeThreadIds[ownerKey]
          return {
            threadsByOwner: { ...state.threadsByOwner, [ownerKey]: threads },
            activeThreadIds: {
              ...state.activeThreadIds,
              [ownerKey]: active === threadId ? threads[0]?.id ?? null : active ?? null,
            },
          }
        }),
      clearMessages: (ownerKey) =>
        set((state) => {
          const aliases = new Set([ownerKey, ownerKey.startsWith('user:') ? ownerKey.slice(5) : `user:${ownerKey}`])
          const threadsByOwner = { ...state.threadsByOwner }
          const activeThreadIds = { ...state.activeThreadIds }
          const memoriesByOwner = { ...state.memoriesByOwner }
          for (const alias of aliases) {
            delete threadsByOwner[alias]
            delete activeThreadIds[alias]
            delete memoriesByOwner[alias]
          }
          return { threadsByOwner, activeThreadIds, memoriesByOwner, error: null }
        }),
      setMemories: (ownerKey, memories) =>
        set((state) => ({ memoriesByOwner: { ...state.memoriesByOwner, [ownerKey]: memories } })),
      upsertMemories: (ownerKey, memories) =>
        set((state) => {
          const current = state.memoriesByOwner[ownerKey] ?? []
          const merged = [...current]
          for (const memory of memories) {
            const index = merged.findIndex((item) => item.id === memory.id || item.key === memory.key)
            if (index >= 0) merged[index] = memory
            else merged.unshift(memory)
          }
          merged.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
          return { memoriesByOwner: { ...state.memoriesByOwner, [ownerKey]: merged } }
        }),
      removeMemory: (ownerKey, memoryId) =>
        set((state) => ({
          memoriesByOwner: {
            ...state.memoriesByOwner,
            [ownerKey]: (state.memoriesByOwner[ownerKey] ?? []).filter((memory) => memory.id !== memoryId),
          },
        })),
      setReportSnapshot: (reportSnapshot) =>
        set({ reportSnapshot, reportUpdatedAt: reportSnapshot ? new Date().toISOString() : null }),
    }),
    {
      name: 'profai-ai-chat',
      version: 4,
      migrate: (persistedState, version) => {
        const old = persistedState as Partial<AiAssistantState> & {
          conversations?: Record<string, AiAssistantMessage[]>
        }
        if (version >= 4 || !old.conversations) return old as AiAssistantState

        const now = new Date().toISOString()
        const threadsByOwner: Record<string, AiAssistantThread[]> = {}
        const activeThreadIds: Record<string, string> = {}
        for (const [ownerKey, messages] of Object.entries(old.conversations)) {
          if (messages.length === 0) continue
          const id = `local-migrated-${ownerKey.replace(/[^a-z0-9]/gi, '-')}`
          threadsByOwner[ownerKey] = [{
            id,
            title: 'Previous conversation',
            createdAt: messages[0]?.createdAt ?? now,
            updatedAt: messages[messages.length - 1]?.createdAt ?? now,
            messages,
            synced: false,
          }]
          activeThreadIds[ownerKey] = id
        }
        return { ...old, conversations: undefined, threadsByOwner, activeThreadIds } as AiAssistantState
      },
      partialize: (state): AiAssistantState => ({
        ...state,
        isOpen: false,
        isSending: false,
        error: null,
        talkOpen: false,
        isExamModeActive: false,
        voiceState: 'idle',
        voiceLevel: 0,
        threadsLoading: {},
        threadsLoaded: {},
        threadsByOwner: Object.fromEntries(
          Object.entries(state.threadsByOwner).map(([owner, threads]) => [
            owner,
            threads.map((thread) => ({
              ...thread,
              messages: thread.messages.map(({ images: _images, ...message }) => message),
            })),
          ]),
        ),
      }),
    },
  ),
)
