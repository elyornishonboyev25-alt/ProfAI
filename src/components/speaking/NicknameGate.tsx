import { useEffect, useRef, useState } from 'react'
import { AtSign, Check, Loader2, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { setNickname as apiSetNickname } from '@/lib/speakingApi'
import { apiClient } from '@/lib/apiClient'
import { useCopy } from '@/i18n/interface'

const NICKNAME_RE = /^[A-Za-z][A-Za-z0-9_]{2,19}$/
type Status = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error'
export default function NicknameGate() {
  const { c } = useCopy()
  const user = useAuthStore(state => state.user)
  const hydrated = useAuthStore(state => state.hydrated)
  const setUserNickname = useAuthStore(state => state.setUserNickname)
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [deferredUser, setDeferredUser] = useState<string | null>(() => {
    try { return user && sessionStorage.getItem('profai:nickname-deferred:' + user.id) === '1' ? user.id : null } catch { return null }
  })
  const dialog = useRef<HTMLDialogElement>(null)
  const needsNickname = hydrated && !!user && user.onboardingCompleted && !user.nickname && deferredUser !== user.id
  function defer() {
    if (saving) return
    if (user) {
      try { sessionStorage.setItem('profai:nickname-deferred:' + user.id, '1') } catch { /* Session preference is optional. */ }
      setDeferredUser(user.id)
    }
  }
  useEffect(() => {
    const element = dialog.current
    if (!needsNickname || !element) return
    element.showModal()
    return () => element.close()
  }, [needsNickname])
  useEffect(() => {
    if (!needsNickname) return
    const candidate = value.trim()
    setError(false)
    if (!candidate) { setStatus('idle'); return }
    if (!NICKNAME_RE.test(candidate)) { setStatus('invalid'); return }
    let cancelled = false
    setStatus('checking')
    const timer = window.setTimeout(() => {
      void apiClient.get<{ available: boolean }>('/profile/nickname/check?value=' + encodeURIComponent(candidate))
        .then(result => { if (!cancelled) setStatus(result.available ? 'available' : 'taken') })
        .catch(() => { if (!cancelled) setStatus('error') })
    }, 450)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [value, needsNickname, retry])
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!NICKNAME_RE.test(value.trim()) || status !== 'available' || saving) return
    setSaving(true); setError(false)
    try { await apiSetNickname(value.trim()); setUserNickname(value.trim()) }
    catch { setError(true) }
    finally { setSaving(false) }
  }
  const messages: Record<Status, string> = {
    idle: 'Pick something memorable.',
    invalid: '3–20 characters: letters, numbers or underscore, starting with a letter.',
    checking: 'Checking availability…',
    available: '✓ Available — it’s yours!',
    taken: 'Already taken — try another.',
    error: 'Unable to check availability. Try again.',
  }
  if (!needsNickname) return null
  return <dialog ref={dialog} className="liquid-nickname-dialog" aria-labelledby="nickname-heading" aria-describedby="nickname-description" onCancel={event => { event.preventDefault(); defer() }}>
    <button type="button" disabled={saving} onClick={defer} className="liquid-icon-button ml-auto" aria-label={c('Later')}><X size={18} /></button>
    <AtSign size={32} className="text-red-700 mb-4" />
    <h2 id="nickname-heading">{c('Choose your nickname')}</h2>
    <p id="nickname-description">{c('A unique public name for the community. Your email stays private.')}</p>
    <form onSubmit={event => void submit(event)}>
      <label className="liquid-form-field">{c('Nickname')}<input autoFocus autoComplete="nickname" value={value} maxLength={20} disabled={saving} aria-describedby="nickname-status" aria-invalid={status === 'invalid' || status === 'taken'} onChange={event => setValue(event.target.value.replace(/\s/g, ''))} /></label>
      <p id="nickname-status" role="status" className={status === 'available' ? 'text-emerald-700' : ''}>{status === 'checking' && <Loader2 size={14} className="inline animate-spin mr-2" />}{status === 'available' && <Check size={14} className="inline mr-2" />}{c(messages[status])}</p>
      {status === 'error' && <button className="liquid-text-link mt-2" type="button" onClick={() => setRetry(n => n + 1)}>{c('Try again')}</button>}
      {error && <p className="liquid-inline-error mt-4" role="alert">{c('Could not save nickname. Try another one.')}</p>}
      <button type="submit" disabled={status !== 'available' || saving} className="liquid-button primary w-full mt-6">{saving && <Loader2 size={16} className="animate-spin" />}{c('Claim this nickname')}</button>
      <button type="button" disabled={saving} onClick={defer} className="liquid-text-link mt-4">{c('I’ll do it later')}</button>
    </form>
  </dialog>
}
