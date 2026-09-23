import { memo } from 'react'
import drawing from '../assets/ielts/race-village-paths.json'

// Exact original geometry and lettering expressed as native SVG paths.
// No <image>, external resource, font dependency or raster decoder is used.
const RaceVillageDiagram = memo(function RaceVillageDiagram({ caption }: { caption?: string }) {
  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
      <svg data-race-village role="img" aria-label="Map of Race Village: original buildings A to I, Bowen Road, Gregory Terrace, exits, finish line, shade tents, corporate catering and race village entry."
        viewBox={`0 0 ${drawing.width} ${drawing.height}`} width={drawing.width} height={drawing.height}
        className="mx-auto block h-auto w-full max-w-3xl rounded-lg bg-white" shapeRendering="crispEdges">
        <rect width={drawing.width} height={drawing.height} fill="white" />
        {drawing.paths.map(({ fill, d }) => <path key={fill} fill={fill} d={d} />)}
      </svg>
      {caption ? <figcaption className="px-1 pt-2 text-center text-xs font-medium text-slate-600">{caption}</figcaption> : null}
    </figure>
  )
})

export default RaceVillageDiagram
