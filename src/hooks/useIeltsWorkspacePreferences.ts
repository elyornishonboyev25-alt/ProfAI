import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { accountStorageFor } from '@/utils/accountStorage'
type Preferences = { askAi: boolean; showTime: boolean }
const key = 'ielts-workspace-preferences-v1'
function read(owner: string): Preferences {
  try {
    const saved = JSON.parse(accountStorageFor(owner).getItem(key) ?? '{}')
    return { askAi: saved.askAi !== false, showTime: saved.showTime !== false }
  } catch {
    return { askAi: true, showTime: true }
  }
}
export function useIeltsWorkspacePreferences() {
  const owner = useAuthStore((state) => state.user?.id ?? 'guest')
  const [state, setState] = useState(() => ({ owner, value: read(owner) }))
  useEffect(() => {
    setState({ owner, value: read(owner) })
  }, [owner])
  const preferences = state.owner === owner ? state.value : read(owner)
  const updatePreferences = (patch: Partial<Preferences>) => {
    const value = { ...preferences, ...patch }
    setState({ owner, value })
    try {
      accountStorageFor(owner).setItem(key, JSON.stringify(value))
    } catch {
      /* Optional preference. */
    }
  }
  return { preferences, updatePreferences }
}
