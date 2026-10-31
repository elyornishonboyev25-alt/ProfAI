import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock3, ArrowRight } from 'lucide-react'
import '@/styles/exam-flow.css'

export default function LeaderboardEligibilityNotice({ seconds, minimumSeconds, onContinue }: { seconds: number; minimumSeconds: number; onContinue: () => void }) {
  const action = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    action.current?.focus()
    return () => { document.body.style.overflow = overflow; if (before?.isConnected) before.focus() }
  }, [])
  const duration = `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  return createPortal(<div className="flow-dialog-backdrop"><section className="flow-dialog eligibility-notice" role="alertdialog" aria-modal="true" aria-labelledby="eligibility-notice-title" aria-describedby="eligibility-notice-description" onKeyDown={event => {
    if (event.key === 'Tab') { event.preventDefault(); action.current?.focus() }
  }}><span className="flow-dialog-icon"><Clock3 size={26} /></span><h2 id="eligibility-notice-title">Your result is ready</h2><p id="eligibility-notice-description">You finished in <strong>{duration}</strong>, below the {Math.round(minimumSeconds / 60)} minute minimum for this test. Your score will be saved, but this attempt will not count toward the leaderboard.</p><div className="flow-dialog-actions"><button ref={action} type="button" className="flow-button is-primary" onClick={onContinue}>OK, view results <ArrowRight size={16} /></button></div></section></div>, document.body)
}
