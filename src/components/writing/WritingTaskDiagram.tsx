import type { WritingTask } from '@/data/writingTestData'
import { RenewableTransportChart, SmokedFishDiagram } from './LegacyWritingTaskDiagrams'
import { MajorSportsChart, SchoolTravelChart, SuppliedBrickManufacturing } from './SuppliedWritingTaskDiagrams'
import { FastFoodChart, PoliceBudgetChart, CanadianLeisureChart, UKEconomicSectorsChart, CO2EmissionsChart, BicycleRidingTable, AustralianActivityChart } from './SuppliedWritingCharts21to30'
import { MuseumMaps, UniversitySportsPlans } from './SuppliedWritingMaps21to30'
import AluminiumRecyclingDiagram from './SuppliedAluminiumRecycling'
import { InternationalStudentsChart, EnergyProductionPies, HospitalClinicsChart, NewZealandLeisureCharts, TouristOfficeChart } from './SuppliedWritingCharts6to14'
import GeothermalPowerPlant from './SuppliedGeothermalDiagram'

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

function BrickMakingDiagram() {
  const drawings: Record<string, string> = {
    Clay: 'M5 38Q20 19 35 35Q45 21 62 38ZM47 31L54 4M50 8L60 11M54 4L59 0',
    'Metal grid': 'M10 7H55V42H10ZM20 7V42M31 7V42M43 7V42M10 18H55M10 30H55',
    'Sand + water': 'M5 39L23 15L43 39ZM51 4Q62 19 51 27Q40 19 51 4ZM40 39H62',
    'Wire cutter': 'M8 8H57V40H8ZM8 8L57 40M8 40L57 8M32 4V44',
    'Drying oven': 'M7 10H58V40H7ZM16 18H49M16 28H49M17 2Q12 7 18 12M32 2Q27 7 33 12M47 2Q42 7 48 12',
    Kiln: 'M8 40V16H43V40ZM19 16V4H28V16M44 40V9H58V40M16 31Q24 19 30 32Q36 20 39 33',
    Cooling: 'M33 21A6 6 0 1 0 34 21M32 14Q17 2 13 13Q12 21 27 22M40 22Q55 11 53 7Q46 4 36 17M34 29Q38 47 49 43Q52 37 39 25',
  }
  const boxes = [
    { x: 24, y: 82, label: 'Clay', detail: 'digger' },
    { x: 166, y: 82, label: 'Metal grid', detail: 'and roller' },
    { x: 308, y: 82, label: 'Sand + water', detail: 'mixed with clay' },
    { x: 450, y: 82, label: 'Wire cutter', detail: 'or mould' },
    { x: 450, y: 235, label: 'Drying oven', detail: '24–48 hours' },
    { x: 308, y: 235, label: 'Kiln', detail: '200–980°C' },
    { x: 166, y: 235, label: 'Kiln', detail: '870–1300°C' },
    { x: 24, y: 235, label: 'Cooling', detail: '48–72 hours' },
  ]
  return (
    <svg viewBox="0 0 610 455" className="h-auto w-full" role="img" aria-label="Brick manufacturing process: dig clay, filter it through a metal grid and roller, add sand and water, shape with a wire cutter or mould, dry for 24 to 48 hours, heat in two kilns at 200 to 980 and 870 to 1300 degrees Celsius, cool for 48 to 72 hours, package and deliver.">
      <rect width="610" height="455" fill="#fff" />
      <text x="305" y="34" textAnchor="middle" fontSize="20" fontWeight="700" fill="#172033">Brick Manufacturing</text>
      <g fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#brick-arrow)">
        <path d="M140 125H161" /><path d="M282 125H303" /><path d="M424 125H445" />
        <path d="M510 162V230" /><path d="M450 278H430" /><path d="M308 278H288" /><path d="M166 278H146" />
        <path d="M84 312V375H165" /><path d="M283 397H332" />
      </g>
      <defs><marker id="brick-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#64748b" /></marker></defs>
      {boxes.map((box) => (
        <g key={box.label + box.x + box.y}>
          <rect x={box.x} y={box.y} width="116" height="80" rx="4" fill="#fff" stroke="#777" strokeWidth="1.5" />
          <path d={drawings[box.label]} transform={`translate(${box.x + 35} ${box.y + 4}) scale(.72)`} fill="none" stroke="#555" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <text x={box.x + 58} y={box.y + 59} textAnchor="middle" fontSize="14" fontWeight="700" fill="#222">{box.label}</text>
          <text x={box.x + 58} y={box.y + 75} textAnchor="middle" fontSize="11" fill="#555">{box.detail}</text>
        </g>
      ))}
      <rect x="166" y="365" width="116" height="65" rx="4" fill="#fff" stroke="#777" strokeWidth="1.5" />
      <path d="M197 381L224 372L251 381V402L224 412L197 402ZM224 372V412M197 381L224 390L251 381" fill="none" stroke="#555" strokeWidth="2" />
      <text x="224" y="425" textAnchor="middle" fontSize="13" fontWeight="700" fill="#222">Packaging</text>
      <rect x="334" y="365" width="116" height="65" rx="4" fill="#fff" stroke="#777" strokeWidth="1.5" />
      <path d="M344 393V377H409V399H344ZM409 385H426L441 399H409M359 399A7 7 0 1 0 373 399A7 7 0 1 0 359 399M416 399A7 7 0 1 0 430 399A7 7 0 1 0 416 399" fill="none" stroke="#555" strokeWidth="2" />
      <text x="392" y="425" textAnchor="middle" fontSize="13" fontWeight="700" fill="#222">Delivery</text>
    </svg>
  )
}

function RiversideParkDiagram() {
  const label = { fontFamily: "Georgia, 'Times New Roman', serif", fill: '#171717' }
  const drawMap = (year: 2000 | 2025, origin: number) => <g transform={`translate(${origin} 62)`} key={year}>
    <text x="213" y="0" textAnchor="middle" fontSize="26" fontWeight="700" style={label}>{year}</text>
    <rect x="8" y="24" width="410" height="355" fill="#fafafa" stroke="#222" strokeWidth="2" />
    <path d="M9 290 C84 272 131 295 199 280 S325 274 417 294 L417 347 C320 331 292 347 216 332 S85 337 9 350Z" fill="#d9d9d9" stroke="#555" strokeWidth="2" />
    <path d="M9 293 C84 275 131 298 199 283 S325 277 417 297 M9 349 C85 336 144 341 216 334 S320 334 417 349" fill="none" stroke="#777" />
    <text x="211" y="320" textAnchor="middle" fontSize="20" fontStyle="italic" style={label}>River</text>
    <path d="M205 24V82" stroke="#222" strokeWidth="3" />
    <path d="M194 56L205 79L216 56" fill="none" stroke="#222" strokeWidth="3" />
    <text x="213" y="108" textAnchor="middle" fontSize="15" style={label}>North entrance</text>
    {year === 2000 ? <g>
      <path d="M72 120 Q47 190 68 263 M80 255 Q113 214 167 232" fill="none" stroke="#777" strokeWidth="7" strokeDasharray="6 5" />
      {[72, 96, 128, 152].map((x, i) => <g key={x} transform={`translate(${x} ${145 + (i % 2) * 53})`}>
        <path d="M0 42V3 M-17 26L0 0L17 26Z M-14 37L0 13L14 37Z" fill="#b7b7b7" stroke="#333" strokeWidth="2" />
      </g>)}
      <text x="118" y="261" textAnchor="middle" fontSize="16" style={label}>Woodland</text>
      <ellipse cx="248" cy="195" rx="53" ry="65" fill="#f3f3f3" stroke="#555" strokeWidth="2" />
      <text x="249" y="198" textAnchor="middle" fontSize="17" style={label}>Open lawn</text>
      <path d="M330 125 Q390 118 390 171 Q389 210 346 209 Q312 201 316 166Z" fill="#c9c9c9" stroke="#444" strokeWidth="2" />
      <text x="350" y="170" textAnchor="middle" fontSize="16" style={label}>Pond</text>
      <path d="M322 238H389 M332 222V254 M379 222V254" fill="none" stroke="#333" strokeWidth="3" />
      <text x="353" y="274" textAnchor="middle" fontSize="16" style={label}>Picnic area</text>
      <text x="84" y="284" textAnchor="middle" fontSize="13" style={label}>Footpath</text>
    </g> : <g>
      <path d="M38 92H385" stroke="#666" strokeWidth="10" strokeDasharray="18 6" />
      <text x="350" y="83" textAnchor="middle" fontSize="13" style={label}>Cycle path</text>
      <rect x="53" y="133" width="122" height="110" fill="#ededed" stroke="#222" strokeWidth="3" />
      <path d="M114 133V243 M53 188H175 M53 133L175 243 M175 133L53 243" stroke="#777" strokeWidth="1.5" />
      <text x="114" y="265" textAnchor="middle" fontSize="16" style={label}>Sports court</text>
      <rect x="201" y="143" width="95" height="100" rx="11" fill="#eee" stroke="#333" strokeWidth="2" />
      <path d="M217 225L248 164L278 226 M229 202H267" fill="none" stroke="#555" strokeWidth="5" />
      <text x="249" y="264" textAnchor="middle" fontSize="16" style={label}>Playground</text>
      <path d="M330 125 Q390 118 390 171 Q389 210 346 209 Q312 201 316 166Z" fill="#c9c9c9" stroke="#444" strokeWidth="2" />
      <text x="350" y="170" textAnchor="middle" fontSize="16" style={label}>Pond</text>
      <rect x="319" y="224" width="69" height="40" fill="#eee" stroke="#333" strokeWidth="2" />
      <path d="M317 224L353 204L391 224" fill="none" stroke="#333" strokeWidth="3" />
      <text x="353" y="282" textAnchor="middle" fontSize="16" style={label}>Café</text>
      <path d="M205 269V353 M216 269V351 M199 275H222 M199 343H222" fill="none" stroke="#222" strokeWidth="3" />
      <text x="254" y="366" textAnchor="middle" fontSize="14" style={label}>Bridge</text>
    </g>}
    <path d="M205 379V400" stroke="#222" strokeWidth="2" />
    <text x="213" y="421" textAnchor="middle" fontSize="14" style={label}>South entrance</text>
  </g>
  return <svg viewBox="0 0 920 510" className="h-auto w-full" role="img" aria-label="Riverside Park maps in 2000 and 2025. The river and north entrance remain. Woodland becomes a sports court, the lawn becomes a playground, the picnic area becomes a café, a cycle path and bridge are added, and the pond remains.">
    <rect width="920" height="510" fill="white" />
    <text x="460" y="33" textAnchor="middle" fontSize="26" fontWeight="700" style={label}>Changes to Riverside Park</text>
    {drawMap(2000, 18)}
    {drawMap(2025, 480)}
    <path d="M879 83V45 M879 45L871 57 M879 45L887 57" fill="none" stroke="#222" strokeWidth="2" />
    <text x="879" y="38" textAnchor="middle" fontSize="15" style={label}>N</text>
  </svg>
}

export default function WritingTaskDiagram({ diagram }: { diagram: Diagram }) {
  switch (diagram) {
    case 'international-students-1995-2015': return <InternationalStudentsChart />
    case 'energy-production-1995-2005': return <EnergyProductionPies />
    case 'hospital-clinics-2010-2016': return <HospitalClinicsChart />
    case 'geothermal-power-plant': return <GeothermalPowerPlant />
    case 'new-zealand-leisure-time': return <NewZealandLeisureCharts />
    case 'tourist-office-enquiries': return <TouristOfficeChart />
    case 'museum-1957-2007': return <MuseumMaps />
    case 'usa-fast-food-2003-2013': return <FastFoodChart />
    case 'police-budget-2017-2018': return <PoliceBudgetChart />
    case 'canada-teenage-leisure': return <CanadianLeisureChart />
    case 'university-sports-centre': return <UniversitySportsPlans />
    case 'uk-economic-sectors': return <UKEconomicSectorsChart />
    case 'co2-emissions-1967-2007': return <CO2EmissionsChart />
    case 'aluminium-can-recycling': return <AluminiumRecyclingDiagram />
    case 'bicycle-riding-2012': return <BicycleRidingTable />
    case 'australian-physical-activity-2010': return <AustralianActivityChart />
    case 'major-sports-1997-2017': return <MajorSportsChart />
    case 'school-travel-1990-2010': return <SchoolTravelChart />
    case 'supplied-brick-manufacturing': return <SuppliedBrickManufacturing />
    case 'smoked-fish': return <SmokedFishDiagram />
    case 'renewable-transport': return <RenewableTransportChart />
    case 'further-education': return <FurtherEducationChart />
    case 'radio-tv-audiences': return <RadioTelevisionChart />
    case 'brick-making': return <BrickMakingDiagram />
    case 'riverside-park': return <RiversideParkDiagram />
  }
}
