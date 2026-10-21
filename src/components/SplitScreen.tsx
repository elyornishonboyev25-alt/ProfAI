import { ReactNode, useEffect, useRef, useState } from 'react'
interface SplitScreenProps {
  left: ReactNode
  right: ReactNode
  leftWidth?: string
  className?: string
  fillHeight?: boolean
}
const clamp = (value: number) => Math.min(68, Math.max(32, value))
export default function SplitScreen({
  left,
  right,
  className = '',
}: SplitScreenProps) {
  const container = useRef<HTMLDivElement>(null)
  const percent = useRef(50)
  const [value, setValue] = useState(50)
  const [dragging, setDragging] = useState(false)
  const [mobilePane, setMobilePane] = useState<'passage' | 'questions'>(
    'passage',
  )
  useEffect(() => {
    const showQuestions = () => setMobilePane('questions')
    window.addEventListener('ielts:show-questions', showQuestions)
    return () =>
      window.removeEventListener('ielts:show-questions', showQuestions)
  }, [])
  const apply = (next: number) => {
    percent.current = clamp(next)
    container.current?.style.setProperty(
      '--split-percent',
      percent.current + '%',
    )
  }
  return (
    <div
      ref={container}
      className={'ielts-split ' + (dragging ? 'is-resizing ' : '') + className}
      data-mobile-pane={mobilePane}
    >
      <div
        className="ielts-split-tabs"
        role="tablist"
        aria-label="Reading view"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          const index = event.key === 'ArrowLeft' ? 0 : 1
          setMobilePane(index === 0 ? 'passage' : 'questions')
          event.currentTarget
            .querySelectorAll<HTMLButtonElement>('button')
            [index]?.focus()
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'passage'}
          aria-controls="ielts-passage-region"
          onClick={() => setMobilePane('passage')}
        >
          Passage
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'questions'}
          aria-controls="ielts-questions-region"
          onClick={() => setMobilePane('questions')}
        >
          Questions
        </button>
      </div>
      <div className="ielts-split-pane" id="ielts-passage-region">
        {left}
      </div>
      <div
        className="ielts-split-divider"
        role="separator"
        aria-label="Resize passage and questions"
        aria-orientation="vertical"
        aria-controls="ielts-passage-region ielts-questions-region"
        aria-valuemin={32}
        aria-valuemax={68}
        aria-valuenow={value}
        tabIndex={0}
        onDoubleClick={() => {
          apply(50)
          setValue(50)
        }}
        onKeyDown={(event) => {
          const next =
            event.key === 'ArrowLeft'
              ? percent.current - 2
              : event.key === 'ArrowRight'
                ? percent.current + 2
                : event.key === 'Home'
                  ? 32
                  : event.key === 'End'
                    ? 68
                    : null
          if (next === null) return
          event.preventDefault()
          apply(next)
          setValue(percent.current)
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          setDragging(true)
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          const rect = container.current?.getBoundingClientRect()
          if (rect?.width)
            apply(((event.clientX - rect.left) / rect.width) * 100)
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
          setDragging(false)
          setValue(percent.current)
        }}
        onLostPointerCapture={() => {
          setDragging(false)
          setValue(percent.current)
        }}
        title="Drag or use arrow keys to resize. Double-click to reset."
      >
        <span aria-hidden="true" />
      </div>
      <div className="ielts-split-pane" id="ielts-questions-region">
        {right}
      </div>
    </div>
  )
}
