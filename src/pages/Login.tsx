import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { apiClient } from '@/lib/apiClient'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandLogo } from '@/components/brand/BrandLogo'
import AuthShowcasePanel from '@/components/auth/AuthShowcasePanelV2'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import EmailCodeForm, { type EmailAuthSession } from '@/components/auth/EmailCodeForm'
import { takeFlashToast } from '@/utils/authFlash'
import { accountReturnPath } from '@/utils/accountAccess'
import { finishAccountAccess } from '@/lib/finishAccountAccess'
import '@/styles/auth-cinema.css'
import '@/styles/gmail-access.css'
import '@/styles/auth-access.css'
import '@/styles/auth-viewport.css'

export default function Login() {
  const { c } = useCopy()
  const location = useLocation()
  const createMode = location.pathname === '/register'
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const { minimalMotion } = useMotionPreferences()
  useEffect(() => { const flash = takeFlashToast(); if (flash) pushToast(flash) }, [pushToast])
  const redirectPath = useMemo(() => {
    const state = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null
    return accountReturnPath(state?.from)
  }, [location.state])
  const initialEmail = (location.state as { email?: string } | null)?.email ?? ''
  const finishEmail = (payload: EmailAuthSession) => finishAccountAccess(payload, redirectPath)
  const googleSignIn = async (idToken: string) => {
    const payload = await apiClient.post<EmailAuthSession>('/auth/google', { idToken, allowCreate: true }, { auth: false })
    await finishAccountAccess(payload, redirectPath, 'google')
  }
  return <div className="auth-cinema-page auth-access-page workspace-page">
    <motion.div id="sign-in" className="auth-cinema-shell" initial={minimalMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
      <AuthShowcasePanel mode={createMode ? 'register' : 'login'} />
      <section className="auth-cinema-form-side" aria-label={c('Gmail account access')}>
        <div className="auth-cinema-form-inner">
          <Link to="/" className="auth-cinema-lockup" aria-label="Ivygoo"><div className="brand-lockup"><BrandLogo height={54} /><small>{c('Your next chapter')}</small></div></Link>
          <nav className="auth-cinema-tabs" aria-label={c('Account access')}>
            <Link to="/login" state={location.state} aria-current={!createMode ? 'page' : undefined} className={!createMode ? 'is-active' : ''}>{c('Sign in')}</Link>
            <Link to="/register" state={location.state} aria-current={createMode ? 'page' : undefined} className={createMode ? 'is-active' : ''}>{c('Create account')}</Link>
          </nav>
          <div className="auth-cinema-intro"><h1>{c(createMode ? 'Create your account.' : 'Welcome back.')}</h1><p>{c('Enter your Gmail. We will send a one-time code to open your account.')}</p></div>
          <EmailCodeForm initialEmail={initialEmail} intent={createMode ? 'create-account' : 'sign-in'} onAuthenticated={finishEmail} />
          <div className="auth-cinema-divider"><span />{c('or continue with')}<span /></div>
          <GoogleAuthButton mode={createMode ? 'signup' : 'signin'} onCredential={googleSignIn} />
          <p className="auth-cinema-privacy"><ShieldCheck size={15} />{c('Your Gmail password is never requested.')}</p>
        </div>
      </section>
    </motion.div>
  </div>
}
