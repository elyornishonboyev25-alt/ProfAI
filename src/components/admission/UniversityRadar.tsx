import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { presentIndicators } from '@/data/admission'
import type { QSIndicators } from '@/data/admission'
import { useCopy } from '@/i18n/interface'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

// A QS-performance radar (spider) chart. Renders every indicator the university has a
// value for, on a 0–100 scale, in the school's brand colour. ResponsiveContainer makes
// it scale cleanly to its box at any width, so the diagram is never clipped.
export default function UniversityRadar({
  indicators,
  accent,
}: {
  indicators: QSIndicators
  accent: string
}) {
  const { c } = useCopy()
  const { minimalMotion } = useMotionPreferences()
  const data = presentIndicators(indicators).map(({ meta, value }) => ({ label: c(meta.short), value }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="72%" margin={{ top: 14, right: 22, bottom: 14, left: 22 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickCount={5} />
        <Radar
          name={c('QS score')}
          dataKey="value"
          stroke={accent}
          fill={accent}
          fillOpacity={0.28}
          strokeWidth={2}
          dot={{ r: 2.5, fill: accent, strokeWidth: 0 }}
          isAnimationActive={!minimalMotion}
          animationDuration={800}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
