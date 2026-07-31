import { motion } from 'framer-motion'
import { memo } from 'react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export const AnimatedBackground = memo(function AnimatedBackground() {
  const { minimalMotion } = useMotionPreferences()

  return (
    <div className="workspace-background fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="ambient-mesh" />
      <div className="ambient-noise" />
      <motion.div
        className="absolute inset-y-0 left-1/2 hidden w-[28rem] -translate-x-1/2 bg-[linear-gradient(120deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.52)_44%,rgba(255,255,255,0)_100%)] md:block"
        animate={minimalMotion ? undefined : { x: [-120, 140, -120], opacity: [0.12, 0.32, 0.12] }}
        transition={minimalMotion ? undefined : { duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="ambient-orb ambient-orb-left"
        animate={minimalMotion ? undefined : { x: [0, 24, 0], y: [0, -16, 0], scale: [1, 1.03, 1] }}
        transition={minimalMotion ? undefined : { duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="ambient-orb ambient-orb-right"
        animate={minimalMotion ? undefined : { x: [0, -20, 0], y: [0, 20, 0], scale: [1, 1.04, 1] }}
        transition={minimalMotion ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="glossy-orb left-[3%] top-[24%] h-16 w-16 md:h-20 md:w-20"
        animate={minimalMotion ? undefined : { x: [0, 18, 4, 0], y: [0, -14, 10, 0], rotate: [0, 12, -6, 0] }}
        transition={minimalMotion ? undefined : { duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glossy-orb glossy-orb-soft right-[2%] top-[30%] h-24 w-24 md:h-32 md:w-32"
        animate={minimalMotion ? undefined : { x: [0, -16, 4, 0], y: [0, 14, -8, 0], rotate: [0, -12, 7, 0] }}
        transition={minimalMotion ? undefined : { duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glossy-orb bottom-[10%] left-[15%] h-10 w-10 md:h-12 md:w-12"
        animate={minimalMotion ? undefined : { x: [0, 18, -8, 0], y: [0, -30, 8, 0], scale: [1, 1.12, 0.96, 1] }}
        transition={minimalMotion ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glossy-orb glossy-orb-soft bottom-[12%] right-[18%] h-14 w-14 md:h-16 md:w-16"
        animate={minimalMotion ? undefined : { x: [0, -18, 12, 0], y: [0, -16, 20, 0], scale: [1, 0.94, 1.08, 1] }}
        transition={minimalMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glossy-orb left-[38%] top-[62%] hidden h-9 w-9 opacity-45 md:block"
        animate={minimalMotion ? undefined : { x: [0, 24, -10, 0], y: [0, -28, 12, 0], scale: [1, 1.14, 0.95, 1] }}
        transition={minimalMotion ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glossy-orb right-[34%] top-[16%] hidden h-10 w-10 opacity-35 lg:block"
        animate={minimalMotion ? undefined : { x: [0, -18, 12, 0], y: [0, 20, -14, 0], rotate: [0, -12, 8, 0] }}
        transition={minimalMotion ? undefined : { duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="ambient-orbit ambient-orbit-one hidden md:block"
        animate={minimalMotion ? undefined : { rotate: [0, 360] }}
        transition={minimalMotion ? undefined : { duration: 48, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="ambient-orbit ambient-orbit-two hidden lg:block"
        animate={minimalMotion ? undefined : { rotate: [360, 0] }}
        transition={minimalMotion ? undefined : { duration: 62, repeat: Infinity, ease: 'linear' }}
      />

      <div className="ambient-grid" />
    </div>
  )
})
