import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

export type WheelDiscountState = {
  spun: boolean
  discount: { id: string; percent: number; expiresAt: string } | null
  lastPercent?: number
  expired?: boolean
  used?: boolean
}

/** The account's live wheel discount; it disappears on its own when the window closes. */
export function useWheelDiscount() {
  const userId = useAuthStore(state => state.user?.id)
  const [state, setState] = useState<WheelDiscountState | null>(null)
  const refresh = useCallback(async () => {
    if (!userId) { setState(null); return }
    try { setState(await apiClient.get<WheelDiscountState>('/billing/discount')) } catch { setState(null) }
  }, [userId])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    if (!state?.discount) return
    const remaining = new Date(state.discount.expiresAt).getTime() - Date.now()
    const timer = window.setTimeout(() => void refresh(), Math.max(0, Math.min(remaining + 500, 2147483647)))
    return () => window.clearTimeout(timer)
  }, [state?.discount?.expiresAt, refresh])
  useEffect(() => {
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])
  return { ...(state ?? { spun: false, discount: null }), refresh }
}

export function useCountdown(until: string | null | undefined) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!until) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [until])
  if (!until) return null
  const left = Math.max(0, new Date(until).getTime() - now)
  const hours = Math.floor(left / 3_600_000)
  const minutes = Math.floor((left % 3_600_000) / 60_000)
  const seconds = Math.floor((left % 60_000) / 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  return { left, label: hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}` }
}
