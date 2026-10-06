import { useId } from 'react'

function Stage({ x, y, number }: { x: number; y: number; number: number }) {
  return <g><circle cx={x} cy={y} r="12" fill="white" stroke="#222" strokeWidth="1.6" /><text x={x} y={y + 5} fontFamily="Arial, Helvetica, sans-serif" fontSize="16" textAnchor="middle" fill="#111">{number}</text></g>
}

export default function GeothermalPowerPlant() {
  const id = useId().replace(/:/g, '')
  const rocks = `geothermal-rocks-${id}`, metal = `geothermal-metal-${id}`
  return <svg viewBox="57 200 553 534" className="h-auto w-full" role="img" aria-label="Geothermal power plant: cold water pumped down 4.5 km through the injection well, heated by hot rocks, pumped up through the production well, condenser, steam-powered turbine and generator producing electricity" data-supplied-writing-diagram="geothermal-power">
    <defs>
      <pattern id={rocks} width="9" height="8" patternUnits="userSpaceOnUse"><rect width="9" height="8" fill="#bcbcbc" /><path d="M1 1h.6M5 3h.7M2 6h.8M8 7h.5" stroke="#333" strokeWidth=".7" /><path d="M6 6h.8M8 2h.6M3 4h.7" stroke="white" strokeWidth=".6" /></pattern>
      <pattern id={metal} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#f7f7f7" /><circle cx="1" cy="2" r=".25" fill="#aaa" /></pattern>
    </defs>
    <rect x="57" y="200" width="553" height="534" fill="white" />
    <g fill="#111" fontFamily="Arial, Helvetica, sans-serif" fontSize="16" textAnchor="middle">
      <text x="345" y="228" fontSize="19" fontWeight="700">Geothermal power plant</text>
      {/* Steel transmission pylon, including cross-arms and diagonal bracing. */}
      <g fill="none" stroke="#222" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M198 249H204L214 350L234 458H168L189 350Z M199 249L202 254L195 261L209 270L192 280L211 292L189 307L213 321L186 337L216 353L183 373L220 393L178 419L226 442L173 457M202 254L197 256L205 260L193 270L210 280L192 292L213 307L187 321L215 337L184 353L219 373L180 393L224 419L175 442L231 457" />
        <path d="M165 286L192 271H210L237 286Z M165 317L190 303H212L237 317Z M165 348L187 335H215L237 348Z M167 458H236" />
        <path d="M172 282L175 286L176 280L180 286L181 277L185 286L186 274L192 286L195 273L201 285L207 273L213 286L216 275L221 286L222 279L227 286L228 282M172 313L176 317L177 310L182 317L183 307L188 317L190 305L195 317L201 305L206 317L211 305L216 317L219 307L223 317L225 310L229 317L230 313M171 344L176 348L178 340L184 348L186 337L194 348L201 336L209 348L214 337L220 348L222 341L228 348L229 344" />
      </g>
      {/* Above-ground cold-water tank and machinery housing. */}
      <g fill={`url(#${metal})`} stroke="#333" strokeWidth="1.2">
        <path d="M97 395H163V459H97Z" />
        <path d="M254 316H428V347H467V333H558V456H468V367H429V398H254Z" />
        <rect x="263" y="336" width="69" height="46" rx="11" />
      </g>
      <g fill="none" stroke="#333" strokeWidth="1.2">
        <path d="M355 333Q380 326 412 338L414 376Q380 390 359 382Z" />
        <ellipse cx="362" cy="360" rx="10" ry="27" fill="white" />
        <path d="M384 332Q394 321 399 345M401 335Q407 325 410 343M395 338Q411 356 396 381M406 340Q421 356 407 377M369 330L373 325L376 331M367 385L372 378" />
        <path d="M333 355H352V362H333M254 357H244L226 371M226 371L231 362M226 371L237 368M437 355H420M420 355L427 351M420 355L427 359" />
      </g>
      <path d="M279 361L297 353L290 360L311 354L297 363L301 357Z" fill="#222" />
      <text x="131" y="413" fontWeight="700"><tspan x="131">Cold</tspan><tspan x="131" dy="17">water</tspan></text>
      <text x="297" y="312" fontWeight="700">Generator</text><text x="385" y="312" fontWeight="700">Turbine</text>
      <text x="464" y="362" paintOrder="stroke" stroke="white" strokeWidth="4">Steam</text>
      <text x="514" y="404" fontWeight="700">Condenser</text>
      <g fontSize="14"><text x="297" y="414"><tspan x="297">(powered by</tspan><tspan x="297" dy="13">turbine and</tspan><tspan x="297" dy="13">produces</tspan><tspan x="297" dy="13">electricity)</tspan></text><text x="386" y="413"><tspan x="386">(powered by</tspan><tspan x="386" dy="13">steam)</tspan></text></g>
      {/* Underground wells and hot-rock zone, at the source's original positions. */}
      <path d="M95 460H128V625H158V460H494V623H532V460H563V718H95Z" fill={`url(#${rocks})`} />
      <path d="M95 459H128M158 459H494M532 459H563" fill="none" stroke="#333" strokeWidth="2" />
      <path d="M144 463V617M144 617L141 610M144 617L148 610M513 616V456M513 456L510 464M513 456L516 464" fill="none" stroke="#111" strokeWidth="1.4" />
      <g fill="none" stroke="#f5f5f5" strokeWidth="3.2">
        <path d="M134 625V649Q134 660 146 660H496Q507 660 507 648V627" />
        <path d="M141 625V651Q141 667 157 667H502Q515 667 515 648V627" />
        <path d="M149 625V653Q149 674 168 674H507Q522 674 522 648V627" />
        <path d="M154 653H222M155 668H222M437 653H495M437 668H499" />
      </g>
      <g fill="#f5f5f5"><path d="M227 653L219 649V657Z M227 668L219 664V672Z M505 621L501 631H509Z M513 621L509 631H517Z M521 621L517 631H525Z" /></g>
      <path d="M128 468Q117 464 117 478V528Q117 544 121 546Q117 548 117 561V612Q117 627 127 628" fill="none" stroke="white" strokeWidth="1.2" />
      <text x="92" y="551" fontSize="15">4.5 km</text>
      <g paintOrder="stroke" stroke="white" strokeWidth="3" fontSize="17"><text x="196" y="524"><tspan x="196">Cold</tspan><tspan x="196" dy="17">water</tspan><tspan x="196" dy="17">pumped</tspan><tspan x="196" dy="17">down</tspan></text><text x="455" y="521"><tspan x="455">Hot</tspan><tspan x="455" dy="17">water</tspan><tspan x="455" dy="17">pumped</tspan><tspan x="455" dy="17">up</tspan></text><text x="333" y="668" fontSize="16" fontWeight="700">Geothermal zone (hot rocks)</text></g>
      <g fontWeight="700" paintOrder="stroke" stroke="white" strokeWidth="3"><text x="101" y="680"><tspan x="101">The</tspan><tspan x="101" dy="17">injection</tspan><tspan x="101" dy="17">well</tspan></text><text x="552" y="667"><tspan x="552">The</tspan><tspan x="552" dy="17">production</tspan><tspan x="552" dy="17">well</tspan></text></g>
      <Stage x={101} y={380} number={1} /><Stage x={103} y={638} number={2} /><Stage x={553} y={635} number={3} /><Stage x={550} y={317} number={4} /><Stage x={345} y={318} number={5} />
    </g>
  </svg>
}
