import { validWritingAnchors, type WritingAnchor } from '@/lib/novaStudy'

export default function NovaWritingAnnotations({ text, anchors, onFocus }: { text: string; anchors: WritingAnchor[]; onFocus?: (start: number, end: number) => void }) {
  const valid = validWritingAnchors(text, anchors).sort((a, b) => a.start - b.start)
  let offset = 0
  const pieces = valid.flatMap(anchor => {
    if (anchor.start < offset) return []
    const before = text.slice(offset, anchor.start); offset = anchor.end
    return [before, <button key={anchor.id} type="button" className={`nova-writing-span nova-writing-span--${anchor.kind}`} title={`${anchor.message} ${anchor.hint}`} onClick={() => onFocus?.(anchor.start, anchor.end)}>{anchor.quote}</button>]
  })
  return <div className="nova-writing-preview" aria-label="Writing annotations"><p>{pieces}{text.slice(offset)}</p>{valid.map(anchor => <div key={anchor.id}><button type="button" onClick={() => onFocus?.(anchor.start, anchor.end)}><strong>{anchor.kind}</strong>: {anchor.quote}</button><p>{anchor.message}</p>{anchor.hint && <p>{anchor.hint}</p>}</div>)}</div>
}
