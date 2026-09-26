import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, KeyRound, Loader2, Mail, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiClient, ApiError } from '@/lib/apiClient'
import { useCopy } from '@/i18n/interface'
import type { AuthUser } from '@/types/platform'

export type EmailAuthSession = { user: AuthUser; accessToken: string; refreshToken: string }

type Props = {
  initialEmail?: string
  onAuthenticated: (session: EmailAuthSession) => Promise<void>
  onRecover?: (email: string) => void
  intent?: 'sign-in' | 'create-account'
}

export default function EmailCodeForm({ initialEmail = '', onAuthenticated, onRecover, intent = 'sign-in' }: Props) {
  const { c } = useCopy()
  const [email, setEmail] = useState(initialEmail)
  const [sentTo, setSentTo] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [accountRoute, setAccountRoute] = useState<'/login' | '/register' | null>(null)
  const [resendAt, setResendAt] = useState(0)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [resendAt])

  const sendCode = async () => {
    if (busy || Date.now() < resendAt) return
    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@gmail\.com$/.test(normalized)) {
      setError('Enter a valid Gmail address.')
      return
    }
    setBusy(true)
    setError('')
    setAccountRoute(null)
    try {
      await apiClient.post('/auth/verification/request', { email: normalized, purpose: intent === 'create-account' ? 'REGISTER' : 'SIGN_IN' }, { auth: false })
      setSentTo(normalized)
      setCode('')
      setResendAt(Date.now() + 60_000)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to send code. Please try again.')
      if (failure instanceof ApiError) {
        if (failure.code === 'ACCOUNT_NOT_FOUND') setAccountRoute('/register')
        if (failure.code === 'ACCOUNT_EXISTS') setAccountRoute('/login')
      }
    } finally {
      setBusy(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (!sentTo) return sendCode()
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code sent to your Gmail.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const session = await apiClient.post<EmailAuthSession>(intent === 'create-account' ? '/auth/email/register' : '/auth/email/login', { email: sentTo, verificationCode: code }, { auth: false })
      await onAuthenticated(session)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to sign in. Please try again.')
      if (failure instanceof ApiError) {
        if (failure.code === 'ACCOUNT_NOT_FOUND') setAccountRoute('/register')
        if (failure.code === 'ACCOUNT_EXISTS') setAccountRoute('/login')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="auth-email-form" aria-label={intent === 'create-account' ? 'Create account with Gmail' : 'Email code sign in'}>
      <div className="auth-email-field">
        <label htmlFor="auth-code-email">{c('Gmail address')}</label>
        <div className="auth-cinema-input-wrap">
          <Mail size={19} />
          <input id="auth-code-email" type="email" autoComplete="email" required disabled={busy} value={email}
            onChange={(event) => { setEmail(event.target.value); setSentTo(''); setCode(''); setError(''); setAccountRoute(null); setResendAt(0) }}
            placeholder="name@gmail.com" />
        </div>
      </div>
      <p className="auth-email-helper">{intent === 'create-account' ? c('We will send a one-time code to confirm your Gmail and create your account.') : c('Get a one-time code by email. Your existing progress stays saved.')}</p>
      {sentTo && (
        <div className="auth-email-verification">
          <p role="status" className="auth-email-sent"><CheckCircle2 size={18} /><span>{c('Code sent to')} <strong>{sentTo}</strong>. {c('Check your inbox and spam folder.')}</span></p>
          <label htmlFor="auth-verification-code">{c('Verification code')}</label>
          <div className="auth-cinema-input-wrap auth-cinema-code-wrap">
            <KeyRound size={19} />
            <input id="auth-verification-code" autoFocus required value={code} disabled={busy} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" />
          </div>
          <div className="auth-email-code-meta">
            <span>{c('Code expires in 10 minutes.')}</span>
            <button type="button" disabled={busy || remaining > 0} onClick={() => void sendCode()}><RefreshCw size={14} />{c('Resend')}{remaining > 0 ? ` ${remaining}s` : ''}</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="auth-cinema-error">{c(error)}</p>}
      {accountRoute && <Link to={accountRoute} state={{ email: email.trim().toLowerCase() }} className="auth-cinema-account-link">{c(accountRoute === '/register' ? 'Create account with this Gmail' : 'Sign in with this Gmail')}</Link>}
      <button type="submit" disabled={busy || (!sentTo && remaining > 0)} className="auth-cinema-submit">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : sentTo ? <CheckCircle2 size={19} /> : <Mail size={19} />}
        <span>{c(busy ? 'Please wait...' : sentTo ? intent === 'create-account' ? 'Verify & create account' : 'Verify & continue' : 'Send Gmail verification code')}</span>
        {!sentTo && remaining > 0 ? ` (${remaining}s)` : ''}
      </button>
      {onRecover && <button type="button" disabled={busy} onClick={() => onRecover(email)} className="auth-cinema-switch-method">{c('Forgot password?')}</button>}
    </form>
  )
}
