import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { defaultNovaPerformance, examPerformance, type NovaExpression, type NovaPerformance } from '@/lib/novaPersona'

export type CoachExpression = NovaExpression
/** Response delivery metadata, never an emotion diagnosis or a keyword classifier. */
export function useCoachPerformance(): NovaPerformance {
  const owner = useAuthStore(state => state.user?.id ? `user:${state.user.id}` : 'guest')
  const exam = useAiAssistantStore(state => state.isExamModeActive)
  const threadId = useAiAssistantStore(state => state.activeThreadIds[owner])
  const messages = useAiAssistantStore(state => state.threadsByOwner[owner]?.find(thread => thread.id === threadId)?.messages)
  const voice = useAiAssistantStore(state => state.voicePresentation)
  const voiceState = useAiAssistantStore(state => state.voiceState)
  if (exam) return examPerformance()
  if (voice?.owner === owner && voice.threadId === threadId && voiceState === 'speaking') return voice.performance
  if (voiceState === 'thinking') return defaultNovaPerformance('thinking')
  if (voiceState === 'listening') return defaultNovaPerformance('curious')
  const last = messages?.[messages.length - 1]
  // A new question/streaming draft must not reuse the preceding answer's expression.
  if (last?.role !== 'assistant' || last.status) return defaultNovaPerformance()
  // Live metadata becomes visible only at playback, never from a queued transcript.
  if (last.delivery === 'voice' && voiceState === 'speaking') return defaultNovaPerformance()
  return last.performance ?? defaultNovaPerformance(last.expression)
}
export function useCoachExpression(): CoachExpression { return useCoachPerformance().expression }
