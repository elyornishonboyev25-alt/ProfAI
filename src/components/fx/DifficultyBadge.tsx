export type Difficulty = 'easy' | 'medium' | 'hard'

const map: Record<Difficulty, { label: string; cls: string; dot: string }> = {
  easy: { label: 'Easy', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  medium: { label: 'Medium', cls: 'border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  hard: { label: 'Hard', cls: 'border-red-200 bg-red-50 text-red-700', dot: 'bg-red-500' },
}

interface DifficultyBadgeProps {
  level: Difficulty
  className?: string
}

/** Semantic difficulty pill (Easy/Medium/Hard). */
export default function DifficultyBadge({ level, className = '' }: DifficultyBadgeProps) {
  const d = map[level]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${d.cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${d.dot}`} />
      {d.label}
    </span>
  )
}
