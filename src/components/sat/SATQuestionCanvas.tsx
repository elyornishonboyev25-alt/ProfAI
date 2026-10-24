import { useMemo, useState, type ReactNode } from 'react'
import { Bookmark, FileImage, Undo2 } from 'lucide-react'
import type { HighlightStroke, SATQuestion } from '@/features/sat/practiceTest4'
import { splitSATPrompt } from '@/features/sat/promptLayout'
import SATRichText from './SATRichText'
import SATSourceContent from './SATSourceContent'
import SATVisual from './SATVisual'
import SATChoiceContent from './SATChoiceContent'
import SATTextHighlights from './SATTextHighlights'
import './SATQuestionCanvas.css'

type Props = {
  question: SATQuestion
  answer: string
  onAnswer: (answer: string) => void
  strokes: HighlightStroke[]
  eliminatedChoices?: string[]
  onEliminatedChoicesChange?: (choices: string[]) => void
  highlightAvailable?: boolean
  onChange: (strokes: HighlightStroke[]) => void
  flagged: boolean
  onToggleFlag: () => void
  readOnly?: boolean
  answerState?: 'correct' | 'incorrect'
  practicePanel?: ReactNode
  practiceLayout?: boolean
}

// Preserve drawings in existing in-progress attempts; new highlights use text ranges.
function HighlightLayer({ surface, strokes }: { surface: 'passage' | 'question'; strokes: HighlightStroke[] }) {
  return <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-30 h-full w-full">
    {strokes.filter(stroke => !stroke.textRange && (stroke.surface ?? 'source') === surface).map(stroke =>
      <polyline key={stroke.id} points={stroke.points.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" opacity="0.38" />)}
  </svg>
}

export default function SATQuestionCanvas({
  question,
  answer,
  onAnswer,
  strokes,
  eliminatedChoices = [],
  onEliminatedChoicesChange,
  highlightAvailable = true,
  onChange,
  flagged,
  onToggleFlag,
  answerState,
  readOnly = false,
  practicePanel,
  practiceLayout = false,
}: Props) {
  const [eliminatorOpen, setEliminatorOpen] = useState(false)
  const { context, task } = useMemo(() => splitSATPrompt(question.prompt), [question.prompt])
  const hasSeparateSource = question.section !== 'math' && Boolean(question.visual || question.sourceContent?.context?.trim() || context.trim())

  return (
    <SATTextHighlights key={question.id} strokes={strokes} onChange={onChange} enabled={highlightAvailable}>
    <div className={`sat-exam-canvas ${practiceLayout ? 'sat-bank-canvas' : ''} grid min-h-full min-w-0 bg-[#f7f8fa] ${hasSeparateSource && !practiceLayout ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
      {hasSeparateSource ? <section className="sat-question-source relative min-w-0 border-b border-slate-300 px-5 py-5 md:border-b-0 md:border-r md:px-8 xl:px-10">
        <HighlightLayer
          surface="passage"
          strokes={strokes}
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

          <div data-sat-highlight-block="context">
          {question.sourceContent?.context ? (
            <SATSourceContent html={question.sourceContent.context} className="font-serif text-[17px] font-medium leading-[1.5] text-[#171717] sm:text-[18px]" />
          ) : !question.sourceContent && context ? (
            <SATRichText text={context} className="break-words font-serif text-[17px] font-medium leading-[1.5] text-[#171717] sm:text-[18px]" />
          ) : null}
          </div>

        </div>
      </section> : null}

      <section className="sat-question-panel relative min-w-0 bg-[#f7f8fa]">
        <HighlightLayer
          surface="question"
          strokes={strokes}
        />
        <div className="sat-question-toolbar flex min-h-[3.6rem] items-stretch bg-[#ededed]">
          <span className="sat-question-number flex w-12 shrink-0 items-center justify-center bg-black font-serif text-xl font-bold text-white sm:w-14">
            {question.number}
          </span>
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={flagged}
            disabled={readOnly}
            className={`sat-question-bookmark flex flex-1 items-center gap-2 px-4 text-left font-serif text-sm font-bold transition sm:text-base ${flagged ? 'text-[#3d4fd2]' : 'text-slate-600 hover:text-slate-950'}`}
          >
            <Bookmark className={`h-5 w-5 ${flagged ? 'fill-[#3d4fd2]' : 'fill-slate-500'}`} />
            {readOnly ? 'Answer review' : flagged ? 'Marked for Review' : 'Mark for Review'}
          </button>
          {!readOnly && question.kind === 'multiple-choice' && onEliminatedChoicesChange ? <button
            type="button"
            aria-label="Answer eliminator"
            title="Cross out answer choices"
            aria-pressed={eliminatorOpen}
            onClick={() => setEliminatorOpen((open) => !open)}
            className={`m-1.5 flex h-10 w-12 shrink-0 items-center justify-center rounded-xl border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${eliminatorOpen ? 'border-[#4053d7] bg-[#e8ecff] text-[#4053d7]' : 'border-slate-300 bg-[#f4f4f4] text-slate-600 hover:bg-white'}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 16 6-13 6 13M8 12h8M4 19h16M4 22h16" />
            </svg>
          </button> : null}
        </div>
        {!practiceLayout ? <div className="h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" /> : null}

        <div className={`sat-question-body mx-auto px-5 py-4 sm:px-8 ${hasSeparateSource ? 'max-w-[42rem]' : 'max-w-[44rem]'}`}>
          {!hasSeparateSource && question.visual ? <figure className="mx-auto mb-4 w-fit max-w-full rounded-xl border border-slate-300 bg-white p-2.5"><SATVisual asset={question.visual.asset} alt={question.visual.alt} className="mx-auto" imageClassName="sat-exam-visual mx-auto w-auto max-w-full object-contain" /></figure> : null}
          <div data-sat-highlight-block={hasSeparateSource ? undefined : "context"}>{!hasSeparateSource && (question.sourceContent?.context ? <SATSourceContent html={question.sourceContent.context} className="mb-4 font-serif text-[17px] leading-[1.5] text-[#171717] sm:text-[18px]" /> : !question.sourceContent && context ? <SATRichText text={context} className="mb-4 font-serif text-[17px] leading-[1.5] text-[#171717] sm:text-[18px]" /> : null)}</div>
          <div data-sat-highlight-block="task">{question.sourceContent ? (
            <SATSourceContent html={question.sourceContent.task} className="font-serif text-[17px] font-bold leading-[1.45] text-[#151515] sm:text-[18px]" />
          ) : <SATRichText text={task} className="break-words font-serif text-[17px] font-bold leading-[1.45] text-[#151515] sm:text-[18px]" />}</div>

          {question.kind === 'multiple-choice' ? (
            <>
            {eliminatorOpen && !readOnly ? <p className="mt-3 text-xs font-semibold text-slate-600">Cross out choices you want to rule out. Use Undo to restore a choice.</p> : null}
            <div className="mt-4 space-y-2" role="radiogroup" aria-label={`Question ${question.number} answer choices`}>
              {question.choices.map((choice) => {
                const selected = answer === choice.key
                const eliminated = eliminatedChoices.includes(choice.key)
                return (
                  <div key={choice.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={choice.key}
                    disabled={readOnly || eliminated}
                    onClick={() => { if (!readOnly && !window.getSelection()?.toString()) onAnswer(choice.key) }}
                    className={`group relative flex w-full min-w-0 items-start gap-3 rounded-[0.9rem] bg-transparent px-3 py-2.5 text-left font-serif transition sm:px-4 ${eliminated ? 'opacity-50 after:pointer-events-none after:absolute after:inset-x-3 after:top-1/2 after:h-[2px] after:bg-slate-600' : ''} ${
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
                    <div data-sat-highlight-block={`choice-${choice.key}`} className="select-text min-w-0 flex-1 pt-0.5 text-[16px] font-semibold leading-6 sm:text-[17px]">
                      <SATChoiceContent choice={choice} />
                    </div>
                  </button>
                  {!readOnly && onEliminatedChoicesChange && (eliminatorOpen || eliminated) ? <button
                    type="button"
                    aria-label={`${eliminated ? 'Restore' : 'Eliminate'} choice ${choice.key}`}
                    title={eliminated ? `Restore choice ${choice.key}` : `Eliminate choice ${choice.key}`}
                    aria-pressed={eliminated}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-400 text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                    onClick={() => onEliminatedChoicesChange(eliminated ? eliminatedChoices.filter((key) => key !== choice.key) : [...eliminatedChoices, choice.key])}
                  >
                    {eliminated ? <Undo2 className="h-5 w-5" /> : <span className="relative font-serif text-base font-bold after:absolute after:-inset-x-1 after:top-1/2 after:h-[2px] after:bg-current">{choice.key}</span>}
                  </button> : null}
                  </div>
                )
              })}
            </div>
            </>
          ) : (
            <div className="mt-5">
              <label htmlFor="student-response" className="font-serif text-base font-bold text-slate-800">Enter your answer</label>
              <input
                id="student-response"
                readOnly={readOnly}
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
    </SATTextHighlights>
  )
}
