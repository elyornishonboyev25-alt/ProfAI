import { Link, useLocation } from 'react-router-dom'
import { Settings, Sparkles, Menu, CircleHelp } from 'lucide-react'
import { useState } from 'react'
import LanguageSelector from './LanguageSelector'
import { useCopy } from '@/i18n/interface'
export default function WorkspaceToolbar() {
  const { c } = useCopy()
  const { pathname } = useLocation()
  const [reduced, setReduced] = useState(() => document.documentElement.dataset.effects === 'reduced')
  function toggleEffects() {
    const next = !reduced
    setReduced(next)
    document.documentElement.dataset.effects = next ? 'reduced' : 'full'
    window.dispatchEvent(new Event('profai:effects-changed'))
    try { localStorage.setItem('profai-effects', next ? 'reduced' : 'full') } catch { /* Optional preference. */ }
  }
  return <div className="workspace-toolbar"><Link to="/dashboard" className="workspace-mobile-brand">Prof<span>AI</span></Link><div className="workspace-toolbar-actions">
    <details className="liquid-mobile-tools"><summary aria-label={c('Study tools')}><Menu size={19} /></summary><nav className="glass-control" aria-label={c('Study tools')} onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>
      <Link to="/academic-skills">{c('Additional practice')}</Link><Link to="/ai-tutor">{c('AI Coach')}</Link><Link to="/community">{c('Community')}</Link><Link to="/leaderboard">{c('Leaderboard')}</Link><Link to="/learning-center">{c('Classes')}</Link><button type="button" onClick={() => window.dispatchEvent(new Event('profai:report-issue'))}>Report an issue</button>
    </nav></details>
    <button type="button" className="liquid-icon-button" onClick={() => window.dispatchEvent(new Event('profai:report-issue'))} aria-label="Report an issue" title="Report an issue"><CircleHelp size={18} /></button>
    <button type="button" className="liquid-icon-button" onClick={toggleEffects} aria-pressed={reduced} aria-label={c(reduced ? 'Enable effects' : 'Reduce effects')} title={c(reduced ? 'Enable effects' : 'Reduce effects')}><Sparkles size={17} /></button>
    <LanguageSelector />{pathname !== '/dashboard' && pathname !== '/' ? <Link to="/account" className="liquid-icon-button" aria-label={c('Account settings')}><Settings size={18} /></Link> : null}
  </div></div>
}
