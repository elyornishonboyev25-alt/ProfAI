import { lazy, memo, Suspense } from 'react'

type Drawing = { width: number; height: number; paths: { fill: string; d: string }[] }

// Preserve source lettering, compass, people, walls and geometry as native SVG
// paths. Load only the requested drawing; timer ticks never rebuild its paths.
function drawingComponent(load: () => Promise<{ default: Drawing }>) {
  return lazy(async () => {
    const { default: drawing } = await load()
    return { default: memo(function Drawing({ alt }: { alt: string }) {
      return <svg className="source-map-image" data-annotation-ignore="true" viewBox={`0 0 ${drawing.width} ${drawing.height}`}
        width={drawing.width} height={drawing.height} role="img" aria-label={alt} shapeRendering="crispEdges">
        <rect width={drawing.width} height={drawing.height} fill="white" />
        {drawing.paths.map(({ fill, d }) => <path key={fill} fill={fill} d={d} />)}
      </svg>
    }) }
  })
}

const BritishLibrary = drawingComponent(() => import('@/assets/ielts/british-library-paths.json'))
const CommunityCentre = drawingComponent(() => import('@/assets/ielts/community-centre-paths.json'))

export default memo(function SourceMapDrawing({ id, alt }: { id: string; alt: string }) {
  const Map = id === 'british-library' ? BritishLibrary : CommunityCentre
  return <Suspense fallback={<div className="source-map-loading" role="status" aria-label="Loading map" />}><Map alt={alt} /></Suspense>
})
