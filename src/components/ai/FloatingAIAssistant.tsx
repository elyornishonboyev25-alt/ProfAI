import { lazy, Suspense, useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Lock, Sparkles, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { hasPremiumAccess } from '@/utils/premiumAccess'
import type { AiReportResponse } from '@/types/platform'
import VoiceOrb from '@/components/ai/VoiceOrb'

const AIChatWindow = lazy(() => import('@/components/ai/AIChatWindow'))

const ATTEMPT_SUBMITTED_EVENT = 'smarttest:attempt-submitted'

function isLegacyExamPath(pathname: string) {
  const isCustomTestMode = /^\/tests\/[^/]+\/attempt$/.test(pathname)
  const isClassicTestMode = pathname.startsWith('/test/') || pathname.startsWith('/results/')
  return isCustomTestMode || isClassicTestMode
}

function shouldBlockAssistant(pathname: string, search: string) {
  const isCustomTestMode = /^\/tests\/[^/]+\/attempt$/.test(pathname)
  if (isCustomTestMode || pathname.startsWith('/results/')) {
    return true
  }

  if (pathname.startsWith('/test/')) {
    const mode = new URLSearchParams(search).get('mode')
    if (mode === 'simulation' || mode === 'full-test') {
      return true
    }
  }

  return false
}

export function FloatingAIAssistant() {
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const hasPremium = hasPremiumAccess(user)
  const isOpen = useAiAssistantStore((state) => state.isOpen)
  const open = useAiAssistantStore((state) => state.open)
  const close = useAiAssistantStore((state) => state.close)
  const setReportSnapshot = useAiAssistantStore((state) => state.setReportSnapshot)
  const talkOpen = useAiAssistantStore((state) => state.talkOpen)
  const voiceState = useAiAssistantStore((state) => state.voiceState)
  const voiceLevel = useAiAssistantStore((state) => state.voiceLevel)

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isAiAnalysisStandalone = location.pathname === '/ai-coach' || location.pathname === '/profile'
  const isLegacyTestMode = useMemo(() => isLegacyExamPath(location.pathname), [location.pathname])
  const assistantBlocked = useMemo(
    () => shouldBlockAssistant(location.pathname, location.search),
    [location.pathname, location.search],
  )

  const refreshContext = useCallback(
    async (refresh: boolean) => {
      if (!user || !hasPremium) return
      try {
        const report = await apiClient.post<AiReportResponse>('/profile/ai-report', { refresh })
        setReportSnapshot(report)
      } catch {
        // background refresh is best-effort
      }
    },
    [hasPremium, setReportSnapshot, user],
  )

  useEffect(() => {
    if (!assistantBlocked && !isAiAnalysisStandalone) return
    close()
  }, [assistantBlocked, close, isAiAnalysisStandalone])

  useEffect(() => {
    if (isAuthPage || (!isOpen && !talkOpen)) return
    void refreshContext(false)

    const onAttemptSubmitted = () => {
      void refreshContext(true)
    }

    const onWindowFocus = () => {
      void refreshContext(false)
    }

    window.addEventListener(ATTEMPT_SUBMITTED_EVENT, onAttemptSubmitted as EventListener)
    window.addEventListener('focus', onWindowFocus)

    return () => {
      window.removeEventListener(ATTEMPT_SUBMITTED_EVENT, onAttemptSubmitted as EventListener)
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [isAuthPage, isOpen, refreshContext, talkOpen])

  // While the immersive talk overlay is up it owns the corner, so hide the launcher.
  if (isAuthPage || isAiAnalysisStandalone || assistantBlocked || talkOpen) return null

  const showOrbLauncher = !isLegacyTestMode && !isOpen && hasPremium

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && !assistantBlocked ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto w-[min(92vw,24rem)]"
          >
            <Suspense fallback={null}>
              <AIChatWindow variant="floating" onClose={close} />
            </Suspense>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          if (assistantBlocked) return
          if (isOpen) {
            close()
            return
          }
          open()
        }}
        aria-label={isOpen ? 'Close AI tutor' : 'Open ProfAI tutor'}
        className={`pointer-events-auto group relative inline-flex h-14 w-14 items-center justify-center rounded-[20px] border shadow-[0_14px_34px_-12px_rgba(15,23,42,0.52)] ring-1 ring-white/80 backdrop-blur-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 active:shadow-[0_8px_22px_-12px_rgba(15,23,42,0.5)] dark:ring-white/10 dark:focus-visible:ring-offset-slate-950 ${
          showOrbLauncher
            ? 'border-slate-200/80 bg-white/90 hover:border-rose-200 hover:bg-white dark:border-white/10 dark:bg-slate-900/90 dark:hover:border-rose-400/40 dark:hover:bg-slate-900'
            : isLegacyTestMode
              ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600'
              : 'border-rose-400/50 bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 text-white hover:border-rose-300'
        }`}
      >
        {!isOpen ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 whitespace-nowrap rounded-lg border border-slate-200/80 bg-slate-950/95 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-white opacity-0 shadow-lg transition-all duration-150 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:-translate-y-0.5 group-focus-visible:opacity-100 dark:border-white/10"
          >
            ProfAI tutor
          </span>
        ) : null}
        {showOrbLauncher ? (
          <VoiceOrb state={voiceState} level={voiceLevel} size={42} />
        ) : (
          <span className="relative">{isOpen ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}</span>
        )}
        {!hasPremium && !assistantBlocked ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-slate-100">
            <Lock className="h-2.5 w-2.5" />
          </span>
        ) : !isOpen && !showOrbLauncher ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-400">
            <Sparkles className="h-2 w-2 text-white" />
          </span>
        ) : null}
      </motion.button>
    </div>
  )
}

export default FloatingAIAssistant
