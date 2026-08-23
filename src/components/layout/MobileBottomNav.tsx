import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Building2, GraduationCap, Home, type LucideIcon } from 'lucide-react'

const TABS: Array<{ key: string; label: string; icon: LucideIcon; path: string; match: (path: string) => boolean }> = [
  { key: 'home', label: 'Dashboard', icon: Home, path: '/dashboard', match: (p) => p === '/' || p === '/dashboard' },
  { key: 'ielts', label: 'IELTS', icon: BookOpen, path: '/mock/ielts', match: (p) => p.startsWith('/ielts') || p.startsWith('/mock/ielts') },
  { key: 'sat', label: 'SAT', icon: GraduationCap, path: '/sat', match: (p) => p.startsWith('/sat') || p.startsWith('/mock/sat') },
  { key: 'admission', label: 'Admission', icon: Building2, path: '/admission/universities', match: (p) => p.startsWith('/admission') },
]

/**
 * Thumb-friendly bottom navigation for phones (concept: 42-Mobile-Dashboard).
 * Mobile/tablet navigation for the four core destinations requested for the
 * workspace. Mounted by App only outside exam/auth flows.
 */
export default function MobileBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/98 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-1.5 shadow-[0_-10px_30px_rgba(30,64,175,0.09)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-w-[3.6rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition active:scale-95"
            >
              {active ? (
                <span className="absolute inset-0 rounded-xl bg-blue-50" />
              ) : null}
              <Icon className={`relative h-5 w-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`relative text-[10px] font-bold ${active ? 'text-blue-700' : 'text-slate-400'}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
