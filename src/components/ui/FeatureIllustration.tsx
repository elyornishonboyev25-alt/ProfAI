import { BookOpenText, Calculator, Headphones, Mic2, PenLine, Sparkles } from 'lucide-react'
import { cn } from '@/components/ui/utils'

export type FeatureIllustrationKind = 'math' | 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary'

const ICONS = {
  math: Calculator,
  reading: BookOpenText,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic2,
  vocabulary: BookOpenText,
} as const

export function FeatureIllustration({ kind, className }: { kind: FeatureIllustrationKind; className?: string }) {
  const Icon = ICONS[kind]
  return (
    <div className={cn('feature-illustration', className)} aria-hidden="true">
      <span className="feature-illustration-glow" />
      <Icon className="feature-illustration-main" strokeWidth={1.35} />
      <Sparkles className="feature-illustration-spark" strokeWidth={1.6} />
      <svg viewBox="0 0 88 62" className="feature-illustration-chart">
        <path d="M5 54V38h13v16M27 54V29h13v25M49 54V19h13v35M71 54V8" />
        <path d="m4 24 17-13 14 11L58 3" />
        <path d="m51 4 8-2-1 9" />
      </svg>
    </div>
  )
}
