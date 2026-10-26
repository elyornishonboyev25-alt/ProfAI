import { useId, useState, type ReactNode } from 'react'
import type { Question } from '@/types/ieltsTypes'

type Point = { label: string; x: number; y: number; width: number }
export type SourceMap = {
  id: string
  src: string
  width: number
  height: number
  minWidth: number
  numbers: readonly number[]
  kind: 'words' | 'locations'
  points: readonly Point[]
}

// Coordinates refer to the unchanged source image, never to its answer key.
const maps: SourceMap[] = [
  {
    id: 'british-library', src: '/images/ielts-telegram-16428-image-1.png', width: 924, height: 1023, minWidth: 720,
    numbers: [16, 17, 18, 19, 20], kind: 'words',
    points: [
      { label: '16', x: 682, y: 965, width: 109 },
      { label: '17', x: 564, y: 681, width: 91 },
      { label: '18', x: 173, y: 760, width: 95 },
      { label: '19', x: 432, y: 310, width: 116 },
      { label: '20', x: 250, y: 271, width: 131 },
    ],
  },
  {
    id: 'community-centre', src: '/images/ielts-telegram-16539-image-1.jpg', width: 815, height: 682, minWidth: 680,
    numbers: [15, 16, 17, 18, 19, 20], kind: 'locations',
    points: [
      { label: 'A', x: 76, y: 132, width: 63 }, { label: 'B', x: 529, y: 144, width: 64 },
      { label: 'C', x: 133, y: 306, width: 45 }, { label: 'D', x: 286, y: 237, width: 40 },
      { label: 'E', x: 76, y: 467, width: 64 }, { label: 'F', x: 307, y: 336, width: 67 },
      { label: 'G', x: 673, y: 302, width: 60 }, { label: 'H', x: 372, y: 485, width: 63 },
      { label: 'I', x: 570, y: 485, width: 62 },
    ],
  },
]

export function sourceListeningMapFor(src: string) {
  try { return maps.find(map => map.src === new URL(src, 'https://ivygoo.com').pathname) }
  catch { return undefined }
}

type Props = {
  map: SourceMap
  alt: string
  questions: Question[]
  answers: Record<string, unknown>
  onAnswer: (id: string, value: string | string[]) => void
  onQuestionFocus?: (id: string) => void
  renderFlag?: (question: Question) => ReactNode
  review: boolean
  showCorrectAnswers: boolean
  reviewQuestions?: Map<string, { status: 'correct' | 'incorrect' | 'skipped'; correctAnswer: string | string[] }>
}

export default function SourceListeningMap({ map, alt, questions, answers, onAnswer, onQuestionFocus, renderFlag, review, showCorrectAnswers, reviewQuestions }: Props) {
  const [activeLocation, setActiveLocation] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState('')
  const helpId = useId()
  const lastNumber = map.numbers[map.numbers.length - 1]
  const instructions = `Write question numbers ${map.numbers[0]}–${lastNumber} in the matching places A–I. The answers below update automatically.`
  const invalidNumberMessage = `Use question numbers ${map.numbers[0]}–${lastNumber}.`
  const mapQuestions = questions.filter(question => map.numbers.includes(question.number))
  const statusFor = (question: Question) => review && showCorrectAnswers ? reviewQuestions?.get(question.id)?.status : undefined

  const assignLocation = (letter: string, value: string) => {
    const numbers = [...new Set(value.split(/[,\s]+/).filter(Boolean).map(Number))]
    // A partially typed number must not erase a previously saved answer.
    if (value.trim() && (value.endsWith(',') || numbers.some(number => !mapQuestions.some(question => question.number === number)))) return
    for (const question of mapQuestions) {
      if (numbers.includes(question.number)) onAnswer(question.id, letter)
      else if (String(answers[question.id] ?? '').toUpperCase() === letter) onAnswer(question.id, '')
    }
    const focused = mapQuestions.find(question => question.number === numbers[numbers.length - 1])
    if (focused) onQuestionFocus?.(focused.id)
  }

  return <figure className="source-map" data-source-map-kind={map.kind}>
    {map.kind === 'locations' && <p className="source-map-help" id={helpId} aria-label={instructions} data-instructions={instructions} />}
    {error && <p className="source-map-help" role="alert" aria-label={error} data-instructions={error} />}
    <div className="source-map-scroll" tabIndex={0} aria-label={`${alt}. Scroll horizontally on small screens.`}>
      <div className="source-map-canvas" style={{ minWidth: map.minWidth, maxWidth: map.width, aspectRatio: `${map.width} / ${map.height}` }}>
        <img src={retry ? `${map.src}?retry=${retry}` : map.src} alt={alt} width={map.width} height={map.height}
          className="source-map-image" loading="eager" onError={() => setFailed(true)} />
        {failed ? <div className="source-map-error" role="alert">
          <p aria-label="The map could not load." data-instructions="The map could not load." />
          <button type="button" aria-label="Retry map" data-instructions="Retry map" onClick={() => { setRetry(previous => previous + 1); setFailed(false) }} />
        </div> : map.points.map(point => {
          const question = map.kind === 'words' ? mapQuestions.find(item => item.number === Number(point.label)) : undefined
          const assigned = map.kind === 'locations' ? mapQuestions.filter(item => String(answers[item.id] ?? '').toUpperCase() === point.label) : []
          const statuses = assigned.map(statusFor)
          const status = question ? statusFor(question) : statuses.some(value => value === 'incorrect' || value === 'skipped')
            ? 'incorrect' : statuses.length && statuses.every(value => value === 'correct') ? 'correct' : undefined
          const value = question ? String(answers[question.id] ?? '') : assigned.map(item => item.number).join(', ')
          const correctNumbers = review && showCorrectAnswers && map.kind === 'locations'
            ? mapQuestions.filter(item => item.correctAnswer === point.label).map(item => item.number) : []
          return <div key={point.label} className="source-map-answer" data-diagram-answer={question?.number}
            data-map-location={map.kind === 'locations' ? point.label : undefined}
            style={{ left: `${point.x / map.width * 100}%`, top: `${point.y / map.height * 100}%`, width: `${point.width / map.width * 100}%` }}>
            <input type="text" autoComplete="off" spellCheck={false} disabled={review}
              id={question ? `question-card-${question.id}` : undefined}
              data-map-question={question?.id} data-map-location-input={map.kind === 'locations' ? point.label : undefined}
              aria-label={question ? `Question ${question.number}: ${alt}` : `Location ${point.label}: question numbers`}
              inputMode={map.kind === 'locations' ? 'numeric' : undefined}
              aria-describedby={map.kind === 'locations' ? helpId : undefined}
              aria-invalid={activeLocation === point.label && Boolean(error)}
              placeholder={question ? String(question.number) : '?'}
              data-review-status={status}
              value={map.kind === 'locations' && activeLocation === point.label ? draft : value}
              onFocus={event => {
                event.currentTarget.select()
                if (question) onQuestionFocus?.(question.id)
                else {
                  setActiveLocation(point.label); setDraft(value); setError('')
                  if (assigned[0]) onQuestionFocus?.(assigned[0].id)
                }
              }}
              onChange={event => {
                if (review) return
                if (question) onAnswer(question.id, event.target.value)
                else {
                  const next = event.target.value
                  setDraft(next)
                  if (/[^\d,\s]/.test(next)) { setError(invalidNumberMessage); return }
                  setError(''); assignLocation(point.label, next)
                }
              }}
              onBlur={() => {
                if (map.kind === 'locations' && draft.trim() && (/[^\d,\s]/.test(draft) || draft.endsWith(',') || draft.split(/[,\s]+/).filter(Boolean).some(value => !map.numbers.includes(Number(value))))) {
                  setError(invalidNumberMessage)
                }
                setActiveLocation(null)
              }} />
            {!review && <span className="source-map-flags">{question ? renderFlag?.(question) : assigned.map(item => <span key={item.id}>{renderFlag?.(item)}</span>)}</span>}
            {correctNumbers.length > 0 && correctNumbers.join(', ') !== value && <span className="source-map-correct">Correct: {correctNumbers.join(', ')}</span>}
          </div>
        })}
      </div>
    </div>
    <figcaption className="source-map-mobile-hint" aria-label="Swipe sideways to see the full map." data-instructions="Swipe sideways to see the full map." />
  </figure>
}
