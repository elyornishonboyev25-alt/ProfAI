import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, UserPlus } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { useCopy } from '@/i18n/interface'
import { apiClient, ApiError } from '@/lib/apiClient'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandMark } from '@/components/brand/BrandLogo'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import AuthShowcasePanel from '@/components/auth/AuthShowcasePanel'
import PasswordRecoveryDialog from '@/components/auth/PasswordRecoveryDialog'
import EmailCodeForm, { type EmailAuthSession } from '@/components/auth/EmailCodeForm'
import { takeFlashToast } from '@/utils/authFlash'
import { captureAnalyticsEvent } from '@/lib/analytics'
import { claimStoredGuestDiagnostic, peekGuestDiagnosticDestination, takeGuestDiagnosticDestination } from '@/lib/guestDiagnostic'
import type { AuthUser } from '@/types/platform'
import '@/styles/auth-cinema.css'

const loginSchema = z.object({
  email: z.string().email('Valid Gmail address is required').refine((value) => value.toLowerCase().endsWith('@gmail.com'), 'Use your Gmail address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type AuthSessionPayload = { user: AuthUser; accessToken: string; refreshToken: string }

export default function Login() {
  const { c } = useCopy()
  const navigate = useNavigate()
  const location = useLocation()
  const createMode = location.pathname === '/register'
  const setSession = useAuthStore((state: AuthState) => state.setSession)
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const { minimalMotion } = useMotionPreferences()
  const [showPassword, setShowPassword] = useState(false)
  const [codeMode, setCodeMode] = useState(false)
  const [notFound, setNotFound] = useState<{ email?: string } | null>(null)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')

  useEffect(() => {
    const flash = takeFlashToast()
    if (flash) pushToast(flash)
  }, [pushToast])

  const redirectPath = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null
    return state?.from?.pathname ?? '/dashboard'
  }, [location.state])
  const initialEmail = (location.state as { email?: string } | null)?.email ?? ''

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: '' },
  })

  const finishEmailAuth = async (payload: EmailAuthSession) => {
    setSession(payload)
    const diagnosticClaimed = await claimStoredGuestDiagnostic()
    captureAnalyticsEvent(createMode ? 'signup_completed' : 'login_completed', { method: 'email_code' })
    if (diagnosticClaimed) captureAnalyticsEvent('diagnostic_claimed', { method: 'email_code' })
    const destination = peekGuestDiagnosticDestination() ? takeGuestDiagnosticDestination(redirectPath) : redirectPath
    navigate(payload.user.onboardingCompleted ? destination : '/onboarding', { replace: true })
  }

  const signInWithPassword = async (values: LoginFormValues) => {
    const email = values.email.trim().toLowerCase()
    try {
      const payload = await apiClient.post<AuthSessionPayload>('/auth/login', { email, password: values.password }, { auth: false })
      setNotFound(null)
      setSession(payload)
      const diagnosticClaimed = await claimStoredGuestDiagnostic()
      captureAnalyticsEvent('login_completed', { method: 'password' })
      if (diagnosticClaimed) captureAnalyticsEvent('diagnostic_claimed', { method: 'password_login' })
      pushToast({ type: 'success', title: 'Signed in successfully', message: 'Welcome back to ProfAI.' })
      const destination = peekGuestDiagnosticDestination() ? takeGuestDiagnosticDestination(redirectPath) : redirectPath
      navigate(payload.user.onboardingCompleted ? destination : '/onboarding', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ACCOUNT_NOT_FOUND') {
        setNotFound({ email })
        return
      }
      pushToast({ type: 'error', title: 'Sign in failed', message: error instanceof Error ? error.message : 'Unable to sign in' })
    }
  }

  const handleGoogleCredential = async (idToken: string) => {
    try {
      const payload = await apiClient.post<AuthSessionPayload>('/auth/google', { idToken, allowCreate: createMode }, { auth: false })
      setNotFound(null)
      setSession(payload)
      const diagnosticClaimed = await claimStoredGuestDiagnostic()
      captureAnalyticsEvent(createMode ? 'signup_completed' : 'login_completed', { method: 'google' })
      if (diagnosticClaimed) captureAnalyticsEvent('diagnostic_claimed', { method: createMode ? 'google' : 'google_login' })
      pushToast({ type: 'success', title: createMode ? 'Account ready' : 'Signed in with Google', message: 'Welcome to ProfAI.' })
      const destination = peekGuestDiagnosticDestination() ? takeGuestDiagnosticDestination(redirectPath) : redirectPath
      window.location.assign(payload.user.onboardingCompleted ? destination : '/onboarding')
    } catch (error) {
      if (!createMode && error instanceof ApiError && error.code === 'ACCOUNT_NOT_FOUND') {
        setNotFound({})
        return
      }
      const message = error instanceof Error ? error.message : 'Google sign-in failed'
      pushToast({ type: 'error', title: 'Google sign-in failed', message })
      throw new Error(message)
    }
  }

  return (
    <div className="auth-cinema-page workspace-page">
      <motion.main
        initial={minimalMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: minimalMotion ? 0.14 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="auth-cinema-shell"
      >
        <AuthShowcasePanel />

        <section className="auth-cinema-form-side" aria-label={createMode ? 'Create account' : 'Sign in'}>
          <div className="auth-cinema-form-inner">
            <div className="auth-cinema-lockup">
              <span className="auth-cinema-lockup-icon"><BrandMark size={43} /></span>
              <div><strong>Prof<span>AI</span></strong><small>{c('Your next chapter')}</small></div>
            </div>

            <nav className="auth-cinema-tabs" aria-label="Account access">
              <Link to="/login" aria-current={!createMode ? 'page' : undefined} className={!createMode ? 'is-active' : ''}><UiText text="Sign in" /></Link>
              <Link to="/register" aria-current={createMode ? 'page' : undefined} className={createMode ? 'is-active' : ''}><UiText text="Create account" /></Link>
            </nav>

            <div className="auth-cinema-intro">
              <span><Sparkles size={14} /> {c(createMode ? 'Your journey begins here' : 'Pick up where you left off')}</span>
              <h1>{c(createMode ? 'Make your next move.' : 'Welcome back.')}</h1>
              <p>{c(createMode ? 'Create an account with your Gmail to keep every step of your journey together.' : 'Sign in to continue your IELTS, SAT, and university journey.')}</p>
            </div>

            {!createMode && notFound && (
              <div className="auth-cinema-notice" role="status">
                <UserPlus size={19} />
                <div>
                  <strong>{c('Account not found')}</strong>
                  <p>{notFound.email ? `${notFound.email} — ${c('Create one to get started.')}` : c('We could not find an account for that Google email.')}</p>
                  <Link to="/register" state={notFound.email ? { email: notFound.email } : undefined}>{c('Create an account')} <ArrowRight size={15} /></Link>
                </div>
              </div>
            )}

            {createMode ? (
              <EmailCodeForm key="create" intent="create-account" initialEmail={initialEmail} onAuthenticated={finishEmailAuth} />
            ) : codeMode ? (
              <>
                <EmailCodeForm key="signin-code" initialEmail={getValues('email')} onAuthenticated={finishEmailAuth} onRecover={(email) => { setRecoveryEmail(email); setRecoveryOpen(true) }} />
                <button type="button" className="auth-cinema-switch-method" onClick={() => setCodeMode(false)}>{c('Use your password instead')}</button>
              </>
            ) : (
              <form onSubmit={handleSubmit(signInWithPassword)} className="auth-cinema-password-form" aria-label="Sign in with password">
                <label htmlFor="auth-email">{c('Gmail address')}</label>
                <div className="auth-cinema-input-wrap">
                  <Mail size={19} />
                  <input id="auth-email" type="email" autoComplete="email" placeholder="name@gmail.com" {...register('email')} />
                </div>
                {errors.email && <p className="auth-cinema-error">{c(errors.email.message || '')}</p>}

                <div className="auth-cinema-label-row">
                  <label htmlFor="auth-password">{c('Password')}</label>
                  <button type="button" onClick={() => { setRecoveryEmail(getValues('email')); setRecoveryOpen(true) }}>{c('Forgot password?')}</button>
                </div>
                <div className="auth-cinema-input-wrap">
                  <Lock size={19} />
                  <input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder={c('Enter your password')} {...register('password')} />
                  <button type="button" className="auth-cinema-eye" aria-label={c(showPassword ? 'Hide password' : 'Show password')} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
                </div>
                {errors.password && <p className="auth-cinema-error">{c(errors.password.message || '')}</p>}

                <button className="auth-cinema-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                  {c(isSubmitting ? 'Signing in...' : 'Continue')}
                </button>
                <button type="button" className="auth-cinema-switch-method" onClick={() => setCodeMode(true)}>{c('Sign in with a Gmail code instead')}</button>
              </form>
            )}

            <div className="auth-cinema-divider"><span />{c('or continue with')}<span /></div>
            <div className="auth-cinema-google"><GoogleAuthButton mode={createMode ? 'signup' : 'signin'} onCredential={handleGoogleCredential} /></div>
            <p className="auth-cinema-privacy"><ShieldCheck size={16} /> {c(createMode ? 'Your Gmail is verified before your account is created.' : 'Your progress stays securely saved to your account.')}</p>
          </div>
        </section>
      </motion.main>
      <PasswordRecoveryDialog open={recoveryOpen} initialEmail={recoveryEmail} onClose={() => setRecoveryOpen(false)} />
    </div>
  )
}
