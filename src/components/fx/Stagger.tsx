import { type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

interface StaggerProps {
  children: ReactNode
  className?: string
  gap?: number
  delay?: number
  once?: boolean
}

/**
 * Container that reveals its <StaggerItem> children one after another when it
 * scrolls into view.
 */
export function Stagger({ children, className, gap = 0.08, delay = 0.05, once = true }: StaggerProps) {
  const { reducedMotion } = useMotionPreferences()
  if (reducedMotion) return <div className={className}>{children}</div>

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: gap, delayChildren: delay } },
  }

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-8% 0px' }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  y?: number
}

export function StaggerItem({ children, className, y = 16 }: StaggerItemProps) {
  const { reducedMotion } = useMotionPreferences()
  if (reducedMotion) return <div className={className}>{children}</div>

  const item: Variants = {
    hidden: { opacity: 0, y, scale: 0.992 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  )
}
