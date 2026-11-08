export type TelegramWebApp = {
  initData: string
  initDataUnsafe?: { user?: { language_code?: string; first_name?: string } }
  ready: () => void
  expand: () => void
  openLink: (url: string) => void
  openTelegramLink: (url: string) => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  disableVerticalSwipes?: () => void
  onEvent?: (event: string, callback: () => void) => void
  offEvent?: (event: string, callback: () => void) => void
  safeAreaInset?: { top: number; bottom: number; left: number; right: number }
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number }
  BackButton?: { show: () => void; hide: () => void; onClick: (fn: () => void) => void; offClick: (fn: () => void) => void }
  HapticFeedback?: {
    notificationOccurred: (type: 'success' | 'error' | 'warning') => void
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    selectionChanged: () => void
  }
}

declare global { interface Window { Telegram?: { WebApp?: TelegramWebApp } } }

function rememberedTelegramLaunch() {
  try { return window.sessionStorage.getItem('ivygoo:telegram-launch') === '1' } catch { return false }
}
// Capture the launch marker before routing moves a guest to the sign-in page.
export const telegramLaunch = typeof window !== 'undefined' && (
  new URLSearchParams(window.location.search).get('from') === 'telegram'
  || new URLSearchParams(window.location.hash.slice(1)).has('tgWebAppData')
  || Boolean(window.Telegram?.WebApp?.initData)
  || rememberedTelegramLaunch()
)

let loading: Promise<TelegramWebApp | null> | undefined
export function loadTelegramWebApp(): Promise<TelegramWebApp | null> {
  if (window.Telegram?.WebApp) return Promise.resolve(window.Telegram.WebApp)
  if (loading) return loading
  loading = new Promise(resolve => {
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-web-app.js'
    script.async = true
    const finish = () => { window.clearTimeout(timeout); resolve(window.Telegram?.WebApp ?? null) }
    const timeout = window.setTimeout(finish, 6000)
    script.onload = finish
    script.onerror = finish
    document.head.appendChild(script)
  })
  return loading
}
