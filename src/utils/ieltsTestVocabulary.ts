import { ieltsFullTestVocabulary, type IeltsVocabularySkill } from '@/data/ieltsFullTestVocabulary'

/** Resolve by source identity: visible test numbers can differ from legacy IDs. */
export function getIeltsTestVocabulary(testId: string, skill?: IeltsVocabularySkill) {
  for (const book of ieltsFullTestVocabulary) {
    if (skill && book.skill !== skill) continue
    const test = book.tests.find((item) => item.sourceTestId === testId || item.id === testId)
    if (!test || !test.available) continue
    const number = test.id.slice(`${book.skill}_full_test_`.length)
    const entries = test.sections.flatMap((section) => section.entries)
    const sectionWords = test.sections.flatMap((section) => section.entries.slice(0, 1))
    return {
      test,
      skill: book.skill,
      href: `/vocabulary/ielts?skill=${book.skill}&test=${number}`,
      wordCount: test.sections.reduce((sum, section) => sum + section.entries.length, 0),
      preview: [...new Map([...sectionWords, ...entries].map((entry) => [entry.term, entry])).values()].slice(0, 4),
    }
  }
  return null
}

/** Saved Speaking sessions predate a source-test-ID field. Only full mock labels qualify. */
export function speakingVocabularyTestId(modeLabel: string) {
  const match = /^Speaking Full Mock (\d+)$/.exec(modeLabel)
  return match ? `speaking-full-${match[1]}` : ''
}
