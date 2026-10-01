import UiText from '@/components/common/UiText'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useRegisterModalStore, type RegisterModalState } from '@/store/registerModalStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const hydrated = useAuthStore((state: AuthState) => state.hydrated)
  const openRegisterModal = useRegisterModalStore((state: RegisterModalState) => state.openRegisterModal)
  const { minimalMotion } = useMotionPreferences()

  if (!hydrated) {
    return <div className="p-8 text-sm text-slate-500"> <UiText text={"Loading session..."} /> </div>
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center bg-[radial-gradient(circle_at_center,_#ffffff_0%,_#fff7f7_58%,_#feecec_100%)] px-4 py-12">
        <motion.div
          role="region"
          aria-labelledby="registration-required-title"
          initial={minimalMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: minimalMotion ? 0.14 : 0.24, ease: 'easeOut' }}
          className="relative w-full max-w-[640px] overflow-hidden rounded-[2rem] border border-red-100 bg-white px-6 py-10 text-center shadow-[0_24px_64px_rgba(127,29,29,0.12)] sm:px-12 sm:py-12"
        >
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_16px_32px_rgba(185,28,28,0.24)]">
            <ShieldCheck aria-hidden="true" className="h-9 w-9" />
          </div>
          <h2 id="registration-required-title" className="mt-7 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
             <UiText text={"Registration Required"} /> </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
             <UiText text={"Please register or sign in first to access this page."} /> </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <motion.button
              type="button"
              whileTap={minimalMotion ? undefined : { scale: 0.985 }}
              onClick={() => openRegisterModal()}
              className="interactive-lift inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(185,28,28,0.22)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
            >
              <UserPlus aria-hidden="true" className="mr-2 h-5 w-5" />
               <UiText text={"Register"} /> </motion.button>
            <motion.button
              type="button"
              whileTap={minimalMotion ? undefined : { scale: 0.985 }}
              onClick={() => navigate('/login', { state: { from: { pathname: location.pathname } } })}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
            >
              <LogIn aria-hidden="true" className="mr-2 h-5 w-5" />
               <UiText text={"Sign In"} /> </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}

