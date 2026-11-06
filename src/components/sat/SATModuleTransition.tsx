import { useEffect, useRef } from 'react'
import { ArrowRight, Check, Clock3 } from 'lucide-react'
import UiText from '@/components/common/UiText'
import type { SATModule } from '@/features/sat/practiceTest4'
import './SATModuleTransition.css'

export default function SATModuleTransition({ previous, next }: { previous: SATModule; next: SATModule }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  return <main className="sat-module-transition" aria-busy="true">
    <section className="sat-module-transition__card" role="status" aria-live="polite" aria-atomic="true">
      <p className="sat-module-transition__section"><UiText text={next.section === 'math' ? 'Math' : 'Reading and Writing'} /></p>
      <div className="sat-module-transition__steps" aria-hidden="true">
        <span><i><Check size={15} /></i><UiText text="Module 1" /></span>
        <ArrowRight size={16} />
        <span className="is-next"><i>2</i><UiText text="Module 2" /></span>
      </div>
      <div className="sat-module-transition__loader" aria-hidden="true"><span /><strong>2</strong></div>
      <h1 ref={heading} tabIndex={-1}><UiText text="Moving to Module 2" /></h1>
      <p className="sat-module-transition__message"><UiText text="Your answers are saved. The next module will open automatically." /></p>
      <div className="sat-module-transition__saved"><Check size={15} /><span><UiText text="{{value1}} complete" values={{ value1: previous.shortTitle }} /></span></div>
      <p className="sat-module-transition__timing"><Clock3 size={16} /><UiText text="Your next module starts with its full time." /></p>
    </section>
  </main>
}
