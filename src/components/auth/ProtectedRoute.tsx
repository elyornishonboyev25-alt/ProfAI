import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useRegisterModalStore, type RegisterModalState } from '@/store/registerModalStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const hydrated = useAuthStore((state: AuthState) => state.hydrated)
  const openRegisterModal = useRegisterModalStore((state: RegisterModalState) => state.openRegisterModal)
  const { minimalMotion } = useMotionPreferences()

  if (!hydrated) {
    return <div className="p-8 text-sm text-slate-500">Loading session...</div>
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4">
        <motion.div
          initial={minimalMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: minimalMotion ? 0.14 : 0.24, ease: 'easeOut' }}
          className="panel-surface w-full max-w-md rounded-[2rem] border border-blue-100/90 bg-white/95 p-8 text-center shadow-[0_24px_64px_rgba(30,64,175,0.16)]"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] text-white shadow-[0_14px_26px_rgba(37,99,235,0.32)]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-[#1F2937]">
            Registration Required
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Please register or sign in first to access this page.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <motion.button
              whileTap={minimalMotion ? undefined : { scale: 0.985 }}
              onClick={() => openRegisterModal()}
              className="interactive-lift inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.3)] transition hover:opacity-95"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Register
            </motion.button>
            <motion.button
              whileTap={minimalMotion ? undefined : { scale: 0.985 }}
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

