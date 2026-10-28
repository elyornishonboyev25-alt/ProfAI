/** Source-coordinate drawing of Test 32. Only the promotional header is omitted. */
export default function MobilePhoneSalesChart({ className = '' }: { className?: string }) {
  const x = (i: number) => 92 + i * 49.7
  const y = (value: number) => 323 - value * 5.75
  const series = [
    { name: 'Motorola', color: '#ff1010', values: [32, 31, 27, 24, 21, 19, 14, 15, 17, 16, 18], marker: 'diamond', dashed: true },
    { name: 'Nokia', color: '#075cff', values: [21, 23, 20, 19, 22, 28, 31, 35, 37, 36, 30], marker: 'square', dashed: false },
    { name: 'Sony Ericsson', color: '#139b0b', values: [11, 10, 12, 14, 15, 11, 10, 9, 8, 7, 10], marker: 'triangle', dashed: false },
  ]
  const marker = (kind: string, cx: number, cy: number, color: string) => kind === 'diamond'
    ? <path d={`M${cx} ${cy - 6}l6 6-6 6-6-6Z`} fill={color} />
    : kind === 'square' ? <rect x={cx - 4.5} y={cy - 4.5} width="9" height="9" fill={color} />
      : <path d={`M${cx} ${cy - 6}l6 11h-12Z`} fill={color} />
  return <svg viewBox="0 44 640 380" width="640" height="380" role="img"
    aria-label="Market share of three manufacturers of mobile phones, 1994 to 2004. Motorola, Nokia and Sony Ericsson."
    data-supplied-writing-diagram="mobile-phone-sales" className={className}>
    <title>Market share of three manufacturers of mobile phones</title>
    <rect y="44" width="640" height="380" fill="white" />
    <rect x="4" y="45" width="632" height="377" rx="4" fill="none" stroke="#075cff" strokeWidth="2" />
    <g fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fill="#080d55">
      <rect x="24" y="49" width="592" height="31" rx="4" fill="#dff3ff" stroke="#168bff" />
      <text x="320" y="71" textAnchor="middle" fontSize="18" textLength="484" lengthAdjust="spacingAndGlyphs">Market share of three manufacturers of mobile phones</text>
      <g stroke="#dedede" strokeWidth=".65" strokeDasharray="2 2">
        {Array.from({ length: 9 }, (_, i) => i * 5).map(v => <line key={v} x1="70" x2="622" y1={y(v)} y2={y(v)} />)}
        {Array.from({ length: 11 }, (_, i) => <line key={i} x1={x(i)} x2={x(i)} y1="93" y2="323" />)}
      </g>
      <path d="M70 93V323H622" stroke="#111" strokeWidth="1.8" fill="none" />
      {Array.from({ length: 9 }, (_, i) => i * 5).map(v => <g key={v}><path d={`M65 ${y(v)}h5`} stroke="#111" /><text x="59" y={y(v) + 4} textAnchor="end" fontSize="12">{v}</text></g>)}
      {Array.from({ length: 11 }, (_, i) => <g key={i}><path d={`M${x(i)} 323v5`} stroke="#111" /><text x={x(i)} y="342" textAnchor="middle" fontSize="12">{1994 + i}</text></g>)}
      <rect x="16" y="104" width="19" height="211" rx="4" fill="#c8edff" />
      <text transform="translate(30 209) rotate(-90)" textAnchor="middle" fontSize="12">Market share (percentage of sales)</text>
      {series.map(s => <g key={s.name} data-series={s.name}>
        <path d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '8 4' : undefined} />
        {s.values.map((v, i) => <g key={i}><title>{1994 + i}: {v}%</title>{marker(s.marker, x(i), y(v), s.color)}</g>)}
      </g>)}
      <rect x="310" y="350" width="64" height="20" rx="4" fill="#c8edff" />
      <text x="342" y="365" textAnchor="middle" fontSize="12">Year</text>
      <rect x="136" y="377" width="381" height="28" rx="4" fill="#e3f4ff" stroke="#269aff" strokeWidth=".7" />
      {series.map((s, i) => <g key={s.name}>
        <path d={`M${148 + i * 118} 391h43`} stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '5 3' : undefined} />
        {marker(s.marker, 170 + i * 118, 391, s.color)}
        <text x={195 + i * 118} y="395" fontSize="12">{s.name}</text>
      </g>)}
    </g>
  </svg>
}
