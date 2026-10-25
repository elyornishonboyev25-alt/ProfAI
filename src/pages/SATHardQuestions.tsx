import { useActiveTest } from '@/hooks/useActiveTest'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bookmark, Calculator, Check, CheckCircle2, Flame, Lightbulb, RotateCcw, Search, XCircle } from 'lucide-react'
import SATSectionTabs from '@/components/sat/SATSectionTabs'
import SATSourceContent from '@/components/sat/SATSourceContent'
import SATRichText from '@/components/sat/SATRichText'
import SATVisual from '@/components/sat/SATVisual'
import DesmosDrawer from '@/components/sat/DesmosDrawer'
import { HARD_QUESTIONS, hardProgressKey, loadHardProgress, type HardProgress } from '@/features/sat/hardQuestions'
import { isSATAnswerCorrect, type SATSection } from '@/features/sat/practiceTest4'
import { splitSATPrompt } from '@/features/sat/promptLayout'
import { accountStorageFor } from '@/utils/accountStorage'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import './SATHardQuestions.css'

type Filter = 'all' | 'unanswered' | 'incorrect' | 'bookmarked'
export default function SATHardQuestions() {
  const userId = useAuthStore(state => state.user?.id) ?? 'guest'
  return <HardWorkspace key={userId} userId={userId} />
}
function HardWorkspace({ userId }: { userId: string }) {
  const [params, setParams] = useSearchParams()
  const section: SATSection = params.get('section') === 'math' ? 'math' : 'reading-writing'
  const rows = HARD_QUESTIONS[section]
  const active = rows.find(row => row.key === params.get('q'))
  useActiveTest(Boolean(active))
  const [progress, setProgress] = useState<HardProgress>(() => loadHardProgress(userId))
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const feedback = useRef<HTMLElement>(null)
  const questionViewport = useRef<HTMLElement>(null)
  const previousFeedback = useRef({ key: active?.key, checked: Boolean(active && progress[active.key]?.checked) })
  const questionHeading = useRef<HTMLHeadingElement>(null)
  const subjectHeading = useRef<HTMLHeadingElement>(null)
  const math = section === 'math'
  const practicing = Boolean(active)
  useEffect(() => {
    if (!practicing) return
    const previous = useAiAssistantStore.getState().isExamModeActive
    const overflow = document.body.style.overflow
    useAiAssistantStore.getState().setExamModeActive(true)
    document.body.style.overflow = 'hidden'
    return () => {
      useAiAssistantStore.getState().setExamModeActive(previous)
      document.body.style.overflow = overflow
    }
  }, [practicing])
  const checkedCount = rows.filter(row => progress[row.key]?.checked).length
  const correctCount = rows.filter(row => progress[row.key]?.checked && isSATAnswerCorrect(row.question, progress[row.key].answer)).length
  const visible = rows.filter(row => {
    const state = progress[row.key]
    return (!search.trim() || `${row.question.domain} ${row.question.skill} ${rows.indexOf(row) + 1}`.toLowerCase().includes(search.trim().toLowerCase())) &&
      (filter === 'all' || filter === 'unanswered' && !state?.checked || filter === 'incorrect' && state?.checked && !isSATAnswerCorrect(row.question, state.answer) || filter === 'bookmarked' && state?.bookmarked)
  })
  const groups = useMemo(() => [...new Set(visible.map(row => row.question.skill))].map(skill => ({
    skill, rows: visible.filter(row => row.question.skill === skill),
  })), [visible])
  useEffect(() => {
    setCalculatorOpen(false)
    if (active) {
      questionViewport.current?.scrollTo?.(0, 0)
      questionHeading.current?.focus({ preventScroll: true })
    }
    else subjectHeading.current?.focus()
  }, [active?.key, section])
  const update = (key: string, patch: Partial<HardProgress[string]>) => {
    const next = { ...progress, [key]: { ...(progress[key] ?? { answer: '', checked: false, bookmarked: false }), ...patch } }
    setProgress(next)
    try {
      accountStorageFor(userId).setItem(hardProgressKey, JSON.stringify(next))
      setError('')
    } catch { setError('Progress could not be saved. Keep this page open and free up browser storage before leaving.') }
  }
  const openQuestion = (key?: string) => setParams({ section, ...(key ? { q: key } : {}) })
  const state = active ? progress[active.key] : undefined
  const answer = state?.answer ?? ''
  const checked = Boolean(state?.checked)
  useEffect(() => {
    const previous = previousFeedback.current
    if (active?.key === previous.key) {
      if (checked && !previous.checked) feedback.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' })
      else if (!checked && previous.checked) {
        questionViewport.current?.scrollTo?.(0, 0)
        questionHeading.current?.focus({ preventScroll: true })
      }
    }
    previousFeedback.current = { key: active?.key, checked }
  }, [checked, active?.key])
  const correct = active ? isSATAnswerCorrect(active.question, answer) : false
  const question = active?.question
  const index = active ? rows.indexOf(active) : -1
  const prompt = question ? splitSATPrompt(question.prompt) : null

  return <main className={`workspace-page hard-page ${active ? 'hard-page-active' : ''}`} aria-label={active ? 'SAT Hard Questions practice' : undefined}>
    <div className="hard-shell">
      {!active && <><SATSectionTabs section="hard-questions" />
      <header className="hard-hero">
        <div className="hard-hero-copy"><span className="hard-eyebrow"><Flame size={16} /> SAT CHALLENGE COLLECTION</span>
          <h1>Hard questions.<br /><span>Clear breakthroughs.</span></h1>
          <p>Go deeper, one question at a time. Advanced questions from the Ivygoo test catalog, grouped by topic with instant explanations.</p>
          <div className="hard-hero-tags"><span><CheckCircle2 size={15} /> Instant feedback</span><span>Untimed practice</span><span>Progress autosaves</span></div>
        </div>
        <div className="hard-subjects" aria-label="Choose question subject">
          {(['reading-writing', 'math'] as const).map(subject => {
            const done = HARD_QUESTIONS[subject].filter(row => progress[row.key]?.checked).length
            return <button key={subject} type="button" aria-pressed={section === subject} className={`hard-subject ${section === subject ? 'active' : ''}`} onClick={() => {
              setParams({ section: subject }); setSearch(''); setFilter('all')
            }}><span className="hard-subject-top">{subject === 'math' ? <Calculator size={22} /> : <Lightbulb size={22} />}<span>100 questions</span></span>
              <strong>{subject === 'math' ? 'Math' : 'English'}</strong><small>{subject === 'math' ? 'Algebra, data, geometry & more' : 'Reading & Writing'}</small>
              <span className="hard-subject-meter"><span style={{ width: `${done}%` }} /></span><span className="hard-subject-bottom">{done} / 100 completed{section === subject ? <Check size={16} /> : <ArrowRight size={16} />}</span>
            </button>
          })}
        </div>
      </header></>}
      {error && <p className="hard-error" role="alert">{error}</p>}
      <section id="sat-test-panel" aria-labelledby={active ? undefined : 'sat-tab-hard-questions'} role={active ? undefined : 'tabpanel'} className="hard-workspace">
        {!active && <div className="hard-section-heading"><div><span className="hard-eyebrow">{math ? 'MATH' : 'ENGLISH'} · ADVANCED</span><h2 ref={subjectHeading} tabIndex={-1}>{math ? 'Math' : 'English'} challenge map</h2></div>
          <div className="hard-stats"><span><strong>{checkedCount}</strong> completed</span><span><strong>{correctCount}</strong> correct</span><span><strong>{checkedCount ? Math.round(correctCount / checkedCount * 100) : 0}%</strong> accuracy</span></div>
        </div>}
        {active && question && prompt ? <>
          <div className="hard-question-toolbar"><button type="button" onClick={() => openQuestion()}><ArrowLeft size={16} /> All topics</button><span>Question {index + 1} / 100</span>
            {math && <button type="button" aria-expanded={calculatorOpen} onClick={() => setCalculatorOpen(value => !value)}><Calculator size={17} /> Calculator</button>}
            <button type="button" aria-pressed={Boolean(state?.bookmarked)} aria-label={state?.bookmarked ? 'Remove bookmark' : 'Bookmark question'} onClick={() => update(active.key, { bookmarked: !state?.bookmarked })}><Bookmark size={17} fill={state?.bookmarked ? 'currentColor' : 'none'} /></button>
          </div>
          <article ref={questionViewport} className="hard-question" key={active.key}>
            <header><span>{question.domain}</span><h3 ref={questionHeading} tabIndex={-1}>{question.skill}</h3><small>From Ivygoo SAT test {active.testNumber} · Hard</small></header>
            <div className={`hard-question-body ${!math ? 'english' : ''}`}>
              <div className="hard-passage">
                {question.visual && <SATVisual asset={question.visual.asset} alt={question.visual.alt} className="hard-visual" imageClassName="max-h-[26rem] max-w-full object-contain" />}
                {question.sourceContent ? <SATSourceContent html={question.sourceContent.context} /> : <SATRichText text={prompt.context} />}
              </div>
              <div className="hard-response">
                {question.sourceContent ? <SATSourceContent html={question.sourceContent.task} className="hard-task" /> : <SATRichText text={prompt.task} className="hard-task" />}
                {question.kind === 'multiple-choice' ? <div className="hard-choices" aria-label="Answer choices">
                  {question.choices.map(choice => {
                    const right = checked && choice.key === question.correctAnswer
                    const wrong = checked && choice.key === answer && !correct
                    return <button key={choice.key} type="button" disabled={checked} aria-pressed={answer === choice.key} className={`hard-choice ${right ? 'correct' : wrong ? 'incorrect' : ''}`} onClick={() => update(active.key, { answer: choice.key, checked: true })}>
                      <span className="hard-choice-key">{choice.key}</span><span className="hard-choice-content">{choice.image && <img src={choice.image} alt={`Choice ${choice.key}`} />}{choice.html ? <SATSourceContent html={choice.html} /> : <SATRichText text={choice.text} />}</span>
                      {right ? <CheckCircle2 size={19} aria-label="Correct answer" /> : wrong ? <XCircle size={19} aria-label="Your answer is incorrect" /> : null}
                    </button>
                  })}
                </div> : <form className="hard-numeric" onSubmit={event => { event.preventDefault(); if (answer.trim()) update(active.key, { checked: true }) }}>
                  <label htmlFor="hard-answer">Your answer</label><div><input id="hard-answer" type="text" autoComplete="off" value={answer} disabled={checked} placeholder="Enter a number or fraction" onChange={event => update(active.key, { answer: event.target.value })} /><button className="hard-primary" type="submit" disabled={checked || !answer.trim()}>Check answer <Check size={17} /></button></div><small>Decimals and fractions are accepted.</small>
                </form>}
                {!checked && question.kind === 'multiple-choice' && <p className="hard-answer-hint">Choose an answer to see your result and explanation immediately.</p>}
              </div>
            </div>
            {checked && <section ref={feedback} className={`hard-feedback ${correct ? 'correct' : 'incorrect'}`} aria-label="Answer feedback">
              <div className="hard-feedback-result" role="status">{correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}<div><h4>{correct ? 'Correct — well done!' : 'Keep going — learn from this one.'}</h4><p>Your answer: <strong>{answer}</strong><span>Correct answer: <strong>{question.correctAnswer}</strong></span></p></div></div>
              <div className="hard-explanation"><h4><Lightbulb size={19} /> Why this answer works</h4>{question.sourceContent?.explanation ? <SATSourceContent html={question.sourceContent.explanation} /> : <SATRichText text={question.explanation} />}</div>
              <button type="button" className="hard-retry" onClick={() => update(active.key, { answer: '', checked: false })}><RotateCcw size={15} /> Try this question again</button>
            </section>}
          </article>
          <nav className="hard-question-footer" aria-label="Hard question navigation"><button type="button" disabled={index === 0} onClick={() => openQuestion(rows[index - 1].key)}><ArrowLeft size={17} /> Previous</button><span>{checked ? error ? 'Result checked' : 'Result saved' : 'Take your time'}</span><button type="button" className="hard-primary" disabled={index === rows.length - 1} onClick={() => openQuestion(rows[index + 1].key)}>Next question <ArrowRight size={17} /></button></nav>
        </> : <>
          <div className="hard-map-tools"><div className="hard-filters" aria-label="Filter questions">{(['all', 'unanswered', 'incorrect', 'bookmarked'] as const).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{({ all: 'All questions', unanswered: 'To solve', incorrect: 'To review', bookmarked: 'Bookmarked' })[value]}</button>)}</div><label className="hard-search"><Search size={17} /><input type="search" placeholder="Find a topic or question…" aria-label="Search hard questions" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
          <div className="hard-legend"><span><i /> To solve</span><span><i className="correct" /> Correct</span><span><i className="incorrect" /> To review</span><span><Bookmark size={13} /> Bookmarked</span></div>
          {groups.length ? groups.map(group => <section className="hard-topic" key={group.skill}><header><div><small>{group.rows[0].question.domain}</small><h3>{group.skill}</h3></div><span>{group.rows.filter(row => progress[row.key]?.checked).length} / {group.rows.length} completed{filter !== 'all' || search ? ' in view' : ''}</span></header>
            <div className="hard-question-grid">{group.rows.map(row => {
              const saved = progress[row.key]
              const status = saved?.checked ? isSATAnswerCorrect(row.question, saved.answer) ? 'correct' : 'incorrect' : 'unanswered'
              const number = rows.indexOf(row) + 1
              return <button key={row.key} type="button" className={`hard-tile ${status}`} aria-label={`Question ${number}, ${row.question.skill}, ${status}${saved?.bookmarked ? ', bookmarked' : ''}`} onClick={() => openQuestion(row.key)}><span>{String(number).padStart(2, '0')}</span>{saved?.bookmarked && <Bookmark className="hard-tile-bookmark" size={12} fill="currentColor" />}{saved?.checked && <span className="hard-tile-status">{status === 'correct' ? <Check size={12} /> : <RotateCcw size={12} />}</span>}</button>
            })}</div>
          </section>) : <div className="hard-empty"><Search size={28} /><h3>No matching questions</h3><p>Try another topic or filter.</p><button type="button" onClick={() => { setFilter('all'); setSearch('') }}>Show all questions</button></div>}
          {checkedCount === 100 && <div className="hard-complete"><CheckCircle2 size={24} /><div><strong>All 100 {math ? 'Math' : 'English'} questions completed!</strong><p>Review your mistakes or switch subjects to keep improving.</p></div></div>}
        </>}
      </section>
    </div>
    <DesmosDrawer open={math && calculatorOpen} preload={math && Boolean(active)} docked={false} allowDocking={false} onDockedChange={() => {}} onClose={() => setCalculatorOpen(false)} />
  </main>
}
