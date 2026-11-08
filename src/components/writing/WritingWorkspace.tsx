import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
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
  const { c: uiCopy } = useCopy()
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
          <button type="button" className="writing-tool" onClick={onExit} aria-label={uiCopy("Save and exit Writing test")} title={uiCopy("Save and exit")}><ArrowLeft size={18} /></button>
          <div><p className="writing-desk-eyebrow">IELTS <span>/</span> <UiText text={"Academic Writing"} /></p><h1>{title}</h1></div>
        </div>
        <div className="writing-desk-header-actions">
          {timed ? <button type="button" className="writing-desk-clock" data-urgent={seconds <= 300} onClick={() => setHideTime(value => !value)} aria-label={hideTime ? uiCopy("Show remaining time") : uiCopy("Hide remaining time")} title={hideTime ? uiCopy("Show remaining time") : uiCopy("Hide remaining time")}>
            <Clock3 size={17} /><span>{hideTime ? <UiText text={"Show time"} /> : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`}</span>{hideTime ? <EyeOff size={14} /> : <Eye size={14} />}
          </button> : <span className="writing-practice-badge"><span /><UiText text={"Practice mode"} /></span>}
          <button type="button" className="writing-tool" aria-label={uiCopy("Mark {{value1}} for review", { value1: String(task.label) })} aria-pressed={task.marked} onClick={onBookmark} title={uiCopy("Mark for review")}><Bookmark size={18} fill={task.marked ? 'currentColor' : 'none'} /></button>
        </div>
      </header>

      <nav className="writing-desk-tasks" aria-label={uiCopy("Writing tasks")}>
        {tasks.map((item, index) => <button key={item.id} type="button" aria-current={index === activeIndex ? 'step' : undefined} onClick={() => changeTask(index)} className="writing-desk-task">
          <span className="writing-task-number">{item.words >= item.minimum ? <Check size={16} /> : item.label.replace('Task ', '')}</span>
          <span className="writing-task-detail"><strong><UiText text={item.label} /></strong><span>{item.minutes} <UiText text={"minutes suggested"} /> <span aria-hidden="true">·</span> {item.minimum}<UiText text={"+ words"} /></span></span>
          <span className="writing-task-count">{item.marked && <Bookmark size={13} fill="currentColor" aria-label={uiCopy("Marked for review")} />}<strong>{item.words}</strong><span><UiText text={"words"} /></span></span>
        </button>)}
      </nav>

      <div className="writing-mobile-panels" role="group" aria-label={uiCopy("Writing view")}>
        <button type="button" aria-pressed={mobilePanel === 'question'} aria-controls={`${id}-question`} onClick={() => setMobilePanel('question')}><UiText text={"Question"} /></button>
        <button type="button" aria-pressed={mobilePanel === 'response'} aria-controls={`${id}-response`} onClick={() => { setMobilePanel('response'); requestAnimationFrame(() => textareaRef.current?.focus()) }}><UiText text={"Your response"} /> <span>{task.words}</span></button>
      </div>

      <div className="writing-desk-body" ref={deskRef} data-mobile-panel={mobilePanel}>
        <section id={`${id}-question`} className="writing-question-pane" aria-label={uiCopy("{{value1}} question", { value1: String(task.label) })}>
          <div className="writing-pane-heading"><span className="writing-desk-eyebrow"><UiText text={task.label} /> <span>/</span> <UiText text={"Question"} /></span><span className="writing-time-guidance"><Clock3 size={13} /><UiText text={"About"} /> {task.minutes} <UiText text={"minutes"} /></span></div>
          {prompt}
        </section>
        <div className="writing-desk-divider" role="separator" aria-label={uiCopy("Resize question and response panels")} aria-orientation="vertical" aria-valuemin={35} aria-valuemax={65} aria-valuenow={split} tabIndex={0}
          onDoubleClick={() => setSplit(50)}
          onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) { event.preventDefault(); setSplit(value => event.key === 'Home' ? 50 : Math.min(65, Math.max(35, value + (event.key === 'ArrowLeft' ? -2 : 2)))) } }}
          onPointerDown={event => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId) }}
          onPointerMove={event => { if (!dragging.current || !deskRef.current) return; const rect = deskRef.current.getBoundingClientRect(); setSplit(Math.round(Math.min(65, Math.max(35, (event.clientX - rect.left) / rect.width * 100)))) }}
          onPointerUp={() => { dragging.current = false }} onPointerCancel={() => { dragging.current = false }} onLostPointerCapture={() => { dragging.current = false }}
          title={uiCopy("Drag to resize. Use arrow keys or double-click to reset.")}><GripVertical size={14} /></div>
        <section id={`${id}-response`} className="writing-response-pane" aria-label={uiCopy("{{value1}} response", { value1: String(task.label) })}>
          <div className="writing-response-toolbar"><label htmlFor={`${id}-answer`}><span className="writing-editor-icon"><PenLine size={17} /></span><span className="writing-editor-title"><UiText text={"Your response"} /><small><UiText text={task.label} /> <UiText text={"answer"} /></small></span></label>
            <div className="writing-font-controls" role="group" aria-label={uiCopy("Response text size")}><button type="button" disabled={fontSize <= 14} aria-label={uiCopy("Decrease response text size")} onClick={() => setFontSize(value => Math.max(14, value - 2))}><Minus size={14} /></button><span>{fontSize}</span><button type="button" disabled={fontSize >= 22} aria-label={uiCopy("Increase response text size")} onClick={() => setFontSize(value => Math.min(22, value + 2))}><Plus size={14} /></button></div>
          </div>
          <textarea id={`${id}-answer`} ref={textareaRef} value={answer} onChange={event => onAnswerChange(event.target.value)} placeholder={uiCopy("Start writing your {{value1}} response…", { value1: String(task.label) })} aria-describedby={`${id}-minimum`} spellCheck={false} autoCorrect="off" autoCapitalize="off" style={{ fontSize }} />
          <div className="writing-response-status"><span id={`${id}-minimum`}><UiText text={"Write at least"} /> <strong>{task.minimum} <UiText text={"words"} /></strong></span><span className="writing-word-total" data-reached={reached}>{reached && <Check size={14} />}<strong>{task.words}</strong> <UiText text={"words"} /></span></div>
          <div className="writing-word-progress" role="progressbar" aria-label={uiCopy("{{value1}} minimum word count", { value1: String(task.label) })} aria-valuemin={0} aria-valuemax={task.minimum} aria-valuenow={Math.min(task.words, task.minimum)}><span style={{ width: `${Math.min(100, task.words / task.minimum * 100)}%` }} data-reached={reached} /></div>
        </section>
      </div>

      <footer className="writing-desk-footer">
        <span className="writing-save-note"><span /><UiText text={"Responses save automatically"} /></span>
        <div className="writing-desk-footer-actions">
          {activeIndex > 0 && <button type="button" className="writing-previous" onClick={() => changeTask(activeIndex - 1)}><ArrowLeft size={15} /><span><UiText text={"Task"} /> {activeIndex}</span></button>}
          {supported && <button type="button" className="writing-tool writing-fullscreen" aria-label={isFullscreen ? uiCopy("Exit fullscreen") : uiCopy("Fullscreen")} aria-pressed={isFullscreen} title={isFullscreen ? uiCopy("Exit fullscreen") : uiCopy("Fullscreen")} onClick={toggle}>{isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>}
          {action}
        </div>
      </footer>
    </div>
  )
}
