import { useState } from 'react'
import educationHouse from '../assets/ielts/listening-test14-education-house.jpg?inline'

const educationHousePath = '/images/ielts-listening-test14-education-house.jpg'
const educationHouseFallback = `${educationHousePath}?v=b8c6e7afb349e77f`

interface Props {
  src: string
  alt: string
  caption?: string
}

function isEducationHouse(src: string) {
  if (src === educationHouse) return true
  try {
    // Results/history may retain the public URL from an older test snapshot.
    return new URL(src, 'https://www.profai.uz').pathname === educationHousePath
  } catch {
    return false
  }
}

function DiagramImage({ src, alt, caption }: Props) {
  const knownDiagram = isEducationHouse(src)
  const sources = knownDiagram ? [educationHouse, educationHouseFallback] : [src]
  const [sourceIndex, setSourceIndex] = useState(0)
  const [retry, setRetry] = useState(0)
  const failed = sourceIndex >= sources.length
  const currentSource = sources[sourceIndex]
  const imageSource = retry && currentSource && !currentSource.startsWith('data:')
    ? `${currentSource}${currentSource.includes('?') ? '&' : '?'}retry=${retry}`
    : currentSource

  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="mx-auto w-full max-w-3xl" style={knownDiagram ? { aspectRatio: '860 / 680' } : undefined}>
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
            width={knownDiagram ? 860 : undefined}
            height={knownDiagram ? 680 : undefined}
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
  return <DiagramImage key={isEducationHouse(props.src) ? 'education-house' : props.src} {...props} />
}
