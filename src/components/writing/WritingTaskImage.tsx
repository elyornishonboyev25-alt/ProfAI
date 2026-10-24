import type { WritingTask } from '@/data/writingTestData'
import { useEffect, useState } from 'react'

type Cover = { x: number; y: number; width: number; height: number }
type DisplayWindow = {
  width: number
  height: number
  top?: number
  bottom?: number
  covers?: Cover[]
}

// Display-only windows: the source files stay byte-for-byte intact. Covers are
// confined to repeated question text and source branding, never chart values.
const SOURCE_IMAGE_WINDOWS: Record<number, DisplayWindow> = {
  5: { width: 489, height: 585, top: 99, covers: [{ x: 378, y: 91, width: 111, height: 68 }] },
  6: { width: 1024, height: 663, covers: [
    { x: 105, y: 14, width: 625, height: 70 },
    { x: 25, y: 514, width: 210, height: 131 },
  ] },
  8: { width: 555, height: 360, top: 28 },
  9: { width: 633, height: 317, top: 51 },
  10: { width: 843, height: 525, top: 56 },
  11: { width: 609, height: 430, top: 88 },
  13: { width: 562, height: 714, top: 39 },
  14: { width: 1428, height: 2000, top: 177, bottom: 149 },
  15: { width: 1439, height: 1229, top: 203, covers: [{ x: 1047, y: 178, width: 281, height: 153 }] },
  16: { width: 658, height: 378, top: 78 },
  17: { width: 1023, height: 560, top: 98 },
}

type Props = {
  task: WritingTask
  className?: string
}

export default function WritingTaskImage({ task, className = '' }: Props) {
  if (!task.imageUrl) return null
  return <TaskImage key={`${task.id}:${task.imageUrl}`} task={task} className={className} />
}

function TaskImage({ task, className = '' }: Props) {
  const [retry, setRetry] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const originalUrl = task.imageUrl!
  const src = retry ? `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}retry=${retry}` : originalUrl
  useEffect(() => {
    if (status !== 'loading') return
    const timer = window.setTimeout(() => setStatus('failed'), 15_000)
    return () => window.clearTimeout(timer)
  }, [status, retry])
  const recovery = status === 'failed' ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    <p>The task image could not load. Your writing is saved.</p>
    <button type="button" onClick={() => { setStatus('loading'); setRetry(value => value + 1) }} className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-bold">Retry image</button>
  </div> : null

  const alt = task.imageAlt ?? `${task.title} Task 1 visual`
  const displayWindow = originalUrl.includes('-source.') && task.fullTestIndex !== null
    ? SOURCE_IMAGE_WINDOWS[task.fullTestIndex]
    : undefined

  if (!displayWindow) {
    return <>{recovery}<img key={src} src={src} alt={alt} className={className} draggable={false} decoding="async"
      onLoad={() => setStatus('ready')} onError={() => setStatus('failed')} /></>
  }

  const top = displayWindow.top ?? 0
  const visibleHeight = displayWindow.height - top - (displayWindow.bottom ?? 0)

  return (
    <>{recovery}<svg
      viewBox={`0 ${top} ${displayWindow.width} ${visibleHeight}`}
      width={displayWindow.width}
      height={visibleHeight}
      role="img"
      aria-label={alt}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <image key={src} href={src} x="0" y="0" width={displayWindow.width} height={displayWindow.height}
        onLoad={() => setStatus('ready')} onError={() => setStatus('failed')} />
      {displayWindow.covers?.map((cover, index) => (
        <rect key={index} {...cover} fill="white" />
      ))}
      {task.fullTestIndex === 5 ? (
        <g aria-hidden="true">
          <rect x="378" y="106" width="11" height="53" fill="#d9d9d9" />
          <path d="M378 105h11v54" fill="none" stroke="#656565" strokeWidth="1" />
        </g>
      ) : null}
    </svg></>
  )
}
