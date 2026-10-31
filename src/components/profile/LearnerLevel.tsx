import { useEffect, useId, useRef, useState } from 'react'
import { ChevronRight, X } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { useCopy } from '@/i18n/interface'
import { learnerLevel } from '@/utils/learnerLevel'
import './learner-level.css'

export function LevelBadge({ xp }: { xp: number }) {
  const { c } = useCopy()
  const gradientId = useId().replace(/:/g, '')
  const { level } = learnerLevel(xp)
  const label = `${c('Level')} ${level}`
  return <span className={`learner-level-badge${level === 10 ? ' is-max' : ''}`} role="img" aria-label={label} title={label}>
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" /><stop offset=".52" stopColor="#edf0f6" /><stop offset="1" stopColor="#cbd2df" /></linearGradient></defs>
      <path d="M22.2 5.7c.8-1.6 2.8-1.6 3.6 0l4.5 9.1 10.1 1.5c1.8.3 2.4 2.3 1.1 3.5l-7.3 7.1 1.7 10c.3 1.8-1.4 3-3 2.2L24 34.4l-9 4.7c-1.6.8-3.3-.4-3-2.2l1.7-10-7.3-7.1c-1.3-1.2-.7-3.2 1.1-3.5l10.1-1.5z" fill={`url(#${gradientId})`} stroke="currentColor" strokeWidth="1.1" />
      <text x="24" y="26" textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={level === 10 ? '13' : '15'} fontWeight="800">{level}</text>
    </svg>
  </span>
}

export default function LearnerLevel({ xp }: { xp: number }) {
  const { c } = useCopy()
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const progress = learnerLevel(xp)
  useEffect(() => {
    const element = dialog.current
    if (!open || !element) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => {
      if (element.open) element.close()
      document.body.style.overflow = overflow
      trigger.current?.focus()
    }
  }, [open])
  return <>
    <button ref={trigger} type="button" className="learner-level-trigger" aria-label={`${c('Level')} ${progress.level}. ${c('View level progress')}`} aria-haspopup="dialog" onClick={() => setOpen(true)}><LevelBadge xp={xp} /></button>
    {open && <dialog ref={dialog} className="learner-level-dialog" aria-labelledby={titleId} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false)
    }}>
    <button type="button" className="learner-level-close" aria-label={c('Close')} onClick={() => setOpen(false)}><X size={19} /></button>
    <div className="learner-level-heading"><LevelBadge xp={xp} /><div><h2 id={titleId}>{c('Level')} {progress.level}</h2><span>{Math.max(0, xp).toLocaleString()} XP</span></div></div>
    <p className="learner-level-next">{progress.level === 10 ? <UiText text="You reached the highest level" /> : <>{c('Level')} {progress.level}<ChevronRight size={15} />{c('Level')} {progress.level + 1}</>}</p>
    <div className="learner-level-progress" role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.progressPercent)}><span style={{ width: `${progress.progressPercent}%` }} /></div>
    <p>{progress.level === 10 ? <UiText text="Level 10 unlocked. Keep building your lifetime XP." /> : <>{progress.remaining.toLocaleString()} XP <UiText text="to the next level" /></>}</p>
    <details><summary><UiText text="How levels work" /></summary><p><UiText text="Earn XP from completed tests, vocabulary practice and active study. Higher levels need more XP. Daily limits and duplicate checks keep progress fair. Your level uses lifetime XP, even when the leaderboard shows a weekly or monthly score." /></p></details>
    </dialog>}
  </>
}
