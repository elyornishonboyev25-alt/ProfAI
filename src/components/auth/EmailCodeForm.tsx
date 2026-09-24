import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useCopy } from '@/i18n/interface'
import type { AuthUser } from '@/types/platform'

export type EmailAuthSession = { user: AuthUser; accessToken: string; refreshToken: string }

type Props = {
  initialEmail?: string
  onAuthenticated: (session: EmailAuthSession) => Promise<void>
  onRecover: (email: string) => void
}

export default function EmailCodeForm({ initialEmail = '', onAuthenticated, onRecover }: Props) {
  const { c } = useCopy()
  const [email, setEmail] = useState(initialEmail)
  const [sentTo, setSentTo] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
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
    try {
      await apiClient.post('/auth/verification/request', { email: normalized, purpose: 'SIGN_IN' }, { auth: false })
      setSentTo(normalized)
      setCode('')
      setResendAt(Date.now() + 60_000)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to send code. Please try again.')
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
      const session = await apiClient.post<EmailAuthSession>('/auth/email/login', { email: sentTo, verificationCode: code }, { auth: false })
      await onAuthenticated(session)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Email code sign in">
      <label className="block text-sm font-semibold text-slate-700">
        {c('Gmail address')}
        <input type="email" autoComplete="email" required disabled={busy} value={email}
          onChange={(event) => { setEmail(event.target.value); setSentTo(''); setCode(''); setError('') }}
          className="input mt-1.5 h-12 rounded-2xl border-blue-100" placeholder="name@gmail.com" />
      </label>
      <p className="text-xs leading-5 text-slate-500">{c('Get a code by email to sign in or create an account. Your existing progress stays saved.')}</p>
      {sentTo && (
        <div className="space-y-3">
          <p role="status" className="break-words text-sm text-blue-700">{c('Code sent to')} {sentTo}. {c('Check your inbox and spam folder.')}</p>
          <label className="block text-sm font-semibold text-slate-700">
            {c('Verification code')}
            <input autoFocus required value={code} disabled={busy} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input mt-1.5 h-12 rounded-2xl border-blue-200 text-center text-xl tracking-[0.35em]" placeholder="000000" />
          </label>
          <p className="text-xs text-slate-500">{c('The code expires in 10 minutes and can be used once.')}</p>
          <button type="button" disabled={busy || remaining > 0} onClick={() => void sendCode()} className="text-sm font-bold text-blue-600 disabled:opacity-50">
            {c('Resend code')}{remaining > 0 ? ` (${remaining}s)` : ''}
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{c(error)}</p>}
      <button type="submit" disabled={busy || (!sentTo && remaining > 0)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-red-500 to-red-700 text-sm font-black text-white disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {c(busy ? 'Please wait...' : sentTo ? 'Verify & continue' : 'Send Gmail verification code')}
        {!sentTo && remaining > 0 ? ` (${remaining}s)` : ''}
      </button>
      <button type="button" disabled={busy} onClick={() => onRecover(email)} className="block w-full text-center text-xs font-bold text-blue-600">{c('Forgot password?')}</button>
    </form>
  )
}
