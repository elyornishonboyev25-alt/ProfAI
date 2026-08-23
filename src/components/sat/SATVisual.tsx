import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X } from 'lucide-react'

type Props = {
  asset: string
  alt: string
  className?: string
  imageClassName?: string
  onError?: () => void
}

export default function SATVisual({ asset, alt, className = '', imageClassName = '', onError }: Props) {
  const [open, setOpen] = useState(false)

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

  return (
    <>
      <button
        type="button"
        aria-label={`Enlarge ${alt}`}
        onClick={() => setOpen(true)}
        className={`group relative block max-w-full cursor-zoom-in overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${className}`}
      >
        <img src={asset} alt={alt} onError={onError} className={imageClassName} />
        <span className="pointer-events-none absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950/75 text-white opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>

      {open
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
                src={asset}
                alt={alt}
                className="max-h-[90vh] max-w-[96vw] rounded-xl bg-white object-contain shadow-2xl"
              />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
