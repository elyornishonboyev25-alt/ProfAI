import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  Clock3,
  Contrast,
  Highlighter as HighlighterIcon,
  Languages,
  Minus,
  Plus,
  Quote,
  Sparkles,
  StickyNote,
  Trash2,
  Type,
  Volume2,
  X,
} from 'lucide-react'
import { getArticleBySlug, articleWordCount } from '@/data/articles'
import { saveArticleProgress } from '@/utils/articleProgressStore'
import type { ArticleBlock } from '@/data/articles'
import ArticleCover from '@/components/articles/ArticleCover'
import WordLookupModal from '@/components/vocab/WordLookupModal'
import {
  addHighlight,
  addNote,
  getHighlights,
  getNotes,
  getReaderPrefs,
  removeHighlight,
  removeNote,
  setReaderPrefs,
  subscribeReader,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  type Highlight,
  type HighlightColor,
  type ReaderTheme,
} from '@/utils/articleReaderStore'

const HIGHLIGHT_BG: Record<HighlightColor, string> = {
  amber: 'rgba(251,191,36,0.45)',
  emerald: 'rgba(52,211,153,0.40)',
  sky: 'rgba(56,189,248,0.40)',
  pink: 'rgba(244,114,182,0.40)',
}

const HIGHLIGHT_SWATCH: Record<HighlightColor, string> = {
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
  pink: '#ec4899',
}

const THEME_SURFACE: Record<ReaderTheme, string> = {
  light: 'bg-white text-slate-800',
  sepia: 'bg-[#f7efdd] text-[#463a29]',
  dark: 'bg-[#0f141c] text-slate-200',
}

type SelectionSegment = { blockIndex: number; text: string }

type SelectionState = {
  segments: SelectionSegment[]
  fullText: string
  sentence: string
  x: number
  y: number
}

// Split a block's text so any saved highlight fragments render as clickable <mark> spans.
function renderHighlighted(
  text: string,
  highlights: Highlight[],
  onMarkClick: (id: string, el: HTMLElement) => void,
) {
  if (highlights.length === 0) return text
  // Build a list of [start,end,highlight] matches, earliest first, non-overlapping.
  const matches: Array<{ start: number; end: number; h: Highlight }> = []
  for (const h of highlights) {
    let from = 0
    const idx = text.indexOf(h.text, from)
    if (idx !== -1) {
      matches.push({ start: idx, end: idx + h.text.length, h })
      from = idx + h.text.length
    }
  }
  matches.sort((a, b) => a.start - b.start)

  const out: ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const m of matches) {
    if (m.start < cursor) continue
    if (m.start > cursor) out.push(text.slice(cursor, m.start))
    out.push(
      <mark
        key={`hl-${m.h.id}-${key++}`}
        onClick={(e) => {
          e.stopPropagation()
          onMarkClick(m.h.id, e.currentTarget)
        }}
        title="Highlightni boshqarish"
        style={{ backgroundColor: HIGHLIGHT_BG[m.h.color], color: 'inherit' }}
        className="cursor-pointer rounded px-0.5 [box-decoration-break:clone]"
      >
        {text.slice(m.start, m.end)}
      </mark>,
    )
    cursor = m.end
  }
  if (cursor < text.length) out.push(text.slice(cursor))
  return out
}

export default function ArticleReader() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getArticleBySlug(slug) : undefined

  const [prefs, setPrefs] = useState(getReaderPrefs)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [notes, setNotes] = useState(() => (slug ? getNotes(slug) : []))
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteQuote, setNoteQuote] = useState<string | null>(null)
  const [lookup, setLookup] = useState<{ word: string; sentence: string } | null>(null)
  const [progress, setProgress] = useState(0)
  // Popover shown when a saved highlight is tapped — removal only happens from here.
  const [hlMenu, setHlMenu] = useState<{ id: string; x: number; y: number } | null>(null)

  const bodyRef = useRef<HTMLDivElement>(null)

  // Live sync with the store (works across the toolbar, body and notes drawer).
  useEffect(() => {
    if (!slug) return
    const sync = () => {
      setPrefs(getReaderPrefs())
      setHighlights(getHighlights(slug))
      setNotes(getNotes(slug))
    }
    sync()
    return subscribeReader(sync)
  }, [slug])

  // Reading progress bar (also persisted so the library can show progress rings).
  useEffect(() => {
    const onScroll = () => {
      const el = bodyRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1))
      const pct = total > 0 ? (scrolled / total) * 100 : 0
      setProgress(pct)
      if (slug) saveArticleProgress(slug, pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [slug])

  const captureSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setSelection(null)
      return
    }
    const fullText = sel.toString().replace(/\s+/g, ' ').trim()
    if (!fullText || fullText.length < 2) {
      setSelection(null)
      return
    }
    const range = sel.getRangeAt(0)
    const root = bodyRef.current
    if (!root || !root.contains(range.commonAncestorContainer)) {
      setSelection(null)
      return
    }

    // Walk every block the selection touches and clip the exact text inside each one.
    // This makes multi-paragraph selections highlightable (previously they were dropped
    // because the common ancestor was the <article>, not a single block).
    const blockEls = Array.from(root.querySelectorAll<HTMLElement>('[data-block-index]'))
    const segments: SelectionSegment[] = []
    let sentence = ''
    for (const el of blockEls) {
      if (!range.intersectsNode(el)) continue
      const isStart = el.contains(range.startContainer)
      const isEnd = el.contains(range.endContainer)
      const clip = range.cloneRange()
      if (!isStart) clip.setStart(el, 0)
      if (!isEnd) clip.setEnd(el, el.childNodes.length)
      const text = clip.toString().replace(/\s+/g, ' ').trim()
      if (text.length < 1) continue
      segments.push({ blockIndex: Number(el.dataset.blockIndex), text })
      if (!sentence) sentence = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
    }
    if (segments.length === 0) {
      setSelection(null)
      return
    }

    const rect = range.getBoundingClientRect()
    setSelection({
      segments,
      fullText,
      sentence: sentence || fullText,
      x: Math.min(window.innerWidth - 140, Math.max(140, rect.left + rect.width / 2)),
      y: Math.max(64, rect.top - 8),
    })
  }, [])

  useEffect(() => {
    const onUp = () => window.setTimeout(captureSelection, 10)
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      // Keep the remove-popover open while it (or a highlight mark) is being interacted with.
      if (!target?.closest('[data-hl-menu]') && !target?.closest('mark')) setHlMenu(null)
      if (target?.closest('[data-selection-toolbar]')) return
      setSelection(null)
    }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchend', onUp)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchend', onUp)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [captureSelection])

  const wordCount = useMemo(() => (article ? articleWordCount(article) : 0), [article])

  if (!slug) return <Navigate to="/articles" replace />
  if (!article) return <Navigate to="/articles" replace />

  const updatePrefs = (patch: Parameters<typeof setReaderPrefs>[0]) => setPrefs(setReaderPrefs(patch))

  const onHighlight = (color: HighlightColor) => {
    if (!selection) return
    // One highlight per touched block so multi-paragraph selections persist correctly.
    selection.segments.forEach((seg) => addHighlight(slug, seg.blockIndex, seg.text, color))
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const onStartNote = () => {
    if (!selection) return
    setNoteQuote(selection.fullText)
    setNoteDraft('')
    setNotesOpen(true)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const onAskAI = () => {
    if (!selection) return
    setLookup({ word: selection.fullText, sentence: selection.sentence })
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  const onMarkClick = (id: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setSelection(null)
    setHlMenu({
      id,
      x: Math.min(window.innerWidth - 120, Math.max(120, r.left + r.width / 2)),
      y: r.bottom + 8,
    })
  }

  const saveNote = () => {
    if (!noteDraft.trim()) return
    addNote(slug, noteDraft, noteQuote ?? undefined)
    setNoteDraft('')
    setNoteQuote(null)
  }

  const blockHighlights = (index: number) => highlights.filter((h) => h.blockIndex === index)

  const fontScalePct = Math.round(prefs.fontScale * 100)
  const bodyFontFamily = prefs.font === 'serif' ? 'Georgia, "Times New Roman", serif' : 'inherit'
  const surfaceClass = THEME_SURFACE[prefs.theme]
  const widthClass = prefs.width === 'wide' ? 'max-w-3xl' : 'max-w-2xl'

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#fde8e8] via-[#fceaea] to-[#f9dede] px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="ambient-mesh" />
        <div className="ambient-grid" />
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-red-200/40 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-0 h-96 w-96 rounded-full bg-rose-200/35 blur-3xl" />
      </div>

      {/* reading progress */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={`relative mx-auto w-full ${widthClass} space-y-5`}>
        {/* top controls */}
        <div className="flex items-center justify-between gap-2">
          <Link to="/articles" className="premium-back-btn-sm">
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>
          <button
            onClick={() => setNotesOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
          >
            <StickyNote className="h-4 w-4" />
            Notes
            {notes.length > 0 ? (
              <span className="ml-0.5 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{notes.length}</span>
            ) : null}
          </button>
        </div>

        {/* hero */}
        <div className="overflow-hidden rounded-[1.8rem] border border-red-100 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <ArticleCover article={article} variant="hero" className="h-44 sm:h-56" />
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 uppercase tracking-[0.14em] text-red-700">
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock3 className="h-3.5 w-3.5 text-red-500" />
                {article.readMinutes} min read
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{wordCount.toLocaleString()} words</span>
            </div>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-slate-600">{article.teaser}</p>
          </div>
        </div>

        {/* reading toolbar */}
        <div className="sticky top-3 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-white/90 px-3 py-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1 pr-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 sm:inline-flex">
              <Type className="h-3.5 w-3.5" /> Text
            </span>
            <button
              onClick={() => updatePrefs({ fontScale: prefs.fontScale - FONT_SCALE_STEP })}
              disabled={prefs.fontScale <= FONT_SCALE_MIN + 0.001}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-700 disabled:opacity-40"
              aria-label="Smaller text"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-11 text-center text-xs font-bold tabular-nums text-slate-600">{fontScalePct}%</span>
            <button
              onClick={() => updatePrefs({ fontScale: prefs.fontScale + FONT_SCALE_STEP })}
              disabled={prefs.fontScale >= FONT_SCALE_MAX - 0.001}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-700 disabled:opacity-40"
              aria-label="Larger text"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* theme / contrast */}
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
              {(['light', 'sepia', 'dark'] as ReaderTheme[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updatePrefs({ theme })}
                  className={`px-2.5 py-1.5 text-[11px] font-bold capitalize transition ${
                    prefs.theme === theme ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {theme === 'light' ? 'Light' : theme === 'sepia' ? 'Sepia' : 'Dark'}
                </button>
              ))}
            </div>

            {/* font family */}
            <button
              onClick={() => updatePrefs({ font: prefs.font === 'serif' ? 'sans' : 'serif' })}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-red-300 hover:text-red-700"
            >
              {prefs.font === 'serif' ? 'Serif' : 'Sans'}
            </button>

            {/* width */}
            <button
              onClick={() => updatePrefs({ width: prefs.width === 'cozy' ? 'wide' : 'cozy' })}
              className="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-red-300 hover:text-red-700 sm:block"
            >
              {prefs.width === 'cozy' ? 'Cozy' : 'Wide'}
            </button>

            <span className="hidden items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-700 md:inline-flex">
              <HighlighterIcon className="h-3.5 w-3.5" /> Select to highlight
            </span>
          </div>
        </div>

        {/* article body */}
        <article
          ref={bodyRef}
          className={`select-text rounded-[1.6rem] border border-red-100 px-6 py-7 shadow-[0_16px_44px_rgba(15,23,42,0.08)] transition-colors sm:px-9 sm:py-10 ${surfaceClass}`}
          style={{ fontFamily: bodyFontFamily }}
        >
          {article.blocks.map((block, index) => (
            <BlockView
              key={index}
              block={block}
              fontScale={prefs.fontScale}
              theme={prefs.theme}
              content={renderHighlighted(block.text, blockHighlights(index), onMarkClick)}
              index={index}
            />
          ))}

          {/* end-of-article vocabulary preview */}
          <div className={`mt-10 rounded-2xl border p-5 ${prefs.theme === 'dark' ? 'border-slate-700 bg-slate-900/60' : 'border-red-100 bg-red-50/50'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <BookOpenCheck className={`h-5 w-5 ${prefs.theme === 'dark' ? 'text-rose-300' : 'text-red-600'}`} />
                <h3 className="text-lg font-black">Key vocabulary ({article.vocabulary.length})</h3>
              </div>
              <Link
                to={`/vocabulary/articles/${article.slug}`}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Study set
              </Link>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {article.vocabulary.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border px-3.5 py-2.5 ${prefs.theme === 'dark' ? 'border-slate-700 bg-slate-900/40' : 'border-red-100 bg-white'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{entry.term}</p>
                    <button
                      onClick={() => speakWord(entry.term)}
                      className={`rounded-md p-1 ${prefs.theme === 'dark' ? 'text-slate-400 hover:text-rose-300' : 'text-slate-400 hover:text-red-600'}`}
                      aria-label="Pronounce"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className={`mt-0.5 text-xs leading-5 ${prefs.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {entry.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* selection toolbar */}
      <AnimatePresence>
        {selection ? (
          <motion.div
            data-selection-toolbar
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            style={{ position: 'fixed', left: selection.x, top: selection.y, transform: 'translate(-50%, -100%)' }}
            className="z-[110] flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-1.5 py-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.22)]"
          >
            {(Object.keys(HIGHLIGHT_BG) as HighlightColor[]).map((color) => (
              <button
                key={color}
                onClick={() => onHighlight(color)}
                className="grid h-7 w-7 place-items-center rounded-lg transition hover:scale-110"
                style={{ backgroundColor: HIGHLIGHT_BG[color] }}
                aria-label={`Highlight ${color}`}
              >
                <HighlighterIcon className="h-3.5 w-3.5" style={{ color: HIGHLIGHT_SWATCH[color] }} />
              </button>
            ))}
            <span className="mx-0.5 h-6 w-px bg-slate-200" />
            <button
              onClick={onStartNote}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <StickyNote className="h-3.5 w-3.5" />
              Note
            </button>
            <button
              onClick={onAskAI}
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-2.5 py-1.5 text-xs font-bold text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask AI
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* tap-a-highlight → remove popover */}
      <AnimatePresence>
        {hlMenu ? (
          <motion.div
            data-hl-menu
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            style={{ position: 'fixed', left: hlMenu.x, top: hlMenu.y, transform: 'translateX(-50%)' }}
            className="z-[115] rounded-2xl border border-red-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(220,38,38,0.22)]"
          >
            <button
              onClick={() => {
                removeHighlight(slug, hlMenu.id)
                setHlMenu(null)
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-gradient-to-r from-white via-red-50/70 to-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Highlightni o'chirish
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* notes drawer */}
      <AnimatePresence>
        {notesOpen ? (
          <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setNotesOpen(false)} aria-label="Close notes" />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-red-100 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3.5">
                <h3 className="inline-flex items-center gap-2 font-black text-slate-900">
                  <StickyNote className="h-5 w-5 text-red-600" />
                  Reading notes
                </h3>
                <button onClick={() => setNotesOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-100 p-4">
                {noteQuote ? (
                  <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-2 italic">{noteQuote}</span>
                    <button onClick={() => setNoteQuote(null)} className="ml-auto text-amber-500 hover:text-amber-700">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Write a note, an idea, or a question…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-800 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                />
                <button
                  onClick={saveNote}
                  disabled={!noteDraft.trim()}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                  Save note
                </button>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {notes.length === 0 ? (
                  <p className="mt-6 text-center text-sm text-slate-400">No notes yet. Select text and tap “Note”, or write one above.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      {note.quote ? <p className="mb-1 line-clamp-2 border-l-2 border-red-300 pl-2 text-xs italic text-slate-500">{note.quote}</p> : null}
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{note.text}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                        <button onClick={() => removeNote(slug, note.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <WordLookupModal
        open={Boolean(lookup)}
        word={lookup?.word ?? ''}
        sentence={lookup?.sentence}
        context="article"
        origin={article.title}
        onClose={() => setLookup(null)}
      />
    </div>
  )
}

function speakWord(text: string) {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.92
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}

function BlockView({
  block,
  content,
  fontScale,
  theme,
  index,
}: {
  block: ArticleBlock
  content: ReactNode
  fontScale: number
  theme: ReaderTheme
  index: number
}) {
  const baseSize = 1.125 * fontScale

  if (block.type === 'heading') {
    return (
      <h2
        data-block-index={index}
        className="mt-9 mb-3 font-black tracking-tight"
        style={{ fontSize: `${1.55 * fontScale}rem` }}
      >
        {content}
      </h2>
    )
  }

  if (block.type === 'quote') {
    return (
      <blockquote
        data-block-index={index}
        className={`my-6 rounded-r-xl border-l-4 py-2 pl-5 pr-2 font-semibold italic ${
          theme === 'dark' ? 'border-rose-400 text-rose-100' : 'border-red-400 text-red-800'
        }`}
        style={{ fontSize: `${1.2 * fontScale}rem`, lineHeight: 1.6 }}
      >
        {content}
      </blockquote>
    )
  }

  if (block.type === 'lead') {
    return (
      <p
        data-block-index={index}
        className="mb-5 font-medium"
        style={{ fontSize: `${1.22 * fontScale}rem`, lineHeight: 1.7 }}
      >
        {content}
      </p>
    )
  }

  return (
    <p data-block-index={index} className="mb-5" style={{ fontSize: `${baseSize}rem`, lineHeight: 1.85 }}>
      {content}
    </p>
  )
}
