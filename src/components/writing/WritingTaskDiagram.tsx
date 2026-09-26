import type { WritingTask } from '@/data/writingTestData'

type Diagram = NonNullable<WritingTask['diagram']>

const educationGroups = [
  { label: '1970/71', part: 1000, full: 100 },
  { label: '1980/81', part: 860, full: 140 },
  { label: '1990/91', part: 900, full: 250 },
  { label: '1970/71', part: 740, full: 60 },
  { label: '1980/81', part: 830, full: 200 },
  { label: '1990/91', part: 1100, full: 260 },
]

function FurtherEducationChart() {
  const top = 34
  const bottom = 405
  const scale = (value: number) => bottom - (value / 1200) * (bottom - top)
  const groupX = [98, 165, 232, 302, 369, 436]

  return (
    <svg viewBox="0 0 550 495" className="h-auto w-full" role="img" aria-label="Men and women in further education in Britain, in thousands. Part-time and full-time figures for 1970/71, 1980/81 and 1990/91.">
      <rect width="550" height="495" fill="white" />
      <g fill="#111" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700">
        <text x="125" y="27" fontSize="15" textAnchor="middle">Male</text>
        <text x="364" y="27" fontSize="15" textAnchor="middle">Female</text>
        <text transform="translate(30 244) rotate(-90)" textAnchor="middle" fontSize="13">Men and women in further education</text>
        <text transform="translate(47 244) rotate(-90)" textAnchor="middle" fontSize="13">(thousands)</text>
      </g>
      <line x1="79" y1={top} x2="79" y2={bottom} stroke="#111" strokeWidth="3" />
      <line x1="79" y1={bottom} x2="502" y2={bottom} stroke="#111" strokeWidth="3" />
      {[0, 200, 400, 600, 800, 1000, 1200].map((tick) => (
        <g key={tick} fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fontWeight="700" fill="#111">
          <line x1="74" y1={scale(tick)} x2="79" y2={scale(tick)} stroke="#111" strokeWidth="2" />
          <text x="70" y={scale(tick) + 4} textAnchor="end">{tick}</text>
        </g>
      ))}
      <line x1="289" y1="18" x2="289" y2={bottom} stroke="#888" strokeWidth="3" strokeDasharray="17 4" />
      {educationGroups.map((group, index) => {
        const x = groupX[index]
        return (
          <g key={index} fontFamily="Arial, Helvetica, sans-serif">
            <rect x={x} y={scale(group.part)} width="29" height={bottom - scale(group.part)} fill="#929292" stroke="#111" strokeWidth="3" />
            <rect x={x + 30} y={scale(group.full)} width="29" height={bottom - scale(group.full)} fill="#000" />
            <text x={x + 27} y="423" fontSize="12" fontWeight="700" textAnchor="middle">{group.label}</text>
          </g>
        )
      })}
      <g fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fontWeight="700" fill="#111">
        <rect x="255" y="441" width="14" height="14" fill="#000" />
        <text x="276" y="453">Full-time education</text>
        <rect x="255" y="464" width="14" height="14" fill="#929292" stroke="#111" strokeWidth="2" />
        <text x="276" y="476">Part-time education</text>
      </g>
    </svg>
  )
}

// Hours continue past midnight to the following morning, as in the source graph.
const television: [number, number][] = [
  [6, 0], [7, 4], [8, 6], [9, 6.5], [10, 5], [11, 3.5], [12, 3.5],
  [13, 5], [14, 13], [15, 15], [16, 14], [17, 23], [18, 39],
  [19, 43], [20, 45], [21, 47], [22, 45], [23, 45], [24, 41],
  [25, 35], [26, 27], [27, 10], [28, 4], [29, 1.5], [30, 1],
]
const radio: [number, number][] = [
  [6, 5], [7, 14], [8, 22], [8.6, 27], [9, 24], [10, 22], [11, 21],
  [12, 19], [13, 17], [14, 15], [15, 12], [16, 11], [17, 14],
  [18, 14], [19, 11], [20, 9], [21, 8], [22, 7.5], [23, 7],
  [24, 6], [25, 7], [26, 6], [27, 4], [28, 2], [29, 1], [30, 1.5],
]

function RadioTelevisionChart() {
  const left = 74
  const top = 67
  const bottom = 300
  const right = 535
  const x = (hour: number) => left + ((hour - 6) / 24) * (right - left)
  const y = (percent: number) => bottom - (percent / 55) * (bottom - top)
  const path = (points: [number, number][]) => {
    const coords = points.map(([hour, percent]) => ({ x: x(hour), y: y(percent) }))
    return coords.slice(0, -1).reduce((result, point, index) => {
      const next = coords[index + 1]
      const previous = coords[Math.max(0, index - 1)]
      const afterNext = coords[Math.min(coords.length - 1, index + 2)]
      return `${result} C${(point.x + (next.x - previous.x) / 6).toFixed(1)},${(point.y + (next.y - previous.y) / 6).toFixed(1)} ${(next.x - (afterNext.x - point.x) / 6).toFixed(1)},${(next.y - (afterNext.y - point.y) / 6).toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`
    }, `M${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`)
  }
  const hourLabels = ['6 00', '8 00', '10 00', '12 00', '2 00', '4 00', '6 00', '8 00', '10 00', '12 00', '2 00', '4 00', '6 00']

  return (
    <svg viewBox="0 0 570 382" className="h-auto w-full" role="img" aria-label="Radio and television audiences in the UK, October to December 1992. Percentage of population aged over four from 6 a.m. to 6 a.m. the next day.">
      <rect width="570" height="382" fill="white" />
      <g fontFamily="Arial, Helvetica, sans-serif" fill="#111">
        <text x="285" y="21" textAnchor="middle" fontSize="15" fontWeight="700">Radio and television audiences in UK, October – December 1992</text>
        <text x="28" y="188" transform="rotate(-90 28 188)" textAnchor="middle" fontSize="12">Percentage of UK population (over 4 years old)</text>
        <text x="305" y="369" textAnchor="middle" fontSize="12">Time of day or night</text>
        <text x={x(12)} y="342" textAnchor="middle" fontSize="12">Noon</text>
        <text x={x(24)} y="342" textAnchor="middle" fontSize="12">Midnight</text>
      </g>
      <rect x="119" y="40" width="139" height="52" fill="white" stroke="#111" strokeWidth="2" />
      <line x1="128" y1="59" x2="190" y2="59" stroke="#111" strokeWidth="2" strokeDasharray="17 5" />
      <text x="195" y="63" fontFamily="Arial, Helvetica, sans-serif" fontSize="12">Television</text>
      <line x1="128" y1="76" x2="190" y2="76" stroke="#111" strokeWidth="2" strokeDasharray="6 4" />
      <text x="195" y="80" fontFamily="Arial, Helvetica, sans-serif" fontSize="12">Radio</text>
      <line x1={left} y1={top - 10} x2={left} y2={bottom} stroke="#111" strokeWidth="2" />
      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#111" strokeWidth="2" />
      {[0, 10, 20, 30, 40, 50].map((tick) => (
        <g key={tick} fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fill="#111">
          <line x1={left - 5} x2={left + 5} y1={y(tick)} y2={y(tick)} stroke="#111" strokeWidth="2" />
          <text x={left - 9} y={y(tick) + 4} textAnchor="end">{tick}%</text>
        </g>
      ))}
      {hourLabels.map((label, index) => (
        <g key={index} fontFamily="Arial, Helvetica, sans-serif" fontSize="12" fill="#111">
          <line x1={x(6 + index * 2)} x2={x(6 + index * 2)} y1={bottom} y2={bottom + 10} stroke="#111" strokeWidth="2" />
          <text x={x(6 + index * 2)} y={bottom + 25} textAnchor="middle">{label}</text>
        </g>
      ))}
      <path d={path(television)} fill="none" stroke="#111" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="17 6" />
      <path d={path(radio)} fill="none" stroke="#111" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 5" />
    </svg>
  )
}

export default function WritingTaskDiagram({ diagram }: { diagram: Diagram }) {
  return diagram === 'further-education' ? <FurtherEducationChart /> : <RadioTelevisionChart />
}
