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

/** Only live IELTS test routes can be used as vocabulary return destinations. */
export function getIeltsVocabularyReturnTo(value: string | null | undefined) {
  if (!value || /[\\\s]/.test(value)) return null
  const path = value.split(/[?#]/, 1)[0]
  const match = /^(?:\/test\/(listening|reading)|\/ielts\/(writing|speaking)\/test)\/([a-zA-Z0-9_-]+)$/.exec(path)
  if (!match || !getIeltsTestVocabulary(match[3], (match[1] || match[2]) as IeltsVocabularySkill)) return null
  return value
}

export function getIeltsVocabularyTestPath(testId: string, skill: IeltsVocabularySkill) {
  return skill === 'listening' || skill === 'reading'
    ? `/test/${skill}/${testId}`
    : `/ielts/${skill}/test/${testId}`
}

export function withVocabularyReturnTo(path: string, returnTo: string | null) {
  if (!returnTo) return path
  return `${path}${path.includes('?') ? '&' : '?'}returnTo=${encodeURIComponent(returnTo)}`
}
