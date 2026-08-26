import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator,
  FunctionSquare,
  LoaderCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
} from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

type CalculatorTab = 'graphing' | 'scientific'

const SOURCES: Record<CalculatorTab, string> = {
  graphing: 'https://www.desmos.com/calculator?embed',
  scientific: 'https://www.desmos.com/scientific?embed',
}

export default function DesmosDrawer({ open, onClose }: Props) {
  const [tab, setTab] = useState<CalculatorTab>('graphing')
  const [wide, setWide] = useState(false)
  const [loadedTabs, setLoadedTabs] = useState<CalculatorTab[]>([])
  const [visitedTabs, setVisitedTabs] = useState<CalculatorTab[]>([])
  const [reloads, setReloads] = useState<Record<CalculatorTab, number>>({
    graphing: 0,
    scientific: 0,
  })

  useEffect(() => {
    if (!open) return
    setVisitedTabs((current) => (current.includes(tab) ? current : [...current, tab]))
  }, [open, tab])

  const selectTab = (nextTab: CalculatorTab) => {
    setTab(nextTab)
    setVisitedTabs((current) => (current.includes(nextTab) ? current : [...current, nextTab]))
  }

  const reload = () => {
    setLoadedTabs((current) => current.filter((item) => item !== tab))
    setReloads((current) => ({ ...current, [tab]: current[tab] + 1 }))
  }

  return (
    <motion.aside
      role="dialog"
      aria-label="SAT Desmos calculator"
      aria-hidden={!open}
      initial={false}
      animate={open ? { opacity: 1, x: '0%' } : { opacity: 0, x: '110%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 330 }}
      className={`fixed inset-2 z-[170] flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)] sm:inset-y-3 sm:left-auto sm:rounded-[2rem] lg:bottom-[5.75rem] lg:top-[6.75rem] ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      } ${wide ? 'sm:w-[min(52rem,calc(100vw-1.5rem))]' : 'sm:w-[min(36rem,calc(100vw-1.5rem))]'}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-[linear-gradient(135deg,#fff_0%,#fff4f4_52%,#eef6ff_100%)] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-[0_8px_20px_rgba(225,29,72,.25)]">
            <Calculator className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">SAT Desmos</p>
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Built into your test
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={reload}
            aria-label="Reload calculator"
            title="Reload calculator"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setWide((value) => !value)}
            aria-label={wide ? 'Use compact calculator panel' : 'Use wide calculator panel'}
            title={wide ? 'Compact panel' : 'Wider panel'}
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600 sm:flex"
          >
            {wide ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calculator"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="order-3 flex w-full rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => selectTab('graphing')}
            aria-pressed={tab === 'graphing'}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black transition ${
              tab === 'graphing' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FunctionSquare className="h-3.5 w-3.5" /> Graphing
          </button>
          <button
            type="button"
            onClick={() => selectTab('scientific')}
            aria-pressed={tab === 'scientific'}
            className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-black transition ${
              tab === 'scientific' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Scientific
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 bg-slate-100 p-1.5 sm:p-2">
        {visitedTabs.map((calculatorTab) => {
          const isActive = tab === calculatorTab
          const isLoaded = loadedTabs.includes(calculatorTab)
          return (
            <div key={calculatorTab} className={isActive ? 'h-full' : 'hidden'}>
              {!isLoaded ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-slate-500">
                  <div className="text-center">
                    <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-red-600" />
                    <p className="mt-2 text-xs font-bold">Loading Desmos…</p>
                  </div>
                </div>
              ) : null}
              <iframe
                key={`${calculatorTab}-${reloads[calculatorTab]}`}
                title={`Desmos ${calculatorTab} calculator`}
                src={SOURCES[calculatorTab]}
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                allow="clipboard-read; clipboard-write"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => setLoadedTabs((current) => (
                  current.includes(calculatorTab) ? current : [...current, calculatorTab]
                ))}
                className="h-full w-full rounded-xl border border-slate-200 bg-white"
              />
            </div>
          )
        })}
      </div>

      <footer className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-[9px] font-semibold leading-4 text-slate-500 sm:px-4">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        <span>Your work stays here when the panel is closed. The test timer keeps running.</span>
      </footer>
    </motion.aside>
  )
}
