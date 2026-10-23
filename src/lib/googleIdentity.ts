import { apiClient } from '@/lib/apiClient'

type CredentialHandler = (credential: string) => Promise<void> | void
export type GoogleIdentity = {
  initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode: 'popup'; auto_select: boolean; context: 'use'; itp_support: boolean; use_fedcm_for_button: boolean; button_auto_select: boolean }) => void
  renderButton: (parent: HTMLElement, options: { locale: string; type: 'standard'; theme: 'outline'; size: 'large'; text: 'continue_with'; shape: 'pill' | 'rectangular'; logo_alignment: 'left'; width: number }) => void
  prompt: () => void
  cancel: () => void
}
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }

let configRequest: Promise<string> | undefined
let scriptRequest: Promise<GoogleIdentity> | undefined
let initializedClient = ''
let processing = false
const handlers = new Map<symbol, CredentialHandler>()

function clientId() {
  configRequest ??= apiClient.get<{ enabled: boolean; clientId: string | null }>('/auth/google/config', { auth: false })
    .then(config => config.enabled ? config.clientId?.trim() || '' : '')
    .catch(error => {
      configRequest = undefined
      const fallback = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
      if (fallback) return fallback
      throw error
    })
  return configRequest
}

function loadIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  if (scriptRequest) return scriptRequest
  scriptRequest = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-identity-script') as HTMLScriptElement | null
    const script = existing || document.createElement('script')
    const cleanup = () => { window.clearTimeout(timeout); script.removeEventListener('load', loaded); script.removeEventListener('error', failed) }
    const failed = () => { cleanup(); script.remove(); scriptRequest = undefined; reject(new Error('Google sign-in is currently unavailable. Use your email instead.')) }
    const loaded = () => { if (!window.google?.accounts?.id) { failed(); return }; cleanup(); resolve(window.google.accounts.id) }
    const timeout = window.setTimeout(failed, 12_000)
    script.addEventListener('load', loaded)
    script.addEventListener('error', failed)
    if (!existing) {
      script.id = 'google-identity-script'; script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true
      document.head.appendChild(script)
    }
  })
  return scriptRequest
}

/** One shared GIS initialization; route lifetimes own and release their callbacks. */
export async function connectGoogleIdentity(handler: CredentialHandler) {
  const id = await clientId()
  if (!id) throw new Error('Google sign-in is currently unavailable. Use your email instead.')
  const api = await loadIdentity()
  if (initializedClient !== id) {
    api.initialize({
      client_id: id, ux_mode: 'popup', auto_select: false, context: 'use', itp_support: true,
      use_fedcm_for_button: true, button_auto_select: false,
      callback: response => {
        const activeHandlers = [...handlers.values()]
        const handle = activeHandlers[activeHandlers.length - 1]
        if (!response.credential || !handle || processing) return
        processing = true
        void Promise.resolve().then(() => handle(response.credential)).catch(() => {
          // Each consumer presents an inline error or a toast.
        }).finally(() => { processing = false })
      },
    })
    initializedClient = id
  }
  const owner = Symbol('google-identity-consumer')
  handlers.set(owner, handler)
  return { api, release: () => { handlers.delete(owner) } }
}
