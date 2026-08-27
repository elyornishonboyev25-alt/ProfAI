import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Building2, GraduationCap, Home, type LucideIcon } from 'lucide-react'
import { PRODUCT_NAVIGATION } from '@/config/productNavigation'
import { isPublicFeatureEnabled } from '@/config/featureFlags'

const LEGACY_TABS: Array<{ id: string; label: string; mobileLabel: string; icon: LucideIcon; path: string; matches: (path: string) => boolean }> = [
  { id: 'home', label: 'Dashboard', mobileLabel: 'Dashboard', icon: Home, path: '/dashboard', matches: (p) => p === '/' || p === '/dashboard' },
  { id: 'ielts', label: 'IELTS', mobileLabel: 'IELTS', icon: BookOpen, path: '/mock/ielts', matches: (p) => p.startsWith('/ielts') || p.startsWith('/mock/ielts') },
  { id: 'sat', label: 'SAT', mobileLabel: 'SAT', icon: GraduationCap, path: '/sat', matches: (p) => p.startsWith('/sat') || p.startsWith('/mock/sat') },
  { id: 'admission', label: 'Admission', mobileLabel: 'Admission', icon: Building2, path: '/admission/universities', matches: (p) => p.startsWith('/admission') },
]

/**
 * Thumb-friendly bottom navigation for phones (concept: 42-Mobile-Dashboard).
 * Mobile/tablet navigation for the five product pillars. Mounted by App only
 * outside focused exam, reading and auth flows.
 */
export default function MobileBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const tabs = isPublicFeatureEnabled('globalJourney') ? PRODUCT_NAVIGATION : LEGACY_TABS

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/98 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-1.5 shadow-[0_-10px_30px_rgba(30,64,175,0.09)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2">
        {tabs.map((tab) => {
          const active = tab.matches(pathname)
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 transition active:scale-95"
            >
              {active ? (
                <span className="absolute inset-0 rounded-xl bg-blue-50" />
              ) : null}
              <Icon className={`relative h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`relative whitespace-nowrap text-[9px] font-bold leading-3 sm:text-[10px] ${active ? 'text-blue-700' : 'text-slate-400'}`}>
                {tab.mobileLabel}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
