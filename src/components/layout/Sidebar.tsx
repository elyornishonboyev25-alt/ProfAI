import { isPremiumUser } from '@/utils/premiumAccess'
import CrownBadge from '@/components/fx/CrownBadge'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Bot, ChevronDown, ChevronLeft, Crown, Settings, Trophy, Users, CircleHelp, Languages } from 'lucide-react'
import { BrandLockup } from '@/components/brand/BrandLogo'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { WORKSPACE_NAVIGATION } from '@/config/workspaceNavigation'
import { useAuthStore } from '@/store/authStore'
import { useCopy } from '@/i18n/interface'
import LanguageSelector from './LanguageSelector'
import { useAccountAccess } from '@/features/billing/useAccountAccess'

// Keep in step with --rail-duration and --rail-ease in workspace-refinement.css.
const RAIL_DURATION = 320
const RAIL_EASE = 'cubic-bezier(.22,1,.36,1)'

function prefersStillRail() {
  const root = document.documentElement
  return root.dataset.effects === 'reduced' || root.dataset.motion === 'minimal' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Sidebar({ concealed = false, collapsed = false, onToggle }: { concealed?: boolean; collapsed?: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const user = useAuthStore(s => s.user)
  const access = useAccountAccess()
  const premiumMember = isPremiumUser(access ? { ...user, access } : user)
  const unlimited = access?.active && access.kind === 'UNLIMITED'
  const hasGrantedAccess = access?.active && access.kind !== 'FREE'
  const { c } = useCopy()
  const planLabel = unlimited ? 'Unlimited' : hasGrantedAccess ? c('Plans') : c('Upgrade')
  useEffect(() => {
    if (concealed) ref.current?.setAttribute('inert', '')
    else ref.current?.removeAttribute('inert')
  }, [concealed])
  // The page follows the rail with a transform (FLIP), so its content lays out
  // once at the new width instead of on every frame of a margin transition.
  const mainLeftBeforeToggle = useRef<number | null>(null)
  const mainMotion = useRef<Animation | null>(null)
  const workspaceMain = () => ref.current?.parentElement?.querySelector<HTMLElement>(':scope > .workspace-main') ?? null
  const toggle = () => {
    const main = workspaceMain()
    mainLeftBeforeToggle.current = main && window.matchMedia('(min-width: 1024px)').matches && !prefersStillRail() ? main.getBoundingClientRect().left : null
    onToggle()
  }
  useLayoutEffect(() => {
    const first = mainLeftBeforeToggle.current
    mainLeftBeforeToggle.current = null
    const main = workspaceMain()
    if (first === null || !main) return
    mainMotion.current?.cancel()
    const delta = first - main.getBoundingClientRect().left
    if (Math.abs(delta) < 1) return
    const frame = main.parentElement
    if (frame) frame.style.overflowX = 'clip'
    const motion = main.animate([{ transform: `translate3d(${delta}px,0,0)` }, { transform: 'translate3d(0,0,0)' }], { duration: RAIL_DURATION, easing: RAIL_EASE })
    mainMotion.current = motion
    const settle = () => {
      if (mainMotion.current !== motion) return
      mainMotion.current = null
      if (frame) frame.style.overflowX = ''
    }
    motion.onfinish = settle
    motion.oncancel = settle
  }, [collapsed])
  const toggleLabel = c(collapsed ? 'Expand sidebar' : 'Collapse sidebar')
  return <aside ref={ref} aria-hidden={concealed} className={`profai-sidebar liquid-sidebar ${concealed ? 'liquid-sidebar-concealed' : ''} ${collapsed ? 'liquid-sidebar-collapsed' : ''}`}>
    <div className="liquid-sidebar-heading">
      <NavLink to="/dashboard" className="liquid-brand-link" aria-label="Ivygoo"><BrandLockup iconSize={44} subtitle={c('Your next chapter')} /></NavLink>
      <button type="button" className="sidebar-rail-toggle" onClick={toggle} aria-label={toggleLabel} aria-expanded={!collapsed} title={toggleLabel}>
        <span className="sidebar-rail-toggle-chip" aria-hidden="true"><ChevronLeft className="sidebar-rail-toggle-chevron" size={17} strokeWidth={2.4} /></span>
      </button>
    </div>
    <nav aria-label={c('Dashboard')} className="liquid-nav">
      {WORKSPACE_NAVIGATION.map(item => <NavLink key={item.path} to={item.path} title={collapsed ? c(item.label) : undefined} aria-label={c(item.label)} aria-current={item.matches(pathname) ? 'page' : undefined} className={`liquid-nav-item ${item.matches(pathname) ? 'is-current' : ''}`}>
        <item.icon size={20} aria-hidden="true" /><span>{c(item.label)}</span>
      </NavLink>)}
      <details className="liquid-secondary-nav">
        <summary>{c('Study tools')}<ChevronDown size={15} /></summary>
        <NavLink to="/academic-skills"><Languages size={18} />{c('Academic Skills')}</NavLink>
        <NavLink to="/ai-tutor"><Bot size={18} />{c('AI Coach')}</NavLink>
        <NavLink to="/community"><Users size={18} />{c('Community')}</NavLink>
        <NavLink to="/leaderboard"><Trophy size={18} />{c('Leaderboard')}</NavLink>
      </details>
    </nav>
    <div className="liquid-sidebar-footer">
      <button type="button" className="liquid-support-link" onClick={() => window.dispatchEvent(new Event('profai:report-issue'))} title={collapsed ? c('Report an issue') : undefined} aria-label={c('Report an issue')}><CircleHelp size={19} aria-hidden="true" /><span>{c('Report an issue')}</span></button>
      <NavLink to="/premium" className="liquid-upgrade-link" aria-label={planLabel} title={collapsed ? planLabel : undefined}>
        <Crown size={19} aria-hidden="true" /><span>{planLabel}</span>
      </NavLink>
      <LanguageSelector />
      <NavLink to="/account" className={`liquid-account ${premiumMember ? 'is-premium-member' : ''}`}>
        <ProfileAvatar src={user?.avatarUrl} name={user?.fullName} className={`liquid-avatar ${premiumMember ? 'premium-member-avatar' : ''}`} />
        <span><strong>{user?.fullName || 'Ivygoo'}</strong>{premiumMember ? <CrownBadge size="sm" /> : <small>{c('Account settings')}</small>}</span><Settings size={17} />
      </NavLink>
    </div>
  </aside>
}
