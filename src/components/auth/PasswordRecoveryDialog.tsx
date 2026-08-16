import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, KeyRound, Loader2, Lock, Mail, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useToastStore } from '@/store/toastStore'

type Props = {
  open: boolean
  initialEmail?: string
  onClose: () => void
}

type VerificationResponse = {
  message: string
  expiresInSec: number
  developmentCode?: string
}

export default function PasswordRecoveryDialog({ open, initialEmail = '', onClose }: Props) {
  const pushToast = useToastStore((state) => state.pushToast)
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail(initialEmail)
      return
    }
    setCode('')
    setNewPassword('')
    setConfirmPassword('')
    setCodeSent(false)
  }, [initialEmail, open])

  const requestCode = async () => {
    const normalized = email.trim().toLowerCase()
    if (!/^[^\s@]+@gmail\.com$/i.test(normalized)) {
      pushToast({ type: 'error', title: 'Gmail required', message: 'Enter the Gmail address used for your ProfAI account.' })
      return
    }

    setBusy(true)
    try {
      const response = await apiClient.post<VerificationResponse>(
        '/auth/verification/request',
        { email: normalized, purpose: 'RESET_PASSWORD' },
        { auth: false },
      )
      setCodeSent(true)
      if (response.developmentCode) setCode(response.developmentCode)
      pushToast({ type: 'success', title: 'Check your Gmail', message: response.message })
    } catch (error) {
      pushToast({ type: 'error', title: 'Code not sent', message: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    if (!/^\d{6}$/.test(code)) {
      pushToast({ type: 'error', title: 'Invalid code', message: 'Enter the 6-digit code from your Gmail.' })
      return
    }
    if (newPassword.length < 8) {
      pushToast({ type: 'error', title: 'Password too short', message: 'Use at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      pushToast({ type: 'error', title: 'Passwords do not match', message: 'Enter the same new password twice.' })
      return
    }

    setBusy(true)
    try {
      const response = await apiClient.post<{ message: string }>(
        '/auth/password/reset',
        { email: email.trim().toLowerCase(), verificationCode: code, newPassword },
        { auth: false },
      )
      pushToast({ type: 'success', title: 'Password updated', message: response.message })
      setCode('')
      setNewPassword('')
      setConfirmPassword('')
      setCodeSent(false)
      onClose()
    } catch (error) {
      pushToast({ type: 'error', title: 'Password not changed', message: error instanceof Error ? error.message : 'Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4">
          <motion.button
            type="button"
            aria-label="Close password recovery"
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-recovery-title"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="panel-surface relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,.3)] sm:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-red-500 to-red-700" />
            <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-inner">
              <KeyRound className="h-6 w-6" />
            </div>
            <p className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure recovery
            </p>
            <h2 id="password-recovery-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950">Create a new password</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">We will send a one-time 6-digit code to the Gmail linked to your account.</p>

            <label className="mt-6 block">
              <span className="mb-1.5 block text-sm font-bold text-slate-700">Gmail address</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                <input value={email} onChange={(event) => { setEmail(event.target.value); setCodeSent(false) }} disabled={busy} type="email" autoComplete="email" className="input h-12 rounded-2xl border-blue-100 bg-white pl-11 font-semibold" placeholder="name@gmail.com" />
              </div>
            </label>

            {codeSent ? (
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-sm font-bold text-slate-700">
                    Verification code
                    <button type="button" disabled={busy} onClick={() => void requestCode()} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
                      <RefreshCw className="h-3 w-3" /> Resend
                    </button>
                  </span>
                  <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="input h-12 rounded-2xl border-blue-100 bg-blue-50/40 text-center text-xl font-black tracking-[0.35em]" placeholder="000000" />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">New password</span>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                      <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" className="input h-12 rounded-2xl border-blue-100 pl-11" placeholder="8+ characters" />
                    </div>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">Confirm password</span>
                    <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" className="input h-12 rounded-2xl border-blue-100" placeholder="Repeat password" />
                  </label>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              disabled={busy}
              onClick={() => void (codeSent ? resetPassword() : requestCode())}
              className="cta-sheen mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-red-600 text-sm font-black text-white shadow-[0_16px_34px_rgba(37,99,235,.28)] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : codeSent ? <CheckCircle2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              {busy ? 'Please wait...' : codeSent ? 'Set new password' : 'Send verification code'}
            </button>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
