import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Highlighter, Trash2 } from 'lucide-react'
import type { HighlightStroke } from '@/features/sat/practiceTest4'

const COLORS = [
  { name: 'amber', color: 'rgba(251,191,36,0.45)', ink: '#f59e0b' },
  { name: 'emerald', color: 'rgba(52,211,153,0.40)', ink: '#10b981' },
  { name: 'sky', color: 'rgba(56,189,248,0.40)', ink: '#0ea5e9' },
  { name: 'pink', color: 'rgba(244,114,182,0.40)', ink: '#ec4899' },
]
type Segment = NonNullable<HighlightStroke['textRange']>
type Menu = { x: number; y: number; segments?: Segment[]; id?: string }
type Rectangle = { id: string; color: string; left: number; top: number; width: number; height: number }

/** Offsets refer to text nodes, so formatting and repeated words retain their exact positions. */
export function rangeForHighlight(block: HTMLElement, segment: Segment): Range | null {
  const walker = document.createTreeWalker(block, window.NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let offset = 0
  let started = false
  while (walker.nextNode()) {
    const node = walker.currentNode
    const length = node.textContent?.length ?? 0
    if (!started && segment.start < offset + length) {
      range.setStart(node, segment.start - offset)
      started = true
    }
    if (started && segment.end <= offset + length) {
      range.setEnd(node, segment.end - offset)
      return range.toString() === segment.text ? range : null
    }
    offset += length
  }
  return null
}

export default function SATTextHighlights({ children, strokes, onChange, enabled = true }: {
  children: ReactNode; strokes: HighlightStroke[]; onChange?: (strokes: HighlightStroke[]) => void; enabled?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<Menu | null>(null)
  const [rectangles, setRectangles] = useState<Rectangle[]>([])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const bounds = root.getBoundingClientRect()
      const scaleX = bounds.width / root.offsetWidth || 1
      const scaleY = bounds.height / root.offsetHeight || 1
      const next: Rectangle[] = []
      for (const stroke of strokes) {
        if (!stroke.textRange) continue
        const block = Array.from(root.querySelectorAll<HTMLElement>('[data-sat-highlight-block]'))
          .find(el => el.dataset.satHighlightBlock === stroke.textRange?.block)
        const range = block && rangeForHighlight(block, stroke.textRange)
        if (!range) continue
        for (const rect of Array.from(range.getClientRects())) {
          if (!rect.width || !rect.height) continue
          const box = { id: stroke.id, color: stroke.color,
            left: (rect.left - bounds.left) / scaleX, top: (rect.top - bounds.top) / scaleY,
            width: rect.width / scaleX, height: rect.height / scaleY }
          // Ranges across inline formatting can report both an element and its text.
          if (!next.some(existing => existing.id === box.id && existing.left === box.left &&
            existing.top === box.top && existing.width === box.width && existing.height === box.height)) next.push(box)
        }
      }
      setRectangles(next)
    }
    measure()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(root)
    root.addEventListener('load', measure, true)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); root.removeEventListener('load', measure, true); window.removeEventListener('resize', measure) }
  }, [children, strokes])

  useLayoutEffect(() => {
    if (!enabled || !onChange) return
    let timeout = 0
    const capture = () => {
      const selection = window.getSelection()
      const root = rootRef.current
      if (!root || !selection?.rangeCount || selection.isCollapsed) { setMenu(null); return }
      const range = selection.getRangeAt(0)
      if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) { setMenu(null); return }
      const segments: Segment[] = []
      for (const block of root.querySelectorAll<HTMLElement>('[data-sat-highlight-block]')) {
        if (!range.intersectsNode(block)) continue
        const clip = range.cloneRange()
        if (!block.contains(range.startContainer)) clip.setStart(block, 0)
        if (!block.contains(range.endContainer)) clip.setEnd(block, block.childNodes.length)
        const text = clip.toString()
        if (!text.trim()) continue
        const prefix = document.createRange()
        prefix.selectNodeContents(block)
        prefix.setEnd(clip.startContainer, clip.startOffset)
        const start = prefix.toString().length
        segments.push({ block: block.dataset.satHighlightBlock!, start, end: start + text.length, text })
      }
      if (!segments.length) { setMenu(null); return }
      const rect = range.getBoundingClientRect()
      setMenu({ segments, x: Math.min(window.innerWidth - 80, Math.max(80, rect.left + rect.width / 2)), y: Math.max(48, rect.top - 8) })
    }
    const onUp = (event: Event) => {
      if ((event.target instanceof Element ? event.target : null)?.closest('[data-sat-highlight-menu], [data-sat-highlight-id]')) return
      window.clearTimeout(timeout)
      timeout = window.setTimeout(capture, 10)
    }
    const onDown = (event: Event) => {
      if (!(event.target instanceof Element ? event.target : null)?.closest('[data-sat-highlight-menu], [data-sat-highlight-id]')) setMenu(null)
    }
    const close = () => setMenu(null)
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchend', onUp)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('selectionchange', onUp)
    document.addEventListener('scroll', close, true)
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timeout)
      document.removeEventListener('mouseup', onUp); document.removeEventListener('touchend', onUp)
      document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown)
      document.removeEventListener('selectionchange', onUp); document.removeEventListener('scroll', close, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [enabled, onChange])

  return <div ref={rootRef} className="relative min-h-full min-w-0">
    {children}
    <div className="pointer-events-none absolute inset-0 z-30" aria-label="Saved text highlights">
      {rectangles.map((rect, index) => <span key={`${rect.id}-${index}`} data-sat-highlight-id={rect.id}
        role={enabled && onChange ? 'button' : undefined} tabIndex={enabled && onChange ? 0 : undefined}
        aria-label="Manage highlight" className={enabled && onChange ? 'pointer-events-auto cursor-pointer' : ''}
        style={{ position: 'absolute', left: rect.left, top: rect.top, width: rect.width, height: rect.height, background: rect.color, borderRadius: 2 }}
        onClick={event => { event.stopPropagation(); if (enabled && onChange) { const bounds = event.currentTarget.getBoundingClientRect(); setMenu({ id: rect.id, x: Math.min(window.innerWidth - 90, Math.max(90, bounds.left + bounds.width / 2)), y: Math.max(48, bounds.top - 8) }) } }}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click() } }} />)}
    </div>
    {menu && createPortal(<div data-sat-highlight-menu role="toolbar" aria-label="Text highlight tools"
      onMouseDown={event => event.preventDefault()}
      style={{ position: 'fixed', left: menu.x, top: menu.y, transform: 'translate(-50%, -100%)' }}
      className="z-[110] flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.22)]">
      {menu.segments ? COLORS.map(color => <button type="button" key={color.name} aria-label={`Highlight ${color.name}`}
        className="grid h-7 w-7 place-items-center rounded-lg transition hover:scale-110" style={{ background: color.color }}
        onClick={() => {
          onChange?.([...strokes, ...menu.segments!.map(textRange => ({ id: crypto.randomUUID(), color: color.color, width: 0, points: [], textRange }))])
          setMenu(null); window.getSelection()?.removeAllRanges()
        }}><Highlighter className="h-3.5 w-3.5" style={{ color: color.ink }} /></button>) :
        <button type="button" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700"
          onClick={() => { onChange?.(strokes.filter(stroke => stroke.id !== menu.id)); setMenu(null) }}><Trash2 className="h-4 w-4" /> Remove highlight</button>}
    </div>, document.body)}
  </div>
}
