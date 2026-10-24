import { useEffect, useState } from 'react'
import { ACCOUNT_DATA_EVENT } from '@/utils/accountStorage'

/** Refresh saved-attempt views after local writes, cloud sync and other tabs. */
export function useAccountDataRevision() {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setRevision(value => value + 1), 50)
    }
    window.addEventListener(ACCOUNT_DATA_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      clearTimeout(timer)
      window.removeEventListener(ACCOUNT_DATA_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return revision
}
