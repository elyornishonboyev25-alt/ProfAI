import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useAiAssistantStore, type AiAssistantMessage } from '@/store/aiAssistantStore'
import { hasPremiumAccess } from '@/utils/premiumAccess'
import { chatWithAssistant, type GeminiChatAction } from '@/services/geminiAI'
import {
  buildStudySnapshot,
  describeStudySnapshot,
  resolveStudyTest,
  type StudySnapshot,
} from '@/services/ai/studyContext'
import { composeScreenContext } from '@/services/ai/screenCapture'
import { compressImageToDataUrl } from '@/utils/imageCompress'
import { useSpeechRecognition, speak, cancelSpeech, isSpeechSynthesisSupported } from '@/lib/speech'
import { createMicMeter, type MicMeter } from '@/lib/audioMeter'
import type { AiPreferences, ChatLocale } from '@/types/platform'

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

function containsAny(input: string, tokens: string[]) {
  return tokens.some((token) => input.includes(token))
}

function detectLocaleFromMessage(message: string, fallback: ChatLocale): ChatLocale {
  const normalized = message.toLowerCase()
  if (
    containsAny(normalized, [
      'salom', 'rahmat', 'iltimos', 'ochib ber', 'menga', 'savol', 'lugat', 'imtihon',
      'yozing', 'ochildi', 'oquv', 'gaplash', 'qanday', 'qil', 'och', 'yordam', 'kerak', 'tushuntir',
    ])
  ) {
    return 'uz'
  }
  if (containsAny(normalized, ['hello', 'open', 'reading', 'listening', 'practice', 'exam', 'how', 'what', 'help'])) {
    return 'en'
  }
  return fallback
}

// Strip emoji / markdown so the spoken reply sounds natural.
function cleanForSpeech(text: string) {
  return text
    .replace(/[*_`#>]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const sttLangFor = (locale: ChatLocale) => (locale === 'uz' ? 'uz-UZ' : 'en-US')

export type SendOptions = { text?: string; images?: string[]; speak?: boolean }

export function useAiTutor() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const hasPremium = hasPremiumAccess(user)

  const messages = useAiAssistantStore((s) => s.messages)
  const isSending = useAiAssistantStore((s) => s.isSending)
  const error = useAiAssistantStore((s) => s.error)
  const voiceState = useAiAssistantStore((s) => s.voiceState)
  const voiceLevel = useAiAssistantStore((s) => s.voiceLevel)
  const setSending = useAiAssistantStore((s) => s.setSending)
  const setError = useAiAssistantStore((s) => s.setError)
  const pushMessage = useAiAssistantStore((s) => s.pushMessage)
  const clearMessages = useAiAssistantStore((s) => s.clearMessages)
  const setVoiceState = useAiAssistantStore((s) => s.setVoiceState)
  const setVoiceLevel = useAiAssistantStore((s) => s.setVoiceLevel)

  const [draft, setDraft] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [preferredLocale, setPreferredLocale] = useState<ChatLocale>('en')
  const [preferredName, setPreferredName] = useState<string | null>(null)

  const ttsSupported = isSpeechSynthesisSupported()
  const recognition = useSpeechRecognition(sttLangFor(preferredLocale))
  // When true, the final transcript is auto-sent + spoken when listening stops.
  const voiceTurnRef = useRef(false)
  const levelTimerRef = useRef<number | null>(null)
  // Real microphone metering + hands-free silence detection.
  const meterRef = useRef<MicMeter | null>(null)
  const rafRef = useRef<number | null>(null)
  const autoStopRef = useRef<(() => void) | null>(null)

  // Load the learner's preferred language + name once.
  useEffect(() => {
    if (!user || !hasPremium) return
    let mounted = true
    void apiClient
      .get<AiPreferences>('/profile/ai-preferences')
      .then((prefs) => {
        if (!mounted) return
        setPreferredLocale(prefs.preferredLocale.toLowerCase().startsWith('uz') ? 'uz' : 'en')
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

  const startListeningMeter = useCallback(async () => {
    try {
      const meter = await createMicMeter()
      meterRef.current = meter
      let spoke = false
      let lastLoud = Date.now()
      const tick = () => {
        if (!meterRef.current) return
        const level = meterRef.current.getLevel()
        setVoiceLevel(level)
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
      return true
    } catch {
      return false
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

      setDraft('')
      setImages([])
      setError(null)
      setSending(true)
      setVoiceState('thinking')

      const userMessage = createMessage('user', text, outImages.length ? outImages : undefined)
      pushMessage(userMessage)

      const history = [...messages, userMessage]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const currentLocale = detectLocaleFromMessage(text, preferredLocale)
      setPreferredLocale(currentLocale)

      const snapshot = buildStudySnapshot(user?.id ?? null)
      const screenContext = composeScreenContext(text, location.pathname)

      try {
        const response = await chatWithAssistant(text, history, location.pathname, {
          studyContext: describeStudySnapshot(snapshot),
          learnerName: preferredName,
          screenContext,
          images: outImages,
        })
        pushMessage(createMessage('assistant', response.reply))

        // Speak the reply back in voice / talk turns; otherwise return to idle.
        if (options.speak && ttsSupported && response.reply.trim()) {
          setVoiceState('speaking')
          startLevelPulse()
          speak(cleanForSpeech(response.reply), {
            onEnd: () => {
              stopLevelPulse()
              setVoiceState('idle')
            },
          })
        } else {
          setVoiceState('idle')
        }

        if (response.actions.length > 0) {
          window.setTimeout(() => {
            for (const action of response.actions) dispatchAction(action, snapshot)
          }, 600)
        }
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Unable to process your request.'
        setError(message)
        setVoiceState('idle')
        stopLevelPulse()
        pushMessage(
          createMessage(
            'assistant',
            preferredLocale === 'uz'
              ? "Kechirasiz, hozir ulanishda muammo bo'ldi. Iltimos, qayta urinib ko'ring."
              : 'Sorry, I had a connection issue just now. Please try again.',
          ),
        )
      } finally {
        setSending(false)
      }
    },
    [
      draft, images, isSending, messages, preferredLocale, preferredName, location.pathname, user?.id,
      ttsSupported, setDraft, setError, setSending, setVoiceState, pushMessage, dispatchAction,
      startLevelPulse, stopLevelPulse,
    ],
  )

  // ── Voice control ──────────────────────────────────────────────────────────
  const startVoice = useCallback(() => {
    cancelSpeech()
    stopLevelPulse()
    recognition.reset()
    voiceTurnRef.current = true
    setVoiceState('listening')
    recognition.start()
    // Prefer real mic amplitude; fall back to a synthetic pulse if denied.
    void startListeningMeter().then((ok) => {
      if (!ok) startLevelPulse()
    })
  }, [recognition, setVoiceState, startListeningMeter, startLevelPulse, stopLevelPulse])

  const stopVoice = useCallback(() => {
    recognition.stop()
    stopListeningMeter()
    stopLevelPulse()
    // Final words may still be in the interim buffer at the moment of stopping.
    const transcript = (recognition.finalTranscript || recognition.interimTranscript).trim()
    if (voiceTurnRef.current && transcript) {
      voiceTurnRef.current = false
      void send({ text: transcript, speak: true })
    } else {
      voiceTurnRef.current = false
      setVoiceState('idle')
    }
  }, [recognition, send, setVoiceState, stopLevelPulse, stopListeningMeter])

  // Keep the silence-detector pointed at the latest stopVoice.
  useEffect(() => {
    autoStopRef.current = stopVoice
  }, [stopVoice])

  const stopSpeaking = useCallback(() => {
    cancelSpeech()
    stopLevelPulse()
    setVoiceState('idle')
  }, [setVoiceState, stopLevelPulse])

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
    clearMessages()
  }, [clearMessages, setVoiceState, stopLevelPulse, stopListeningMeter])

  return {
    user,
    hasPremium,
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
    preferredLocale,
    preferredName,
    // voice
    voiceState,
    voiceLevel,
    voiceSupported: recognition.supported,
    ttsSupported,
    isListening: recognition.listening,
    interimTranscript: recognition.interimTranscript,
    startVoice,
    stopVoice,
    stopSpeaking,
  }
}

export type AiTutorController = ReturnType<typeof useAiTutor>
