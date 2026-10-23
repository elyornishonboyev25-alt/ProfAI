import { accountStorageFor } from './accountStorage'

// Keep the paper paired with its session across content changes in deployments.
export function readActiveTestPaper<T>(sessionKey: string, owner?: string): T | null {
  try {
    const storage = accountStorageFor(owner)
    if (!storage.getItem(sessionKey)) return null
    const raw = storage.getItem(`${sessionKey}:paper`)
    return raw ? JSON.parse(raw) as T : null
  } catch { return null }
}

export function saveActiveTestPaper(sessionKey: string, paper: unknown, owner?: string) {
  try { accountStorageFor(owner).setItem(`${sessionKey}:paper`, JSON.stringify(paper)) } catch { /* In-memory paper remains usable. */ }
}

export function clearActiveTestPaper(sessionKey: string, owner?: string) {
  try { accountStorageFor(owner).removeItem(`${sessionKey}:paper`) } catch { /* Optional cache. */ }
}
