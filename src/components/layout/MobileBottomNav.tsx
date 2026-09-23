import { NavLink, useLocation } from 'react-router-dom'
import { WORKSPACE_NAVIGATION } from '@/config/workspaceNavigation'
import { useCopy } from '@/i18n/interface'
export default function MobileBottomNav() {
  const { pathname } = useLocation()
  const { c } = useCopy()
  return <nav className="liquid-mobile-nav" aria-label={c('Home')}>
    {WORKSPACE_NAVIGATION.map(item => <NavLink key={item.path} to={item.path} aria-current={item.matches(pathname) ? 'page' : undefined} className={item.matches(pathname) ? 'is-current' : ''}>
      <item.icon size={21} aria-hidden="true" /><span>{c(item.mobile)}</span>
    </NavLink>)}
  </nav>
}
