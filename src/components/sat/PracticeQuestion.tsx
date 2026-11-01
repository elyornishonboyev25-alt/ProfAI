import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Bookmark, Calculator, CheckCircle2, ChevronDown, Eye, EyeOff, History, Lightbulb, Pause, Play, RotateCcw, Sheet, Shuffle, XCircle } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import SATQuestionCanvas from './SATQuestionCanvas'
import SATExplanation from './SATExplanation'
import SATFormulaSheet from './SATFormulaSheet'
import DesmosDrawer from './DesmosDrawer'
import { isSATAnswerCorrect } from '@/features/sat/practiceTest4'
import { practiceLevel, type QuestionProgress } from '@/features/sat/hardQuestions'
import type { QuestionRow } from '@/features/sat/bankPractice'
import { usePracticeClock } from '@/hooks/usePracticeClock'

type Props = {
  row: QuestionRow; index: number; total: number; state?: QuestionProgress
  onUpdate: (patch: Partial<QuestionProgress>) => void
  onBack: () => void; onPrevious?: () => void; onNext?: () => void; onSimilar?: () => void
}
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`

export default function PracticeQuestion({ row, index, total, state, onUpdate, onBack, onPrevious, onNext, onSimilar }: Props) {
  const { question } = row
  const checked = Boolean(state?.checked)
  const answer = state?.answer ?? ''
  const correct = isSATAnswerCorrect(question, answer)
  const [solutionOpen, setSolutionOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [timerHidden, setTimerHidden] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [formulasOpen, setFormulasOpen] = useState(false)
  const clock = usePracticeClock(state?.elapsedSeconds ?? 0, seconds => onUpdate({ elapsedSeconds: seconds }), checked)
  const solution = useRef<HTMLElement>(null)
  const viewport = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const current = useRef({ checked, answer })
  current.current = { checked, answer }
  const math = question.section === 'math'

  const checkAnswer = () => {
    if (checked || !answer.trim()) return
    const seconds = clock.read()
    onUpdate({ checked: true, elapsedSeconds: seconds, attempts: [...(state?.attempts ?? []), {
      answer, correct, seconds, at: new Date().toISOString(),
    }].slice(-30) })
  }
  const checkRef = useRef(checkAnswer)
  checkRef.current = checkAnswer
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    const enter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey ||
        calculatorOpen || formulasOpen || !current.current.answer.trim() || current.current.checked) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('[role="dialog"],dialog,textarea,[contenteditable="true"]')) return
      // Native Enter on an action button must keep that button's own behavior.
      if (target?.closest('button') && target.getAttribute('role') !== 'radio') return
      event.preventDefault()
      checkRef.current()
    }
    window.addEventListener('keydown', enter)
    return () => window.removeEventListener('keydown', enter)
  }, [calculatorOpen, formulasOpen])

  return <>
    <header className="hard-test-topbar">
      <button type="button" onClick={onBack}><ArrowLeft size={16} /> All topics</button>
      <BrandLogo height={30} />
      <div className="practice-clock" aria-label="Practice timer">
        <button type="button" aria-label={clock.paused ? 'Resume timer' : 'Pause timer'} disabled={checked} onClick={() => clock.setPaused(!clock.paused)}>{clock.paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <button type="button" className="practice-clock-value" aria-label={timerHidden ? 'Show elapsed time' : 'Hide elapsed time'} onClick={() => setTimerHidden(!timerHidden)}>{timerHidden ? <EyeOff size={17} /> : <><span>{timeLabel(clock.seconds)}</span><Eye size={15} /></>}</button>
      </div>
    </header>
    <div className="hard-question-toolbar">
      <div className="practice-toolbar-meta"><strong>{math ? 'Math' : 'Reading & Writing'}</strong><span>Question {index + 1} / {total}</span><span className="practice-track" aria-hidden="true"><span style={{ width: `${(index + 1) / total * 100}%` }} /></span></div>
      {math && <><button type="button" aria-label="Math reference sheet" aria-expanded={formulasOpen} onClick={() => setFormulasOpen(!formulasOpen)}><Sheet size={17} /> Reference</button><button type="button" aria-label="Calculator" aria-expanded={calculatorOpen} onClick={() => setCalculatorOpen(!calculatorOpen)}><Calculator size={17} /> Calculator</button></>}
      <button type="button" aria-pressed={Boolean(state?.bookmarked)} aria-label={state?.bookmarked ? 'Remove bookmark' : 'Bookmark question'} onClick={() => onUpdate({ bookmarked: !state?.bookmarked })}><Bookmark size={17} fill={state?.bookmarked ? 'currentColor' : 'none'} /></button>
    </div>
    <article ref={viewport} className="hard-question practice-exam-question">
      <header><div className="practice-question-meta"><span>{question.domain}</span><span className={`practice-level is-${practiceLevel(question.difficulty)}`}>{practiceLevel(question.difficulty)}</span></div><h3 ref={heading} tabIndex={-1}>{question.skill}</h3><small>Ivygoo SAT test {row.testNumber}</small></header>
      {clock.paused && !checked ? <div className="practice-paused"><Pause size={32} /><h3>Practice paused</h3><p>Your answer and elapsed time are saved.</p><button type="button" className="hard-primary" onClick={() => clock.setPaused(false)}><Play size={16} />Continue practicing</button></div> : <>
        <SATQuestionCanvas question={{ ...question, number: index + 1 }} answer={answer} readOnly={checked && correct}
          onAnswer={value => { if (!checked || !correct && value !== answer) { setSolutionOpen(false); onUpdate({ answer: value, checked: false }) } }}
          strokes={state?.highlights ?? []} onChange={highlights => onUpdate({ highlights })}
          eliminatedChoices={state?.eliminatedChoices ?? []}
          onEliminatedChoicesChange={choices => onUpdate({ eliminatedChoices: choices, ...(choices.includes(answer) ? { answer: '', checked: false } : {}) })}
          flagged={Boolean(state?.flagged)} onToggleFlag={() => onUpdate({ flagged: !state?.flagged })}
          answerState={checked ? correct ? 'correct' : 'incorrect' : undefined}
          practicePanel={<div className="practice-answer-actions">
            {!checked ? <><button type="button" className="hard-primary" disabled={!answer.trim()} onClick={checkAnswer}>Check answer <CheckCircle2 size={16} /></button><span>Select an answer, then check it. <kbd>Enter</kbd></span></> : <>
              <div className={`practice-check-status ${correct ? 'is-correct' : 'is-incorrect'}`} role="status">{correct ? <CheckCircle2 size={19} /> : <XCircle size={19} />}{correct ? 'Correct answer' : 'Incorrect answer'}</div>
              <button type="button" className="practice-solution-toggle" aria-expanded={solutionOpen} aria-controls="practice-solution" onClick={() => setSolutionOpen(!solutionOpen)}><Lightbulb size={17} />{solutionOpen ? 'Hide solution' : 'See solution'}<ChevronDown size={15} className={solutionOpen ? 'is-open' : ''} /></button>
              <button type="button" className="hard-retry" onClick={() => { setSolutionOpen(false); onUpdate({ answer: '', checked: false, eliminatedChoices: [] }); viewport.current?.scrollTo({ top: 0, behavior: 'smooth' }) }}><RotateCcw size={15} />Try this question again</button>
            </>}
          </div>} />
        <AnimatePresence initial={false}>
          {solutionOpen && checked && <motion.section ref={solution} id="practice-solution" aria-label="Question solution" className="practice-solution" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .22, ease: 'easeOut' }} onAnimationComplete={() => solution.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })}>
            <div className="practice-solution-inner"><div className="practice-solution-heading"><span><Lightbulb size={20} /></span><div><small>STEP BY STEP</small><h4>Understand the solution</h4></div><strong>Answer: {question.correctAnswer}</strong></div>
              <div className="practice-solution-content"><SATExplanation question={question} response={answer} /></div>
            </div>
          </motion.section>}
        </AnimatePresence>
        <div className="practice-secondary-actions">
          <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)}><History size={16} />{historyOpen ? 'Hide history' : 'Show history'}</button>
          {onSimilar && <button type="button" onClick={onSimilar}><Shuffle size={16} />Solve a similar problem <ArrowRight size={15} /></button>}
        </div>
        {historyOpen && <div className="practice-history" aria-label="Attempt history">{state?.attempts?.length ? <ol>{[...state.attempts].reverse().map((attempt, index) => <li key={`${attempt.at}-${index}`}><span>{attempt.correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}{attempt.answer}</span><time dateTime={attempt.at}>{new Date(attempt.at).toLocaleString()}</time><span>{timeLabel(attempt.seconds)}</span></li>)}</ol> : <p>No checked attempts yet. Check an answer to record your progress.</p>}</div>}
      </>}
    </article>
    <nav className="hard-question-footer" aria-label="Hard question navigation"><button type="button" disabled={!onPrevious} onClick={onPrevious}><ArrowLeft size={17} />Previous</button><span>{checked ? 'Answer saved' : 'Progress saves automatically'}</span><button type="button" className="hard-primary" disabled={!onNext} onClick={onNext}>Next question <ArrowRight size={17} /></button></nav>
    <DesmosDrawer open={math && calculatorOpen} preload={math} docked={false} allowDocking={false} onDockedChange={() => {}} onClose={() => setCalculatorOpen(false)} />
    <SATFormulaSheet open={math && formulasOpen} onClose={() => setFormulasOpen(false)} />
  </>
}
