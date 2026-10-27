import { useRef, useState } from 'react'
import SourceMapDrawing from './SourceMapDrawing'
import type { SourceListeningMapProps } from './SourceListeningMap'
import { formatCorrectAnswer } from '@/utils/readingReview'

/** Keep the complete portrait plan and full-width answers visible together. */
export default function SourceWordMapWorkspace({ map, alt, questions, answers, onAnswer, onQuestionFocus, renderFlag, review, showCorrectAnswers, reviewQuestions }: SourceListeningMapProps) {
  const [active, setActive] = useState<string | null>(null)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const workspace = useRef<HTMLElement>(null)
  return <figure ref={workspace} className="source-map source-word-map" data-source-map-kind={map.kind} data-annotation-ignore="true">
    <div className="source-word-map-preview">
      <div className="source-map-canvas source-word-map-canvas">
        <SourceMapDrawing id={map.id} alt={alt} />
        {map.points.map(point => {
          const question = questions.find(item => item.number === Number(point.label))
          if (!question) return null
          return <button key={point.label} type="button" className="source-word-map-marker" aria-label={`Question ${question.number} on map`}
            data-active={active === question.id} data-map-marker={question.id}
            style={{ left: `${point.x / map.width * 100}%`, top: `${point.y / map.height * 100}%`, width: `${point.width / map.width * 100}%` }}
            onClick={() => {
              setActive(question.id); onQuestionFocus?.(question.id)
              inputs.current.get(question.id)?.focus({ preventScroll: true })
            }} />
        })}
      </div>
    </div>
    <div className="source-word-map-fields" role="group" aria-label="Map answers">
      {questions.map(question => {
        const status = review && showCorrectAnswers ? reviewQuestions?.get(question.id)?.status : undefined
        return <div key={question.id} className="source-word-map-field" data-active={active === question.id} data-diagram-answer={question.number}>
          <div className="source-word-map-field-heading"><label htmlFor={`question-card-${question.id}`}>Question {question.number}</label>{!review && renderFlag?.(question)}</div>
          <input ref={node => { if (node) inputs.current.set(question.id, node); else inputs.current.delete(question.id) }}
            id={`question-card-${question.id}`} data-map-question={question.id} type="text" autoComplete="off" spellCheck={false}
            placeholder={String(question.number)} aria-label={`Question ${question.number}: ${alt}`} disabled={review} data-review-status={status}
            value={String(answers[question.id] ?? '')} onFocus={() => {
              setActive(question.id); onQuestionFocus?.(question.id)
              workspace.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
            }}
            onChange={event => { if (!review) onAnswer(question.id, event.target.value) }} />
          {review && showCorrectAnswers && status !== 'correct' && <span className="source-map-question-correct">Correct: {formatCorrectAnswer(reviewQuestions?.get(question.id)?.correctAnswer ?? question.correctAnswer)}</span>}
        </div>
      })}
    </div>
  </figure>
}
