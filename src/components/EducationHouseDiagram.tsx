import { memo, type ReactNode } from 'react'
import drawing from '../assets/ielts/education-house-paths.json'

// Pixel-exact paths from the original diagram; no image fetch or image decoder.
// Keep the drawing mounted when the audio clock or an answer changes.
export const EducationHouseDrawing = memo(function EducationHouseDrawing() {
  return (
    <svg role="img" aria-label="Education House: cooling tower, weather station, shower tower, tank, balcony and windows" viewBox={`0 0 ${drawing.width} ${drawing.height}`} width={drawing.width} height={drawing.height} className="block h-auto w-full" style={{ display: 'block', width: '100%', height: 'auto', background: 'white' }} shapeRendering="crispEdges" data-education-house>
      <rect width={drawing.width} height={drawing.height} fill="white" />
      {drawing.paths.map(({ fill, d }) => <path key={fill} fill={fill} d={d} />)}
    </svg>
  )
})

// Coordinates cover only the original dotted spaces, retaining numbers and arrows.
const spaces = [
  { number: 21, x: 350, y: 118, width: 72 },
  { number: 22, x: 572, y: 103, width: 72 },
  { number: 23, x: 718, y: 377, width: 72 },
  { number: 24, x: 655, y: 612, width: 72 },
  { number: 25, x: 145, y: 377, width: 65 },
  { number: 26, x: 143, y: 204, width: 65 },
]

export default function EducationHouseDiagram({ renderAnswer }: { renderAnswer: (number: number) => ReactNode }) {
  return (
    <figure className="my-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="overflow-x-auto overscroll-x-contain rounded-lg" tabIndex={0} aria-label="Education House diagram, questions 21 to 26. Scroll horizontally on small screens.">
        <div className="relative mx-auto w-full bg-white" style={{ minWidth: 680, maxWidth: 860, aspectRatio: '860 / 680' }}>
          <EducationHouseDrawing />
          {spaces.map(({ number, x, y, width }) => (
            <div key={number} data-diagram-answer={number} className="absolute" style={{ left: `${x / 860 * 100}%`, top: `${y / 680 * 100}%`, width: `${width / 860 * 100}%` }}>
              {renderAnswer(number)}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="pt-2 text-center text-xs text-slate-500 sm:hidden">Swipe sideways to see the full diagram.</figcaption>
    </figure>
  )
}
