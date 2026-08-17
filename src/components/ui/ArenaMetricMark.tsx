import type { LucideIcon } from 'lucide-react'
import { cn } from '@/components/ui/utils'

type ArenaMetricTone = 'red' | 'blue' | 'indigo' | 'amber' | 'emerald'

const toneClass: Record<ArenaMetricTone, string> = {
  red: 'arena-metric-mark-red',
  blue: 'arena-metric-mark-blue',
  indigo: 'arena-metric-mark-indigo',
  amber: 'arena-metric-mark-amber',
  emerald: 'arena-metric-mark-emerald',
}

export function ArenaMetricMark({
  icon: Icon,
  tone = 'blue',
  size = 'md',
  className,
}: {
  icon: LucideIcon
  tone?: ArenaMetricTone
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span className={cn('arena-metric-mark', size === 'sm' && 'arena-metric-mark-sm', toneClass[tone], className)} aria-hidden="true">
      <svg viewBox="0 0 48 48" className="arena-metric-mark-orbit">
        <circle cx="24" cy="24" r="20" />
        <path d="M8.5 31.5c5.5 8.7 17 11.3 25.8 5.8 2.2-1.4 4.1-3.2 5.5-5.4" />
      </svg>
      <span className="arena-metric-mark-core"><Icon strokeWidth={1.8} /></span>
      <i />
    </span>
  )
}
