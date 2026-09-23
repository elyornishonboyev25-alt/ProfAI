import { useState } from 'react'
import educationHouse from '../assets/ielts/listening-test14-education-house.jpg?inline'
import raceVillage from '../assets/ielts/listening-test15-race-village.png?inline'

const educationHousePath = '/images/ielts-listening-test14-education-house.jpg'
const educationHouseFallback = `${educationHousePath}?v=b8c6e7afb349e77f`
const diagrams = [
  { image: educationHouse, path: educationHousePath, fallback: educationHouseFallback, width: 860, height: 680 },
  { image: raceVillage, path: '/images/ielts-listening-test15-race-village.png', fallback: '/images/ielts-listening-test15-race-village.png?v=09c1b75795771525', width: 411, height: 315 },
]

interface Props {
  src: string
  alt: string
  caption?: string
}

function findDiagram(src: string) {
  const embedded = diagrams.find(diagram => diagram.image === src)
  if (embedded) return embedded
  try {
    // Results/history may retain the public URL from an older test snapshot.
    const path = new URL(src, 'https://www.profai.uz').pathname
    return diagrams.find(diagram => diagram.path === path)
  } catch {
    return undefined
  }
}

function DiagramImage({ src, alt, caption }: Props) {
  const knownDiagram = findDiagram(src)
  const sources = knownDiagram ? [knownDiagram.image, knownDiagram.fallback] : [src]
  const [sourceIndex, setSourceIndex] = useState(0)
  const [retry, setRetry] = useState(0)
  const failed = sourceIndex >= sources.length
  const currentSource = sources[sourceIndex]
  const imageSource = retry && currentSource && !currentSource.startsWith('data:')
    ? `${currentSource}${currentSource.includes('?') ? '&' : '?'}retry=${retry}`
    : currentSource

  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="mx-auto w-full max-w-3xl" style={knownDiagram ? { aspectRatio: `${knownDiagram.width} / ${knownDiagram.height}` } : undefined}>
        {failed ? (
          <div role="status" className="flex min-h-40 h-full flex-col items-center justify-center gap-3 rounded-lg bg-white p-4 text-center text-sm text-slate-700">
            <p>The diagram could not load.</p>
            <button type="button" className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50" onClick={() => {
              setRetry(Date.now())
              setSourceIndex(0)
            }}>Retry diagram</button>
          </div>
        ) : (
          <img
            key={`${sourceIndex}-${retry}`}
            src={imageSource}
            alt={alt}
            width={knownDiagram?.width}
            height={knownDiagram?.height}
            loading="eager"
            className="mx-auto h-auto w-full max-w-3xl rounded-lg bg-white"
            onError={() => setSourceIndex(index => index === sourceIndex ? index + 1 : index)}
          />
        )}
      </div>
      {caption ? <figcaption className="px-1 pt-2 text-center text-xs font-medium text-slate-600">{caption}</figcaption> : null}
    </figure>
  )
}

export default function ListeningDiagram(props: Props) {
  // Reset recovery when a different diagram is displayed, not on every timer tick.
  return <DiagramImage key={findDiagram(props.src)?.path ?? props.src} {...props} />
}
