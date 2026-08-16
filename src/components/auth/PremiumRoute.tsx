import { LogIn, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useRegisterModalStore, type RegisterModalState } from '@/store/registerModalStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useTestAttempts } from '@/hooks/useTestAttempts'
import { ENFORCE_PREMIUM, hasPremiumAccess } from '@/utils/premiumAccess'
import UpgradeOverlay from '@/components/premium/UpgradeOverlay'

type PremiumRouteProps = {
  children: React.ReactNode
  showGuestBanner?: boolean
}

export default function PremiumRoute({ children, showGuestBanner = false }: PremiumRouteProps) {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()
  const user = useAuthStore((state: AuthState) => state.user)
  const openRegisterModal = useRegisterModalStore((state: RegisterModalState) => state.openRegisterModal)
  const { info } = useTestAttempts()

  // Dormant while ENFORCE_PREMIUM is false — always evaluates to `false`, so
  // nothing is ever gated in the current open product state.
  const showUpgrade = ENFORCE_PREMIUM && !!user && !hasPremiumAccess(user) && info.reached

  if (showUpgrade) {
    return (
      <div className="relative">
        {children}
        <UpgradeOverlay used={info.used} />
      </div>
    )
  }

  if (!user && showGuestBanner) {
    return (
      <>
        <motion.section
          initial={minimalMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={minimalMotion ? { duration: 0.12 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 z-[45] border-b border-blue-200/70 bg-[linear-gradient(92deg,rgba(254,226,226,0.9),rgba(255,244,245,0.92),rgba(254,226,226,0.9))] shadow-[0_8px_20px_rgba(37,99,235,0.12)]"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Guest Preview</p>
              <p className="text-sm font-medium text-slate-700">
                Explore all sections freely. Create an account to save progress across devices.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openRegisterModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition hover:opacity-95"
              >
                <UserPlus className="h-4 w-4" />
                Register
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-300 bg-white/95 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            </div>
          </div>
        </motion.section>
        {children}
      </>
    )
  }

  return <>{children}</>
}


