import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  blur?: boolean
  once?: boolean
}

/**
 * Entrance wrapper — fades/slides/unblurs its children when they scroll into
 * view. No-op under reduced-motion.
 */
export default function Reveal({ children, className, delay = 0, y = 22, blur: _blur = false, once = true }: RevealProps) {
  const { reducedMotion } = useMotionPreferences()

  if (reducedMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.992 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once, margin: '-5% 0px -4% 0px', amount: 0.12 }}
      transition={{ duration: 0.68, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
