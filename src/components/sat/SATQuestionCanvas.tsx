import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Bookmark, FileImage, SpellCheck2 } from 'lucide-react'
import type { HighlightPoint, HighlightStroke, SATQuestion } from '@/features/sat/practiceTest4'
import { splitSATPrompt } from '@/features/sat/promptLayout'
import SATRichText from './SATRichText'
import SATSourceContent from './SATSourceContent'
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
  const { context, task } = useMemo(() => splitSATPrompt(question.prompt), [question.prompt])
  const hasSeparateSource = question.section !== 'math' && Boolean(question.visual || question.sourceContent?.context?.trim() || context.trim())

  return (
    <div className={`sat-exam-canvas grid min-h-full min-w-0 bg-[#f7f8fa] ${hasSeparateSource ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
      {hasSeparateSource ? <section className="relative min-w-0 border-b border-slate-300 px-5 py-5 md:border-b-0 md:border-r md:px-8 xl:px-10">
        <HighlightLayer
          enabled={highlightEnabled}
          surface="passage"
          color={highlightColor}
          strokes={strokes}
          onChange={onChange}
        />
        <div className="mx-auto max-w-[42rem]">
          {question.visual ? (
            <figure className="mx-auto mb-5 w-fit max-w-full overflow-hidden rounded-xl border border-slate-300 bg-white p-2.5">
              <SATVisual
                asset={question.visual.asset}
                alt={question.visual.alt}
                className="mx-auto"
                imageClassName="sat-exam-visual mx-auto w-auto max-w-full object-contain"
              />
              <figcaption className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                <FileImage className="h-4 w-4" /> Reference visual · not drawn to scale unless stated
              </figcaption>
            </figure>
          ) : null}

          {question.sourceContent?.context ? (
            <SATSourceContent html={question.sourceContent.context} className="font-serif text-[17px] font-medium leading-[1.5] text-[#171717] sm:text-[18px]" />
          ) : !question.sourceContent && context ? (
            <SATRichText text={context} className="break-words font-serif text-[17px] font-medium leading-[1.5] text-[#171717] sm:text-[18px]" />
          ) : null}

        </div>
      </section> : null}

      <section className="relative min-w-0 bg-[#f7f8fa]">
        <HighlightLayer
          enabled={highlightEnabled}
          surface="question"
          color={highlightColor}
          strokes={strokes}
          onChange={onChange}
        />
        <div className="flex min-h-[3.6rem] items-stretch bg-[#ededed]">
          <span className="flex w-12 shrink-0 items-center justify-center bg-black font-serif text-xl font-bold text-white sm:w-14">
            {question.number}
          </span>
          <button
            type="button"
            onClick={onToggleFlag}
            className={`flex flex-1 items-center gap-2 px-4 text-left font-serif text-sm font-bold transition sm:text-base ${flagged ? 'text-[#3d4fd2]' : 'text-slate-600 hover:text-slate-950'}`}
          >
            <Bookmark className={`h-5 w-5 ${flagged ? 'fill-[#3d4fd2]' : 'fill-slate-500'}`} />
            {flagged ? 'Marked for Review' : 'Mark for Review'}
          </button>
          <span className="m-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-[#f4f4f4] text-slate-600">
            <SpellCheck2 className="h-5 w-5" />
          </span>
        </div>
        <div className="h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" />

        <div className={`mx-auto px-5 py-4 sm:px-8 ${hasSeparateSource ? 'max-w-[42rem]' : 'max-w-[44rem]'}`}>
          {!hasSeparateSource && question.visual ? <figure className="mx-auto mb-4 w-fit max-w-full rounded-xl border border-slate-300 bg-white p-2.5"><SATVisual asset={question.visual.asset} alt={question.visual.alt} className="mx-auto" imageClassName="sat-exam-visual mx-auto w-auto max-w-full object-contain" /></figure> : null}
          {!hasSeparateSource && (question.sourceContent?.context ? <SATSourceContent html={question.sourceContent.context} className="mb-4 font-serif text-[17px] leading-[1.5] text-[#171717] sm:text-[18px]" /> : context ? <SATRichText text={context} className="mb-4 font-serif text-[17px] leading-[1.5] text-[#171717] sm:text-[18px]" /> : null)}
          {question.sourceContent ? (
            <SATSourceContent html={question.sourceContent.task} className="font-serif text-[17px] font-bold leading-[1.45] text-[#151515] sm:text-[18px]" />
          ) : <SATRichText text={task} className="break-words font-serif text-[17px] font-bold leading-[1.45] text-[#151515] sm:text-[18px]" />}

          {question.kind === 'multiple-choice' ? (
            <div className="mt-4 space-y-2" role="radiogroup" aria-label={`Question ${question.number} answer choices`}>
              {question.choices.map((choice) => {
                const selected = answer === choice.key
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={choice.key}
                    onClick={() => onAnswer(choice.key)}
                    className={`group flex w-full items-start gap-3 rounded-[0.9rem] bg-transparent px-3 py-2.5 text-left font-serif transition sm:px-4 ${
                      selected
                        ? answerState === 'correct'
                          ? 'border-[3px] border-emerald-600 bg-emerald-50 text-emerald-900'
                          : answerState === 'incorrect'
                            ? 'border-[3px] border-red-600 bg-red-50 text-red-900'
                            : 'border-[3px] border-[#4053d7] text-[#1f2e8d]'
                        : 'border-2 border-black text-[#171717] hover:bg-white'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
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
                    <span className="min-w-0 flex-1 pt-0.5 text-[16px] font-semibold leading-6 sm:text-[17px]">
                      {choice.image ? <img src={choice.image} alt={`Choice ${choice.key}`} className="mb-2 max-h-48 max-w-full rounded-lg object-contain" /> : null}
                      {choice.html ? <SATSourceContent html={choice.html} /> : <SATRichText text={choice.text} />}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="mt-5">
              <label htmlFor="student-response" className="font-serif text-base font-bold text-slate-800">Enter your answer</label>
              <input
                id="student-response"
                value={answer}
                onChange={(event) => onAnswer(event.target.value)}
                inputMode="decimal"
                placeholder="e.g. 3/10 or 0.3"
                className={`mt-2 h-12 w-full rounded-xl border-2 px-4 font-serif text-lg font-bold text-black outline-none ${
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
