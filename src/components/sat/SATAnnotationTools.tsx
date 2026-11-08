import { useEffect, useRef } from 'react'
import { Highlighter, Trash2, Undo2, X } from 'lucide-react'
import type { HighlightStroke } from '@/features/sat/practiceTest4'

/** Selection stays native: it works with a mouse, keyboard and mobile selection handles. */
export default function SATAnnotationTools({ strokes, onChange }: {
  strokes: HighlightStroke[]
  onChange: (strokes: HighlightStroke[]) => void
}) {
  const details = useRef<HTMLDetailsElement>(null)
  const saved = strokes.filter(stroke => stroke.textRange)
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !details.current?.open) return
      details.current.open = false
      details.current.querySelector('summary')?.focus()
    }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !details.current?.contains(event.target) && details.current) details.current.open = false
    }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', outside) }
  }, [])
  return <details ref={details} data-sat-highlight-tools className="sat-annotation-tools">
    <summary aria-label="Highlights" title="Highlight text and manage saved highlights">
      <Highlighter size={20} aria-hidden="true" /><span>Highlights</span>
      {saved.length > 0 && <small>{saved.length}</small>}
    </summary>
    <div className="sat-annotation-panel">
      <header><strong>Text highlights</strong><button type="button" aria-label="Close highlights" onClick={() => {
        if (details.current) { details.current.open = false; details.current.querySelector('summary')?.focus() }
      }}><X size={18} /></button></header>
      <p>Select text in the passage, question or an answer choice. Choose a color from the toolbar that appears.</p>
      <p className="sat-annotation-hint">On a phone, touch and hold a word, then drag the selection handles. Your highlights save with this question.</p>
      <div className="sat-annotation-actions">
        <button type="button" disabled={!strokes.length} onClick={() => onChange(strokes.slice(0, -1))}><Undo2 size={16} />Undo</button>
        <button type="button" disabled={!strokes.length} onClick={() => onChange([])}><Trash2 size={16} />Clear all</button>
      </div>
      {saved.length > 0 && <ul aria-label="Saved highlights">{saved.map(stroke => <li key={stroke.id}>
        <span style={{ background: stroke.color }} aria-hidden="true" />
        <q>{stroke.textRange!.text}</q>
        <button type="button" aria-label={`Remove highlight: ${stroke.textRange!.text}`} onClick={() => onChange(strokes.filter(item => item.id !== stroke.id))}><Trash2 size={16} /></button>
      </li>)}</ul>}
    </div>
  </details>
}
