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
  Landmark,
  Library,
  Sparkles,
  Target,
  TriangleAlert,
  Trophy,
  UserRound,
  Users,
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
      { id: 'analyze-mistakes', label: 'Analyze Mistakes', icon: TriangleAlert, path: '/analyze-mistakes' },
      { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    ],
  },
  {
    heading: 'Prep & Skills',
    items: [
      { id: 'ielts', label: 'IELTS Prep', icon: BookOpen, path: '/ielts' },
      { id: 'sat', label: 'SAT Prep', icon: GraduationCap, path: '/sat' },
      { id: 'vocabulary', label: 'Vocabulary', icon: BookMarked, path: '/vocabulary' },
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
      { id: 'admission', label: 'Admission', icon: Landmark, path: '/admission' },
      { id: 'account', label: 'My Profile', icon: UserRound, path: '/account' },
    ],
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { minimalMotion, allowHoverMotion } = useMotionPreferences()
  const user = useAuthStore((state: AuthState) => state.user)
  const premium = isPremiumUser(user)

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

        {/* Premium CTA / status (pinned to the bottom) */}
        {premium ? (
          <div className="mt-3 flex shrink-0 items-center gap-2.5 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <Crown className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-amber-800">Premium active</p>
              <p className="truncate text-[10px] font-medium text-amber-600/90">All features unlocked</p>
            </div>
          </div>
        ) : (
          <motion.button
            onClick={() => navigate('/premium')}
            whileHover={allowHoverMotion ? { y: -2 } : undefined}
            whileTap={allowHoverMotion ? { scale: 0.98 } : undefined}
            className="cta-sheen interactive-lift mt-3 flex shrink-0 items-center gap-2.5 overflow-hidden rounded-xl border border-amber-300/60 bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-3 py-2.5 text-left shadow-[0_12px_24px_rgba(220,38,38,0.3)]"
          >
            <span className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white shadow-inner backdrop-blur-sm">
              <Crown className="h-4 w-4" />
            </span>
            <span className="relative z-10 min-w-0 flex-1">
              <span className="flex items-center gap-1 text-[13px] font-black tracking-tight text-white">
                Go Premium
                <Sparkles className="h-3 w-3 text-amber-200" />
              </span>
              <span className="block truncate text-[10px] font-medium text-red-50/90">Unlock AI &amp; all features</span>
            </span>
          </motion.button>
        )}
      </div>
    </motion.aside>
  )
}
