import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AiReportResponse } from '@/types/platform'
import type { AiWorkspaceId } from '@/services/ai/workspaces'
import type { SpeechLang } from '@/lib/speech'
import type { GeminiChatAction } from '@/services/geminiAI'
import { DEFAULT_COACH_PREFERENCES, type CoachPreferences } from '@/services/ai/coachPreferences'
import { cancelCoachAudio, unlockCoachAudio } from '@/lib/coachAudio'

export type AiAssistantMessageRole = 'user' | 'assistant'

export type AiAssistantMessage = {
  id: string
  role: AiAssistantMessageRole
  content: string
  createdAt: string
  /** Optional image attachments remain local and are not uploaded to chat history. */
  images?: string[]
  status?: 'streaming' | 'interrupted'
  delivery?: 'text' | 'voice'
}

export type AiAssistantThread = {
  id: string
  /** Keeps an ongoing voice session stable when its draft gains a server ID. */
  clientId?: string
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
  coachPreferencesByOwner: Record<string, CoachPreferences>
  setCoachPreferences: (owner: string, preferences: Partial<CoachPreferences>) => void
  isExamModeActive: boolean
  pendingActions: Array<{ id: string; action: GeminiChatAction; label: string }>
  setPendingActions: (actions: Array<{ id: string; action: GeminiChatAction; label: string }>) => void
  updateMessage: (ownerKey: string, threadId: string, id: string, patch: Partial<AiAssistantMessage>) => void
  removeMessage: (ownerKey: string, threadId: string, id: string) => void
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
  startNewThread: (ownerKey: string) => string
  ensureActiveThread: (ownerKey: string) => string
  endChatSession: (ownerKey: string) => void
  syncThread: (ownerKey: string, draftId: string, thread: AiAssistantThread) => void
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

// History survives visits; the selected conversation belongs only to this tab's
// session. Reloading keeps it, while a new visit starts from a reusable draft.
const sessionThreadPrefix = 'ivygoo-ai-active-thread:'
const fallbackSessionThreads = new Map<string, string>()
function readSessionThread(owner: string): string | null {
  try { return window.sessionStorage.getItem(`${sessionThreadPrefix}${owner}`) }
  catch { return fallbackSessionThreads.get(owner) ?? null }
}
function writeSessionThread(owner: string, id: string | null) {
  if (id) fallbackSessionThreads.set(owner, id)
  else fallbackSessionThreads.delete(owner)
  try {
    if (id) window.sessionStorage.setItem(`${sessionThreadPrefix}${owner}`, id)
    else window.sessionStorage.removeItem(`${sessionThreadPrefix}${owner}`)
  } catch { /* Keep the open conversation usable when session storage is blocked. */ }
}

function clearSessionThreads() {
  fallbackSessionThreads.clear()
  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith(sessionThreadPrefix)) window.sessionStorage.removeItem(key)
    }
  } catch { /* The in-memory selection still resets if storage is unavailable. */ }
}

// A reload belongs to the current visit. Returning from an external page in the
// same tab is a new visit, even though the browser retains sessionStorage.
if (typeof window !== 'undefined') {
  const navigation = window.performance?.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined
  if (navigation && navigation.type !== 'reload') clearSessionThreads()
}

function createDraftThread(): AiAssistantThread {
  const now = new Date().toISOString()
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return { id: `local-${id}`, title: 'New chat', createdAt: now, updatedAt: now, messages: [], synced: false }
}

export const useAiAssistantStore = create<AiAssistantState>()(
  persist(
    (set, get) => ({
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
      coachPreferencesByOwner: {},
      setCoachPreferences: (owner, preferences) => set((state) => ({ coachPreferencesByOwner: {
        ...state.coachPreferencesByOwner,
        [owner]: { ...DEFAULT_COACH_PREFERENCES, ...state.coachPreferencesByOwner[owner], ...preferences },
      } })),
      isExamModeActive: false,
      pendingActions: [],
      setPendingActions: (pendingActions) => set({ pendingActions }),
      updateMessage: (ownerKey, threadId, id, patch) => set((state) => ({ threadsByOwner: {
        ...state.threadsByOwner, [ownerKey]: (state.threadsByOwner[ownerKey] ?? []).map((thread) => thread.id === threadId
          ? { ...thread, messages: thread.messages.map((message) => message.id === id ? { ...message, ...patch, id } : message) } : thread),
      } })),
      removeMessage: (ownerKey, threadId, id) => set((state) => ({ threadsByOwner: {
        ...state.threadsByOwner, [ownerKey]: (state.threadsByOwner[ownerKey] ?? []).map((thread) => thread.id === threadId
          ? { ...thread, messages: thread.messages.filter((message) => message.id !== id) } : thread),
      } })),
      open: () => set((state) => (state.isExamModeActive ? state : { isOpen: true })),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => (state.isExamModeActive ? state : { isOpen: !state.isOpen })),
      openTalk: () => set((state) => {
        if (state.isExamModeActive) return state
        unlockCoachAudio()
        return { talkOpen: true, isOpen: false }
      }),
      closeTalk: () => { cancelCoachAudio(); set({ talkOpen: false, voiceState: 'idle', voiceLevel: 0 }) },
      setVoiceState: (voiceState) => set({ voiceState }),
      setVoiceLevel: (voiceLevel) => set({ voiceLevel: Math.max(0, Math.min(1, voiceLevel)) }),
      setVoiceLang: (voiceLang) => set({ voiceLang }),
      setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
      setExamModeActive: (isExamModeActive) => {
        if (isExamModeActive) cancelCoachAudio()
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
        )
      },
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
            (thread) => !thread.synced && (thread.messages.length > 0 || thread.id === state.activeThreadIds[ownerKey]) && !serverThreads.some((server) => server.id === thread.id),
          )
          const threads = sortThreads([...localOnly, ...serverThreads.filter((thread) => thread.messages.length > 0)])
          const currentActive = state.activeThreadIds[ownerKey]
          const activeThreadId = threads.some((thread) => thread.id === currentActive)
            ? currentActive ?? null
            : null
          return {
            threadsByOwner: { ...state.threadsByOwner, [ownerKey]: threads },
            activeThreadIds: { ...state.activeThreadIds, [ownerKey]: activeThreadId },
            threadsLoading: { ...state.threadsLoading, [ownerKey]: false },
            threadsLoaded: { ...state.threadsLoaded, [ownerKey]: true },
          }
        }),
      addThread: (ownerKey, thread) => {
        writeSessionThread(ownerKey, thread.id)
        set((state) => ({
          threadsByOwner: {
            ...state.threadsByOwner,
            [ownerKey]: sortThreads([thread, ...(state.threadsByOwner[ownerKey] ?? []).filter((item) => item.id !== thread.id && item.messages.length > 0)]),
          },
          activeThreadIds: { ...state.activeThreadIds, [ownerKey]: thread.id },
        }))
      },
      startNewThread: (ownerKey) => {
        const draft = get().threadsByOwner[ownerKey]?.find((thread) => !thread.synced && thread.messages.length === 0) ?? createDraftThread()
        get().addThread(ownerKey, draft)
        return draft.id
      },
      ensureActiveThread: (ownerKey) => {
        const state = get()
        const threads = state.threadsByOwner[ownerKey] ?? []
        const current = threads.find((thread) => thread.id === state.activeThreadIds[ownerKey])
        if (current) return current.id
        const remembered = threads.find((thread) => thread.id === readSessionThread(ownerKey))
        if (remembered) {
          state.setActiveThread(ownerKey, remembered.id)
          return remembered.id
        }
        return state.startNewThread(ownerKey)
      },
      endChatSession: (ownerKey) => {
        writeSessionThread(ownerKey, null)
        set((state) => ({ activeThreadIds: { ...state.activeThreadIds, [ownerKey]: null } }))
      },
      setActiveThread: (ownerKey, threadId) => {
        if (!get().threadsByOwner[ownerKey]?.some((thread) => thread.id === threadId)) return
        writeSessionThread(ownerKey, threadId)
        set((state) => ({ activeThreadIds: { ...state.activeThreadIds, [ownerKey]: threadId } }))
      },
      syncThread: (ownerKey, draftId, savedThread) => set((state) => {
        if (state.activeThreadIds[ownerKey] === draftId) writeSessionThread(ownerKey, savedThread.id)
        return {
          threadsByOwner: {
            ...state.threadsByOwner,
            [ownerKey]: (state.threadsByOwner[ownerKey] ?? []).map((thread) => thread.id === draftId
              ? { ...savedThread, clientId: thread.clientId ?? draftId, messages: thread.messages, title: thread.title, updatedAt: thread.updatedAt }
              : thread),
          },
          activeThreadIds: { ...state.activeThreadIds, [ownerKey]: state.activeThreadIds[ownerKey] === draftId ? savedThread.id : state.activeThreadIds[ownerKey] ?? null },
        }
      }),
      pushMessage: (ownerKey, threadId, message) =>
        set((state) => {
          const now = message.createdAt
          const threads = (state.threadsByOwner[ownerKey] ?? []).map((thread) =>
            thread.id === threadId
              ? { ...thread, updatedAt: now, messages: [...thread.messages.filter((item) => item.id !== message.id), message].slice(-100) }
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
          if (active === threadId) writeSessionThread(ownerKey, null)
          return {
            threadsByOwner: { ...state.threadsByOwner, [ownerKey]: threads },
            activeThreadIds: {
              ...state.activeThreadIds,
              [ownerKey]: active === threadId ? null : active ?? null,
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
            writeSessionThread(alias, null)
            delete threadsByOwner[alias]
            delete activeThreadIds[alias]
            delete memoriesByOwner[alias]
          }
          return { threadsByOwner, activeThreadIds, memoriesByOwner, error: null, pendingActions: [] }
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
      version: 6,
      migrate: (persistedState, version) => {
        const old = persistedState as Partial<AiAssistantState> & {
          conversations?: Record<string, AiAssistantMessage[]>
        }
        if (version >= 4 || !old.conversations) {
          const threadsByOwner = Object.fromEntries(Object.entries(old.threadsByOwner ?? {}).map(([owner, threads]) => [owner, threads.filter((thread) => thread.messages.length > 0)]))
          const activeThreadIds = Object.fromEntries(Object.entries(old.activeThreadIds ?? {}).map(([owner, id]) => [owner, threadsByOwner[owner]?.some((thread) => thread.id === id) ? id : null]))
          return { ...old, threadsByOwner, activeThreadIds } as AiAssistantState
        }

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
      merge: (persistedState, currentState) => {
        const state = { ...currentState, ...(persistedState as Partial<AiAssistantState>) }
        return {
          ...state,
          activeThreadIds: Object.fromEntries(Object.entries(state.threadsByOwner).map(([owner, threads]) => {
            const id = readSessionThread(owner)
            return [owner, threads.some((thread) => thread.id === id) ? id : null]
          })),
        }
      },
      partialize: (state): AiAssistantState => ({
        ...state,
        isOpen: false,
        isSending: false,
        error: null,
        talkOpen: false,
        isExamModeActive: false,
        pendingActions: [],
        voiceState: 'idle',
        voiceLevel: 0,
        threadsLoading: {},
        threadsLoaded: {},
        activeThreadIds: {},
        threadsByOwner: Object.fromEntries(
          Object.entries(state.threadsByOwner).map(([owner, threads]) => [
            owner,
            threads.filter((thread) => (!thread.synced && thread.messages.length === 0) || thread.messages.some((message) => message.status !== 'streaming')).map((thread) => ({
              ...thread,
              messages: thread.messages.filter((message) => message.status !== 'streaming').map(({ images: _images, ...message }) => message),
            })),
          ]),
        ),
      }),
    },
  ),
)

if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return
    // Back/forward cache restores the existing document without rehydrating it.
    clearSessionThreads()
    useAiAssistantStore.setState({ activeThreadIds: {}, pendingActions: [], error: null })
  })
}
