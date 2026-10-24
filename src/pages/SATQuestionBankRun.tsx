import { useActiveTest } from '@/hooks/useActiveTest'
import { accountStorageFor } from '@/utils/accountStorage'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Bookmark, Calculator, Check, ChevronDown, FileText, Maximize2, Minimize2, Sheet, X } from 'lucide-react'
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
  const learnerName = useAuthStore((state) => state.user?.fullName) || 'Ivygoo Student'
  const { isFullscreen, supported, toggle, exit } = useFullscreen()
  const [session, setSession] = useState(() => {
    const saved = loadBankSession(userId)
    return saved?.id === setId ? saved : null
  })
  useActiveTest(Boolean(session))
  const [error, setError] = useState('')
  const [navigatorOpen, setNavigatorOpen] = useState(false)
  const [directionsOpen, setDirectionsOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorDocked, setCalculatorDocked] = useState(true)
  const [formulasOpen, setFormulasOpen] = useState(false)
  const footer = useRef<HTMLElement>(null)
  const header = useRef<HTMLElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const navigatorButton = useRef<HTMLButtonElement>(null)
  const navigatorClose = useRef<HTMLButtonElement>(null)
  const directionsButton = useRef<HTMLButtonElement>(null)
  const directionsClose = useRef<HTMLButtonElement>(null)
  const findQuestion = (key: string) => session?.questions?.[key] ?? reviewQuestions.get(key)
  const current = session ? findQuestion(session.keys[session.index]) : undefined
  const math = current?.question.section === 'math'
  const answered = session?.keys.filter((key) => session.answers[key]?.trim()).length ?? 0
  useEffect(() => {
    const previous = useAiAssistantStore.getState().isExamModeActive
    useAiAssistantStore.getState().setExamModeActive(true)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previousInset = document.body.style.getPropertyValue('--sat-bank-desmos-bottom')
    const previousTop = document.body.style.getPropertyValue('--sat-bank-desmos-top')
    const measureLayout = () => {
      const height = footer.current?.getBoundingClientRect().height
      if (height) document.body.style.setProperty('--sat-bank-desmos-bottom', `${Math.ceil(height) + 12}px`)
      const top = header.current?.getBoundingClientRect().bottom
      if (top) document.body.style.setProperty('--sat-bank-desmos-top', `${Math.ceil(top)}px`)
    }
    measureLayout()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureLayout)
    if (footer.current) observer?.observe(footer.current)
    if (header.current) observer?.observe(header.current)
    return () => {
      observer?.disconnect()
      if (previousInset) document.body.style.setProperty('--sat-bank-desmos-bottom', previousInset)
      else document.body.style.removeProperty('--sat-bank-desmos-bottom')
      if (previousTop) document.body.style.setProperty('--sat-bank-desmos-top', previousTop)
      else document.body.style.removeProperty('--sat-bank-desmos-top')
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
    if (!navigatorOpen && !directionsOpen) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const closeButton = directionsOpen ? directionsClose.current : navigatorClose.current
    const dialog = closeButton?.closest('section')
    closeButton?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setNavigatorOpen(false)
        setDirectionsOpen(false)
      } else if (event.key === 'Tab' && dialog) {
        const buttons = dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      if (opener?.isConnected) opener.focus()
    }
  }, [navigatorOpen, directionsOpen])
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
      const question = findQuestion(key)!.question
      return {
        key, section: question.section, domain: question.domain, skill: question.skill,
        correct: isSATAnswerCorrect(question, session.answers[key]),
        answer: session.answers[key]?.trim() ?? '', flagged: session.flagged.includes(key),
        highlights: session.highlights[key] ?? [],
        eliminatedChoices: session.eliminatedChoices?.[key] ?? [],
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
      <header ref={header} className="sat-bank-run-header">
        <div className="sat-bank-run-header-content">
          <div className="sat-bank-run-heading">
            <h1>Question Bank: {math ? 'Math' : 'Reading and Writing'}</h1>
            <button ref={directionsButton} type="button" className="sat-bank-run-directions" onClick={() => setDirectionsOpen(true)}>Directions</button>
          </div>
          <div className="sat-bank-run-status">
            <p>Untimed practice</p>
            <span>{answered}/{session.keys.length} answered</span>
          </div>
          <div className="sat-bank-run-tools">
            {math ? <>
              <button type="button" className="sat-bank-run-reference" aria-label="Open Math reference sheet" title="Formula Sheet" onClick={() => setFormulasOpen(true)}><Sheet size={20} /><span>Formula Sheet</span></button>
              <button type="button" className="sat-bank-run-desmos" aria-expanded={calculatorOpen}
                aria-label={calculatorOpen ? 'Close Desmos calculator' : 'Open Desmos calculator'}
                onClick={() => setCalculatorOpen((value) => !value)}><Calculator size={20} /> <span>Desmos</span></button>
            </> : null}
            <button type="button" className="sat-bank-run-navigator-toggle" aria-label="Open question navigator" onClick={() => setNavigatorOpen(true)}><FileText size={24} /></button>
            {supported ? <button type="button" onClick={toggle} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button> : null}
            <button type="button" onClick={leave} aria-label="Save and exit practice"><X size={24} /><span>Save & exit</span></button>
          </div>
        </div>
        <div className="sat-bank-run-divider" />
      </header>
      {error ? <p role="alert" className="sat-bank-run-error">{error}</p> : null}
      <div ref={viewport} className={`sat-exam-viewport sat-bank-run-viewport ${calculatorOpen && calculatorDocked ? 'with-desmos' : ''}`}>
        <SATQuestionCanvas
          key={current.key}
          question={{ ...current.question, number: session.index + 1 }}
          answer={session.answers[current.key] ?? ''}
          onAnswer={(answer) => update({ ...session, answers: { ...session.answers, [current.key]: answer } })}
          strokes={session.highlights[current.key] ?? []}
          eliminatedChoices={session.eliminatedChoices?.[current.key] ?? []}
          onEliminatedChoicesChange={(choices) => update({
            ...session,
            eliminatedChoices: { ...session.eliminatedChoices, [current.key]: choices },
            answers: { ...session.answers, [current.key]: choices.includes(session.answers[current.key]) ? '' : session.answers[current.key] ?? '' },
          })}
          highlightAvailable={!math}
          onChange={(strokes) => update({ ...session, highlights: { ...session.highlights, [current.key]: strokes } })}
          flagged={session.flagged.includes(current.key)}
          onToggleFlag={() => update({ ...session, flagged: session.flagged.includes(current.key)
            ? session.flagged.filter((key) => key !== current.key) : [...session.flagged, current.key] })}
        />
      </div>
      <footer ref={footer} className="sat-bank-run-footer">
        <div className="sat-bank-run-divider" />
        <div className="sat-bank-run-footer-content">
          <p className="sat-bank-run-learner">{learnerName}</p>
          <button ref={navigatorButton} type="button" className="sat-bank-run-question-menu" aria-expanded={navigatorOpen} aria-controls="bank-question-navigator" onClick={() => setNavigatorOpen((value) => !value)}>
            Question {session.index + 1} of {session.keys.length} <ChevronDown size={16} />
            <span className="sr-only">{session.flagged.length} marked</span>
          </button>
          <div className="sat-bank-run-navigation">
            <button type="button" disabled={!session.index} onClick={() => update({ ...session, index: session.index - 1 })}>Back</button>
            {session.index < session.keys.length - 1 ?
              <button type="button" onClick={() => update({ ...session, index: session.index + 1 })}>Next</button> :
              <button type="button" className="sat-bank-run-finish" onClick={finish}>Finish set</button>}
          </div>
        </div>
      </footer>
      {directionsOpen ? createPortal(
        <div className="sat-bank-run-overlay" onClick={() => { setDirectionsOpen(false); directionsButton.current?.focus() }}>
          <section className="sat-bank-run-dialog" role="dialog" aria-modal="true" aria-labelledby="bank-directions-title" onClick={(event) => event.stopPropagation()}>
            <header><div><p>Test directions</p><h2 id="bank-directions-title">{math ? 'Math' : 'Reading and Writing'}</h2></div>
              <button ref={directionsClose} type="button" aria-label="Close directions" onClick={() => { setDirectionsOpen(false); directionsButton.current?.focus() }}><X size={18} /></button>
            </header>
            <div className="sat-bank-run-directions-body">
              <p>{math ? 'Solve each problem and select or enter the best answer. Desmos and the formula sheet are available in the Math toolbar.' : 'Read each passage carefully and choose the answer that is best supported by the text and standard written English.'}</p>
              <p>This practice set is untimed. You may move between questions and mark any question for review. Your answers and current position are saved automatically on this device.</p>
              {!math ? <p>Select text to highlight it in one of four colors. Click a highlight to remove it.</p> : null}
              <p className="sat-bank-run-question-topic">Current question: {difficulty(current.question.difficulty)} · {current.question.skill}</p>
            </div>
          </section>
        </div>, document.body,
      ) : null}
      {navigatorOpen ? createPortal(
        <div className="sat-bank-run-overlay" onClick={() => { setNavigatorOpen(false); navigatorButton.current?.focus() }}>
          <section id="bank-question-navigator" className="sat-bank-run-dialog sat-bank-run-navigator" role="dialog" aria-modal="true" aria-labelledby="bank-navigator-title" onClick={(event) => event.stopPropagation()}>
            <header><div><p>Question Bank</p><h2 id="bank-navigator-title">Question navigator</h2></div>
              <button ref={navigatorClose} type="button" aria-label="Close question navigator" onClick={() => { setNavigatorOpen(false); navigatorButton.current?.focus() }}><X size={19} /></button>
            </header>
            <div className="sat-bank-run-divider" />
            <div className="sat-bank-run-navigator-body">
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
            </div>
            <footer><p>{answered} answered · {session.keys.length - answered} unanswered · {session.flagged.length} marked for review</p>
              <button type="button" className="sat-bank-run-primary" onClick={finish}>Finish set <Check size={17} /></button>
            </footer>
          </section>
        </div>, document.body,
      ) : null}
      <DesmosDrawer open={math && calculatorOpen} preload={math} docked={calculatorDocked} onDockedChange={setCalculatorDocked} onClose={() => setCalculatorOpen(false)} workspace="question-bank" />
      <SATFormulaSheet open={formulasOpen} onClose={() => setFormulasOpen(false)} />
    </main>
  )
}
