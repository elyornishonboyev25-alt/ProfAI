// Drawn from the original Task 1 sources. Everything visible is SVG geometry or text.
function FlowArrow({ x, y, direction = 'right' }: { x: number; y: number; direction?: 'right' | 'left' | 'down' }) {
  const rotation = direction === 'right' ? 0 : direction === 'left' ? 180 : 90
  return (
    <path
      d="M-17 -4 L8 -4 L8 -10 L19 0 L8 10 L8 4 L-17 4 Z"
      transform={`translate(${x} ${y}) rotate(${rotation})`}
      fill="white"
      stroke="#666"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  )
}

function Waves({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y} q10 -8 20 0 t20 0 t20 0 M${x + 13} ${y + 11} q8 -6 16 0 t16 0`} fill="none" stroke="#777" strokeWidth="2" />
}

function Fish({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke="#555" strokeWidth="2.3" strokeLinejoin="round">
      <path d="M0 18 Q23 -4 65 4 Q87 7 100 20 L119 6 L115 20 L120 33 L99 25 Q70 43 29 30 Z" />
      <path d="M22 2 L29 30 M34 5 L39 31 M52 3 Q61 -10 71 3 M55 30 Q65 42 73 30" />
      <circle cx="15" cy="17" r="2" fill="#555" />
      <path d="M3 22 L-3 24 M60 9 Q75 17 62 25" />
    </g>
  )
}

function Freezer({ x, y, temperature = false }: { x: number; y: number; temperature?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke="#555" strokeWidth="2.3" strokeLinejoin="round">
      <path d="M0 8 Q55 0 110 7 L105 58 Q53 64 6 58 Z M0 8 Q54 15 110 7" />
      <rect x="49" y="21" width="26" height="6" rx="2" />
      {temperature
        ? <text x="55" y="49" textAnchor="middle" fontSize="21" fill="#111" stroke="none" fontFamily="Arial">0°C</text>
        : <g strokeWidth="1.5"><path d="M55 35 v21 M44 40 l22 12 M44 52 l22 -12 M47 32 l8 5 8 -5 M47 57 l8 -5 8 5" /></g>}
    </g>
  )
}

export function SmokedFishDiagram() {
  const label = { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 23, fill: '#111', letterSpacing: 1.2 }
  return (
    <svg viewBox="0 0 920 595" className="h-auto w-full" role="img" aria-label="Smoked fish process: fish are caught at sea, taken by boat to port and frozen, thawed in fresh water, cut open, put in salt water with yellow coloring, smoked, packed, frozen at zero degrees Celsius, stored cold, distributed and sold at a fish shop.">
      <rect width="920" height="595" fill="white" />

      {/* Sea catch: a net full of fish and the water beneath it. */}
      <g fill="none" stroke="#666" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M57 26 l-6 9 7 9 -4 12 C42 75 47 104 75 118 Q100 134 120 103 Q127 86 110 80 Q83 79 69 61 L59 44" />
        <path d="M50 34 Q57 29 63 35 M49 41 Q57 46 65 39 M58 43 Q62 70 54 93 M64 51 Q72 73 61 110 M72 63 Q83 84 70 119 M82 72 Q99 98 82 124 M95 79 Q112 99 96 119 M109 81 Q119 95 111 108" />
        <path d="M48 80 Q76 95 113 89 M53 94 Q75 105 116 100 M61 109 Q80 114 106 111 M67 68 Q88 77 108 80" />
        <path d="M72 89 q6 -7 13 0 l8 -5 -2 7 2 6 -8 -4 q-8 5 -13 -4 M90 102 q6 -6 11 0 l7 -4 -2 6 2 5 -7 -4 q-7 3 -11 -3 M66 104 q5 -4 9 0 l5 -3 -1 4 1 4 -5 -3 q-5 3 -9 -2" />
      </g>
      <Waves x={36} y={142} />
      <Waves x={80} y={153} />
      <FlowArrow x={185} y={77} />

      {/* Fishing boat and flag. */}
      <g fill="none" stroke="#666" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M263 100 Q310 112 376 99 L362 119 Q316 137 279 118 Z M266 108 Q320 119 372 108" />
        <path d="M321 99 L324 33 Q333 28 341 34 Q349 39 358 32 L356 57 Q344 52 336 57 Q328 59 324 57" />
        <path d="M324 56 L323 106 M281 101 Q289 93 295 103 M290 99 Q289 85 295 87 L302 101 M302 98 Q309 88 316 103" />
        <path d="M287 84 q-8 -11 2 -19 M294 81 q-6 -9 0 -15" strokeWidth="1.5" />
      </g>
      <Waves x={260} y={143} />
      <Waves x={308} y={154} />
      <FlowArrow x={426} y={77} />

      {/* Harbour and lighthouse. */}
      <g fill="none" stroke="#666" strokeWidth="2.3" strokeLinejoin="round">
        <path d="M485 115 L493 99 L522 97 Q551 100 582 93 L624 105 L618 122 Q550 129 485 115 Z" />
        <path d="M502 99 L504 82 L526 80 L529 96 M510 78 q-9 -10 0 -17 M548 96 L552 33 L569 33 L576 99 M548 33 Q558 20 570 33 M546 38 L576 38 M554 43 L552 96 M569 43 L572 98" />
        <path d="M501 103 q6 -7 13 0 t13 0 t13 0 t13 0 t13 0 t13 0 t13 0" strokeWidth="1.4" />
        <path d="M494 111 q8 -5 16 0 t16 0 t16 0 t16 0 t16 0 t16 0" strokeWidth="1.2" />
      </g>
      <Waves x={481} y={143} />
      <Waves x={544} y={151} />
      <text x="551" y="177" textAnchor="middle" style={label}>Port</text>
      <FlowArrow x={694} y={77} />
      <Freezer x={763} y={68} />
      <text x="817" y="177" textAnchor="middle" style={label}>Freeze</text>
      <FlowArrow x={817} y={222} direction="down" />

      {/* Thaw, freshwater tank and fish. */}
      <text x="817" y="269" textAnchor="middle" style={label}>Thaw</text>
      <g fill="none" stroke="#666" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M763 290 L871 286 L865 347 Q815 353 767 348 Z" />
        <path d="M771 321 q12 -8 24 0 t24 0 t24 0 t24 0 M773 333 q11 -8 22 0 t22 0 t22 0 t22 0" strokeWidth="1.6" />
        <path d="M777 310 Q790 299 808 315 L818 309 L816 318 L820 325 L808 321 Q790 333 777 310 Z" />
        <path d="M852 310 Q838 299 824 315 L816 309 L818 318 L815 325 L825 321 Q839 331 852 310 Z" />
      </g>
      <text x="817" y="379" textAnchor="middle" style={label}>Fresh water</text>
      <FlowArrow x={690} y={308} direction="left" />

      {/* Knife above the opened fish. */}
      <g fill="none" stroke="#555" strokeWidth="2.3" strokeLinejoin="round">
        <path d="M527 272 L576 251 L582 271 L535 292 Z M576 251 L602 238 Q611 233 613 240 Q615 245 607 249 L582 265" />
      </g>
      <Fish x={510} y={305} scale={0.9} />
      <path d="M546 308 l7 27 M555 311 l9 23" fill="none" stroke="#777" strokeWidth="2" />
      <text x="561" y="379" textAnchor="middle" style={label}>Cut open</text>
      <FlowArrow x={426} y={308} direction="left" />

      {/* Brine tray with yellow coloring. */}
      <g fill="none" stroke="#666" strokeWidth="2.3" strokeLinejoin="round">
        <path d="M257 291 L369 291 L367 348 Q316 355 264 349 Z" />
        <path d="M266 312 q12 -5 24 0 t24 0 t24 0 t24 0 M268 327 q12 -5 24 0 t24 0 t24 0 t24 0 M270 340 q12 -5 24 0 t24 0 t24 0 t24 0" strokeWidth="1.5" />
        <path d="M280 328 q16 -15 33 0 l14 -5 -3 6 3 6 -14 -5 q-17 10 -33 -2 M325 329 q10 -10 22 0 l9 -5 -2 6 2 5 -9 -5 q-12 7 -22 -1" />
      </g>
      <text x="313" y="380" textAnchor="middle" style={label}>Salt water</text>
      <text x="313" y="407" textAnchor="middle" style={label}>+ yellow coloring</text>
      <FlowArrow x={183} y={308} direction="left" />

      {/* Smoking rack and smoke curls. */}
      <g fill="none" stroke="#666" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M46 298 L103 294 L103 326 L52 336 Z M52 337 Q66 349 107 342 L140 353 L139 361 Q103 368 56 353 Z" />
        <path d="M52 303 l44 0 M52 309 l44 -2 M54 316 l42 -3 M57 324 l39 -4 M61 298 l0 34 M71 296 l1 36 M81 296 l1 33 M91 295 l1 31" strokeWidth="1.2" />
        <path d="M63 346 q15 -10 30 0 t30 3 M39 328 q-12 -8 -16 -19 M47 320 q-11 -9 -12 -21 M68 290 q-7 -15 0 -25 M76 291 q-5 -12 0 -19" />
      </g>
      <text x="84" y="380" textAnchor="middle" style={label}>Smoke</text>
      <FlowArrow x={84} y={429} direction="down" />

      {/* Pack, freeze, cold store, distribute and sell. */}
      <g fill="none" stroke="#666" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M22 501 Q62 465 123 467 L135 479 L124 483 L74 484 L21 516 Z M21 516 Q70 503 133 513 L132 536 Q74 545 23 533 Z" />
        <path d="M26 512 Q62 520 92 510 L124 513 M42 520 q19 -14 38 0 l17 -7 -4 8 4 6 -17 -6 q-21 10 -38 -1" />
      </g>
      <FlowArrow x={184} y={503} />
      <Freezer x={233} y={477} temperature />
      <text x="288" y="559" textAnchor="middle" style={label}>Freeze</text>
      <text x="288" y="585" textAnchor="middle" style={label}>0 °C</text>
      <FlowArrow x={374} y={503} />
      <Freezer x={416} y={477} />
      <text x="470" y="559" textAnchor="middle" style={label}>Cold store</text>
      <FlowArrow x={559} y={503} />
      <g fill="none" stroke="#666" strokeWidth="2.3" strokeLinejoin="round">
        <path d="M600 452 L678 452 Q684 452 684 459 L684 503 L696 503 L696 477 Q696 469 704 469 L728 469 Q735 469 739 477 L748 499 L758 502 L758 519 L600 519 Z" />
        <path d="M696 480 L723 480 L735 500 L696 500 Z M602 505 L683 505" />
        <circle cx="626" cy="522" r="14" /><circle cx="626" cy="522" r="6" />
        <circle cx="723" cy="522" r="14" /><circle cx="723" cy="522" r="6" />
      </g>
      <text x="677" y="559" textAnchor="middle" style={label}>Distribution</text>
      <FlowArrow x={776} y={503} />
      <g fill="none" stroke="#666" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M804 472 L817 444 L890 444 L904 471 Z M810 472 L810 531 L897 531 L897 472" />
        <path d="M813 473 q5 10 10 0 q5 10 10 0 q5 10 10 0 q5 10 10 0 q5 10 10 0 q5 10 10 0 q5 10 10 0" />
        <path d="M853 478 L853 530 M856 478 L856 530 M868 511 L890 508 L889 529 L868 529 Z" />
        <circle cx="843" cy="501" r="2" /><circle cx="866" cy="501" r="2" />
        <text x="854" y="464" fontSize="17" textAnchor="middle" fill="#111" stroke="none" fontFamily="Arial">fish shop</text>
      </g>
      <text x="850" y="559" textAnchor="middle" style={label}>Fishshop</text>
      <text x="850" y="585" textAnchor="middle" style={label}>sell</text>
    </svg>
  )
}

const renewableData = [
  { country: 'Slovakia', values: [9.4, 7.8] },
  { country: 'Austria', values: [6.45, 5.15] },
  { country: 'France', values: [6.1, 6.1] },
  { country: 'Poland', values: [5, 6] },
  { country: 'Spain', values: [3.5, 4.8] },
  { country: 'Greece', values: [1.2, 2] },
  { country: 'EU average', values: [4.2, 4.8] },
]

export function RenewableTransportChart() {
  const top = 90
  const bottom = 409
  const y = (value: number) => bottom - (value / 10) * (bottom - top)
  return (
    <svg viewBox="0 0 850 500" className="h-auto w-full" role="img" aria-label="Percentage of fuel from renewable energy used in the transport sector in 2009 and 2010: Slovakia 9.4 and 7.8, Austria 6.45 and 5.15, France 6.1 and 6.1, Poland 5 and 6, Spain 3.5 and 4.8, Greece 1.2 and 2, EU average 4.2 and 4.8.">
      <rect width="850" height="500" fill="white" />
      <g fontFamily="Times New Roman, Times, serif" fill="#080808">
        <text x="425" y="34" textAnchor="middle" fontSize="28" fontWeight="700">Percentage of fuel from renewable energy used in</text>
        <text x="425" y="65" textAnchor="middle" fontSize="28" fontWeight="700">the transport sector, 2009 and 2010</text>
      </g>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => (
        <g key={tick} fontFamily="Times New Roman, Times, serif" fill="#111">
          <line x1="44" y1={y(tick)} x2="835" y2={y(tick)} stroke={tick === 0 ? '#111' : '#858585'} strokeWidth={tick === 0 ? 1.5 : 0.8} />
          <text x="30" y={y(tick) + 7} textAnchor="end" fontSize="19">{tick}</text>
        </g>
      ))}
      <line x1="44" y1={top} x2="44" y2={bottom} stroke="#777" strokeWidth="1" />
      {renewableData.map((group, index) => {
        const x = 65 + index * 112
        return (
          <g key={group.country} fontFamily="Times New Roman, Times, serif" fill="#111">
            <rect x={x} y={y(group.values[0])} width="33" height={bottom - y(group.values[0])} fill="#000" />
            <rect x={x + 39} y={y(group.values[1])} width="33" height={bottom - y(group.values[1])} fill="#969696" />
            <text x={x + 35} y="436" textAnchor="middle" fontSize="18">{group.country}</text>
          </g>
        )
      })}
      <g fontFamily="Times New Roman, Times, serif" fontSize="20" fill="#111">
        <rect x="354" y="464" width="17" height="17" fill="#000" />
        <text x="377" y="480">2009</text>
        <rect x="448" y="464" width="17" height="17" fill="#969696" />
        <text x="471" y="480">2010</text>
      </g>
    </svg>
  )
}
