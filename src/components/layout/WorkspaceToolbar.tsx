import { BrandLogo } from '@/components/brand/BrandLogo'
import { Link, useLocation } from 'react-router-dom'
import { Settings, CircleHelp, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import { useCopy } from '@/i18n/interface'
import { useAuthStore } from '@/store/authStore'
import AccountBadge from '@/features/billing/AccountBadge'
import { hasOwnerAccess } from '@/utils/ownerAccess'
import MobileStudyMenu from './MobileStudyMenu'
import { useFullscreen } from '@/hooks/useFullscreen'
export default function WorkspaceToolbar() {
  const { c } = useCopy()
  const owner = useAuthStore(state => hasOwnerAccess(state.user?.email, state.user?.nickname))
  const { pathname } = useLocation()
  const { isFullscreen, supported, toggle } = useFullscreen()
  return <div className="workspace-toolbar"><Link to="/dashboard" className="workspace-mobile-brand" aria-label="ivyGoo home"><BrandLogo height={36} /></Link><div className="workspace-toolbar-actions">
    <MobileStudyMenu owner={owner} />
    {supported && <button type="button" className="liquid-icon-button workspace-fullscreen" aria-label={c(isFullscreen ? 'Exit full screen' : 'Full screen')} aria-pressed={isFullscreen} onClick={toggle}>{isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>}
    <button type="button" className="liquid-icon-button" onClick={() => window.dispatchEvent(new Event('profai:report-issue'))} aria-label={c('Report an issue')} title={c('Report an issue')}><CircleHelp size={18} /></button>
    {owner && <Link to="/owner" className="liquid-icon-button" aria-label={c('Owner dashboard')} title={c('Owner dashboard')}><ShieldCheck size={18} /></Link>}
    <AccountBadge /><LanguageSelector />{pathname !== '/dashboard' && pathname !== '/' ? <Link to="/account" className="liquid-icon-button" aria-label={c('Account settings')}><Settings size={18} /></Link> : null}
  </div></div>
}
