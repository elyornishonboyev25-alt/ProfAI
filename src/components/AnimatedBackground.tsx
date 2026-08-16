import { memo } from 'react'

/** A single viewport-fixed, compositor-only ambient scene for the whole app. */
export const AnimatedBackground = memo(function AnimatedBackground() {
  return (
    <div
      className="workspace-background fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div className="ambient-mesh" />
      <div className="ambient-grid" />
      <span className="ambient-sphere ambient-sphere-a" />
      <span className="ambient-sphere ambient-sphere-b" />
      <span className="ambient-sphere ambient-sphere-c" />
    </div>
  )
})
