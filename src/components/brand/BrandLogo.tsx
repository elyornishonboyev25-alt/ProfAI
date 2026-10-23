import { cn } from '@/components/ui/utils'
import { useCopy } from '@/i18n/interface'

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
  return <img src="/logo.svg" width={size} height={size} alt="" aria-hidden="true" className={cn('inline-block shrink-0', className)} />
}

export function BrandLockup({
  className,
  iconClassName,
  titleClassName,
  subtitleClassName,
  subtitle = 'Your Path to Universities Abroad',
  iconSize = 42,
}: BrandLockupProps) {
  const { c } = useCopy()
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <BrandMark size={iconSize} className={iconClassName} />
      <div>
        <p className={cn('text-sm font-black tracking-tight text-slate-900', titleClassName)}>Ivy<span className="text-red-600">goo</span></p>
        <p className={cn('text-xs font-medium text-slate-700', subtitleClassName)}>{c(subtitle)}</p>
      </div>
    </div>
  )
}

