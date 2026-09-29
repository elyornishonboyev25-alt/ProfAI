import type { WritingDataVisual as Visual } from '@/data/writingTestData'

const ink = '#151515'
const shades = [ink, '#949494']
const fmt = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)

function lines(label: string, width = 16) {
  const result: string[] = []
  for (const word of label.split(' ')) {
    const last = result.length - 1
    if (last >= 0 && (result[last] + ' ' + word).length <= width) result[last] += ' ' + word
    else result.push(word)
  }
  return result
}

function Title({ visual }: { visual: Visual }) {
  const titleLines = lines(visual.title, 43)
  return <g fontFamily="Georgia, 'Times New Roman', serif" textAnchor="middle" fill={ink}>
    {titleLines.map((line, index) => <text key={index} x="380" y={35 + index * 27} fontSize="23" fontWeight="700">{line}</text>)}
    <text x="380" y={titleLines.length > 1 ? 100 : 72} fontSize="15">{visual.unit}</text>
  </g>
}

function Axes({ visual }: { visual: Visual }) {
  const all = visual.series.flatMap((series) => series.values)
  const low = visual.kind === 'bar' ? Math.min(0, ...all) : Math.min(...all)
  const high = Math.max(0, ...all)
  const span = Math.max(1, high - low)
  const floor = visual.kind === 'bar' ? Math.min(0, low) : Math.floor((low - span * 0.1) * 10) / 10
  const ceiling = high + span * 0.13
  const left = 72, right = 720, top = 118, bottom = 390
  const x = (index: number) => left + 52 + index * ((right - left - 104) / Math.max(1, visual.years.length - 1))
  const y = (value: number) => bottom - (value - floor) / (ceiling - floor) * (bottom - top)
  const barWidth = visual.series.length === 1 ? 52 : 29
  return <g fontFamily="Georgia, 'Times New Roman', serif" fill={ink}>
    {Array.from({ length: 6 }, (_, index) => floor + (ceiling - floor) * index / 5).map((tick, index) => <g key={index}>
      <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="#aaa" strokeWidth="0.8" />
      <text x={left - 12} y={y(tick) + 5} textAnchor="end" fontSize="14">{fmt(Number(tick.toFixed(1)))}</text>
    </g>)}
    <path d={`M${left} ${top}V${bottom}H${right}`} fill="none" stroke={ink} strokeWidth="1.5" />
    {visual.years.map((year, index) => <text key={String(year)} x={x(index)} y="414" textAnchor="middle" fontSize="14">
      {lines(String(year), 13).slice(0, 3).map((line, row) => <tspan key={row} x={x(index)} dy={row ? 16 : 0}>{line}</tspan>)}
    </text>)}
    {visual.series.map((series, seriesIndex) => visual.kind === 'bar'
      ? <g key={series.label}>{series.values.map((value, index) => {
        const center = x(index) + (seriesIndex - (visual.series.length - 1) / 2) * (barWidth + 4)
        const barTop = Math.min(y(value), y(0))
        return <g key={index}>
          <rect x={center - barWidth / 2} y={barTop} width={barWidth} height={Math.max(1, Math.abs(y(0) - y(value)))} fill={shades[seriesIndex % 2]} />
          <text x={center} y={barTop - 7} textAnchor="middle" fontSize="12">{fmt(value)}</text>
        </g>
      })}</g>
      : <g key={series.label}>
        <path d={series.values.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ')} fill="none" stroke={shades[seriesIndex % 2]} strokeWidth="3" strokeDasharray={seriesIndex ? '9 5' : undefined} strokeLinejoin="round" />
        {series.values.map((value, index) => <g key={index}>
          <circle cx={x(index)} cy={y(value)} r="4.5" fill={shades[seriesIndex % 2]} />
          <text x={x(index)} y={y(value) + (seriesIndex ? 19 : -11)} textAnchor="middle" fontSize="12">{fmt(value)}</text>
        </g>)}
      </g>)}
    {visual.series.length > 1 && visual.series.map((series, index) => <g key={series.label}>
      <rect x={150 + index * 285} y="468" width="18" height="14" fill={shades[index % 2]} />
      <text x={176 + index * 285} y="481" fontSize="15">{series.label}</text>
    </g>)}
  </g>
}

function Table({ visual }: { visual: Visual }) {
  return <g fontFamily="Georgia, 'Times New Roman', serif" fill={ink}>
    <rect x="80" y="118" width="600" height="55" fill="#ddd" stroke={ink} />
    <text x="98" y="152" fontSize="18" fontWeight="700">{typeof visual.years[0] === 'number' ? 'Year' : 'Category'}</text>
    {visual.series.map((series, index) => <text key={series.label} x={visual.series.length === 1 ? 490 : 410 + index * 165} y="152" textAnchor="middle" fontSize="16" fontWeight="700">{series.label}</text>)}
    {visual.years.map((year, index) => <g key={String(year)}>
      <rect x="80" y={173 + index * 51} width="600" height="51" fill={index % 2 ? '#f1f1f1' : '#fff'} stroke="#aaa" />
      <text x="98" y={205 + index * 51} fontSize="16">{year}</text>
      {visual.series.map((series, seriesIndex) => <text key={series.label} x={visual.series.length === 1 ? 490 : 410 + seriesIndex * 165} y={205 + index * 51} textAnchor="middle" fontSize="17">{fmt(series.values[index])}</text>)}
    </g>)}
    <path d="M80 118V428 M680 118V428" stroke={ink} />
  </g>
}

function Pies({ visual }: { visual: Visual }) {
  return <g fontFamily="Georgia, 'Times New Roman', serif" fill={ink}>
    {visual.series[0].values.map((value, index) => {
      const cx = 102 + index * 138, cy = 253, r = 52
      const percent = Math.max(0, Math.min(100, value))
      const angle = percent / 100 * 2 * Math.PI
      const endX = cx + Math.sin(angle) * r, endY = cy - Math.cos(angle) * r
      return <g key={String(visual.years[index])}>
        <circle cx={cx} cy={cy} r={r} fill="#ddd" stroke={ink} strokeWidth="1.5" />
        {percent >= 100 ? <circle cx={cx} cy={cy} r={r} fill={ink} /> : percent > 0 ? <path d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${percent > 50 ? 1 : 0} 1 ${endX} ${endY} Z`} fill={ink} /> : null}
        <text x={cx} y="350" textAnchor="middle" fontSize="15">{lines(String(visual.years[index]), 13).slice(0, 3).map((line, row) => <tspan key={row} x={cx} dy={row ? 17 : 0}>{line}</tspan>)}</text>
        <text x={cx} y="402" textAnchor="middle" fontSize="17" fontWeight="700">{fmt(value)}%</text>
      </g>
    })}
    <rect x="185" y="455" width="18" height="16" fill={ink} />
    <text x="211" y="470" fontSize="15">{visual.series[0].label}</text>
    <rect x="490" y="455" width="18" height="16" fill="#ddd" stroke={ink} />
    <text x="516" y="470" fontSize="15">Remaining share</text>
  </g>
}

export default function WritingDataVisual({ visual }: { visual: Visual }) {
  const description = `${visual.title}. ${visual.series.map((series) => `${series.label}: ${visual.years.map((year, index) => `${year} ${series.values[index]}`).join(', ')}`).join('; ')}. Unit: ${visual.unit}.`
  return <figure className="writing-data-visual">
    <svg viewBox="0 0 760 500" className="h-auto w-full" role="img" aria-label={description}>
      <rect width="760" height="500" fill="white" />
      <Title visual={visual} />
      {visual.kind === 'table' ? <Table visual={visual} /> : visual.kind === 'pie' ? <Pies visual={visual} /> : <Axes visual={visual} />}
    </svg>
  </figure>
}
