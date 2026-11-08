import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { loadTelegramWebApp, telegramLaunch } from '@/lib/telegramWebApp'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/platform'
import '@/styles/telegram-app.css'

type Session = { user: AuthUser; accessToken: string; refreshToken: string }
let authentication: Promise<Session | null> | undefined

export function useTelegramApp() {
  const hydrated = useAuthStore(state => state.hydrated)
  const [ready, setReady] = useState(!telegramLaunch)
  const location = useLocation()
  const entryPath = useRef(location.pathname)
  const navigate = useNavigate()

  useEffect(() => {
    if (!telegramLaunch || !hydrated) return
    let cancelled = false
    let dispose = () => {}
    void loadTelegramWebApp().then(async app => {
      if (!app?.initData || cancelled) return
      try { sessionStorage.setItem('ivygoo:telegram-launch', '1') } catch { /* Optional reload hint, never used as authentication. */ }
      app.ready()
      app.expand()
      app.setHeaderColor?.('#edf0f5')
      app.setBackgroundColor?.('#edf0f5')
      app.disableVerticalSwipes?.()
      const updateInsets = () => {
        for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
          document.documentElement.style.setProperty(`--tg-content-${edge}`, `${Math.max(0, app.contentSafeAreaInset?.[edge] ?? 0) + Math.max(0, app.safeAreaInset?.[edge] ?? 0)}px`)
        }
      }
      document.documentElement.dataset.telegram = 'true'
      updateInsets()
      app.onEvent?.('safeAreaChanged', updateInsets)
      app.onEvent?.('contentSafeAreaChanged', updateInsets)
      dispose = () => {
        app.offEvent?.('safeAreaChanged', updateInsets)
        app.offEvent?.('contentSafeAreaChanged', updateInsets)
      }
      // Keep an existing website session. A bot identity can only open an
      // explicitly linked account after its signed launch data is verified.
      if (!useAuthStore.getState().accessToken && entryPath.current !== '/spin') {
        authentication ??= apiClient.post<Session>('/auth/telegram', { initData: app.initData }).catch(() => null)
        const session = await authentication
        if (!cancelled && session && !useAuthStore.getState().accessToken) useAuthStore.getState().setSession(session)
      }
    }).catch(() => { /* The regular sign-in flow remains available if Telegram fails. */ }).finally(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true; dispose() }
  }, [hydrated])

  useEffect(() => {
    const back = window.Telegram?.WebApp?.BackButton
    if (!telegramLaunch || !ready || !back) return
    const goBack = () => {
      // The normal website exit guards also handle Mini App back navigation.
      if (window.history.state?.idx > 0) navigate(-1)
      else navigate('/dashboard')
    }
    if (['/', '/dashboard', '/login', '/register'].includes(location.pathname)) back.hide()
    else back.show()
    back.onClick(goBack)
    return () => { back.offClick(goBack) }
  }, [location.pathname, navigate, ready])

  return !ready
}
