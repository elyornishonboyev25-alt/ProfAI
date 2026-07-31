import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

type StickerTone = 'amber' | 'red' | 'rose' | 'emerald' | 'blue'

const tones: Record<StickerTone, string> = {
  amber: 'from-amber-300 via-orange-500 to-red-600 shadow-[0_12px_28px_rgba(245,158,11,.34)]',
  red: 'from-red-400 via-red-600 to-rose-800 shadow-[0_12px_28px_rgba(220,38,38,.34)]',
  rose: 'from-rose-300 via-rose-500 to-red-700 shadow-[0_12px_28px_rgba(244,63,94,.32)]',
  emerald: 'from-emerald-300 via-emerald-500 to-teal-700 shadow-[0_12px_28px_rgba(16,185,129,.3)]',
  blue: 'from-sky-300 via-blue-500 to-indigo-700 shadow-[0_12px_28px_rgba(37,99,235,.3)]',
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
  const { minimalMotion } = useMotionPreferences()
  const dimensions = size === 'lg' ? 'h-12 w-12 rounded-2xl' : size === 'sm' ? 'h-8 w-8 rounded-[.7rem]' : 'h-10 w-10 rounded-xl'
  const iconSize = size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <motion.span
      whileHover={minimalMotion ? undefined : { y: -2, rotate: -2, scale: 1.04 }}
      className={`feature-sticker relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/60 bg-gradient-to-br text-white ring-1 ring-white/55 ${dimensions} ${tones[tone]} ${className}`}
    >
      <span className="absolute inset-x-1 top-1 h-[42%] rounded-full bg-gradient-to-b from-white/65 to-transparent" />
      <span className="absolute -bottom-3 -right-2 h-7 w-7 rounded-full bg-black/18 blur-md" />
      <Icon className={`relative drop-shadow-sm ${iconSize}`} />
    </motion.span>
  )
}
