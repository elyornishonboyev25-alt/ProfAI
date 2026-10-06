import { useId } from 'react'

function Can({ x, y, brand, scale = 1 }: { x: number; y: number; brand?: string; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="#555" strokeWidth=".7" fill="white">
    <path d="M3 4Q2 0 14 0Q26 0 26 4L29 9V45Q27 49 14 49Q2 49 0 45V9Z" />
    <ellipse cx="14" cy="4" rx="11" ry="2" fill="#eee" /><ellipse cx="14" cy="4" rx="4" ry="1" fill="none" />
    <path d="M3 10V44M26 11V44" fill="none" stroke="#aaa" />
    {brand && <text x="14" y="27" fontFamily="cursive" fontSize="7" fontStyle="italic" textAnchor="middle" fill="#222" stroke="none">{brand}</text>}
  </g>
}

export default function AluminiumRecyclingDiagram() {
  const stipple = `aluminium-stipple-${useId().replace(/:/g, '')}`
  return <svg viewBox="45 159 422 452" className="h-auto w-full" role="img" aria-label="The recycling process of aluminium cans: used cans, collection, cleaning sorting shredding and compressing, heating and melting, rolling 2.5mm - 6mm thick, recycling, reusing 74% recycled (UK)" data-supplied-writing-diagram="aluminium-recycling">
    <defs><pattern id={stipple} width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="white" /><circle cx="1" cy="1" r=".25" fill="#777" /></pattern></defs>
    <rect x="45" y="159" width="422" height="452" fill="white" />
    <g stroke="#555" strokeWidth=".8" fill="white" strokeLinecap="round" strokeLinejoin="round">
      <Can x={78} y={174} brand="Cola" /><Can x={121} y={174} brand="Cola" /><Can x={93} y={190} brand="Coca-Cola" /><Can x={138} y={190} brand="Pepsi" />
      {/* Used-can bin, hinged lid and the person depositing a can. */}
      <path d="M249 205L244 247Q257 258 270 249L269 205Z M243 202L256 181L277 197L270 207Z M243 201L254 175L261 179L277 194M250 199H266L263 188H256Z" />
      <path d="M253 214H264M256 213L258 218L261 214M250 221H266" fill="none" />
      <path d="M279 185Q276 175 281 169Q288 164 294 174L296 184L291 188M280 169L283 166L287 169L292 168L296 175M284 180L285 188" fill="none" />
      <path d="M284 188Q281 184 277 188L272 198L262 195L261 200L277 206L286 195M287 188Q292 186 295 195L298 215L294 220L293 233H278L280 216L279 208M282 234L281 249L276 252L286 253L289 236L290 249L298 252L299 249L295 233" />
      <path d="M293 195L296 208L289 215L285 212L290 204" fill="none" />
      <text x="257" y="235" textAnchor="middle" fontSize="4.5" stroke="none" fill="#555">Aluminium</text><text x="257" y="241" textAnchor="middle" fontSize="4.5" stroke="none" fill="#555">only</text>
      {/* Collection truck: cab, wheels, container and lifting mechanism. */}
      <path d="M338 266L370 261L371 290L352 300L336 290Z M340 269L351 267V282L340 284Z M356 267L367 266V280L356 282Z M338 286H368M339 293L336 299L337 309H366L376 300M372 258L414 253L428 286L423 301L375 311L370 290Z" />
      <path d="M374 260L403 256L413 283L406 291L375 298Z M408 254L405 243L417 238L424 247L421 261M406 254L409 274M414 263L418 272L415 279M391 255V299M380 302L394 298" />
      <path d="M374 257V246H393L397 256M385 246V239M385 239L391 236M413 240L429 235L432 246L423 250" />
      <ellipse cx="350" cy="304" rx="8" ry="11" fill="#555" /><ellipse cx="350" cy="304" rx="4" ry="7" /><ellipse cx="391" cy="301" rx="8" ry="11" fill="#555" /><ellipse cx="391" cy="301" rx="4" ry="7" /><ellipse cx="417" cy="295" rx="6" ry="9" fill="#555" /><ellipse cx="417" cy="295" rx="3" ry="5" />
      <path d="M338 311L365 312L423 302M330 320L389 316L433 302M344 320L396 317M426 325L437 322" fill="none" stroke="#aaa" />
      {/* Cleaning, sorting, shredding and compressing machinery. */}
      <path d="M355 430L368 425L435 422L446 429L443 461L370 468L355 458Z M368 425V454L370 468M355 430L352 444L362 451M435 423V459M446 430L435 435" />
      <path d="M378 423L375 414L379 398H389L397 415L393 423Z M379 398L385 406L389 398M375 414L383 420L397 415M421 422V398L441 397L447 404V425M421 398L427 405H447M428 406V420M441 406V422" />
      <path d="M401 420V414L404 408L410 415L417 414V422M398 422L402 416L412 420" fill="#555" />
      <path d="M349 459L357 456L363 461L362 468L354 471L349 466Z M357 469L365 467L371 471V477L363 480L357 475Z M344 468L349 465L355 471V477L348 480L343 475Z" />
      <path d="M391 434L396 430L400 437L397 436L394 442L389 441L392 436Z M403 439L409 441L405 448L405 445L398 445L397 440L403 441Z M396 449L391 450L388 443L391 445L394 440L398 443L395 447Z" fill="#555" stroke="none" />
      {/* Furnace and crucible used for heating and melting. */}
      <path d="M266 541L277 532L287 531L299 542L299 563L290 580L266 577L257 564Z M268 543Q278 536 291 543L293 565Q280 576 268 565Z M267 534L272 530H291L294 536M274 531V526L286 528V532M263 544L256 538L251 543L252 551L260 553M293 536L302 543L304 558L300 569M263 577L259 588L271 592M290 580L296 589L285 593M267 552L257 559L252 575L258 580M271 563L263 566M283 565L288 574" />
      <path d="M258 562L248 564L245 570L257 571M250 570L249 580L259 581" fill="none" />
      {/* Rolled sheet, with the original curled strip extending to the right. */}
      <path d="M83 470Q103 460 115 477Q122 487 125 504L141 529L170 542L157 553L131 542Q118 535 112 518L98 487Q93 480 87 488Q82 499 91 505Q99 508 101 495L105 507Q98 528 84 516Q69 502 80 480Z" />
      <path d="M86 479Q102 470 109 490L119 517Q128 539 157 550M87 488Q80 495 89 503Q96 507 98 497" fill="none" />
      <Can x={63} y={340} />
    </g>
    <g fill="#111">
      <path d="M318 214L334 223L339 216L347 241L322 237L327 231L311 222Z M394 346H410V364H416L402 385L389 364H395Z M348 523L354 533L337 544L341 550L315 553L322 529L326 536Z M224 546L220 557L207 554L205 562L186 546L211 540L209 547Z M81 455L77 434L73 436L83 416L98 437L91 436L96 452Z M79 318L86 297L80 297L99 285L102 310L95 306L89 322Z" />
      <path d="M245 338L251 348L265 337L264 352L278 356L267 366L279 379L264 381L263 397L252 388L241 400L237 385L221 389L225 375L213 365L229 359L227 343L240 350Z" fill="black" />
      <path d="M239 356L253 349L256 375L239 389Z" fill="#111" stroke="white" strokeWidth=".7" /><path d="M240 361L253 355L254 373L241 379Z" fill="white" /><path d="M241 364L252 359V371L241 377Z" fill="#111" />
      <rect x="193" y="408" width="107" height="12" fill="black" />
    </g>
    <g fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle" fontSize="10" fill="#111">
      <text x="125" y="255">REUSING</text><text x="125" y="268">74% recycled (UK)</text><text x="273" y="267">used cans</text>
      <text x="388" y="335">COLLECTION</text><text x="396" y="492">CLEANING, SORTING,</text><text x="396" y="505">SHREDDING AND</text><text x="396" y="517">COMPRESSING</text>
      <text x="275" y="605">HEATING AND MELTING</text><text x="109" y="551">ROLLING</text><text x="109" y="564">2.5mm - 6mm thick</text><text x="80" y="405">RECYCLING</text>
      <text x="247" y="417" fill="white" fontWeight="700">Aluminium recycle</text><text x="247" y="430" fill="#ccc">www.ielts-exam.net</text>
    </g>
  </svg>
}
