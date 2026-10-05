import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import UiText from '@/components/common/UiText'
import { getIeltsTestVocabulary, getIeltsVocabularyReturnTo } from '@/utils/ieltsTestVocabulary'
import '@/styles/test-vocabulary.css'

export default function VocabularyTestReturn({ returnTo }: { returnTo: string | null }) {
  const destination = getIeltsVocabularyReturnTo(returnTo)
  if (!destination) return null
  const testId = destination.split(/[?#]/, 1)[0].split('/').pop()!
  const vocabulary = getIeltsTestVocabulary(testId)!
  return (
    <Link to={destination} data-vocabulary-test-return className="test-vocab-return"
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        // Reuse the original test tab, including any setup or unsaved answers.
        try {
          const source = window.opener as Window | null
          if (source && !source.closed && source.location.origin === window.location.origin
            && `${source.location.pathname}${source.location.search}${source.location.hash}` === destination) {
            source.focus()
            window.close()
            event.preventDefault()
          }
        } catch { /* A closed or unavailable source tab falls back to the exact test route. */ }
      }}>
      <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span><UiText text="Back to test" /><span className="test-vocab-return-title">{vocabulary.test.title}</span></span>
    </Link>
  )
}
