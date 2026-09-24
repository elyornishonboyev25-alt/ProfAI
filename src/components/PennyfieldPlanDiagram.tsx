import { useId } from 'react'

/** Coordinates trace the supplied plan, including its slightly sloping outlines. */
export default function PennyfieldPlanDiagram({ caption }: { caption?: string }) {
  const titleId = useId()
  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
      <svg data-pennyfield-plan viewBox="15 220 520 280" role="img" aria-labelledby={titleId} className="mx-auto h-auto w-full max-w-3xl bg-white" xmlns="http://www.w3.org/2000/svg">
        <title id={titleId}>Plan of the Pennyfield Riding Centre: locations A to G, Car park, Storeroom, Shop, Field, Indoor Arena, Stable block and You are here</title>
        <g fill="none" stroke="#454545" strokeWidth="1.5" strokeLinejoin="miter">
          <path d="M29 237 L515 234 L521 484 L27 489 Z" />
          <path d="M36 244 L156 244 L156 294 L36 294 Z" />
          <path d="M53 301 L104 301 L104 326 L53 326 Z" />
          <path d="M136 294 L194 294 L194 325 L136 325 Z" />
          <path d="M193 263 L258 262 L258 317 L193 318 Z" />
          <path d="M273 262 L339 261 L339 323 L273 324 Z" />
          <path d="M391 246 L500 246 L502 343 L392 344 Z M423 246 L424 343" />
          <path d="M399 344 L399 369 M433 344 L434 369 M445 344 L446 369 M479 343 L480 368" />
          <path d="M39 333 L99 333 L99 477 L38 478 Z" />
          <path d="M99 349 L161 348 L161 387 L99 387" />
          <path d="M161 372 L503 368 L504 403 L191 407 L191 414 L161 415 Z" />
          <path d="M191 372 L191 407 M230 371 L230 406 M346 370 L347 405 M366 370 L367 405" />
        </g>
        <g fill="#202020" fontFamily="Arial, Helvetica, sans-serif" fontSize="11" textAnchor="middle">
          <text x="95" y="273">Car park</text>
          <text x="164" y="313">Storeroom</text>
          <text x="306" y="296">Shop</text>
          <text x="463" y="297">Field</text>
          <text x="67" y="403"><tspan x="67">Indoor</tspan><tspan x="67" dy="13">Arena</tspan></text>
          <text x="287" y="391">Stable block</text>
          <text x="293" y="439">You are here</text>
          <g fontWeight="700">
            <text x="210" y="393">A</text><text x="127" y="372">B</text>
            <text x="78" y="317">C</text><text x="223" y="295">D</text>
            <text x="408" y="298">E</text><text x="463" y="360">F</text>
            <text x="434" y="390">G</text>
          </g>
        </g>
        <path d="M292 408 L283 417 L287 420 L290 416 L290 427 L295 427 L295 416 L298 420 L302 417 Z" fill="#161616" />
      </svg>
      {caption ? <figcaption className="px-1 pt-2 text-center text-xs font-medium text-slate-600">{caption}</figcaption> : null}
    </figure>
  )
}
