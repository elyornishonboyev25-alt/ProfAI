import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import './SATSubmissionScreen.css'

/** Let the browser paint the status before local saving and the result render. No timed reveal. */
export function useSATSubmission() {
  const [saving, setSaving] = useState(false)
  const [rendering, startTransition] = useTransition()
  const [error, setError] = useState(false)
  const locked = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => { clearTimeout(timer.current) }, [])
  useEffect(() => { if (!saving && !rendering) locked.current = false }, [saving, rendering])
  const run = useCallback((work: () => void) => {
    if (locked.current) return
    locked.current = true
    setError(false)
    setSaving(true)
    const complete = () => {
      try { startTransition(work) } catch { setError(true) }
      finally { setSaving(false) }
    }
    // Background tabs must submit immediately when the exam timer expires.
    if (document.hidden) complete()
    else timer.current = setTimeout(complete, 0)
  }, [])
  return { pending: saving || rendering, error, run }
}

export default function SATSubmissionScreen() {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  return createPortal(<div className="sat-submission-screen" role="status" aria-live="polite" aria-atomic="true" aria-busy="true">
    <div className="sat-submission-content">
      <div className="sat-submission-dots" aria-hidden="true"><i /><i /><i /></div>
      <p className="sat-submission-eyebrow">SAT · RESULTS</p>
      <h1 ref={heading} tabIndex={-1}>Almost there!</h1>
      <p>We are saving your answers and preparing your results. Please wait.</p>
    </div>
  </div>, document.body)
}
