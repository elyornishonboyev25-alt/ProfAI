import { type ReactNode } from 'react'

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
export function Stagger({ children, className }: StaggerProps) {
  return <div className={className}>{children}</div>
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  y?: number
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return <div className={className}>{children}</div>
}
