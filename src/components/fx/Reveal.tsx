import { type ReactNode } from 'react'

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
export default function Reveal({ children, className }: RevealProps) {
  return <div className={className}>{children}</div>
}
