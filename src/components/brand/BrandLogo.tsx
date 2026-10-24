import { useId, type CSSProperties } from 'react'
import { cn } from '@/components/ui/utils'
import { useCopy } from '@/i18n/interface'
import './brand.css'

type BrandMarkProps = {
  size?: number
  className?: string
}

type BrandLogoProps = {
  height?: number
  variant?: 'horizontal' | 'stacked'
  className?: string
}

type BrandLockupProps = {
  className?: string
  subtitleClassName?: string
  subtitle?: string
  iconSize?: number
}

// Preserve the supplied lettering and shading; exclude only the white margins.
export function BrandLogo({ height = 48, variant = 'horizontal', className }: BrandLogoProps) {
  const filterId = `ivygoo-artwork-${useId().replace(/:/g, '')}`
  return (
    <span
      className={cn('brand-logo', `brand-logo--${variant}`, className)}
      style={{ '--brand-logo-height': `${height}px` } as CSSProperties}
      role="img"
      aria-label="ivyGoo"
    >
      <img
        className="brand-logo-artwork"
        style={{ filter: `url(#${filterId})` }}
        src={`/brand/ivygoo-${variant}.png`}
        width={variant === 'horizontal' ? 1672 : 1254}
        height={variant === 'horizontal' ? 941 : 1254}
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
      />
      {/* Remove the near-white canvas in the browser without altering the source artwork. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 3" />
            <feComponentTransfer><feFuncA type="linear" slope="20" intercept="-1" /></feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </span>
  )
}

export function BrandMark({ size = 44, className }: BrandMarkProps) {
  return <img src="/logo.svg" width={size} height={size} alt="" aria-hidden="true" className={cn('brand-mark inline-block shrink-0 object-contain', className)} />
}

export function BrandLockup({
  className,
  subtitleClassName,
  subtitle = 'Your Path to Universities Abroad',
  iconSize = 48,
}: BrandLockupProps) {
  const { c } = useCopy()
  return (
    <div className={cn('brand-lockup', className)}>
      <BrandLogo height={iconSize} />
      {subtitle && <p className={cn('brand-lockup-subtitle', subtitleClassName)}>{c(subtitle)}</p>}
    </div>
  )
}

