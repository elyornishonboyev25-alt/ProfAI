import content from './ieltsFullTestVocabulary.json'
import type { IeltsBook, VocabularyEntry } from './vocabularyCollections'
import { getWritingFullTestById } from './writingTestData'
import { WRITING_SUPPLIED_VOCABULARY, RECYCLING_VOCABULARY } from './writingSuppliedVocabulary'

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
        exampleUzbek: 'exampleUzbek' in entry ? String(entry.exampleUzbek) : undefined,
        sourceExcerpt: entry.sourceExcerpt,
        sourceSectionId: entry.sourceSectionId,
        sourceTitle: entry.sourceTitle,
        sourceKind: entry.sourceKind as 'text' | 'topic',
      })),
    })),
  })),
}))

// Replace vocabulary alongside the active question so the old practice topic
// cannot surface through the test's vocabulary drawer or vocabulary collection.
const writingBook = ieltsFullTestVocabulary.find(book => book.skill === 'writing')!
for (const test of writingBook.tests) {
  const source = getWritingFullTestById(test.sourceTestId!)
  const examples = source && WRITING_SUPPLIED_VOCABULARY[source.index]
  if (!source || !examples) continue
  const task = source.tasks[0]
  const section = test.sections[0]
  section.topic = task.subtitle
  section.prompt = task.promptLead
  section.entries = examples.map(([term, example], index) => ({
    ...(RECYCLING_VOCABULARY[term] ?? lexicon[term]),
    id: `${section.id}_entry_${index + 1}`,
    example,
    sourceExcerpt: task.visualContext!,
    sourceSectionId: task.id,
    sourceTitle: task.subtitle,
    sourceKind: 'topic',
  }))
}
