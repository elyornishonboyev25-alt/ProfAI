import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import './DesmosDrawer.css'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
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
  workspace?: 'question-bank'
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
    width: Math.min(600, Math.max(240, window.innerWidth - 24)),
    height: Math.min(660, Math.max(240, window.innerHeight - 150)),
  }
}

export default function DesmosDrawer({ open, preload = false, docked, onDockedChange, onClose, workspace }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [dockWidth, setDockWidth] = useState<number | null>(null)
  const dockResizeRef = useRef<{ startX: number; width: number } | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closeHandler = useRef(onClose)
  closeHandler.current = onClose
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

  const resetPosition = () => {
    const nextSize = initialPanelSize()
    setSize(nextSize)
    setPosition({
      x: Math.max(8, window.innerWidth - nextSize.width - 12),
      y: Math.max(8, Math.min(108, window.innerHeight - nextSize.height - 8)),
    })
  }
  useEffect(() => {
    if (open && !position) resetPosition()
  }, [open, position])
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus({ preventScroll: true })
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeHandler.current()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [open])
  useEffect(() => {
    if (!mounted || loaded) return
    const timer = window.setTimeout(() => setSlow(true), 10_000)
    return () => window.clearTimeout(timer)
  }, [loaded, mounted, reload])

  useEffect(() => {
    if (!open || docked || expanded || !panelRef.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const bounds = panelRef.current?.getBoundingClientRect()
      if (!bounds) return
      const width = Math.round(bounds.width)
      const height = Math.round(bounds.height)
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(panelRef.current)
    return () => observer.disconnect()
  }, [docked, expanded, open])

  useEffect(() => {
    if (!open || docked || expanded) return
    const keepInsideViewport = () => {
      setSize((current) => ({
        width: Math.min(current.width, Math.max(240, window.innerWidth - 16)),
        height: Math.min(current.height, Math.max(240, window.innerHeight - 16)),
      }))
      setPosition((current) => current ? {
        x: Math.max(8, Math.min(current.x, window.innerWidth - Math.min(size.width, window.innerWidth - 16) - 8)),
        y: Math.max(8, Math.min(current.y, window.innerHeight - Math.min(size.height, window.innerHeight - 16) - 8)),
      } : current)
    }
    window.addEventListener('resize', keepInsideViewport)
    return () => window.removeEventListener('resize', keepInsideViewport)
  }, [docked, expanded, open, size.width, size.height])

  useEffect(() => {
    if (!workspace) return
    const previous = document.body.style.getPropertyValue('--sat-bank-desmos-width')
    if (dockWidth) document.body.style.setProperty('--sat-bank-desmos-width', `${dockWidth}px`)
    else document.body.style.removeProperty('--sat-bank-desmos-width')
    return () => {
      if (previous) document.body.style.setProperty('--sat-bank-desmos-width', previous)
      else document.body.style.removeProperty('--sat-bank-desmos-width')
    }
  }, [dockWidth, workspace])
  const adjustDockWidth = (width: number) => {
    setDockWidth(Math.round(Math.max(320, Math.min(width, window.innerWidth - 380))))
  }
  const reloadCalculator = () => {
    setLoaded(false)
    setSlow(false)
    setReload((value) => value + 1)
  }

  const startDragging = (event: ReactPointerEvent<HTMLElement>) => {
    if (docked || expanded || window.innerWidth < 1024 || (event.target as HTMLElement).closest('button')) return
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
      y: Math.max(8, Math.min(event.clientY - drag.offsetY, window.innerHeight - Math.min(bounds.height, window.innerHeight - 16) - 8)),
    })
  }

  const stopDragging = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  const floatingStyle = docked || expanded ? undefined : {
    left: position?.x,
    right: position ? undefined : 12,
    top: position?.y ?? 108,
    width: size.width,
    height: size.height,
    maxWidth: 'calc(100vw - 16px)',
    maxHeight: 'calc(100vh - 16px)',
  }

  return createPortal(
    <aside
      ref={panelRef}
      role="dialog"
      aria-label="Desmos Graphing Calculator"
      aria-hidden={!open}
      style={floatingStyle}
      className={`desmos-panel ${docked ? 'desmos-docked' : 'desmos-floating'} ${expanded ? 'desmos-expanded' : ''} ${workspace ? 'desmos-bank' : ''} fixed flex-col overflow-hidden border border-[#c9cdd2] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.3)] transition-[border-radius,box-shadow] duration-200 ${
        open ? 'visible flex' : 'invisible flex pointer-events-none'
      } ${
        docked
          ? 'inset-2 z-[65] rounded-xl lg:bottom-[5.75rem] lg:left-auto lg:right-3 lg:top-[6.75rem] lg:w-[min(44vw,46rem)]'
          : 'z-[170] resize rounded-xl'
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
          {!docked && !expanded ? <span className="hidden items-center gap-1 text-[10px] font-semibold text-slate-400 lg:flex"><Move className="h-3 w-3" /> Drag to move</span> : null}
        </div>

        <div className="desmos-controls flex items-center gap-1">
          <button type="button" onClick={() => setExpanded((value) => !value)}
            aria-label={expanded ? 'Restore Desmos size' : 'Expand Desmos'} title={expanded ? 'Restore size' : 'Expand calculator'}
            className="desmos-control">
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          {!docked && !expanded ? <button type="button" onClick={resetPosition} aria-label="Reset Desmos position" title="Reset position" className="desmos-control desmos-desktop"><RotateCcw className="h-4 w-4" /></button> : null}
          <button
            type="button"
            onClick={() => { setExpanded(false); onDockedChange(!docked) }}
            aria-label={docked ? 'Return Desmos to floating window' : 'Dock Desmos on the right'}
            title={docked ? 'Floating window' : 'Split view'}
            className={`desmos-desktop desmos-dock-control hidden h-8 w-8 items-center justify-center rounded-full border-2 border-black transition lg:flex ${docked ? 'bg-black text-white' : 'bg-white text-black shadow-[3px_4px_0_#111] hover:-translate-y-0.5'}`}
          >
            <Columns2 className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <button type="button" onClick={reloadCalculator} aria-label="Reload Desmos" title="Reload Desmos" className="flex h-8 w-8 items-center justify-center rounded-md text-[#666] transition-colors hover:bg-[#e7e7e7] hover:text-[#222]">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-[#d5d8dc]" />
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close Desmos" title="Close Desmos" className="flex h-8 w-8 items-center justify-center rounded-md text-[#555] transition-colors hover:bg-[#e5e5e5] hover:text-[#111]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {workspace && docked && !expanded ? <div
        role="separator" aria-orientation="vertical" aria-label="Resize calculator panel"
        aria-valuemin={320} aria-valuemax={Math.max(320, window.innerWidth - 380)}
        aria-valuenow={dockWidth ?? Math.round(Math.min(window.innerWidth * .44, 736))}
        tabIndex={open ? 0 : -1} className="desmos-resize-handle"
        title="Drag to resize · Arrow keys adjust width · Double-click to reset"
        onPointerDown={(event) => {
          dockResizeRef.current = { startX: event.clientX, width: panelRef.current?.getBoundingClientRect().width ?? 400 }
          event.currentTarget.setPointerCapture(event.pointerId)
          event.preventDefault()
        }}
        onPointerMove={(event) => {
          const resize = dockResizeRef.current
          if (resize) adjustDockWidth(resize.width + resize.startX - event.clientX)
        }}
        onPointerUp={(event) => { dockResizeRef.current = null; event.currentTarget.releasePointerCapture(event.pointerId) }}
        onPointerCancel={() => { dockResizeRef.current = null }}
        onDoubleClick={() => setDockWidth(null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault()
            adjustDockWidth((panelRef.current?.getBoundingClientRect().width ?? 400) + (event.key === 'ArrowLeft' ? 32 : -32))
          }
        }}
      ><span /></div> : null}
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
            tabIndex={open ? 0 : -1}
            onError={() => { setLoaded(false); setSlow(true) }}
            onLoad={() => {
              setLoaded(true)
              setSlow(false)
            }}
            className="h-full w-full border-0 bg-white"
          />
        ) : null}

        {!loaded ? (
          <div role="status" aria-live="polite" className="absolute inset-0 z-10 flex items-center justify-center bg-[#fafafa] text-[#555]">
            <div className="w-full max-w-[15rem] px-5 text-center">
              <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#2d9f67]" />
              <p className="mt-3 text-xs font-bold">Loading Desmos Graphing Calculator…</p>
              {slow ? (
                <>
                  <p className="mt-1.5 text-[10px] leading-4 text-[#777]">The connection is taking longer than expected.</p>
                  <button type="button" onClick={reloadCalculator} className="mt-3 rounded-md bg-[#2d9f67] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#258458]">Try again</button>
                  <a href={DESMOS_GRAPHING_URL} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-1 text-xs underline">Open Desmos in a new tab <ExternalLink className="h-3 w-3" /></a>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {!docked && !expanded ? <Grip className="pointer-events-none absolute bottom-0.5 right-0.5 h-4 w-4 rotate-90 text-slate-400" /> : null}
    </aside>,
    document.body,
  )
}
