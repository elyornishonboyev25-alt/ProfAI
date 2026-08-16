import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  BookOpenText,
  Bot,
  ChartColumnIncreasing,
  Languages,
  Mic,
  MicOff,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiClient } from '@/lib/apiClient'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import type {
  AiChatResponse,
  AiRealtimeSessionResponse,
  AiPreferences,
  AiReportResponse,
  ProfileOverview,
  SpeakingQuestionItem,
  SpeakingEvaluationResponse,
  VocabularyNotebook,
  VocabularyNotebookItem,
} from '@/types/platform'
import AIChatWindow from '@/components/ai/AIChatWindow'

type LoadState = 'loading' | 'ready' | 'error'

type SpeechLikeRecognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function createLocalId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function isMostlyEnglishText(input: string) {
  const text = input.trim()
  const latin = (text.match(/[A-Za-z]/g) ?? []).length
  const letters = (text.match(/[A-Za-zА-Яа-я]/g) ?? []).length
  if (letters === 0) return false
  return latin / letters >= 0.6
}

function skillPowerToBand(skillPower: number) {
  return Number(clamp(4 + skillPower * 0.05, 4, 9).toFixed(1))
}

async function retryWithBackoff<T>(task: () => Promise<T>, retries = 1, delayMs = 220): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      lastError = error
      if (attempt === retries) break
      await new Promise((resolve) => window.setTimeout(resolve, delayMs * (attempt + 1)))
    }
  }
  throw lastError
}

function toNotebookTitle(testKey: string) {
  return testKey
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const routeTargetMap = {
  DASHBOARD: '/dashboard',
  TEST_LIBRARY: '/tests',
  SAT_PREP: '/sat',
  IELTS_PREP: '/ielts',
  VOCABULARY: '/vocabulary',
  MOCK: '/mock',
  LEADERBOARD: '/leaderboard',
  AI_ANALYSIS: '/ai-coach',
  ACCOUNT: '/account',
} as const

export default function AiCoach() {
  const { minimalMotion } = useMotionPreferences()
  const navigate = useNavigate()
  const location = useLocation()
  const setReportSnapshot = useAiAssistantStore((state) => state.setReportSnapshot)

  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [overview, setOverview] = useState<ProfileOverview | null>(null)
  const [report, setReport] = useState<AiReportResponse | null>(null)
  const [preferences, setPreferences] = useState<AiPreferences | null>(null)
  const [notebooks, setNotebooks] = useState<VocabularyNotebook[]>([])
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null)
  const [testKeyInput, setTestKeyInput] = useState('reading-full-test-1')
  const [itemTerm, setItemTerm] = useState('')
  const [itemMeaning, setItemMeaning] = useState('')
  const [itemNotes, setItemNotes] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<SpeakingEvaluationResponse | null>(null)
  const [speakingText, setSpeakingText] = useState('')
  const [isEvaluatingSpeaking, setIsEvaluatingSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speakingQuestions, setSpeakingQuestions] = useState<SpeakingQuestionItem[]>([])
  const [selectedSpeakingPart, setSelectedSpeakingPart] = useState<1 | 2 | 3>(1)
  const [speakingMode, setSpeakingMode] = useState<'conversation' | 'mock'>('conversation')
  const [realtimeSession, setRealtimeSession] = useState<AiRealtimeSessionResponse | null>(null)
  const [isCreatingRealtimeSession, setIsCreatingRealtimeSession] = useState(false)
  const [speakingDialogue, setSpeakingDialogue] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string }>>([])
  const [isSendingSpeakingTurn, setIsSendingSpeakingTurn] = useState(false)
  const [speakingError, setSpeakingError] = useState<string | null>(null)
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const recognitionRef = useRef<SpeechLikeRecognition | null>(null)
  const speakingSectionRef = useRef<HTMLElement | null>(null)
  const inFlightRef = useRef(false)

  const selectedNotebook = useMemo(
    () => notebooks.find((notebook) => notebook.id === selectedNotebookId) ?? null,
    [notebooks, selectedNotebookId],
  )

  const trackedModules = useMemo(() => {
    const source = overview?.skillAnalytics.trackBreakdown ?? []
    return source
      .filter((entry) => entry.attempts > 0)
      .map((entry) => ({
        ...entry,
        band: skillPowerToBand(entry.skillPower),
      }))
      .sort((left, right) => right.skillPower - left.skillPower)
  }, [overview])

  const overallWorkedBand = useMemo(() => {
    if (trackedModules.length < 2) return null
    const avgBand = trackedModules.reduce((sum, module) => sum + module.band, 0) / trackedModules.length
    return Number(avgBand.toFixed(1))
  }, [trackedModules])

  const trackChartData = useMemo(
    () =>
      (overview?.skillAnalytics.trackBreakdown ?? []).map((item) => ({
        label: item.label,
        skillPower: Number(item.skillPower.toFixed(1)),
      })),
    [overview],
  )

  const weeklyMomentumData = useMemo(
    () =>
      (overview?.weeklyActivity ?? []).map((item) => ({
        label: item.label,
        xp: item.xpEarned,
      })),
    [overview],
  )

  const loadNotebooks = useCallback(async () => {
    const response = await apiClient.get<{ items: VocabularyNotebook[] }>('/profile/vocab-notebook')
    setNotebooks(response.items)
    setSelectedNotebookId((current) => current ?? response.items[0]?.id ?? null)
  }, [])

  const loadSpeakingQuestions = useCallback(async () => {
    const response = await apiClient.get<{ items: SpeakingQuestionItem[] }>(
      `/profile/speaking/questions?part=${selectedSpeakingPart}&limit=8`,
    )
    setSpeakingQuestions(response.items)
  }, [selectedSpeakingPart])

  const loadDashboard = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setState('loading')
    setErrorMessage(null)
    setRequiresLogin(false)

    try {
      const [overviewResult, reportResult, preferencesResult] = await Promise.allSettled([
        retryWithBackoff(() => apiClient.get<ProfileOverview>('/profile/overview'), 1),
        retryWithBackoff(() => apiClient.post<AiReportResponse>('/profile/ai-report', { refresh: false }), 1),
        retryWithBackoff(() => apiClient.get<AiPreferences>('/profile/ai-preferences'), 1),
      ])

      const serializedErrors = [overviewResult, reportResult, preferencesResult]
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)))
        .join(' | ')
        .toLowerCase()

      if (serializedErrors.includes('login required') || serializedErrors.includes('unauthorized')) {
        setRequiresLogin(true)
        throw new Error('Session expired. Please login again and reopen AI Analysis.')
      }

      if (overviewResult.status !== 'fulfilled') {
        throw (overviewResult.reason instanceof Error
          ? overviewResult.reason
          : new Error('Failed to load profile overview.'))
      }

      setOverview(overviewResult.value)

      if (reportResult.status === 'fulfilled') {
        setReport(reportResult.value)
        setReportSnapshot(reportResult.value)
      } else {
        setReport(null)
        setReportSnapshot(null)
      }

      if (preferencesResult.status === 'fulfilled') {
        setPreferences(preferencesResult.value)
      } else {
        setPreferences({
          preferredLocale: 'en',
          preferredName: null,
          toneStyle: 'sweet',
          lastAssistantLanguage: 'en',
          updatedAt: null,
        })
      }
      try {
        await loadNotebooks()
      } catch {
        setNotebooks([])
      }
      setState('ready')
    } catch (error) {
      setState('error')
      const message = error instanceof Error ? error.message : 'Failed to load AI Analysis data.'
      if (
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('401') ||
        message.toLowerCase().includes('login required')
      ) {
        setRequiresLogin(true)
        setErrorMessage('Session expired. Please login again and reopen AI Analysis.')
      } else {
        setErrorMessage(message)
      }
    } finally {
      inFlightRef.current = false
    }
  }, [loadNotebooks, setReportSnapshot])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    void loadSpeakingQuestions().catch(() => {
      setSpeakingQuestions([])
    })
  }, [loadSpeakingQuestions])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('panel') !== 'speaking') return

    const mode = params.get('mode')
    if (mode === 'conversation' || mode === 'mock') {
      setSpeakingMode(mode)
    }

    const part = params.get('part')
    if (part === 'part1') setSelectedSpeakingPart(1)
    if (part === 'part2') setSelectedSpeakingPart(2)
    if (part === 'part3') setSelectedSpeakingPart(3)

    speakingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.search])

  useEffect(() => {
    const speechWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechLikeRecognition
      webkitSpeechRecognition?: new () => SpeechLikeRecognition
    }
    const SpeechCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!SpeechCtor) return

    setSpeechSupported(true)
    const recognition = new SpeechCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (transcript) {
        setSpeakingText(transcript)
      }
    }
    recognition.onend = () => {
      setIsListening(false)
    }
    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  const toggleListening = () => {
    const recognition = recognitionRef.current
    if (!recognition) return
    if (isListening) {
      recognition.stop()
      setIsListening(false)
      if (speakingMode === 'conversation') {
        void sendSpeakingTurnToAi()
      }
      return
    }
    recognition.start()
    setIsListening(true)
  }

  const createNotebook = async () => {
    const normalized = testKeyInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!normalized) return

    const created = await apiClient.post<VocabularyNotebook>('/profile/vocab-notebook', {
      testKey: normalized,
      title: toNotebookTitle(normalized),
      locale: preferences?.preferredLocale ?? 'en',
    })
    setSelectedNotebookId(created.id)
    setTestKeyInput(normalized)
    await loadNotebooks()
  }

  const addVocabularyItem = async () => {
    if (!selectedNotebook) return
    const term = itemTerm.trim()
    const meaning = itemMeaning.trim()
    if (!term || !meaning) return

    await apiClient.post<VocabularyNotebookItem>(`/profile/vocab-notebook/${selectedNotebook.id}/items`, {
      term,
      meaning,
      notes: itemNotes.trim() || undefined,
      sourceLang: preferences?.preferredLocale ?? 'en',
    })

    setItemTerm('')
    setItemMeaning('')
    setItemNotes('')
    await loadNotebooks()
  }

  const deleteVocabularyItem = async (itemId: string) => {
    await apiClient.delete(`/profile/vocab-notebook/items/${itemId}`)
    await loadNotebooks()
  }

  const startEditingItem = (item: VocabularyNotebookItem) => {
    setEditingItemId(item.id)
    setItemTerm(item.term)
    setItemMeaning(item.meaning)
    setItemNotes(item.notes ?? '')
  }

  const saveEditingItem = async () => {
    if (!editingItemId) return
    await apiClient.patch(`/profile/vocab-notebook/items/${editingItemId}`, {
      term: itemTerm.trim(),
      meaning: itemMeaning.trim(),
      notes: itemNotes.trim() || null,
      sourceLang: preferences?.preferredLocale ?? 'en',
    })
    setEditingItemId(null)
    setItemTerm('')
    setItemMeaning('')
    setItemNotes('')
    await loadNotebooks()
  }

  const evaluateSpeaking = async () => {
    const transcript = speakingText.trim()
    if (transcript.length < 20 || isEvaluatingSpeaking) return
    setIsEvaluatingSpeaking(true)
    try {
      const response = await apiClient.post<SpeakingEvaluationResponse>('/profile/speaking-evaluate', {
        transcript,
        transcriptLocale: 'en',
        taskLabel: speakingMode === 'mock' ? `IELTS Speaking Part ${selectedSpeakingPart}` : 'English conversation',
      })
      setEvaluation(response)
    } finally {
      setIsEvaluatingSpeaking(false)
    }
  }

  const createRealtimeSession = async () => {
    if (isCreatingRealtimeSession) return
    setIsCreatingRealtimeSession(true)
    setSpeakingError(null)
    try {
      const response = await apiClient.post<AiRealtimeSessionResponse>('/profile/ai-realtime/session', {
        mode: speakingMode,
        part:
          speakingMode === 'mock'
            ? selectedSpeakingPart === 1
              ? 'part1'
              : selectedSpeakingPart === 2
                ? 'part2'
                : 'part3'
            : undefined,
      })
      setRealtimeSession(response)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Realtime session creation failed.'
      setSpeakingError(message)
    } finally {
      setIsCreatingRealtimeSession(false)
    }
  }

  const stopAssistantVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
  }

  const speakAssistantReply = (text: string) => {
    if (!voiceReplyEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    stopAssistantVoice()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const sendSpeakingTurnToAi = async () => {
    const transcript = speakingText.trim()
    if (!transcript || isSendingSpeakingTurn) return

    if (!isMostlyEnglishText(transcript)) {
      setSpeakingError('Speaking conversation works in English only.')
      return
    }

    setSpeakingError(null)
    setIsSendingSpeakingTurn(true)
    const userTurn = { id: createLocalId('spk-user'), role: 'user' as const, text: transcript }
    const historyForRequest = [...speakingDialogue, userTurn]
      .slice(-12)
      .map((item) => ({ role: item.role, content: item.text }))

    setSpeakingDialogue((current) => [...current, userTurn].slice(-18))

    try {
      const response = await apiClient.post<AiChatResponse>('/profile/ai-chat', {
        message: transcript,
        history: historyForRequest,
        locale: 'en',
        contextMode: 'general',
        uiContext: { pathname: '/ai-coach' },
      })

      const assistantTurn = {
        id: createLocalId('spk-ai'),
        role: 'assistant' as const,
        text: response.reply,
      }
      setSpeakingDialogue((current) => [...current, assistantTurn].slice(-18))
      speakAssistantReply(response.reply)
      setSpeakingText('')

      for (const action of response.actions) {
        if (action.type === 'navigate') {
          const path = routeTargetMap[action.target]
          if (path) navigate(path)
          continue
        }
        if (action.type === 'open_test') {
          const params = new URLSearchParams()
          params.set('mode', action.payload.mode)
          if (action.payload.partIndex) params.set('part', String(action.payload.partIndex))
          if (action.payload.durationMinutes) params.set('minutes', String(action.payload.durationMinutes))
          params.set('source', 'ai')
          navigate(`/test/${action.payload.track}/${action.payload.testId}?${params.toString()}`)
          continue
        }
        if (action.type === 'speaking_mode') {
          setSpeakingMode(action.payload.mode)
          if (action.payload.part === 'part1') setSelectedSpeakingPart(1)
          if (action.payload.part === 'part2') setSelectedSpeakingPart(2)
          if (action.payload.part === 'part3') setSelectedSpeakingPart(3)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speaking AI is temporarily unavailable.'
      setSpeakingError(message)
    } finally {
      setIsSendingSpeakingTurn(false)
    }
  }

  const personaName = preferences?.preferredName ?? overview?.profile.fullName?.split(' ')[0] ?? 'Learner'
  const applySpeakingPrompt = (prompt: string) => {
    setSpeakingText((current) => {
      if (current.trim().length > 0) return current
      return `Question: ${prompt}\nMy answer: `
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04070e] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(168,85,247,0.08),transparent_35%),radial-gradient(circle_at_85%_12%,rgba(59,130,246,0.14),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.08),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.8)_0%,rgba(2,6,23,0.95)_35%,#020617_100%)]" />

      <main className="relative mx-auto flex w-full max-w-[1450px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-6 lg:px-10 scroll-smooth">
        <motion.section
          initial={minimalMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={minimalMotion ? { duration: 0.1 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-slate-700/70 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.08),transparent_30%),linear-gradient(145deg,rgba(15,23,42,0.96)_0%,rgba(17,24,39,0.96)_56%,rgba(3,7,18,0.98)_100%)] px-5 py-6 shadow-[0_30px_90px_rgba(2,6,23,0.6)] sm:px-8 sm:py-8"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" />
            AI Analysis - Study Brain
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Hi {personaName}, where should we start?
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">
            Study-first AI workspace: multilingual chat memory, IELTS/SAT navigation commands, speaking evaluator, and adaptive performance intelligence.
          </p>
        </motion.section>

        {state === 'loading' ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="h-96 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
            <div className="h-96 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
          </section>
        ) : null}

        {state === 'error' ? (
          <section className="rounded-3xl border border-indigo-400/40 bg-indigo-500/10 p-6 text-indigo-100">
            <h2 className="text-xl font-black">AI Analysis load failed</h2>
            <p className="mt-2 text-sm text-indigo-100/90">{errorMessage ?? 'Unexpected error.'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="rounded-xl border border-indigo-300/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold hover:bg-indigo-500/30"
              >
                Retry
              </button>
              {requiresLogin ? (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-xl border border-slate-500/40 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700/70"
                >
                  Login required
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {state === 'ready' ? (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
              <motion.article
                initial={minimalMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={minimalMotion ? { duration: 0.12 } : { duration: 0.58, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-3xl border border-slate-700/70 bg-[linear-gradient(155deg,rgba(8,12,23,0.98)_0%,rgba(17,24,39,0.96)_55%,rgba(6,10,18,0.98)_100%)] p-4 shadow-[0_30px_90px_rgba(2,6,23,0.6)] sm:p-6"
              >
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                  <Bot className="h-4 w-4 text-indigo-300" />
                  Study Chat
                </div>
                <AIChatWindow variant="analysis" />
              </motion.article>

              <div className="space-y-6">
                <motion.article
                  initial={minimalMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={minimalMotion ? { duration: 0.12 } : { duration: 0.58, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-3xl border border-slate-700/70 bg-[linear-gradient(155deg,rgba(2,6,23,0.95)_0%,rgba(15,23,42,0.96)_60%,rgba(6,10,18,0.98)_100%)] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.62)]"
                  ref={speakingSectionRef}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="inline-flex items-center gap-2 text-lg font-black text-white">
                      <Mic className="h-4 w-4 text-indigo-300" />
                      Speaking Coach (English-only)
                    </h2>
                    {speechSupported ? (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                          isListening
                            ? 'border-indigo-300/40 bg-indigo-500/20 text-indigo-100'
                            : 'border-slate-600 bg-slate-900/70 text-slate-200'
                        }`}
                      >
                        {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                        {isListening ? 'Stop mic' : 'Start mic'}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Realtime voice mode + IELTS part-based practice with rubric scoring (fluency, grammar, pronunciation, lexical).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSpeakingMode('conversation')}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        speakingMode === 'conversation'
                          ? 'border-indigo-300/40 bg-indigo-500/20 text-indigo-100'
                          : 'border-slate-700 bg-slate-900/70 text-slate-300'
                      }`}
                    >
                      Conversation
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeakingMode('mock')}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        speakingMode === 'mock'
                          ? 'border-indigo-300/40 bg-indigo-500/20 text-indigo-100'
                          : 'border-slate-700 bg-slate-900/70 text-slate-300'
                      }`}
                    >
                      IELTS Mock
                    </button>
                    {speakingMode === 'mock' ? (
                      <div className="flex flex-wrap gap-1.5">
                        {[1, 2, 3].map((part) => (
                          <button
                            key={part}
                            type="button"
                            onClick={() => setSelectedSpeakingPart(part as 1 | 2 | 3)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                              selectedSpeakingPart === part
                                ? 'border-slate-300/40 bg-slate-100/15 text-slate-100'
                                : 'border-slate-700 bg-slate-900/70 text-slate-400'
                            }`}
                          >
                            Part {part}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {speakingQuestions.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {speakingQuestions.slice(0, 3).map((question) => (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => applySpeakingPrompt(question.prompt)}
                          className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
                        >
                          {question.prompt.length > 62 ? `${question.prompt.slice(0, 62)}...` : question.prompt}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <textarea
                    value={speakingText}
                    onChange={(event) => setSpeakingText(event.target.value)}
                    placeholder="Speak or type in English. Example: I'd like to describe a place that inspires me..."
                    className="mt-3 h-36 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void evaluateSpeaking()}
                      disabled={isEvaluatingSpeaking || speakingText.trim().length < 20}
                      className="rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isEvaluatingSpeaking ? 'Evaluating...' : 'Evaluate speaking'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendSpeakingTurnToAi()}
                      disabled={isSendingSpeakingTurn || speakingText.trim().length < 2}
                      className="rounded-xl border border-slate-500/40 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSendingSpeakingTurn ? 'AI replying...' : 'Talk with AI'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void createRealtimeSession()}
                      disabled={isCreatingRealtimeSession}
                      className="rounded-xl border border-slate-500/40 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCreatingRealtimeSession ? 'Creating realtime...' : 'Create realtime session'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceReplyEnabled((current) => !current)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                        voiceReplyEnabled
                          ? 'border-indigo-400/40 bg-indigo-500/20 text-indigo-100'
                          : 'border-slate-600 bg-slate-900/70 text-slate-200'
                      }`}
                    >
                      Voice reply: {voiceReplyEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {speakingError ? <p className="mt-2 text-xs text-indigo-200">{speakingError}</p> : null}
                  {realtimeSession ? (
                    <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200">
                      <p className="font-semibold text-slate-100">
                        Realtime ready: {realtimeSession.model} ({realtimeSession.mode})
                      </p>
                      <p className="mt-1 text-slate-400">
                        Session token returned. Connect this from frontend audio client to start instant English conversation.
                      </p>
                    </div>
                  ) : null}
                  {speakingDialogue.length > 0 ? (
                    <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950/60 p-2">
                      {speakingDialogue.map((turn) => (
                        <div
                          key={turn.id}
                          className={`rounded-xl border px-3 py-2 text-xs leading-5 ${
                            turn.role === 'assistant'
                              ? 'border-slate-700 bg-slate-900/80 text-slate-100'
                              : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-100'
                          }`}
                        >
                          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            {turn.role === 'assistant' ? 'AI' : 'You'}
                          </p>
                          <p>{turn.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {evaluation ? (
                    <div className="mt-4 space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                      <p className="text-sm font-bold text-white">Estimated Band: {evaluation.overallBand.toFixed(1)}</p>
                      <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                        <p>Fluency: {evaluation.fluencyBand.toFixed(1)}</p>
                        <p>Grammar: {evaluation.grammarBand.toFixed(1)}</p>
                        <p>Pronunciation: {evaluation.pronunciationBand.toFixed(1)}</p>
                        <p>Lexical: {evaluation.lexicalBand.toFixed(1)}</p>
                      </div>
                      <div className="space-y-2">
                        {(evaluation.feedback.improvementPriorities ?? []).slice(0, 4).map((entry) => (
                          <div key={entry.area} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200">
                            <p className="font-semibold uppercase tracking-[0.08em] text-indigo-200">{entry.area}</p>
                            <p className="mt-1">{entry.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </motion.article>

                <motion.article
                  initial={minimalMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={minimalMotion ? { duration: 0.12 } : { duration: 0.58, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-3xl border border-slate-700/70 bg-[linear-gradient(155deg,rgba(6,10,20,0.95)_0%,rgba(15,23,42,0.96)_60%,rgba(2,6,23,0.98)_100%)] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.62)]"
                >
                  <h2 className="inline-flex items-center gap-2 text-lg font-black text-white">
                    <ChartColumnIncreasing className="h-4 w-4 text-indigo-300" />
                    Performance Insights
                  </h2>
                  <p className="mt-2 text-xs text-slate-400">
                    Band estimates are shown only for modules you have actually practiced.
                  </p>

                  <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Current status</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {overallWorkedBand !== null
                        ? `Estimated multi-module band ${overallWorkedBand.toFixed(1)}`
                        : trackedModules.length === 1
                          ? `Only ${trackedModules[0].label} worked (${trackedModules[0].band.toFixed(1)})`
                          : 'No evaluated modules yet'}
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    {trackedModules.slice(0, 4).map((module) => (
                      <div key={module.key} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{module.label}</p>
                          <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-100">
                            Band {module.band.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          Attempts {module.attempts} | Accuracy {module.accuracy.toFixed(1)}% | SkillPower {module.skillPower.toFixed(1)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {trackChartData.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Track skill distribution</p>
                      <div className="mt-2 h-40 w-full">
                        <ResponsiveContainer>
                          <BarChart data={trackChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#475569', backgroundColor: '#0f172a' }} />
                            <Bar dataKey="skillPower" fill="#6366f1" radius={[8, 8, 3, 3]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : null}

                  {weeklyMomentumData.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Weekly XP momentum</p>
                      <div className="mt-2 h-40 w-full">
                        <ResponsiveContainer>
                          <LineChart data={weeklyMomentumData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                            <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#475569', backgroundColor: '#0f172a' }} />
                            <Line type="monotone" dataKey="xp" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : null}
                </motion.article>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
              <motion.article
                initial={minimalMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={minimalMotion ? { duration: 0.12 } : { duration: 0.62, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-3xl border border-slate-700/70 bg-[linear-gradient(155deg,rgba(6,10,20,0.95)_0%,rgba(15,23,42,0.96)_60%,rgba(2,6,23,0.98)_100%)] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.62)]"
              >
                <h2 className="inline-flex items-center gap-2 text-lg font-black text-white">
                  <BookOpenText className="h-4 w-4 text-indigo-300" />
                  Vocab Arena
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  Create test-linked notebooks (example: reading-full-test-1). Training mode help stays vocabulary-only.
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    value={testKeyInput}
                    onChange={(event) => setTestKeyInput(event.target.value)}
                    placeholder="reading-full-test-1"
                    className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => void createNotebook()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/30"
                  >
                    <Plus className="h-4 w-4" />
                    Add notebook
                  </button>
                </div>

                {notebooks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {notebooks.map((notebook) => (
                      <button
                        key={notebook.id}
                        type="button"
                        onClick={() => setSelectedNotebookId(notebook.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          notebook.id === selectedNotebookId
                            ? 'border-indigo-300/40 bg-indigo-500/20 text-indigo-100'
                            : 'border-slate-700 bg-slate-900/70 text-slate-300'
                        }`}
                      >
                        {notebook.title}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-2">
                  <input
                    value={itemTerm}
                    onChange={(event) => setItemTerm(event.target.value)}
                    placeholder="Word / phrase"
                    className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <input
                    value={itemMeaning}
                    onChange={(event) => setItemMeaning(event.target.value)}
                    placeholder={preferences?.preferredLocale?.startsWith('uz') ? "O'zbek ma'nosi" : 'Meaning / translation'}
                    className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <input
                    value={itemNotes}
                    onChange={(event) => setItemNotes(event.target.value)}
                    placeholder="Usage note (optional)"
                    className="h-10 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!selectedNotebook}
                      onClick={() => void (editingItemId ? saveEditingItem() : addVocabularyItem())}
                      className="rounded-xl border border-indigo-400/40 bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {editingItemId ? 'Save changes' : 'Add vocabulary'}
                    </button>
                    {editingItemId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemId(null)
                          setItemTerm('')
                          setItemMeaning('')
                          setItemNotes('')
                        }}
                        className="rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200"
                      >
                        Cancel edit
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {(selectedNotebook?.items ?? []).map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.term}</p>
                          <p className="text-xs text-slate-300">{item.meaning}</p>
                          {item.notes ? <p className="mt-1 text-xs text-slate-400">{item.notes}</p> : null}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingItem(item)}
                            className="rounded-lg border border-slate-600 bg-slate-900/60 px-2 py-1 text-[11px] font-semibold text-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteVocabularyItem(item.id)}
                            className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-1.5 text-indigo-100"
                            aria-label="Delete vocabulary item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedNotebook && selectedNotebook.items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-3 py-5 text-center text-xs text-slate-400">
                      Notebook is empty. Add your first word.
                    </p>
                  ) : null}
                </div>
              </motion.article>

              <motion.article
                initial={minimalMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={minimalMotion ? { duration: 0.12 } : { duration: 0.62, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-3xl border border-slate-700/70 bg-[linear-gradient(155deg,rgba(6,10,20,0.95)_0%,rgba(15,23,42,0.96)_60%,rgba(2,6,23,0.98)_100%)] p-5 shadow-[0_24px_70px_rgba(2,6,23,0.62)]"
              >
                <h2 className="inline-flex items-center gap-2 text-lg font-black text-white">
                  <Activity className="h-4 w-4 text-indigo-300" />
                  Study Memory + Safety
                </h2>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                    <p className="inline-flex items-center gap-2 font-semibold text-white">
                      <Languages className="h-4 w-4 text-indigo-300" />
                      Language memory
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Preferred locale: {preferences?.preferredLocale ?? 'en'} · Tone: {preferences?.toneStyle ?? 'sweet'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                    <p className="font-semibold text-white">Training vs exam guardrails</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Exam/full-test mode blocks helper actions. Training mode allows vocabulary-only assistance for reading/listening.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                    <p className="font-semibold text-white">Command launcher</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Supports: “reading full test 2”, “passage 2 for 20 min”, “listening full test 2 part 3”.
                    </p>
                  </div>
                </div>

                {report ? (
                  <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">AI summary</p>
                    <p className="mt-2 text-sm leading-7 text-slate-200">{report.executiveSummary}</p>
                  </div>
                ) : null}
              </motion.article>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
