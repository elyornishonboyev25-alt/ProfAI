const KEY = 'profai-device-id-v1'
let fallback: string | undefined

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  // This identifier is a counting hint, never an authentication credential.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const value = Math.floor(Math.random() * 16)
    return (char === 'x' ? value : (value & 3) | 8).toString(16)
  })
}

/** A browser profile identifier, shared by tabs and kept across sign-outs. */
export function deviceIdentity(): string {
  if (typeof window === 'undefined') return ''
  try {
    const saved = window.localStorage.getItem(KEY)
    if (saved && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(saved)) return saved
    const id = createId()
    window.localStorage.setItem(KEY, id)
    return id
  } catch {
    fallback ??= createId()
    return fallback
  }
}
