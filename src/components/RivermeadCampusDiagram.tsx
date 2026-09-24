import { useId } from 'react'

/** Native drawing traced in the coordinate system of the supplied campus map. */
export default function RivermeadCampusDiagram({ caption }: { caption?: string }) {
  const titleId = useId()
  const pineId = useId()
  const leafyId = useId()
  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
      <svg data-rivermead-campus viewBox="104 162 540 540" role="img" aria-labelledby={titleId} className="mx-auto h-auto w-full max-w-3xl bg-white" xmlns="http://www.w3.org/2000/svg">
        <title id={titleId}>Rivermead School Campus: locations A to J, main entrance, Park Road, Rennies Drive, car parks P1 and P2, classroom block and compass</title>
        <defs>
          <g id={pineId} stroke="#7e847f" strokeWidth="0.8" fill="#989e99">
            <path d="M0 0 L-3 9 L-1 8 L-5 16 L-2 15 L-6 23 L-3 22 L-7 31 Q-1 35 6 31 L3 23 L6 24 L2 15 L4 16 L1 8 L3 9 Z" />
            <path d="M0 26 L0 39" strokeWidth="1.8" />
            <ellipse cx="0" cy="40" rx="7" ry="2" fill="#bec1bb" stroke="none" />
          </g>
          <g id={leafyId} stroke="#858b86" strokeWidth="0.7" fill="#a4aaa5">
            <path d="M0 3 C-4 -2 -5 5 -5 8 C-9 6 -9 14 -7 16 C-11 19 -8 24 -6 25 C-10 29 -5 32 -2 31 C-2 35 4 34 5 30 C10 31 10 25 7 23 C12 19 8 15 7 15 C10 10 6 7 4 9 C6 4 2 0 0 3 Z" />
            <path d="M0 22 L0 39 M0 31 L-4 27 M0 28 L4 23" fill="none" />
            <ellipse cx="0" cy="40" rx="8" ry="2" fill="#bec1bb" stroke="none" />
          </g>
        </defs>
        <rect x="110.5" y="168.5" width="526" height="526" fill="white" stroke="#5c5c5c" strokeWidth="2.4" />
        <text x="373" y="207" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="24" fontWeight="700" fill="#101010">Rivermead School Campus</text>

        {/* The continuous road outline preserves the entrance forks, T junction,
            curved Park Road, roundabout and eastbound road from the scan. */}
        <g fill="none" stroke="#777b77" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
          <path d="M111 602 Q134 624 151 647 Q165 631 183 619 Q192 608 210 605 Q216 573 205 540 Q197 514 181 487 Q162 455 174 430 L182 413 Q178 405 167 395 M111 621 Q141 652 160 693 L171 693 Q164 668 157 660 Q171 641 187 632 Q199 620 217 621" />
          <path d="M217 621 Q281 629 333 591 Q374 561 387 507 Q389 492 403 494 Q416 505 429 493 Q434 489 435 484 L599 450 M599 431 L431 469 Q424 467 417 469 Q411 449 401 433 Q430 410 474 391 L480 384 Q480 304 449 237 M438 241 Q459 294 465 327 Q469 354 468 383 Q429 399 391 422 Q379 420 372 420" />
          <path d="M251 371 Q258 390 256 410 Q272 407 298 411 Q310 382 340 370 Q373 355 408 348 Q444 340 465 327 M238 372 Q248 398 238 424 Q252 422 263 431 Q275 470 255 500 Q241 519 217 532 Q209 508 191 481 Q177 459 184 447 L190 456 L194 446 L187 442 L189 435 L198 438 L202 429 L195 425 L196 420 L203 420 L202 407 L193 408 Q184 392 176 385" />
          <path d="M217 621 Q228 582 218 545 Q252 529 268 505 Q292 468 275 428 Q283 419 301 425 Q322 434 346 432 Q374 429 386 435 Q400 449 404 469 Q398 475 401 483 Q380 480 374 503 Q364 550 326 578 Q279 612 220 605" />
          <path d="M309 417 Q317 390 350 380 Q392 365 419 357 Q446 350 467 337" />
          <path d="M419 244 L438 244 M421 257 L443 257 M420 272 Q437 274 449 268 M423 287 Q440 286 455 281" />
          <circle cx="418" cy="481" r="7.5" />
          <path d="M459 255 L521 252 Q525 251 525 257 L525 289 Q525 292 521 292 L472 294" />
          <path d="M322 417 L321 391 Q321 387 326 387 L369 387 Q373 387 373 391 L373 419" />
          <path d="M377 550 L467 553 Q470 554 469 559 L468 660 Q468 663 464 663 L379 659 Q375 659 376 655 Z" />
          {/* Gate posts and small entrance-side road details. */}
          <path d="M181 618 L183 599 Q185 592 188 600 L188 615 M184 607 L185 598 M193 634 L193 614 Q196 605 200 612 L200 629 M196 624 L197 614 M242 602 L244 609 M253 601 L257 608" />
        </g>
        {/* Grey verge marks follow the same curves without changing road widths. */}
        <g fill="none" stroke="#a5a9a4" strokeWidth="4" opacity="0.65">
          <path d="M220 543 Q256 525 271 494 Q283 466 275 429 M217 621 Q282 629 334 591 Q373 559 387 508 M435 486 L598 451 M402 434 Q437 408 477 389 L479 383 M299 427 Q335 438 366 432" />
        </g>
        <g>
          <use href={`#${leafyId}`} transform="translate(303 263) scale(.8 1.1)" />
          <use href={`#${leafyId}`} transform="translate(320 267) scale(.85 .75)" />
          <use href={`#${leafyId}`} transform="translate(328 265) scale(.75 .8)" />
          <use href={`#${leafyId}`} transform="translate(375 294) scale(.9 .85)" />
          <use href={`#${leafyId}`} transform="translate(387 284) scale(.85 .75)" />
          <use href={`#${leafyId}`} transform="translate(395 281) scale(.8 .8)" />
          <use href={`#${pineId}`} transform="translate(297 319)" />
          <use href={`#${pineId}`} transform="translate(312 334) scale(.85 .8)" />
          <use href={`#${pineId}`} transform="translate(328 318) scale(.9 1)" />
        </g>
        <g fontFamily="Arial, Helvetica, sans-serif" fontSize="12" textAnchor="middle" fill="#303430">
          <text x="496" y="270"><tspan x="496">Car</tspan><tspan x="496" dy="13">park P1</tspan></text>
          <text x="347" y="401"><tspan x="347">Car</tspan><tspan x="347" dy="13">park P2</tspan></text>
          <text x="374" y="365" transform="rotate(-20 374 365)">Park Road</text>
          <text x="464" y="310" transform="rotate(75 464 310)">Rennies Drive</text>
          <text x="422" y="602"><tspan x="422">Classroom</tspan><tspan x="422" dy="13">block</tspan></text>
          <text x="200" y="648" fontWeight="700"><tspan x="200">Main</tspan><tspan x="200" dy="13">entrance</tspan></text>
          <text x="162" y="257">N</text><text x="188" y="284">E</text><text x="161" y="312">S</text><text x="132" y="284">W</text>
        </g>
        <g stroke="#2c302c" fill="#2c302c" strokeWidth="1">
          <path d="M161 262 L161 297 M144 280 L177 280" />
          <path d="M161 262 L157 269 L165 269 Z M177 280 L170 276 L170 284 Z M161 297 L158 291 L164 291 Z M144 280 L150 277 L150 283 Z" />
        </g>
        <g fontFamily="Arial, Helvetica, sans-serif" fontSize="18" fontWeight="700" textAnchor="middle" fill="#202520">
          {([
            ['A', 205, 473, 0], ['B', 270, 402, 2], ['C', 330, 445, 0],
            ['D', 417, 392, -28], ['E', 409, 250, -3], ['F', 446, 308, 0],
            ['G', 434, 455, 8], ['H', 523, 477, -10], ['I', 340, 539, 2], ['J', 288, 504, 0],
          ] as const).map(([letter, x, y, angle]) => (
            <g key={letter} transform={`translate(${x} ${y}) rotate(${angle})`}>
              <rect x="-11" y="-11" width="22" height="21" rx="2" fill="white" stroke="#818681" strokeWidth=".8" />
              <text y="6" transform={`rotate(${-angle})`}>{letter}</text>
            </g>
          ))}
        </g>
      </svg>
      {caption ? <figcaption className="px-1 pt-2 text-center text-xs font-medium text-slate-600">{caption}</figcaption> : null}
    </figure>
  )
}
