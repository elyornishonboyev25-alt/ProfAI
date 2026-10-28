import { useId } from 'react'

/** Retain the supplied pie geometry, labels and hatching without the background logo. */
export default function SpainVisitorAgeCharts({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const point = (angle: number, cy: number, radius: number) => [256 + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  return <svg viewBox="0 0 512 512" width="512" height="512" role="img" className={className}
    aria-label="Age of visitors from the UK to Spain in 1983 and 2003" data-supplied-writing-diagram="spain-visitor-ages">
    <title>Age of visitors from the UK to Spain in 1983 and 2003</title>
    <defs>
      <pattern id={`${id}-dots`} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="white" /><circle cx="2" cy="2" r=".5" fill="#999" /></pattern>
      <pattern id={`${id}-lines`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><rect width="4" height="4" fill="white" /><path d="M1 0V4" stroke="#e85b60" strokeWidth=".7" /></pattern>
      <pattern id={`${id}-grid`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><rect width="5" height="5" fill="white" /><path d="M0 0H5M0 0V5" stroke="#e85b60" strokeWidth=".7" /></pattern>
    </defs>
    <rect width="512" height="512" fill="white" />
    {[{ year: 1983, cy: 151, values: [10, 4, 20, 50, 16] }, { year: 2003, cy: 381, values: [12, 15, 12, 35, 26] }].map(chart => {
      let angle = -Math.PI / 2
      const fills = [`url(#${id}-dots)`, `url(#${id}-lines)`, '#ef9ea2', `url(#${id}-grid)`, '#ef3933']
      return <g key={chart.year} fontFamily="Arial, Helvetica, sans-serif" fontSize="10" fill="#222">
        <text x="256" y={chart.cy - 108} textAnchor="middle" fontWeight="700" fontSize="12">In {chart.year}</text>
        {chart.values.map((value, index) => {
          const start = angle
          angle += value / 100 * Math.PI * 2
          const [sx, sy] = point(start, chart.cy, 82), [ex, ey] = point(angle, chart.cy, 82)
          const [tx, ty] = point((start + angle) / 2, chart.cy, 58)
          const [lx, ly] = point((start + angle) / 2, chart.cy, 82)
          const right = index < 3
          const labelY = ly - 5
          const lineEnd = right ? (index === 0 ? 369 : 393) : (index === 3 ? 128 : 140)
          return <g key={index} data-age-group={['0-15 years', '16-24 years', '25-34 years', '35-54 years', '55+ years'][index]}>
            <path d={`M256 ${chart.cy}L${sx} ${sy}A82 82 0 ${value > 50 ? 1 : 0} 1 ${ex} ${ey}Z`} fill={fills[index]} stroke="white" strokeWidth=".5" />
            {index > 1 && <rect x={tx - 13} y={ty - 8} width="26" height="17" rx="2" fill="white" />}
            <text x={tx} y={ty + 4} textAnchor="middle">{value}%</text>
            <path d={`M${lx} ${ly}H${lineEnd}`} stroke="#e09094" strokeWidth="1" fill="none" />
            <text x={right ? lineEnd - 3 : lineEnd} y={labelY} textAnchor={right ? 'end' : 'start'}>{['0-15 years', '16-24 years', '25-34 years', '35-54 years', '55+ years'][index]}</text>
          </g>
        })}
      </g>
    })}
  </svg>
}
