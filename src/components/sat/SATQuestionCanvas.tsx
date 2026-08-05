import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Check, FileImage, ImageOff, ScanText } from 'lucide-react'
import type { HighlightPoint, HighlightStroke, SATQuestion } from '@/features/sat/practiceTest4'
import SATRichText from './SATRichText'

type Props = {
  question: SATQuestion
  answer: string
  onAnswer: (answer: string) => void
  strokes: HighlightStroke[]
  highlightEnabled: boolean
  highlightColor: string
  zoom: number
  onChange: (strokes: HighlightStroke[]) => void
}

function toPoint(event: ReactPointerEvent<SVGSVGElement>): HighlightPoint {
  const bounds = event.currentTarget.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(1000, ((event.clientX - bounds.left) / bounds.width) * 1000)),
    y: Math.max(0, Math.min(1000, ((event.clientY - bounds.top) / bounds.height) * 1000)),
  }
}

function splitPrompt(prompt: string) {
  const clean = prompt
    .replace(/\n(?=•)/g, '\n')
    .replace(/(?<!•)\n(?!•)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const candidates = [
    'Which choice', 'Which equation', 'Which table', 'Which expression', 'Which of the following',
    'What is', 'What was', 'What percentage', 'How many', 'How far', 'For what value', 'Based on',
  ]
  const index = Math.max(...candidates.map((candidate) => clean.lastIndexOf(candidate)))
  if (index <= 0) return { context: '', task: clean }
  return { context: clean.slice(0, index).trim(), task: clean.slice(index).trim() }
}

export default function SATQuestionCanvas({
  question,
  answer,
  onAnswer,
  strokes,
  highlightEnabled,
  highlightColor,
  zoom,
  onChange,
}: Props) {
  const activeId = useRef<string | null>(null)
  const draftRef = useRef<HighlightStroke | null>(null)
  const [draft, setDraft] = useState<HighlightStroke | null>(null)
  const [sourceOpen, setSourceOpen] = useState(false)
  const [visualFailed, setVisualFailed] = useState(false)
  const displayedStrokes = useMemo(() => (draft ? [...strokes, draft] : strokes), [draft, strokes])
  const { context, task } = useMemo(() => splitPrompt(question.prompt), [question.prompt])

  useEffect(() => {
    setVisualFailed(false)
  }, [question.id])

  useEffect(() => {
    if (highlightEnabled) setSourceOpen(true)
  }, [highlightEnabled])

  const startStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!highlightEnabled) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const next: HighlightStroke = {
      id: crypto.randomUUID(),
      color: highlightColor,
      width: 34,
      points: [toPoint(event)],
    }
    activeId.current = next.id
    draftRef.current = next
    setDraft(next)
  }

  const extendStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!highlightEnabled || !activeId.current || !draftRef.current) return
    const next = { ...draftRef.current, points: [...draftRef.current.points, toPoint(event)] }
    draftRef.current = next
    setDraft(next)
  }

  const finishStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!activeId.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (draftRef.current?.points.length) onChange([...strokes, draftRef.current])
    activeId.current = null
    draftRef.current = null
    setDraft(null)
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[1.65rem] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,.07)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-6">
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-700">{question.domain}</span>
        <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-500 ring-1 ring-slate-200">{question.skill}</span>
        <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-500 ring-1 ring-slate-200">{question.difficulty}</span>
      </div>

      <div className="mx-auto min-w-0 max-w-5xl p-4 sm:p-7 lg:p-9">
        {question.visual && !visualFailed ? (
          <figure className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfbfa] p-3 shadow-inner sm:p-5">
            <img
              src={question.visual.asset}
              alt={question.visual.alt}
              onError={() => setVisualFailed(true)}
              className="mx-auto max-h-[30rem] w-auto max-w-full object-contain"
            />
            <figcaption className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
              <FileImage className="h-3.5 w-3.5" /> Reference visual · not drawn to scale unless stated
            </figcaption>
          </figure>
        ) : null}

        {visualFailed ? (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-5 text-xs font-bold text-amber-800">
            <ImageOff className="h-4 w-4" /> The reference visual could not be loaded. Open the original view below.
          </div>
        ) : null}

        {context ? (
          <SATRichText text={context} className="break-words rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-5 font-serif text-[17px] leading-8 text-slate-800 sm:px-7 sm:text-[18px]" />
        ) : null}
        <SATRichText text={task} className={`${context ? 'mt-6' : ''} break-words font-serif text-xl font-semibold leading-8 text-slate-950 sm:text-[22px] sm:leading-9`} />

        {question.kind === 'multiple-choice' ? (
          <div className="mt-7 space-y-3" role="radiogroup" aria-label={`Question ${question.number} answer choices`}>
            {question.choices.map((choice) => {
              const selected = answer === choice.key
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  key={choice.key}
                  onClick={() => onAnswer(choice.key)}
                  className={`group flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition sm:gap-4 sm:p-4 ${
                    selected
                      ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100/80'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${
                    selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-slate-50 text-slate-700 group-hover:border-blue-300'
                  }`}>
                    {selected ? <Check className="h-4 w-4" /> : choice.key}
                  </span>
                  <span className="min-w-0 flex-1 pt-1 font-serif text-[17px] font-medium leading-7 text-slate-800 sm:text-lg">
                    {choice.image ? <img src={choice.image} alt={`Choice ${choice.key}`} className="mb-2 max-h-56 max-w-full rounded-lg object-contain" /> : null}
                    <SATRichText text={choice.text} />
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {question.asset ? <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setSourceOpen((open) => !open)}
          className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 transition hover:text-blue-700"
        >
          <ScanText className="h-3.5 w-3.5" /> {sourceOpen ? 'Hide original paper view' : 'Need the original paper view?'}
        </button>
        {sourceOpen ? (
          <div className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-3">
            <div
              className="relative mx-auto origin-top transition-all"
              style={{ width: `${zoom * 100}%`, maxWidth: `${Math.max(760, question.assetWidth) * zoom}px`, aspectRatio: `${question.assetWidth} / ${question.assetHeight}` }}
            >
              <img src={question.asset} alt={`Original paper layout for question ${question.number}`} draggable={false} className="h-full w-full select-none rounded-xl bg-white object-contain shadow-sm" />
              <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                className={`absolute inset-0 h-full w-full touch-none rounded-xl ${highlightEnabled ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
                onPointerDown={startStroke}
                onPointerMove={extendStroke}
                onPointerUp={finishStroke}
                onPointerCancel={finishStroke}
              >
                {displayedStrokes.map((stroke) => (
                  <polyline key={stroke.id} points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" opacity="0.38" />
                ))}
              </svg>
            </div>
          </div>
        ) : null}
      </div> : null}
    </div>
  )
}
