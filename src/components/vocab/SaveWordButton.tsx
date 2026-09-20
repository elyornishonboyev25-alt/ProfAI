import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Bookmark, BookmarkCheck, Heart } from 'lucide-react'
import type { VocabularyEntry } from '@/data/vocabularyCollections'
import { addSavedWord, getSavedWords, subscribeSavedWords, type VocabContext, type WordOrigin } from '@/utils/myVocabularyStore'

type SaveContext = { context: VocabContext; origin: WordOrigin }
const WordSaveContext = createContext<SaveContext | null>(null)

export function WordSaveProvider({ value, children }: { value: SaveContext | null; children: ReactNode }) {
  return <WordSaveContext.Provider value={value}>{children}</WordSaveContext.Provider>
}

export function SaveWordButton({ entry, iconOnly = false }: { entry: VocabularyEntry; iconOnly?: boolean }) {
  const config = useContext(WordSaveContext)
  const [error, setError] = useState(false)
  const saved = useSyncExternalStore(subscribeSavedWords, () => {
    if (!config) return false
    return getSavedWords(config.context).some((word) =>
      word.term.trim().toLowerCase() === entry.term.trim().toLowerCase()
      && word.origins?.some((origin) => origin.path === config.origin.path && origin.questionId === entry.sourceQuestionId),
    )
  }, () => false)
  if (!config) return null

  return (
    <div className={iconOnly ? 'relative inline-flex shrink-0' : 'mb-2 flex flex-wrap items-center gap-2'}>
      <button
        type="button"
        disabled={saved}
        aria-label={saved ? `${entry.term} saved to My Words` : `Save ${entry.term} to My Words`}
        title={saved ? 'Saved to My Words' : 'Save to My Words'}
        onClick={(event) => {
          event.stopPropagation()
          try {
            addSavedWord({ ...entry, source: 'studio', context: config.context, origins: [{ ...config.origin, questionId: entry.sourceQuestionId }] })
            setError(false)
          } catch {
            setError(true)
          }
        }}
        className={iconOnly
          ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:text-rose-500'
          : 'inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700'}
      >
        {iconOnly ? <Heart aria-hidden="true" className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} /> : <>
          {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          {saved ? 'Saved to My Words' : 'Save to My Words'}
        </>}
      </button>
      {error ? <span role="alert" className={iconOnly ? 'absolute right-0 top-full z-10 w-48 rounded-lg border border-red-100 bg-white p-2 text-xs text-red-600 shadow-sm' : 'text-xs text-red-600'}>Could not save. Please try again.</span> : null}
    </div>
  )
}
