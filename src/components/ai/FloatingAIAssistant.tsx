import { Suspense, useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Lock, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { BrandMark } from '@/components/brand/BrandLogo'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { hasPremiumAccess } from '@/utils/premiumAccess'
import type { AiReportResponse } from '@/types/platform'
import { lazyWithRetry as lazy } from '@/utils/lazyWithRetry'

const AIChatWindow = lazy(() => import('@/components/ai/AIChatWindow'))

const ATTEMPT_SUBMITTED_EVENT = 'smarttest:attempt-submitted'

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
  const reduceMotion = useReducedMotion()
  const user = useAuthStore((state: AuthState) => state.user)
  const hasPremium = hasPremiumAccess(user)
  const isOpen = useAiAssistantStore((state) => state.isOpen)
  const open = useAiAssistantStore((state) => state.open)
  const close = useAiAssistantStore((state) => state.close)
  const setReportSnapshot = useAiAssistantStore((state) => state.setReportSnapshot)
  const talkOpen = useAiAssistantStore((state) => state.talkOpen)
  const isExamModeActive = useAiAssistantStore((state) => state.isExamModeActive)

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isAiAnalysisStandalone = location.pathname === '/ai-coach' || location.pathname === '/profile'
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
    if (!assistantBlocked && !isAiAnalysisStandalone && !isExamModeActive) return
    close()
  }, [assistantBlocked, close, isAiAnalysisStandalone, isExamModeActive])

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
  if (isAuthPage || isAiAnalysisStandalone || assistantBlocked || isExamModeActive || talkOpen) return null

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[120] flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
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
        onClick={() => {
          if (assistantBlocked) return
          if (isOpen) {
            close()
            return
          }
          open()
        }}
        aria-label={isOpen ? 'Close AI tutor' : 'Open ProfAI tutor'}
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.035 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 330, damping: 22 }}
        className={`pointer-events-auto group relative inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] border backdrop-blur-xl transition-colors ${
          isOpen
            ? 'border-slate-700/80 bg-slate-900/90 text-white shadow-[0_14px_32px_rgba(15,23,42,0.28)]'
            : 'border-white/80 bg-white/55 text-slate-900 shadow-[0_14px_34px_rgba(37,99,235,0.18),inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-1px_0_rgba(148,163,184,0.16)] hover:border-white hover:bg-white/70'
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
        {!isOpen ? (
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
            <span className="absolute inset-[4px] rounded-[1rem] bg-gradient-to-br from-white/80 via-white/24 to-blue-100/35" />
            <motion.span
              className="absolute -bottom-3 -top-3 w-5 rotate-[18deg] bg-gradient-to-r from-transparent via-white/90 to-transparent blur-[1px]"
              initial={{ left: '-45%' }}
              animate={reduceMotion ? { left: '-45%' } : { left: ['-45%', '125%'] }}
              transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.2 }}
            />
          </span>
        ) : null}

        <span className="relative z-10">
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <motion.span
              className="flex drop-shadow-[0_7px_9px_rgba(220,38,38,0.24)]"
              animate={reduceMotion ? undefined : { y: [0, -1.5, 0], scale: [1, 1.025, 1] }}
              transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
            >
              <BrandMark size={45} />
            </motion.span>
          )}
        </span>
        {!hasPremium && !assistantBlocked ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-slate-100">
            <Lock className="h-2.5 w-2.5" />
          </span>
        ) : null}
      </motion.button>
    </div>
  )
}

export default FloatingAIAssistant
