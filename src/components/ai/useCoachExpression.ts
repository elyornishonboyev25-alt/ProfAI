import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'

export type CoachExpression = 'warm' | 'delighted' | 'focused' | 'affectionate' | 'unimpressed'
/** An illustrative response to conversation tone, never emotion recognition. */
export function useCoachExpression(): CoachExpression {
  const owner = useAuthStore(state => state.user?.id ? `user:${state.user.id}` : 'guest')
  const exam = useAiAssistantStore(state => state.isExamModeActive)
  const messages = useAiAssistantStore(state => state.threadsByOwner[owner]?.find(thread => thread.id === state.activeThreadIds[owner])?.messages)
  if (exam) return 'focused'
  const latestUser = messages?.filter(message => message.role === 'user').slice(-1)[0]?.content ?? ''
  const assistant = messages?.filter(message => message.role === 'assistant').slice(-1)[0]
  // Structured text replies choose their own expression. Voice transcripts and
  // older saved messages use a modest illustrative fallback from actual words.
  if (assistant?.expression) return assistant.expression
  const reply = assistant?.content ?? ''
  if (/\b(?:asalim|jonim|dear|sweetheart)\b/i.test(reply)) return 'affectionate'
  if (/\b(?:well done|excellent progress|uddaladingiz|barakalla)\b/i.test(reply)) return 'delighted'
  if (/\b(?:focus on|try again|qayta urin|diqqat qiling)\b/i.test(reply)) return 'focused'
  if (/\b(?:rahmat|tushundim|uddaladim|thank|got it|nailed|haha|zo[r‘’ʻʼ']r)\b/i.test(latestUser)) return 'delighted'
  return 'warm'
}
