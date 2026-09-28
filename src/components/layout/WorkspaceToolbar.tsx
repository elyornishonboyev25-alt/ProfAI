import { Link, useLocation } from 'react-router-dom'
import { Settings, Menu, CircleHelp, ShieldCheck } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import { useCopy } from '@/i18n/interface'
import { useAuthStore } from '@/store/authStore'
export default function WorkspaceToolbar() {
  const { c } = useCopy()
  const owner = useAuthStore(state => state.user?.email.trim().toLowerCase() === 'elyornishonboyev000@gmail.com')
  const { pathname } = useLocation()
  return <div className="workspace-toolbar"><Link to="/dashboard" className="workspace-mobile-brand">Prof<span>AI</span></Link><div className="workspace-toolbar-actions">
    <details className="liquid-mobile-tools"><summary aria-label={c('Study tools')}><Menu size={19} /></summary><nav className="glass-control" aria-label={c('Study tools')} onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>
      <Link to="/journey-plan">{c('Study Plan')}</Link><Link to="/academic-skills">{c('Academic Skills')}</Link><Link to="/ai-tutor">{c('AI Coach')}</Link><Link to="/community">{c('Community')}</Link><Link to="/leaderboard">{c('Leaderboard')}</Link><Link to="/learning-center">{c('Classes')}</Link>{owner && <Link to="/owner">Boshqaruv paneli</Link>}<button type="button" onClick={() => window.dispatchEvent(new Event('profai:report-issue'))}>Report an issue</button>
    </nav></details>
    <button type="button" className="liquid-icon-button" onClick={() => window.dispatchEvent(new Event('profai:report-issue'))} aria-label="Report an issue" title="Report an issue"><CircleHelp size={18} /></button>
    {owner && <Link to="/owner" className="liquid-icon-button" aria-label="Boshqaruv paneli" title="Boshqaruv paneli"><ShieldCheck size={18} /></Link>}
    <LanguageSelector />{pathname !== '/dashboard' && pathname !== '/' ? <Link to="/account" className="liquid-icon-button" aria-label={c('Account settings')}><Settings size={18} /></Link> : null}
  </div></div>
}
