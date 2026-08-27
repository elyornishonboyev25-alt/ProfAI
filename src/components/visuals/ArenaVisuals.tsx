import {
  BookOpenText,
  Calculator,
  Headphones,
  Languages,
  Mic2,
  PenLine,
  Volume2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { cn } from '@/components/ui/utils'

export type StudyIllustrationVariant =
  | 'sat-math'
  | 'sat-reading'
  | 'ielts-listening'
  | 'ielts-reading'
  | 'ielts-writing'
  | 'ielts-speaking'
  | 'vocabulary'
  | 'academic-reading'
  | 'listening'
  | 'shadowing'
  | 'writing'
  | 'speaking'

export const ARENA_GLASS_SURFACE =
  'relative isolate overflow-hidden rounded-[2rem] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,.94),rgba(255,255,255,.82)_54%,rgba(239,246,255,.76))] shadow-[0_24px_70px_rgba(55,65,100,.11),inset_0_1px_0_rgba(255,255,255,.99)] backdrop-blur-2xl'

const ICONS = {
  'sat-math': Calculator,
  'sat-reading': BookOpenText,
  'ielts-listening': Headphones,
  'ielts-reading': BookOpenText,
  'ielts-writing': PenLine,
  'ielts-speaking': Mic2,
  vocabulary: Languages,
  'academic-reading': BookOpenText,
  listening: Headphones,
  shadowing: Volume2,
  writing: PenLine,
  speaking: Mic2,
} satisfies Record<StudyIllustrationVariant, typeof Calculator>

function AccentGraphic({ variant }: { variant: StudyIllustrationVariant }) {
  if (variant === 'sat-math') {
    return (
      <svg className="h-full w-full" viewBox="0 0 96 82" fill="none">
        <path d="M7 72V49h16v23M31 72V37h16v35M55 72V23h16v49M79 72V9" fill="rgba(239,53,61,.24)" stroke="currentColor" strokeWidth="1.8" />
        <path d="m4 31 20-21 17 14L66 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m56 4 11-2-2 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (variant === 'sat-reading' || variant === 'ielts-writing' || variant === 'writing') {
    return (
      <svg className="h-full w-full" viewBox="0 0 82 82" fill="none">
        <path d="m14 66 42-47 11 10-43 47-15 3 5-13Z" fill="rgba(248,113,113,.34)" stroke="currentColor" strokeWidth="1.8" />
        <path d="m56 19 5-6c2-2 5-2 7 0l3 3c2 2 2 5 0 7l-5 6-10-10Z" fill="rgba(254,226,226,.92)" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }

  if (variant === 'ielts-listening' || variant === 'listening' || variant === 'shadowing') {
    return (
      <svg className="h-full w-full" viewBox="0 0 104 70" fill="none">
        <path d="M8 36h8l5-14 8 31 9-42 9 46 8-28 8 16 7-9h26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="92" cy="36" r="5" fill="rgba(239,53,61,.3)" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }

  if (variant === 'ielts-reading' || variant === 'academic-reading' || variant === 'vocabulary') {
    return (
      <svg className="h-full w-full" viewBox="0 0 90 76" fill="none">
        <path d="M12 17h51M12 29h43M12 41h49M12 53h30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="66" cy="52" r="14" fill="rgba(239,53,61,.16)" stroke="currentColor" strokeWidth="2" />
        <path d="m76 63 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg className="h-full w-full" viewBox="0 0 94 72" fill="none">
      <path d="M8 39h7l4-12 7 25 8-38 8 43 8-30 7 18 7-10 7 8h15" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M70 10c8 2 14 7 17 15M73 2c12 3 21 10 25 21" stroke="rgba(239,53,61,.58)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function StudyIllustration({
  variant,
  className,
  compact = false,
}: {
  variant: StudyIllustrationVariant
  className?: string
  compact?: boolean
}) {
  const Icon = ICONS[variant]

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative isolate flex shrink-0 items-end text-[#505766]',
        compact ? 'h-[5.8rem] w-[9rem]' : 'h-[7.4rem] w-[11.5rem]',
        className,
      )}
    >
      <span className="absolute bottom-1 left-5 -z-10 h-16 w-24 rounded-full bg-red-300/22 blur-2xl" />
      <span className="absolute bottom-3 left-1 grid h-[5.3rem] w-[5.3rem] place-items-center rounded-[1.75rem] border border-white/65 bg-white/22 shadow-[inset_0_1px_0_rgba(255,255,255,.8)] backdrop-blur-sm transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-[1.03]">
        <Icon className="h-[4.1rem] w-[4.1rem] text-[#505766]" fill={variant.includes('reading') ? 'rgba(248,113,113,.12)' : 'none'} strokeWidth={1.3} />
      </span>
      <span className="absolute bottom-0 right-0 h-[5.1rem] w-[6.2rem] transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
        <AccentGraphic variant={variant} />
      </span>
    </div>
  )
}

function BackdropOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  const { minimalMotion } = useMotionPreferences()

  return (
    <motion.span
      aria-hidden="true"
      animate={minimalMotion ? undefined : { y: [0, -9, 0], x: [0, 4, 0], rotate: [0, 2, 0] }}
      transition={{ duration: 8.5, delay, repeat: Infinity, ease: 'easeInOut' }}
      className={cn(
        'absolute rounded-full border border-white/70 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.9),rgba(219,234,254,.28)_42%,rgba(248,113,113,.12)_72%,rgba(255,255,255,.05))] opacity-65 shadow-[inset_-12px_-16px_30px_rgba(37,99,235,.08),0_18px_45px_rgba(30,64,175,.08)] backdrop-blur-sm',
        className,
      )}
    />
  )
}

export function ArenaBackdrop({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(circle_at_9%_8%,rgba(254,202,202,.5),transparent_32%),radial-gradient(circle_at_88%_7%,rgba(191,219,254,.68),transparent_39%),linear-gradient(120deg,rgba(255,249,250,.94),rgba(248,250,255,.82)_48%,rgba(238,245,255,.92))]" />
      <div className="absolute left-[34%] top-[24rem] h-60 w-60 rounded-full bg-red-100/35 blur-[80px]" />
      <div className="absolute right-[12%] top-[38rem] h-72 w-72 rounded-full bg-blue-200/35 blur-[90px]" />
      <BackdropOrb className={compact ? '-left-8 top-28 h-24 w-24' : 'left-[3%] top-36 h-28 w-28'} />
      <BackdropOrb className={compact ? '-right-10 top-20 h-32 w-32' : 'right-[2%] top-20 h-36 w-36'} delay={1.2} />
    </div>
  )
}
