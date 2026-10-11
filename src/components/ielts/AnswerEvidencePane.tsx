import { useEffect, useMemo, useRef } from 'react'
import { BookOpen } from 'lucide-react'
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
    <div ref={pane} id="answer-evidence-pane" className="reading-pane h-full overflow-y-auto bg-white p-4 sm:p-5 lg:p-6" aria-label="Reading passage and evidence">
      <div data-evidence-header className="sticky top-0 z-10 -mt-1 mb-5 border-b border-red-100 bg-white/95 pb-3 backdrop-blur-sm">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-red-600">
          <BookOpen className="h-4 w-4" /> Reading passage
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-900">{section.title}</h2>
        {question && <p className="mt-2 text-xs font-semibold text-slate-600">Question {number} · {showAnswers ? formatCorrectAnswer(question.correctAnswer) : 'Show correct answers to reveal evidence'}</p>}
      </div>
      {showAnswers && question && (
        <div role="status" className="mb-5 rounded-xl border border-red-100 bg-red-50/60 p-3 text-sm leading-6 text-slate-700">
          {evidence.state === 'answer' ? 'The highlighted words are in the source text.'
            : evidence.state === 'context' ? 'The highlighted paragraph is the source location for this question. Compare its meaning with the question on the right.'
            : evidence.state === 'not-given' ? 'NOT GIVEN: the passage does not provide enough information to confirm or contradict this statement. There is no answer sentence to highlight.'
            : evidence.state === 'not-mentioned' ? 'This question asks which option is not mentioned. Compare the options with the full passage; the missing information has no sentence to highlight.'
            : evidence.state === 'key-conflict' ? 'The saved answer key does not match the source passage for this question. No highlight is shown as proof of that answer. This item needs checking.'
            : 'An exact evidence location is not available for this question yet. Read the source and compare it with the explanation below.'}
          {question.explanation && <p className="mt-2 border-t border-red-100 pt-2">{question.explanation}</p>}
          {question.location && <p className="mt-2 text-xs font-semibold text-red-700">{question.location}</p>}
        </div>
      )}
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
            const marker = range.answerIndex !== undefined ? String((question?.number ?? 0) + range.answerIndex) : number
            const before = block.text.slice(cursor, range.start)
            cursor = range.end
            return [before, <mark key={`${block.id}-${index}`} data-answer-evidence={question?.id} className="rounded-md bg-amber-100 px-0.5 py-0.5 text-slate-900 ring-1 ring-amber-300">
              <span data-question-number={marker} className="mr-1 inline-flex min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 align-baseline text-[11px] font-black text-white before:content-[attr(data-question-number)]" aria-label={`Question ${marker}`} />
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
