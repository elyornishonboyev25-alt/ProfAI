import type { ComponentType } from 'react'
type StickerTone = 'amber' | 'red' | 'rose' | 'emerald' | 'blue'

const tones: Record<StickerTone, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700 shadow-[0_8px_20px_rgba(217,119,6,.1)]',
  red: 'border-red-200 bg-red-50 text-red-700 shadow-[0_8px_20px_rgba(220,38,38,.1)]',
  rose: 'border-rose-200 bg-rose-50 text-rose-700 shadow-[0_8px_20px_rgba(225,29,72,.1)]',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_8px_20px_rgba(5,150,105,.1)]',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 shadow-[0_8px_20px_rgba(37,99,235,.1)]',
}

export default function FeatureSticker({
  icon: Icon,
  tone = 'red',
  size = 'md',
  className = '',
}: {
  icon: ComponentType<{ className?: string }>
  tone?: StickerTone
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dimensions = size === 'lg' ? 'h-12 w-12 rounded-2xl' : size === 'sm' ? 'h-8 w-8 rounded-[.7rem]' : 'h-10 w-10 rounded-xl'
  const iconSize = size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center border ${dimensions} ${tones[tone]} ${className}`}
    >
      <span className="absolute inset-[3px] rounded-[inherit] border border-white/80" />
      <Icon className={`relative ${iconSize}`} />
    </span>
  )
}
