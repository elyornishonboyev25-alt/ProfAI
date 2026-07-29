import { motion } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

/**
 * Page-local glossy sphere field. It sits behind content but above the page
 * wash, so branded motion remains visible in large workspace layouts.
 */
export default function PremiumSphereField() {
  const { minimalMotion } = useMotionPreferences()

  return (
    <div className="premium-sphere-field pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <motion.span
        className="glossy-orb absolute -left-5 top-[18%] h-16 w-16 sm:left-3 sm:h-20 sm:w-20"
        animate={minimalMotion ? undefined : { x: [0, 20, 4, 0], y: [0, -22, 14, 0], rotate: [0, 14, -8, 0] }}
        transition={minimalMotion ? undefined : { duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="glossy-orb glossy-orb-soft absolute -right-8 top-[12%] h-28 w-28 sm:right-2 sm:h-36 sm:w-36"
        animate={minimalMotion ? undefined : { x: [0, -18, 6, 0], y: [0, 18, -12, 0], scale: [1, 1.05, 0.98, 1] }}
        transition={minimalMotion ? undefined : { duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="glossy-orb absolute left-[7%] top-[64%] h-10 w-10 sm:h-12 sm:w-12"
        animate={minimalMotion ? undefined : { x: [0, 26, -6, 0], y: [0, -24, 10, 0], scale: [1, 1.12, 0.96, 1] }}
        transition={minimalMotion ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="glossy-orb glossy-orb-soft absolute bottom-[8%] right-[10%] h-14 w-14"
        animate={minimalMotion ? undefined : { x: [0, -16, 8, 0], y: [0, -20, 12, 0], rotate: [0, -10, 7, 0] }}
        transition={minimalMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
