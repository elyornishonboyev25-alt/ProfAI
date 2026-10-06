import { useId } from 'react'

// Coordinates follow the chart areas in the supplied screenshots. The question
// headings are rendered by the existing exam UI, outside the drawing.
export function MajorSportsChart() {
  const bottom = 681
  const y = (value: number) => bottom - value * 277 / 60
  const categories = ['Tennis', 'Basketball', 'Cricket', 'Golf', 'Swimming', 'Football', 'Rugby']
  const oldValues = [50, 9, 26, 31.6, 35, 31.6, 33]
  const newValues = [55, 23, 7, 33, 35, 48, 49]
  return <svg viewBox="35 292 840 610" className="h-auto w-full" role="img" aria-label="Number of adults participating in major sports, 1997 and 2017. Number of adults in thousands." data-supplied-writing-diagram="major-sports">
    <rect x="35" y="292" width="840" height="610" fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#000">
      <g fontSize="30" fontWeight="700" textAnchor="middle">
        <text x="494" y="335">Number of adults participating in major sports,</text>
        <text x="494" y="373">1997 and 2017</text>
      </g>
      {[0, 10, 20, 30, 40, 50, 60].map(tick => <g key={tick}>
        <line x1="132" x2="858" y1={y(tick)} y2={y(tick)} stroke="#222" strokeWidth="1.5" />
        <text x="124" y={y(tick) + 7} textAnchor="end" fontSize="22">{tick}</text>
      </g>)}
      {categories.map((category, index) => {
        const x = 158 + index * 104
        return <g key={category}>
          <rect x={x} y={y(oldValues[index])} width="26" height={bottom - y(oldValues[index])} fill="#2c2c29" />
          <rect x={x + 26} y={y(newValues[index])} width="26" height={bottom - y(newValues[index])} fill="#8d8d8b" />
          <text transform={`translate(${x + 36} 713) rotate(-30)`} textAnchor="end" fontSize="25">{category}</text>
        </g>
      })}
      <text transform="translate(68 543) rotate(-90)" textAnchor="middle" fontSize="25" fontWeight="700">Number of adults in thousands</text>
      <text x="494" y="818" textAnchor="middle" fontSize="25" fontWeight="700">Major sport</text>
      <rect x="406" y="863" width="20" height="22" fill="#555" />
      <text x="430" y="882" fontSize="22">1997</text>
      <rect x="511" y="863" width="20" height="22" fill="#bcbcbc" />
      <text x="535" y="882" fontSize="22">2017</text>
    </g>
  </svg>
}

export function SchoolTravelChart() {
  const hatch = `school-hatch-${useId().replace(/:/g, '')}`
  const y = (value: number) => 551 - value * 300 / 14
  const categories = [['car', 'passenger'], ['walking'], ['cycling'], ['walking', 'and bus'], ['bus']]
  const oldValues = [4.4, 12.4, 6.2, 5.8, 7]
  const newValues = [11.2, 6, 2, 3, 5]
  return <svg viewBox="821 202 548 467" className="h-auto w-full" role="img" aria-label="Travel to and from school: children aged 5-12. Total number of trips per year in millions, 1990 and 2010." data-supplied-writing-diagram="school-travel">
    <defs><pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="white" /><path d="M0 0L6 6M-1 5L1 7M5-1L7 1" stroke="#333" strokeWidth=".7" /></pattern></defs>
    <rect x="821" y="202" width="548" height="467" fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#000">
      <text x="1117" y="226" fontSize="18" fontWeight="700" textAnchor="middle">Travel to and from school: children aged 5-12</text>
      <rect x="885" y="251" width="464" height="300" fill="none" stroke="#555" strokeWidth="1" />
      {[0, 2, 4, 6, 8, 10, 12, 14].map(tick => <g key={tick}>
        <line x1="885" x2="1349" y1={y(tick)} y2={y(tick)} stroke="#333" strokeWidth=".7" strokeDasharray="3 3" />
        <line x1="879" x2="885" y1={y(tick)} y2={y(tick)} stroke="#333" strokeWidth=".7" />
        <text x="874" y={y(tick) + 6} textAnchor="end" fontSize="16">{tick}</text>
      </g>)}
      {categories.map((lines, index) => {
        const x = 912 + index * 92.6
        return <g key={index}>
          <rect x={x} y={y(oldValues[index])} width="19" height={551 - y(oldValues[index])} fill="black" />
          <rect x={x + 19} y={y(newValues[index])} width="19" height={551 - y(newValues[index])} fill={`url(#${hatch})`} stroke="#333" strokeWidth=".7" />
          <line x1={x - 27} x2={x - 27} y1="551" y2="556" stroke="#333" strokeWidth=".7" />
          {lines.map((line, lineIndex) => <text key={line} x={x + 19} y={572 + lineIndex * 20} fontSize="16" textAnchor="middle">{line}</text>)}
        </g>
      })}
      <text transform="translate(843 402) rotate(-90)" textAnchor="middle" fontSize="16">Total number of trips per year (in millions)</text>
      <rect x="1037" y="626" width="160" height="30" fill="white" stroke="#555" />
      <rect x="1044" y="633" width="15" height="15" fill="black" /><text x="1065" y="646" fontSize="16">1990</text>
      <rect x="1130" y="633" width="15" height="15" fill={`url(#${hatch})`} stroke="#333" strokeWidth=".7" /><text x="1152" y="646" fontSize="16">2010</text>
    </g>
  </svg>
}

function Brick({ x, y, width = 38, depth = 17, height = 15 }: { x: number; y: number; width?: number; depth?: number; height?: number }) {
  return <g stroke="#444" strokeWidth="1.2" strokeLinejoin="round">
    <path d={`M${x} ${y}l${depth} -${depth * .6}h${width}l-${depth} ${depth * .6}Z`} fill="#d0d0d0" />
    <path d={`M${x} ${y}h${width}v${height}h-${width}Z`} fill="#b9b9b9" />
    <path d={`M${x + width} ${y}l${depth} -${depth * .6}v${height}l-${depth} ${depth * .6}Z`} fill="#999" />
  </g>
}

function BrickStack({ x, y, width = 80, height = 50, depth = 15 }: { x: number; y: number; width?: number; height?: number; depth?: number }) {
  return <g stroke="#555" strokeWidth=".65">
    <path d={`M${x} ${y}l${depth} -${depth * .65}h${width}l-${depth} ${depth * .65}Z`} fill="#bbb" />
    <path d={`M${x} ${y}h${width}v${height}h-${width}Z`} fill="#bcbcbc" />
    <path d={`M${x + width} ${y}l${depth} -${depth * .65}v${height}l-${depth} ${depth * .65}Z`} fill="#9b9b9b" />
    {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${x} ${y + (i + 1) * height / 8}h${width}l${depth} -${depth * .65}`} fill="none" />)}
    {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M${x + (i + 1) * width / 5 + depth} ${y - depth * .65}l-${depth} ${depth * .65}v${height}`} fill="none" />)}
    <path d={`M${x + width + depth / 2} ${y - depth * .325}v${height}`} fill="none" />
  </g>
}

function Chamber({ x, y, width }: { x: number; y: number; width: number }) {
  return <g stroke="#333" strokeWidth="1.3" strokeLinejoin="round">
    <path d={`M${x} ${y}l24 -19h${width}l-24 19Z`} fill="#b4b4b4" />
    <path d={`M${x} ${y}h${width}v60h-${width}Z`} fill="#999" />
    <path d={`M${x + width} ${y}l24 -19v60l-24 19Z`} fill="#7d7d7d" />
    <path d={`M${x + 22} ${y + 12}h${width - 36}v48h-${width - 36}Z`} fill="#494949" />
  </g>
}

export function SuppliedBrickManufacturing() {
  const arrow = `brick-source-arrow-${useId().replace(/:/g, '')}`
  const mesh = `brick-source-mesh-${useId().replace(/:/g, '')}`
  return <svg viewBox="50 145 710 593" className="h-auto w-full" role="img" aria-label="Brick Manufacturing: digger and clay, metal grid and roller, sand and water, wire cutter or mould, bricks, drying oven 24–48 hrs, moderate kiln 200°C–980°C, high kiln 870°C–1300°C, cooling chamber 48–72 hrs, packaging and delivery." data-supplied-writing-diagram="brick-manufacturing">
    <defs>
      <marker id={arrow} viewBox="0 0 10 8" refX="9" refY="4" markerWidth="9" markerHeight="7" orient="auto"><path d="M0 0L10 4L0 8Z" fill="#111" /></marker>
      <pattern id={mesh} width="12" height="9" patternUnits="userSpaceOnUse"><path d="M0 0H12V9H0Z" fill="none" stroke="#333" strokeWidth="1" /></pattern>
    </defs>
    <rect x="50" y="145" width="710" height="593" fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fontSize="14" fill="#111">
      <text x="399" y="170" fontSize="18" fontWeight="700" textAnchor="middle">Brick Manufacturing</text>
      {/* Excavator, with the bucket at the clay face. */}
      <g fill="none" stroke="#666" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M54 345H242M58 351H239M110 353l22 4 15-3 20 4 20-5 29 4 24-7M137 355l19 10m-7-9 18 17m-5-18 21 10m-31-4-18 10" />
        <path d="M85 330h75q18 1 12 14l-11 6H84q-16-2-9-15Z" fill="#ddd" />
        <path d="M88 334h67q15 1 8 9H86q-10-2 2-9ZM88 334v9m8-9v9m8-9v9m8-9v9m8-9v9m8-9v9m8-9v9m8-9v9" />
        <path d="M80 309l18-4v-10l24-5 12 12v25H76v-11Z" fill="#eee" />
        <path d="M100 295h21v25h-21ZM104 299h11v15h-11Zm16 0 6 4v12h-6m-27 5h5m29 10h35l3 8h-39" />
        <path d="M128 306l14-36 56-63 7 1 9 13-1 80-7 7-4-5 3-75-5-13-49 62-14 34Z" fill="#eee" />
        <path d="M137 282l12-21 46-32m-50 38 52-48m-1-12 2 16m8 5 4 75m-10-65 3 56m-4 2 13 6m-5 4-2 13 10 7m-15-7-9 23" />
        <path d="M197 318q-12 8-12 26l19 8 29-4 4-6-20-8-9-17Z" fill="#ddd" />
        <path d="M195 325l12 10-8 15m10-16 26 8M102 250l12 31" />
      </g>
      <text x="68" y="244">digger</text><text x="111" y="387">clay</text>
      <path d="M232 275h16v-9l26 16-26 15v-9h-16Z" fill="white" stroke="#444" strokeWidth="1.5" />
      {/* Clay, metal grid and roller. */}
      <path d="M280 339l30-49h133l18 49Z" fill="#777" stroke="#333" strokeWidth="1.5" />
      <path d="M309 288l9-3 8 3 11-3 12 4 9-3 9 3 14-2 10 3 15-2 14 5 17-2 7 7 7 4 0 13-8 5-12-2-9 5-14-2-13 4-9-5-10 2-12-4-9 3-13-3-15 1-8-8Z" fill="#555" />
      <path d="M273 306l40-49h65l-9 51Z" fill={`url(#${mesh})`} stroke="#333" strokeWidth="2" />
      {Array.from({ length: 44 }, (_, i) => <path key={i} d={`M${312 + i % 11 * 11} ${295 + Math.floor(i / 11) * 9}l5-3 4 4-5 2Z`} fill={i % 2 ? '#444' : '#aaa'} stroke="#333" strokeWidth=".6" />)}
      <path d="M289 339h161q14 2 12 10-1 8-13 8H290q-15-2-9-13Z" fill="#999" stroke="#333" strokeWidth="1.5" />
      {[290, 343, 397, 452].map(x => <g key={x}><circle cx={x} cy="348" r="7" fill="white" stroke="#333" /><circle cx={x} cy="348" r="2" fill="#666" /></g>)}
      <path d="M374 276l35-21" stroke="#777" /><text x="408" y="255">metal</text><text x="408" y="272">grid</text><text x="346" y="384">roller</text>
      <text x="451" y="218">sand + water</text>
      <path d="M488 228h16v51h9l-17 26-17-26h9Z" fill="#929292" stroke="#333" strokeWidth="1.5" />
      <g fill="none" stroke="#111" strokeWidth="1.5" markerEnd={`url(#${arrow})`}>
        <path d="M467 316h39q15 0 32-13" /><path d="M506 316q29 0 51 24" />
      </g>
      <text x="538" y="321" fontSize="12">or</text>
      {/* The wire cutter and mould are separate, alternative routes. */}
      <path d="M546 271l38-23 28 17v32l-36 16-30-16Z" fill="#eee" stroke="#444" strokeWidth="1.5" />
      <path d="M546 271l30 17 36-23m-36 23v25" fill="none" stroke="#444" />
      <Brick x={581} y={302} width={42} depth={20} height={16} />
      <Brick x={626} y={320} width={25} depth={16} height={14} />
      <Brick x={665} y={328} width={25} depth={17} height={17} />
      <path d="M610 280l-5 32m3-32 27 15m-2 0-7 22" stroke="#333" fill="none" />
      <text x="629" y="269">wire cutter</text><text x="704" y="302">bricks</text>
      <path d="M690 309l-9 14" fill="none" stroke="#777" />
      <path d="M558 348l37-21 26 15v21l-36 15-27-15Z" fill="#ddd" stroke="#333" strokeWidth="1.5" />
      <path d="M566 348l29-15 16 9-27 14Z" fill="#777" stroke="#333" />
      <path d="M558 348l27 15 36-21m-36 21v15" fill="none" stroke="#333" />
      <Brick x={602} y={363} width={24} depth={14} height={12} />
      <Brick x={632} y={363} width={24} depth={14} height={12} />
      <Brick x={662} y={363} width={24} depth={14} height={12} />
      <text x="520" y="392">mould</text><path d="M555 380l14-15" stroke="#777" />
      <path d="M629 394v33" stroke="#111" strokeWidth="1.5" markerEnd={`url(#${arrow})`} />
      {/* Drying oven and connected cooling/kiln chambers, as in the source. */}
      <Chamber x={554} y={488} width={118} /><BrickStack x={575} y={500} />
      <text x="604" y="455">drying oven</text><text x="575" y="564">24 - 48 hrs</text>
      <Chamber x={64} y={488} width={348} />
      <path d="M177 488v60m114-60v60m-91-79-23 19m137-19-23 19" fill="none" stroke="#333" />
      <BrickStack x={88} y={500} /><BrickStack x={202} y={500} /><BrickStack x={315} y={500} />
      <text x="132" y="445">cooling</text><text x="127" y="463">chamber</text><text x="260" y="455">kiln</text><text x="373" y="455">kiln</text>
      <g textAnchor="middle">
        <text x="112" y="564">48 - 72 hrs</text>
        <text x="238" y="564">high</text><text x="238" y="583">870°C - 1300°C</text>
        <text x="380" y="564">moderate</text><text x="380" y="583">200°C - 980°C</text>
      </g>
      <g fill="none" stroke="#111" strokeWidth="1.5" markerEnd={`url(#${arrow})`}>
        <path d="M540 510H445" /><path d="M330 558h-34" /><path d="M185 558h-34" />
        <path d="M109 580v31q0 45 53 47" /><path d="M318 654h94" />
      </g>
      <path d="M164 696l102-18 37-6v11l-110 24h-29Z" fill="#eee" stroke="#444" strokeWidth="1.5" />
      <BrickStack x={179} y={621} width={94} height={72} depth={15} />
      <text x="188" y="724">packaging</text>
      {/* Delivery truck, wheels, cab and trailer. */}
      <g stroke="#666" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M424 614h179v64H424Z" fill="#fff" /><path d="M430 620v49h167" fill="none" stroke="#aaa" />
        <path d="M424 679h183v11H424Z" fill="#ddd" />
        <path d="M604 629l47 7 10 31v21h-57Z" fill="#eee" /><path d="M615 637h13v21h-13Zm20 1 12 2 7 18h-19Z" fill="#666" />
        <path d="M608 662h49m-21 0v24m4-20h8m-5 6h15m-49-37v51" fill="none" />
        <path d="M444 679v12m31-12v12m91-12v12m29-12v12" />
        {[445, 474, 583, 641].map(x => <g key={x}><circle cx={x} cy="690" r="13" fill="#111" stroke="#111" /><circle cx={x} cy="690" r="8" fill="#ddd" /><circle cx={x} cy="690" r="4" fill="#777" /></g>)}
      </g>
      <text x="491" y="649">delivery</text>
    </g>
  </svg>
}
