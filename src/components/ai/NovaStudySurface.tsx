import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion'
import './nova-glass.css'

/** Non-modal: the source question stays interactive beside the board. */
export default function NovaStudySurface({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const reduced = useReducedMotion(), drag = useDragControls()
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 1099px)').matches)
  const panel = useRef<HTMLElement>(null), returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1099px)')
    const update = () => setMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => () => document.body.classList.remove('nova-study-open'), [])
  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement
    document.body.classList.add('nova-study-open')
    panel.current?.focus({ preventScroll: true })
    return () => {
      const target = returnFocus.current?.isConnected ? returnFocus.current : document.querySelector<HTMLElement>('.nova-study-launch')
      target?.focus({ preventScroll: true })
    }
  }, [open])
  return <AnimatePresence initial={false} onExitComplete={() => { if (!open) document.body.classList.remove('nova-study-open') }}>
    {open && <motion.aside ref={panel} tabIndex={-1} className="nova-study-dock nova-glass" aria-label={label}
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: mobile ? 0 : 36, y: mobile ? 80 : 0, scale: .98 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, x: mobile ? 0 : 32, y: mobile ? 100 : 0, scale: .985 }}
      transition={reduced ? { duration: .01 } : { type: 'spring', stiffness: 340, damping: 34, mass: .8 }}
      drag={mobile ? 'y' : false} dragListener={false} dragControls={drag} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: .5 }}
      onDragEnd={(_, info) => { if (mobile && (info.offset.y > 85 || info.velocity.y > 650)) onClose() }}
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}>
      <div className="nova-sheet-grip" onPointerDown={event => drag.start(event)}>
        <span aria-hidden="true" className="nova-sheet-handle"/>
      </div>
      {children}
    </motion.aside>}
  </AnimatePresence>
}
