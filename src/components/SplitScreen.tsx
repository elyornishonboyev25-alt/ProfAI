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

    const handleMouseMove = (event: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      if (rect.width <= 0) return
      const nextPercent = ((event.clientX - rect.left) / rect.width) * 100
      livePercentRef.current = clamp(nextPercent, MIN_LEFT_PERCENT, MAX_LEFT_PERCENT)
      applySplitPercent(livePercentRef.current)
    }

    const handleMouseUp = () => {
      setLeftPercent(livePercentRef.current)
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className={`flex ${fillHeight ? 'h-full min-h-0' : 'h-[calc(100vh-64px)]'} flex-col overflow-hidden lg:flex-row ${className}`}
    >
      <div
        ref={leftPaneRef}
        className="h-1/2 overflow-y-auto border-b border-red-100 bg-white lg:h-full lg:border-b-0"
      >
        {left}
      </div>

      <div className="relative hidden w-2 cursor-col-resize items-center justify-center bg-gradient-to-b from-red-50/45 via-white to-red-50/45 lg:flex">
        <div className="h-full w-px bg-red-200/80" />
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          className={`absolute left-1/2 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-200 bg-white shadow-[0_10px_18px_rgba(220,38,38,0.18)] transition ${
            isDragging ? 'scale-105 border-red-400 shadow-[0_14px_22px_rgba(220,38,38,0.24)]' : 'hover:scale-105 hover:border-red-300'
          }`}
          aria-label="Resize split view"
          title="Drag to resize"
        >
          <span className="text-[11px] font-black text-slate-500">&lt;&gt;</span>
        </button>
      </div>

      <div
        ref={rightPaneRef}
        className="h-1/2 flex-1 overflow-y-auto bg-white lg:h-full"
      >
        {right}
      </div>
    </div>
  )
}
