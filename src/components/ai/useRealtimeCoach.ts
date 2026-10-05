import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RealtimeCoach } from '@/lib/realtimeCoach'
import { useAiAssistantStore, type AiAssistantMessage } from '@/store/aiAssistantStore'
import { useAuthStore } from '@/store/authStore'
import { persistAiMessage } from '@/services/aiWorkspacePersistence'
import { buildStudySnapshot, describeStudySnapshot } from '@/services/ai/studyContext'
import { composeScreenContext } from '@/services/ai/screenCapture'
import { describeRelevantSiteKnowledge } from '@/services/ai/siteKnowledge'
import type { AiTutorController } from './useAiTutor'

export function useRealtimeCoach(tutor: AiTutorController, enabled: boolean, mode: 'coach' | 'examiner') {
  const location = useLocation()
  const connection = useRef<RealtimeCoach | null>(null)
  const latest = useRef(tutor); latest.current = tutor
  const [error, setError] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [muted, setMuted] = useState(false)
  const [retry, setRetry] = useState(0)
  const currentPath = useRef(location.pathname); currentPath.current = location.pathname
  const supported = typeof RTCPeerConnection !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  useEffect(() => {
    if (!enabled || !supported || !tutor.hasPremium || !tutor.user || !tutor.threadsLoaded) return
    let disposed = false
    const userId = tutor.user.id
    const ownerKey = `user:${userId}`
    const locale = tutor.voiceLang
    const connect = async () => {
      latest.current.cancelVoice(); latest.current.cancelSend()
      setError(null); setCaption(''); setMuted(false)
      const threadId = latest.current.activeThreadId ?? await latest.current.createNewChat()
      if (disposed) return
      const record = (role: 'user' | 'assistant', text: string, id: string, interrupted = false) => {
        if (useAuthStore.getState().user?.id !== userId) return
        const message: AiAssistantMessage = { id: `voice-${id}`, role, content: text, createdAt: new Date().toISOString(), delivery: 'voice', ...(interrupted ? { status: 'interrupted' } : {}) }
        useAiAssistantStore.getState().pushMessage(ownerKey, threadId, message)
        if (!threadId.startsWith('local-')) void persistAiMessage(threadId, { ...message, content: interrupted ? `${text}\n\n[Interrupted voice response]` : text }, locale).catch(() => {})
      }
      const thread = useAiAssistantStore.getState().threadsByOwner[ownerKey]?.find((item) => item.id === threadId)
      const voice = new RealtimeCoach({
        context: { pathname: currentPath.current, workspace: tutor.activeWorkspace, language: locale, mode,
          threadId: threadId.startsWith('local-') ? undefined : threadId,
          studyContext: describeStudySnapshot(buildStudySnapshot(userId)).slice(0, 16000),
          screenContext: composeScreenContext('Explain this page', location.pathname).slice(0, 12000),
          siteKnowledge: describeRelevantSiteKnowledge('IELTS SAT English admissions tests').slice(0, 16000) },
        history: (thread?.messages ?? []).filter((message) => !message.status).slice(-24).map(({ role, content }) => ({ role, content })),
        state: (state) => useAiAssistantStore.getState().setVoiceState(state),
        level: (level) => useAiAssistantStore.getState().setVoiceLevel(level), caption: setCaption, message: record,
        coachResult: (result, id) => {
          if (useAuthStore.getState().user?.id !== userId) return
          record('assistant', result.reply, `coach-${id}`)
          latest.current.acceptCoachResult(result)
        },
        error: (issue) => { if (!disposed) setError(issue.message) },
      })
      connection.current = voice
      await voice.start()
      if (!disposed && currentPath.current !== location.pathname) await voice.updateContext({ pathname: currentPath.current, workspace: tutor.activeWorkspace, language: locale, mode, studyContext: describeStudySnapshot(buildStudySnapshot(userId)).slice(0, 16000), screenContext: composeScreenContext('Explain this page', currentPath.current).slice(0, 12000), siteKnowledge: describeRelevantSiteKnowledge('IELTS SAT English admissions tests').slice(0, 16000) })
    }
    void connect().catch((issue) => { if (!disposed) setError(issue instanceof Error ? issue.message : 'Voice could not connect.') })
    return () => { disposed = true; connection.current?.stop(); connection.current = null }
    // The session survives route changes and docking. Language, mode and account
    // changes deliberately create a new session with matching instructions.
  }, [enabled, supported, tutor.hasPremium, tutor.user?.id, tutor.voiceLang, tutor.activeWorkspace, tutor.activeThreadId, tutor.threadsLoaded, mode, retry])

  useEffect(() => {
    if (!enabled || !tutor.user) return
    const timer = window.setTimeout(() => {
      void connection.current?.updateContext({ pathname: location.pathname, workspace: tutor.activeWorkspace, language: tutor.voiceLang, mode,
        studyContext: describeStudySnapshot(buildStudySnapshot(tutor.user!.id)).slice(0, 16000), screenContext: composeScreenContext('Explain this page', location.pathname).slice(0, 12000), siteKnowledge: describeRelevantSiteKnowledge('IELTS SAT English admissions tests').slice(0, 16000) }).catch(() => {})
    }, 600)
    return () => window.clearTimeout(timer)
  }, [enabled, location.pathname, tutor.user?.id, tutor.activeWorkspace, tutor.voiceLang, mode])

  const toggleMute = useCallback(() => setMuted((current) => { connection.current?.mute(!current); return !current }), [])
  const interrupt = useCallback(() => connection.current?.interrupt(), [])
  const reconnect = useCallback(() => setRetry((current) => current + 1), [])
  const stop = useCallback(() => connection.current?.stop(), [])
  const requestFeedback = useCallback(() => connection.current?.requestFeedback(), [])
  return { error, caption, muted, supported, toggleMute, interrupt, reconnect, stop, requestFeedback }
}
