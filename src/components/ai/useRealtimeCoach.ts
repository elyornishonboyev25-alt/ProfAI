import { currentNovaStudy, useNovaStudySession, observeNovaStudyPermission } from '@/services/ai/novaStudySession'
import {describeLessonContext} from '@/lib/novaLesson'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RealtimeCoach } from '@/lib/realtimeCoach'
import { GeminiRealtimeCoach } from '@/lib/geminiRealtimeCoach'
import { useAiAssistantStore, type AiAssistantMessage } from '@/store/aiAssistantStore'
import { useAuthStore } from '@/store/authStore'
import { createAiThread, persistAiMessage } from '@/services/aiWorkspacePersistence'
import { buildStudySnapshot, describeStudySnapshot } from '@/services/ai/studyContext'
import { composeScreenContext } from '@/services/ai/screenCapture'
import { describeRelevantSiteKnowledge } from '@/services/ai/siteKnowledge'
import type { AiTutorController } from './useAiTutor'
import { useCopy } from '@/i18n/interface'
import type { PerformanceCue } from '@/lib/novaLearning'
import { apiClient, ApiError } from '@/lib/apiClient'
import { readNovaPerformance, type NovaPerformance } from '@/lib/novaPersona'
import { VoiceStreamError } from '@/lib/voiceStreamError'

const memoryRevision = (memories: Array<{ updatedAt: string }> = []) => `${memories.length}:${memories.map(memory => memory.updatedAt).sort().slice(-1)[0] ?? ''}`

export function useRealtimeCoach(tutor: AiTutorController, enabled: boolean, mode: 'coach' | 'examiner', provider: 'gemini' | 'openai' = 'openai') {
  const location = useLocation()
  const { language: interfaceLanguage } = useCopy()
  const metadataLocale = interfaceLanguage === 'uz' ? 'uz' : interfaceLanguage === 'ru' ? 'ru' : 'en'
  const language = tutor.conversationLanguage ?? { selection: 'auto' as const, lastReliable: metadataLocale, language: metadataLocale }
  const lessonContext = describeLessonContext(tutor.messages ?? [])
  const connection = useRef<RealtimeCoach | GeminiRealtimeCoach | null>(null)
  const latest = useRef(tutor); latest.current = tutor
  const [error, setError] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [muted, setMuted] = useState(false)
  const studyReference = useNovaStudySession(state => state.progress?.reference)
  const autoVocabulary = useNovaStudySession(state => state.autoWords)
  const [retry, setRetry] = useState(0)
  const [reconnecting, setReconnecting] = useState(false)
  const recovery = useRef({ attempts: 0, since: 0, timer: 0 })
  const [speechSpeed, setSpeechSpeedState] = useState(1.1)
  const speedRef = useRef(speechSpeed); speedRef.current = speechSpeed
  const currentPath = useRef(location.pathname); currentPath.current = location.pathname
  const supported = Boolean(navigator.mediaDevices?.getUserMedia) && (provider === 'gemini'
    ? typeof AudioContext !== 'undefined' && typeof AudioWorkletNode !== 'undefined' && typeof WebSocket !== 'undefined'
    : typeof RTCPeerConnection !== 'undefined')
  const conversationKey = tutor.activeThread?.clientId ?? tutor.activeThreadId

  useEffect(() => {
    if (!enabled) { setError(null); setReconnecting(false); recovery.current.attempts = 0; return }
    if (!enabled || !supported || !tutor.hasPremium || !tutor.user || !tutor.threadsLoaded) return
    let disposed = false
    const userId = tutor.user.id
    const ownerKey = `user:${userId}`
    const locale = language.language
    const previews = new Map<string, AiAssistantMessage>()
    const drafts = new Set<string>()
    let previewTimer = 0
    const reportError = (issue: Error) => {
      if (disposed) return
      const now = Date.now(), current = recovery.current
      if (now - current.since > 60000) { current.attempts = 0; current.since = now }
      const retryable = issue instanceof VoiceStreamError ? issue.retryable
        : issue instanceof ApiError && [502, 503, 504].includes(issue.status) &&
          (!issue.code || ['HTTP_SERVICE_UNAVAILABLE', 'GEMINI_LIVE_CONNECTION_FAILED'].includes(issue.code))
      if (retryable && current.attempts < 2) {
        current.attempts++
        setError(null); setReconnecting(true)
        window.clearTimeout(current.timer)
        current.timer = window.setTimeout(() => { if (!disposed) setRetry(value => value + 1) }, current.attempts * 1000)
      } else { setReconnecting(false); setError(issue.message) }
    }
    const writeMessage = (threadId: string, message: AiAssistantMessage) => {
      const state = useAiAssistantStore.getState()
      const existing = state.threadsByOwner[ownerKey]?.find(thread => thread.id === threadId)?.messages.find(item => item.id === message.id)
      if (existing) state.updateMessage(ownerKey, threadId, message.id, { ...message, createdAt: existing.createdAt })
      else state.pushMessage(ownerKey, threadId, message)
    }
    const connect = async () => {
      latest.current.cancelVoice(); latest.current.cancelSend()
      setError(null); setCaption(''); setMuted(false)
      let threadId = latest.current.activeThreadId ?? await latest.current.createNewChat()
      if (disposed) return
      let savingThread: Promise<boolean> | null = null
      let savingMessages = Promise.resolve()
      const record = (role: 'user' | 'assistant', text: string, id: string, interrupted = false, performance?: NovaPerformance, timeline?: PerformanceCue[], lesson?: import('@/lib/novaLesson').NovaLesson) => {
        if (useAuthStore.getState().user?.id !== userId) return
        if (role === 'user') { latest.current.conversationLanguage?.observe(text); observeNovaStudyPermission(text) }
        if (!text.trim()) {
          previews.delete(`voice-${id}`); drafts.delete(`voice-${id}`)
          useAiAssistantStore.getState().removeMessage(ownerKey, threadId, `voice-${id}`)
          return
        }
        const message: AiAssistantMessage = { id: `voice-${id}`, role, content: text, createdAt: new Date().toISOString(), delivery: 'voice', language: {selection: latest.current.conversationLanguage?.selection ?? 'auto', response: latest.current.conversationLanguage?.language ?? locale, lastReliable: latest.current.conversationLanguage?.lastReliable ?? locale}, ...(lesson ? {lesson} : {}), ...(timeline?.length ? { performanceTimeline: timeline } : {}), ...(performance ? { performance, expression: performance.expression } : {}), ...(interrupted ? { status: 'interrupted' } : {}) }
        previews.delete(message.id); drafts.delete(message.id)
        // Replace a live draft in place and explicitly clear its streaming flag.
        writeMessage(threadId, { ...message, status: interrupted ? 'interrupted' : undefined })
        // Opening a microphone does not create history. Save once an actual
        // transcript arrives, retaining the live connection and queued turns.
        if (threadId.startsWith('local-') && !savingThread) {
          const draftId = threadId
          savingThread = createAiThread(locale).then((saved) => {
            if (useAuthStore.getState().user?.id !== userId) return false
            threadId = saved.id
            useAiAssistantStore.getState().syncThread(ownerKey, draftId, saved)
            if (!disposed) void connection.current?.updateContext({ ...currentNovaStudy(), pathname: currentPath.current, workspace: latest.current.activeWorkspace, language: mode === 'examiner' ? 'en' : language.selection, lastReliableLanguage: language.lastReliable, interfaceLanguage: metadataLocale, inputControl: 'hybrid', lessonContext: describeLessonContext(latest.current.messages), mode,
              threadId: saved.id, coachPreferences: latest.current.coachPreferences, memoryRevision: memoryRevision(latest.current.memories),
              studyContext: describeStudySnapshot(buildStudySnapshot(userId)).slice(0, 16000), screenContext: composeScreenContext('Explain this page', currentPath.current).slice(0, 12000), siteKnowledge: describeRelevantSiteKnowledge('IELTS SAT English admissions tests').slice(0, 16000) }).catch(() => {})
            return true
          }).catch(() => { savingThread = null; return false })
        }
        savingMessages = savingMessages.then(async () => {
          if (savingThread && !await savingThread) return
          if (useAuthStore.getState().user?.id !== userId || threadId.startsWith('local-')) return
          await persistAiMessage(threadId, message, locale, userId)
        }).catch(() => {})
      }
      const thread = useAiAssistantStore.getState().threadsByOwner[ownerKey]?.find((item) => item.id === threadId)
      const VoiceConnection = provider === 'gemini' ? GeminiRealtimeCoach : RealtimeCoach
      const voice = new VoiceConnection({
        lessonControl: action => {
          if (disposed || useAuthStore.getState().user?.id !== userId) return
          const lesson = [...latest.current.messages].reverse().find(message => message.lesson)
          if (lesson) window.dispatchEvent(new CustomEvent('nova:lesson-control', { detail: { target: `voice:${lesson.id}`, action } }))
        },
        speechSpeed: speedRef.current, reconnectAttempt: reconnecting || recovery.current.attempts > 0 ? 1 : 0,
        diagnostics: report => {
          if (useAuthStore.getState().user?.id === userId) void apiClient.post('/ai/voice/diagnostics', report).catch(() => {})
        },
        context: { ...currentNovaStudy(), pathname: currentPath.current, workspace: tutor.activeWorkspace, language: mode === 'examiner' ? 'en' : language.selection, lastReliableLanguage: language.lastReliable, interfaceLanguage: metadataLocale, inputControl: 'hybrid', lessonContext, mode,
          coachPreferences: tutor.coachPreferences, memoryRevision: memoryRevision(tutor.memories),
          threadId: threadId.startsWith('local-') ? undefined : threadId,
          studyContext: describeStudySnapshot(buildStudySnapshot(userId)).slice(0, 16000),
          screenContext: composeScreenContext('Explain this page', location.pathname).slice(0, 12000),
          siteKnowledge: describeRelevantSiteKnowledge('IELTS SAT English admissions tests').slice(0, 16000) },
        history: (thread?.messages ?? []).filter((message) => !message.status).slice(-24).map(({ role, content }) => ({ role, content })),
        state: (state) => {
          if (useAuthStore.getState().user?.id !== userId) return
          useAiAssistantStore.getState().setVoiceState(state)
          if (!disposed && (state === 'speaking' || state === 'listening')) setReconnecting(false)
        },
        expression: (value, responseId) => {
          if (disposed || useAuthStore.getState().user?.id !== userId) return
          const state = useAiAssistantStore.getState()
          const performance = readNovaPerformance(value)
          if (performance) state.setVoicePresentation({ owner: ownerKey, threadId, responseId, performance })
          else if (state.voicePresentation?.owner === ownerKey && state.voicePresentation.responseId === responseId) state.setVoicePresentation(null)
        },
        level: (level) => { if (useAuthStore.getState().user?.id === userId) useAiAssistantStore.getState().setVoiceLevel(level) }, caption: setCaption, message: record,
        preview: (role, text, id) => {
          if (disposed || useAuthStore.getState().user?.id !== userId || !text.trim()) return
          const message: AiAssistantMessage = { id: `voice-${id}`, role, content: text, createdAt: new Date().toISOString(), delivery: 'voice', status: 'streaming' }
          previews.set(message.id, message); drafts.add(message.id)
          // Batch tokens so a speaking turn does not rewrite chat storage for
          // every syllable. Drafts never go to the history API before completion.
          if (!previewTimer) previewTimer = window.setTimeout(() => {
            previewTimer = 0
            if (!disposed && useAuthStore.getState().user?.id === userId) for (const draft of previews.values()) writeMessage(threadId, draft)
            previews.clear()
          }, 80)
        },
        coachResult: (result, id) => {
          if (useAuthStore.getState().user?.id !== userId) return
          record('assistant', result.reply, `coach-${id}`, false, result.performance, undefined, result.lesson)
          if (result.lesson) useAiAssistantStore.getState().updateMessage(ownerKey, threadId, `voice-coach-${id}`, { lesson: result.lesson, language: { selection: language.selection, response: result.replyLanguage ?? language.language, lastReliable: language.lastReliable } })
          latest.current.acceptCoachResult(result)
        },
        error: reportError,
      })
      connection.current = voice
      await voice.start()
    }
    void connect().catch((issue) => reportError(issue instanceof Error ? issue : new Error('Voice could not connect.')))
    return () => {
      disposed = true
      if (useAiAssistantStore.getState().voicePresentation?.owner === ownerKey) useAiAssistantStore.getState().setVoicePresentation(null)
      window.clearTimeout(recovery.current.timer)
      window.clearTimeout(previewTimer)
      connection.current?.stop(); connection.current = null
      // Unfinalized input captions are previews, not saved candidate answers.
      const state = useAiAssistantStore.getState()
      for (const id of drafts) {
        for (const thread of state.threadsByOwner[ownerKey] ?? []) state.removeMessage(ownerKey, thread.id, id)
      }
    }
    // The session survives route and spoken-language changes. Mode and account
    // changes deliberately create a new session with matching instructions.
  }, [enabled, supported, tutor.hasPremium, tutor.user?.id, conversationKey, tutor.threadsLoaded, mode, provider, retry, language.selection])

  useEffect(() => {
    if (!enabled || !tutor.user) return
    const timer = window.setTimeout(() => {
      void connection.current?.updateContext({ ...currentNovaStudy(), pathname: location.pathname, workspace: tutor.activeWorkspace, language: mode === 'examiner' ? 'en' : language.selection, lastReliableLanguage: language.lastReliable, interfaceLanguage: metadataLocale, inputControl: 'hybrid', lessonContext, mode,
        coachPreferences: tutor.coachPreferences, memoryRevision: memoryRevision(tutor.memories),
        studyContext: describeStudySnapshot(buildStudySnapshot(tutor.user!.id)).slice(0, 16000), screenContext: composeScreenContext('Explain this page', location.pathname).slice(0, 12000), siteKnowledge: describeRelevantSiteKnowledge('IELTS SAT English admissions tests').slice(0, 16000) }).catch(() => {})
    }, 600)
    return () => window.clearTimeout(timer)
  }, [enabled, location.pathname, tutor.user?.id, tutor.activeWorkspace, tutor.coachPreferences, tutor.memories, language.selection, language.lastReliable, lessonContext, mode, studyReference, autoVocabulary])

  const toggleMute = useCallback(() => setMuted((current) => { connection.current?.mute(!current); return !current }), [])
  useEffect(() => {
    let sourceOwns = false
    const interrupt = () => connection.current?.interrupt()
    const ownership = (event: Event) => {
      const value = (event as CustomEvent).detail
      if (value === 'original') { sourceOwns = true; connection.current?.interrupt(); connection.current?.mute(true) }
      else if (sourceOwns) { sourceOwns = false; connection.current?.mute(muted) }
    }
    window.addEventListener('nova:interrupt', interrupt); window.addEventListener('nova:audio-owner', ownership)
    return () => { window.removeEventListener('nova:interrupt', interrupt); window.removeEventListener('nova:audio-owner', ownership); if (sourceOwns) connection.current?.mute(muted) }
  }, [muted])
  const interrupt = useCallback(() => connection.current?.interrupt(), [])
  const beginPushToTalk = useCallback(() => connection.current?.beginPushToTalk(), [])
  const endPushToTalk = useCallback((cancel = false) => connection.current?.endPushToTalk(cancel), [])
  const setMicrophoneMuted = useCallback((value: boolean) => { connection.current?.mute(value); setMuted(value) }, [])
  const ask = useCallback((text: string) => connection.current?.ask(text), [])
  const reconnect = useCallback(() => { recovery.current.attempts = 0; window.clearTimeout(recovery.current.timer); setReconnecting(true); setRetry(current => current + 1) }, [])
  const stop = useCallback(() => { window.clearTimeout(recovery.current.timer); setReconnecting(false); connection.current?.stop() }, [])
  const requestFeedback = useCallback(() => connection.current?.requestFeedback(), [])
  const setSpeechSpeed = useCallback((speed: number) => {
    const bounded = Math.max(0.75, Math.min(1.35, speed))
    if (!Number.isFinite(bounded)) return
    setSpeechSpeedState(bounded)
    connection.current?.setSpeechSpeed(bounded)
  }, [])
  return { ask, beginPushToTalk, endPushToTalk, setMicrophoneMuted, error, reconnecting, caption, muted, supported, toggleMute, interrupt, reconnect, stop, requestFeedback, speechSpeed, setSpeechSpeed }
}
