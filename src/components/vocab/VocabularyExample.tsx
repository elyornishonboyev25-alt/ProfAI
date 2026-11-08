import UiText from '@/components/common/UiText'
import type { VocabularyEntry } from '@/data/vocabularyCollections'
import { normalizeVocabularyAnswer } from '@/utils/vocabularyAnswers'

/** A test extract can contain blanks and answer options; it is not a model sentence. */
export function isSourceExample(entry: VocabularyEntry) {
  const normalize = (text: string) => normalizeVocabularyAnswer(text.replace(/…/g, ''))
  return Boolean(entry.sourceExcerpt && normalize(entry.example) === normalize(entry.sourceExcerpt))
}

export default function VocabularyExample({ entry }: { entry: VocabularyEntry }) {
  if (!entry.example) return null
  const source = isSourceExample(entry)
  return (
    <blockquote className="vocab-content-example" data-source={source}>
      <p className="vocab-content-label">{source ? <UiText text={"From the test"} /> : <UiText text={"Example sentence"} />}</p>
      <p lang="en">{entry.example}</p>
      {entry.exampleUzbek ? <p lang="uz" className="vocab-example-translation">{entry.exampleUzbek}</p> : null}
    </blockquote>
  )
}
