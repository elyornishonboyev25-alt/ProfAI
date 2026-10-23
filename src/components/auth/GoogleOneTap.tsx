import { useEffect } from 'react'
import { connectGoogleIdentity } from '@/lib/googleIdentity'
import { apiClient } from '@/lib/apiClient'
import { finishAccountAccess } from '@/lib/finishAccountAccess'
import type { EmailAuthSession } from './EmailCodeForm'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'

const promptedKey = 'ivygoo:google-one-tap-attempted'

/** Google owns the chooser; browser settings determine its eligibility. */
export default function GoogleOneTap() {
  const user = useAuthStore(state => state.user)
  const hydrated = useAuthStore(state => state.hydrated)
  useEffect(() => {
    if (user || !hydrated) return
    try { if (sessionStorage.getItem(promptedKey)) return } catch { /* Session storage is optional. */ }
    let canceled = false
    let attempted = false
    let due = false
    let timer: number | undefined
    let connection: Awaited<ReturnType<typeof connectGoogleIdentity>> | undefined
    const prompt = () => {
      if (canceled || attempted || !due || !connection || document.hidden || useAuthStore.getState().user) return
      attempted = true
      connection.api.prompt()
      try { sessionStorage.setItem(promptedKey, '1') } catch { /* Google also respects dismissal. */ }
    }
    // Load the SDK while the visitor settles in, so the delay does not include its download.
    void connectGoogleIdentity(async credential => {
      if (canceled || useAuthStore.getState().user) return
      try {
        const payload = await apiClient.post<EmailAuthSession>('/auth/google', { idToken: credential, allowCreate: true }, { auth: false })
        await finishAccountAccess(payload, '/dashboard', 'google')
      } catch (failure) {
        if (!canceled) useToastStore.getState().pushToast({ type: 'error', title: 'Google sign-in failed', message: failure instanceof Error ? failure.message : 'Unable to sign in' })
      }
    }).then(ready => {
      if (canceled || useAuthStore.getState().user) { ready.release(); return }
      connection = ready
      prompt()
    }).catch(() => { /* Browsing and explicit email sign-in remain available. */ })
    const start = () => {
      window.clearTimeout(timer)
      due = false
      if (document.hidden || attempted) return
      timer = window.setTimeout(() => { due = true; prompt() }, 2500)
    }
    start()
    document.addEventListener('visibilitychange', start)
    return () => { canceled = true; window.clearTimeout(timer); document.removeEventListener('visibilitychange', start); connection?.api.cancel(); connection?.release() }
  }, [user?.id, hydrated])
  return null
}
