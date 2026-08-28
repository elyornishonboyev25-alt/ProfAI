import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, KeyRound, Loader2, Lock, Mail, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { useRegisterModalStore, type RegisterModalState } from '@/store/registerModalStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandMark } from '@/components/brand/BrandLogo'
import type { AuthUser } from '@/types/platform'
import { captureAnalyticsEvent } from '@/lib/analytics'

const registerSchema = z
  .object({
    email: z
      .string()
      .email('Valid Gmail address is required')
      .refine((value) => value.toLowerCase().endsWith('@gmail.com'), 'Use your Gmail address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((values: { password: string; confirmPassword: string }) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type RegisterFormValues = z.infer<typeof registerSchema>

type AuthSessionPayload = {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

type VerificationResponse = {
  message: string
  expiresInSec: number
  developmentCode?: string
}

export default function RegisterModal() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state: AuthState) => state.setSession)
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const isOpen = useRegisterModalStore((state: RegisterModalState) => state.isOpen)
  const closeRegisterModal = useRegisterModalStore((state: RegisterModalState) => state.closeRegisterModal)
  const { minimalMotion } = useMotionPreferences()
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const requestVerificationCode = async () => {
    const valid = await trigger('email')
    if (!valid) return
    const email = getValues('email').trim().toLowerCase()
    try {
      const response = await apiClient.post<VerificationResponse>(
        '/auth/verification/request',
        { email, purpose: 'REGISTER' },
        { auth: false },
      )
      setVerificationSent(true)
      if (response.developmentCode) setVerificationCode(response.developmentCode)
      pushToast({ type: 'success', title: 'Check your Gmail', message: response.message })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ACCOUNT_EXISTS') {
        reset()
        closeRegisterModal()
        navigate('/login', { state: { email } })
        pushToast({ type: 'info', title: 'Account already exists', message: 'Sign in to continue with your existing ProfAI account.' })
        return
      }
      pushToast({ type: 'error', title: 'Code not sent', message: error instanceof Error ? error.message : 'Please try again.' })
    }
  }

  const onSubmit = async (values: RegisterFormValues) => {
    if (!verificationSent) {
      await requestVerificationCode()
      return
    }
    if (!/^\d{6}$/.test(verificationCode)) {
      pushToast({ type: 'error', title: 'Verification required', message: 'Enter the 6-digit code sent to your Gmail.' })
      return
    }

    try {
      const payload = await apiClient.post<AuthSessionPayload>(
        '/auth/register',
        {
          email: values.email.trim().toLowerCase(),
          password: values.password,
          verificationCode,
        },
        { auth: false },
      )

      setSession(payload)
      captureAnalyticsEvent('signup_completed', { method: 'password_modal' })
      pushToast({
        type: 'success',
        title: 'Account created',
        message: 'Welcome to ProfAI.',
      })
      reset()
      setVerificationCode('')
      setVerificationSent(false)
      closeRegisterModal()
      navigate('/onboarding', { replace: true })
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unable to create account',
      })
    }
  }

  const handleClose = () => {
    reset()
    setVerificationCode('')
    setVerificationSent(false)
    closeRegisterModal()
  }

  const handleLoginRedirect = () => {
    reset()
    setVerificationCode('')
    setVerificationSent(false)
    closeRegisterModal()
    navigate('/login')
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={minimalMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: minimalMotion ? 0.12 : 0.2 }}
              className="fixed inset-0 bg-[rgba(15,23,42,0.45)] backdrop-blur-[2px]"
              onClick={handleClose}
            />

            <motion.div
              initial={minimalMotion ? false : { opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: minimalMotion ? 0.14 : 0.24, ease: 'easeOut' }}
              className="panel-surface relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-blue-100/90 bg-white/95 p-6 shadow-[0_30px_85px_rgba(30,64,175,0.2)] sm:p-8"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(96,165,250,0.22),transparent_62%)]" />
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700"
                aria-label="Close registration"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative mb-7 text-center">
                <BrandMark size={56} className="mx-auto shadow-[0_14px_26px_rgba(37,99,235,0.32)]" />
                <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  ProfAI Account
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-[#1F2937]">Create your account</h1>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  No name required. Use your Gmail and password to save your plan, attempts, and streak.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-label="Registration form">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">Gmail address</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      className="input h-12 rounded-2xl border-blue-100 bg-white/90 pl-11 font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                      placeholder="name@gmail.com"
                      {...register('email', {
                        onChange: () => {
                          setVerificationSent(false)
                          setVerificationCode('')
                        },
                      })}
                    />
                  </div>
                  {errors.email ? <p className="mt-1.5 text-xs font-semibold text-error-600">{errors.email.message}</p> : null}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        className="input h-12 rounded-2xl border-blue-100 bg-white/90 pl-11 font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                        placeholder="Minimum 8 characters"
                        {...register('password')}
                      />
                    </div>
                    {errors.password ? <p className="mt-1.5 text-xs font-semibold text-error-600">{errors.password.message}</p> : null}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Confirm password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        className="input h-12 rounded-2xl border-blue-100 bg-white/90 pl-11 font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                        placeholder="Repeat password"
                        {...register('confirmPassword')}
                      />
                    </div>
                    {errors.confirmPassword ? <p className="mt-1.5 text-xs font-semibold text-error-600">{errors.confirmPassword.message}</p> : null}
                  </label>
                </div>

                {verificationSent ? (
                  <label className="block">
                    <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                      <span className="inline-flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-blue-500" />Verification code</span>
                      <button type="button" onClick={() => void requestVerificationCode()} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
                        <RefreshCw className="h-3 w-3" /> Resend
                      </button>
                    </span>
                    <input value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="input h-12 rounded-2xl border-blue-200 bg-blue-50/50 text-center text-xl font-black tracking-[0.35em]" placeholder="000000" />
                  </label>
                ) : null}

                <motion.button
                  whileTap={minimalMotion ? undefined : { scale: 0.985 }}
                  disabled={isSubmitting}
                  type="submit"
                  className="interactive-lift cta-sheen flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-4 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.34)] transition hover:shadow-[0_22px_44px_rgba(37,99,235,0.44)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {verificationSent ? 'Verifying...' : 'Sending code...'}
                    </>
                  ) : (
                    verificationSent ? 'Verify & create account' : 'Send Gmail verification code'
                  )}
                </motion.button>
              </form>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-slate-700">
                  <p className="inline-flex items-center gap-1 font-black text-blue-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secure sign-up
                  </p>
                  <p className="mt-1 leading-5">Password authentication keeps the account reusable.</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white/80 px-3 py-2 text-xs text-slate-700">
                  <p className="inline-flex items-center gap-1 font-black text-blue-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Plan ready
                  </p>
                  <p className="mt-1 leading-5">Setup questions appear only after sign-in.</p>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-[#6B7280]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleLoginRedirect}
                  className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
                >
                  Sign in
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
