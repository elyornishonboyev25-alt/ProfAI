import { useSyncExternalStore } from 'react'
import type { VocabularyEntry } from '@/data/vocabularyCollections'
import { getVocabularyTranslation, type VocabularyLanguage } from '@/utils/vocabularyTranslation'

const STORAGE_KEY = 'profai_vocabulary_language'
const CHANGE_EVENT = 'vocabulary:language'
let fallback: VocabularyLanguage = 'uz'
let memoryOnly = false

function snapshot(): VocabularyLanguage {
  if (memoryOnly) return fallback
  try { return window.localStorage.getItem(STORAGE_KEY) === 'ru' ? 'ru' : 'uz' }
  catch { return fallback }
}

function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) callback() }
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', storage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', storage)
  }
}

export function useVocabularyLanguage() {
  return useSyncExternalStore(subscribe, snapshot, () => 'uz' as const)
}

export function VocabularyLanguageToggle({ accent = 'red' }: { accent?: 'red' | 'blue' }) {
  const language = useVocabularyLanguage()
  return <div role="group" aria-label="Vocabulary translation language" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1">
    {(['uz', 'ru'] as const).map((value) => <button
      key={value} type="button" lang={value} aria-pressed={language === value}
      onClick={() => {
        fallback = value
        try { window.localStorage.setItem(STORAGE_KEY, value); memoryOnly = false } catch { memoryOnly = true }
        window.dispatchEvent(new Event(CHANGE_EVENT))
      }}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${accent === 'blue' ? 'focus-visible:ring-blue-400' : 'focus-visible:ring-red-400'} ${language === value ? accent === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
    >{value === 'uz' ? 'O‘zbekcha' : 'Русский'}</button>)}
  </div>
}

export function VocabularyTranslation({ entry, className }: { entry: VocabularyEntry; className?: string }) {
  const language = useVocabularyLanguage()
  const text = getVocabularyTranslation(entry, language)
  return text ? <p lang={language} className={className}>{text}</p> : null
}
