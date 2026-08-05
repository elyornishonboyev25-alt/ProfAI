// Persistence for the Article reader: reading preferences (shared across articles) plus
// per-article highlights and notes. All localStorage-backed and event-driven so the reader
// toolbar, the highlight layer, and the notes panel stay in sync.

export type ReaderTheme = 'light' | 'sepia' | 'dark'
export type ReaderWidth = 'cozy' | 'wide'
export type ReaderFont = 'serif' | 'sans'
export type HighlightColor = 'amber' | 'emerald' | 'sky' | 'pink'

export type ReaderPrefs = {
  fontScale: number // 0.9 – 1.6
  theme: ReaderTheme
  width: ReaderWidth
  font: ReaderFont
}

export type Highlight = {
  id: string
  blockIndex: number
  text: string
  color: HighlightColor
}

export type ReaderNote = {
  id: string
  text: string
  quote?: string
  createdAt: string
}

const PREFS_KEY = 'smarttest_reader_prefs_v1'
const HIGHLIGHTS_KEY = 'smarttest_reader_highlights_v1'
const NOTES_KEY = 'smarttest_reader_notes_v1'
const BOOKMARKS_KEY = 'smarttest_reader_bookmarks_v1'
const CHANGE_EVENT = 'reader:changed'

export const DEFAULT_PREFS: ReaderPrefs = {
  fontScale: 1.08,
  theme: 'light',
  width: 'cozy',
  font: 'serif',
}

export const FONT_SCALE_MIN = 0.9
export const FONT_SCALE_MAX = 1.6
export const FONT_SCALE_STEP = 0.08

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
  emit()
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}_${Math.round(Math.random() * 1e6)}`
}

// ---------- preferences ----------
export function getReaderPrefs(): ReaderPrefs {
  return { ...DEFAULT_PREFS, ...readJSON<Partial<ReaderPrefs>>(PREFS_KEY, {}) }
}

export function setReaderPrefs(patch: Partial<ReaderPrefs>) {
  const next = { ...getReaderPrefs(), ...patch }
  next.fontScale = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Number(next.fontScale.toFixed(2))))
  writeJSON(PREFS_KEY, next)
  return next
}

// ---------- highlights ----------
export function getHighlights(slug: string): Highlight[] {
  const all = readJSON<Record<string, Highlight[]>>(HIGHLIGHTS_KEY, {})
  return all[slug] ?? []
}

export function addHighlight(slug: string, blockIndex: number, text: string, color: HighlightColor): Highlight {
  const all = readJSON<Record<string, Highlight[]>>(HIGHLIGHTS_KEY, {})
  const list = all[slug] ?? []
  const clean = text.trim()
  // Avoid exact duplicates within the same block.
  const existing = list.find((h) => h.blockIndex === blockIndex && h.text === clean)
  if (existing) {
    existing.color = color
    all[slug] = list
    writeJSON(HIGHLIGHTS_KEY, all)
    return existing
  }
  const highlight: Highlight = { id: makeId(), blockIndex, text: clean, color }
  all[slug] = [...list, highlight]
  writeJSON(HIGHLIGHTS_KEY, all)
  return highlight
}

export function removeHighlight(slug: string, id: string) {
  const all = readJSON<Record<string, Highlight[]>>(HIGHLIGHTS_KEY, {})
  all[slug] = (all[slug] ?? []).filter((h) => h.id !== id)
  writeJSON(HIGHLIGHTS_KEY, all)
}

export function clearHighlights(slug: string) {
  const all = readJSON<Record<string, Highlight[]>>(HIGHLIGHTS_KEY, {})
  delete all[slug]
  writeJSON(HIGHLIGHTS_KEY, all)
}

// ---------- notes ----------
export function getNotes(slug: string): ReaderNote[] {
  const all = readJSON<Record<string, ReaderNote[]>>(NOTES_KEY, {})
  return all[slug] ?? []
}

export function addNote(slug: string, text: string, quote?: string): ReaderNote {
  const all = readJSON<Record<string, ReaderNote[]>>(NOTES_KEY, {})
  const note: ReaderNote = { id: makeId(), text: text.trim(), quote: quote?.trim() || undefined, createdAt: new Date().toISOString() }
  all[slug] = [note, ...(all[slug] ?? [])]
  writeJSON(NOTES_KEY, all)
  return note
}

export function updateNote(slug: string, id: string, text: string) {
  const all = readJSON<Record<string, ReaderNote[]>>(NOTES_KEY, {})
  all[slug] = (all[slug] ?? []).map((note) => (note.id === id ? { ...note, text: text.trim() } : note))
  writeJSON(NOTES_KEY, all)
}

export function removeNote(slug: string, id: string) {
  const all = readJSON<Record<string, ReaderNote[]>>(NOTES_KEY, {})
  all[slug] = (all[slug] ?? []).filter((note) => note.id !== id)
  writeJSON(NOTES_KEY, all)
}

// ---------- bookmarks ----------
export function getArticleBookmark(slug: string): boolean {
  const bookmarks = readJSON<string[]>(BOOKMARKS_KEY, [])
  return bookmarks.includes(slug)
}

export function toggleArticleBookmark(slug: string): boolean {
  const bookmarks = readJSON<string[]>(BOOKMARKS_KEY, [])
  const next = bookmarks.includes(slug)
    ? bookmarks.filter((item) => item !== slug)
    : [...bookmarks, slug]
  writeJSON(BOOKMARKS_KEY, next)
  return next.includes(slug)
}

export function subscribeReader(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => listener()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
