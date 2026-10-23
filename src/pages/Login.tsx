import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, Fingerprint, GraduationCap, Mail, ShieldCheck } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useToastStore, type ToastState } from '@/store/toastStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandMark } from '@/components/brand/BrandLogo'
import EmailCodeForm, { type EmailAuthSession } from '@/components/auth/EmailCodeForm'
import { takeFlashToast } from '@/utils/authFlash'
import { captureAnalyticsEvent } from '@/lib/analytics'
import { claimStoredGuestDiagnostic, peekGuestDiagnosticDestination, takeGuestDiagnosticDestination } from '@/lib/guestDiagnostic'
import { accountReturnPath } from '@/utils/accountAccess'
import '@/styles/gmail-access.css'

export default function Login() {
  const { c } = useCopy()
  const location = useLocation()
  const createMode = location.pathname === '/register'
  const setSession = useAuthStore((state: AuthState) => state.setSession)
  const pushToast = useToastStore((state: ToastState) => state.pushToast)
  const { minimalMotion } = useMotionPreferences()
  useEffect(() => { const flash = takeFlashToast(); if (flash) pushToast(flash) }, [pushToast])
  const redirectPath = useMemo(() => {
    const state = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null
    return accountReturnPath(state?.from)
  }, [location.state])
  const initialEmail = (location.state as { email?: string } | null)?.email ?? ''
  const finishAuth = async (payload: EmailAuthSession, method = 'email_code') => {
    setSession(payload)
    const diagnosticClaimed = await claimStoredGuestDiagnostic()
    captureAnalyticsEvent(payload.isNewUser ? 'signup_completed' : 'login_completed', { method })
    if (diagnosticClaimed) captureAnalyticsEvent('diagnostic_claimed', { method })
    const destination = peekGuestDiagnosticDestination() ? takeGuestDiagnosticDestination(redirectPath) : redirectPath
    window.location.replace(destination)
  }
  return <div className="gmail-access-page workspace-page">
    <motion.main id="sign-in" className="gmail-access-shell" initial={minimalMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}>
      <aside className="gmail-access-story" aria-label={c('Your learning workspace')}>
        <Link to="/" className="gmail-access-brand" aria-label="Ivygoo"><BrandMark size={48} /><strong>Ivy<span>goo</span></strong><ArrowUpRight size={18} /></Link>
        <div className="gmail-access-story-copy"><span className="gmail-access-eyebrow">{c('A LITTLE PRACTICE. A BIGGER FUTURE.')}</span><h2>{c('Your next chapter.')}<br /><em>{c('Within reach.')}</em></h2><p>{c('IELTS, SAT and your university journey. All in one focused workspace.')}</p></div>
        <div className="gmail-exam-stack" aria-hidden="true">
          <div className="gmail-exam-orbit" />
          <div className="gmail-exam-card gmail-exam-ielts"><span className="gmail-exam-index">01 / ENGLISH</span><div className="gmail-exam-title">IELTS<GraduationCap size={33} /></div><span className="gmail-exam-rule" /><p>{c('Listening. Reading. Writing. Speaking.')}</p><span className="gmail-exam-pill"><Check size={14} /> Academic &amp; General</span></div>
          <div className="gmail-exam-card gmail-exam-sat"><span className="gmail-exam-index">02 / REASONING</span><div className="gmail-exam-title">Digital SAT<span className="gmail-exam-spark">+</span></div><p>Reading &amp; Writing / Math</p><div className="gmail-exam-bars">{[28, 43, 34, 57, 49, 72, 86].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><small>{c('Practice. Review. Progress.')}</small></div>
        </div>
        <div className="gmail-access-story-footer"><span><ShieldCheck size={17} />{c('One account. All your progress.')}</span><small>ivygoo.com</small></div>
      </aside>
      <section className="gmail-access-panel" aria-label={c('Gmail account access')}>
        <div className="gmail-access-panel-inner">
          <div className="gmail-access-mobile-brand"><BrandMark size={32} /><strong>Ivy<span>goo</span></strong></div>
          <nav className="gmail-access-tabs" aria-label={c('Account access')}><Link to="/login" state={location.state} aria-current={!createMode ? 'page' : undefined}>{c('Sign in')}</Link><Link to="/register" state={location.state} aria-current={createMode ? 'page' : undefined}>{c('Get started')}</Link></nav>
          <span className="gmail-access-badge"><Fingerprint size={15} />{c('SECURE GMAIL ACCESS')}</span>
          <h1>{c(createMode ? 'Your next chapter starts here.' : 'Welcome back.')}</h1>
          <p className="gmail-access-intro">{c('Enter your Gmail. We will send a one-time code to open your account.')}</p>
          <EmailCodeForm initialEmail={initialEmail} intent={createMode ? 'create-account' : 'sign-in'} onAuthenticated={finishAuth} />
          <div className="gmail-access-returning"><Mail size={18} /><p>{c('Already have an account? Use the same Gmail. Your results, classes and progress stay with you.')}</p></div>
          <p className="gmail-access-privacy"><ShieldCheck size={14} />{c('Your Gmail password is never requested.')}</p>
        </div>
      </section>
    </motion.main>
  </div>
}
