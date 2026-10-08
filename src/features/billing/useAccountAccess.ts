import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from './store'
import type { AccessEntitlement } from '../../../backend/src/utils/accessEntitlement'

export function currentAccess(access: AccessEntitlement | undefined, now = Date.now()): AccessEntitlement | null {
  if (!access) return null
  const end = access.expiresAt ? new Date(access.expiresAt).getTime() : null
  return { ...access, active: access.active && (end === null || end > now),
    daysRemaining: access.kind === 'TRIAL' && end !== null ? Math.max(0, Math.ceil((end - now) / 86400000)) : access.daysRemaining }
}
export function useAccountAccess() {
  const user = useAuthStore(state => state.user)
  const { wallet, userId, refresh } = useBillingStore()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!user) return
    void refresh()
    const timer = window.setInterval(() => { setNow(Date.now()); void refresh() }, 60000)
    return () => window.clearInterval(timer)
  }, [user?.id, refresh])
  const access = userId === user?.id && wallet?.access ? wallet.access : user?.access
  useEffect(() => {
    if (!access?.active || !access.expiresAt) return
    const remaining = new Date(access.expiresAt).getTime() - Date.now()
    if (!Number.isFinite(remaining)) return
    const timer = window.setTimeout(() => { setNow(Date.now()); void refresh() }, Math.max(0, Math.min(remaining + 1, 2147483647)))
    return () => window.clearTimeout(timer)
  }, [access?.active, access?.expiresAt, refresh])
  return currentAccess(access, now)
}
