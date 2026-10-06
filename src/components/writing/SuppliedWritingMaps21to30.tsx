import { useId } from 'react'

function Pine({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="#333" strokeWidth=".8">
    <path d="M0 17V-24" fill="none" strokeWidth="1.6" />
    <path d="M0-26L-6-13L-3-14L-10-5L-5-7L-14 5L-6 1L-12 10L-1 6L0 12L2 6L12 10L6 1L14 5L5-7L10-5L3-14L6-13Z" fill="#222" />
    <path d="M0-20L-5-10M0-12L8-2M0-5L-10 5M0 1L9 8" fill="none" stroke="#777" />
  </g>
}
function GardenTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke="#444" strokeWidth="1">
    <path d="M-4 23L-5-4M7 26L7-7M-5-4L-14-10M-5-4L1-13M7-7L15-15M7-7L-1-16" />
    <path d="M-17-5Q-21-12-13-13Q-15-19-6-18Q-2-25 3-19Q9-26 14-20Q21-22 22-14Q29-10 22-7L17-10L13-7L8-11L4-7L-2-12L-7-7L-12-10Z" fill="#666" />
    <path d="M-16-10L-10-14M-4-17L0-19M10-19L16-17M18-12L22-10" stroke="#bbb" />
  </g>
}

export function MuseumMaps() {
  return <svg viewBox="95 158 548 365" className="h-auto w-full" role="img" aria-label="A small local museum and its surroundings in 1957 and 2007" data-supplied-writing-diagram="museum">
    <rect x="95" y="158" width="548" height="365" fill="white" />
    <g fontFamily="Arial, Helvetica, sans-serif" fill="#222" fontSize="10">
      <text x="112" y="183" fontSize="12" fontWeight="700">Museum 1957</text><text x="392" y="183" fontSize="12" fontWeight="700">Museum 2007</text>
      <g fill="none" stroke="#777" strokeWidth="1.3"><rect x="111" y="190" width="243" height="315" /><rect x="391" y="190" width="232" height="315" /></g>
      <GardenTree x={145} y={220} scale={.8} /><GardenTree x={174} y={300} scale={.9} /><GardenTree x={132} y={341} scale={.8} /><GardenTree x={210} y={393} scale={.6} />
      <Pine x={236} y={257} /><Pine x={281} y={223} /><Pine x={320} y={263} /><Pine x={145} y={414} /><Pine x={280} y={442} /><Pine x={327} y={442} />
      <text x="153" y="259">garden</text>
      <path d="M207 295H344V374H288M258 374H207Z" fill="white" stroke="#111" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M208 332H343M262 333V339M262 350V363M290 333V338M290 349V366" fill="none" stroke="#666" strokeWidth="1.2" />
      <path d="M252 334L260 340M262 348L254 342M291 339L298 333M290 348L298 342M258 365L266 372M279 363L287 371" fill="none" stroke="#777" />
      <g textAnchor="middle"><text x="275" y="312">national history</text><text x="275" y="323">exhibition</text><text x="231" y="345">local</text><text x="231" y="356">history</text><text x="231" y="367">room</text><text x="317" y="346">museum</text><text x="317" y="357">store-</text><text x="317" y="368">room</text></g>
      <text x="288" y="391">entrance hall</text>
      <path d="M272 376C275 396 229 391 219 414C209 432 229 452 233 458H112M282 376C285 406 243 403 233 419C222 435 246 459 263 459H353" fill="none" stroke="#777" strokeWidth="1.5" />
      {Array.from({ length: 10 }, (_, i) => <Pine key={i} x={117 + i * 10.5} y={450} scale={.33} />)}
      <path d="M112 476H353" stroke="#777" strokeWidth="1.5" /><text x="204" y="471" textAnchor="middle">Road</text>
      <GardenTree x={422} y={221} scale={.8} /><Pine x={450} y={295} />
      <text x="430" y="259">garden</text>
      <path d="M425 324H481V238H618V374H453M438 374H425Z" fill="white" stroke="#111" strokeWidth="3.6" />
      <path d="M560 239V283M483 284H493M504 284H563M574 284H617M541 323H617M541 323V337M541 350V373M480 325V337M480 350V374" fill="none" stroke="#777" strokeWidth="1.3" />
      <path d="M484 282L493 275M563 282L573 275M481 338L488 345M541 337L548 346M440 369L447 376" fill="none" stroke="#777" />
      <g textAnchor="middle"><text x="522" y="257">special</text><text x="522" y="268">exhibitions</text><text x="589" y="257">education</text><text x="589" y="268">centre</text><text x="550" y="307">local history room</text><text x="450" y="346">museum</text><text x="450" y="358">shop</text><text x="510" y="360">reception</text><text x="581" y="354">cafe</text></g>
      <text x="430" y="395">entrance</text><text x="547" y="419">car park</text>
      <path d="M391 460H523M550 460H622M391 476H622" fill="none" stroke="#777" strokeWidth="1.5" />
      <path d="M523 456V463M550 456V463" stroke="#777" /><text x="480" y="471" textAnchor="middle">Road</text>
      <path d="M623 168V507" stroke="#111" strokeWidth="4" />
      {/* The faint pink arrows visible on the supplied museum plan. */}
      <path d="M444 356Q474 325 516 345L540 357L512 351L502 374Q470 351 451 373Z M452 459Q484 434 498 411L480 425L516 391L558 383L560 407Q538 441 510 459Z" fill="#efd2d6" opacity=".35" pointerEvents="none" />
    </g>
  </svg>
}

function Compass({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} fontSize="12" textAnchor="middle" fill="#111">
    <path d="M0-18V18M-20 0H20" stroke="#111" /><path d="M0-20L-4-11L0-14L4-11Z M0 20L-4 11L0 14L4 11Z M-22 0L-13-4L-16 0L-13 4Z M22 0L13-4L16 0L13 4Z" />
    <text y="-25">N</text><text y="33">S</text><text x="-30" y="4">W</text><text x="29" y="4">E</text>
  </g>
}

export function UniversitySportsPlans() {
  const dots = `sports-pool-${useId().replace(/:/g, '')}`
  return <svg viewBox="0 0 581 524" className="h-auto w-full" role="img" aria-label="UNIVERSITY SPORTS CENTRE (present) and UNIVERSITY SPORTS CENTRE (future plans)" data-supplied-writing-diagram="university-sports">
    <defs><pattern id={dots} width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#ddd" /><circle cx="1" cy="1" r=".35" fill="#777" /></pattern></defs>
    <rect width="581" height="524" fill="white" />
    <g fill="#111" fontFamily="Arial, Helvetica, sans-serif" fontSize="14" textAnchor="middle">
      <text x="293" y="26" fontSize="16" fontWeight="700">UNIVERSITY SPORTS CENTRE (present)</text>
      <g fill="none" stroke="#111" strokeWidth="1.6"><path d="M159 36H349V241H287M220 241H159Z" /><rect x="40" y="72" width="102" height="130" /><rect x="367" y="74" width="101" height="130" /><path d="M194 36V185M194 68H349M315 68V185M159 185H170M181 185H316M327 185H349M208 185a45 29 0 0 0 90 0" /></g>
      <rect x="221" y="78" width="67" height="98" fill={`url(#${dots})`} stroke="#111" />
      <text x="273" y="56">Gym</text><text x="254" y="125">25m</text><text x="254" y="140">Pool</text><text x="254" y="201">Reception</text>
      <text transform="translate(181 113) rotate(-90)">Changing room</text><text transform="translate(327 124) rotate(90)">Seating</text>
      <text x="91" y="134">Outdoor</text><text x="91" y="149">courts</text><text x="418" y="135">Outdoor</text><text x="418" y="150">courts</text>
      <path d="M254 250V228M254 228L249 237L254 233L259 237Z" fill="#111" stroke="#111" />
      <Compass x={535} y={106} />
      <text x="291" y="295" fontSize="16" fontWeight="700">UNIVERSITY SPORTS CENTRE (future plans)</text>
      <g stroke="#111" strokeWidth="1.6" fill="none"><path d="M20 303H486V509H287M219 509H20Z" /><path d="M158 303V452M193 303V375M193 336H451M315 336V453M347 336V453M451 303V453M451 373H486M159 453H170M181 453H315M327 453H348M348 441H365M376 441H451M20 453H65M76 453H157M391 453H486M391 453V509M114 470V509M114 474H142Q177 474 179 509M327 509Q329 477 354 476H391M207 453a45 28 0 0 0 90 0" /></g>
      <path d="M43 327C57 321 60 324 72 315C87 306 100 315 107 319C131 316 150 330 144 349C136 373 139 382 145 399C151 417 135 445 119 439C102 430 92 418 78 423C60 440 45 438 37 421C29 405 45 388 39 375C29 357 30 332 43 327Z" fill={`url(#${dots})`} stroke="#111" />
      <path d="M116 334C129 332 137 344 133 358C129 375 121 381 127 396C135 414 119 414 114 400C107 384 106 377 112 364C116 354 103 351 108 341C110 336 112 335 116 334Z" fill="white" stroke="#111" />
      <rect x="221" y="345" width="65" height="98" fill={`url(#${dots})`} stroke="#111" />
      <text x="85" y="371">Leisure</text><text x="85" y="386">pool</text><text x="320" y="326">Gym</text><text x="254" y="390">25m</text><text x="254" y="406">Pool</text><text x="254" y="470">Reception</text>
      <text transform="translate(181 381) rotate(-90)">Changing room</text><text transform="translate(328 393) rotate(90)">Seating</text>
      <text x="390" y="387">Sports</text><text x="390" y="402">hall</text>
      <text transform="translate(471 340) rotate(90)"><tspan x="0">Dance</tspan><tspan x="0" dy="15">studio</tspan></text><text transform="translate(471 409) rotate(90)"><tspan x="0">Dance</tspan><tspan x="0" dy="15">studio</tspan></text>
      <text x="65" y="479">Changing</text><text x="65" y="494">room</text><text x="137" y="489">Sports</text><text x="137" y="504">shop</text><text x="362" y="498">Café</text><text x="436" y="479">Changing</text><text x="436" y="494">room</text>
      <path d="M254 517V495M254 495L249 504L254 500L259 504Z" fill="#111" stroke="#111" />
      <Compass x={535} y={340} />
    </g>
  </svg>
}
