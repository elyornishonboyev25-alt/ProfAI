import { useId, type ReactNode } from 'react'

// Source chart coordinates, lettering, colours, patterns and printed values.
// The exam UI renders the question text separately from these vector drawings.
function Sheet({ width, height, name, label, children }: { width: number; height: number; name: string; label: string; children: ReactNode }) {
  return <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label} data-supplied-writing-diagram={name}>
    <rect width={width} height={height} fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#111">{children}</g>
  </svg>
}

export function FastFoodChart() {
  const id = useId().replace(/:/g, '')
  const dark = `fast-dark-${id}`, light = `fast-light-${id}`, hatch = `fast-hatch-${id}`
  const fills = [`url(#${dark})`, `url(#${light})`, `url(#${hatch})`]
  const values = [[4, 3, 3], [17, 20, 16], [31, 33, 28], [30, 25, 33], [13, 15, 15], [5, 4, 4]]
  const labels = [['Every', 'day'], ['Several', 'times', 'a week'], ['Once a', 'week'], ['Once or', 'twice', 'a month'], ['A few', 'times a', 'year'], ['Never']]
  const y = (v: number) => 370 - v * 7.6
  return <Sheet width={510} height={490} name="usa-fast-food" label="Frequency of eating at fast food restaurants among people in the USA (2003–2013)">
    <defs>
      <pattern id={dark} width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#666" /><circle cx="1" cy="1" r=".4" fill="#222" /></pattern>
      <pattern id={light} width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#ddd" /><circle cx="1" cy="1" r=".4" fill="#777" /></pattern>
      <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="white" /><path d="M-1 1L1-1M0 5L5 0M4 6L6 4" stroke="#777" strokeWidth=".6" /></pattern>
    </defs>
    <g fontSize="16" fontWeight="700" textAnchor="middle"><text x="269" y="20">Frequency of eating at fast food restaurants among</text><text x="269" y="39">people in the USA (2003–2013)</text></g>
    {Array.from({ length: 9 }, (_, i) => i * 5).map(v => <g key={v} fontSize="14"><line x1="105" x2="492" y1={y(v)} y2={y(v)} stroke="#aaa" strokeWidth=".6" strokeDasharray="1 1" /><line x1="99" x2="105" y1={y(v)} y2={y(v)} stroke="#111" /><text x="95" y={y(v) + 5} textAnchor="end">{v}%</text></g>)}
    <path d="M105 66V370H492" fill="none" stroke="#111" strokeWidth="1.5" />
    <text transform="translate(54 220) rotate(-90)" textAnchor="middle" fontSize="14" fontWeight="700">% of people</text>
    {values.map((group, i) => <g key={i}>
      {group.map((v, j) => <rect key={j} x={114 + i * 64.5 + j * 16} y={y(v)} width="13" height={370 - y(v)} fill={fills[j]} stroke="#555" strokeWidth=".7" />)}
      <line x1={105 + i * 64.5} x2={105 + i * 64.5} y1="370" y2="378" stroke="#111" />
      {labels[i].map((line, k) => <text key={k} x={137 + i * 64.5} y={390 + k * 15} textAnchor="middle" fontSize="14" fontWeight="700">{line}</text>)}
    </g>)}
    <line x1="492" x2="492" y1="370" y2="378" stroke="#111" />
    <rect x="155" y="450" width="226" height="29" fill="white" stroke="#111" strokeWidth="1.5" />
    {['2003', '2006', '2013'].map((year, i) => <g key={year}><rect x={174 + i * 69} y="457" width="13" height="14" fill={fills[i]} stroke="#555" strokeWidth=".7" /><text x={193 + i * 69} y="469" fontSize="14">{year}</text></g>)}
  </Sheet>
}

function BudgetPie({ x, salary, tech, year }: { x: number; salary: number; tech: number; year: string }) {
  const r = 56, cy = 189
  const point = (p: number) => [x + r * Math.sin(p * Math.PI / 50), cy - r * Math.cos(p * Math.PI / 50)]
  const wedge = (from: number, to: number) => {
    const a = point(from), b = point(to)
    return `M${x} ${cy}L${a[0]} ${a[1]}A${r} ${r} 0 ${to - from > 50 ? 1 : 0} 1 ${b[0]} ${b[1]}Z`
  }
  return <g>
    <path d={wedge(0, salary)} fill="#888" stroke="#222" />
    <path d={wedge(salary, salary + tech)} fill="white" stroke="#222" />
    <path d={wedge(salary + tech, 100)} fill="black" stroke="#222" />
    <text x={x + 18} y="208" textAnchor="middle" fontSize="9" fill="white" fontWeight="700">{salary}%</text>
    <text x={x - 40} y={tech === 8 ? 184 : 194} textAnchor="middle" fontSize="8">{tech}%</text>
    <text x={x - 23} y="160" textAnchor="middle" fontSize="8" fill="white">17%</text>
    <text x={x} y="259" textAnchor="middle" fontSize="10" fontWeight="700">{year}</text>
  </g>
}

export function PoliceBudgetChart() {
  const rows = [['Sources', '2017', '2018'], ['National Government', '175.5m', '177.8m'], ['Local Taxes', '91.2m', '102.3m'], ['Other sources (eg grants)', '38m', '38.5m'], ['Total', '304.7m', '318.6m']]
  return <Sheet width={335} height={340} name="police-budget" label="Police Budget 2017–2018 (in £m), sources and how the money was spent">
    <text x="168" y="15" textAnchor="middle" fontSize="14" fontWeight="700">Police Budget 2017–2018 (in £m)</text>
    <rect x="35" y="26" width="265" height="71" fill="white" stroke="#111" />
    <path d="M154 26V97M226 26V97" stroke="#111" />
    {rows.map((row, i) => <g key={i} fontSize="8" fontWeight={i === 0 ? '700' : '400'}>
      {i > 0 && <line x1="35" x2="300" y1={26 + i * 14.2} y2={26 + i * 14.2} stroke="#111" />}
      <text x="50" y={36 + i * 14.2}>{row[0]}</text><text x="190" y={36 + i * 14.2} textAnchor="middle">{row[1]}</text><text x="263" y={36 + i * 14.2} textAnchor="middle">{row[2]}</text>
    </g>)}
    <text x="167" y="126" textAnchor="middle" fontSize="10" fontWeight="700">How the money was spent</text>
    <BudgetPie x={91} salary={75} tech={8} year="2017" /><BudgetPie x={244} salary={69} tech={14} year="2018" />
    <rect x="108" y="273" width="120" height="58" fill="white" stroke="#555" strokeWidth=".7" />
    {['Salaries (officers and staff)', 'Technology', 'Buildings and transport'].map((label, i) => <g key={label}><rect x="115" y={280 + i * 17} width="10" height="10" fill={['#888', 'white', 'black'][i]} stroke="#555" strokeWidth=".7" /><text x="128" y={288 + i * 17} fontSize="8">{label}</text></g>)}
  </Sheet>
}

export function CanadianLeisureChart() {
  const id = useId().replace(/:/g, '')
  const boys = `leisure-boys-${id}`, girls = `leisure-girls-${id}`
  const values = [[28, 13], [19, 16], [21, 21], [36, 8]]
  const y = (v: number) => 198 - v * 4.4
  return <Sheet width={380} height={245} name="canadian-leisure" label="Favourite leisure activities of teenagers in Canada: Boys and Girls">
    <defs>{[[boys, '#04ac50', '#00c963'], [girls, '#edb700', '#ffd700']].map(([id, a, b]) => <linearGradient key={id} id={id}><stop stopColor={a} /><stop offset=".55" stopColor={b} /><stop offset="1" stopColor={a} /></linearGradient>)}</defs>
    <text x="194" y="16" textAnchor="middle" fontSize="9">Favourite leisure activities of teenagers in Canada</text>
    <path d="M43 198V43L58 29H305V184L290 198Z M43 43H290V198M290 43L305 29" fill="white" stroke="#aaa" />
    {Array.from({ length: 8 }, (_, i) => i * 5).map(v => <g key={v}><path d={`M43 ${y(v)}L58 ${y(v) - 14}H305`} fill="none" stroke="#aaa" strokeWidth=".7" /><text x="38" y={y(v) + 3} textAnchor="end" fontSize="8">{v}%</text></g>)}
    {values.map((group, i) => <g key={i}>
      {group.map((v, j) => <g key={j}><path d={`M${64 + i * 61 + j * 18} ${y(v)}a9 3 0 0 1 18 0v${198 - y(v)}a9 3 0 0 1-18 0Z`} fill={`url(#${j ? girls : boys})`} /><ellipse cx={73 + i * 61 + j * 18} cy={y(v)} rx="9" ry="3" fill={j ? '#ffda21' : '#00bc5a'} /></g>)}
      <text x={80 + i * 61} y="217" textAnchor="middle" fontSize="8">{['Sports', 'Computer Games', 'Music', 'Shopping'][i]}</text>
    </g>)}
    <rect x="316" y="113" width="5" height="5" fill="#00ad50" /><text x="324" y="118" fontSize="8">Boys</text>
    <rect x="316" y="125" width="5" height="5" fill="#f0c000" /><text x="324" y="130" fontSize="8">Girls</text>
  </Sheet>
}

export function UKEconomicSectorsChart() {
  const id = useId().replace(/:/g, '')
  const light = `economy-light-${id}`, dark = `economy-dark-${id}`
  const values = [[49, 45, 3.5], [52, 38, 10], [11, 33, 21], [2, 16, 35]]
  const fills = [`url(#${light})`, `url(#${dark})`, 'white']
  const y = (v: number) => 357 - v * 4.2
  return <Sheet width={680} height={400} name="uk-economic-sectors" label="Contribution of selected sectors to the UK economy in the twentieth century">
    <defs>{[[light, '#bbb', '#999'], [dark, '#777', '#555']].map(([id, bg, fg]) => <pattern key={id} id={id} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill={bg} /><path d="M0 1H4M1 0V4" stroke={fg} strokeWidth=".25" /></pattern>)}</defs>
    <rect x="1" y="1" width="678" height="392" fill="none" stroke="#666" />
    <text x="342" y="33" textAnchor="middle" fontSize="19">Contribution of selected sectors to the</text><text x="342" y="56" textAnchor="middle" fontSize="19">UK economy in the twentieth century</text>
    <path d="M65 105V357H656" fill="none" stroke="#555" />
    {[0, 10, 20, 30, 40, 50, 60].map(v => <g key={v}><line x1="56" x2="65" y1={y(v)} y2={y(v)} stroke="#555" /><text x="50" y={y(v) + 4} textAnchor="end" fontSize="14" fill="#555">{v}</text></g>)}
    <text x="19" y="237" fontSize="15">%</text>
    {values.map((group, i) => <g key={i}>
      {group.map((v, j) => <rect key={j} x={89 + i * 147 + j * 34} y={y(v)} width="34" height={357 - y(v)} fill={fills[j]} stroke="#777" />)}
      <text x={136 + i * 147} y="374" textAnchor="middle" fontSize="14">{[1900, 1950, 1975, 2000][i]}</text><line x1={65 + i * 147} x2={65 + i * 147} y1="357" y2="366" stroke="#555" />
    </g>)}
    <line x1="656" x2="656" y1="357" y2="366" stroke="#555" />
    <rect x="458" y="108" width="184" height="59" fill="white" stroke="#777" />
    {['Agriculture', 'Manufacturing', 'Business and Financial'].map((label, i) => <g key={label}><rect x="466" y={116 + i * 17} width="9" height="10" fill={fills[i]} stroke="#777" /><text x="480" y={125 + i * 17} fontSize="14">{label}</text></g>)}
  </Sheet>
}

export function CO2EmissionsChart() {
  const values = [[10.8, 10.7, 10, 9.5, 8.7], [8.7, 10.2, 7, 6.1, 5.4], [4.2, 6.3, 6.7, 7.7, 7.7], [1.1, 2.2, 3.2, 5.2, 5.4]]
  const styles = ['12 3 2 3', '8 5', undefined, '1 3']
  const y = (v: number) => 284 - v * 18.75
  return <Sheet width={555} height={325} name="co2-emissions" label="Average carbon dioxide (CO₂) emissions per person, 1967–2007">
    <text x="278" y="28" fontSize="14" fontWeight="700" textAnchor="middle">Average carbon dioxide (CO₂) emissions per person, 1967–2007</text>
    {Array.from({ length: 7 }, (_, i) => i * 2).map(v => <g key={v}><line x1="103" x2="355" y1={y(v)} y2={y(v)} stroke="#777" strokeWidth=".8" /><line x1="98" x2="103" y1={y(v)} y2={y(v)} stroke="#111" /><text x="94" y={y(v) + 5} fontSize="14" textAnchor="end">{v}</text></g>)}
    <path d="M103 59V284H355" fill="none" stroke="#111" strokeWidth="1.3" />
    {[1967, 1977, 1987, 1997, 2007].map((year, i) => <g key={year}><line x1={103 + i * 56} x2={103 + i * 56} y1="284" y2="290" stroke="#111" /><text x={103 + i * 56} y="304" textAnchor="middle" fontSize="14">{year}</text></g>)}
    <text transform="translate(65 174) rotate(-90)" textAnchor="middle" fontSize="14">CO₂ emissions in metric tonnes</text>
    {values.map((series, i) => <path key={i} d={series.map((v, j) => `${j ? 'L' : 'M'}${103 + j * 56} ${y(v)}`).join(' ')} fill="none" stroke="#111" strokeWidth={i === 3 ? 2 : 1.7} strokeDasharray={styles[i]} />)}
    {['United Kingdom', 'Sweden', 'Italy', 'Portugal'].map((label, i) => <g key={label}><line x1="374" x2="412" y1={147 + i * 24} y2={147 + i * 24} stroke="#111" strokeWidth={i === 3 ? 2 : 1.7} strokeDasharray={styles[i]} /><text x="418" y={152 + i * 24} fontSize="14">{label}</text></g>)}
  </Sheet>
}

export function BicycleRidingTable() {
  const border = `bicycle-border-${useId().replace(/:/g, '')}`
  const rows = [['Age Group', 'Female', 'Male'], ['0-9', '52.5', '51.2'], ['10-19', '43.6', '25.1'], ['20-39', '18.2', '10.8'], ['40-59', '13.7', '9.3'], ['60+', '19.8', '14.6']]
  return <Sheet width={640} height={390} name="bicycle-riding" label="Percentage of the population who rode bicycles in one town by age group in 2012">
    <defs><linearGradient id={border}><stop stopColor="#d982da" /><stop offset="1" stopColor="#79dedc" /></linearGradient></defs>
    <rect x="6" y="4" width="628" height="380" fill="none" stroke={`url(#${border})`} />
    {rows.map((row, i) => <g key={i} fontFamily="Georgia, 'Times New Roman', serif" fontSize="18" fontWeight={i ? '700' : '400'}>
      {row.map((value, j) => <g key={j}><rect x={19 + j * 202} y={10 + (i ? 91 + (i - 1) * 56 : 0)} width="202" height={i ? 56 : 91} fill={i === 0 ? '#a5a5a5' : i % 2 ? '#e1e1e1' : '#efefef'} stroke="white" strokeWidth="1" /><text x={120 + j * 202} y={i ? 143 + (i - 1) * 56 : 70} textAnchor="middle">{value}</text></g>)}
    </g>)}
  </Sheet>
}

export function AustralianActivityChart() {
  const hatch = `activity-hatch-${useId().replace(/:/g, '')}`
  const values = [[52.8, 47.7], [42.2, 48.9], [39.5, 52.5], [43.1, 53.3], [45.1, 53], [46.7, 47.1]]
  const y = (v: number) => 255 - v * 3.3
  return <Sheet width={340} height={353} name="australian-activity" label="Percentage of Australian men and women doing regular physical activity: 2010">
    <defs><pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#333" /><path d="M-1 1L1-1M0 4L4 0M3 5L5 3" stroke="#aaa" strokeWidth=".5" /></pattern></defs>
    <g fontSize="11" fontWeight="700" textAnchor="middle" fill="#001c51"><text x="177" y="19">Percentage of Australian men and women doing</text><text x="177" y="32">regular physical activity: 2010</text></g>
    {[0, 10, 20, 30, 40, 50, 60].map(v => <g key={v}><line x1="53" x2="324" y1={y(v)} y2={y(v)} stroke="#aaa" strokeWidth=".4" /><text x="48" y={y(v) + 3} fontSize="9" textAnchor="end">{v}</text></g>)}
    <path d="M53 57V255H324" fill="none" stroke="#111" />
    <text transform="translate(27 155) rotate(-90)" textAnchor="middle" fontSize="9" fill="#001c51">Percentage (%)</text>
    {values.map((group, i) => <g key={i}>
      {group.map((v, j) => <g key={j}><rect x={61 + i * 44.5 + j * 15} y={y(v)} width="15" height={255 - y(v)} fill={j ? 'black' : `url(#${hatch})`} /><text x={68.5 + i * 44.5 + j * 15} y={y(v) - 3} textAnchor="middle" fontSize="8">{v}</text></g>)}
      <line x1={53 + i * 44.5} x2={53 + i * 44.5} y1="255" y2="261" stroke="#111" /><text x={76 + i * 44.5} y="273" textAnchor="middle" fontSize="8">{['15 to 24', '25 to 34', '35 to 44', '45 to 54', '55 to 64', '65 and over'][i]}</text>
    </g>)}
    <line x1="324" x2="324" y1="255" y2="261" stroke="#111" />
    <text x="179" y="292" textAnchor="middle" fontSize="9" fontWeight="700" fill="#001c51">Age group</text>
    <rect x="117" y="312" width="110" height="27" fill="white" stroke="#111" />
    <rect x="128" y="320" width="10" height="11" fill={`url(#${hatch})`} /><text x="144" y="329" fontSize="9">Male</text><rect x="173" y="320" width="10" height="11" fill="black" /><text x="189" y="329" fontSize="9">Female</text>
  </Sheet>
}
