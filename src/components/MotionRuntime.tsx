import { useEffect, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

const PREMIUM_EASE = [0.16, 1, 0.3, 1] as const

/** Keeps motion consistent, accessible and inexpensive across the app. */
export default function MotionRuntime({ children }: { children: ReactNode }) {
  const { minimalMotion } = useMotionPreferences()

  useEffect(() => {
    const root = document.documentElement
    const syncVisibility = () => {
      root.dataset.motionPaused = document.hidden ? 'true' : 'false'
    }

    root.dataset.motion = minimalMotion ? 'minimal' : 'full'
    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)

    return () => {
      document.removeEventListener('visibilitychange', syncVisibility)
      delete root.dataset.motion
      delete root.dataset.motionPaused
    }
  }, [minimalMotion])

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: minimalMotion ? 0.01 : 0.22, ease: PREMIUM_EASE }}
    >
      {children}
    </MotionConfig>
  )
}
