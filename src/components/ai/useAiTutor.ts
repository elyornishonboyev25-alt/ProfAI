import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import {
  useAiAssistantStore,
  type AiAssistantMessage,
  type AiAssistantThread,
  type AiMemoryItem,
} from '@/store/aiAssistantStore'
import { hasPremiumAccess } from '@/utils/premiumAccess'
import { chatWithAssistant, type GeminiChatAction } from '@/services/geminiAI'
import {
  buildStudySnapshot,
  describeStudySnapshot,
  resolveStudyTest,
  type StudySnapshot,
} from '@/services/ai/studyContext'
import { composeScreenContext } from '@/services/ai/screenCapture'
import { describeRelevantSiteKnowledge } from '@/services/ai/siteKnowledge'
import { getAiWorkspace } from '@/services/ai/workspaces'
import { compressImageToDataUrl } from '@/utils/imageCompress'
import {
  useSpeechRecognition,
  speak,
  cancelSpeech,
  isSpeechSynthesisSupported,
  speechLangToBcp47,
  type SpeechLang,
} from '@/lib/speech'
import { createMicMeter, type MicMeter } from '@/lib/audioMeter'
import type { AiPreferences, ChatLocale } from '@/types/platform'
import {
  createAiThread,
  deleteAiMemory,
  deleteAiThread,
  fetchAiMemories,
  fetchAiThreads,
  persistAiMemories,
  persistAiMessage,
  renameAiThread,
} from '@/services/aiWorkspacePersistence'

const EMPTY_MESSAGES: AiAssistantMessage[] = []
const EMPTY_THREADS: AiAssistantThread[] = []
const EMPTY_MEMORIES: AiMemoryItem[] = []

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `msg-${Date.now()}-${Math.round(Math.random() * 1000)}`
}

function createMessage(
  role: AiAssistantMessage['role'],
  content: string,
  images?: string[],
): AiAssistantMessage {
  return { id: createId(), role, content, createdAt: new Date().toISOString(), images }
}

function createOfflineThread(language: SpeechLang): AiAssistantThread {
  const now = new Date().toISOString()
  return {
    id: `local-${createId()}`,
    title: language === 'uz' ? 'Yangi chat' : language === 'ru' ? 'Новый чат' : 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
    synced: false,
  }
}

// Strip emoji / markdown so the spoken reply sounds natural.
function cleanForSpeech(text: string) {
  return text
    .replace(/[*_`#>]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type SendOptions = { text?: string; images?: string[]; speak?: boolean }

export type PendingAiAction = {
  id: string
  action: GeminiChatAction
  label: string
}

function describeAction(action: GeminiChatAction, locale: ChatLocale): string {
  const uz = locale === 'uz'
  if (action.type === 'open_test') {
    const track = action.payload?.track === 'listening' ? 'Listening' : 'Reading'
    return uz ? `${track} testini ochish` : `Open ${track} test`
  }
  if (action.type === 'open_writing_test') return uz ? 'Writing testini ochish' : 'Open Writing test'
  if (action.type === 'start_mock') {
    const mock = action.payload?.mock?.toUpperCase() ?? 'IELTS'
    return uz ? `${mock} mock imtihonini boshlash` : `Start ${mock} mock exam`
  }
  return uz ? 'Tavsiya qilingan sahifani ochish' : 'Open the suggested page'
}

export function useAiTutor() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const hasPremium = hasPremiumAccess(user)
  const ownerKey = user?.id ? `user:${user.id}` : 'guest'

  const chatThreads = useAiAssistantStore((s) => s.threadsByOwner[ownerKey] ?? EMPTY_THREADS)
  const activeThreadId = useAiAssistantStore((s) => s.activeThreadIds[ownerKey] ?? null)
  const threadsLoading = useAiAssistantStore((s) => s.threadsLoading[ownerKey] ?? false)
  const threadsLoaded = useAiAssistantStore((s) => s.threadsLoaded[ownerKey] ?? false)
  const memories = useAiAssistantStore((s) => s.memoriesByOwner[ownerKey] ?? EMPTY_MEMORIES)
  const activeThread = chatThreads.find((thread) => thread.id === activeThreadId) ?? null
  const messages = activeThread?.messages ?? EMPTY_MESSAGES
  const isSending = useAiAssistantStore((s) => s.isSending)
  const error = useAiAssistantStore((s) => s.error)
  const voiceState = useAiAssistantStore((s) => s.voiceState)
  const voiceLevel = useAiAssistantStore((s) => s.voiceLevel)
  const activeWorkspace = useAiAssistantStore((s) => s.activeWorkspace)
  const setSending = useAiAssistantStore((s) => s.setSending)
  const setError = useAiAssistantStore((s) => s.setError)
  const pushStoredMessage = useAiAssistantStore((s) => s.pushMessage)
  const setThreadLoading = useAiAssistantStore((s) => s.setThreadLoading)
  const setThreads = useAiAssistantStore((s) => s.setThreads)
  const addThread = useAiAssistantStore((s) => s.addThread)
  const setActiveThread = useAiAssistantStore((s) => s.setActiveThread)
  const renameStoredThread = useAiAssistantStore((s) => s.renameThread)
  const removeStoredThread = useAiAssistantStore((s) => s.removeThread)
  const setStoredMemories = useAiAssistantStore((s) => s.setMemories)
  const upsertStoredMemories = useAiAssistantStore((s) => s.upsertMemories)
  const removeStoredMemory = useAiAssistantStore((s) => s.removeMemory)
  const setVoiceState = useAiAssistantStore((s) => s.setVoiceState)
  const setVoiceLevel = useAiAssistantStore((s) => s.setVoiceLevel)
  const voiceLang = useAiAssistantStore((s) => s.voiceLang)
  const setStoredVoiceLang = useAiAssistantStore((s) => s.setVoiceLang)

  const [draft, setDraft] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [preferredLocale, setPreferredLocale] = useState<ChatLocale>('en')
  const [preferredName, setPreferredName] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [pendingActions, setPendingActions] = useState<PendingAiAction[]>([])
  const pushMessage = useCallback(
    (threadId: string, message: AiAssistantMessage) => pushStoredMessage(ownerKey, threadId, message),
    [ownerKey, pushStoredMessage],
  )

  const ttsSupported = isSpeechSynthesisSupported()
  const recognition = useSpeechRecognition(speechLangToBcp47(voiceLang))
  // When true, the final transcript is auto-sent + spoken when listening stops.
  const voiceTurnRef = useRef(false)
  const levelTimerRef = useRef<number | null>(null)
  // Real microphone metering + hands-free silence detection.
  const meterRef = useRef<MicMeter | null>(null)
  const rafRef = useRef<number | null>(null)
  const autoStopRef = useRef<(() => void) | null>(null)
  const stoppingVoiceRef = useRef(false)
  const workspace = getAiWorkspace(activeWorkspace)

  // Hydrate account-private chat history and long-term memory once. Multiple
  // mounted tutor surfaces share the same store, so the loading flag de-duplicates
  // requests from the floating chat, full page, and talk overlay.
  useEffect(() => {
    if (!user || !hasPremium || threadsLoaded || threadsLoading) return
    setThreadLoading(ownerKey, true)

    void Promise.all([fetchAiThreads(), fetchAiMemories()])
      .then(async ([loadedThreads, loadedMemories]) => {
        let nextThreads = loadedThreads
        if (nextThreads.length === 0) nextThreads = [await createAiThread(voiceLang)]
        setThreads(ownerKey, nextThreads)
        setStoredMemories(ownerKey, loadedMemories)
      })
      .catch(() => {
        if (chatThreads.length === 0) addThread(ownerKey, createOfflineThread(voiceLang))
        setThreadLoading(ownerKey, false)
      })
  }, [
    addThread,
    chatThreads.length,
    hasPremium,
    ownerKey,
    setStoredMemories,
    setThreadLoading,
    setThreads,
    threadsLoaded,
    threadsLoading,
    user,
    voiceLang,
  ])

  const createNewChat = useCallback(async (): Promise<string> => {
    setPendingActions([])
    setError(null)
    try {
      const thread = await createAiThread(voiceLang)
      addThread(ownerKey, thread)
      return thread.id
    } catch {
      const thread = createOfflineThread(voiceLang)
      addThread(ownerKey, thread)
      return thread.id
    }
  }, [addThread, ownerKey, setError, voiceLang])

  const selectChat = useCallback((threadId: string) => {
    cancelSpeech()
    setPendingActions([])
    setActiveThread(ownerKey, threadId)
  }, [ownerKey, setActiveThread])

  const renameChat = useCallback(async (threadId: string, title: string) => {
    const normalized = title.replace(/\s+/g, ' ').trim().slice(0, 80)
    if (!normalized) return
    renameStoredThread(ownerKey, threadId, normalized)
    const thread = chatThreads.find((item) => item.id === threadId)
    if (thread?.synced) await renameAiThread(threadId, normalized).catch(() => null)
  }, [chatThreads, ownerKey, renameStoredThread])

  const deleteChat = useCallback(async (threadId: string) => {
    const thread = chatThreads.find((item) => item.id === threadId)
    removeStoredThread(ownerKey, threadId)
    if (thread?.synced) await deleteAiThread(threadId).catch(() => null)
    if (chatThreads.length <= 1) await createNewChat()
  }, [chatThreads, createNewChat, ownerKey, removeStoredThread])

  const forgetMemory = useCallback(async (memoryId: string) => {
    removeStoredMemory(ownerKey, memoryId)
    await deleteAiMemory(memoryId).catch(() => null)
  }, [ownerKey, removeStoredMemory])

  // Load the learner's preferred language + name once.
  useEffect(() => {
    if (!user || !hasPremium) return
    let mounted = true
    void apiClient
      .get<AiPreferences>('/profile/ai-preferences')
      .then((prefs) => {
        if (!mounted) return
        const locale = prefs.preferredLocale.toLowerCase().startsWith('uz') ? 'uz' : 'en'
        setPreferredLocale(locale)
        if (prefs.preferredName) setPreferredName(prefs.preferredName)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [hasPremium, user])

  // Smooth pseudo-amplitude that makes the orb pulse while listening/speaking.
  const startLevelPulse = useCallback(() => {
    if (levelTimerRef.current) return
    let current = 0
    levelTimerRef.current = window.setInterval(() => {
      const target = 0.25 + Math.random() * 0.7
      current += (target - current) * 0.4
      setVoiceLevel(current)
    }, 90)
  }, [setVoiceLevel])

  const stopLevelPulse = useCallback(() => {
    if (levelTimerRef.current) {
      window.clearInterval(levelTimerRef.current)
      levelTimerRef.current = null
    }
    setVoiceLevel(0)
  }, [setVoiceLevel])

  // Real mic metering: drives the orb from the learner's actual voice and auto-stops
  // the turn after a short silence (hands-free). Returns false if the mic is unavailable
  // so the caller can fall back to the synthetic pulse.
  const stopListeningMeter = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (meterRef.current) {
      meterRef.current.stop()
      meterRef.current = null
    }
  }, [])

  const startListeningMeter = useCallback(async (): Promise<{ ok: true } | { ok: false; error: unknown }> => {
    try {
      const meter = await createMicMeter()
      meterRef.current = meter
      let spoke = false
      let lastLoud = Date.now()
      let lastVisualUpdate = 0
      const tick = (now: number) => {
        if (!meterRef.current) return
        const level = meterRef.current.getLevel()
        if (now - lastVisualUpdate >= 50) {
          setVoiceLevel(level)
          lastVisualUpdate = now
        }
        if (level > 0.14) {
          spoke = true
          lastLoud = Date.now()
        }
        if (spoke && Date.now() - lastLoud > 1700) {
          autoStopRef.current?.()
          return
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      return { ok: true }
    } catch (error) {
      return { ok: false, error }
    }
  }, [setVoiceLevel])

  useEffect(
    () => () => {
      stopLevelPulse()
      stopListeningMeter()
    },
    [stopLevelPulse, stopListeningMeter],
  )

  const dispatchAction = useCallback(
    (action: GeminiChatAction, snapshot?: StudySnapshot) => {
      if (action.type === 'navigate' && action.target) {
        navigate(action.target)
        return
      }
      if (action.type === 'open_writing_test' && action.payload?.testId) {
        navigate(`/ielts/writing/test/${action.payload.testId}`, {
          state: {
            autoStart: true,
            timerEnabled: action.payload.timerEnabled ?? true,
            durationMinutes: action.payload.durationMinutes,
          },
        })
        return
      }
      if (action.type === 'start_mock') {
        navigate(action.payload?.mock === 'sat' ? '/mock/sat' : '/mock/ielts')
        return
      }
      if (action.type === 'open_test' && action.payload?.track) {
        const snap = snapshot ?? buildStudySnapshot(user?.id ?? null)
        const track = action.payload.track
        const entry = resolveStudyTest(snap, track, {
          testId: action.payload.testId,
          ordinal: action.payload.ordinal,
          unfinished: action.payload.unfinished,
        })
        if (!entry) {
          navigate(`/ielts/${track}/tests`, { state: { entry: 'ielts-catalog' } })
          return
        }
        const timerEnabled = action.payload.timerEnabled ?? false
        const launchPreset = timerEnabled
          ? { mode: 'simulation' as const, durationMinutes: action.payload.durationMinutes }
          : { mode: 'practice' as const }
        navigate(`/test/${track}/${entry.testId}`, { state: { entry: 'ielts-catalog', launchPreset } })
      }
    },
    [navigate, user?.id],
  )

  const send = useCallback(
    async (options: SendOptions = {}) => {
      const text = (options.text ?? draft).trim()
      const outImages = options.images ?? images
      if ((!text && outImages.length === 0) || isSending) return
      const threadId = activeThreadId ?? await createNewChat()
      const firstTurn = messages.length === 0

      setDraft('')
      setImages([])
      setError(null)
      setSending(true)
      setVoiceState('thinking')

      const userMessage = createMessage('user', text, outImages.length ? outImages : undefined)
      pushMessage(threadId, userMessage)
      const userPersistPromise = threadId.startsWith('local-')
        ? Promise.resolve(null)
        : persistAiMessage(threadId, userMessage, voiceLang).catch(() => null)

      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const currentLocale: ChatLocale = voiceLang === 'uz' ? 'uz' : 'en'
      setPreferredLocale(currentLocale)

      const snapshot = buildStudySnapshot(user?.id ?? null)
      const screenContext = composeScreenContext(text, location.pathname)
      const siteKnowledge = describeRelevantSiteKnowledge(text)

      try {
        const response = await chatWithAssistant(text, history, location.pathname, {
          studyContext: describeStudySnapshot(snapshot),
          learnerName: preferredName,
          screenContext,
          workspaceContext: `${workspace.title}: ${workspace.prompt}`,
          siteKnowledge,
          images: outImages,
          responseLanguage: voiceLang,
          memories: memories.map(({ key, value }) => ({ key, value })),
          generateTitle: firstTurn,
        })
        const assistantMessage = createMessage('assistant', response.reply)
        pushMessage(threadId, assistantMessage)
        await userPersistPromise
        if (!threadId.startsWith('local-')) {
          void persistAiMessage(threadId, assistantMessage, voiceLang).catch(() => null)
        }

        if (firstTurn && response.title) void renameChat(threadId, response.title)
        if (response.memoryUpdates.length > 0) {
          try {
            const saved = await persistAiMemories(response.memoryUpdates)
            upsertStoredMemories(ownerKey, saved)
          } catch {
            const now = new Date().toISOString()
            upsertStoredMemories(
              ownerKey,
              response.memoryUpdates.map((memory) => ({
                id: `local-memory-${memory.key}`,
                ...memory,
                createdAt: now,
                updatedAt: now,
              })),
            )
          }
        }

        // The selected language controls the reply, microphone, and TTS together.
        // Do not auto-switch it after a response: EN / UZ / RU is an explicit choice.
        if (options.speak && ttsSupported && response.reply.trim()) {
          setVoiceState('speaking')
          startLevelPulse()
          speak(cleanForSpeech(response.reply), {
            lang: voiceLang,
            rate: voiceLang === 'en' ? 1 : 0.96,
            onEnd: () => {
              stopLevelPulse()
              setVoiceState('idle')
            },
          })
        } else {
          setVoiceState('idle')
        }

        // Navigation and test launches always remain under the learner's control.
        // The UI renders explicit Allow / Dismiss buttons beneath the answer.
        setPendingActions(
          response.actions.slice(0, 3).map((action) => ({
            id: createId(),
            action,
            label: describeAction(action, currentLocale),
          })),
        )
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Unable to process your request.'
        setError(message)
        setVoiceState('idle')
        stopLevelPulse()
        const fallbackMessage = createMessage(
          'assistant',
          voiceLang === 'uz'
            ? "Kechirasiz, hozir ulanishda muammo bo'ldi. Iltimos, qayta urinib ko'ring."
            : voiceLang === 'ru'
              ? 'Извините, сейчас возникла проблема с подключением. Пожалуйста, попробуйте ещё раз.'
              : 'Sorry, I had a connection issue just now. Please try again.',
        )
        pushMessage(threadId, fallbackMessage)
        await userPersistPromise
        if (!threadId.startsWith('local-')) {
          void persistAiMessage(threadId, fallbackMessage, voiceLang).catch(() => null)
        }
      } finally {
        setSending(false)
      }
    },
    [
      activeThreadId, createNewChat, draft, images, isSending, memories, messages, ownerKey, preferredName,
      location.pathname, user?.id,
      ttsSupported, setDraft, setError, setSending, setVoiceState, pushMessage, dispatchAction,
      renameChat, startLevelPulse, stopLevelPulse, upsertStoredMemories, voiceLang, workspace,
    ],
  )

  const setVoiceLang = useCallback((language: SpeechLang) => {
    cancelSpeech()
    stopLevelPulse()
    setVoiceState('idle')
    setVoiceError(null)
    setStoredVoiceLang(language)
    setPreferredLocale(language === 'uz' ? 'uz' : 'en')
  }, [setStoredVoiceLang, setVoiceState, stopLevelPulse])

  // ── Voice control ──────────────────────────────────────────────────────────
  const startVoice = useCallback(async () => {
    cancelSpeech()
    stopLevelPulse()
    stopListeningMeter()
    recognition.reset()
    setVoiceError(null)
    stoppingVoiceRef.current = false
    voiceTurnRef.current = true
    if (!recognition.supported) {
      setVoiceError('Voice input requires Chrome or Edge with microphone access.')
      voiceTurnRef.current = false
      return
    }

    // Request real microphone access first. This gives us a reliable permission/device
    // result instead of showing a listening animation while capture is actually blocked.
    const meterResult = await startListeningMeter()
    if (!meterResult.ok) {
      const errorName = meterResult.error instanceof DOMException ? meterResult.error.name : ''
      const uz = preferredLocale === 'uz'
      const detail =
        errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError'
          ? (uz ? 'Mikrofon topilmadi. Qurilmani ulang va qayta urinib ko‘ring.' : 'No microphone was found. Connect one and try again.')
          : errorName === 'NotReadableError' || errorName === 'TrackStartError'
            ? (uz ? 'Mikrofon boshqa dastur tomonidan band. Uni yoping va qayta urinib ko‘ring.' : 'The microphone is busy in another app. Close it there and try again.')
            : errorName === 'SecurityError' || !window.isSecureContext
              ? (uz ? 'Mikrofon faqat HTTPS yoki localhost orqali ishlaydi.' : 'Microphone access requires HTTPS or localhost.')
              : (uz
                  ? 'Mikrofonga ruxsat bloklangan. Manzil satridagi qulf belgisidan Microphone → Allow ni tanlang.'
                  : 'Microphone permission is blocked. Use the lock icon in the address bar and set Microphone to Allow.')
      setVoiceError(detail)
      voiceTurnRef.current = false
      setVoiceState('idle')
      return
    }

    setVoiceState('listening')
    recognition.start()
  }, [preferredLocale, recognition, setVoiceState, startListeningMeter, stopLevelPulse, stopListeningMeter])

  const stopVoice = useCallback(async () => {
    if (stoppingVoiceRef.current) return
    stoppingVoiceRef.current = true
    stopListeningMeter()
    stopLevelPulse()
    setVoiceState('thinking')
    // Wait for SpeechRecognition.onend: Chrome emits the final phrase after stop().
    const transcript = (await recognition.stop()).trim()
    if (voiceTurnRef.current && transcript) {
      voiceTurnRef.current = false
      void send({ text: transcript, speak: true })
    } else {
      voiceTurnRef.current = false
      setVoiceState('idle')
      if (!recognition.error) {
        setVoiceError(
          preferredLocale === 'uz'
            ? "Ovoz aniqlanmadi. Mikrofonga yaqinroq gapirib, yana urinib ko'ring."
            : 'No speech was detected. Try again and speak a little closer to the microphone.',
        )
      }
    }
    stoppingVoiceRef.current = false
  }, [preferredLocale, recognition, send, setVoiceState, stopLevelPulse, stopListeningMeter])

  useEffect(() => {
    if (!recognition.error) return
    setVoiceError(recognition.error)
    setVoiceState('idle')
    stopListeningMeter()
    stopLevelPulse()
  }, [recognition.error, setVoiceState, stopLevelPulse, stopListeningMeter])

  // Keep the silence-detector pointed at the latest stopVoice.
  useEffect(() => {
    autoStopRef.current = stopVoice
  }, [stopVoice])

  const stopSpeaking = useCallback(() => {
    cancelSpeech()
    stopLevelPulse()
    setVoiceState('idle')
  }, [setVoiceState, stopLevelPulse])

  const cancelVoice = useCallback(() => {
    voiceTurnRef.current = false
    stoppingVoiceRef.current = true
    cancelSpeech()
    stopListeningMeter()
    stopLevelPulse()
    void recognition.stop().catch(() => '')
    setVoiceState('idle')
  }, [recognition, setVoiceState, stopLevelPulse, stopListeningMeter])

  // ── Images ─────────────────────────────────────────────────────────────────
  const addImages = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    for (const file of list.slice(0, 4)) {
      try {
        // Reuse the avatar compressor but keep more detail for screenshots.
        const dataUrl = await compressImageToDataUrl(file, { size: 1024, quality: 0.8 })
        setImages((prev) => [...prev, dataUrl].slice(0, 4))
      } catch {
        setError('That image could not be read. Try a different one.')
      }
    }
  }, [setError])

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clear = useCallback(() => {
    cancelSpeech()
    stopLevelPulse()
    stopListeningMeter()
    setVoiceState('idle')
    setImages([])
    setPendingActions([])
    setVoiceError(null)
    void createNewChat()
  }, [createNewChat, setVoiceState, stopLevelPulse, stopListeningMeter])

  const approveAction = useCallback((id: string) => {
    setPendingActions((current) => {
      const pending = current.find((item) => item.id === id)
      if (pending) dispatchAction(pending.action)
      return current.filter((item) => item.id !== id)
    })
  }, [dispatchAction])

  const dismissAction = useCallback((id: string) => {
    setPendingActions((current) => current.filter((item) => item.id !== id))
  }, [])

  return {
    user,
    hasPremium,
    chatThreads,
    activeThread,
    activeThreadId,
    threadsLoading,
    memories,
    messages,
    isSending,
    error,
    draft,
    setDraft,
    images,
    addImages,
    removeImage,
    send,
    clear,
    createNewChat,
    selectChat,
    renameChat,
    deleteChat,
    forgetMemory,
    preferredLocale,
    preferredName,
    activeWorkspace,
    workspace,
    pendingActions,
    approveAction,
    dismissAction,
    // voice
    voiceState,
    voiceLevel,
    voiceLang,
    setVoiceLang,
    voiceSupported: recognition.supported,
    voiceError,
    ttsSupported,
    isListening: recognition.listening,
    interimTranscript: recognition.interimTranscript,
    startVoice,
    stopVoice,
    stopSpeaking,
    cancelVoice,
  }
}

export type AiTutorController = ReturnType<typeof useAiTutor>
