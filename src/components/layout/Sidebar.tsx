import { type ComponentType } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AudioLines,
  BarChart3,
  BookMarked,
  BookOpen,
  Crown,
  FileText,
  GraduationCap,
  Headphones,
  Headset,
  Home,
  Library,
  Sparkles,
  Target,
  Trophy,
  Users,
  UserRound,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../ui/utils'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandMark } from '@/components/brand/BrandLogo'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { isPremiumUser } from '@/utils/premiumAccess'

type NavItem = {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  path: string
  aliases?: string[]
}

type NavGroup = { heading: string; items: NavItem[] }

// Grouped so the most-used destinations sit up top, exam + skill practice in
// the middle, and account/secondary links last. Keeps every destination one
// click away while staying compact enough to fit a single screen.
const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
      { id: 'ai-tutor', label: 'AI Tutor', icon: Sparkles, path: '/ai-tutor' },
      { id: 'tests', label: 'Test Library', icon: Library, path: '/tests' },
      { id: 'mock', label: 'Mock Arena', icon: Target, path: '/mock' },
      { id: 'profile', label: 'Performance', icon: BarChart3, path: '/profile' },
      { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    ],
  },
  {
    heading: 'Prep & Skills',
    items: [
      { id: 'ielts', label: 'IELTS Prep', icon: BookOpen, path: '/ielts' },
      { id: 'sat', label: 'SAT Prep', icon: GraduationCap, path: '/sat' },
      { id: 'vocabulary', label: 'IELTS Vocabulary', icon: BookMarked, path: '/vocabulary/ielts' },
      { id: 'articles', label: 'Articles', icon: FileText, path: '/articles' },
      { id: 'podcast', label: 'Podcast', icon: Headphones, path: '/podcast' },
      { id: 'shadowing', label: 'Shadowing', icon: AudioLines, path: '/shadowing-lab' },
      { id: 'speaking-community', label: 'Speaking', icon: Headset, path: '/speaking-community' },
    ],
  },
  {
    heading: 'More',
    items: [
      { id: 'community', label: 'Community', icon: Users, path: '/community' },
      { id: 'top-universities', label: 'Top Universities', icon: GraduationCap, path: '/admission/universities' },
      { id: 'application', label: 'Application', icon: FileText, path: '/admission' },
    ],
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { minimalMotion, allowHoverMotion } = useMotionPreferences()
  const user = useAuthStore((state: AuthState) => state.user)
  const premium = isPremiumUser(user)
  const initials = (user?.fullName || 'Learner')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const handleNavigate = (path: string) => {
    if (path === '/mock') {
      navigate(path, { state: { from: location.pathname } })
      return
    }
    navigate(path)
  }

  const isActive = (path: string, aliases: string[] = []) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    if (location.pathname.startsWith(path)) return true
    return aliases.some((alias) => location.pathname.startsWith(alias))
  }

  return (
    <motion.aside
      initial={minimalMotion ? false : { x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={minimalMotion ? { opacity: 0 } : { x: -140, opacity: 0 }}
      transition={{ duration: minimalMotion ? 0.16 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="app-panel fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-red-200/80 lg:flex"
    >
      <div className="flex h-full flex-col px-3 py-4">
        {/* Brand */}
        <button
          onClick={() => navigate('/dashboard')}
          className="interactive-lift flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-red-50/70"
        >
          <BrandMark size={36} className="rounded-lg shadow-[0_8px_18px_rgba(220,38,38,0.28)]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black tracking-tight text-slate-900">
              Prof<span className="text-red-600">AI</span>
            </p>
            <p className="truncate text-[10px] font-medium text-slate-500">Universities Abroad</p>
          </div>
          {premium ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/70 bg-gradient-to-r from-amber-50 to-orange-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700">
              <Crown className="h-3 w-3" />
            </span>
          ) : null}
        </button>

        {/* Navigation */}
        <nav className="no-scrollbar mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <p className="mb-1 px-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-400/90">
                {group.heading}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path, item.aliases)
                  const Icon = item.icon
                  const hoverMotionProps = allowHoverMotion ? { whileHover: { x: 2 }, whileTap: { scale: 0.985 } } : {}

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors',
                        active
                          ? 'bg-gradient-to-r from-red-100 to-rose-100/70 text-red-800'
                          : 'text-slate-600 hover:bg-red-50/70 hover:text-slate-900',
                      )}
                      {...hoverMotionProps}
                    >
                      {active ? (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-y-[5px] left-0 w-[3px] rounded-full bg-red-600"
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          active ? 'text-red-600' : 'text-slate-400 group-hover:text-red-500',
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Account is a stable bottom anchor instead of another scrolling item. */}
        <div className="mt-3 shrink-0 border-t border-red-100 pt-3">
          {!premium ? (
            <button
              type="button"
              onClick={() => navigate('/premium')}
              className="mb-2 flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-left text-[11px] font-bold text-amber-800 transition hover:bg-amber-100"
            >
              <span className="inline-flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" />
                Upgrade to Premium
              </span>
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          ) : null}

          <motion.button
            type="button"
            onClick={() => navigate('/account')}
            whileHover={allowHoverMotion ? { y: -1 } : undefined}
            whileTap={allowHoverMotion ? { scale: 0.99 } : undefined}
            aria-current={location.pathname.startsWith('/account') ? 'page' : undefined}
            className={cn(
              'group flex w-full items-center gap-2.5 rounded-2xl border p-2.5 text-left transition',
              location.pathname.startsWith('/account')
                ? 'border-red-200 bg-gradient-to-r from-red-100 to-rose-50 shadow-[0_10px_24px_rgba(220,38,38,0.12)]'
                : 'border-slate-100 bg-white/80 hover:border-red-200 hover:bg-red-50/70',
            )}
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-xs font-black text-white shadow-[0_8px_18px_rgba(220,38,38,0.25)]">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="profile-avatar-media" /> : initials}
              {premium ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-white ring-2 ring-white">
                  <Crown className="h-2.5 w-2.5" />
                </span>
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-black text-slate-900">{user?.fullName || 'My Profile'}</span>
              <span className="block truncate text-[10px] font-semibold text-slate-500">
                Level {user?.level ?? 1} · {(user?.xp ?? 0).toLocaleString('en-US')} XP
              </span>
            </span>
            <UserRound className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-red-600" />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  )
}
