import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import AnalyticsConsentBanner from '@/components/analytics/AnalyticsConsentBanner'
import {
  analyticsPreferenceEvents,
  captureAppSession,
  capturePageView,
  disableAnalytics,
  getAnalyticsConsent,
  identifyAnalyticsUser,
  initializeAnalytics,
  isAnalyticsConfigured,
  setSessionReplayForPath,
  type AnalyticsConsent,
} from '@/lib/analytics'
import { useAuthStore } from '@/store/authStore'

export default function AnalyticsRuntime() {
  const { pathname } = useLocation()
  const user = useAuthStore((state) => state.user)
  const pathnameRef = useRef(pathname)
  const userRef = useRef(user)
  const lastTrackedPathRef = useRef<string | null>(null)
  pathnameRef.current = pathname
  userRef.current = user

  const trackCurrentPath = () => {
    const currentPath = pathnameRef.current
    if (lastTrackedPathRef.current === currentPath) return
    lastTrackedPathRef.current = currentPath
    capturePageView(currentPath)
    setSessionReplayForPath(currentPath)
  }

  useEffect(() => {
    if (!isAnalyticsConfigured()) return

    const applyConsent = (consent: AnalyticsConsent | null) => {
      if (consent !== 'granted') {
        disableAnalytics()
        return
      }
      void initializeAnalytics().then(() => {
        identifyAnalyticsUser(userRef.current)
        captureAppSession()
        trackCurrentPath()
      })
    }

    applyConsent(getAnalyticsConsent())
    const handleConsent = (event: Event) => applyConsent((event as CustomEvent<AnalyticsConsent>).detail)
    window.addEventListener(analyticsPreferenceEvents.consent, handleConsent)
    return () => window.removeEventListener(analyticsPreferenceEvents.consent, handleConsent)
  }, [])

  useEffect(() => {
    if (getAnalyticsConsent() !== 'granted') return
    identifyAnalyticsUser(user)
  }, [user?.id, user?.premium, user?.onboardingCompleted, user?.role])

  useEffect(() => {
    if (getAnalyticsConsent() !== 'granted') return
    trackCurrentPath()
  }, [pathname])

  return <AnalyticsConsentBanner />
}
