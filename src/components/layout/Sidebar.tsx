import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Crown, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../ui/utils'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandLockup } from '@/components/brand/BrandLogo'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useNavStore } from '@/store/navStore'
import { isPremiumUser } from '@/utils/premiumAccess'
import { CrownBadge } from '@/components/fx'
import { DASHBOARD_PATHS, navGroups, type NavItem } from './navConfig'

function isItemActive(pathname: string, item: NavItem) {
  if (item.path === '/dashboard') return DASHBOARD_PATHS.includes(pathname)
  if (pathname === item.path || pathname.startsWith(`${item.path}/`)) return true
  return (item.aliases ?? []).some((alias) => pathname === alias || pathname.startsWith(`${alias}/`))
}

/** Brand + grouped nav links + Premium CTA. Shared by the desktop rail and the mobile drawer. */
function SidebarBody({ onNavigate, onClose }: { onNavigate: (path: string) => void; onClose?: () => void }) {
  const location = useLocation()
  const { allowHoverMotion } = useMotionPreferences()
  const user = useAuthStore((state: AuthState) => state.user)
  const premium = isPremiumUser(user)

  const hoverMotionProps = allowHoverMotion ? { whileHover: { x: 3 }, whileTap: { scale: 0.985 } } : {}

  return (
    <>
      <div className="sidebar-brand-card mb-5">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <BrandLockup
            className="gap-2.5"
            iconSize={38}
            iconClassName="rounded-xl shadow-[0_10px_20px_rgba(220,38,38,0.28)]"
            titleClassName="text-sm font-bold tracking-tight text-slate-900"
            subtitleClassName="text-[11px] font-medium text-slate-600"
          />
          {onClose ? (
            <button
              onClick={onClose}
              aria-label="Close navigation"
              className="rounded-lg border border-red-200 bg-white/90 p-1.5 text-slate-600 transition hover:bg-red-50 hover:text-red-700 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {premium ? (
          <div className="relative z-10 mt-2.5">
            <CrownBadge size="sm" />
          </div>
        ) : null}
      </div>

      {navGroups.map((group) => (
        <div key={group.heading} className="mb-5 last:mb-0">
          <div className="sidebar-heading-chip">{group.heading}</div>
          <nav className="space-y-1.5">
            {group.items.map((item) => {
              const active = isItemActive(location.pathname, item)
              const Icon = item.icon
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.path)}
                  className={cn(
                    'interactive-lift group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-2.5 text-sm font-semibold',
                    active
                      ? 'glow-ring-red border-red-300 bg-gradient-to-r from-red-200/80 to-rose-200/70 text-red-900'
                      : 'border-red-100/40 bg-white/80 text-slate-800 hover:border-red-200 hover:bg-red-50 hover:text-slate-900',
                  )}
                  {...hoverMotionProps}
                >
                  {active ? <span className="absolute inset-y-1 left-0.5 w-1 rounded-full bg-red-600/80" /> : null}
                  <Icon className={cn('relative z-10 h-4 w-4 shrink-0', active ? 'text-red-800' : 'text-slate-600')} />
                  <span className="relative z-10 min-w-0 flex-1 truncate pr-1">{item.label}</span>
                </motion.button>
              )
            })}
          </nav>
        </div>
      ))}

      <div className="my-6 h-px bg-gradient-to-r from-transparent via-red-300/65 to-transparent" />

      <motion.button
        onClick={() => onNavigate('/premium')}
        whileHover={allowHoverMotion ? { y: -2 } : undefined}
        whileTap={allowHoverMotion ? { scale: 0.98 } : undefined}
        className="interactive-lift cta-sheen group relative mb-2 flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-br from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-3.5 py-3 text-left shadow-[0_16px_30px_rgba(220,38,38,0.32)]"
      >
        <span className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm">
          <Crown className="h-5 w-5" />
        </span>
        <span className="relative z-10 min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-black tracking-tight text-white">
            Go Premium
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
          </span>
          <span className="block truncate text-[11px] font-medium text-red-50/90">Unlock AI &amp; all features</span>
        </span>
      </motion.button>
    </>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { minimalMotion } = useMotionPreferences()
  const mobileNavOpen = useNavStore((state) => state.mobileNavOpen)
  const closeMobileNav = useNavStore((state) => state.closeMobileNav)

  const handleNavigate = (path: string) => {
    closeMobileNav()
    if (path === '/mock') {
      navigate(path, { state: { from: location.pathname } })
      return
    }
    navigate(path)
  }

  const mobileDrawer =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <AnimatePresence>
            {mobileNavOpen ? (
              <div className="fixed inset-0 z-[120] lg:hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                  onClick={closeMobileNav}
                />
                <motion.aside
                  initial={minimalMotion ? { opacity: 0 } : { x: -320, opacity: 0 }}
                  animate={minimalMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
                  exit={minimalMotion ? { opacity: 0 } : { x: -320, opacity: 0 }}
                  transition={{ duration: minimalMotion ? 0.16 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="app-panel absolute bottom-0 left-0 top-0 w-[18rem] max-w-[85vw] overflow-y-auto border-r border-red-200/80 px-6 pb-6 pt-6"
                >
                  <SidebarBody onNavigate={handleNavigate} onClose={closeMobileNav} />
                </motion.aside>
              </div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )

  return (
    <>
      <motion.aside
        initial={minimalMotion ? false : { x: -220, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: minimalMotion ? 0.16 : 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="app-panel fixed bottom-0 left-0 top-0 z-40 hidden w-64 overflow-y-auto border-r border-red-200/80 px-6 pb-6 pt-6 lg:block"
      >
        <SidebarBody onNavigate={handleNavigate} />
      </motion.aside>
      {mobileDrawer}
    </>
  )
}
