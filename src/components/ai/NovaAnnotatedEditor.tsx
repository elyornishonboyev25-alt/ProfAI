import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { validWritingAnchors, type WritingAnchor } from '@/lib/novaStudy'
import { useNovaStudySession } from '@/services/ai/novaStudySession'

/** A matching text layer supplies real decoration; the native textarea retains IME/undo. */
export default function NovaAnnotatedEditor({ id, value, onChange, textareaRef, placeholder, describedBy, fontSize }: { id: string; value: string; onChange: (value: string) => void; textareaRef: RefObject<HTMLTextAreaElement>; placeholder: string; describedBy: string; fontSize: number }) {
  const overlay = useRef<HTMLDivElement>(null)
  const [anchors, setAnchors] = useState<WritingAnchor[]>([])
  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.text === value) setAnchors(validWritingAnchors(value, detail.anchors))
    }
    window.addEventListener('nova:writing-annotations', receive)
    return () => window.removeEventListener('nova:writing-annotations', receive)
  }, [value])
  const valid = validWritingAnchors(value, anchors).sort((a, b) => a.start - b.start)
  let end = 0
  const pieces = valid.flatMap(anchor => {
    if (anchor.start < end) return []
    const before = value.slice(end, anchor.start); end = anchor.end
    return [before, <mark key={anchor.id} className={`nova-editor-mark nova-editor-mark--${anchor.kind}`} title={anchor.message}>{anchor.quote}</mark>]
  })
  return <div className="nova-annotated-editor" style={{ '--nova-editor-size': `${fontSize}px` } as CSSProperties}>
    <div aria-hidden="true" className="nova-editor-overlay" ref={overlay}>{pieces}{value.slice(end)}{'\n'}</div>
    <textarea id={id} ref={textareaRef} value={value} onChange={event => { onChange(event.target.value); useNovaStudySession.setState({ draft: event.target.value }) }} onScroll={event => { if (overlay.current) { overlay.current.scrollTop = event.currentTarget.scrollTop; overlay.current.scrollLeft = event.currentTarget.scrollLeft } }} placeholder={placeholder} aria-describedby={describedBy} spellCheck={false} autoCorrect="off" autoCapitalize="off"/>
  </div>
}
