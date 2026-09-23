import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Bot, Building2, ChevronDown, Settings, Trophy, Users, Route } from 'lucide-react'
import { BrandLockup } from '@/components/brand/BrandLogo'
import { WORKSPACE_NAVIGATION } from '@/config/workspaceNavigation'
import { useAuthStore } from '@/store/authStore'
import { isPublicFeatureEnabled } from '@/config/featureFlags'
import { useCopy } from '@/i18n/interface'
import LanguageSelector from './LanguageSelector'

export function Sidebar({ concealed = false }: { concealed?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const user = useAuthStore(s => s.user)
  const { c } = useCopy()
  useEffect(() => {
    if (concealed) ref.current?.setAttribute('inert', '')
    else ref.current?.removeAttribute('inert')
  }, [concealed])
  return <aside ref={ref} aria-hidden={concealed} className={`profai-sidebar liquid-sidebar ${concealed ? 'liquid-sidebar-concealed' : ''}`}>
    <NavLink to="/dashboard" className="liquid-brand-link" aria-label="ProfAI"><BrandLockup iconSize={44} subtitle={c('Your next chapter')} /></NavLink>
    <nav aria-label={c('Home')} className="liquid-nav">
      {WORKSPACE_NAVIGATION.map(item => <NavLink key={item.path} to={item.path} aria-current={item.matches(pathname) ? 'page' : undefined} className={`liquid-nav-item ${item.matches(pathname) ? 'is-current' : ''}`}>
        <item.icon size={20} aria-hidden="true" /><span>{c(item.label)}</span>
      </NavLink>)}
      <details className="liquid-secondary-nav">
        <summary>{c('Study tools')}<ChevronDown size={15} /></summary>
        <NavLink to="/ai-tutor"><Bot size={18} />{c('AI Coach')}</NavLink>
        <NavLink to="/community"><Users size={18} />{c('Community')}</NavLink>
        <NavLink to="/leaderboard"><Trophy size={18} />{c('Leaderboard')}</NavLink>
        <NavLink to="/learning-center"><Building2 size={18} />{c('Learning Center')}</NavLink>
        {isPublicFeatureEnabled('guestDiagnostic') && <NavLink to="/journey-plan"><Route size={18} />{c('My journey plan')}</NavLink>}
      </details>
    </nav>
    <div className="liquid-sidebar-footer"><LanguageSelector />
      <NavLink to="/account" className="liquid-account">
        {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span className="liquid-avatar">{(user?.fullName || 'P').slice(0, 1)}</span>}
        <span><strong>{user?.fullName || 'ProfAI'}</strong><small>{c('Account settings')}</small></span><Settings size={17} />
      </NavLink>
    </div>
  </aside>
}
