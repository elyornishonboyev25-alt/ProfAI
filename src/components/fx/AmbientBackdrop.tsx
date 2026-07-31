interface AmbientBackdropProps {
  variant?: 'red' | 'blue'
  grid?: boolean
  className?: string
}

/**
 * Lightweight page texture. Moving spheres intentionally live only in the
 * global AnimatedBackground so they remain fixed to the viewport on scroll.
 */
export default function AmbientBackdrop({ variant = 'red', grid = true, className = '' }: AmbientBackdropProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden opacity-50 ${className}`} aria-hidden>
      <div className={`workspace-ambient-wash ${variant === 'blue' ? 'workspace-ambient-wash-blue' : ''}`} />
      {grid ? <div className="ambient-grid" /> : null}
    </div>
  )
}
