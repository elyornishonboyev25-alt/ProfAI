import { useId } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import type { VocabularyEntry } from '@/data/vocabularyCollections'
import { IeltsVocabularyWord, VocabularyPanel } from './IeltsVocabularyStudio'

export default function VocabularyInlineLibrary({ entries, accent, open, onToggle }: {
  entries: VocabularyEntry[]
  accent: 'red' | 'blue'
  open: boolean
  onToggle: () => void
}) {
  const panelId = useId()
  return <section className="vocab-inline-library" aria-label="Vocabulary">
    <button type="button" className="vocab-word-list" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
      <span><BookOpen size={17} aria-hidden="true" />Vocabulary<span className="vocab-word-count">{entries.length}</span></span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    <VocabularyPanel id={panelId} open={open}>
      <div className="vocab-inline-library-grid grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => <IeltsVocabularyWord key={entry.id} entry={entry} accent={accent} />)}
      </div>
    </VocabularyPanel>
  </section>
}
