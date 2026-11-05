import UiText from '@/components/common/UiText'
import ProgressRing from '@/components/fx/ProgressRing'

// Radial IELTS band gauge (0–9). Reuses the shared ProgressRing primitive.
// Colour shifts from red (low) through amber to emerald (high) so the score reads
// at a glance.

function bandColors(band: number): { from: string; to: string } {
  if (band >= 7) return { from: '#10b981', to: '#059669' } // emerald
  if (band >= 6) return { from: '#f59e0b', to: '#d97706' } // amber
  if (band >= 5) return { from: '#fb923c', to: '#ea580c' } // orange
  return { from: '#ef4444', to: '#b91c1c' } // red
}

export default function BandGauge({
  band,
  label,
  size = 104,
}: {
  band: number
  label?: string
  size?: number
}) {
  const colors = bandColors(band)
  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing value={(band / 9) * 100} size={size} stroke={9} from={colors.from} to={colors.to}>
        <div className="text-center leading-none">
          <p className="text-2xl font-black text-slate-900">{band.toFixed(1)}</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">/ 9.0</p>
        </div>
      </ProgressRing>
      {label ? <p className="text-xs font-semibold text-slate-600"><UiText text={label} /></p> : null}
    </div>
  )
}
