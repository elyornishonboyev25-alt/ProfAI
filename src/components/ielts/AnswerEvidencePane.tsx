import { useEffect, useMemo, useRef } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import type { Question, Section } from '@/types/ieltsTypes'
import { resolveAnswerEvidence, sourceBlocks } from '@/utils/answerEvidence'
import { formatCorrectAnswer } from '@/utils/readingReview'

type Props = {
  section: Section
  question?: Question
  showAnswers: boolean
  showParagraphLabels?: boolean
}

export default function AnswerEvidencePane({ section, question, showAnswers, showParagraphLabels }: Props) {
  const pane = useRef<HTMLDivElement>(null)
  const evidence = useMemo(() => question ? resolveAnswerEvidence(section, question)
    : { blocks: sourceBlocks(section), ranges: [], state: 'unavailable' as const }, [section, question])
  const number = question ? Array.isArray(question.correctAnswer)
    ? `${question.number}–${question.number + question.correctAnswer.length - 1}` : String(question.number) : ''
  const passageNumber = section.title.match(/(?:Reading\s+)?Passage\s+(\d+)/i)?.[1]
  const title = section.title.replace(/^(?:Reading\s+)?Passage\s+\d+\s*:\s*/i, '')
  const message = evidence.state === 'answer' ? 'Highlighted text supports the correct answer.'
    : evidence.state === 'context' ? 'The paragraph location is available, but an exact answer quotation has not been identified.'
    : evidence.state === 'not-given' ? 'NOT GIVEN: the passage does not confirm or contradict this statement. There is no answer sentence to highlight.'
    : evidence.state === 'not-mentioned' ? 'The correct option is not mentioned in the passage, so there is no answer sentence to highlight.'
    : evidence.state === 'key-conflict' ? 'The saved answer key does not match this passage. Evidence cannot be shown for that answer.'
    : 'An exact evidence location is not available for this question yet.'
  useEffect(() => {
    const reveal = () => {
      const container = pane.current
      const mark = container?.querySelector<HTMLElement>('[data-answer-evidence]')
      if (!showAnswers || !container || !mark) return
      const headerHeight = container.querySelector<HTMLElement>('[data-evidence-header]')?.offsetHeight ?? 0
      const rect = mark.getClientRects()[0] ?? mark.getBoundingClientRect()
      const available = container.clientHeight - headerHeight
      container.scrollTop += rect.top - container.getBoundingClientRect().top - headerHeight - Math.max(8, (available - rect.height) / 2)
    }
    reveal()
    window.addEventListener('resize', reveal)
    return () => window.removeEventListener('resize', reveal)
  }, [question?.id, section.id, showAnswers])

  return (
    <div ref={pane} id="answer-evidence-pane" className="reading-pane reading-evidence-pane h-full overflow-y-auto bg-white p-4 sm:p-5 lg:p-6" aria-label="Reading passage and evidence">
      <div data-evidence-header className="sticky -top-4 z-10 -mx-4 -mt-4 mb-5 border-b border-slate-200 bg-white px-4 py-3 sm:-top-5 sm:-mx-5 sm:-mt-5 sm:px-5 lg:-top-6 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            <BookOpen className="h-4 w-4 text-red-600" /> Reading passage{passageNumber ? ` ${passageNumber}` : ''}
          </p>
          {showAnswers && question && <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">Evidence · Q{number}</span>}
        </div>
        <h2 className="mt-2 text-lg font-bold leading-snug text-slate-950 sm:text-xl">{title}</h2>
      </div>
      {showAnswers && question && (
        <div role="status" className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-600">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-semibold text-slate-900">Question {number}</p>
            <p>Correct answer <span className="ml-1 font-bold text-emerald-800">{formatCorrectAnswer(question.correctAnswer)}</span></p>
          </div>
          <p className="mt-1.5">{message}</p>
          {question.explanation && <details className="mt-2 border-t border-slate-200 pt-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-slate-700">Answer explanation <ChevronDown className="h-3.5 w-3.5" /></summary>
            <p className="mt-2 font-normal">{question.explanation}</p>
          </details>}
          {evidence.state === 'context' && question.location && <p className="mt-2 font-medium">{question.location}</p>}
        </div>
      )}
      {!showAnswers && question && <p className="mb-5 text-xs text-slate-500">Show correct answers to reveal evidence for question {number}.</p>}
      <div className="ielts-reading-prose space-y-5 text-slate-800">
        {evidence.blocks.map(block => {
          const label = !section.paragraphs?.length && block.label
            ? section.content?.includes(`[Paragraph ${block.label}]`) ? `[Paragraph ${block.label}]`
              : new RegExp(`(?:^|\\n)\\s*${block.label}\\.\\s`).test(section.content ?? '') ? `${block.label}.` : block.label
            : block.label
          const displayLabel = !section.paragraphs?.length || (showParagraphLabels ?? section.showParagraphLabels !== false)
          const ranges = showAnswers ? evidence.ranges.filter(range => range.blockId === block.id) : []
          let cursor = 0
          const fragments = ranges.flatMap((range, index) => {
            const indices = range.answerIndices ?? (range.answerIndex === undefined ? [] : [range.answerIndex])
            const marker = indices.length ? indices.map(index => (question?.number ?? 0) + index).join(', ') : number
            const before = block.text.slice(cursor, range.start)
            cursor = range.end
            return [before, <mark key={`${block.id}-${index}`} data-answer-evidence={question?.id} className="reading-answer-evidence rounded-sm bg-amber-100 px-0.5 py-0.5 text-slate-950 decoration-amber-500 underline decoration-2 underline-offset-4">
              <span data-question-number={marker} className="mr-1.5 inline-flex min-w-5 items-center justify-center rounded bg-red-600 px-1 align-baseline text-[11px] font-bold leading-5 text-white no-underline before:content-[attr(data-question-number)]" aria-label={`Question ${marker}`} />
              {block.text.slice(range.start, range.end)}
            </mark>]
          })
          return (
            <div key={block.id}>
              <p className="whitespace-pre-wrap leading-8 [overflow-wrap:anywhere]">
                {displayLabel && label && <><span className="mr-2 font-black">{label}</span>{' '}</>}
                {fragments}{block.text.slice(cursor)}{'\n\n'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
