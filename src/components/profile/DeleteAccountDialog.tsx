import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Loader2, Mail, ShieldAlert, Trash2, X } from 'lucide-react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

type DeleteAccountDialogProps = {
  open: boolean
  email: string
  deleting: boolean
  onClose: () => void
  onConfirm: (payload: { email: string; confirmation: 'DELETE' }) => void
}

export default function DeleteAccountDialog({
  open,
  email,
  deleting,
  onClose,
  onConfirm,
}: DeleteAccountDialogProps) {
  const { minimalMotion } = useMotionPreferences()
  const [emailDraft, setEmailDraft] = useState('')
  const [phrase, setPhrase] = useState('')

  useEffect(() => {
    if (!open) return
    setEmailDraft('')
    setPhrase('')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, deleting, onClose])

  const normalizedEmail = email.trim().toLowerCase()
  const canDelete = emailDraft.trim().toLowerCase() === normalizedEmail && phrase === 'DELETE' && !deleting

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"
          initial={minimalMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) onClose()
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            initial={minimalMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: minimalMotion ? 0.1 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/90 bg-white/95 shadow-[0_38px_100px_rgba(15,23,42,.38)] backdrop-blur-3xl"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-error-900 via-error-500 to-orange-400" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-error-100/60 blur-3xl" />

            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-error-500 to-error-800 text-white shadow-[0_16px_34px_rgba(220,38,38,.28)]">
                    <ShieldAlert className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-error-600">Permanent action</p>
                    <h2 id="delete-account-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                      Delete your ProfAI account?
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={deleting}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                  aria-label="Close account deletion dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-error-200 bg-gradient-to-r from-error-50 to-orange-50/70 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-error-800">
                  <AlertTriangle className="h-4 w-4" /> This cannot be undone
                </p>
                <p className="mt-1.5 text-xs leading-5 text-error-900/70">
                  Your study history, XP, streaks, AI conversations, saved vocabulary, profile and results will be permanently removed.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black text-slate-700">Confirm your account email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={emailDraft}
                      onChange={(event) => setEmailDraft(event.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={email}
                      className="input h-12 rounded-2xl border-blue-100 bg-white pl-11 text-sm font-semibold"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black text-slate-700">
                      Type <span className="rounded bg-error-100 px-1.5 py-0.5 font-mono text-error-700">DELETE</span> to continue
                  </span>
                  <input
                    value={phrase}
                    onChange={(event) => setPhrase(event.target.value.toUpperCase())}
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={6}
                    placeholder="DELETE"
                    className="input h-12 rounded-2xl border-blue-100 bg-white font-mono text-sm font-black tracking-[0.16em]"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={deleting}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keep my account
                </button>
                <button
                  type="button"
                  onClick={() => canDelete && onConfirm({ email: emailDraft.trim(), confirmation: 'DELETE' })}
                  disabled={!canDelete}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-error-800 via-error-700 to-error-600 px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(185,28,28,.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  {deleting ? 'Deleting securely...' : 'Permanently delete'}
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
