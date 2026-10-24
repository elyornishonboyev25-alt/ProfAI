import type { StateStorage } from 'zustand/middleware'

const retained = new Map<string, string | null>()
const backup = (name: string) => `profai:store-overflow:${name}`

/** Optional UI mirrors must never interrupt submission when storage fills up. */
export const resilientBrowserStorage: StateStorage = {
  getItem(name) {
    if (retained.has(name)) return retained.get(name) ?? null
    try {
      const saved = window.sessionStorage.getItem(backup(name))
      if (saved !== null) return JSON.parse(saved).value ?? null
    } catch { /* Try the primary store. */ }
    try { return window.localStorage.getItem(name) } catch { return null }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value)
      retained.delete(name)
      try { window.sessionStorage.removeItem(backup(name)) } catch { /* Optional backup. */ }
    } catch {
      retained.set(name, value)
      try { window.sessionStorage.setItem(backup(name), JSON.stringify({ value })) } catch { /* Keep the live store. */ }
    }
  },
  removeItem(name) {
    retained.set(name, null)
    try { window.localStorage.removeItem(name) } catch { /* Mirror remains cleared in memory. */ }
    try { window.sessionStorage.setItem(backup(name), JSON.stringify({ value: null })) } catch { /* Optional backup. */ }
  },
}
