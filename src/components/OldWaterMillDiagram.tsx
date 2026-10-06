import { memo, type ReactNode } from 'react'
import drawing from '../assets/ielts/old-water-mill-paths.json'

// Source-coordinate paths preserve the supplied plan, texture and lettering.
// The displayed artwork never requests or decodes an image.
export const OldWaterMillDrawing = memo(function OldWaterMillDrawing() {
  return <svg data-old-water-mill role="img" aria-label="Old water-mill plan, Door and Water-wheel, locations 27 to 30. A lights; B fixed camera; C mirror; D torches; E wooden screen; F bike; G large box."
    viewBox={`0 0 ${drawing.width} ${drawing.height}`} width={drawing.width} height={drawing.height}
    className="block h-auto w-full" shapeRendering="crispEdges"
    style={{ pointerEvents: 'none', contain: 'paint', transform: 'translateZ(0)' }}>
    <rect width={drawing.width} height={drawing.height} fill="white" />
    {drawing.paths.map(({ fill, d }) => <path key={fill} fill={fill} d={d} />)}
  </svg>
})

const spaces = [
  { number: 27, x: 864, y: 126 },
  { number: 28, x: 743, y: 515 },
  { number: 29, x: 475, y: 250 },
  { number: 30, x: 425, y: 486 },
]

export default function OldWaterMillDiagram({ renderAnswer, caption }: { renderAnswer?: (number: number) => ReactNode; caption?: string }) {
  return <figure className="my-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
    <div className="overflow-x-auto overscroll-x-contain rounded-lg" tabIndex={0} aria-label="Old water-mill diagram, questions 27 to 30. Scroll horizontally on small screens.">
      <div className="relative mx-auto w-full bg-white" style={{ minWidth: 960, maxWidth: drawing.width, aspectRatio: `${drawing.width} / ${drawing.height}` }}>
        <OldWaterMillDrawing />
        {renderAnswer ? spaces.map(({ number, x, y }) => <div key={number} data-diagram-answer={number} className="absolute"
          style={{ left: `${x / drawing.width * 100}%`, top: `${y / drawing.height * 100}%`, width: `${96 / drawing.width * 100}%`, contain: 'layout style' }}>
          {renderAnswer(number)}
        </div>) : null}
      </div>
    </div>
    {caption ? <figcaption className="pt-2 text-center text-xs text-slate-500">{caption}</figcaption> : null}
    <p className="pt-2 text-center text-xs text-slate-500 sm:hidden">Swipe sideways to see the full diagram.</p>
  </figure>
}
