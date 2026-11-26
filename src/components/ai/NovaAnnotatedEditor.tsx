import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { validWritingAnchors, type WritingAnchor } from '@/lib/novaStudy'
import { mapWritingAnchors } from '@/lib/novaWritingMapping'
import { useNovaStudySession } from '@/services/ai/novaStudySession'
import { useAuthStore } from '@/store/authStore'
import './nova-editor.css'

/** Native textarea keeps IME, selection, spellcheck policy and browser undo intact. */
export default function NovaAnnotatedEditor({ id, value, onChange, textareaRef, placeholder, describedBy, fontSize }: { id: string; value: string; onChange: (value: string) => void; textareaRef: RefObject<HTMLTextAreaElement>; placeholder: string; describedBy: string; fontSize: number }) {
  const overlay = useRef<HTMLDivElement>(null), reduced = useReducedMotion()
  const owner = useAuthStore(s => s.user?.id)
  const [batch, setBatch] = useState({ text: value, anchors: [] as WritingAnchor[] })
  const history = useRef(new Map<string, WritingAnchor[]>())
  const last = useRef(batch), currentValue = useRef(value)
  currentValue.current = value
  const pendingEdit = useRef<{ text: string; start: number; end: number; type: string } | null>(null)
  const [tip, setTip] = useState<{ anchor: WritingAnchor; x: number; y: number } | null>(null)
  useEffect(() => {
    history.current.clear(); last.current = { text: currentValue.current, anchors: [] }; setBatch(last.current); setTip(null)
  }, [owner, id])
  useEffect(() => {
    const editor = textareaRef.current
    if (!editor) return
    const remember = (event: InputEvent) => { pendingEdit.current = { text: editor.value, start: editor.selectionStart, end: editor.selectionEnd, type: event.inputType } }
    editor.addEventListener('beforeinput', remember)
    return () => editor.removeEventListener('beforeinput', remember)
  }, [textareaRef])
  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.text !== value) return
      const next = { text: value, anchors: validWritingAnchors(value, detail.anchors) }
      history.current.clear(); history.current.set(value, next.anchors); last.current = next; setBatch(next); setTip(null)
    }
    window.addEventListener('nova:writing-annotations', receive)
    return () => window.removeEventListener('nova:writing-annotations', receive)
  }, [value])
  useEffect(() => {
    const dismiss = () => setTip(null)
    window.addEventListener('scroll', dismiss, true); window.addEventListener('resize', dismiss)
    return () => { window.removeEventListener('scroll', dismiss, true); window.removeEventListener('resize', dismiss) }
  }, [])
  const anchors = useMemo(() => history.current.get(value) ?? mapWritingAnchors(last.current.text, value, last.current.anchors), [value, batch])
  // Exact snapshots restore annotations on native undo/redo, including invalidated spans.
  useLayoutEffect(() => {
    last.current = { text: value, anchors }; history.current.set(value, anchors)
    if (history.current.size > 80) history.current.delete(history.current.keys().next().value!)
    setTip(null)
  }, [value, anchors])
  const valid = [...anchors].sort((a, b) => a.start - b.start)
  const showTip = (anchor: WritingAnchor, rect: DOMRect) => setTip({ anchor, x: Math.max(12, Math.min(rect.left, window.innerWidth - 292)), y: Math.max(12, Math.min(rect.bottom + 9, window.innerHeight - 150)) })
  const point = (x: number, y: number) => {
    for (const mark of overlay.current?.querySelectorAll<HTMLElement>('[data-anchor-id]') ?? []) {
      if ([...mark.getClientRects()].some(rect => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)) {
        const anchor = valid.find(item => item.id === mark.dataset.anchorId)
        if (anchor) { showTip(anchor, mark.getBoundingClientRect()); return }
      }
    }
    setTip(null)
  }
  let end = 0
  const pieces = valid.flatMap(anchor => {
    if (anchor.start < end) return []
    const before = value.slice(end, anchor.start); end = anchor.end
    return [before, <motion.mark key={anchor.id} data-anchor-id={anchor.id} initial={reduced ? false : { opacity: .2 }} animate={{ opacity: 1 }} transition={{ duration: .22 }} className={`nova-editor-mark nova-editor-mark--${anchor.kind}`}>{anchor.quote}</motion.mark>]
  })
  return <div className="nova-annotated-editor" style={{ '--nova-editor-size': `${fontSize}px` } as CSSProperties}>
    <div aria-hidden="true" className="nova-editor-overlay" ref={overlay}>{pieces}{value.slice(end)}{'\n'}</div>
    <textarea id={id} ref={textareaRef} value={value}
      onChange={event => {
        const next = event.target.value, edit = pendingEdit.current; pendingEdit.current = null
        if (edit?.text === value && !edit.type.startsWith('history')) {
          if (edit.start === edit.end && next.length < value.length) {
            if (edit.type.toLowerCase().includes('backward')) edit.start -= value.length - next.length
            else edit.end += value.length - next.length
          }
          history.current.set(next, mapWritingAnchors(value, next, anchors, edit))
        }
        onChange(next); useNovaStudySession.setState({ draft: next })
      }}
      onPointerMove={event => point(event.clientX, event.clientY)} onPointerLeave={() => setTip(null)} onBlur={() => setTip(null)}
      onKeyUp={event => {
        if (event.key === 'Escape') { setTip(null); return }
        const anchor = valid.find(item => event.currentTarget.selectionStart >= item.start && event.currentTarget.selectionStart <= item.end)
        const mark = [...overlay.current?.querySelectorAll<HTMLElement>('[data-anchor-id]') ?? []].find(item => item.dataset.anchorId === anchor?.id)
        if (anchor && mark) showTip(anchor, mark.getBoundingClientRect()); else setTip(null)
      }}
      onScroll={event => { setTip(null); if (overlay.current) { overlay.current.scrollTop = event.currentTarget.scrollTop; overlay.current.scrollLeft = event.currentTarget.scrollLeft } }}
      placeholder={placeholder} aria-describedby={`${describedBy}${tip ? ` ${id}-annotation` : ''}`} spellCheck={false} autoCorrect="off" autoCapitalize="off"/>
    {createPortal(<AnimatePresence>{tip && <motion.div key={tip.anchor.id} id={`${id}-annotation`} role="tooltip" className="nova-annotation-tooltip" style={{ left: tip.x, top: tip.y }} initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .14 }}><strong>{tip.anchor.quote}</strong><p>{tip.anchor.message}</p>{tip.anchor.hint && <p className="nova-annotation-hint">{tip.anchor.hint}</p>}</motion.div>}</AnimatePresence>, document.body)}
  </div>
}
