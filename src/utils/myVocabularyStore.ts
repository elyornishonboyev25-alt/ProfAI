import type { VocabularyEntry } from '@/data/vocabularyCollections'

export type VocabContext = 'reading' | 'listening' | 'article' | 'sat'
export type VocabSource = 'ai' | 'manual' | 'studio'

export type WordOrigin = { label: string; path: string; questionId?: string }

export type SavedWord = VocabularyEntry & {
  source: VocabSource
  context: VocabContext
  origin?: string // where it was captured (article slug, test id, …) for a friendly label
  origins?: WordOrigin[]
  createdAt: string
}

const STORAGE_KEY = 'smarttest_my_vocabulary_v1'
const CHANGE_EVENT = 'myvocab:changed'

function read(): SavedWord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedWord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(words: SavedWord[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words))
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

function normalizeTerm(term: string) {
  return term.toLowerCase().trim().replace(/\s+/g, ' ')
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `w_${crypto.randomUUID()}`
  return `w_${Date.now()}_${Math.round(Math.random() * 1e6)}`
}

export function getAllSavedWords(): SavedWord[] {
  return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function getSavedWords(context: VocabContext, source?: VocabSource): SavedWord[] {
  return getAllSavedWords().filter(
    (word) => word.context === context && (source ? word.source === source : true),
  )
}

export function countSavedWords(context: VocabContext, source?: VocabSource): number {
  return read().filter((word) => word.context === context && (source ? word.source === source : true)).length
}

type AddInput = {
  term: string
  definition: string
  example: string
  synonym: string
  source: VocabSource
  context: VocabContext
  origin?: string
  origins?: WordOrigin[]
  uzbek?: string
  exampleUzbek?: string
  sourceQuestionId?: string
}

// Adds a word, de-duplicating by (context, term). If the same term already exists in that
// context we refresh its definition/example so the newest AI explanation wins. Returns the saved word.
export function addSavedWord(input: AddInput): SavedWord {
  const words = read()
  const key = normalizeTerm(input.term)
  const existingIndex = words.findIndex(
    (word) => word.context === input.context && normalizeTerm(word.term) === key,
  )

  const existing = words[existingIndex]
  const origins = [...(existing?.origins ?? [])]
  for (const origin of input.origins ?? []) {
    if (!origins.some((item) => item.path === origin.path && item.questionId === origin.questionId)) origins.push(origin)
  }
  const saved: SavedWord = {
    id: existingIndex >= 0 ? words[existingIndex].id : makeId(),
    term: input.term.trim(),
    definition: input.definition.trim(),
    example: input.example.trim(),
    synonym: input.synonym.trim(),
    source: input.source,
    context: input.context,
    origin: input.origin ?? existing?.origin,
    origins,
    uzbek: input.uzbek?.trim() ?? existing?.uzbek,
    exampleUzbek: input.exampleUzbek?.trim() ?? existing?.exampleUzbek,
    sourceQuestionId: input.sourceQuestionId ?? existing?.sourceQuestionId,
    createdAt: existingIndex >= 0 ? words[existingIndex].createdAt : new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    words[existingIndex] = saved
  } else {
    words.push(saved)
  }
  write(words)
  return saved
}

export function removeSavedWord(id: string) {
  write(read().filter((word) => word.id !== id))
}

export function clearSavedWords(context: VocabContext, source?: VocabSource) {
  write(read().filter((word) => !(word.context === context && (source ? word.source === source : true))))
}

export function isWordSaved(context: VocabContext, term: string): boolean {
  const key = normalizeTerm(term)
  return read().some((word) => word.context === context && normalizeTerm(word.term) === key)
}

// Subscribe to changes (returns an unsubscribe fn). Used by React views to stay live.
export function subscribeSavedWords(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => listener()
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
