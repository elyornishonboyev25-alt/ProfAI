import { useEffect } from 'react'
import { Calculator, X } from 'lucide-react'
import SATRichText from './SATRichText'

type Props = {
  open: boolean
  onClose: () => void
}

type Diagram = 'circle' | 'rectangle' | 'triangle' | 'right-triangle' | 'thirty-sixty' | 'forty-five' | 'prism' | 'cylinder' | 'sphere' | 'cone' | 'pyramid'

const formulas: Array<{ diagram: Diagram; label: string; formula: string }> = [
  { diagram: 'circle', label: 'Circle', formula: '$A = \\pi r^2$\n$C = 2\\pi r$' },
  { diagram: 'rectangle', label: 'Rectangle', formula: '$A = \\ell w$' },
  { diagram: 'triangle', label: 'Triangle', formula: '$A = \\frac{1}{2}bh$' },
  { diagram: 'right-triangle', label: 'Right triangle', formula: '$c^2 = a^2 + b^2$' },
  { diagram: 'thirty-sixty', label: '30°–60°–90° triangle', formula: '$x, x\\sqrt{3}, 2x$' },
  { diagram: 'forty-five', label: '45°–45°–90° triangle', formula: '$s, s, s\\sqrt{2}$' },
  { diagram: 'prism', label: 'Rectangular prism', formula: '$V = \\ell wh$' },
  { diagram: 'cylinder', label: 'Cylinder', formula: '$V = \\pi r^2h$' },
  { diagram: 'sphere', label: 'Sphere', formula: '$V = \\frac{4}{3}\\pi r^3$' },
  { diagram: 'cone', label: 'Cone', formula: '$V = \\frac{1}{3}\\pi r^2h$' },
  { diagram: 'pyramid', label: 'Rectangular pyramid', formula: '$V = \\frac{1}{3}\\ell wh$' },
]

function FormulaDiagram({ type }: { type: Diagram }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 180 110" role="img" aria-hidden="true" className="mx-auto h-24 w-full max-w-[12rem] text-slate-900 sm:h-28">
      {type === 'circle' ? <><circle cx="83" cy="54" r="39" {...common} /><circle cx="83" cy="54" r="3.5" fill="currentColor" /><path d="M83 54h39" {...common} /><text x="99" y="48" className="fill-current font-serif text-[16px] italic">r</text></> : null}
      {type === 'rectangle' ? <><rect x="38" y="29" width="98" height="54" {...common} /><text x="84" y="101" className="fill-current font-serif text-[16px] italic">ℓ</text><text x="143" y="62" className="fill-current font-serif text-[16px] italic">w</text></> : null}
      {type === 'triangle' ? <><path d="M37 84h109L93 18Z" {...common} /><path d="M93 18v66" strokeDasharray="5 4" {...common} /><path d="M93 74h10v10" {...common} /><text x="86" y="103" className="fill-current font-serif text-[16px] italic">b</text><text x="102" y="58" className="fill-current font-serif text-[16px] italic">h</text></> : null}
      {type === 'right-triangle' ? <><path d="M38 84h108L38 22Z" {...common} /><path d="M38 73h11v11" {...common} /><text x="88" y="102" className="fill-current font-serif text-[16px] italic">a</text><text x="22" y="58" className="fill-current font-serif text-[16px] italic">b</text><text x="92" y="45" className="fill-current font-serif text-[16px] italic">c</text></> : null}
      {type === 'thirty-sixty' ? <><path d="M26 85h130V27Z" {...common} /><path d="M145 74h11v11" {...common} /><text x="65" y="78" className="fill-current font-serif text-[13px]">30°</text><text x="120" y="48" className="fill-current font-serif text-[13px]">60°</text><text x="80" y="41" className="fill-current font-serif text-[15px] italic">2x</text><text x="159" y="62" className="fill-current font-serif text-[15px] italic">x</text><text x="76" y="103" className="fill-current font-serif text-[15px] italic">x√3</text></> : null}
      {type === 'forty-five' ? <><path d="M42 84h100L42 20Z" {...common} /><path d="M42 73h11v11" {...common} /><text x="91" y="76" className="fill-current font-serif text-[13px]">45°</text><text x="48" y="38" className="fill-current font-serif text-[13px]">45°</text><text x="84" y="45" className="fill-current font-serif text-[15px] italic">s√2</text><text x="22" y="58" className="fill-current font-serif text-[15px] italic">s</text><text x="88" y="103" className="fill-current font-serif text-[15px] italic">s</text></> : null}
      {type === 'prism' ? <><path d="M30 39h83v51H30zM113 39l28-18v51l-28 18M30 39l28-18h83" {...common} /><text x="67" y="106" className="fill-current font-serif text-[15px] italic">ℓ</text><text x="129" y="92" className="fill-current font-serif text-[15px] italic">w</text><text x="146" y="53" className="fill-current font-serif text-[15px] italic">h</text></> : null}
      {type === 'cylinder' ? <><ellipse cx="88" cy="27" rx="43" ry="13" {...common} /><path d="M45 27v57M131 27v57" {...common} /><path d="M45 84c0 17 86 17 86 0" {...common} /><path d="M88 27h39" {...common} /><circle cx="88" cy="27" r="3" fill="currentColor" /><text x="106" y="22" className="fill-current font-serif text-[15px] italic">r</text><text x="137" y="60" className="fill-current font-serif text-[15px] italic">h</text></> : null}
      {type === 'sphere' ? <><circle cx="88" cy="55" r="43" {...common} /><ellipse cx="88" cy="55" rx="43" ry="14" strokeDasharray="5 4" {...common} /><circle cx="88" cy="55" r="3" fill="currentColor" /><path d="M88 55h39" {...common} /><text x="106" y="50" className="fill-current font-serif text-[15px] italic">r</text></> : null}
      {type === 'cone' ? <><path d="M88 13 42 83M88 13l46 70" {...common} /><ellipse cx="88" cy="83" rx="46" ry="13" {...common} /><path d="M88 13v70M88 83h40" strokeDasharray="5 4" {...common} /><path d="M88 73h10v10" {...common} /><text x="98" y="52" className="fill-current font-serif text-[15px] italic">h</text><text x="108" y="77" className="fill-current font-serif text-[15px] italic">r</text></> : null}
      {type === 'pyramid' ? <><path d="M87 13 28 82l72 17 51-35-64-51ZM87 13v68M28 82l59-1 64-17M87 81l13 18" {...common} /><path d="M87 71h10v10" {...common} /><text x="97" y="53" className="fill-current font-serif text-[15px] italic">h</text><text x="60" y="102" className="fill-current font-serif text-[15px] italic">ℓ</text><text x="127" y="93" className="fill-current font-serif text-[15px] italic">w</text></> : null}
    </svg>
  )
}

export default function SATFormulaSheet({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="sat-formula-sheet-title" className="fixed inset-0 z-[210] flex flex-col bg-[#f5f4f1]">
      <header className="flex min-h-[5.4rem] shrink-0 items-center justify-between border-b-[3px] border-slate-950 bg-[#c7e7fb] px-4 sm:px-7">
        <div className="flex items-center gap-3">
          <Calculator className="h-7 w-7" strokeWidth={2.4} />
          <h2 id="sat-formula-sheet-title" className="font-serif text-2xl font-bold sm:text-3xl">Formula Sheet</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close formula sheet" className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-black bg-white shadow-[7px_8px_0_#111] transition hover:-translate-y-0.5 sm:h-16 sm:w-16">
          <X className="h-8 w-8" strokeWidth={2.5} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
        <section className="mx-auto min-h-full max-w-[94rem] bg-white px-4 py-7 sm:px-8 sm:py-10" aria-label="SAT geometry reference formulas">
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-6">
            {formulas.slice(0, 6).map((item) => (
              <article key={item.label} className="min-w-0 text-center">
                <FormulaDiagram type={item.diagram} />
                <p className="sr-only">{item.label}</p>
                <SATRichText text={item.formula} className="mt-1 font-serif text-lg leading-8 text-slate-950 sm:text-xl" />
              </article>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
            {formulas.slice(6).map((item) => (
              <article key={item.label} className="min-w-0 text-center">
                <FormulaDiagram type={item.diagram} />
                <p className="sr-only">{item.label}</p>
                <SATRichText text={item.formula} className="mt-1 font-serif text-lg leading-8 text-slate-950 sm:text-xl" />
              </article>
            ))}
          </div>

          <div className="mt-12 space-y-4 border-t border-slate-200 pt-8 font-serif text-lg font-medium leading-8 text-slate-950 sm:text-2xl sm:leading-10">
            <p>The number of degrees of arc in a circle is 360.</p>
            <SATRichText text="The number of radians of arc in a circle is $2\\pi$." />
            <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
