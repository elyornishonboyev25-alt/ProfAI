import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleCheck, KeyRound, Loader2, Mail, RefreshCw } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/apiClient'
import { useCopy } from '@/i18n/interface'
import type { AuthUser } from '@/types/platform'

export type EmailAuthSession = { user: AuthUser; accessToken: string; refreshToken: string; isNewUser?: boolean }
type Props = { initialEmail?: string; onAuthenticated: (session: EmailAuthSession) => Promise<void>; intent?: 'sign-in' | 'create-account' }
type Challenge = { email: string; expiresAt: number; resendAt: number }
const challengeKey = 'ivygoo:email-code-challenge'
function savedChallenge(initialEmail: string): Challenge | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(challengeKey) || 'null') as Challenge | null
    return saved && /^[^\s@]+@gmail\.com$/.test(saved.email) && saved.expiresAt > Date.now() && Number.isFinite(saved.resendAt) && (!initialEmail || initialEmail.trim().toLowerCase() === saved.email) ? saved : null
  } catch { return null }
}
const clock = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
export default function EmailCodeForm({ initialEmail = '', onAuthenticated, intent = 'sign-in' }: Props) {
  const { c } = useCopy()
  const [restored] = useState(() => savedChallenge(initialEmail))
  const [email, setEmail] = useState(restored?.email || initialEmail)
  const [sentTo, setSentTo] = useState(restored?.email || '')
  const [code, setCode] = useState('')
  const [expiresAt, setExpiresAt] = useState(restored?.expiresAt || 0)
  const [resendAt, setResendAt] = useState(restored?.resendAt || 0)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const codeInput = useRef<HTMLInputElement>(null)
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const expiresIn = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { if (sentTo) codeInput.current?.focus() }, [sentTo])
  const clearChallenge = () => { try { sessionStorage.removeItem(challengeKey) } catch { /* Optional recovery. */ } }
  const sendCode = async () => {
    if (busy || Date.now() < resendAt) return
    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@gmail\.com$/.test(normalized)) { setError('Enter a valid Gmail address.'); return }
    setBusy(true); setError('')
    try {
      const response = await apiClient.post<{ expiresInSec?: number }>('/auth/verification/request', { email: normalized, purpose: 'SIGN_IN' }, { auth: false })
      const stamp = Date.now()
      const challenge = { email: normalized, expiresAt: stamp + (response.expiresInSec || 600) * 1000, resendAt: stamp + 60_000 }
      setEmail(normalized); setSentTo(normalized); setCode(''); setNow(stamp); setExpiresAt(challenge.expiresAt); setResendAt(challenge.resendAt)
      try { sessionStorage.setItem(challengeKey, JSON.stringify(challenge)) } catch { /* The flow works without storage. */ }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to send code. Please try again.')
      if (failure instanceof ApiError && failure.code === 'CODE_COOLDOWN') { setResendAt(Date.now() + 60_000); setNow(Date.now()) }
    } finally { setBusy(false) }
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (!sentTo) { await sendCode(); return }
    if (Date.now() >= expiresAt) { setError('Code expired. Request a new code.'); return }
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code sent to your Gmail.'); return }
    setBusy(true); setError('')
    try {
      const session = await apiClient.post<EmailAuthSession>('/auth/email/login', { email: sentTo, verificationCode: code }, { auth: false })
      clearChallenge()
      await onAuthenticated(session)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to sign in. Please try again.')
      if (failure instanceof ApiError && ['CODE_EXPIRED', 'CODE_LOCKED', 'CODE_NOT_FOUND'].includes(failure.code || '')) { setExpiresAt(0); clearChallenge() }
    } finally { setBusy(false) }
  }
  const editEmail = () => { clearChallenge(); setSentTo(''); setCode(''); setError(''); setExpiresAt(0); setResendAt(0) }
  return <form onSubmit={submit} className="gmail-code-form" aria-label={c(intent === 'create-account' ? 'Create account with Gmail' : 'Email code sign in')}>
    <ol className="gmail-code-steps" aria-label={c('Sign-in steps')}><li className={sentTo ? 'is-complete' : 'is-current'}><span>{sentTo ? <Check size={12} /> : '01'}</span>{c('Your Gmail')}</li><li aria-hidden="true" className="gmail-code-step-line" /><li className={sentTo ? 'is-current' : ''}><span>02</span>{c('Verify code')}</li></ol>
    {!sentTo ? <div className="gmail-code-email"><label htmlFor="auth-code-email">{c('Gmail address')}</label><div className="gmail-code-input-wrap"><Mail size={19} /><input id="auth-code-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required disabled={busy} value={email} onChange={event => { setEmail(event.target.value); setError('') }} placeholder="name@gmail.com" aria-invalid={!!error} aria-describedby={error ? 'gmail-code-error' : undefined} /></div><p className="gmail-code-hint">{c('Use your personal @gmail.com address.')}</p></div> : <div className="gmail-code-challenge"><div className="gmail-code-recipient"><span><Mail size={18} /><strong>{sentTo}</strong></span><button type="button" disabled={busy} onClick={editEmail}><ArrowLeft size={14} />{c('Change')}</button></div><p id="gmail-code-status" role="status" className="gmail-code-delivery"><CircleCheck size={17} />{c('Code sent. Check your inbox or spam folder.')}</p><label htmlFor="auth-verification-code">{c('Verification code')}</label><div className="gmail-code-input-wrap gmail-code-otp"><KeyRound size={20} /><input ref={codeInput} id="auth-verification-code" type="text" required value={code} disabled={busy} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} placeholder="000000" aria-invalid={!!error} aria-describedby={`gmail-code-status${error ? ' gmail-code-error' : ''}`} /></div><div className="gmail-code-timing"><span>{expiresIn > 0 ? `${c('Expires in')} ${clock(expiresIn)}` : c('Code expired. Request a new code.')}</span><button type="button" disabled={busy || resendIn > 0} onClick={() => void sendCode()}><RefreshCw size={13} />{c('Resend code')}{resendIn > 0 ? ` ${clock(resendIn)}` : ''}</button></div></div>}
    {error && <p id="gmail-code-error" role="alert" className="gmail-code-error">{c(error)}</p>}
    <button type="submit" disabled={busy || (!sentTo && resendIn > 0) || (!!sentTo && expiresIn === 0)} className="gmail-code-submit">{busy ? <Loader2 size={19} className="animate-spin" /> : <span>{c(sentTo ? 'Verify & continue' : 'Send my code')}</span>}{busy ? <span>{c(sentTo ? 'Verifying...' : 'Sending code...')}</span> : <ArrowRight size={19} />}</button>
  </form>
}
