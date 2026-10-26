import { useEffect, useMemo, useRef } from 'react'
import DOMPurify from 'dompurify'
import type { Question } from '@/types/ieltsTypes'
import { formatCorrectAnswer } from '@/utils/readingReview'
import '@/styles/ielts-source-paper.css'

type Props = {
  html: string
  questions: Question[]
  answers: Record<string, unknown>
  onAnswer: (id: string, value: string | string[]) => void
  onQuestionFocus?: (id: string) => void
  review?: boolean
  showCorrectAnswers?: boolean
  reviewQuestions?: Map<string, { status: 'correct' | 'incorrect' | 'skipped'; correctAnswer: string | string[] }>
}

export function sanitizeSourcePaper(html: string) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'button', 'audio', 'video', 'link', 'style'],
    FORBID_ATTR: ['autofocus', 'form', 'formaction', 'srcset'],
  })
}

/** Keeps source tables, wording and original images while using ProfAI's answer state. */
export default function SourceQuestionLayout({ html, questions, answers, onAnswer, onQuestionFocus, review = false, showCorrectAnswers = false, reviewQuestions }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const safeHtml = useMemo(() => sanitizeSourcePaper(html), [html])
  const byId = useMemo(() => new Map(questions.map(q => [q.id, q])), [questions])

  useEffect(() => {
    const element = root.current
    if (!element) return
    for (const control of element.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-source-question]')) {
      const id = control.dataset.sourceQuestion!
      const question = byId.get(id)
      if (!question) continue
      const answer = answers[id]
      control.disabled = review
      control.setAttribute('aria-label', `Question ${question.number}: ${question.text}`)
      if (control instanceof HTMLInputElement && (control.type === 'radio' || control.type === 'checkbox')) {
        control.checked = Array.isArray(answer) ? answer.includes(control.value) : answer === control.value
      } else {
        const value = typeof answer === 'string' ? answer : ''
        if (control.value !== value) control.value = value
      }
      const status = review && showCorrectAnswers ? reviewQuestions?.get(id)?.status : undefined
      if (status) control.dataset.reviewStatus = status
      else delete control.dataset.reviewStatus
    }
    for (const hint of element.querySelectorAll<HTMLElement>('[data-source-feedback]')) {
      const question = byId.get(hint.dataset.sourceFeedback!)
      hint.hidden = !review || !showCorrectAnswers || !question
      hint.textContent = review && showCorrectAnswers && question ? `Correct: ${formatCorrectAnswer(question.correctAnswer)}` : ''
    }
  }, [safeHtml, answers, byId, review, showCorrectAnswers, reviewQuestions])

  useEffect(() => {
    const element = root.current
    if (!element || review) return
    const change = (event: Event) => {
      const control = event.target
      if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return
      const id = control.dataset.sourceQuestion
      if (!id || !byId.has(id)) return
      if (control instanceof HTMLInputElement && control.type === 'checkbox') {
        const checked = [...element.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-source-question]')].filter(input => input.dataset.sourceQuestion === id && input.checked)
        const correct = byId.get(id)!.correctAnswer
        const maximum = Array.isArray(correct) ? correct.length : 1
        if (checked.length > maximum) { control.checked = false; return }
        onAnswer(id, checked.map(input => input.value))
      } else if (!(control instanceof HTMLInputElement) || control.type !== 'radio' || control.checked) {
        onAnswer(id, control.value)
      }
    }
    const focus = (event: FocusEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && target.dataset.sourceQuestion) onQuestionFocus?.(target.dataset.sourceQuestion)
    }
    element.addEventListener('input', change)
    element.addEventListener('change', change)
    element.addEventListener('focusin', focus)
    return () => {
      element.removeEventListener('input', change)
      element.removeEventListener('change', change)
      element.removeEventListener('focusin', focus)
    }
  }, [safeHtml, byId, onAnswer, onQuestionFocus, review])

  return <div ref={root} className="ielts-source-paper" dangerouslySetInnerHTML={{ __html: safeHtml }} />
}
