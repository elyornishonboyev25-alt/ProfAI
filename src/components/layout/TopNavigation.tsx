import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronDown, GraduationCap, Library, LogOut, Menu, UserRound, Zap } from 'lucide-react'
import Button from '../Button'
import { cn } from '../ui/utils'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { setFlashToast } from '@/utils/authFlash'
import { BrandLockup } from '@/components/brand/BrandLogo'
import { isPremiumUser } from '@/utils/premiumAccess'
import { CrownBadge } from '@/components/fx'

export function TopNavigation({ withSidebar = false }: { withSidebar?: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const { minimalMotion } = useMotionPreferences()

  const user = useAuthStore((state: AuthState) => state.user)
  const refreshToken = useAuthStore((state: AuthState) => state.refreshToken)
  const clearSession = useAuthStore((state: AuthState) => state.clearSession)

  const xpValue = useMemo(() => (user ? Math.max(0, user.xp) : 0), [user])
  const onLanding = location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/about'

  const isActive = (path: string) => {
    if (path === '/dashboard') return onLanding
    return location.pathname.startsWith(path)
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    setMobileOpen(false)
  }

  const openMockFromLanding = () => {
    navigate('/mock', { state: { from: 'home' } })
    setMobileOpen(false)
  }

  // The exam tracks live behind a "Prep" dropdown so the bar stays clean while
  // still giving one-click access to every prep path from the dashboard.
  const prepItems = [
    { label: 'IELTS Prep', path: '/ielts', icon: BookOpen },
    { label: 'SAT Prep', path: '/sat', icon: GraduationCap },
    { label: 'Test Library', path: '/tests', icon: Library },
  ] as const
  const prepActive = ['/ielts', '/sat', '/tests'].some((p) => location.pathname.startsWith(p))
  const [prepOpen, setPrepOpen] = useState(false)
  const prepRef = useRef<HTMLDivElement>(null)

  // Click-to-open dropdown: close it on an outside click or the Escape key.
  useEffect(() => {
    if (!prepOpen) return
    const onPointer = (e: PointerEvent) => {
      if (prepRef.current && !prepRef.current.contains(e.target as Node)) setPrepOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPrepOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [prepOpen])

  const requestSignOut = () => {
    setMobileOpen(false)
    setShowSignOutConfirm(true)
  }

  const confirmSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken })
      }
    } catch {
      // Ignore network errors during logout.
    } finally {
      clearSession()
      // Stash the confirmation so it survives the hard reload below.
      setFlashToast({
        type: 'success',
        title: 'Signed out successfully',
        message: 'Your session has been closed safely.',
      })
      // Hard redirect (not a soft navigate): wipes ALL in-memory state and
      // guarantees the /login route renders fresh. A soft navigation here left
      // the page blank until a manual refresh, because clearing the user mid
      // route-transition stalled AnimatePresence mode="wait" so the incoming
      // /login route never mounted.
      window.location.replace('/login')
    }
  }

  const signOutConfirmDialog =
    typeof document === 'undefined'
      ? null
      : createPortal(
          <AnimatePresence>
            {showSignOutConfirm ? (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
                  onClick={() => {
                    if (!signingOut) setShowSignOutConfirm(false)
                  }}
                />
                <motion.div
                  initial={minimalMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.94, filter: 'blur(8px)' }}
                  animate={minimalMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={minimalMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96, filter: 'blur(6px)' }}
                  transition={{ duration: minimalMotion ? 0.16 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-red-100 bg-[linear-gradient(145deg,#fff,#fff7f7_58%,#fffaf8)] p-6 text-center shadow-[0_34px_78px_rgba(127,29,29,0.3)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400" />
                  <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-red-200/45 blur-3xl" />
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-600 shadow-[0_18px_34px_rgba(220,38,38,0.18)]">
                    <LogOut className="h-8 w-8" />
                  </div>
                  <h3 className="relative mt-4 text-2xl font-black text-slate-950">Sign out of your account?</h3>
                  <p className="relative mt-2 text-sm leading-6 text-slate-600">
                    Your progress is saved to this account. You can sign back in anytime with your email and password.
                  </p>
                  <div className="relative mt-5 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={signingOut}
                      onClick={() => setShowSignOutConfirm(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Stay signed in
                    </button>
                    <button
                      type="button"
                      disabled={signingOut}
                      onClick={() => void confirmSignOut()}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_26px_rgba(220,38,38,0.28)] hover:brightness-105 disabled:cursor-wait disabled:opacity-75"
                    >
                      {signingOut ? 'Signing out...' : 'Yes, sign out'}
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )

  return (
    <motion.nav
      initial={minimalMotion ? false : { y: -36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={minimalMotion ? { opacity: 0 } : { y: -18, opacity: 0 }}
      transition={{ duration: minimalMotion ? 0.16 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ overflow: 'visible' }}
      className={`app-panel relative z-50 h-20 backdrop-blur-xl ${
        withSidebar
          ? 'sticky top-0 border-b border-red-200/90 lg:fixed lg:left-0 lg:right-0 lg:top-0 lg:border-b-0'
          : 'sticky top-0 border-b border-red-200/90'
      }`}
    >
      {withSidebar ? (
        <>
          <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(140deg,rgba(255,255,255,0.97),rgba(255,247,247,0.92))] lg:block" />
          <div className="pointer-events-none absolute left-64 top-0 hidden h-full w-px bg-gradient-to-b from-red-200/20 via-red-200/80 to-red-200/20 lg:block" />
          <div className="pointer-events-none absolute bottom-0 left-64 right-0 hidden h-px bg-gradient-to-r from-red-200/70 via-red-200/95 to-red-200/70 lg:block" />
        </>
      ) : null}

      <div
        className={`mx-auto flex h-full w-full items-center justify-between px-4 sm:px-6 ${
          withSidebar ? 'max-w-none lg:pl-[17rem] lg:pr-8' : 'max-w-7xl lg:px-8'
        }`}
      >
        <button
          onClick={() => handleNavigate('/dashboard')}
          className="interactive-lift flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-red-50/90"
        >
          <BrandLockup
            iconSize={42}
            iconClassName="glow-ring-red rounded-xl shadow-[0_10px_20px_rgba(220,38,38,0.35)]"
            titleClassName="text-sm font-black tracking-tight text-slate-900 sm:text-base"
            subtitleClassName="text-xs font-medium text-slate-700"
          />
        </button>

        <div className="hidden items-center gap-1 rounded-2xl border border-red-200/70 bg-white/95 p-1 text-sm font-semibold shadow-[0_8px_22px_rgba(15,23,42,0.07)] lg:flex">
          <TopLink label="Home" active={isActive('/dashboard')} onClick={() => handleNavigate('/dashboard')} />

          {/* Prep dropdown — groups the exam tracks */}
          <div ref={prepRef} className="relative">
            <button
              onClick={() => setPrepOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={prepOpen}
              className={cn(
                'relative flex items-center gap-1 rounded-xl px-3.5 py-2 transition-colors',
                prepActive ? 'text-red-800' : 'text-slate-600 hover:text-red-700',
              )}
            >
              {prepActive ? (
                <motion.span
                  layoutId="topnav-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-100 to-rose-100 shadow-[0_6px_14px_rgba(185,28,28,0.16)]"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : null}
              <span className="relative z-10">Prep</span>
              <ChevronDown className={cn('relative z-10 h-3.5 w-3.5 transition-transform', prepOpen && 'rotate-180')} />
            </button>

            {prepOpen ? (
                <motion.div
                  initial={minimalMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-red-100 bg-white/95 p-1.5 shadow-[0_22px_46px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                >
                  {prepItems.map((item) => {
                    const Icon = item.icon
                    const active = location.pathname.startsWith(item.path)
                    return (
                      <button
                        key={item.path}
                        role="menuitem"
                        onClick={() => {
                          handleNavigate(item.path)
                          setPrepOpen(false)
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-bold transition',
                          active ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-red-50/70 hover:text-red-700',
                        )}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500">
                          <Icon className="h-4 w-4" />
                        </span>
                        {item.label}
                      </button>
                    )
                  })}
                </motion.div>
            ) : null}
          </div>

          <TopLink label="Mock" active={isActive('/mock')} onClick={openMockFromLanding} />
          <TopLink label="Leaderboard" active={isActive('/leaderboard')} onClick={() => handleNavigate('/leaderboard')} />
          <TopLink label="Community" active={isActive('/community')} onClick={() => handleNavigate('/community')} />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {user && isPremiumUser(user) ? <CrownBadge size="sm" /> : null}
          {user ? (
            <div className="inline-flex items-center gap-1 rounded-xl border border-red-300/75 bg-gradient-to-br from-red-50 to-rose-100 px-3 py-2 text-sm font-semibold text-red-800 shadow-[0_10px_22px_rgba(185,28,28,0.18)]">
              <Zap className="h-4 w-4" />
              {xpValue} XP
            </div>
          ) : null}

          {!user ? (
            <>
              <Button
                variant="outline"
                className="interactive-lift rounded-xl border-red-300 bg-white px-4 py-2 text-red-800 hover:bg-red-50"
                onClick={() => handleNavigate('/login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                className="cta-sheen interactive-lift rounded-xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-4 py-2 text-white hover:opacity-95"
                onClick={() => handleNavigate('/register')}
              >
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="interactive-lift rounded-xl border border-red-200 bg-white/90 px-3 py-2 text-slate-800 hover:bg-red-50 hover:text-red-800"
                onClick={() => handleNavigate('/account')}
              >
                <UserRound className="mr-1 h-4 w-4" /> Profile
              </Button>
              <Button
                variant="ghost"
                className="interactive-lift rounded-xl border border-red-200 bg-white/90 px-3 py-2 text-slate-800 hover:bg-red-50 hover:text-red-800"
                onClick={requestSignOut}
              >
                <LogOut className="mr-1 h-4 w-4" /> Sign Out
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-xl border border-red-200 bg-white p-2 text-slate-800 shadow-sm transition-colors hover:bg-red-50 lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen ? (
          <motion.div
            initial={minimalMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={minimalMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={minimalMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: minimalMotion ? 0.15 : 0.24, ease: 'easeOut' }}
            className="overflow-hidden border-t border-red-100 bg-white/95 lg:hidden"
          >
            <div className="px-4 py-3">
              <div className="mb-3">
                {user ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    <Zap className="h-4 w-4" /> {xpValue} XP
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <button className="rounded-lg px-3 py-2 text-left font-semibold text-slate-800 transition-colors hover:bg-red-50 hover:text-red-800" onClick={() => handleNavigate('/dashboard')}>Home</button>

                <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-400">Prep</p>
                {prepItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.path}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-800"
                      onClick={() => handleNavigate(item.path)}
                    >
                      <Icon className="h-4 w-4 text-red-500" /> {item.label}
                    </button>
                  )
                })}

                <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-400">More</p>
                <button className="rounded-lg px-3 py-2 text-left font-semibold text-slate-800 transition-colors hover:bg-red-50 hover:text-red-800" onClick={openMockFromLanding}>Mock Arena</button>
                <button className="rounded-lg px-3 py-2 text-left font-semibold text-slate-800 transition-colors hover:bg-red-50 hover:text-red-800" onClick={() => handleNavigate('/leaderboard')}>Leaderboard</button>
                <button className="rounded-lg px-3 py-2 text-left font-semibold text-slate-800 transition-colors hover:bg-red-50 hover:text-red-800" onClick={() => handleNavigate('/community')}>Community</button>

                <div className="my-1.5 h-px bg-red-100" />
                {!user ? (
                  <>
                    <button className="rounded-lg px-3 py-2 text-left text-slate-800 transition-colors hover:bg-red-50 hover:text-red-800" onClick={() => handleNavigate('/login')}>Sign In</button>
                    <button
                      className="rounded-lg px-3 py-2 text-left text-slate-800 transition-colors hover:bg-red-50 hover:text-red-800"
                      onClick={() => handleNavigate('/register')}
                    >
                      Get Started
                    </button>
                  </>
                ) : (
                  <>
                    <button className="rounded-lg px-3 py-2 text-left text-slate-800 transition-colors hover:bg-red-50 hover:text-red-800" onClick={() => handleNavigate('/account')}>Profile</button>
                    <button className="rounded-lg px-3 py-2 text-left text-slate-800 transition-colors hover:bg-red-50 hover:text-red-800" onClick={requestSignOut}>Sign Out</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {signOutConfirmDialog}
    </motion.nav>
  )
}

/** A single top-bar link with a shared animated active indicator (layoutId). */
function TopLink({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative rounded-xl px-3.5 py-2 transition-colors',
        active ? 'text-red-800' : 'text-slate-600 hover:text-red-700',
      )}
    >
      {active ? (
        <motion.span
          layoutId="topnav-active"
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-100 to-rose-100 shadow-[0_6px_14px_rgba(185,28,28,0.16)]"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
      <span className="relative z-10">{label}</span>
    </button>
  )
}
