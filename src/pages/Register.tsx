import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandMark } from '@/components/brand/BrandLogo'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'

const registerSchema = z
  .object({
    email: z
      .string()
      .email('Valid Gmail address is required')
      .refine((value) => value.toLowerCase().endsWith('@gmail.com'), 'Use your Gmail address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type RegisterFormValues = z.infer<typeof registerSchema>

type AuthSessionPayload = {
  user: {
    id: string
    fullName: string
    email: string
    role: 'USER' | 'ADMIN'
    premium: boolean
    xp: number
    level: number
    currentStreak: number
  }
  accessToken: string
  refreshToken: string
}

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state: AuthState) => state.setSession)
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const { minimalMotion } = useMotionPreferences()

  // Pre-fill the email when arriving from the "Account not found" CTA on /login.
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: prefillEmail,
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const payload = await apiClient.post<AuthSessionPayload>(
        '/auth/register',
        {
          email: values.email.trim().toLowerCase(),
          password: values.password,
        },
        { auth: false },
      )

      setSession(payload)
      pushToast({
        type: 'success',
        title: 'Account created',
        message: 'Your ProfAI account is ready.',
      })
      // Brand-new accounts go straight to the guided study-plan setup.
      navigate('/onboarding', { replace: true })
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unable to create account',
      })
    }
  }

  const handleGoogleCredential = async (idToken: string) => {
    try {
      const payload = await apiClient.post<AuthSessionPayload>(
        '/auth/google',
        { idToken },
        { auth: false },
      )

      setSession(payload)
      pushToast({
        type: 'success',
        title: 'Account ready',
        message: 'Signed up with Google successfully.',
      })
      // Full reload guarantees the persisted session is hydrated before the
      // dashboard renders (fixes the blank-until-refresh behaviour).
      window.location.assign('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-up failed'
      pushToast({
        type: 'error',
        title: 'Google sign up failed',
        message,
      })
      throw new Error(message)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={minimalMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-[8%] top-[12%] h-56 w-56 rounded-full bg-red-300/25 blur-3xl"
        />
        <motion.div
          initial={minimalMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-[8%] right-[10%] h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,113,113,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(248,113,113,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <motion.div
        initial={minimalMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: minimalMotion ? 0.14 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="panel-surface relative grid w-full max-w-5xl overflow-hidden rounded-[2.2rem] border border-red-100/90 bg-white/95 shadow-[0_30px_90px_rgba(127,29,29,0.18)] lg:grid-cols-[0.92fr_1.08fr]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
        <div className="relative hidden min-h-[520px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-[#3f0d12] p-8 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(220,38,38,0.28),transparent_36%),radial-gradient(circle_at_82%_76%,rgba(225,29,72,0.2),transparent_40%)]" />
          <motion.div
            initial={minimalMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full flex-col justify-between"
          >
            <div>
              <BrandMark size={58} className="shadow-[0_18px_34px_rgba(127,29,29,0.35)]" />
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Study abroad with AI
              </p>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight">
                Your journey to a university abroad starts here.
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Join ProfAI and turn your study-abroad prep into a daily streak. Earn XP, unlock
                achievements, and let your AI coach build the roadmap from SAT &amp; IELTS to your dream university.
              </p>
            </div>

            <div className="space-y-3">
              {['AI study coach & instant feedback', 'Daily challenges, streaks & XP', 'Day-by-day roadmap to your dream university'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                  <span className="text-sm font-semibold text-white/90">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="mb-7 text-center lg:text-left">
            <BrandMark size={54} className="mx-auto shadow-[0_14px_26px_rgba(220,38,38,0.32)] lg:hidden" />
            <p className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-red-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Password sign-up
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[#1F2937]">Create your account</h1>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              No name required. Use your Gmail address and set a secure password.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Registration form">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Gmail address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                <input
                  type="email"
                  autoComplete="email"
                  className="input h-12 rounded-2xl border-red-100 bg-white/90 pl-11 font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                  placeholder="name@gmail.com"
                  {...register('email')}
                />
              </div>
              {errors.email ? <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.email.message}</p> : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="input h-12 rounded-2xl border-red-100 bg-white/90 pl-11 font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                    placeholder="Minimum 8 characters"
                    {...register('password')}
                  />
                </div>
                {errors.password ? <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.password.message}</p> : null}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-700">Confirm password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="input h-12 rounded-2xl border-red-100 bg-white/90 pl-11 font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                    placeholder="Repeat password"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword ? <p className="mt-1.5 text-xs font-semibold text-red-600">{errors.confirmPassword.message}</p> : null}
              </label>
            </div>

            <motion.button
              whileHover={minimalMotion ? undefined : { y: -2 }}
              whileTap={minimalMotion ? undefined : { scale: 0.985 }}
              disabled={isSubmitting}
              type="submit"
              className="interactive-lift cta-sheen flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#DC2626] via-[#EF4444] to-[#B91C1C] px-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(220,38,38,0.34)] transition hover:shadow-[0_22px_44px_rgba(220,38,38,0.44)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-red-100 to-red-200/70" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              or sign up with
            </span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent via-red-100 to-red-200/70" />
          </div>

          <GoogleAuthButton mode="signup" onCredential={handleGoogleCredential} />

          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3 text-xs text-slate-700">
            <p className="inline-flex items-center gap-1.5 font-black text-red-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure sign-up
            </p>
            <p className="mt-1 leading-5">
              Your session is saved on this device after account creation.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Already have an account?{' '}
            <Link to="/login" className="font-black text-red-600 transition-colors hover:text-red-700">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
