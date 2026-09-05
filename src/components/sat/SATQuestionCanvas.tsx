import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Bookmark, FileImage, ScanText, SpellCheck2 } from 'lucide-react'
import type { HighlightPoint, HighlightStroke, SATQuestion } from '@/features/sat/practiceTest4'
import { splitSATPrompt } from '@/features/sat/promptLayout'
import SATRichText from './SATRichText'
import SATVisual from './SATVisual'

type Props = {
  question: SATQuestion
  answer: string
  onAnswer: (answer: string) => void
  strokes: HighlightStroke[]
  highlightEnabled: boolean
  highlightColor: string
  onChange: (strokes: HighlightStroke[]) => void
  flagged: boolean
  onToggleFlag: () => void
  answerState?: 'correct' | 'incorrect'
  practicePanel?: ReactNode
}

function toPoint(event: ReactPointerEvent<SVGSVGElement>): HighlightPoint {
  const bounds = event.currentTarget.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(1000, ((event.clientX - bounds.left) / bounds.width) * 1000)),
    y: Math.max(0, Math.min(1000, ((event.clientY - bounds.top) / bounds.height) * 1000)),
  }
}

type HighlightSurface = NonNullable<HighlightStroke['surface']>

function HighlightLayer({
  enabled,
  surface,
  color,
  strokes,
  onChange,
}: {
  enabled: boolean
  surface: HighlightSurface
  color: string
  strokes: HighlightStroke[]
  onChange: (strokes: HighlightStroke[]) => void
}) {
  const activeId = useRef<string | null>(null)
  const draftRef = useRef<HighlightStroke | null>(null)
  const [draft, setDraft] = useState<HighlightStroke | null>(null)
  const surfaceStrokes = useMemo(
    () => strokes.filter((stroke) => (stroke.surface ?? 'source') === surface),
    [strokes, surface],
  )
  const displayedStrokes = draft ? [...surfaceStrokes, draft] : surfaceStrokes

  const startStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!enabled) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const next: HighlightStroke = {
      id: crypto.randomUUID(),
      color,
      width: 28,
      points: [toPoint(event)],
      surface,
    }
    activeId.current = next.id
    draftRef.current = next
    setDraft(next)
  }

  const extendStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!enabled || !activeId.current || !draftRef.current) return
    const next = { ...draftRef.current, points: [...draftRef.current.points, toPoint(event)] }
    draftRef.current = next
    setDraft(next)
  }

  const finishStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!activeId.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (draftRef.current?.points.length) onChange([...strokes, draftRef.current])
    activeId.current = null
    draftRef.current = null
    setDraft(null)
  }

  return (
    <svg
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      aria-label={enabled ? 'Highlight drawing surface' : undefined}
      className={`absolute inset-0 z-30 h-full w-full touch-none ${enabled ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
      onPointerDown={startStroke}
      onPointerMove={extendStroke}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
    >
      {displayedStrokes.map((stroke) => (
        <polyline
          key={stroke.id}
          points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.38"
        />
      ))}
    </svg>
  )
}

export default function SATQuestionCanvas({
  question,
  answer,
  onAnswer,
  strokes,
  highlightEnabled,
  highlightColor,
  onChange,
  flagged,
  onToggleFlag,
  answerState,
  practicePanel,
}: Props) {
  const activeId = useRef<string | null>(null)
  const draftRef = useRef<HighlightStroke | null>(null)
  const [draft, setDraft] = useState<HighlightStroke | null>(null)
  const [sourceOpen, setSourceOpen] = useState(false)
  const sourceStrokes = useMemo(
    () => strokes.filter((stroke) => (stroke.surface ?? 'source') === 'source'),
    [strokes],
  )
  const displayedStrokes = useMemo(() => (draft ? [...sourceStrokes, draft] : sourceStrokes), [draft, sourceStrokes])
  const { context, task } = useMemo(() => splitSATPrompt(question.prompt), [question.prompt])

  const startStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!highlightEnabled) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const next: HighlightStroke = {
      id: crypto.randomUUID(),
      color: highlightColor,
      width: 34,
      points: [toPoint(event)],
      surface: 'source',
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

  const originalView = question.asset ? (
    <div className="mt-7 border-t border-slate-300 pt-4">
      <button
        type="button"
        onClick={() => setSourceOpen((open) => !open)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 transition hover:text-blue-700"
      >
        <ScanText className="h-4 w-4" /> {sourceOpen ? 'Hide original paper view' : 'Open original paper view'}
      </button>
      {sourceOpen ? (
        <div className="mt-3 overflow-auto rounded-xl border border-slate-300 bg-slate-200 p-3">
          <div
            className="relative mx-auto origin-top transition-all"
            style={{ width: '100%', maxWidth: `${Math.max(760, question.assetWidth)}px`, aspectRatio: `${question.assetWidth} / ${question.assetHeight}` }}
          >
            <img src={question.asset} alt={`Original paper layout for question ${question.number}`} draggable={false} className="h-full w-full select-none rounded-lg bg-white object-contain" />
            <svg
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className={`absolute inset-0 h-full w-full touch-none rounded-lg ${highlightEnabled ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
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
    </div>
  ) : null

  return (
    <div className="grid min-h-[calc(100vh-12.6rem)] min-w-0 bg-[#f7f8fa] md:grid-cols-2">
      <section className="relative min-w-0 border-b border-slate-300 px-5 py-7 md:border-b-0 md:border-r md:px-8 md:py-8 xl:px-12">
        <HighlightLayer
          enabled={highlightEnabled}
          surface="passage"
          color={highlightColor}
          strokes={strokes}
          onChange={onChange}
        />
        <div className="mx-auto max-w-3xl">
          {question.visual ? (
            <figure className="mb-7 overflow-hidden rounded-xl border border-slate-300 bg-white p-4">
              <SATVisual
                asset={question.visual.asset}
                alt={question.visual.alt}
                className="mx-auto"
                imageClassName="mx-auto max-h-[28rem] w-auto max-w-full object-contain"
              />
              <figcaption className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                <FileImage className="h-4 w-4" /> Reference visual · not drawn to scale unless stated
              </figcaption>
            </figure>
          ) : null}

          {context ? (
            <SATRichText text={context} className="break-words font-serif text-[18px] font-medium leading-[1.65] text-[#171717] sm:text-[19px] lg:text-[20px]" />
          ) : (
            <div className="hidden min-h-24 items-center justify-center text-center font-serif text-sm font-semibold text-slate-400 md:flex">
              Use the question panel to the right.
            </div>
          )}

          {originalView}
        </div>
      </section>

      <section className="relative min-w-0 bg-[#f7f8fa]">
        <HighlightLayer
          enabled={highlightEnabled}
          surface="question"
          color={highlightColor}
          strokes={strokes}
          onChange={onChange}
        />
        <div className="flex min-h-[4.4rem] items-stretch bg-[#ededed]">
          <span className="flex w-14 shrink-0 items-center justify-center bg-black font-serif text-2xl font-bold text-white sm:w-16">
            {question.number}
          </span>
          <button
            type="button"
            onClick={onToggleFlag}
            className={`flex flex-1 items-center gap-2 px-4 text-left font-serif text-base font-bold transition sm:text-lg ${flagged ? 'text-[#3d4fd2]' : 'text-slate-600 hover:text-slate-950'}`}
          >
            <Bookmark className={`h-5 w-5 ${flagged ? 'fill-[#3d4fd2]' : 'fill-slate-500'}`} />
            {flagged ? 'Marked for Review' : 'Mark for Review'}
          </button>
          <span className="m-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-[#f4f4f4] text-slate-600">
            <SpellCheck2 className="h-6 w-6" />
          </span>
        </div>
        <div className="h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" />

        <div className="mx-auto max-w-3xl px-5 py-5 sm:px-8 xl:px-12">
          <SATRichText text={task} className="break-words font-serif text-[19px] font-bold leading-[1.6] text-[#151515] sm:text-[20px] lg:text-[21px]" />

          {question.kind === 'multiple-choice' ? (
            <div className="mt-6 space-y-3.5" role="radiogroup" aria-label={`Question ${question.number} answer choices`}>
              {question.choices.map((choice) => {
                const selected = answer === choice.key
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={choice.key}
                    onClick={() => onAnswer(choice.key)}
                    className={`group flex w-full items-start gap-3 rounded-[0.9rem] bg-transparent px-4 py-3 text-left font-serif transition sm:px-5 ${
                      selected
                        ? answerState === 'correct'
                          ? 'border-[3px] border-emerald-600 bg-emerald-50 text-emerald-900'
                          : answerState === 'incorrect'
                            ? 'border-[3px] border-red-600 bg-red-50 text-red-900'
                            : 'border-[3px] border-[#4053d7] text-[#1f2e8d]'
                        : 'border-2 border-black text-[#171717] hover:bg-white'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                      selected
                        ? answerState === 'correct'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : answerState === 'incorrect'
                            ? 'border-red-600 bg-red-600 text-white'
                            : 'border-[#4053d7] bg-[#4053d7] text-white'
                        : 'border-black bg-transparent text-black'
                    }`}>
                      {choice.key}
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5 text-[17px] font-semibold leading-8 sm:text-[18px]">
                      {choice.image ? <img src={choice.image} alt={`Choice ${choice.key}`} className="mb-2 max-h-56 max-w-full rounded-lg object-contain" /> : null}
                      <SATRichText text={choice.text} />
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mt-8">
              <label htmlFor="student-response" className="font-serif text-base font-bold text-slate-800">Enter your answer</label>
              <input
                id="student-response"
                value={answer}
                onChange={(event) => onAnswer(event.target.value)}
                inputMode="decimal"
                placeholder="e.g. 3/10 or 0.3"
                className={`mt-3 h-16 w-full rounded-xl border-2 px-5 font-serif text-xl font-bold text-black outline-none ${
                  answerState === 'correct'
                    ? 'border-emerald-600 bg-emerald-50 focus:ring-2 focus:ring-emerald-600/20'
                    : answerState === 'incorrect'
                      ? 'border-red-600 bg-red-50 focus:ring-2 focus:ring-red-600/20'
                      : 'border-black bg-white focus:border-[#4053d7] focus:ring-2 focus:ring-[#4053d7]/20'
                }`}
              />
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Fractions and equivalent decimals are accepted.</p>
            </div>
          )}

          {practicePanel}
        </div>
      </section>
    </div>
  )
}
