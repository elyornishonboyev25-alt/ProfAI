import { useEffect, useRef } from 'react'
import { Sheet, X } from 'lucide-react'
import SATRichText from './SATRichText'
import './SATFormulaSheet.css'

type Props = {
  open: boolean
  onClose: () => void
}

type Diagram = 'circle' | 'rectangle' | 'triangle' | 'right-triangle' | 'thirty-sixty' | 'forty-five' | 'prism' | 'cylinder' | 'sphere' | 'cone' | 'pyramid'

// College Board SAT Practice Test 10, Math reference (page 30):
// https://satsuite.collegeboard.org/media/pdf/sat-practice-test-10-digital.pdf
const formulas: Array<{ diagram: Diagram; label: string; formula: string; note?: string }> = [
  { diagram: 'circle', label: 'Circle', formula: '$A = \\pi r^2$\n$C = 2\\pi r$' },
  { diagram: 'rectangle', label: 'Rectangle', formula: '$A = \\ell w$' },
  { diagram: 'triangle', label: 'Triangle', formula: '$A = \\frac{1}{2}bh$' },
  { diagram: 'right-triangle', label: 'Right triangle', formula: '$c^2 = a^2 + b^2$' },
  { diagram: 'thirty-sixty', label: '30°–60°–90° triangle', formula: '$x, x\\sqrt{3}, 2x$', note: 'Opposite 30°, 60°, 90°, respectively.' },
  { diagram: 'forty-five', label: '45°–45°–90° triangle', formula: '$s, s, s\\sqrt{2}$', note: 'Equal legs: s. Hypotenuse: s√2.' },
  { diagram: 'prism', label: 'Rectangular prism', formula: '$V = \\ell wh$' },
  { diagram: 'cylinder', label: 'Cylinder', formula: '$V = \\pi r^2h$' },
  { diagram: 'sphere', label: 'Sphere', formula: '$V = \\frac{4}{3}\\pi r^3$' },
  { diagram: 'cone', label: 'Cone', formula: '$V = \\frac{1}{3}\\pi r^2h$' },
  { diagram: 'pyramid', label: 'Rectangular pyramid', formula: '$V = \\frac{1}{3}\\ell wh$' },
]

function FormulaDiagram({ type }: { type: Diagram }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 180 110" aria-hidden="true" focusable="false" className="sat-formula-diagram">
      {type === 'circle' ? <><circle cx="83" cy="54" r="39" {...common} /><circle cx="83" cy="54" r="3.5" fill="currentColor" /><path d="M83 54h39" {...common} /><text x="99" y="48" className="fill-current font-serif text-[16px] italic">r</text></> : null}
      {type === 'rectangle' ? <><rect x="38" y="29" width="98" height="54" {...common} /><text x="84" y="101" className="fill-current font-serif text-[16px] italic">ℓ</text><text x="143" y="62" className="fill-current font-serif text-[16px] italic">w</text></> : null}
      {type === 'triangle' ? <><path d="M37 84h109L93 18Z" {...common} /><path d="M93 18v66" strokeDasharray="5 4" {...common} /><path d="M93 74h10v10" {...common} /><text x="86" y="103" className="fill-current font-serif text-[16px] italic">b</text><text x="102" y="58" className="fill-current font-serif text-[16px] italic">h</text></> : null}
      {type === 'right-triangle' ? <><path d="M38 84h108L38 22Z" {...common} /><path d="M38 73h11v11" {...common} /><text x="88" y="102" className="fill-current font-serif text-[16px] italic">a</text><text x="22" y="58" className="fill-current font-serif text-[16px] italic">b</text><text x="92" y="45" className="fill-current font-serif text-[16px] italic">c</text></> : null}
      {type === 'thirty-sixty' ? <><path d="M30 85h104V25Z" {...common} /><path d="M124 75h10v10" {...common} /><text x="57" y="79" className="fill-current font-serif text-[13px]">30°</text><text x="105" y="52" className="fill-current font-serif text-[13px]">60°</text><text x="69" y="44" className="fill-current font-serif text-[15px] italic">2x</text><text x="142" y="60" className="fill-current font-serif text-[15px] italic">x</text><text x="69" y="104" className="fill-current font-serif text-[15px] italic">x√3</text></> : null}
      {type === 'forty-five' ? <><path d="M48 87h72L48 15Z" {...common} /><path d="M48 77h10v10" {...common} /><text x="82" y="80" className="fill-current font-serif text-[13px]">45°</text><text x="53" y="42" className="fill-current font-serif text-[13px]">45°</text><text x="91" y="44" className="fill-current font-serif text-[15px] italic">s√2</text><text x="30" y="56" className="fill-current font-serif text-[15px] italic">s</text><text x="80" y="105" className="fill-current font-serif text-[15px] italic">s</text></> : null}
      {type === 'prism' ? <><path d="M30 39h83v51H30zM113 39l28-18v51l-28 18M30 39l28-18h83" {...common} /><text x="67" y="106" className="fill-current font-serif text-[15px] italic">ℓ</text><text x="129" y="92" className="fill-current font-serif text-[15px] italic">w</text><text x="146" y="53" className="fill-current font-serif text-[15px] italic">h</text></> : null}
      {type === 'cylinder' ? <><ellipse cx="88" cy="27" rx="43" ry="13" {...common} /><path d="M45 27v57M131 27v57M45 84a43 13 0 0 0 86 0" {...common} /><path d="M45 84a43 13 0 0 1 86 0" strokeDasharray="5 4" {...common} /><path d="M88 27h43" {...common} /><circle cx="88" cy="27" r="3" fill="currentColor" /><text x="106" y="22" className="fill-current font-serif text-[15px] italic">r</text><text x="139" y="60" className="fill-current font-serif text-[15px] italic">h</text></> : null}
      {type === 'sphere' ? <><circle cx="88" cy="55" r="43" {...common} /><ellipse cx="88" cy="55" rx="43" ry="14" strokeDasharray="5 4" {...common} /><circle cx="88" cy="55" r="3" fill="currentColor" /><path d="M88 55h43" {...common} /><text x="106" y="50" className="fill-current font-serif text-[15px] italic">r</text></> : null}
      {type === 'cone' ? <><path d="M88 13 42 83M88 13l46 70M42 83a46 13 0 0 0 92 0" {...common} /><path d="M42 83a46 13 0 0 1 92 0M88 13v70M88 83h46" strokeDasharray="5 4" {...common} /><path d="M88 73h10v10" {...common} /><text x="98" y="52" className="fill-current font-serif text-[15px] italic">h</text><text x="108" y="77" className="fill-current font-serif text-[15px] italic">r</text></> : null}
      {type === 'pyramid' ? <><path d="M87 13 28 76l76 22 48-32-65-53ZM87 13l17 85" {...common} /><path d="M28 76l48-32 76 22M87 13 76 44M87 13v58" strokeDasharray="5 4" {...common} /><path d="m87 71 9-6v-9l-9 6" {...common} /><text x="97" y="45" className="fill-current font-serif text-[15px] italic">h</text><text x="58" y="105" className="fill-current font-serif text-[15px] italic">ℓ</text><text x="132" y="93" className="fill-current font-serif text-[15px] italic">w</text></> : null}
    </svg>
  )
}

export default function SATFormulaSheet({ open, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closeHandler = useRef(onClose)
  closeHandler.current = onClose

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    closeRef.current?.focus({ preventScroll: true })
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault()
        closeHandler.current()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      // Do not move focus away from an answer the learner is editing.
      if (opener?.isConnected && (panel?.contains(document.activeElement) || document.activeElement === document.body)) {
        opener.focus({ preventScroll: true })
      }
    }
  }, [open])

  if (!open) return null

  return (
    <aside ref={panelRef} id="sat-formula-sheet" aria-labelledby="sat-formula-sheet-title" className="sat-formula-sheet">
      <header className="sat-formula-header">
        <div className="sat-formula-heading">
          <span className="sat-formula-icon"><Sheet size={20} aria-hidden="true" /></span>
          <div>
            <p>SAT Math · Reference</p>
            <h2 id="sat-formula-sheet-title">Formula Sheet</h2>
          </div>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close formula sheet" className="sat-formula-close">
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="sat-formula-content" tabIndex={0} role="region" aria-label="SAT geometry reference formulas">
        {[
          { title: 'Area & length', items: formulas.slice(0, 4) },
          { title: 'Special right triangles', items: formulas.slice(4, 6) },
          { title: 'Volume', items: formulas.slice(6) },
        ].map((group) => (
          <section key={group.title} className="sat-formula-section" aria-label={group.title}>
            <h3>{group.title}</h3>
            <div className="sat-formula-grid">
              {group.items.map((item) => (
                <article key={item.label} className="sat-formula-card">
                  <h4>{item.label}</h4>
                  <FormulaDiagram type={item.diagram} />
                  <SATRichText text={item.formula} className="sat-formula-equation" />
                  {item.note ? <p className="sat-formula-note">{item.note}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="sat-formula-section sat-formula-facts" aria-label="Angle facts">
          <h3>Angle facts</h3>
          <SATRichText text="A full circle is $360^\\circ$, or $2\\pi$ radians." />
          <SATRichText text="The interior angles of a triangle add up to $180^\\circ$." />
          <p className="sat-formula-note">A = area · C = circumference · V = volume.<br />r = radius · ℓ = length · w = width.<br />b = base · h = perpendicular height.</p>
        </section>
      </div>
    </aside>
  )
}
