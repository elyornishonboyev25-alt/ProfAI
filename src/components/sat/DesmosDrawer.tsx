import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Columns2,
  FunctionSquare,
  Grip,
  LoaderCircle,
  Move,
  RefreshCw,
  X,
} from 'lucide-react'

type Props = {
  open: boolean
  preload?: boolean
  docked: boolean
  onDockedChange: (docked: boolean) => void
  onClose: () => void
}

type Point = { x: number; y: number }
type PanelSize = { width: number; height: number }

const DESMOS_ORIGIN = 'https://www.desmos.com'
// Keep the complete official calculator contained inside the SAT interface.
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

function initialPanelSize(): PanelSize {
  return {
    width: Math.min(600, Math.max(320, window.innerWidth - 24)),
    height: Math.min(660, Math.max(420, window.innerHeight - 150)),
  }
}

export default function DesmosDrawer({ open, preload = false, docked, onDockedChange, onClose }: Props) {
  const panelRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null)
  const [position, setPosition] = useState<Point | null>(null)
  const [size, setSize] = useState<PanelSize>({ width: 600, height: 660 })
  const [dragging, setDragging] = useState(false)
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

    const timer = window.setTimeout(() => setMounted(true), 700)
    return () => window.clearTimeout(timer)
  }, [open, preload])

  useEffect(() => {
    if (!open || position) return
    const nextSize = initialPanelSize()
    setSize(nextSize)
    setPosition({
      x: Math.max(8, window.innerWidth - nextSize.width - 12),
      y: Math.max(8, Math.min(108, window.innerHeight - nextSize.height - 8)),
    })
  }, [open, position])

  useEffect(() => {
    if (!mounted || loaded) return
    const timer = window.setTimeout(() => setSlow(true), 10_000)
    return () => window.clearTimeout(timer)
  }, [loaded, mounted, reload])

  useEffect(() => {
    if (!open || docked || !panelRef.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const bounds = panelRef.current?.getBoundingClientRect()
      if (!bounds) return
      const width = Math.round(bounds.width)
      const height = Math.round(bounds.height)
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(panelRef.current)
    return () => observer.disconnect()
  }, [docked, open])

  useEffect(() => {
    if (!open || docked) return
    const keepInsideViewport = () => {
      setSize((current) => ({
        width: Math.min(current.width, Math.max(320, window.innerWidth - 16)),
        height: Math.min(current.height, Math.max(360, window.innerHeight - 16)),
      }))
      setPosition((current) => current ? {
        x: Math.max(8, Math.min(current.x, window.innerWidth - 120)),
        y: Math.max(8, Math.min(current.y, window.innerHeight - 64)),
      } : current)
    }
    window.addEventListener('resize', keepInsideViewport)
    return () => window.removeEventListener('resize', keepInsideViewport)
  }, [docked, open])

  const reloadCalculator = () => {
    setLoaded(false)
    setSlow(false)
    setReload((value) => value + 1)
  }

  const startDragging = (event: ReactPointerEvent<HTMLElement>) => {
    if (docked || window.innerWidth < 640 || (event.target as HTMLElement).closest('button')) return
    const bounds = panelRef.current?.getBoundingClientRect()
    if (!bounds) return
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    }
    setPosition({ x: bounds.left, y: bounds.top })
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const movePanel = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    const bounds = panelRef.current?.getBoundingClientRect()
    if (!drag || drag.pointerId !== event.pointerId || !bounds) return
    setPosition({
      x: Math.max(8, Math.min(event.clientX - drag.offsetX, window.innerWidth - Math.min(bounds.width, window.innerWidth - 16) - 8)),
      y: Math.max(8, Math.min(event.clientY - drag.offsetY, window.innerHeight - 52)),
    })
  }

  const stopDragging = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  const floatingStyle = docked ? undefined : {
    left: position?.x,
    right: position ? undefined : 12,
    top: position?.y ?? 108,
    width: size.width,
    height: size.height,
    maxWidth: 'calc(100vw - 16px)',
    maxHeight: 'calc(100vh - 16px)',
  }

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-label="Desmos Graphing Calculator"
      aria-hidden={!open}
      style={floatingStyle}
      className={`fixed flex-col overflow-hidden border border-[#c9cdd2] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.3)] transition-[border-radius,box-shadow] duration-200 ${
        open ? 'visible flex' : 'invisible flex pointer-events-none'
      } ${
        docked
          ? 'inset-2 z-[65] rounded-xl lg:bottom-[5.75rem] lg:left-auto lg:right-3 lg:top-[6.75rem] lg:w-[min(44vw,46rem)]'
          : 'z-[170] min-h-[22rem] min-w-[20rem] resize rounded-xl'
      }`}
    >
      <header
        onPointerDown={startDragging}
        onPointerMove={movePanel}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        className={`flex h-12 shrink-0 touch-none select-none items-center justify-between border-b border-[#d5d8dc] bg-[#f7f7f7] px-2.5 sm:px-3 ${docked ? '' : dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#2d9f67] text-white">
            <FunctionSquare className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 items-baseline gap-2">
            <p className="truncate text-[13px] font-bold text-[#333]">Desmos</p>
            <p className="hidden truncate text-[11px] font-medium text-[#777] sm:block">Graphing Calculator</p>
          </div>
          {!docked ? <span className="hidden items-center gap-1 text-[10px] font-semibold text-slate-400 sm:flex"><Move className="h-3 w-3" /> Drag to move</span> : null}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDockedChange(!docked)}
            aria-label={docked ? 'Return Desmos to floating window' : 'Dock Desmos on the right'}
            title={docked ? 'Floating window' : 'Split view'}
            className={`hidden h-8 w-8 items-center justify-center rounded-full border-2 border-black transition lg:flex ${docked ? 'bg-black text-white' : 'bg-white text-black shadow-[3px_4px_0_#111] hover:-translate-y-0.5'}`}
          >
            <Columns2 className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <button type="button" onClick={reloadCalculator} aria-label="Reload Desmos" title="Reload Desmos" className="flex h-8 w-8 items-center justify-center rounded-md text-[#666] transition-colors hover:bg-[#e7e7e7] hover:text-[#222]">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-[#d5d8dc]" />
          <button type="button" onClick={onClose} aria-label="Close Desmos" title="Close Desmos" className="flex h-8 w-8 items-center justify-center rounded-md text-[#555] transition-colors hover:bg-[#e5e5e5] hover:text-[#111]">
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
                  <button type="button" onClick={reloadCalculator} className="mt-3 rounded-md bg-[#2d9f67] px-3 py-2 text-[10px] font-bold text-white hover:bg-[#258458]">Try again</button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {!docked ? <Grip className="pointer-events-none absolute bottom-0.5 right-0.5 h-4 w-4 rotate-90 text-slate-400" /> : null}
    </aside>
  )
}
