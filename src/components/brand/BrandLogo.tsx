import { useId } from 'react'
import { cn } from '@/components/ui/utils'

type BrandMarkProps = {
  size?: number
  className?: string
}

type BrandLockupProps = {
  className?: string
  iconClassName?: string
  titleClassName?: string
  subtitleClassName?: string
  subtitle?: string
  iconSize?: number
}

export function BrandMark({ size = 44, className }: BrandMarkProps) {
  const id = useId().replace(/:/g, '')
  const capId = `pa-cap-${id}`
  const baseId = `pa-base-${id}`
  const tasselId = `pa-tassel-${id}`
  const boardClipId = `pa-clip-${id}`

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* ProfAI mark — a graduation cap topped with a world map (study abroad)
          and an "AI" tassel. Mirrors the primary brand logo. */}
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <linearGradient id={capId} x1="10" y1="9" x2="54" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF5A4D" />
            <stop offset="52%" stopColor="#F23B2E" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          <linearGradient id={baseId} x1="18" y1="29" x2="46" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F23B2E" />
            <stop offset="100%" stopColor="#C81E1E" />
          </linearGradient>
          <linearGradient id={tasselId} x1="46" y1="22" x2="56" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF6B5E" />
            <stop offset="100%" stopColor="#E11D2B" />
          </linearGradient>
          <clipPath id={boardClipId}>
            <path d="M32 8.4 59.4 21.4 32 34.4 4.6 21.4Z" />
          </clipPath>
        </defs>

        {/* Cap base (the headband that rests on the head) */}
        <path
          d="M16.6 26.8 32 34.1 47.4 26.8 47.4 38.4C47.4 43.1 40.5 46.4 32 46.4 23.5 46.4 16.6 43.1 16.6 38.4Z"
          fill={`url(#${baseId})`}
        />
        <path d="M16.6 26.8 32 34.1 47.4 26.8" stroke="white" strokeOpacity="0.28" strokeWidth="1.1" fill="none" />

        {/* Mortarboard (top-down, in perspective) */}
        <path d="M32 8.4 59.4 21.4 32 34.4 4.6 21.4Z" fill={`url(#${capId})`} />
        <path d="M32 8.4 59.4 21.4 32 34.4 4.6 21.4Z" stroke="white" strokeOpacity="0.55" strokeWidth="0.9" />

        {/* World map on the board — simplified continents (study abroad) */}
        <g className="profai-brand-world-map" clipPath={`url(#${boardClipId})`} fill="white" fillOpacity="0.94">
          {/* North & Central America */}
          <path d="M18.6 19.1c1.4-1 3.1-1.1 4.2-.3.9.7.5 1.7-.3 2.3-.7.5-.4 1.3.3 1.6.9.4.6 1.4-.5 1.7-1.7.5-3.6-.2-4.4-1.4-.8-1.2-.4-2.9.7-3.5Z" />
          {/* South America */}
          <path d="M25.7 25.4c1-.2 1.8.5 1.7 1.6-.1 1.2-.9 2.4-1.8 2.6-.8.2-1.3-.5-1.1-1.5.1-.8-.3-1-.7-1.3-.7-.5-.1-1.6 1.9-1.4Z" />
          {/* Europe */}
          <path d="M32.2 17.1c1.3-.5 2.6-.2 2.7.7.1.8-.7 1-.3 1.7.4.7-.2 1.3-1.2 1.2-1.4-.1-2.6-.9-2.6-1.9 0-.7.5-1.3.7-1.4Z" />
          {/* Africa */}
          <path d="M33.4 21.3c1.6-.3 3 .6 3 2 0 1.5-1.1 3.1-2.4 3.4-1.1.2-1.7-.6-1.5-1.8.1-.9-.4-1.2-.9-1.7-.8-.8-.1-1.8 1.8-1.9Z" />
          {/* Asia */}
          <path d="M38.4 16.7c2.6-1 5.6-1 7 .1 1 .8.4 1.9-.9 2.3-1 .3-.8 1-.1 1.4.9.6.4 1.6-.9 1.6-2.7 0-5.4-1-6.4-2.4-.7-1-.4-2.5 1.2-3Z" />
          {/* Australia */}
          <path d="M43.6 24.9c1.4-.5 3 .1 3.2 1.2.2 1-.8 1.7-2.1 1.7-1.3 0-2.6-.6-2.7-1.5-.1-.7.5-1.1 1.6-1.4Z" />
        </g>

        {/* Tassel cord running from the centre button out to the AI bob */}
        <path
          d="M32 21.4C42 20.4 51.4 21 51.2 25.4 51.1 28 51 30 50.9 32"
          stroke={`url(#${tasselId})`}
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
        />
        {/* Centre button */}
        <circle cx="32" cy="21.4" r="2.3" fill="white" />
        <circle cx="32" cy="21.4" r="1" fill="#F23B2E" />

        {/* Tassel bob */}
        <path d="M50.9 31c1.9 0 3 1.2 3 2.8 0 1.5-.7 4.8-1.4 6.5-.5 1.2-2.7 1.2-3.2 0-.7-1.7-1.4-5-1.4-6.5 0-1.6 1.1-2.8 3-2.8Z" fill={`url(#${tasselId})`} />

        {/* AI bob badge */}
        <circle cx="50.9" cy="27.4" r="6.4" fill="white" stroke="#F23B2E" strokeOpacity="0.18" strokeWidth="0.8" />
        <text
          x="50.9"
          y="29.9"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="6.6"
          fontWeight="800"
          letterSpacing="-0.2"
          fill="#E2231A"
        >
          AI
        </text>
      </svg>
    </span>
  )
}

export function BrandLockup({
  className,
  iconClassName,
  titleClassName,
  subtitleClassName,
  subtitle = 'Your Path to Universities Abroad',
  iconSize = 42,
}: BrandLockupProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <BrandMark size={iconSize} className={iconClassName} />
      <div>
        <p className={cn('text-sm font-black tracking-tight text-slate-900', titleClassName)}>Prof<span className="text-red-600">AI</span></p>
        <p className={cn('text-xs font-medium text-slate-700', subtitleClassName)}>{subtitle}</p>
      </div>
    </div>
  )
}

