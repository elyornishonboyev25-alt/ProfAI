import { useId } from 'react'

/** The supplied Brightwater map redrawn as SVG so it also works in saved Analyze views. */
export default function BrightwaterAdventureParkDiagram({ caption }: { caption?: string }) {
  const titleId = useId()
  const treeId = useId()
  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
      <svg data-brightwater-park viewBox="0 0 520 275" role="img" aria-labelledby={titleId} className="mx-auto h-auto w-full max-w-3xl bg-white" xmlns="http://www.w3.org/2000/svg">
        <title id={titleId}>Brightwater Adventure Park map with station, railway, pool, Young Fun, lake, Mega Adventure, Crazy Golf, entrance and locations A to I</title>
        <defs>
          <g id={treeId} fill="none" stroke="#777" strokeWidth=".8">
            <path d="M0 11 V21 M-7 12 Q-10 8 -7 5 Q-8 1 -3 1 Q0 -3 3 1 Q8 0 8 5 Q11 9 6 12 Q3 15 0 12 Q-4 16 -7 12 Z" />
          </g>
        </defs>
        <rect width="520" height="275" fill="#fff" />
        {/* Irregular perimeter and the winding internal boundary follow the original scan. */}
        <g fill="none" stroke="#161616" strokeLinejoin="round" strokeLinecap="round">
          <path strokeWidth="3.5" d="M39 222 Q27 203 25 180 Q18 153 31 124 Q45 99 62 78 Q80 53 111 40 Q137 31 161 30 L227 20 Q280 16 323 18 L394 16 Q446 15 469 20 L493 31 Q508 46 507 63 Q513 83 501 112 Q501 139 486 169 Q481 195 453 221 Q438 237 406 242 Q367 252 330 247 L83 251 Q57 247 39 222 Z" />
          <path strokeWidth="3" d="M81 226 Q104 221 124 221 L153 214 Q173 207 184 185 L194 163 Q200 145 206 127 Q206 105 216 90 Q232 65 261 57 L370 55 Q410 54 442 62 Q455 69 454 85 Q449 110 439 134 L433 147 L431 179 Q429 201 416 222 Q404 240 367 244" />
          <path strokeWidth="2.7" d="M179 216 Q195 203 201 185 Q207 168 211 154 Q218 147 231 151 L315 161 Q326 170 326 187 L325 244" />
          <path strokeWidth="2.7" d="M205 142 Q211 113 227 89 Q243 68 272 63 L326 63 L326 158 Q318 166 304 169" />
          <path strokeWidth="2.7" d="M331 62 L331 150 L433 150 M331 159 L426 159" />
          <path strokeWidth="2.7" d="M66 213 L94 176 L176 173 Q183 173 183 178 L157 215 Z" />
          <path strokeWidth="2.7" d="M326 244 Q337 226 342 212 L349 182 Q360 167 377 166 L419 168" />
          <path strokeWidth="2.2" d="M385 226 Q398 215 399 198 Q397 182 404 176 Q411 169 416 177 L414 193 Q410 216 398 230" />
        </g>
        {/* Railway runs above the station and follows the park's northern rim. */}
        <g fill="none" stroke="#111" strokeLinecap="round">
          <path strokeWidth="1.8" d="M151 46 Q271 27 409 29 L470 31" />
          <path strokeWidth="1.8" d="M151 52 Q271 33 409 35 L470 37" />
          {Array.from({ length: 44 }, (_, i) => <path key={i} strokeWidth="1" d={`M${160 + i * 7} ${45 - Math.sin(i / 9) * 7} l2 7`} />)}
        </g>
        <g fill="none" stroke="#222" strokeWidth="2.2" strokeDasharray="5 5" strokeLinecap="round">
          <path d="M168 51 Q111 50 90 89 Q75 119 90 135 Q105 154 157 145 L206 138" />
          <path d="M208 135 Q260 125 324 117 Q379 108 446 70 L479 60" />
          <path d="M326 237 Q370 235 404 221" />
        </g>
        {/* Lake, pool, golf water hazard and the two small attractions. */}
        <g fill="#fff" stroke="#1d1d1d" strokeWidth="2.6" strokeLinejoin="round">
          <path d="M239 112 Q254 104 270 112 Q278 115 291 113 Q307 109 319 115 L319 129 Q331 142 315 149 Q303 159 287 156 Q274 154 264 159 Q245 160 234 150 Q219 148 223 135 Q216 121 239 112 Z" />
          <path d="M373 185 Q377 178 384 181 L390 189 Q384 197 379 202 L371 220 L359 222 Q354 215 360 206 Z" />
          <path d="M430 177 l13 5 -4 10 -13 -4 Z M425 197 l12 3 -3 11 -13 -3 Z M416 214 l14 3 -4 13 -13 -4 Z" />
        </g>
        <g fill="none" stroke="#858585" strokeWidth=".8">
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${352 + (i % 6) * 13} ${43 + Math.floor(i / 6) * 39} q5 -7 10 0 m-5 -5 v12`} />)}
        </g>
        <g opacity=".72">
          {([
            [45, 115], [53, 149], [48, 178], [80, 141], [86, 84],
            [149, 49], [165, 42], [180, 41], [197, 41],
            [353, 46], [367, 43], [382, 45], [399, 43],
            [482, 77], [489, 109], [483, 143], [473, 174], [459, 208],
            [187, 234], [210, 231], [238, 229], [270, 232], [404, 236],
            [235, 161], [249, 166], [269, 169], [284, 169], [299, 165],
          ] as const).map(([x, y], i) => <use key={i} href={`#${treeId}`} transform={`translate(${x} ${y}) scale(${i % 4 === 0 ? .85 : .65})`} />)}
        </g>
        {/* Station, pool, entrance booths and compass. */}
        <g fill="#fff" stroke="#111" strokeWidth="1.8">
          <rect x="268" y="28" width="59" height="13" /><rect x="100" y="93" width="47" height="17" />
          <rect x="66" y="232" width="13" height="14" /><rect x="82" y="232" width="13" height="14" />
        </g>
        <g fontFamily="Arial, Helvetica, sans-serif" fill="#111" fontSize="11" textAnchor="middle">
          <text x="297" y="38">Station</text><text x="124" y="105">pool</text><text x="423" y="27">Railway</text>
          <text x="277" y="90"><tspan x="277">Mega</tspan><tspan x="277" dy="12">Adventure</tspan></text>
          <text x="272" y="143">Lake</text><text x="111" y="198"><tspan x="111">Young</tspan><tspan x="111" dy="12">Fun</tspan></text>
          <text x="358" y="191"><tspan x="358">Crazy</tspan><tspan x="358" dy="12">Golf</tspan></text>
          <text x="370" y="210" transform="rotate(-66 370 210)">Lake</text>
          <text x="326" y="264">Entrance</text>
          <text x="48" y="19">N</text><text x="48" y="72">S</text><text x="19" y="46">W</text><text x="78" y="46">E</text>
        </g>
        <g stroke="#111" fill="#111" strokeWidth="1.2">
          <path d="M48 23 L48 64 M26 44 L70 44 M48 23 l-4 7 8 0 Z M70 44 l-7 -4 0 8 Z M48 64 l-4 -7 8 0 Z M26 44 l7 -4 0 8 Z" />
        </g>
        <g fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="12" textAnchor="middle" fill="#111">
          {([
            ['A', 438, 207], ['B', 440, 64], ['C', 351, 128],
            ['D', 324, 106], ['E', 326, 62], ['F', 152, 80],
            ['G', 149, 124], ['H', 97, 240], ['I', 68, 240],
          ] as const).map(([letter, x, y]) => <g key={letter} transform={`translate(${x} ${y})`}>
            <rect x="-8" y="-9" width="16" height="17" fill="#fff" stroke="#111" strokeWidth="1.4" />
            <text y="5">{letter}</text>
          </g>)}
        </g>
      </svg>
      {caption ? <figcaption className="px-1 pt-2 text-center text-xs font-medium text-slate-600">{caption}</figcaption> : null}
    </figure>
  )
}
