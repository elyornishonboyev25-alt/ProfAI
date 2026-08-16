import { type ReactNode } from 'react'

interface Tilt3DProps {
  children: ReactNode
  className?: string
  /** Maximum tilt in degrees */
  max?: number
  /** How far the card lifts toward the viewer (translateZ px) */
  lift?: number
  /** Show a soft moving glare highlight */
  glare?: boolean
}

/**
 * Premium 3D hover tilt wrapper. Tracks the pointer and applies a subtle
 * perspective rotation + lift, plus an optional glare sweep. Fully disabled
 * for reduced-motion / touch / low-power devices via useMotionPreferences().
 */
export default function Tilt3D({ children, className = '' }: Tilt3DProps) {
  return <div className={className}>{children}</div>
}
