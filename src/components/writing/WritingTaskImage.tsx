import type { WritingTask } from '@/data/writingTestData'

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

  const alt = task.imageAlt ?? `${task.title} Task 1 visual`
  const displayWindow = task.imageUrl.includes('-source.') && task.fullTestIndex !== null
    ? SOURCE_IMAGE_WINDOWS[task.fullTestIndex]
    : undefined

  if (!displayWindow) {
    return <img src={task.imageUrl} alt={alt} className={className} draggable={false} />
  }

  const top = displayWindow.top ?? 0
  const visibleHeight = displayWindow.height - top - (displayWindow.bottom ?? 0)

  return (
    <svg
      viewBox={`0 ${top} ${displayWindow.width} ${visibleHeight}`}
      width={displayWindow.width}
      height={visibleHeight}
      role="img"
      aria-label={alt}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <image href={task.imageUrl} x="0" y="0" width={displayWindow.width} height={displayWindow.height} />
      {displayWindow.covers?.map((cover, index) => (
        <rect key={index} {...cover} fill="white" />
      ))}
      {task.fullTestIndex === 5 ? (
        <g aria-hidden="true">
          <rect x="378" y="106" width="11" height="53" fill="#d9d9d9" />
          <path d="M378 105h11v54" fill="none" stroke="#656565" strokeWidth="1" />
        </g>
      ) : null}
    </svg>
  )
}
