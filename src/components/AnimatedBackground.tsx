import { motion } from 'framer-motion'
import { memo } from 'react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export const AnimatedBackground = memo(function AnimatedBackground() {
  const { minimalMotion } = useMotionPreferences()

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
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
        className="ambient-orb absolute left-[46%] top-[18%] h-52 w-52 rounded-full bg-rose-200/45"
        animate={minimalMotion ? undefined : { x: [0, 14, -10, 0], y: [0, -16, 8, 0], scale: [1, 1.06, 1] }}
        transition={minimalMotion ? undefined : { duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="glossy-orb left-[3%] top-[16%] h-20 w-20"
        animate={minimalMotion ? undefined : { x: [0, 34, 8, 0], y: [0, -24, 18, 0], rotate: [0, 18, -8, 0] }}
        transition={minimalMotion ? undefined : { duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glossy-orb glossy-orb-soft right-[4%] top-[12%] h-32 w-32"
        animate={minimalMotion ? undefined : { x: [0, -28, 5, 0], y: [0, 22, -12, 0], rotate: [0, -16, 10, 0] }}
        transition={minimalMotion ? undefined : { duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glossy-orb bottom-[8%] left-[9%] h-12 w-12"
        animate={minimalMotion ? undefined : { x: [0, 18, -8, 0], y: [0, -30, 8, 0], scale: [1, 1.12, 0.96, 1] }}
        transition={minimalMotion ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="glossy-orb glossy-orb-soft bottom-[16%] right-[14%] h-16 w-16"
        animate={minimalMotion ? undefined : { x: [0, -18, 12, 0], y: [0, -16, 20, 0], scale: [1, 0.94, 1.08, 1] }}
        transition={minimalMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="ambient-grid" />
    </div>
  )
})
