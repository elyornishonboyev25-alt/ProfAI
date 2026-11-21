import { useEffect, useRef } from 'react'
import { useAiAssistantStore, type AiAssistantMessage } from '@/store/aiAssistantStore'
import { useAuthStore } from '@/store/authStore'
import { persistAiMessage } from '@/services/aiWorkspacePersistence'
import NovaLessonBoard from './NovaLessonBoard'
import { defaultNovaPerformance } from '@/lib/novaPersona'
export default function NovaLessonMessage({ message, threadId, userId, onNarrating, surface = 'chat', onAttempt }: { message: AiAssistantMessage; threadId: string; userId?: string; onNarrating?: (value: boolean) => void; surface?: 'chat' | 'voice'; onAttempt?: (text: string) => void }) {
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [threadId, userId, message.id])
  if (!message.lesson) return null
  const owner = userId ? `user:${userId}` : 'guest'
  return <NovaLessonBoard key={message.id + message.lesson.id} lesson={message.lesson} progress={message.lessonProgress} controlId={`${surface}:${message.id}`} onAttempt={onAttempt} onNarrating={onNarrating} onLevel={level => { if (useAuthStore.getState().user?.id === userId) useAiAssistantStore.getState().setVoiceLevel(level) }} onPlayback={(state, blockId) => {
    if (useAuthStore.getState().user?.id !== userId) return
    const store = useAiAssistantStore.getState()
    if (state === 'idle') { if (store.voicePresentation?.responseId.startsWith(`lesson:${message.id}:`)) { store.setVoicePresentation(null); store.setVoiceState('idle') } }
    else { store.setVoiceState(state === 'speaking' ? 'speaking' : 'thinking'); if (state === 'speaking') store.setVoicePresentation({ owner, threadId, responseId: `lesson:${message.id}:${blockId}`, performance: defaultNovaPerformance('focused') }) }
  }} onProgress={progress => {
    if (useAuthStore.getState().user?.id !== userId) return
    useAiAssistantStore.getState().updateMessage(owner, threadId, message.id, { lessonProgress: progress, pendingSync: true })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (threadId.startsWith('local-') || useAuthStore.getState().user?.id !== userId) return
      const updated = useAiAssistantStore.getState().threadsByOwner[owner]?.find(thread => thread.id === threadId)?.messages.find(item => item.id === message.id)
      if (updated) void persistAiMessage(threadId, updated, message.lesson!.language, userId).catch(() => {})
    }, 400)
  }}/>
}
