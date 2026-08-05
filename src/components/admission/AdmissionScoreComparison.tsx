import { CheckCircle2, CircleAlert, MinusCircle } from 'lucide-react'
import type { AdmissionRequirement, University } from '@/data/admission'
import type { AdmissionScores } from '@/hooks/useAdmissionScores'

type Props = {
  university: University
  scores: AdmissionScores
  compact?: boolean
}

function requirementFor(university: University, comparison: NonNullable<AdmissionRequirement['comparison']>) {
  return university.admission?.bachelor?.find((item) => item.comparison === comparison)
}

function targetOf(requirement: AdmissionRequirement | undefined, comparison: NonNullable<AdmissionRequirement['comparison']>) {
  if (requirement?.comparison !== comparison) return null
  return requirement.minimum ?? requirement.recommended ?? null
}

function formatScore(kind: 'SAT' | 'IELTS', value: number) {
  return kind === 'IELTS' ? value.toFixed(1) : String(value)
}

function Metric({
  kind,
  requirement,
  userScore,
  compact,
  comparison,
}: {
  kind: 'SAT' | 'IELTS'
  requirement?: AdmissionRequirement
  userScore: number | null
  compact: boolean
  comparison: NonNullable<AdmissionRequirement['comparison']>
}) {
  const target = targetOf(requirement, comparison)
  const gap = target !== null && userScore !== null ? Math.max(0, target - userScore) : null
  const meets = gap === 0
  const isRecommendation = requirement?.minimum === undefined && requirement?.recommended !== undefined

  return (
    <div className={`rounded-xl border px-3 ${compact ? 'py-2' : 'py-3'} ${meets ? 'border-emerald-200 bg-emerald-50/70' : gap && gap > 0 ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-slate-50/80'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.11em] text-slate-400">{kind}</p>
          <p className={`${compact ? 'text-[11px]' : 'text-sm'} mt-0.5 font-bold leading-snug text-slate-800`}>
            {requirement?.value ?? 'No policy listed'}
          </p>
        </div>
        {meets ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : gap && gap > 0 ? <CircleAlert className="h-4 w-4 shrink-0 text-amber-600" /> : <MinusCircle className="h-4 w-4 shrink-0 text-slate-400" />}
      </div>
      {!compact ? (
        <p className="mt-1.5 text-[11px] font-semibold text-slate-600">
          {userScore === null
            ? 'Profile score not added yet'
            : target === null
              ? `Your score: ${formatScore(kind, userScore)} · no numeric cutoff to compare`
              : meets
                ? `Your ${formatScore(kind, userScore)} meets the published ${isRecommendation ? 'competitive score' : 'minimum'}`
                : `${isRecommendation ? 'Competitive-score gap' : 'You need'}: +${formatScore(kind, gap as number)}`}
        </p>
      ) : gap !== null ? (
        <p className={`mt-1 text-[10px] font-black ${meets ? 'text-emerald-700' : 'text-amber-700'}`}>
          {meets ? 'Score met' : `Need +${formatScore(kind, gap)}`}
        </p>
      ) : null}
    </div>
  )
}

export default function AdmissionScoreComparison({ university, scores, compact = false }: Props) {
  return (
    <div className={`grid grid-cols-2 ${compact ? 'gap-2' : 'gap-3'}`}>
      <Metric kind="SAT" comparison="satTotal" requirement={requirementFor(university, 'satTotal') ?? university.admission?.bachelor?.find((item) => item.label.startsWith('SAT'))} userScore={scores.satTotal} compact={compact} />
      <Metric kind="IELTS" comparison="ieltsOverall" requirement={requirementFor(university, 'ieltsOverall') ?? university.admission?.bachelor?.find((item) => item.label === 'IELTS')} userScore={scores.ieltsOverall} compact={compact} />
    </div>
  )
}
