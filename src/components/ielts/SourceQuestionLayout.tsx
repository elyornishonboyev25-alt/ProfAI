import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import DOMPurify from 'dompurify'
import type { Question } from '@/types/ieltsTypes'
import { formatCorrectAnswer } from '@/utils/readingReview'
import SourceListeningMap, { sourceListeningMapFor, type SourceMap } from './SourceListeningMap'
import '@/styles/ielts-source-paper.css'

type Props = {
  html: string
  questions: Question[]
  answers: Record<string, unknown>
  onAnswer: (id: string, value: string | string[]) => void
  onQuestionFocus?: (id: string) => void
  flaggedQuestionIds?: ReadonlySet<string>
  onFlagQuestion?: (id: string) => void
  review?: boolean
  showCorrectAnswers?: boolean
  reviewQuestions?: Map<string, { status: 'correct' | 'incorrect' | 'skipped'; correctAnswer: string | string[] }>
}

export function sanitizeSourcePaper(html: string) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'button', 'audio', 'video', 'link', 'style'],
    FORBID_ATTR: ['autofocus', 'form', 'formaction', 'srcset', 'style'],
  })
}

/** Preserve the source copy and tables while giving controls the shared exam presentation. */
function prepareSourcePaper(html: string, questions: Question[]) {
  const template = document.createElement('template')
  template.innerHTML = sanitizeSourcePaper(html)
  const fragment = template.content
  const maps: { key: string; map: SourceMap; alt: string }[] = []
  for (const image of fragment.querySelectorAll<HTMLImageElement>('img')) {
    const map = sourceListeningMapFor(image.getAttribute('src') ?? '')
    if (!map || maps.some(item => item.map.id === map.id)) continue
    const key = `${map.id}-${maps.length}`
    const mount = document.createElement('div')
    mount.dataset.sourceMapHost = key
    const wrapper = image.closest('.task-img-wrap') ?? image
    wrapper.replaceWith(mount)
    maps.push({ key, map, alt: image.alt })
    if (map.kind === 'words') for (const question of questions.filter(item => map.numbers.includes(item.number))) {
      const control = [...fragment.querySelectorAll<HTMLElement>('[data-source-question]')].find(item => item.dataset.sourceQuestion === question.id)
      if (!control) continue
      const row = control.closest<HTMLElement>('.source-line,li,tr,p')
      if (row) {
        row.classList.add('source-map-summary')
        row.closest('.notes-block')?.classList.add('source-map-review-list')
        const answer = document.createElement('span')
        answer.dataset.sourceUserAnswer = question.id
        control.replaceWith(answer)
      } else control.remove()
    }
  }
  const seen = new Set<string>()
  for (const control of fragment.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-source-question]')) {
    control.classList.add('source-answer-control')
    control.setAttribute('autocomplete', 'off')
    control.setAttribute('spellcheck', 'false')
    const id = control.dataset.sourceQuestion!
    if (seen.has(id)) continue
    seen.add(id)
    const row = control.closest<HTMLElement>('.mc-question,.tfng-row,.help-select-row,.source-line,tr,li,p')
    row?.setAttribute('data-source-row', id)
    const flag = document.createElement('span')
    flag.dataset.sourceFlag = id
    flag.className = 'source-flag-mount'
    if (row?.matches('.mc-question,.tfng-row,.help-select-row')) row.prepend(flag)
    else control.after(flag)
  }
  for (const table of fragment.querySelectorAll('table')) {
    const scroll = document.createElement('div')
    scroll.className = 'source-table-scroll'
    scroll.tabIndex = 0
    scroll.setAttribute('aria-label', 'Questions table. Scroll horizontally on small screens.')
    table.replaceWith(scroll)
    scroll.append(table)
  }
  return { html: template.innerHTML, maps }
}

/** Keeps source tables, wording and original images while using ProfAI's answer state. */
export default function SourceQuestionLayout({ html, questions, answers, onAnswer, onQuestionFocus, flaggedQuestionIds, onFlagQuestion, review = false, showCorrectAnswers = false, reviewQuestions }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const layout = useMemo(() => prepareSourcePaper(html, questions), [html, questions])
  const safeHtml = layout.html
  const byId = useMemo(() => new Map(questions.map(q => [q.id, q])), [questions])
  const [targets, setTargets] = useState<{ flags: HTMLElement[]; maps: HTMLElement[] }>({ flags: [], maps: [] })

  useLayoutEffect(() => {
    setTargets({
      flags: [...root.current!.querySelectorAll<HTMLElement>('[data-source-flag]')],
      maps: [...root.current!.querySelectorAll<HTMLElement>('[data-source-map-host]')],
    })
  }, [safeHtml])

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
        const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer : question.correctAnswer.split(' / ')
        const label = control.closest('label')
        if (label) {
          const state = review && showCorrectAnswers ? correct.includes(control.value) ? 'correct' : control.checked ? 'incorrect' : '' : control.checked ? 'selected' : ''
          if (state) label.dataset.sourceOptionState = state
          else delete label.dataset.sourceOptionState
        }
      } else {
        let value = typeof answer === 'string' || typeof answer === 'number' ? String(answer) : ''
        if (control instanceof window.HTMLSelectElement) value = [...control.options].find(option => option.value.toLowerCase() === value.toLowerCase())?.value ?? value
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
    for (const answer of element.querySelectorAll<HTMLElement>('[data-source-user-answer]')) {
      answer.textContent = review ? String(answers[answer.dataset.sourceUserAnswer!] || '—') : ''
    }
    for (const row of element.querySelectorAll<HTMLElement>('[data-source-row]')) {
      row.dataset.flagged = String(flaggedQuestionIds?.has(row.dataset.sourceRow!) ?? false)
    }
  }, [safeHtml, answers, byId, review, showCorrectAnswers, reviewQuestions, flaggedQuestionIds, targets])

  useEffect(() => {
    const element = root.current
    if (!element || review) return
    const change = (event: Event) => {
      const control = event.target
      if (!(control instanceof HTMLInputElement || control instanceof window.HTMLSelectElement)) return
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

  const flag = (question: Question) => !review && onFlagQuestion ? <button type="button" className="source-question-flag"
    aria-label={`Flag question ${question.number}`} aria-pressed={flaggedQuestionIds?.has(question.id) ?? false}
    onClick={event => { event.stopPropagation(); onFlagQuestion(question.id) }}>
    <BookmarkIcon className="h-4 w-4" />
  </button> : null

  return <>
    <div ref={root} className="ielts-source-paper" data-review={review} data-show-correct={showCorrectAnswers} dangerouslySetInnerHTML={{ __html: safeHtml }} />
    {targets.flags.map(target => {
      const question = byId.get(target.dataset.sourceFlag!)
      return question ? createPortal(flag(question), target, question.id) : null
    })}
    {targets.maps.map(target => {
      const descriptor = layout.maps.find(item => item.key === target.dataset.sourceMapHost)
      return descriptor ? createPortal(<SourceListeningMap map={descriptor.map} alt={descriptor.alt} questions={questions} answers={answers} onAnswer={onAnswer}
        onQuestionFocus={onQuestionFocus} renderFlag={flag} review={review} showCorrectAnswers={showCorrectAnswers} reviewQuestions={reviewQuestions} />, target, descriptor.key) : null
    })}
  </>
}
