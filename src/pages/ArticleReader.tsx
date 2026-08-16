import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Bookmark,
  BookOpenCheck,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Highlighter as HighlighterIcon,
  MessageCircle,
  Mic2,
  Moon,
  Quote,
  Sparkles,
  StickyNote,
  Sun,
  Trash2,
  Type,
  Volume2,
  X,
} from 'lucide-react'
import { getArticleBySlug, articleWordCount } from '@/data/articles'
import { saveArticleProgress } from '@/utils/articleProgressStore'
import type { ArticleBlock, ArticleVocabEntry } from '@/data/articles'
import WordLookupModal from '@/components/vocab/WordLookupModal'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import {
  addHighlight,
  addNote,
  getArticleBookmark,
  getHighlights,
  getNotes,
  getReaderPrefs,
  removeHighlight,
  removeNote,
  setReaderPrefs,
  subscribeReader,
  toggleArticleBookmark,
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
function renderRichText(
  text: string,
  highlights: Highlight[],
  vocabulary: ArticleVocabEntry[],
  onMarkClick: (id: string, el: HTMLElement) => void,
  onVocabClick: (entry: ArticleVocabEntry, sentence: string) => void,
) {
  type Match =
    | { start: number; end: number; kind: 'highlight'; highlight: Highlight }
    | { start: number; end: number; kind: 'vocabulary'; entry: ArticleVocabEntry }

  const matches: Match[] = []
  for (const h of highlights) {
    const idx = text.indexOf(h.text)
    if (idx !== -1) {
      matches.push({ start: idx, end: idx + h.text.length, kind: 'highlight', highlight: h })
    }
  }

  const lowerText = text.toLocaleLowerCase()
  for (const entry of vocabulary) {
    const term = entry.term.trim()
    if (!term) continue
    const lowerTerm = term.toLocaleLowerCase()
    let from = 0
    while (from < lowerText.length) {
      const idx = lowerText.indexOf(lowerTerm, from)
      if (idx === -1) break
      const before = idx === 0 ? '' : text[idx - 1]
      const after = idx + term.length >= text.length ? '' : text[idx + term.length]
      const startsOnBoundary = !before || !/[a-z0-9]/i.test(before)
      const endsOnBoundary = !after || !/[a-z0-9]/i.test(after)
      if (startsOnBoundary && endsOnBoundary) {
        matches.push({ start: idx, end: idx + term.length, kind: 'vocabulary', entry })
      }
      from = idx + term.length
    }
  }

  if (matches.length === 0) return text
  matches.sort((a, b) => a.start - b.start || (a.kind === 'highlight' ? -1 : 1))

  const out: ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const match of matches) {
    if (match.start < cursor) continue
    if (match.start > cursor) out.push(text.slice(cursor, match.start))
    if (match.kind === 'highlight') {
      out.push(
        <mark
          key={`hl-${match.highlight.id}-${key++}`}
          onClick={(event) => {
            event.stopPropagation()
            onMarkClick(match.highlight.id, event.currentTarget)
          }}
          title="Highlightni boshqarish"
          style={{ backgroundColor: HIGHLIGHT_BG[match.highlight.color], color: 'inherit' }}
          className="cursor-pointer rounded px-0.5 [box-decoration-break:clone]"
        >
          {text.slice(match.start, match.end)}
        </mark>,
      )
    } else {
      out.push(
        <button
          key={`vocab-${match.entry.id}-${key++}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onVocabClick(match.entry, text)
          }}
          className="article-vocab-word rounded-sm font-semibold text-red-700 underline decoration-red-300 decoration-dotted underline-offset-4 transition hover:bg-red-50 hover:text-red-800"
          title="AI explanation"
        >
          {text.slice(match.start, match.end)}
        </button>,
      )
    }
    cursor = match.end
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
  const [bookmarked, setBookmarked] = useState(() => (slug ? getArticleBookmark(slug) : false))
  // Popover shown when a saved highlight is tapped — removal only happens from here.
  const [hlMenu, setHlMenu] = useState<{ id: string; x: number; y: number } | null>(null)

  const bodyRef = useRef<HTMLDivElement>(null)
  const readerScrollRef = useRef<HTMLDivElement>(null)
  const progressFrameRef = useRef<number | null>(null)
  const pendingProgressRef = useRef(0)
  const persistedProgressBucketRef = useRef(-1)
  const openAiAssistant = useAiAssistantStore((state) => state.open)
  const setAiWorkspace = useAiAssistantStore((state) => state.setActiveWorkspace)

  // Live sync with the store (works across the toolbar, body and notes drawer).
  useEffect(() => {
    if (!slug) return
    const sync = () => {
      setPrefs(getReaderPrefs())
      setHighlights(getHighlights(slug))
      setNotes(getNotes(slug))
      setBookmarked(getArticleBookmark(slug))
    }
    sync()
    return subscribeReader(sync)
  }, [slug])

  // Reading progress follows the paper's own scroll area, matching the focused
  // reader in the reference while still persisting progress for the library.
  useEffect(() => {
    persistedProgressBucketRef.current = -1
    const onScroll = () => {
      const el = readerScrollRef.current
      if (!el) return
      const total = el.scrollHeight - el.clientHeight
      pendingProgressRef.current = total > 0 ? (el.scrollTop / total) * 100 : 100
      if (progressFrameRef.current !== null) return

      progressFrameRef.current = window.requestAnimationFrame(() => {
        progressFrameRef.current = null
        const nextProgress = pendingProgressRef.current
        setProgress(nextProgress)
        const nextBucket = Math.floor(nextProgress / 5)
        if (slug && nextBucket !== persistedProgressBucketRef.current) {
          persistedProgressBucketRef.current = nextBucket
          saveArticleProgress(slug, nextProgress)
        }
      })
    }
    const el = readerScrollRef.current
    el?.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      el?.removeEventListener('scroll', onScroll)
      if (progressFrameRef.current !== null) window.cancelAnimationFrame(progressFrameRef.current)
      progressFrameRef.current = null
    }
  }, [slug, prefs.fontScale, prefs.width])

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

  const onVocabularyClick = (entry: ArticleVocabEntry, sentence: string) => {
    setLookup({ word: entry.term, sentence })
  }

  const onOpenAssistant = () => {
    setAiWorkspace('general')
    openAiAssistant()
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
  const readingWidthClass = prefs.width === 'wide' ? 'max-w-5xl' : 'max-w-4xl'
  const progressValue = Math.round(progress)
  const progressCircumference = 2 * Math.PI * 52
  const progressOffset = progressCircumference * (1 - progressValue / 100)
  const notePreviews = notes.slice(0, 2)

  return (
    <div className="article-reader-page workspace-page relative min-h-screen overflow-hidden px-3 py-4 text-slate-950 sm:px-5 sm:py-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_12%,rgba(255,244,214,0.96),transparent_36%),radial-gradient(circle_at_88%_18%,rgba(239,229,229,0.94),transparent_38%),linear-gradient(135deg,#fffaf0_0%,#f4ebe5_52%,#eee8e8_100%)]" />
      <div className="pointer-events-none fixed -left-24 top-[28%] -z-10 h-80 w-80 rounded-full border border-red-200/30" />
      <div className="pointer-events-none fixed -right-28 bottom-[-8rem] -z-10 h-[28rem] w-[28rem] rounded-full border border-red-200/25" />
      <div className="pointer-events-none fixed right-[4%] top-[7%] -z-10 h-80 w-80 rounded-full bg-red-300/20 blur-[90px]" />
      <div className="pointer-events-none fixed left-[18%] top-[-7rem] -z-10 h-64 w-[34rem] rounded-full bg-amber-200/25 blur-[100px]" />

      {/* reading progress */}
      <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-white/40">
        <div
          className="h-full bg-gradient-to-r from-red-700 via-red-500 to-rose-400 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1640px]">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <main className="min-w-0 space-y-5">
            <header className="article-reader-glass article-reader-header-glass flex min-h-[7rem] items-center justify-between gap-5 rounded-[2.35rem] px-5 py-4 sm:px-8 lg:px-10">
              <div className="flex min-w-0 items-center gap-5 lg:gap-10">
                <Link to="/dashboard" className="flex shrink-0 items-center gap-2.5" aria-label="ProfAI home">
                  <img src="/logo.svg" alt="" className="h-14 w-14 drop-shadow-[0_12px_18px_rgba(220,38,38,0.32)] sm:h-[4.6rem] sm:w-[4.6rem]" />
                  <span className="hidden text-[2.55rem] font-black tracking-[-0.05em] text-slate-900 sm:inline">
                    Prof<span className="text-red-600">AI</span>
                  </span>
                </Link>

                <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-3 text-[1.12rem] font-medium text-slate-500 md:flex lg:text-[1.28rem]">
                  <Link to="/dashboard" className="transition hover:text-red-700">Home</Link>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  <Link to="/articles" className="transition hover:text-red-700">Library</Link>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  <Link to="/articles" className="transition hover:text-red-700">Articles</Link>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                  <span className="max-w-[28rem] truncate font-bold text-slate-950">{article.title}</span>
                </nav>

                <Link to="/articles" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 md:hidden">
                  <ArrowLeft className="h-4 w-4" /> Articles
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setBookmarked(toggleArticleBookmark(slug))}
                aria-pressed={bookmarked}
                aria-label={bookmarked ? 'Remove article bookmark' : 'Bookmark article'}
                className={`article-reader-icon-button grid h-[4.7rem] w-[4.7rem] shrink-0 place-items-center rounded-[1.7rem] transition hover:-translate-y-0.5 ${
                  bookmarked ? 'text-red-700' : 'text-red-600 hover:text-red-800'
                }`}
                title={bookmarked ? 'Remove bookmark' : 'Save article'}
              >
                <Bookmark className="h-8 w-8" fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </header>

            <section className={`article-reader-paper overflow-hidden rounded-[2rem] border transition-colors ${surfaceClass} ${
              prefs.theme === 'dark' ? 'border-slate-700/80' : 'border-white/90'
            }`}>
              <div ref={readerScrollRef} className="article-reader-scroll max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain">
                <div className={`border-b px-6 pb-7 pt-8 sm:px-10 sm:pb-9 sm:pt-11 lg:px-14 ${
                  prefs.theme === 'dark' ? 'border-slate-700' : 'border-red-100/70'
                }`}>
                  <Link
                    to="/articles"
                    className={`mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${
                      prefs.theme === 'dark' ? 'text-rose-300' : 'text-red-700'
                    }`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> All articles
                  </Link>
                  <h1
                    className="max-w-5xl text-4xl leading-[1.08] tracking-[-0.025em] sm:text-5xl lg:text-[3.65rem]"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {article.title}
                  </h1>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${
                      prefs.theme === 'dark' ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-white bg-white/75 text-slate-800 shadow-sm'
                    }`}>
                      <Clock3 className="h-4 w-4 text-red-500" />
                      {article.readMinutes} min · {article.category}
                      <span className="ml-1 h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                        <span className="block h-full rounded-full bg-gradient-to-r from-red-700 to-red-400" style={{ width: `${Math.max(8, progressValue)}%` }} />
                      </span>
                    </span>
                    <span className={`text-xs font-semibold ${prefs.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {wordCount.toLocaleString()} words
                    </span>
                  </div>
                  <p className={`mt-6 max-w-4xl text-base leading-7 sm:text-lg ${prefs.theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {article.teaser}
                  </p>
                </div>

                <article
                  ref={bodyRef}
                  className={`select-text px-6 py-8 sm:px-10 sm:py-10 lg:px-14 ${readingWidthClass}`}
                  style={{ fontFamily: bodyFontFamily }}
                >
                  {article.blocks.map((block, index) => (
                    <BlockView
                      key={index}
                      block={block}
                      fontScale={prefs.fontScale}
                      theme={prefs.theme}
                      content={renderRichText(
                        block.text,
                        blockHighlights(index),
                        article.vocabulary,
                        onMarkClick,
                        onVocabularyClick,
                      )}
                      index={index}
                    />
                  ))}

                  <div className={`mt-12 rounded-[1.5rem] border p-5 sm:p-6 ${
                    prefs.theme === 'dark' ? 'border-slate-700 bg-slate-900/60' : 'border-red-100 bg-white/72'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2">
                        <BookOpenCheck className={`h-5 w-5 ${prefs.theme === 'dark' ? 'text-rose-300' : 'text-red-600'}`} />
                        <h3 className="text-lg font-black">Key vocabulary ({article.vocabulary.length})</h3>
                      </div>
                      <Link
                        to={`/vocabulary/articles/${article.slug}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-red-700 to-red-500 px-3.5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,0.24)]"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Study set
                      </Link>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {article.vocabulary.map((entry) => (
                        <div
                          key={entry.id}
                          className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 transition hover:-translate-y-0.5 ${
                            prefs.theme === 'dark'
                              ? 'border-slate-700 bg-slate-900/40 hover:border-rose-400'
                              : 'border-red-100 bg-white hover:border-red-300 hover:shadow-sm'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onVocabularyClick(entry, entry.example)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block text-sm font-bold">{entry.term}</span>
                            <span className={`mt-1 block text-xs leading-5 ${prefs.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {entry.definition}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => speakWord(entry.term)}
                            aria-label={`Pronounce ${entry.term}`}
                            className={`rounded-lg p-1.5 ${prefs.theme === 'dark' ? 'text-slate-400 hover:text-rose-300' : 'text-red-500 hover:bg-red-50 hover:text-red-700'}`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            </section>
          </main>

          <aside className="article-reader-rail relative grid gap-6 md:grid-cols-3 xl:sticky xl:top-6 xl:block xl:space-y-6">
            <section className="article-reader-glass article-reader-rail-card rounded-[2.35rem] p-6 lg:p-7">
              <div className="mx-auto grid h-44 w-44 place-items-center">
                <svg viewBox="0 0 120 120" className="col-start-1 row-start-1 h-44 w-44 -rotate-90 drop-shadow-[0_12px_14px_rgba(127,29,29,0.12)]" aria-hidden="true">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#reader-progress-gradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={progressCircumference}
                    strokeDashoffset={progressOffset}
                    className="transition-[stroke-dashoffset] duration-300"
                  />
                  <defs>
                    <linearGradient id="reader-progress-gradient" x1="0" y1="0" x2="120" y2="120">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#991b1b" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="col-start-1 row-start-1 text-[2.55rem] font-black tabular-nums text-slate-950">{progressValue}%</span>
              </div>

              <div className="my-7 h-px bg-slate-400/25 shadow-[0_1px_0_rgba(255,255,255,0.8)]" />

              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex whitespace-nowrap items-center gap-2.5 text-base font-bold text-slate-900"><Type className="h-5 w-5 text-red-600" /> Font size</span>
                  <div className="article-reader-segmented flex items-center rounded-[1.4rem] p-1.5">
                    <button
                      type="button"
                      onClick={() => updatePrefs({ fontScale: prefs.fontScale - FONT_SCALE_STEP })}
                      disabled={prefs.fontScale <= FONT_SCALE_MIN + 0.001}
                      className="grid h-10 w-10 place-items-center rounded-xl text-base font-black text-slate-700 transition hover:bg-white disabled:opacity-35"
                      aria-label="Smaller text"
                    >
                      A−
                    </button>
                    <span className="min-w-12 text-center text-sm font-black tabular-nums text-slate-500">{fontScalePct}%</span>
                    <button
                      type="button"
                      onClick={() => updatePrefs({ fontScale: prefs.fontScale + FONT_SCALE_STEP })}
                      disabled={prefs.fontScale >= FONT_SCALE_MAX - 0.001}
                      className="grid h-10 w-10 place-items-center rounded-xl text-lg font-black text-slate-900 transition hover:bg-white disabled:opacity-35"
                      aria-label="Larger text"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-base font-bold text-slate-900">Contrast</span>
                  <div className="article-reader-segmented flex items-center gap-1 rounded-[1.4rem] p-1.5">
                    {([
                      { value: 'light' as ReaderTheme, label: 'Light', icon: Sun },
                      { value: 'sepia' as ReaderTheme, label: 'Sepia', icon: Coffee },
                      { value: 'dark' as ReaderTheme, label: 'Dark', icon: Moon },
                    ]).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updatePrefs({ theme: value })}
                        aria-label={`${label} reading theme`}
                        aria-pressed={prefs.theme === value}
                        title={label}
                        className={`grid h-10 w-10 place-items-center rounded-xl transition ${
                          prefs.theme === value ? 'bg-white text-red-700 shadow-[0_8px_16px_rgba(15,23,42,0.1)]' : 'text-slate-500 hover:bg-white/60 hover:text-red-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updatePrefs({ font: prefs.font === 'serif' ? 'sans' : 'serif' })}
                    className="article-reader-segmented rounded-[1.15rem] px-3 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:text-red-700"
                  >
                    {prefs.font === 'serif' ? 'Serif font' : 'Sans font'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePrefs({ width: prefs.width === 'cozy' ? 'wide' : 'cozy' })}
                    className="article-reader-segmented rounded-[1.15rem] px-3 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:text-red-700"
                  >
                    {prefs.width === 'cozy' ? 'Cozy width' : 'Wide width'}
                  </button>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="article-reader-glass article-reader-notes-card block min-h-[16rem] w-full rounded-[2.35rem] p-6 text-left transition hover:-translate-y-0.5 lg:p-7"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2.5 text-[1.35rem] font-black text-slate-950">
                  <StickyNote className="h-6 w-6 text-red-600" /> Notes
                </span>
                <span className="grid h-7 min-w-7 place-items-center rounded-full bg-red-600 px-2 text-xs font-black text-white shadow-[0_8px_16px_rgba(220,38,38,0.24)]">{notes.length}</span>
              </div>
              {notePreviews.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-2 pb-2">
                  {notePreviews.map((note, index) => (
                    <span
                      key={note.id}
                      className={`article-sticky-note relative block min-h-28 px-3 pb-3 pt-5 text-xs font-semibold leading-5 text-slate-800 ${index % 2 === 0 ? '-rotate-2' : 'translate-y-3 rotate-3'}`}
                    >
                      <span className="article-note-pin" />
                      <span className="line-clamp-4">{note.text}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="article-reader-empty-note mt-6 flex min-h-28 items-center justify-center rounded-[1.5rem] border border-dashed border-red-200/80 bg-white/32 px-5 py-7 text-center text-sm font-medium leading-6 text-slate-500">
                  Select text and add your first note.
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenAssistant}
              className="article-reader-glass article-reader-ai-card group flex min-h-[8.5rem] w-full items-center gap-5 rounded-[2.35rem] p-5 text-left transition hover:-translate-y-0.5 lg:px-6"
            >
              <span className="article-reader-ai-orb grid h-[4.8rem] w-[4.8rem] shrink-0 place-items-center rounded-full text-red-600 transition group-hover:scale-105">
                <Mic2 className="h-7 w-7" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[1.6rem] font-black text-slate-950">Ask AI <MessageCircle className="h-6 w-6" /></span>
                <span className="mt-1 block whitespace-nowrap text-sm font-medium text-slate-500">Select text for word help</span>
              </span>
            </button>
          </aside>
        </div>
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
                <button onClick={() => setNotesOpen(false)} aria-label="Close notes" className="rounded-lg p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700">
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
                        <button onClick={() => removeNote(slug, note.id)} aria-label="Delete note" className="text-slate-400 hover:text-red-600">
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
