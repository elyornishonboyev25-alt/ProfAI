import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AiReportResponse } from '@/types/platform'

export type AiAssistantMessageRole = 'user' | 'assistant'

export type AiAssistantMessage = {
  id: string
  role: AiAssistantMessageRole
  content: string
  createdAt: string
  /** Optional image attachments (data URLs) the learner sent with the message. */
  images?: string[]
}

// Drives the animated voice orb everywhere it appears (floating, page, talk overlay).
//  idle      → resting glow
//  listening → mic is open, capturing the learner
//  thinking  → request in flight, waiting on the model
//  speaking  → the tutor is talking back (TTS)
export type AiVoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'

type AiAssistantState = {
  isOpen: boolean
  isSending: boolean
  error: string | null
  conversations: Record<string, AiAssistantMessage[]>
  reportSnapshot: AiReportResponse | null
  reportUpdatedAt: string | null
  /** Immersive full-screen "talk to ProfAI" overlay. */
  talkOpen: boolean
  voiceState: AiVoiceState
  /** Live amplitude 0–1 used to make the orb pulse with the voice. */
  voiceLevel: number
  open: () => void
  close: () => void
  toggle: () => void
  openTalk: () => void
  closeTalk: () => void
  setVoiceState: (state: AiVoiceState) => void
  setVoiceLevel: (level: number) => void
  setSending: (value: boolean) => void
  setError: (value: string | null) => void
  pushMessage: (ownerKey: string, message: AiAssistantMessage) => void
  clearMessages: (ownerKey: string) => void
  setReportSnapshot: (report: AiReportResponse | null) => void
}

export const useAiAssistantStore = create<AiAssistantState>()(
  persist(
    (set) => ({
      isOpen: false,
      isSending: false,
      error: null,
      conversations: {},
      reportSnapshot: null,
      reportUpdatedAt: null,
      talkOpen: false,
      voiceState: 'idle',
      voiceLevel: 0,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      openTalk: () => set({ talkOpen: true, isOpen: false }),
      closeTalk: () => set({ talkOpen: false, voiceState: 'idle', voiceLevel: 0 }),
      setVoiceState: (state: AiVoiceState) => set({ voiceState: state }),
      setVoiceLevel: (level: number) => set({ voiceLevel: Math.max(0, Math.min(1, level)) }),
      setSending: (value: boolean) => set({ isSending: value }),
      setError: (value: string | null) => set({ error: value }),
      pushMessage: (ownerKey: string, message: AiAssistantMessage) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [ownerKey]: [...(state.conversations[ownerKey] ?? []), message].slice(-40),
          },
        })),
      clearMessages: (ownerKey: string) =>
        set((state) => ({
          conversations: { ...state.conversations, [ownerKey]: [] },
          error: null,
        })),
      setReportSnapshot: (report: AiReportResponse | null) =>
        set({
          reportSnapshot: report,
          reportUpdatedAt: report ? new Date().toISOString() : null,
        }),
    }),
    {
      name: 'profai-ai-chat',
      version: 2,
      // Conversations are deliberately namespaced by account id. Version 2
      // discards the old shared history instead of risking cross-account leaks.
      migrate: () => ({ conversations: {} }),
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
)
