import { useEffect, useRef, useState, type ReactNode } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useBillingText } from './copy'

/** The fallback voice transport uses the same durable time allowance as WebRTC. */
export default function StandardLiveSession({ children, onEnd }: { children: ReactNode; onEnd: () => void }) {
  const userId = useAuthStore(s => s.user?.id)
  const end = useRef(onEnd)
  end.current = onEnd
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const text = useBillingText()
  useEffect(() => {
    let disposed = false, id: string | undefined, timer: number | undefined
    setState('loading')
    const release = () => { if (id) { void apiClient.post('/ai/voice/end', { id }).catch(() => {}); id = undefined } }
    // Defer admission until this mount survives React StrictMode's effect replay.
    const connectTimer = window.setTimeout(() => { void apiClient.post<{ id: string; expiresAt: string }>('/ai/voice/standard/connect').then(session => {
      id = session.id
      if (disposed) { release(); return }
      timer = window.setTimeout(() => { release(); end.current() }, Math.max(0, Date.parse(session.expiresAt) - Date.now()))
      setState('ready')
    }).catch(failure => { if (!disposed) { setError(failure.message); setState('failed') } }) }, 0)
    return () => { disposed = true; window.clearTimeout(connectTimer); window.clearTimeout(timer); release() }
  }, [userId, retry])
  if (state === 'ready') return <>{children}</>
  return <div className="upgrade-backdrop"><div className="upgrade-prompt"><h2>Live AI</h2><p role={state === 'failed' ? 'alert' : 'status'}>{state === 'failed' ? error : text('Preparing your voice session…', 'Ovozli suhbat tayyorlanmoqda…', 'Подготавливаем голосовой чат…')}</p>{state === 'failed' && <button className="upgrade-action" onClick={() => setRetry(value => value + 1)}>{text('Retry', 'Qayta urinish', 'Повторить')}</button>}<button className="upgrade-later" onClick={() => end.current()}>{text('Back to chat', 'Chatga qaytish', 'Вернуться в чат')}</button></div></div>
}
