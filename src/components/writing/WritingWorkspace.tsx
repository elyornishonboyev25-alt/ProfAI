import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { ArrowLeft, Bookmark, Check, Clock3, Eye, EyeOff, GripVertical, Maximize2, Minimize2, Minus, Plus, PenLine } from 'lucide-react'
import { useFullscreen } from '@/hooks/useFullscreen'
import './writing-workspace.css'

type Task = { id: string; label: string; minutes: number; minimum: number; words: number; marked: boolean }
type Props = {
  title: string
  tasks: Task[]
  activeIndex: number
  onTaskChange?: (index: number) => void
  onExit: () => void
  onBookmark: () => void
  timed: boolean
  seconds: number
  prompt: ReactNode
  answer: string
  onAnswerChange: (value: string) => void
  textareaRef: RefObject<HTMLTextAreaElement>
  action: ReactNode
}

export default function WritingWorkspace({ title, tasks, activeIndex, onTaskChange, onExit, onBookmark, timed, seconds, prompt, answer, onAnswerChange, textareaRef, action }: Props) {
  const [fontSize, setFontSize] = useState(16)
  const [split, setSplit] = useState(50)
  const [mobilePanel, setMobilePanel] = useState<'question' | 'response'>('question')
  const [hideTime, setHideTime] = useState(false)
  const deskRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const id = useId()
  const task = tasks[activeIndex]
  const reached = task.words >= task.minimum
  const { isFullscreen, supported, toggle } = useFullscreen()
  useEffect(() => { setMobilePanel('question') }, [activeIndex])
  const changeTask = (index: number) => {
    onTaskChange?.(index)
    setMobilePanel('question')
  }

  return (
    <div className="writing-desk" style={{ '--writing-split': `${split}%` } as CSSProperties}>
      <header className="writing-desk-header">
        <div className="writing-desk-identity">
          <button type="button" className="writing-tool" onClick={onExit} aria-label="Save and exit Writing test" title="Save and exit"><ArrowLeft size={18} /></button>
          <div><p className="writing-desk-eyebrow">IELTS <span>/</span> Academic Writing</p><h1>{title}</h1></div>
        </div>
        <div className="writing-desk-header-actions">
          {timed ? <button type="button" className="writing-desk-clock" data-urgent={seconds <= 300} onClick={() => setHideTime(value => !value)} aria-label={hideTime ? 'Show remaining time' : 'Hide remaining time'} title={hideTime ? 'Show remaining time' : 'Hide remaining time'}>
            <Clock3 size={17} /><span>{hideTime ? 'Show time' : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`}</span>{hideTime ? <EyeOff size={14} /> : <Eye size={14} />}
          </button> : <span className="writing-practice-badge"><span />Practice mode</span>}
          <button type="button" className="writing-tool" aria-label={`Mark ${task.label} for review`} aria-pressed={task.marked} onClick={onBookmark} title="Mark for review"><Bookmark size={18} fill={task.marked ? 'currentColor' : 'none'} /></button>
        </div>
      </header>

      <nav className="writing-desk-tasks" aria-label="Writing tasks">
        {tasks.map((item, index) => <button key={item.id} type="button" aria-current={index === activeIndex ? 'step' : undefined} onClick={() => changeTask(index)} className="writing-desk-task">
          <span className="writing-task-number">{item.words >= item.minimum ? <Check size={16} /> : item.label.replace('Task ', '')}</span>
          <span className="writing-task-detail"><strong>{item.label}</strong><span>{item.minutes} minutes suggested <span aria-hidden="true">·</span> {item.minimum}+ words</span></span>
          <span className="writing-task-count">{item.marked && <Bookmark size={13} fill="currentColor" aria-label="Marked for review" />}<strong>{item.words}</strong><span>words</span></span>
        </button>)}
      </nav>

      <div className="writing-mobile-panels" role="group" aria-label="Writing view">
        <button type="button" aria-pressed={mobilePanel === 'question'} aria-controls={`${id}-question`} onClick={() => setMobilePanel('question')}>Question</button>
        <button type="button" aria-pressed={mobilePanel === 'response'} aria-controls={`${id}-response`} onClick={() => { setMobilePanel('response'); requestAnimationFrame(() => textareaRef.current?.focus()) }}>Your response <span>{task.words}</span></button>
      </div>

      <div className="writing-desk-body" ref={deskRef} data-mobile-panel={mobilePanel}>
        <section id={`${id}-question`} className="writing-question-pane" aria-label={`${task.label} question`}>
          <div className="writing-pane-heading"><span className="writing-desk-eyebrow">{task.label} <span>/</span> Question</span><span className="writing-time-guidance"><Clock3 size={13} />About {task.minutes} minutes</span></div>
          {prompt}
        </section>
        <div className="writing-desk-divider" role="separator" aria-label="Resize question and response panels" aria-orientation="vertical" aria-valuemin={35} aria-valuemax={65} aria-valuenow={split} tabIndex={0}
          onDoubleClick={() => setSplit(50)}
          onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) { event.preventDefault(); setSplit(value => event.key === 'Home' ? 50 : Math.min(65, Math.max(35, value + (event.key === 'ArrowLeft' ? -2 : 2)))) } }}
          onPointerDown={event => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId) }}
          onPointerMove={event => { if (!dragging.current || !deskRef.current) return; const rect = deskRef.current.getBoundingClientRect(); setSplit(Math.round(Math.min(65, Math.max(35, (event.clientX - rect.left) / rect.width * 100)))) }}
          onPointerUp={() => { dragging.current = false }} onPointerCancel={() => { dragging.current = false }} onLostPointerCapture={() => { dragging.current = false }}
          title="Drag to resize. Use arrow keys or double-click to reset."><GripVertical size={14} /></div>
        <section id={`${id}-response`} className="writing-response-pane" aria-label={`${task.label} response`}>
          <div className="writing-response-toolbar"><label htmlFor={`${id}-answer`}><PenLine size={16} />Your response <span>{task.label}</span></label>
            <div className="writing-font-controls" role="group" aria-label="Response text size"><button type="button" disabled={fontSize <= 14} aria-label="Decrease response text size" onClick={() => setFontSize(value => Math.max(14, value - 2))}><Minus size={14} /></button><span>{fontSize}</span><button type="button" disabled={fontSize >= 22} aria-label="Increase response text size" onClick={() => setFontSize(value => Math.min(22, value + 2))}><Plus size={14} /></button></div>
          </div>
          <textarea id={`${id}-answer`} ref={textareaRef} value={answer} onChange={event => onAnswerChange(event.target.value)} placeholder={`Write your ${task.label} response here…`} aria-describedby={`${id}-minimum`} spellCheck={false} autoCorrect="off" autoCapitalize="off" style={{ fontSize }} />
          <div className="writing-response-status"><span id={`${id}-minimum`}>Write at least <strong>{task.minimum} words</strong></span><span className="writing-word-total" data-reached={reached}>{reached && <Check size={14} />}<strong>{task.words}</strong> words</span></div>
          <div className="writing-word-progress" role="progressbar" aria-label={`${task.label} minimum word count`} aria-valuemin={0} aria-valuemax={task.minimum} aria-valuenow={Math.min(task.words, task.minimum)}><span style={{ width: `${Math.min(100, task.words / task.minimum * 100)}%` }} data-reached={reached} /></div>
        </section>
      </div>

      <footer className="writing-desk-footer">
        <span className="writing-save-note"><span />Responses save automatically</span>
        <div className="writing-desk-footer-actions">
          {activeIndex > 0 && <button type="button" className="writing-previous" onClick={() => changeTask(activeIndex - 1)}><ArrowLeft size={15} /><span>Task {activeIndex}</span></button>}
          {supported && <button type="button" className="writing-tool writing-fullscreen" aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} aria-pressed={isFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggle}>{isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>}
          {action}
        </div>
      </footer>
    </div>
  )
}
