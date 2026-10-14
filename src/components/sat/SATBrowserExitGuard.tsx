import { useState, type ReactNode } from 'react'
import UiText from '@/components/common/UiText'
import { hasActiveTest } from '@/hooks/useActiveTest'
import { useTestExitGuard } from '@/hooks/useTestExitGuard'
import { useFullscreen } from '@/hooks/useFullscreen'

export default function SATBrowserExitGuard({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { cancelExit, confirmExit } = useTestExitGuard(hasActiveTest, () => setOpen(true))
  const { exit } = useFullscreen()
  return <>
    {children}
    {open && <div className="fixed inset-0 z-[230] flex items-center justify-center bg-slate-950/95 px-4 text-white">
      <section role="dialog" aria-modal="true" aria-labelledby="sat-browser-exit-title" className="w-full max-w-lg text-center" onKeyDown={(event) => {
        if (event.key === 'Escape') { cancelExit(); setOpen(false) }
        if (event.key === 'Tab') {
          const buttons = event.currentTarget.querySelectorAll('button')
          const first = buttons[0]
          const last = buttons[buttons.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }
      }}>
        <h1 id="sat-browser-exit-title" className="text-3xl font-black"><UiText text="Are you sure?" /></h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" autoFocus onClick={() => { cancelExit(); setOpen(false) }} className="rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-950">
            <UiText text="Continue test" />
          </button>
          <button type="button" onClick={() => confirmExit(() => { setOpen(false); void exit() }, () => {})} className="rounded-2xl border border-red-400/40 bg-red-500/15 px-6 py-3.5 text-sm font-black text-red-200">
            <UiText text="Exit & Save" />
          </button>
        </div>
      </section>
    </div>}
  </>
}
