import { memo, type ReactNode } from 'react'
import drawing from '../assets/ielts/education-house-paths.json'

// Pixel-exact paths from the original diagram; no image fetch or image decoder.
// Keep the drawing mounted when the audio clock or an answer changes. Its own
// composited paint layer keeps caret/focus updates from repainting 61,078 pixel
// rectangles, and pointer-events:none excludes the artwork from input hit tests.
export const EducationHouseDrawing = memo(function EducationHouseDrawing() {
  return (
    <svg role="img" aria-label="Education House: cooling tower, weather station, shower tower, tank, balcony and windows" viewBox={`0 0 ${drawing.width} ${drawing.height}`} width={drawing.width} height={drawing.height} className="block h-auto w-full" style={{ display: 'block', width: '100%', height: 'auto', background: 'white', pointerEvents: 'none', contain: 'paint', transform: 'translateZ(0)', willChange: 'transform' }} shapeRendering="crispEdges" data-education-house>
      <rect width={drawing.width} height={drawing.height} fill="white" />
      {drawing.paths.map(({ fill, d }) => <path key={fill} fill={fill} d={d} />)}
    </svg>
  )
})

// Keep the artwork intact. The left-side controls sit just below their numbered
// spaces so all flags can use the same right-hand position without hiding arrows.
const spaces = [
  { number: 21, x: 350, y: 118 },
  { number: 22, x: 572, y: 103 },
  { number: 23, x: 718, y: 377 },
  { number: 24, x: 655, y: 612 },
  { number: 25, x: 106, y: 405 },
  { number: 26, x: 106, y: 232 },
]

export default function EducationHouseDiagram({ renderAnswer }: { renderAnswer: (number: number) => ReactNode }) {
  return (
    <figure className="my-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="overflow-x-auto overscroll-x-contain rounded-lg" tabIndex={0} aria-label="Education House diagram, questions 21 to 26. Scroll horizontally on small screens.">
        <div className="relative mx-auto w-full bg-white" style={{ minWidth: 680, maxWidth: 860, aspectRatio: '860 / 680' }}>
          <EducationHouseDrawing />
          {spaces.map(({ number, x, y }) => (
            <div key={number} data-diagram-answer={number} className="absolute" style={{ left: `${x / 860 * 100}%`, top: `${y / 680 * 100}%`, width: `${64 / 860 * 100}%`, contain: 'layout style' }}>
              {renderAnswer(number)}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="pt-2 text-center text-xs text-slate-500 sm:hidden">Swipe sideways to see the full diagram.</figcaption>
    </figure>
  )
}
