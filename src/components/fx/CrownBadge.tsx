import { Crown } from 'lucide-react'

interface CrownBadgeProps {
  className?: string
  size?: 'sm' | 'md'
  label?: string
}

/** Premium ownership badge — a small gold crown chip. */
export default function CrownBadge({ className = '', size = 'md', label = 'Premium' }: CrownBadgeProps) {
  const sm = size === 'sm'
  return (
    <span
      className={`premium-identity-badge inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 font-bold text-amber-700 shadow-[0_4px_12px_rgba(245,158,11,0.25)] ${
        sm ? 'px-1.5 py-0.5' : 'px-2.5 py-1'
      } ${className}`}
    >
      <Crown aria-hidden="true" className={sm ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {label ? <span className={sm ? 'text-[9px] uppercase tracking-wide' : 'text-[10px] uppercase tracking-wide'}>{label}</span> : null}
    </span>
  )
}
