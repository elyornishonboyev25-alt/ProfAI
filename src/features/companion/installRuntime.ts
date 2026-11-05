import { updateCompanionState } from './promotionState'

export type InstallPrompt = Event & {
  prompt: () => Promise<unknown>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
let pending: InstallPrompt | null = null

export function isInstalledApp() {
  return Boolean(window.matchMedia?.('(display-mode: standalone)').matches
    || window.matchMedia?.('(display-mode: fullscreen)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone)
}
export function hasInstallPrompt() { return Boolean(pending) }
export function takeInstallPrompt() { const prompt = pending; pending = null; return prompt }

// Eagerly capture the browser event, including while another welcome dialog is
// open. Only a deliberate click on our install button invokes the OS prompt.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    pending = event as InstallPrompt
    window.dispatchEvent(new Event('ivygoo:install-state'))
  })
  window.addEventListener('appinstalled', () => {
    pending = null
    updateCompanionState({ installed: true })
    window.dispatchEvent(new Event('ivygoo:install-state'))
  })
}

export function installationPlatform(): 'ios' | 'android' | 'safari' | 'desktop' | 'unsupported' {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua)) return 'safari'
  if (/Firefox/i.test(ua)) return 'unsupported'
  return 'desktop'
}
