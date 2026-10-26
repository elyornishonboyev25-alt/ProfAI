import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Bot, CircleHelp, GraduationCap, Menu, Settings, ShieldCheck, Sparkles, Trophy, Users, X } from 'lucide-react'
import { useCopy } from '@/i18n/interface'

export default function MobileStudyMenu({ owner }: { owner: boolean }) {
  const { c } = useCopy()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => { setOpen(false) }, [location.key])
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal()
    else if (!open && dialog.current?.open) dialog.current.close()
  }, [open])
  const links = [
    { path: '/academic-skills', label: 'Academic Skills', icon: BookOpen },
    { path: '/ai-tutor', label: 'AI Coach', icon: Bot },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/learning-center', label: 'Classes', icon: GraduationCap },
    { path: '/account', label: 'Account settings', icon: Settings },
    { path: '/premium', label: 'Premium', icon: Sparkles },
    ...(owner ? [{ path: '/owner', label: 'Owner dashboard', icon: ShieldCheck }] : []),
  ]
  return <div className="mobile-study-menu">
    <button ref={trigger} type="button" className="liquid-icon-button" aria-label={c('Study tools')} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={19} /></button>
    <dialog ref={dialog} className="mobile-tools-sheet" aria-labelledby="study-tools-title" onCancel={() => setOpen(false)} onClose={() => { setOpen(false); trigger.current?.focus() }} onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false)
    }}>
      <div className="mobile-sheet-handle" aria-hidden="true" />
      <header><h2 id="study-tools-title">{c('Study tools')}</h2><button type="button" className="liquid-icon-button" aria-label={c('Close')} onClick={() => setOpen(false)}><X size={19} /></button></header>
      <nav aria-label={c('Study tools')}>
        {links.map(({ path, label, icon: Icon }) => <Link key={path} to={path} onClick={() => setOpen(false)}><Icon size={20} /><span>{c(label)}</span></Link>)}
        <button type="button" onClick={() => { setOpen(false); window.dispatchEvent(new Event('profai:report-issue')) }}><CircleHelp size={20} /><span>{c('Report an issue')}</span></button>
      </nav>
    </dialog>
  </div>
}
