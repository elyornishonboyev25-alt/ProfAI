import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Home, Target, UserRound, Users, type LucideIcon } from 'lucide-react'

const TABS: Array<{ key: string; label: string; icon: LucideIcon; path: string; match: (path: string) => boolean }> = [
  { key: 'home', label: 'Home', icon: Home, path: '/dashboard', match: (p) => p === '/' || p === '/dashboard' },
  { key: 'mock', label: 'Mock', icon: Target, path: '/mock', match: (p) => p.startsWith('/mock') },
  { key: 'ai', label: 'AI', icon: Bot, path: '/ai-tutor', match: (p) => p.startsWith('/ai-tutor') },
  { key: 'community', label: 'Community', icon: Users, path: '/community', match: (p) => p.startsWith('/community') || p.startsWith('/u/') },
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-red-100 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-1.5 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
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
                className="relative -mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#DC2626] via-[#E11D48] to-[#B91C1C] text-white shadow-[0_14px_28px_rgba(220,38,38,0.4)] transition active:scale-95"
              >
                <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-red-400/30 [animation-duration:2.6s]" />
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
                <motion.span
                  layoutId="mobile-nav-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-red-50"
                />
              ) : null}
              <Icon className={`relative h-5 w-5 ${active ? 'text-red-600' : 'text-slate-400'}`} />
              <span className={`relative text-[10px] font-bold ${active ? 'text-red-700' : 'text-slate-400'}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
