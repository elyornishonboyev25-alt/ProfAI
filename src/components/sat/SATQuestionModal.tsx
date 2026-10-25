import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Flag,
  Lightbulb,
  MessageSquareText,
  X,
  XCircle,
} from 'lucide-react'
import { readSATNotes } from '@/features/sat/notes'
import { satAnswerStatus } from '@/features/sat/resultAnalysis'
import { isSATAnswerCorrect, type SATAttempt, type SATModule, type SATQuestion } from '@/features/sat/practiceTest4'
import { splitSATPrompt } from '@/features/sat/promptLayout'
import { SATNoteList } from './SATNotes'
import SATRichText from './SATRichText'
import SATSourceContent from './SATSourceContent'
import SATChoiceContent from './SATChoiceContent'
import SATVisual from './SATVisual'
import SATTextHighlights from './SATTextHighlights'
import './SATQuestionModal.css'

const STATUS = {
  correct: { label: 'Correct', icon: CheckCircle2 },
  incorrect: { label: 'Incorrect', icon: XCircle },
  unanswered: { label: 'Unanswered', icon: CircleDashed },
} as const

function ReviewQuestion({ question, attempt }: { question: SATQuestion; attempt: SATAttempt }) {
  const response = attempt.answers[question.id]?.trim()
  const eliminated = attempt.eliminatedChoices?.[question.id] ?? []
  const note = attempt.notes[question.id]
  const { context, task } = splitSATPrompt(question.prompt)
  const correct = isSATAnswerCorrect(question, response)
  const alternatives = [...new Set(question.acceptedAnswers ?? [])].filter(
    (answer) => answer !== question.correctAnswer,
  )
  return (
    <SATTextHighlights key={question.id} strokes={attempt.highlights[question.id] ?? []} enabled={false}>
      <div className="sqm-question">
        <div className="sqm-tags">
          <span className="sqm-tag is-domain">{question.domain}</span>
          <span className="sqm-tag">{question.skill}</span>
          <span className="sqm-tag is-level">{question.difficulty}</span>
        </div>
        {question.visual ? (
          <SATVisual
            asset={question.visual.asset}
            alt={question.visual.alt}
            className="sqm-visual"
            imageClassName="max-h-[20rem] max-w-[min(100%,42rem)] object-contain"
          />
        ) : null}
        {question.sourceContent ? (
          <>
            <div data-sat-highlight-block="context">
              {question.sourceContent.context && (
                <SATSourceContent html={question.sourceContent.context} className="sqm-passage" />
              )}
            </div>
            <div data-sat-highlight-block="task">
              <SATSourceContent html={question.sourceContent.task} className="sqm-task" />
            </div>
          </>
        ) : (
          <>
            <div data-sat-highlight-block="context">
              {context ? <SATRichText text={context} className="sqm-passage" /> : null}
            </div>
            <div data-sat-highlight-block="task">
              <SATRichText text={task} className="sqm-task" />
            </div>
          </>
        )}

        {question.kind === 'multiple-choice' ? (
          <div className="sqm-choices">
            {question.choices.map((choice) => {
              const isKey = choice.key === question.correctAnswer
              const isMine = choice.key === response?.toUpperCase()
              const tone = isKey ? 'is-key' : isMine ? 'is-wrong' : ''
              return (
                <div key={choice.key} className={`sqm-choice ${tone}`}>
                  <span className="sqm-choice-key">{choice.key}</span>
                  <div data-sat-highlight-block={`choice-${choice.key}`} className="sqm-choice-text">
                    <SATChoiceContent choice={choice} />
                    {eliminated.includes(choice.key) ? <small>Crossed out during the test</small> : null}
                  </div>
                  {(isMine || isKey) && (
                    <span className="sqm-choice-label">
                      {isKey ? (isMine ? 'Your answer · Correct' : 'Correct answer') : 'Your answer'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="sqm-free">
            <div className={`sqm-free-card ${correct ? 'is-key' : response ? 'is-wrong' : ''}`}>
              <span>Your response</span>
              <strong>{response || 'No response'}</strong>
            </div>
            <div className="sqm-free-card is-key">
              <span>Correct answer</span>
              <strong>{question.correctAnswer}</strong>
              {alternatives.length > 0 && <small>Also accepted: {alternatives.join(', ')}</small>}
            </div>
          </div>
        )}

        <section className="sqm-explanation">
          <div className="sqm-explanation-head">
            <span>
              <BookOpenCheck size={19} />
            </span>
            <div>
              <p>Answer explanation</p>
              <h3>Why this answer works</h3>
            </div>
          </div>
          {question.sourceContent ? (
            <SATSourceContent html={question.sourceContent.explanation} className="sqm-explanation-body" />
          ) : (
            <SATRichText text={question.explanation || 'Explanation unavailable.'} className="sqm-explanation-body" />
          )}
          <p className="sqm-tip">
            <Lightbulb size={16} />
            Say the rule in your own words before you move on — that is what makes it stick.
          </p>
        </section>

        {readSATNotes(note).length ? (
          <section className="sqm-notes">
            <p>Your test-day notes</p>
            <SATNoteList value={note} />
          </section>
        ) : null}
      </div>
    </SATTextHighlights>
  )
}

export default function SATQuestionModal({
  questions,
  index,
  attempt,
  modules,
  onIndexChange,
  onClose,
  onDiscuss,
}: {
  questions: SATQuestion[]
  index: number
  attempt: SATAttempt
  modules: SATModule[]
  onIndexChange: (next: number) => void
  onClose: () => void
  onDiscuss: (question: SATQuestion) => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const question = questions[index]
  const module = modules.find((m) => m.id === question?.moduleId)
  const status = question ? satAnswerStatus(question, attempt) : 'unanswered'
  const StatusIcon = STATUS[status].icon
  const hasPrevious = index > 0
  const hasNext = index < questions.length - 1

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previousFocus?.focus?.()
    }
  }, [])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [index])

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft' && hasPrevious) onIndexChange(index - 1)
      else if (event.key === 'ArrowRight' && hasNext) onIndexChange(index + 1)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasNext, hasPrevious, index, onClose, onIndexChange])

  if (!question) return null
  const title = `${module?.shortTitle ?? 'Question'} · Question ${question.number}`

  return createPortal(
    <div className="sqm-root" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="sqm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], select, textarea, input, [tabindex]:not([tabindex="-1"])',
          )
          if (!focusable?.length) return
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }}
      >
        <header className="sqm-header">
          <div className="sqm-heading">
            <span className={`sqm-module ${question.section === 'math' ? 'is-math' : ''}`}>{module?.title}</span>
            <h2>
              Question {question.number}
              {attempt.flagged.includes(question.id) && <Flag size={16} aria-label="Flagged" />}
            </h2>
          </div>
          <div className="sqm-header-actions">
            <span className={`sqm-status is-${status}`}>
              <StatusIcon size={15} />
              {STATUS[status].label}
            </span>
            <button type="button" className="sqm-icon-button" aria-label="Close question" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </header>
        <div ref={bodyRef} className="sqm-body">
          <ReviewQuestion question={question} attempt={attempt} />
        </div>
        <footer className="sqm-footer">
          <button
            type="button"
            className="sqm-nav"
            disabled={!hasPrevious}
            aria-label="Previous question"
            onClick={() => onIndexChange(index - 1)}
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>
          <div className="sqm-progress">
            <strong>
              {index + 1} <span>/ {questions.length}</span>
            </strong>
            <button type="button" className="sqm-discuss" onClick={() => onDiscuss(question)}>
              <MessageSquareText size={15} />
              Discuss
            </button>
          </div>
          <button
            type="button"
            className="sqm-nav is-next"
            disabled={!hasNext}
            aria-label="Next question"
            onClick={() => onIndexChange(index + 1)}
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
