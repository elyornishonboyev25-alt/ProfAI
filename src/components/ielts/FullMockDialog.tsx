import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/** Accessible glass dialog used by the full mock page (mode choice and section hand-off). */
export default function FullMockDialog({ open, labelledBy, describedBy, closeLabel, onClose, children, wide = false }: {
  open: boolean
  labelledBy: string
  describedBy?: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const dialog = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => (dialog.current?.querySelector<HTMLElement>('[data-autofocus]') ?? dialog.current)?.focus())
    // Escape closes the dialog even when focus was moved outside of it.
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close.current() }
    document.addEventListener('keydown', escape)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', escape)
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open])
  if (!open) return null
  return createPortal(<div className="mrp-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close.current() }}>
    <section ref={dialog} tabIndex={-1} className={`mrp-dialog${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy} onKeyDown={event => {
      if (event.key === 'Tab') {
        const nodes = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)')]
        if (!nodes.length) { event.preventDefault(); return }
        if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length - 1]?.focus() }
        else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) { event.preventDefault(); nodes[0]?.focus() }
      }
    }}>
      <button type="button" className="mrp-dialog-close" aria-label={closeLabel} onClick={() => close.current()}><X size={18} /></button>
      {children}
    </section>
  </div>, document.body)
}
