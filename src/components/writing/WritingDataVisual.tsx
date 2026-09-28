import type { WritingDataVisual as Visual } from '@/data/writingTestData'

const colors = ['#ba1d34', '#245e85']
const fmt = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value)

export default function WritingDataVisual({ visual }: { visual: Visual }) {
  const values = visual.series.flatMap((series) => series.values)
  const smallest = Math.min(...values)
  const largest = Math.max(...values)
  const barMode = visual.kind === 'bar'
  const minimum = barMode ? Math.min(0, smallest) : Math.floor((smallest - (largest - smallest || 1) * 0.15) * 10) / 10
  const maximum = barMode ? Math.max(0, largest) * 1.15 || 1 : largest + (largest - smallest || 1) * 0.15
  const x = (index: number) => 92 + index * (540 / Math.max(1, visual.years.length - 1))
  const y = (value: number) => 330 - ((value - minimum) / (maximum - minimum || 1)) * 240
  const ticks = Array.from({ length: 5 }, (_, index) => minimum + (maximum - minimum) * index / 4)

  return (
    <figure className="writing-data-visual">
      <svg viewBox="0 0 700 415" className="h-auto w-full" role="img" aria-label={`${visual.title}. ${visual.series.map((series) => `${series.label}: ${visual.years.map((year, index) => `${year} ${series.values[index]}`).join(', ')}`).join('; ')}. Unit: ${visual.unit}.`}>
        <rect x="0" y="0" width="700" height="415" rx="16" fill="#fff" />
        <text x="350" y="34" textAnchor="middle" fill="#172033" fontSize="17" fontWeight="700">{visual.title}</text>
        <text x="350" y="57" textAnchor="middle" fill="#667085" fontSize="12">{visual.unit}</text>
        {visual.kind === 'table' ? (
          <g>
            <rect x="44" y="90" width="612" height="48" rx="8" fill="#fbecef" />
            <text x="70" y="120" fill="#811629" fontSize="14" fontWeight="700">{typeof visual.years[0] === 'string' ? 'Category' : 'Year'}</text>
            {visual.series.map((series, seriesIndex) => <text key={series.label} x={visual.series.length === 1 ? 460 : 360 + seriesIndex * 150} y="120" textAnchor="middle" fill="#811629" fontSize="13" fontWeight="700">{series.label}</text>)}
            {visual.years.map((year, index) => (
              <g key={year}>
                <rect x="44" y={138 + index * 47} width="612" height="47" fill={index % 2 === 0 ? '#fff' : '#f8fafc'} />
                <line x1="44" x2="656" y1={185 + index * 47} y2={185 + index * 47} stroke="#e5e7eb" />
                <text x="70" y={168 + index * 47} fill="#344054" fontSize="14">{year}</text>
                {visual.series.map((series, seriesIndex) => <text key={series.label} x={visual.series.length === 1 ? 460 : 360 + seriesIndex * 150} y={168 + index * 47} textAnchor="middle" fill="#172033" fontSize="14" fontWeight="600">{fmt(series.values[index])}</text>)}
              </g>
            ))}
          </g>
        ) : (
          <g>
            {ticks.map((tick, index) => (
              <g key={index}>
                <line x1="76" y1={y(tick)} x2="650" y2={y(tick)} stroke="#e9edf3" />
                <text x="66" y={y(tick) + 4} textAnchor="end" fill="#667085" fontSize="11">{fmt(Number(tick.toFixed(2)))}</text>
              </g>
            ))}
            <line x1="76" y1="90" x2="76" y2="330" stroke="#667085" />
            <line x1="76" y1="330" x2="650" y2="330" stroke="#667085" />
            {visual.years.map((year, index) => <text key={year} x={x(index)} y="353" textAnchor="middle" fill="#475467" fontSize="12">{year}</text>)}
            {visual.series.map((series, seriesIndex) => barMode ? (
              <g key={series.label}>
                {series.values.map((value, index) => {
                  const width = visual.series.length === 1 ? 58 : 31
                  const centre = x(index) + (seriesIndex - (visual.series.length - 1) / 2) * (width + 2)
                  const top = Math.min(y(value), y(0))
                  return <g key={index}><rect x={centre - width / 2} y={top} width={width} height={Math.max(1, Math.abs(y(0) - y(value)))} rx="3" fill={colors[seriesIndex]} /><text x={centre} y={top - 7} textAnchor="middle" fill="#344054" fontSize="10">{fmt(value)}</text></g>
                })}
              </g>
            ) : (
              <g key={series.label}>
                <path d={series.values.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ')} fill="none" stroke={colors[seriesIndex]} strokeWidth="3" strokeLinejoin="round" />
                {series.values.map((value, index) => <g key={index}><circle cx={x(index)} cy={y(value)} r="5" fill={colors[seriesIndex]} stroke="#fff" strokeWidth="2" /><text x={x(index)} y={y(value) - 13} textAnchor="middle" fill="#344054" fontSize="10">{fmt(value)}</text></g>)}
              </g>
            ))}
            {visual.series.length > 1 && visual.series.map((series, index) => <g key={series.label}><rect x={200 + index * 200} y="379" width="14" height="8" rx="2" fill={colors[index]} /><text x={221 + index * 200} y="387" fill="#475467" fontSize="11">{series.label}</text></g>)}
          </g>
        )}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 text-xs text-slate-500">
        <span>{visual.note ?? 'Selected observations'} · {visual.unit}</span>
        {visual.sourceUrl ? <a href={visual.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-red-700 underline underline-offset-2">Source: {visual.sourceLabel}</a> : null}
      </figcaption>
    </figure>
  )
}
