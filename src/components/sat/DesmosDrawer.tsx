import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calculator, ExternalLink, FunctionSquare, X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}
export default function DesmosDrawer({ open, onClose }: Props) {
  const [tab, setTab] = useState<'graphing' | 'scientific'>('graphing')
  const source =
    tab === 'graphing'
      ? 'https://www.desmos.com/calculator?embed'
      : 'https://www.desmos.com/scientific?embed'

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close calculator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[160] cursor-default bg-slate-950/35 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="SAT Desmos calculator"
            initial={{ opacity: 0, x: 48, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-3 bottom-3 top-3 z-[170] flex flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-[0_32px_90px_rgba(15,23,42,0.28)] backdrop-blur-2xl sm:left-auto sm:w-[min(52rem,calc(100vw-2rem))]"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[linear-gradient(135deg,#fff_0%,#fff4f4_52%,#eef6ff_100%)] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-[0_10px_24px_rgba(225,29,72,.28)]">
                  <Calculator className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">SAT Calculator</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Powered by Desmos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setTab('graphing')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black ${
                      tab === 'graphing' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <FunctionSquare className="h-3.5 w-3.5" /> Graphing
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('scientific')}
                    className={`rounded-lg px-3 py-2 text-[11px] font-black ${
                      tab === 'scientific' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Scientific
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close calculator"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            <div className="relative min-h-0 flex-1 bg-white p-2 sm:p-3">
              <iframe
                key={source}
                title={`Desmos ${tab} calculator`}
                src={source}
                allow="clipboard-read; clipboard-write"
                className="h-full min-h-[30rem] w-full rounded-2xl border border-slate-200 bg-white"
              />
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-[10px] font-semibold text-slate-500">
              <span>Desmos is an allowed exam tool; the test timer continues while it is open.</span>
              <a
                href={source.replace('?embed', '')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 font-black text-red-600"
              >
                Open Desmos <ExternalLink className="h-3 w-3" />
              </a>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
