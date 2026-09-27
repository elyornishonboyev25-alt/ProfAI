import { useId } from 'react'

/** Native trace of the supplied monochrome Brightwater Adventure Park map. */
export default function BrightwaterAdventureParkDiagram({ caption }: { caption?: string }) {
  const titleId = useId()
  const treeId = useId()
  const smallTreeId = useId()

  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
      <svg data-brightwater-park viewBox="0 0 800 480" role="img" aria-labelledby={titleId} className="mx-auto h-auto w-full max-w-[650px] bg-white" xmlns="http://www.w3.org/2000/svg">
        <title id={titleId}>Brightwater Adventure Park map with station, railway, pool, Young Fun, lake, Mega Adventure, Crazy Golf, entrance and locations A to I</title>
        <defs>
          <g id={treeId} fill="white" stroke="#888" strokeWidth="1.1" strokeLinejoin="round">
            <path d="M0 19 V31 M-8 18 Q-14 17 -11 10 Q-13 4 -7 3 Q-5 -3 1 1 Q7 -3 10 4 Q16 5 12 12 Q15 18 8 19 Q4 24 0 20 Q-4 23 -8 18 Z" />
          </g>
          <g id={smallTreeId} fill="none" stroke="#aaa" strokeWidth=".8">
            <path d="M0 15 V25 M-6 16 Q-9 12 -7 9 Q-9 5 -4 4 Q-2 0 1 4 Q6 1 7 7 Q10 10 6 14 Q4 18 0 15 Q-3 18 -6 16 Z" />
          </g>
        </defs>
        <rect width="800" height="480" fill="#fff" />

        {/* Uneven outside edge and the original network of parallel path edges. */}
        <g fill="none" stroke="#1b1b1b" strokeLinecap="round" strokeLinejoin="round">
          <path strokeWidth="2.7" d="M93 429 Q65 414 49 383 Q35 356 34 317 L30 269 Q27 234 43 187 Q59 143 97 102 Q124 75 162 57 Q204 37 257 34 Q313 24 367 22 L565 20 Q656 15 703 24 Q736 37 759 69 Q778 91 774 119 Q780 145 770 177 Q760 210 752 239 Q746 277 728 318 Q707 362 674 399 Q641 430 588 443 Q540 454 476 450 L151 452 Q110 449 93 429 Z" />
          <path strokeWidth="2.2" d="M136 407 Q174 399 215 400 Q253 399 269 378 Q287 357 292 321 Q296 288 305 256 Q307 220 317 173 Q329 121 367 100 Q383 90 415 89 L659 86 Q683 89 693 107 Q704 122 699 146 Q686 207 663 254 Q659 263 659 286 Q658 332 633 377 Q612 412 584 435" />
          <path strokeWidth="2.2" d="M136 418 Q178 408 215 411 Q263 410 280 387 Q304 355 307 327 Q313 286 322 263 Q324 214 335 178 Q347 135 375 116 Q393 102 416 101 L655 98 Q674 100 683 113 Q694 126 686 149 Q677 197 653 247 Q647 260 647 284 Q648 328 622 369 Q602 406 571 432" />
          <path strokeWidth="2.2" d="M273 379 Q316 367 334 331 Q344 308 359 296 L449 295 Q469 292 476 276 L476 440" />
          <path strokeWidth="2.2" d="M286 388 Q327 372 344 339 Q356 318 367 309 L450 307 Q472 305 487 286 L487 440" />
          <path strokeWidth="2.2" d="M475 101 L475 262 L653 262 M487 101 L487 250 L650 250" />
          <path strokeWidth="2.2" d="M476 279 Q492 293 503 297 L654 297 M487 274 Q494 284 510 285 L656 285" />
          <path strokeWidth="2.2" d="M476 440 Q519 444 564 434 Q606 422 625 398" />
        </g>

        {/* Railway above the station, around B and diagonally over the lake. */}
        <g fill="none" stroke="#333" strokeLinecap="round" strokeLinejoin="round">
          <path strokeWidth="1.45" strokeDasharray="5 4" d="M132 233 Q121 200 130 156 Q139 111 182 89 Q253 53 376 52 L653 50 Q702 53 721 68 Q732 85 719 102 Q707 119 669 133 Q588 166 473 192 Q378 201 305 204 Q220 210 178 238 Q155 245 132 233 Z" />
          <path strokeWidth=".85" strokeDasharray="3 5" d="M137 237 Q128 198 138 159 Q148 119 187 97 Q257 62 378 60 L652 58 Q697 60 713 73 Q723 88 710 102 Q696 116 664 126 Q584 158 471 183 Q370 194 300 196 Q217 203 175 231 Q156 238 137 237 Z" />
          {Array.from({ length: 37 }, (_, i) => {
            const x = 184 + i * 13
            const y = 90 - 38 * Math.sin((i / 36) * Math.PI / 2)
            return <path key={`north-${i}`} strokeWidth=".75" d={`M${x} ${y - 3} l1 9`} />
          })}
          {Array.from({ length: 27 }, (_, i) => {
            const x = 190 + i * 19
            const y = 230 - i * 3.8
            return <path key={`cross-${i}`} strokeWidth=".75" d={`M${x} ${y - 4} l2 9`} />
          })}
        </g>

        {/* Main lake, smaller golf lake and the angular Young Fun area. */}
        <g fill="white" stroke="#222" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M308 232 Q320 213 341 213 Q354 205 371 212 Q389 209 401 216 Q419 209 438 218 Q452 218 461 232 Q470 241 464 253 Q469 270 455 277 Q445 290 425 286 Q413 295 398 288 Q385 295 368 286 Q347 291 331 280 Q309 278 305 263 Q293 250 308 232 Z" />
          <path d="M563 316 Q571 307 581 310 L589 322 Q584 337 579 344 L571 362 Q565 375 551 382 Q544 376 550 364 L554 347 Q557 328 563 316 Z" />
          <path d="M84 365 L125 302 Q129 296 138 296 L240 293 Q251 293 248 302 L207 365 Q203 372 194 372 Z" />
        </g>

        <g opacity=".72">
          {([
            [78, 206], [78, 251], [91, 290], [98, 347], [114, 151],
            [204, 81], [228, 68], [251, 60], [275, 52], [295, 49],
            [499, 59], [524, 57], [549, 58], [572, 60], [595, 62],
            [714, 129], [728, 166], [720, 222], [712, 279], [693, 338],
            [263, 415], [287, 416], [318, 417], [342, 419], [614, 428],
          ] as const).map(([x, y], i) => <use key={`tree-${i}`} href={`#${treeId}`} transform={`translate(${x} ${y}) scale(${i % 5 === 0 ? .93 : .72})`} />)}
          {([
            [374, 303], [393, 307], [410, 304], [430, 301], [450, 295],
            [515, 122], [536, 124], [555, 126], [575, 130],
            [608, 144], [626, 145], [645, 146],
          ] as const).map(([x, y], i) => <use key={`small-${i}`} href={`#${smallTreeId}`} transform={`translate(${x} ${y})`} />)}
        </g>

        {/* Station, pool, dead-end shops and three eastern stalls. */}
        <g fill="white" stroke="#222" strokeWidth="1.8">
          <rect x="365" y="49" width="96" height="25" />
          <rect x="159" y="151" width="65" height="31" />
          <rect x="91" y="406" width="22" height="22" /><rect x="115" y="406" width="22" height="22" /><rect x="139" y="406" width="22" height="22" />
          <path d="M679 302 l18 9 -7 15 -18 -8 Z M669 324 l18 8 -8 17 -17 -8 Z M657 348 l18 7 -8 17 -17 -7 Z" />
        </g>

        <g fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fill="#111" textAnchor="middle">
          <text x="414" y="66">Station</text><text x="644" y="42">Railway</text>
          <text x="191" y="170">pool</text><text x="383" y="262">Lake</text>
          <text x="362" y="149"><tspan x="362">Mega</tspan><tspan x="362" dy="15">Adventure</tspan></text>
          <text x="156" y="336"><tspan x="156">Young</tspan><tspan x="156" dy="15">Fun</tspan></text>
          <text x="537" y="341"><tspan x="537">Crazy</tspan><tspan x="537" dy="15">Golf</tspan></text>
          <text x="569" y="354" transform="rotate(-64 569 354)">Lake</text>
          <text x="478" y="469">Entrance</text>
          <text x="68" y="26">N</text><text x="68" y="104">S</text><text x="31" y="65">W</text><text x="105" y="65">E</text>
        </g>
        <g stroke="#111" fill="#111" strokeWidth="1.3">
          <path d="M68 34 V96 M39 64 H97 M68 34 l-5 10 h10 Z M97 64 l-9 -5 v10 Z M68 96 l-5 -10 h10 Z M39 64 l9 -5 v10 Z" />
        </g>
        <g fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="13" textAnchor="middle" fill="#111">
          {([
            ['A', 683, 348], ['B', 673, 121], ['C', 511, 226],
            ['D', 467, 184], ['E', 467, 116], ['F', 190, 129],
            ['G', 190, 210], ['H', 164, 417], ['I', 140, 417],
          ] as const).map(([letter, x, y]) => <g key={letter} transform={`translate(${x} ${y})`}>
            <rect x="-10" y="-10" width="20" height="20" fill="white" stroke="#111" strokeWidth="1.4" />
            <text y="5">{letter}</text>
          </g>)}
        </g>
      </svg>
      {caption ? <figcaption className="px-1 pt-2 text-center text-xs font-medium text-slate-600">{caption}</figcaption> : null}
    </figure>
  )
}
