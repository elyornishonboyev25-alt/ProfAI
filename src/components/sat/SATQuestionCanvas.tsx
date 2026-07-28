import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { HighlightPoint, HighlightStroke, SATQuestion } from '@/features/sat/practiceTest4'

type Props = {
  question: SATQuestion
  strokes: HighlightStroke[]
  highlightEnabled: boolean
  highlightColor: string
  zoom: number
  onChange: (strokes: HighlightStroke[]) => void
}

function toPoint(event: ReactPointerEvent<SVGSVGElement>): HighlightPoint {
  const bounds = event.currentTarget.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(1000, ((event.clientX - bounds.left) / bounds.width) * 1000)),
    y: Math.max(0, Math.min(1000, ((event.clientY - bounds.top) / bounds.height) * 1000)),
  }
}

export default function SATQuestionCanvas({
  question,
  strokes,
  highlightEnabled,
  highlightColor,
  zoom,
  onChange,
}: Props) {
  const activeId = useRef<string | null>(null)
  const draftRef = useRef<HighlightStroke | null>(null)
  const [draft, setDraft] = useState<HighlightStroke | null>(null)
  const displayedStrokes = useMemo(() => (draft ? [...strokes, draft] : strokes), [draft, strokes])

  const startStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!highlightEnabled) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const next: HighlightStroke = {
      id: crypto.randomUUID(),
      color: highlightColor,
      width: 34,
      points: [toPoint(event)],
    }
    activeId.current = next.id
    draftRef.current = next
    setDraft(next)
  }

  const extendStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!highlightEnabled || !activeId.current) return
    const current = draftRef.current
    if (!current) return
    const next = { ...current, points: [...current.points, toPoint(event)] }
    draftRef.current = next
    setDraft(next)
  }

  const finishStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!activeId.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const completedStroke = draftRef.current
    if (completedStroke && completedStroke.points.length > 0) {
      onChange([...strokes, completedStroke])
    }
    activeId.current = null
    draftRef.current = null
    setDraft(null)
  }

  return (
    <div className="overflow-auto rounded-[1.6rem] border border-slate-200/80 bg-[#f7f8fb] p-3 shadow-inner sm:p-5">
      <div
        className="relative mx-auto origin-top transition-transform duration-200"
        style={{
          width: `${zoom * 100}%`,
          maxWidth: `${Math.max(760, question.assetWidth) * zoom}px`,
          aspectRatio: `${question.assetWidth} / ${question.assetHeight}`,
        }}
      >
        <img
          src={question.asset}
          alt={`Question ${question.number}`}
          draggable={false}
          className="h-full w-full select-none rounded-xl bg-white object-contain shadow-[0_12px_34px_rgba(15,23,42,0.08)]"
        />
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          aria-label={highlightEnabled ? 'Highlight drawing layer' : undefined}
          className={`absolute inset-0 h-full w-full touch-none rounded-xl ${
            highlightEnabled ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
          }`}
          onPointerDown={startStroke}
          onPointerMove={extendStroke}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        >
          {displayedStrokes.map((stroke) => (
            <polyline
              key={stroke.id}
              points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.38"
            />
          ))}
        </svg>
      </div>
    </div>
  )
}
