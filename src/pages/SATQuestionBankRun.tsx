import { accountStorageFor } from '@/utils/accountStorage'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Bookmark, Calculator, Check, ChevronDown, FileText, Maximize2, Minimize2, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import DesmosDrawer from '@/components/sat/DesmosDrawer'
import SATFormulaSheet from '@/components/sat/SATFormulaSheet'
import SATQuestionCanvas from '@/components/sat/SATQuestionCanvas'
import { clearBankSession, difficulty, historyKey, loadBankSession, readHistory, reviewQuestions, saveBankSession, type BankSession, type Result } from '@/features/sat/bankPractice'
import { isSATAnswerCorrect } from '@/features/sat/practiceTest4'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import '@/components/sat/sat-exam-layout.css'
import './SATQuestionBankRun.css'

export default function SATQuestionBankRun() {
  const userId = useAuthStore((state) => state.user?.id) ?? 'guest'
  const { setId } = useParams()
  return <BankRun key={`${userId}:${setId}`} userId={userId} setId={setId} />
}
function BankRun({ userId, setId }: { userId: string; setId?: string }) {
  const navigate = useNavigate()
  const { isFullscreen, supported, toggle, exit } = useFullscreen()
  const [session, setSession] = useState(() => {
    const saved = loadBankSession(userId)
    return saved?.id === setId ? saved : null
  })
  const [error, setError] = useState('')
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorDocked, setCalculatorDocked] = useState(true)
  const [formulasOpen, setFormulasOpen] = useState(false)
  const footer = useRef<HTMLElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const navigatorButton = useRef<HTMLButtonElement>(null)
  const navigatorClose = useRef<HTMLButtonElement>(null)
  const current = session ? reviewQuestions.get(session.keys[session.index]) : undefined
  const math = current?.question.section === 'math'
  const answered = session?.keys.filter((key) => session.answers[key]?.trim()).length ?? 0
  useEffect(() => {
    const previous = useAiAssistantStore.getState().isExamModeActive
    useAiAssistantStore.getState().setExamModeActive(true)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previousInset = document.body.style.getPropertyValue('--sat-bank-desmos-bottom')
    const measureFooter = () => {
      const height = footer.current?.getBoundingClientRect().height
      if (height) document.body.style.setProperty('--sat-bank-desmos-bottom', `${Math.ceil(height) + 12}px`)
    }
    measureFooter()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureFooter)
    if (footer.current) observer?.observe(footer.current)
    return () => {
      observer?.disconnect()
      if (previousInset) document.body.style.setProperty('--sat-bank-desmos-bottom', previousInset)
      else document.body.style.removeProperty('--sat-bank-desmos-bottom')
      document.body.style.overflow = overflow
      useAiAssistantStore.getState().setExamModeActive(previous)
      void exit()
    }
  }, [exit])
  useEffect(() => {
    if (!math) {
      setCalculatorOpen(false)
      setFormulasOpen(false)
    }
  }, [math])
  useEffect(() => {
    viewport.current?.scrollTo?.(0, 0)
  }, [session?.index])
  useEffect(() => {
    if (!navigatorOpen) return
    navigatorClose.current?.focus()
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNavigatorOpen(false)
        navigatorButton.current?.focus()
      }
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [navigatorOpen])
  const update = (next: BankSession) => {
    setSession(next)
    try {
      saveBankSession(userId, next)
      setError('')
    } catch {
      setError('Your latest changes could not be saved in this browser. Keep this page open and free up storage before leaving.')
    }
  }
  const leave = () => {
    if (session) {
      try { saveBankSession(userId, session) } catch {
        setError('Your answers could not be saved. Free up browser storage and try again before leaving.')
        return
      }
    }
    void exit()
    navigate('/sat/question-bank')
  }
  const finish = () => {
    if (!session) return
    const at = new Date().toISOString()
    const results: Result[] = session.keys.map((key) => {
      const question = reviewQuestions.get(key)!.question
      return {
        key, section: question.section, domain: question.domain, skill: question.skill,
        correct: isSATAnswerCorrect(question, session.answers[key]),
        answer: session.answers[key]?.trim() ?? '', flagged: session.flagged.includes(key),
        highlights: session.highlights[key] ?? [],
        at, setId: session.id,
      }
    })
    try {
      const history = readHistory(userId).filter((row) => row.setId !== session.id)
      accountStorageFor(userId ?? 'guest').setItem(historyKey(userId), JSON.stringify([...history, ...results]))
    } catch {
      setError('Your results could not be saved. Free up browser storage and try Finish set again. Your answers are still here.')
      return
    }
    // A submitted set cannot be resumed, even if cleanup fails after saving.
    try { clearBankSession(userId, session.id) } catch { /* Saved history remains authoritative. */ }
    void exit()
    navigate(`/sat/question-bank?view=history&review=${encodeURIComponent(session.id)}`, { replace: true })
  }
  if (!session || !current) return (
    <main className="sat-bank-run sat-bank-run-missing">
      <h1>This practice set is unavailable</h1>
      <p>Return to the Question Bank to resume your saved set or build a new one.</p>
      <button type="button" onClick={leave}><ArrowLeft size={18} /> Question Bank</button>
    </main>
  )
  return (
    <main className="sat-bank-run" aria-label="SAT Question Bank practice">
      <header className="sat-bank-run-header">
        <div className="sat-bank-run-heading">
          <span>SAT · QUESTION BANK</span>
          <h1>{math ? 'Math' : 'Reading and Writing'}</h1>
          <p>Untimed practice · {answered}/{session.keys.length} answered</p>
        </div>
        <div className="sat-bank-run-tools">
          {math ? <>
            <button type="button" className="sat-bank-run-desmos" aria-expanded={calculatorOpen}
              aria-label={calculatorOpen ? 'Close Desmos calculator' : 'Open Desmos calculator'}
              onClick={() => setCalculatorOpen((value) => !value)}><Calculator size={19} /> <span>Desmos</span></button>
            <button type="button" aria-label="Open Math reference sheet" onClick={() => setFormulasOpen(true)}><FileText size={19} /><span>Reference</span></button>
          </> : null}
          {supported ? <button type="button" onClick={toggle} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          </button> : null}
          <button type="button" onClick={leave} aria-label="Save and exit practice"><X size={19} /><span>Save & exit</span></button>
        </div>
      </header>
      <div className="sat-bank-run-progress" role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={session.keys.length} aria-valuenow={answered}>
        <span style={{ width: `${answered / session.keys.length * 100}%` }} />
      </div>
      {error ? <p role="alert" className="sat-bank-run-error">{error}</p> : null}
      <div ref={viewport} className={`sat-bank-run-viewport ${calculatorOpen && calculatorDocked ? 'with-desmos' : ''}`}>
        <div className="sat-bank-run-meta"><span>{difficulty(current.question.difficulty)} · {current.question.skill}</span><span>Question {session.index + 1} of {session.keys.length}</span></div>
        {!math ? <p className="mx-auto mb-4 max-w-[1400px] text-xs text-slate-600">Select text to highlight it in one of four colors. Click a highlight to remove it.</p> : null}
        <SATQuestionCanvas
          key={current.key}
          question={{ ...current.question, number: session.index + 1 }}
          answer={session.answers[current.key] ?? ''}
          onAnswer={(answer) => update({ ...session, answers: { ...session.answers, [current.key]: answer } })}
          strokes={session.highlights[current.key] ?? []}
          highlightAvailable={!math}
          onChange={(strokes) => update({ ...session, highlights: { ...session.highlights, [current.key]: strokes } })}
          flagged={session.flagged.includes(current.key)}
          onToggleFlag={() => update({ ...session, flagged: session.flagged.includes(current.key)
            ? session.flagged.filter((key) => key !== current.key) : [...session.flagged, current.key] })}
        />
      </div>
      <footer ref={footer} className="sat-bank-run-footer">
        <button ref={navigatorButton} type="button" className="sat-bank-run-question-menu" aria-expanded={navigatorOpen} aria-controls="bank-question-navigator" onClick={() => setNavigatorOpen((value) => !value)}>
          Question {session.index + 1} of {session.keys.length} <ChevronDown size={17} />
          <small>{session.flagged.length} marked</small>
        </button>
        <div className="sat-bank-run-navigation">
          <button type="button" disabled={!session.index} onClick={() => update({ ...session, index: session.index - 1 })}><ArrowLeft size={17} /> Previous</button>
          {session.index < session.keys.length - 1 ?
            <button type="button" className="sat-bank-run-primary" onClick={() => update({ ...session, index: session.index + 1 })}>Next <ArrowRight size={17} /></button> :
            <button type="button" className="sat-bank-run-primary" onClick={finish}>Finish set <Check size={17} /></button>}
        </div>
      </footer>
      {navigatorOpen ? (
        <section id="bank-question-navigator" className="sat-bank-run-navigator" aria-label="Practice question navigator">
          <header><div><h2>Questions</h2><p>{answered} answered · {session.keys.length - answered} unanswered · {session.flagged.length} marked for review</p></div>
            <button ref={navigatorClose} type="button" aria-label="Close question navigator" onClick={() => { setNavigatorOpen(false); navigatorButton.current?.focus() }}><X size={19} /></button>
          </header>
          <div className="sat-bank-run-question-grid">
            {session.keys.map((key, index) => (
              <button type="button" key={key} className={`sat-bank-run-number ${session.answers[key]?.trim() ? 'answered' : ''}`}
                aria-current={session.index === index ? 'step' : undefined}
                aria-label={`Go to question ${index + 1}${session.flagged.includes(key) ? ', Marked for Review' : ''}${session.answers[key]?.trim() ? ', Answered' : ', Unanswered'}`}
                onClick={() => { update({ ...session, index }); setNavigatorOpen(false); navigatorButton.current?.focus() }}>
                {index + 1}{session.flagged.includes(key) ? <Bookmark size={13} className="sat-bank-run-mark" /> : null}
              </button>
            ))}
          </div>
          <p>Unanswered questions will be saved as skipped when you finish.</p>
          <button type="button" className="sat-bank-run-primary" onClick={finish}>Finish set <Check size={17} /></button>
        </section>
      ) : null}
      <DesmosDrawer open={math && calculatorOpen} preload={math} docked={calculatorDocked} onDockedChange={setCalculatorDocked} onClose={() => setCalculatorOpen(false)} workspace="question-bank" />
      <SATFormulaSheet open={formulasOpen} onClose={() => setFormulasOpen(false)} />
    </main>
  )
}
