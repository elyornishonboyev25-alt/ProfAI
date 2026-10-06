import { memo } from 'react'
import drawing from '@/assets/ielts/aluminium-recycling-paths.json'

// Source-coordinate vector paths retain the original artwork and lettering.
// No raster, image request, canvas, or image decoder is used for display.
export default memo(function AluminiumRecyclingDiagram() {
  return <svg viewBox={`0 0 ${drawing.width} ${drawing.height}`} className="h-auto w-full" role="img"
    aria-label="The recycling process of aluminium cans" data-supplied-writing-diagram="aluminium-recycling"
    shapeRendering="crispEdges">
    <title>The recycling process of aluminium cans</title>
    <desc>REUSING, 74% recycled (UK); used cans; COLLECTION; CLEANING, SORTING, SHREDDING AND COMPRESSING; HEATING AND MELTING; ROLLING, 2.5mm - 6mm thick; RECYCLING. Aluminium recycle. www.ielts-exam.net.</desc>
    <rect width={drawing.width} height={drawing.height} fill="white" />
    {drawing.paths.map(({ fill, d }) => <path key={fill} fill={fill} d={d} />)}
  </svg>
})
