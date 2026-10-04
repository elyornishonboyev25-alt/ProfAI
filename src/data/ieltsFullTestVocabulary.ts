import content from './ieltsFullTestVocabulary.json'
import type { IeltsBook, VocabularyEntry } from './vocabularyCollections'

export type IeltsVocabularySkill = 'listening' | 'reading' | 'writing' | 'speaking'

// These sets follow the *visible* Full Test catalog, including the regrouped
// Reading tests 1–12. Source IDs belong to the original tests, not the old
// vocabulary numbering. validate-vocabulary checks them against the live bank.
const lexicon: Record<string, { term: string; definition: string; synonym: string; uzbek?: string }> = content.lexicon

export const ieltsFullTestVocabulary: IeltsBook[] = content.books.map((book) => ({
  id: book.id,
  skill: book.skill as IeltsVocabularySkill,
  title: book.title,
  tests: book.tests.map((test) => ({
    id: test.id,
    title: test.title,
    sourceTestId: test.sourceTestId,
    available: true,
    sections: test.sections.map((section) => ({
      id: section.id,
      title: section.title,
      topic: section.topic,
      prompt: 'prompt' in section ? section.prompt : undefined,
      entries: section.entries.map((entry, index): VocabularyEntry => ({
        ...lexicon[entry.term],
        id: `${section.id}_entry_${index + 1}`,
        example: entry.example,
        sourceExcerpt: entry.sourceExcerpt,
        sourceSectionId: entry.sourceSectionId,
        sourceTitle: entry.sourceTitle,
        sourceKind: entry.sourceKind as 'text' | 'topic',
      })),
    })),
  })),
}))
