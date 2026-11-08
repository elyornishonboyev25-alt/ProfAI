import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useMemo, useState, type ReactNode } from 'react'
import { Bookmark, Undo2 } from 'lucide-react'
import type { HighlightStroke, SATQuestion } from '@/features/sat/practiceTest4'
import { splitSATPrompt } from '@/features/sat/promptLayout'
import SATRichText from './SATRichText'
import SATSourceContent from './SATSourceContent'
import SATVisual from './SATVisual'
import SATChoiceContent from './SATChoiceContent'
import SATTextHighlights from './SATTextHighlights'
import SATResponseDirections from './SATResponseDirections'
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
  const { c: uiCopy } = useCopy()
  const [eliminatorOpen, setEliminatorOpen] = useState(false)
  const { context, task } = useMemo(() => splitSATPrompt(question.prompt), [question.prompt])
  const hasReadingSource = question.section !== 'math' && Boolean(question.visual || question.sourceContent?.context?.trim() || context.trim())

  const hasResponseDirections = question.section === 'math' && question.kind !== 'multiple-choice'
  const hasSeparateSource = hasReadingSource || hasResponseDirections

  return (
    <SATTextHighlights key={question.id} strokes={strokes} onChange={onChange} enabled={highlightAvailable}>
    <div data-sat-section={question.section} data-sat-layout={hasSeparateSource ? 'split' : question.section === 'math' ? 'math' : 'single'} className={`sat-question-paper sat-exam-canvas ${practiceLayout ? 'sat-bank-canvas' : ''} grid min-h-full min-w-0 bg-[#f7f8fa] ${hasSeparateSource ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
      {hasSeparateSource ? <section className="sat-question-source relative min-w-0 border-b border-slate-300 px-5 py-5 md:border-b-0 md:border-r md:px-8 xl:px-10">
        <HighlightLayer
          surface="passage"
          strokes={strokes}
        />
        <div className="mx-auto max-w-[42rem]">
          {hasResponseDirections ? <SATResponseDirections /> : <>
          {question.visual ? (
            <figure className="mx-auto mb-5 w-fit max-w-full overflow-hidden rounded-xl border border-slate-300 bg-white p-2.5">
              <SATVisual
                asset={question.visual.asset}
                alt={question.visual.alt}
                className="mx-auto"
                imageClassName="sat-exam-visual mx-auto w-auto max-w-full object-contain"
              />
            </figure>
          ) : null}

          <div data-sat-highlight-block="context">
          {question.sourceContent?.context ? (
            <SATSourceContent html={question.sourceContent.context} className="font-serif text-[17px] font-medium leading-[1.5] text-[#171717] sm:text-[18px]" />
          ) : !question.sourceContent && context ? (
            <SATRichText text={context} className="break-words font-serif text-[17px] font-medium leading-[1.5] text-[#171717] sm:text-[18px]" />
          ) : null}
          </div>
          </>}
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
            {readOnly ? <UiText text={"Answer review"} /> : flagged ? <UiText text={"Marked for Review"} /> : <UiText text={"Mark for Review"} />}
          </button>
          {!readOnly && question.kind === 'multiple-choice' && onEliminatedChoicesChange ? <button
            type="button"
            aria-label={uiCopy("Answer eliminator")}
            title={uiCopy("Cross out answer choices")}
            aria-pressed={eliminatorOpen}
            onClick={() => setEliminatorOpen((open) => !open)}
            className="sat-answer-eliminator"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 16 6-13 6 13M8 12h8M4 19h16M4 22h16" />
            </svg>
          </button> : null}
        </div>
        {!practiceLayout ? <div aria-hidden="true" className="sat-question-rule h-[3px] bg-[repeating-linear-gradient(90deg,#ad3e5d_0_34px,transparent_34px_41px,#ead5c8_41px_75px,transparent_75px_82px,#21176b_82px_116px,transparent_116px_123px,#5e8c68_123px_157px,transparent_157px_164px)]" /> : null}

        <div className={`sat-question-body mx-auto px-5 py-4 sm:px-8 ${hasSeparateSource ? 'max-w-[42rem]' : 'max-w-[44rem]'}`}>
          {!hasReadingSource && question.visual ? <figure className="mx-auto mb-4 w-fit max-w-full rounded-xl border border-slate-300 bg-white p-2.5"><SATVisual asset={question.visual.asset} alt={question.visual.alt} className="mx-auto" imageClassName="sat-exam-visual mx-auto w-auto max-w-full object-contain" /></figure> : null}
          <div data-sat-highlight-block={hasReadingSource ? undefined : "context"}>{!hasReadingSource && (question.sourceContent?.context ? <SATSourceContent html={question.sourceContent.context} className="mb-4 font-serif text-[17px] leading-[1.5] text-[#171717] sm:text-[18px]" /> : !question.sourceContent && context ? <SATRichText text={context} className="mb-4 font-serif text-[17px] leading-[1.5] text-[#171717] sm:text-[18px]" /> : null)}</div>
          <div data-sat-highlight-block="task">{question.sourceContent ? (
            <SATSourceContent html={question.sourceContent.task} className="font-serif text-[17px] font-bold leading-[1.45] text-[#151515] sm:text-[18px]" />
          ) : <SATRichText text={task} className="break-words font-serif text-[17px] font-bold leading-[1.45] text-[#151515] sm:text-[18px]" />}</div>

          {question.kind === 'multiple-choice' ? (
            <>
            {!readOnly && onEliminatedChoicesChange ? <div className="sat-eliminator-help" data-open={eliminatorOpen} aria-hidden={!eliminatorOpen}>
              <p><UiText text={"Cross out choices you want to rule out. Use Undo to restore a choice."} /></p>
            </div> : null}
            <div className="sat-paper-choices" role="radiogroup" aria-label={uiCopy("Question {{value1}} answer choices", { value1: String(question.number) })}>
              {question.choices.map((choice) => {
                const selected = answer === choice.key
                const eliminated = eliminatedChoices.includes(choice.key)
                const showEliminator = eliminatorOpen || eliminated
                return (
                  <div key={choice.key} className="sat-paper-choice-row">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    key={choice.key}
                    disabled={readOnly || eliminated}
                    onClick={() => { if (!readOnly && !window.getSelection()?.toString()) onAnswer(choice.key) }}
                    data-answer-state={selected ? answerState : undefined}
                    data-eliminated={eliminated || undefined}
                    className={`sat-paper-choice group relative flex w-full min-w-0 items-start gap-3 rounded-[0.9rem] bg-transparent px-3 py-2.5 text-left font-serif transition sm:px-4 ${
                      selected
                        ? answerState === 'correct'
                          ? 'border-[3px] border-emerald-600 bg-emerald-50 text-emerald-900'
                          : answerState === 'incorrect'
                            ? 'border-[3px] border-red-600 bg-red-50 text-red-900'
                            : 'border-[3px] border-[#4053d7] text-[#1f2e8d]'
                        : 'border-2 border-black text-[#171717] hover:bg-white'
                    }`}
                  >
                    <span className={`sat-paper-choice-letter mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
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
                  {!readOnly && onEliminatedChoicesChange ? <span className="sat-choice-eliminator-slot" data-open={showEliminator} aria-hidden={!showEliminator}>
                  <button
                    type="button"
                    aria-label={uiCopy("{{value1}} choice {{value2}}", { value1: String(eliminated ? 'Restore' : 'Eliminate'), value2: String(choice.key) })}
                    title={eliminated ? uiCopy("Restore choice {{value1}}", { value1: String(choice.key) }) : uiCopy("Eliminate choice {{value1}}", { value1: String(choice.key) })}
                    aria-pressed={eliminated}
                    disabled={!showEliminator}
                    tabIndex={showEliminator ? 0 : -1}
                    className="sat-choice-eliminator"
                    onClick={() => onEliminatedChoicesChange(eliminated ? eliminatedChoices.filter((key) => key !== choice.key) : [...eliminatedChoices, choice.key])}
                  >
                    <span className="sat-choice-eliminate-icon" aria-hidden="true">{choice.key}</span>
                    <Undo2 className="sat-choice-restore-icon" aria-hidden="true" />
                  </button>
                  </span> : null}
                  </div>
                )
              })}
            </div>
            </>
          ) : (
            <div className="mt-5">
              <label htmlFor="student-response" className="font-serif text-base font-bold text-slate-800"><UiText text={"Enter your answer"} /></label>
              <input
                id="student-response"
                data-answer-state={answerState}
                aria-describedby="sat-response-help"
                readOnly={readOnly}
                value={answer}
                onChange={(event) => onAnswer(event.target.value)}
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="Enter your answer (e.g., 5.566, -5.566, 2/3, -2/3)"
                className={`mt-2 h-12 w-full rounded-xl border-2 px-4 font-serif text-lg font-bold text-black outline-none ${
                  answerState === 'correct'
                    ? 'border-emerald-600 bg-emerald-50 focus:ring-2 focus:ring-emerald-600/20'
                    : answerState === 'incorrect'
                      ? 'border-red-600 bg-red-50 focus:ring-2 focus:ring-red-600/20'
                      : 'border-black bg-white focus:border-[#4053d7] focus:ring-2 focus:ring-[#4053d7]/20'
                }`}
              />
              <p id="sat-response-help" className="mt-2 text-xs font-semibold leading-5 text-slate-500"><UiText text={"Fractions and equivalent decimals are accepted."} /></p>
            </div>
          )}

          {practicePanel}
        </div>
      </section>
    </div>
    </SATTextHighlights>
  )
}
