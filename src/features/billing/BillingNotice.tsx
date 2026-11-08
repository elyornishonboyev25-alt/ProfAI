import { useCallback, useEffect, useState } from 'react'
import UpgradePrompt from './UpgradePrompt'
import { useAccountAccess } from './useAccountAccess'
export default function BillingNotice() {
  const [message, setMessage] = useState('')
  const access = useAccountAccess()
  const close = useCallback(() => setMessage(''), [])
  useEffect(() => {
    const listener = (event: Event) => setMessage((event as CustomEvent<string>).detail || 'content')
    window.addEventListener('profai:premium-required', listener)
    return () => window.removeEventListener('profai:premium-required', listener)
  }, [])
  if (!message) return null
  return <UpgradePrompt modal onClose={close} tier={access?.active ? access.tier === 'MAX' ? 'RESET' : 'MAX' : 'PRO'} reason={/live|voice/i.test(message) ? 'voice' : /allowance|AI|limit/i.test(message) ? 'ai' : 'content'} />
}
