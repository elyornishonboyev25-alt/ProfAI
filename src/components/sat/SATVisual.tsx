import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImageOff, Maximize2, RefreshCw, X } from 'lucide-react'

type Props = {
  asset: string
  alt: string
  className?: string
  imageClassName?: string
  onError?: () => void
}

export default function SATVisual({ asset, alt, className = '', imageClassName = '', onError }: Props) {
  const [open, setOpen] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [automaticRetries, setAutomaticRetries] = useState(0)
  const [failed, setFailed] = useState(false)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const displayedAsset = loadAttempt === 0
    ? asset
    : `${asset}${asset.includes('?') ? '&' : '?'}sat-retry=${loadAttempt}`

  useEffect(() => {
    setOpen(false)
    setLoadAttempt(0)
    setAutomaticRetries(0)
    setFailed(false)
    if (retryTimer.current) clearTimeout(retryTimer.current)
  }, [asset])

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const handleLoadError = () => {
    if (automaticRetries < 2) {
      retryTimer.current = setTimeout(() => {
        setAutomaticRetries((count) => count + 1)
        setLoadAttempt((attempt) => attempt + 1)
      }, automaticRetries === 0 ? 250 : 750)
      return
    }

    setFailed(true)
    setOpen(false)
    onError?.()
  }

  const retry = () => {
    if (retryTimer.current) clearTimeout(retryTimer.current)
    setAutomaticRetries(0)
    setFailed(false)
    setLoadAttempt((attempt) => attempt + 1)
  }

  return (
    <>
      {failed ? (
        <div className={`flex min-h-36 max-w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-amber-400 bg-amber-50 px-5 py-6 text-center text-amber-950 ${className}`}>
          <ImageOff className="h-6 w-6" />
          <p className="text-xs font-bold">The reference visual could not be loaded.</p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-900 shadow-sm transition hover:bg-amber-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry image
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Enlarge ${alt}`}
          onClick={() => setOpen(true)}
          className={`group relative block max-w-full cursor-zoom-in overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`}
        >
          <img src={displayedAsset} alt={alt} onError={handleLoadError} className={imageClassName} />
          <span className="pointer-events-none absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950/75 text-white opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2 className="h-4 w-4" />
          </span>
        </button>
      )}

      {open && !failed
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm sm:p-8"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) setOpen(false)
              }}
            >
              <button
                type="button"
                aria-label="Close enlarged image"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-950 shadow-xl transition hover:bg-slate-100 sm:right-7 sm:top-7"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={displayedAsset}
                alt={alt}
                onError={handleLoadError}
                className="max-h-[90vh] max-w-[96vw] rounded-xl bg-white object-contain shadow-2xl"
              />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
