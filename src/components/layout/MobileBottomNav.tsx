import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Bot, GraduationCap, Home, UserRound, type LucideIcon } from 'lucide-react'

const TABS: Array<{ key: string; label: string; icon: LucideIcon; path: string; match: (path: string) => boolean }> = [
  { key: 'home', label: 'Home', icon: Home, path: '/dashboard', match: (p) => p === '/' || p === '/dashboard' },
  { key: 'ielts', label: 'IELTS', icon: BookOpen, path: '/ielts', match: (p) => p.startsWith('/ielts') },
  { key: 'ai', label: 'AI', icon: Bot, path: '/ai-tutor', match: (p) => p.startsWith('/ai-tutor') },
  { key: 'admission', label: 'Abroad', icon: GraduationCap, path: '/admission', match: (p) => p.startsWith('/admission') },
  { key: 'profile', label: 'Profile', icon: UserRound, path: '/account', match: (p) => p.startsWith('/account') || p === '/profile' },
]

/**
 * Thumb-friendly bottom navigation for phones (concept: 42-Mobile-Dashboard).
 * Mobile-only (md:hidden); the elevated centre AI button opens the tutor.
 * Mounted by App only outside exam/auth flows so it never covers a test.
 */
export default function MobileBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/98 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-1.5 shadow-[0_-10px_30px_rgba(30,64,175,0.08)] md:hidden"
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          const Icon = tab.icon
          if (tab.key === 'ai') {
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                aria-label="AI Tutor"
                className="relative -mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_14px_28px_rgba(37,99,235,0.3)] active:opacity-90"
              >
                <Icon className="h-6 w-6" />
              </button>
            )
          }
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
