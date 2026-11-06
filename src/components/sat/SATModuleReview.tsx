import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDashed, Flag } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { useCopy } from '@/i18n/interface'
import type { SATAttempt, SATModule } from '@/features/sat/practiceTest4'
import './SATModuleReview.css'

type Filter = 'all' | 'answered' | 'unanswered' | 'flagged'

export default function SATModuleReview({ module, attempt, time, final, continueLabel, onQuestion, onBack, onContinue }: {
  module: SATModule; attempt: SATAttempt; time: string; final: boolean; continueLabel: string
  onQuestion: (index: number) => void; onBack: () => void; onContinue: () => void
}) {
  const { c } = useCopy()
  const [filter, setFilter] = useState<Filter>('all')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const answered = (id: string) => Boolean(attempt.answers[id]?.trim())
  const counts = {
    all: module.questions.length,
    answered: module.questions.filter(q => answered(q.id)).length,
    unanswered: module.questions.filter(q => !answered(q.id)).length,
    flagged: module.questions.filter(q => attempt.flagged.includes(q.id)).length,
  }
  const filters = [
    { id: 'answered', label: 'Answered', icon: CheckCircle2 },
    { id: 'flagged', label: 'Marked for Review', icon: Flag },
    { id: 'unanswered', label: 'Unanswered', icon: CircleDashed },
  ] as const
  const visible = module.questions.map((q, index) => ({ q, index })).filter(({ q }) => filter === 'all' || (filter === 'flagged' ? attempt.flagged.includes(q.id) : filter === 'answered' ? answered(q.id) : !answered(q.id)))
  return <section className="sat-module-review" aria-labelledby="sat-module-review-title">
    <div className="sat-module-review__container">
      <header className="sat-module-review__top">
        <button type="button" onClick={onBack}><ArrowLeft size={17} /><UiText text="Back to questions" /></button>
        <span>{module.shortTitle}{attempt.mode === 'exam' && <> · <strong>{time}</strong></>}</span>
      </header>
      <section className="sat-module-review__sheet">
        <div className="sat-module-review__heading">
          <div><h1 id="sat-module-review-title" ref={heading} tabIndex={-1}><UiText text="Review module" /></h1>
          <p><UiText text="Select a question to review or change your answer." /></p></div>
          <span className="sat-module-review__progress">{counts.answered}<small> / {counts.all}</small></span>
        </div>
        <div className="sat-module-review__stats" role="group" aria-label={c("Question status filters")}>
          {filters.map(({ id, label, icon: Icon }) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(filter === id ? 'all' : id)}>
            <Icon size={21} /><strong>{counts[id]}</strong><span><UiText text={label} /></span>
          </button>)}
        </div>
        <div className="sat-module-review__grid-heading"><h2><UiText text={filter === 'all' ? 'All questions' : filters.find(item => item.id === filter)!.label} /></h2>
          {filter !== 'all' && <button type="button" onClick={() => setFilter('all')}><UiText text="Show all questions" /></button>}
        </div>
        <div className="sat-module-review__grid">
          {visible.map(({ q, index }) => <button key={q.id} type="button" data-answered={answered(q.id)} aria-label={`${c('Question')} ${q.number}, ${c(answered(q.id) ? 'Answered' : 'Unanswered')}${attempt.flagged.includes(q.id) ? `, ${c('Marked for Review')}` : ''}`} onClick={() => onQuestion(index)}>
            {q.number}{attempt.flagged.includes(q.id) && <Flag size={13} aria-hidden="true" />}
          </button>)}
          {!visible.length && <p className="sat-module-review__empty"><UiText text="No questions match this filter." /></p>}
        </div>
        <div className="sat-module-review__legend"><span><i /><UiText text="Answered" /></span><span><i className="is-blank" /><UiText text="Unanswered" /></span><span><Flag size={13} /><UiText text="Marked for Review" /></span></div>
        <footer className="sat-module-review__footer"><p><UiText text={final ? 'Submit when you are ready. You cannot change answers after submission.' : 'You cannot return to this module after continuing.'} /></p>
          <button type="button" onClick={onContinue}><UiText text={continueLabel} /><ArrowRight size={17} /></button>
        </footer>
      </section>
    </div>
  </section>
}
