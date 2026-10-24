import { ReactNode, useEffect, useRef, useState } from 'react'

interface SplitScreenProps {
  left: ReactNode
  right: ReactNode
  leftWidth?: string
  className?: string
  fillHeight?: boolean
}

const MIN_LEFT_PERCENT = 32
const MAX_LEFT_PERCENT = 68

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export default function SplitScreen({
  left,
  right,
  className = '',
  fillHeight = false,
}: SplitScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftPaneRef = useRef<HTMLDivElement>(null)
  const rightPaneRef = useRef<HTMLDivElement>(null)
  const livePercentRef = useRef(50)
  const [leftPercent, setLeftPercent] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isDesktop, setIsDesktop] = useState(
    typeof window === 'undefined' ? true : window.innerWidth >= 1024,
  )

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const applySplitPercent = (percent: number) => {
    if (!leftPaneRef.current || !rightPaneRef.current) return
    if (!isDesktop) {
      leftPaneRef.current.style.width = ''
      rightPaneRef.current.style.width = ''
      return
    }
    leftPaneRef.current.style.width = `calc(${percent}% - 6px)`
    rightPaneRef.current.style.width = `calc(${100 - percent}% - 6px)`
  }

  useEffect(() => {
    applySplitPercent(leftPercent)
  }, [isDesktop, leftPercent])

  useEffect(() => {
    if (!isDragging) return undefined

    let frame: number | undefined
    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      if (rect.width <= 0) return
      const nextPercent = ((event.clientX - rect.left) / rect.width) * 100
      livePercentRef.current = clamp(nextPercent, MIN_LEFT_PERCENT, MAX_LEFT_PERCENT)
      if (frame === undefined) frame = window.requestAnimationFrame(() => {
        applySplitPercent(livePercentRef.current)
        frame = undefined
      })
    }

    const handlePointerUp = () => {
      setLeftPercent(livePercentRef.current)
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    window.addEventListener('blur', handlePointerUp)
    const previousCursor = document.body.style.cursor
    const previousSelection = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('blur', handlePointerUp)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousSelection
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className={`ielts-split-view flex ${fillHeight ? 'h-full min-h-0' : 'h-[calc(100vh-64px)]'} flex-col overflow-hidden lg:flex-row ${className}`}
    >
      <div
        ref={leftPaneRef}
        className="ielts-split-pane min-h-0 min-w-0 h-1/2 overflow-hidden border-b border-red-100 bg-white lg:h-full lg:border-b-0"
      >
        {left}
      </div>

      <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-valuemin={MIN_LEFT_PERCENT}
          aria-valuemax={MAX_LEFT_PERCENT}
          aria-valuenow={Math.round(leftPercent)}
          aria-label="Resize split view"
          onPointerDown={(event) => {
            event.preventDefault()
            livePercentRef.current = leftPercent
            setIsDragging(true)
          }}
          onKeyDown={event => {
            const next = event.key === 'ArrowLeft' ? leftPercent - 2 : event.key === 'ArrowRight' ? leftPercent + 2 : event.key === 'Home' ? MIN_LEFT_PERCENT : event.key === 'End' ? MAX_LEFT_PERCENT : event.key === 'Enter' ? 50 : null
            if (next === null) return
            event.preventDefault()
            setLeftPercent(clamp(next, MIN_LEFT_PERCENT, MAX_LEFT_PERCENT))
          }}
          onDoubleClick={() => setLeftPercent(50)}
          className={`ielts-split-handle relative hidden w-3 shrink-0 cursor-col-resize touch-none items-center justify-center lg:flex ${isDragging ? 'is-dragging' : ''}`}
          title="Drag or use arrow keys to resize. Double-click to reset."
        >
          <span aria-hidden="true" />
      </div>

      <div
        ref={rightPaneRef}
        className="ielts-split-pane min-h-0 min-w-0 h-1/2 flex-1 overflow-hidden bg-white lg:h-full"
      >
        {right}
      </div>
    </div>
  )
}
