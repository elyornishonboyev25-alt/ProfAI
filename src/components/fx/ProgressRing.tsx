import { useId, type ReactNode } from 'react'

interface ProgressRingProps {
  /** 0 – 100 */
  value: number
  size?: number
  stroke?: number
  from?: string
  to?: string
  trackColor?: string
  className?: string
  children?: ReactNode
}

/**
 * Circular SVG progress ring with an animated red gradient sweep. Animates the
 * stroke when scrolled into view; reduced-motion shows the final arc instantly.
 */
export default function ProgressRing({
  value,
  size = 96,
  stroke = 9,
  from = '#EF4444',
  to = '#B91C1C',
  trackColor = 'rgba(248,113,113,0.16)',
  className = '',
  children,
}: ProgressRingProps) {
  const id = useId().replace(/:/g, '')
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      {children ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  )
}
