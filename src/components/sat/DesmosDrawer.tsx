import { useEffect, useState } from 'react'
import {
  FunctionSquare,
  LoaderCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
} from 'lucide-react'

type Props = {
  open: boolean
  preload?: boolean
  onClose: () => void
}

const DESMOS_ORIGIN = 'https://www.desmos.com'
// Use Desmos's complete calculator page, not a re-created or reduced calculator.
// The iframe sandbox keeps navigation contained inside ProfAI.
const DESMOS_GRAPHING_URL = `${DESMOS_ORIGIN}/calculator`

function warmDesmosConnection() {
  if (document.querySelector('link[data-profai-desmos]')) return

  const preconnect = document.createElement('link')
  preconnect.rel = 'preconnect'
  preconnect.href = DESMOS_ORIGIN
  preconnect.dataset.profaiDesmos = 'true'
  document.head.appendChild(preconnect)

  const dnsPrefetch = document.createElement('link')
  dnsPrefetch.rel = 'dns-prefetch'
  dnsPrefetch.href = '//www.desmos.com'
  dnsPrefetch.dataset.profaiDesmos = 'true'
  document.head.appendChild(dnsPrefetch)
}

export default function DesmosDrawer({ open, preload = false, onClose }: Props) {
  const [wide, setWide] = useState(false)
  const [mounted, setMounted] = useState(open)
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!open && !preload) return
    warmDesmosConnection()

    if (open) {
      setMounted(true)
      return
    }

    // Let the SAT question render first, then prepare Desmos in the background.
    const timer = window.setTimeout(() => setMounted(true), 700)
    return () => window.clearTimeout(timer)
  }, [open, preload])

  useEffect(() => {
    if (!mounted || loaded) return
    const timer = window.setTimeout(() => setSlow(true), 10_000)
    return () => window.clearTimeout(timer)
  }, [loaded, mounted, reload])

  const reloadCalculator = () => {
    setLoaded(false)
    setSlow(false)
    setReload((value) => value + 1)
  }

  return (
    <aside
      role="dialog"
      aria-label="Desmos Graphing Calculator"
      aria-hidden={!open}
      className={`fixed inset-2 z-[170] flex-col overflow-hidden rounded-xl border border-[#d1d5db] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.3)] sm:inset-y-3 sm:left-auto lg:bottom-[5.75rem] lg:top-[6.75rem] ${
        open ? 'visible flex' : 'invisible flex pointer-events-none'
      } ${wide ? 'sm:w-[min(52rem,calc(100vw-1.5rem))]' : 'sm:w-[min(36rem,calc(100vw-1.5rem))]'}`}
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-[#d5d8dc] bg-[#f7f7f7] px-2.5 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#2d9f67] text-white">
            <FunctionSquare className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 items-baseline gap-2">
            <p className="truncate text-[13px] font-bold text-[#333]">Desmos</p>
            <p className="hidden truncate text-[11px] font-medium text-[#777] sm:block">
              Graphing Calculator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={reloadCalculator}
            aria-label="Reload Desmos"
            title="Reload Desmos"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#666] transition-colors hover:bg-[#e7e7e7] hover:text-[#222]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setWide((value) => !value)}
            aria-label={wide ? 'Use compact calculator panel' : 'Use wide calculator panel'}
            title={wide ? 'Compact panel' : 'Wider panel'}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-[#666] transition-colors hover:bg-[#e7e7e7] hover:text-[#222] sm:flex"
          >
            {wide ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <span className="mx-0.5 h-5 w-px bg-[#d5d8dc]" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Desmos"
            title="Close Desmos"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#555] transition-colors hover:bg-[#e5e5e5] hover:text-[#111]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 bg-white">
        {mounted ? (
          <iframe
            key={reload}
            title="Official Desmos Graphing Calculator"
            src={DESMOS_GRAPHING_URL}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox allow-presentation"
            allow="clipboard-read; clipboard-write; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="eager"
            onLoad={() => {
              setLoaded(true)
              setSlow(false)
            }}
            className="h-full w-full border-0 bg-white"
          />
        ) : null}

        {!loaded ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#fafafa] text-[#555]">
            <div className="w-full max-w-[15rem] px-5 text-center">
              <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#2d9f67]" />
              <p className="mt-3 text-xs font-bold">Loading Desmos Graphing Calculator…</p>
              {slow ? (
                <>
                  <p className="mt-1.5 text-[10px] leading-4 text-[#777]">The connection is taking longer than expected.</p>
                  <button
                    type="button"
                    onClick={reloadCalculator}
                    className="mt-3 rounded-md bg-[#2d9f67] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#258458]"
                  >
                    Try again
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
