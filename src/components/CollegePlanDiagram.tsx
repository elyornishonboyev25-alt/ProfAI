import { useId } from 'react'

/** Traced in source-image coordinates. Door openings and compass are part of the plan. */
export default function CollegePlanDiagram({ caption }: { caption?: string }) {
  const id = useId()
  const rooms: [string, number, number][] = [
    ['A', 263, 255], ['B', 399, 255], ['C', 263, 341], ['D', 309, 341],
    ['E', 491, 366], ['F', 167, 464], ['G', 364, 450], ['H', 418, 419],
    ['I', 491, 419], ['J', 491, 580],
  ]
  const doors: [number, number, boolean][] = [
    [194, 282, false], [263, 282, false], [309, 282, false], [354, 282, false], [399, 282, false],
    [263, 369, false], [309, 369, false], [191, 464, true], [350, 450, true],
    [441, 366, true], [468, 366, true], [441, 421, true], [468, 421, true],
    [441, 477, true], [468, 477, true], [290, 552, false], [426, 552, false], [490, 552, false],
  ]
  return <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
    <svg data-college-plan viewBox="125 180 415 450" role="img" aria-labelledby={`${id}-title ${id}-description`} className="mx-auto block h-auto w-full max-w-xl rounded-lg bg-white">
      <title id={`${id}-title`}>College plan</title>
      <desc id={`${id}-description`}>College plan with rooms A to J around the square. Gym at the top left, First Aid Room and Library to the right, Hall and Office at the bottom. North points up.</desc>
      <defs>
        <g id={`${id}-tree`} fill="none" stroke="#858580" strokeWidth="0.7" strokeLinejoin="round">
          <path fill="#f2f2ef" d="M0 0l-4 5 1 3-5 3 2 4-6 5 3 4-5 6 4 3-5 5 3 4-3 6 6 1-2 6 7-3 2 4 4-4 5 3-1-6 5 2-3-7 4-2-3-5 3-3-4-4 2-5-4-2 2-4-5-3 1-5-4-2z" />
          <path strokeWidth="1.2" d="M0 12l1 45-2 6m2-6 3 7M1 42l-7-11m7 5 7-13M0 26l-5-9m6 30 8-8M0 52l-6-9" />
          {Array.from({ length: 34 }, (_, i) => {
            const x = Math.sin(i * 9) * (5 + (i % 4)), y = 8 + (i * 7) % 43
            return <path key={i} d={`M${x} ${y}l-2-4 3 2-1-5m0 7 3-4-1 6`} />
          })}
          <path d="M-10 63q10-3 20 1m-16-3-4 3m16-4 3 4" />
        </g>
      </defs>
      <rect x="125" y="180" width="415" height="450" fill="white" />
      <g fill="none" stroke="#777773" strokeWidth="3">
        <path d="M147 227H422V282H147ZM241 227V282M287 227V282M332 227V282M377 227V282" />
        <path d="M240 314H333V369H240ZM287 314V369" />
        <path d="M145 389H191V539H145Z" />
        <path d="M350 421H373V477H350Z" />
        <path d="M395 341H441V503H395ZM395 394H441M395 449H441" />
        <path d="M468 341H514V503H468ZM468 394H514M468 449H514" />
        <path d="M227 552H352V607H227Z" />
        <path d="M397 552H521V607H397ZM458 552V607" />
      </g>
      {doors.map(([x, y, vertical], index) => <g key={index} transform={`translate(${x} ${y}) rotate(${vertical ? 90 : 0})`}>
        <path d="M-5 0H5" stroke="white" strokeWidth="5" />
        <path d="M-6-4V4M6-4V4" stroke="#292925" strokeWidth="4" />
      </g>)}
      <g fontFamily="'Times New Roman', serif" fill="#292925" textAnchor="middle">
        <text x="332" y="207" fontSize="15" fontWeight="bold" letterSpacing=".5">College plan</text>
        <text x="195" y="257" fontSize="12">Gym</text>
        <text x="277" y="462" fontSize="12">SQUARE</text>
        <text x="418" y="365" fontSize="11">First Aid<tspan x="418" dy="14">Room</tspan></text>
        <text x="492" y="480" fontSize="12">Library</text>
        <text x="290" y="584" fontSize="12">Hall</text>
        <text x="427" y="584" fontSize="12">Office</text>
        {rooms.map(([label, x, y]) => <g key={label}>
          <ellipse cx={x} cy={y} rx={label === 'A' || label === 'B' || label === 'C' || label === 'D' ? 7.5 : 6.5} ry={label === 'F' ? 9 : 8.5} fill="white" stroke="#44443f" strokeWidth="1.4" />
          <text x={x} y={y + 4.3} fontSize="13">{label}</text>
        </g>)}
      </g>
      <use href={`#${id}-tree`} transform="translate(178 306)" />
      <use href={`#${id}-tree`} transform="translate(178 548) scale(1 .94)" />
      <use href={`#${id}-tree`} transform="translate(371 528)" />
      <g stroke="#353531" fill="#353531" strokeWidth="1">
        <path d="M486 253V307M461 280H510" />
        <path d="M486 253l-3 7h6ZM486 307l-3-7h6ZM461 280l7-3v6ZM510 280l-7-3v6Z" />
      </g>
      <g fontFamily="Arial, sans-serif" fill="#353531" fontSize="11" textAnchor="middle">
        <text x="486" y="249">N</text><text x="486" y="320">S</text>
        <text x="457" y="284">W</text><text x="517" y="284">E</text>
      </g>
    </svg>
    {caption ? <figcaption className="px-1 pt-2 text-center text-xs font-medium text-slate-600">{caption}</figcaption> : null}
  </figure>
}
