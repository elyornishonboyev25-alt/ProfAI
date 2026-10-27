import type { CSSProperties } from 'react'
import { cn } from '@/components/ui/utils'
import { useCopy } from '@/i18n/interface'
import './brand.css'

type BrandMarkProps = {
  size?: number
  className?: string
}

type BrandLogoProps = {
  height?: number
  className?: string
}

type BrandLockupProps = {
  className?: string
  subtitleClassName?: string
  subtitle?: string
  iconSize?: number
}

// The official horizontal artwork has a transparent canvas and its own viewBox.
export function BrandLogo({ height = 48, className }: BrandLogoProps) {
  return (
    <span
      className={cn('brand-logo', className)}
      style={{ '--brand-logo-height': `${height}px` } as CSSProperties}
      role="img"
      aria-label="ivyGoo"
    >
      <img
        className="brand-logo-artwork"
        src="/brand/ivygoo-horizontal.svg"
        width={844}
        height={310}
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
      />
    </span>
  )
}

export function BrandMark({ size = 44, className }: BrandMarkProps) {
  return <img src="/logo.svg?v=20261027" width={size} height={size} alt="" aria-hidden="true" className={cn('brand-mark inline-block shrink-0 object-contain', className)} />
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

