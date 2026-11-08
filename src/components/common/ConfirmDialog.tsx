import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import '@/styles/exam-flow.css'

export default function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'Cancel', destructive = false, onConfirm, onClose, children }: {
  open: boolean; title: string; description: string; confirmLabel: string; cancelLabel?: string
  destructive?: boolean; onConfirm: () => void | Promise<void>; onClose: () => void; children?: ReactNode
}) {
  const { c: uiCopy } = useCopy()
  const id = useId()
  const dialog = useRef<HTMLElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open) return
    setError('')
    const trigger = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector<HTMLElement>('[data-cancel]')?.focus()
    return () => { document.body.style.overflow = overflow; if (trigger?.isConnected) trigger.focus() }
  }, [open])
  if (!open) return null
  return createPortal(<div className="flow-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section ref={dialog} className="flow-dialog" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={busy} onKeyDown={event => {
      if (event.key === 'Escape' && !busy) { event.stopPropagation(); onClose() }
      if (event.key === 'Tab') {
        const nodes = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)')]
        if (!nodes.length) { event.preventDefault(); return }
        if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length - 1]?.focus() }
        else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) { event.preventDefault(); nodes[0]?.focus() }
      }
    }}>
      <button className="flow-dialog-close" aria-label={uiCopy("Close confirmation")} disabled={busy} onClick={onClose}><X size={19} /></button>
      <span className="flow-dialog-icon"><AlertTriangle size={25} /></span>
      <h2 id={`${id}-title`}><UiText text={title} /></h2>
      <p id={`${id}-description`}><UiText text={description} /></p>
      {children}
      {error && <p role="alert" className="flow-error"><UiText text={error} /></p>}
      <div className="flow-dialog-actions">
        <button type="button" data-cancel className="flow-button" disabled={busy} onClick={onClose}><UiText text={cancelLabel} /></button>
        <button type="button" className={`flow-button ${destructive ? 'is-danger' : 'is-primary'}`} disabled={busy} onClick={async () => {
          setBusy(true); setError('')
          try { await onConfirm() } catch (failure) { setError(failure instanceof Error ? failure.message : 'Please try again. Your saved progress has been kept.') }
          finally { setBusy(false) }
        }}>{busy && <Loader2 size={17} className="flow-spin" />}<UiText text={confirmLabel} /></button>
      </div>
    </section>
  </div>, document.body)
}
