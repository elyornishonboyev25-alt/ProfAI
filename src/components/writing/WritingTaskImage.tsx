import type { WritingTask } from '@/data/writingTestData'
import { useEffect, useId, useState } from 'react'
import MobilePhoneSalesChart from './MobilePhoneSalesChart'
import SpainVisitorAgeCharts from './SpainVisitorAgeCharts'

type Cover = { x: number; y: number; width: number; height: number; fill?: string }
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
  7: { width: 1825, height: 1200, covers: [{ x: 7, y: 1160, width: 387, height: 29, fill: '#4bb3d1' }] },
  8: { width: 555, height: 360, top: 28 },
  9: { width: 633, height: 317, top: 51 },
  10: { width: 843, height: 525, top: 56, covers: [{ x: 346, y: 479, width: 151, height: 24 }] },
  11: { width: 609, height: 430, top: 88 },
  13: { width: 562, height: 714, top: 39 },
  14: { width: 1428, height: 2000, top: 177, bottom: 149 },
  15: { width: 1439, height: 1229, top: 203, covers: [
    { x: 1047, y: 178, width: 281, height: 153 },
    { x: 611, y: 440, width: 233, height: 27 },
    { x: 613, y: 688, width: 207, height: 24 },
    { x: 45, y: 1179, width: 405, height: 31 },
  ] },
  16: { width: 658, height: 378, top: 78 },
  17: { width: 1023, height: 560, top: 98 },
}

// Match the asset as well as the catalog index: saved attempt snapshots can
// retain an older task ID/index while pointing at the same source image.
const IMPORTED_IMAGE_WINDOWS: Record<string, DisplayWindow> = {
  'ielts-telegram-16224-image-1.png': { width: 1346, height: 1168, top: 296, bottom: 62 },
  'ielts-telegram-16354-image-1.png': { width: 1536, height: 1024, top: 110 },
}

type Props = {
  task: WritingTask
  className?: string
}

export default function WritingTaskImage({ task, className = '' }: Props) {
  if (!task.imageUrl) return null
  if (task.imageUrl.split('?')[0].endsWith('/ielts-telegram-16329-image-1.png')) {
    return <MobilePhoneSalesChart className={className} />
  }
  if (task.imageUrl.split('?')[0].endsWith('/ielts-telegram-16539-image-2.jpg')) {
    return <SpainVisitorAgeCharts className={className} />
  }
  return <TaskImage key={`${task.id}:${task.imageUrl}`} task={task} className={className} />
}

function TaskImage({ task, className = '' }: Props) {
  const cleanupId = useId().replace(/:/g, '')
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
  const filename = originalUrl.split('?')[0].split('/').pop()!
  const sourceIndex = filename.match(/^full-writing-test-(\d+)-source\./)?.[1]
  const displayWindow = IMPORTED_IMAGE_WINDOWS[filename] ?? (sourceIndex ? SOURCE_IMAGE_WINDOWS[Number(sourceIndex)] : undefined)

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
        <rect key={index} fill="white" {...cover} />
      ))}
      {sourceIndex === '5' ? (
        <g aria-hidden="true">
          <rect x="378" y="106" width="11" height="53" fill="#d9d9d9" />
          <path d="M378 105h11v54" fill="none" stroke="#656565" strokeWidth="1" />
        </g>
      ) : null}
      {sourceIndex === '15' ? <g aria-hidden="true">
        {/* Restore the small frog/plant contours crossed by the source text. */}
        <svg x="611" y="440" width="233" height="27" viewBox="611 440 233 27" overflow="hidden">
          <path d="M649 435Q653 444 673 448L689 456Q710 464 732 458L746 450Q764 445 778 446L793 455L801 467H673L651 455Z" fill="#aaa" stroke="#222" strokeWidth="1.5" />
        </svg>
        <defs>
          <clipPath id={`${cleanupId}-frog-text`}><rect x="611" y="440" width="233" height="27" /></clipPath>
          <filter id={`${cleanupId}-remove-red`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" result="red" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2 -1 -1 0 0" />
            <feComponentTransfer in="red" result="red-mask"><feFuncA type="discrete" tableValues="0 1 1 1 1 1 1 1" /></feComponentTransfer>
            <feComposite in="SourceGraphic" in2="red-mask" operator="out" />
          </filter>
        </defs>
        {/* Retain the original grey/black artwork around and between the red
            letters; the contour beneath replaces only those coloured pixels. */}
        <image href={src} width={displayWindow.width} height={displayWindow.height}
          clipPath={`url(#${cleanupId}-frog-text)`} filter={`url(#${cleanupId}-remove-red)`} />
        <path d="M615 712Q624 703 627 688M622 704Q639 699 635 691M622 704Q616 697 617 690" fill="none" stroke="#888" strokeWidth="1.3" />
      </g> : null}
    </svg></>
  )
}
