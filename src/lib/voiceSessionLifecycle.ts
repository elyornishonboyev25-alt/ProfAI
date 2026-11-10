import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

let serial: Promise<unknown> = Promise.resolve()
let fallbackClientId: string | undefined
const pending = new Map<string, Set<string>>()

export function voiceClientId() {
  try {
    const saved = sessionStorage.getItem('ivygoo-voice-client-v1')
    if (saved && /^[a-f0-9-]{36}$/.test(saved)) return saved
  } catch { /* Retain the in-memory identity if tab storage is unavailable. */ }
  fallbackClientId ??= crypto.randomUUID()
  try { sessionStorage.setItem('ivygoo-voice-client-v1', fallbackClientId) } catch { /* Optional persistence. */ }
  return fallbackClientId
}

function queued<T>(operation: () => Promise<T>): Promise<T> {
  const result = serial.catch(() => {}).then(operation)
  serial = result.catch(() => {})
  return result
}

/** Closing a previous transport completes before this document reserves another. */
export function openVoiceSession<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal) {
  const owner = useAuthStore.getState().user?.id
  return queued(async () => {
    signal?.throwIfAborted()
    if (!owner || useAuthStore.getState().user?.id !== owner) throw new Error('The voice account changed.')
    for (const id of pending.get(owner) ?? []) {
      try {
        await apiClient.post('/ai/voice/end', { id }, { expectedUserId: owner, signal: AbortSignal.any([AbortSignal.timeout(6000), ...(signal ? [signal] : [])]) })
        pending.get(owner)?.delete(id)
      } catch { signal?.throwIfAborted() }
    }
    return apiClient.post<T>(path, { ...body, clientId: voiceClientId() }, { expectedUserId: owner, signal })
  })
}

export function releaseVoiceSession(id: string) {
  const owner = useAuthStore.getState().user?.id
  if (!owner) return Promise.resolve()
  const ids = pending.get(owner) ?? new Set<string>()
  ids.add(id); pending.set(owner, ids)
  return queued(async () => {
    try {
      await apiClient.post('/ai/voice/end', { id }, { expectedUserId: owner, keepalive: true, signal: AbortSignal.timeout(6000) })
      ids.delete(id)
    } catch { /* Same-client replacement and the server lease also recover a missed release. */ }
  })
}

/** A lost browser or lost end request can hold a reservation for at most one lease. */
export function maintainVoiceLease(id: string, onExpired: () => void) {
  const owner = useAuthStore.getState().user?.id
  const controller = new AbortController()
  let checking = false
  const beat = async () => {
    if (checking || controller.signal.aborted || useAuthStore.getState().user?.id !== owner) return
    checking = true
    try {
      await apiClient.post('/ai/voice/heartbeat', { id, clientId: voiceClientId() }, {
        expectedUserId: owner, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(6000)]),
      })
    } catch (error) {
      if (!controller.signal.aborted && error && typeof error === 'object' && 'status' in error && error.status === 404) onExpired()
    } finally { checking = false }
  }
  const visible = () => { if (!document.hidden) void beat() }
  const timer = window.setInterval(() => { void beat() }, 10000)
  document.addEventListener('visibilitychange', visible)
  return () => { window.clearInterval(timer); controller.abort(); document.removeEventListener('visibilitychange', visible) }
}
