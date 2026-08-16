import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { VocabContext } from '@/utils/myVocabularyStore'

const WordLookupModal = lazy(() =>
  import('./WordLookupModal').then((module) => ({ default: module.WordLookupModal })),
)

type PillState = {
  word: string
  sentence: string
  context: VocabContext
  origin?: string
  x: number
  y: number
}

const MAX_WORDS = 8

function isValidContext(value: string | null): value is VocabContext {
  return value === 'reading' || value === 'listening' || value === 'article'
}

// Grab the sentence the selection sits in, for better AI context.
function sentenceAround(node: Node | null, selected: string): string {
  const el = node instanceof Element ? node : node?.parentElement ?? null
  const block = el?.closest('p, li, span, div, td, h1, h2, h3, h4') ?? el
  const full = (block?.textContent ?? selected).replace(/\s+/g, ' ').trim()
  if (full.length <= 240) return full
  const idx = full.indexOf(selected)
  if (idx === -1) return full.slice(0, 240)
  return full.slice(Math.max(0, idx - 120), idx + selected.length + 120)
}

// Mounted once globally (App). Watches for a short text selection inside any element marked
// with `.word-lookup-scope` + `data-word-lookup="reading|listening|article"`, then offers an
// "Ask AI" pill. This brings AI word help to Reading and Listening with a one-line opt-in.
export function WordLookupLayer() {
  const [pill, setPill] = useState<PillState | null>(null)
  const [active, setActive] = useState<Omit<PillState, 'x' | 'y'> | null>(null)
  const hideTimer = useRef<number | null>(null)

  const clearPill = useCallback(() => setPill(null), [])

  const evaluateSelection = useCallback(() => {
    if (typeof window === 'undefined') return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setPill(null)
      return
    }
    const text = selection.toString().replace(/\s+/g, ' ').trim()
    if (!text || text.length < 2 || text.length > 80) {
      setPill(null)
      return
    }
    if (text.split(' ').length > MAX_WORDS) {
      setPill(null)
      return
    }

    const range = selection.getRangeAt(0)
    const anchorEl =
      range.commonAncestorContainer instanceof Element
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement
    const scope = anchorEl?.closest<HTMLElement>('.word-lookup-scope')
    if (!scope) {
      setPill(null)
      return
    }
    const context = scope.dataset.wordLookup ?? null
    if (!isValidContext(context)) {
      setPill(null)
      return
    }

    const rect = range.getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      setPill(null)
      return
    }

    const x = Math.min(window.innerWidth - 90, Math.max(70, rect.left + rect.width / 2))
    const y = Math.max(56, rect.top - 8)
    setPill({
      word: text,
      sentence: sentenceAround(range.startContainer, text),
      context,
      origin: scope.dataset.wordOrigin || undefined,
      x,
      y,
    })
  }, [])

  useEffect(() => {
    const onUp = () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      // Let the selection settle before measuring.
      hideTimer.current = window.setTimeout(evaluateSelection, 10)
    }
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-word-lookup-pill]')) return
      setPill(null)
    }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchend', onUp)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    window.addEventListener('scroll', clearPill, true)
    return () => {
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchend', onUp)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      window.removeEventListener('scroll', clearPill, true)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
    }
  }, [evaluateSelection, clearPill])

  const openModal = () => {
    if (!pill) return
    setActive({ word: pill.word, sentence: pill.sentence, context: pill.context, origin: pill.origin })
    setPill(null)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <>
      {pill ? (
        <button
          data-word-lookup-pill
          onClick={openModal}
          style={{ position: 'fixed', left: pill.x, top: pill.y, transform: 'translate(-50%, -100%)' }}
          className="z-[115] inline-flex items-center gap-1.5 rounded-full border border-blue-300/60 bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.4)] transition hover:brightness-110"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask AI
        </button>
      ) : null}

      {active ? (
        <Suspense fallback={null}>
          <WordLookupModal
            open
            word={active.word}
            sentence={active.sentence}
            context={active.context}
            origin={active.origin}
            onClose={() => setActive(null)}
          />
        </Suspense>
      ) : null}
    </>
  )
}

export default WordLookupLayer
