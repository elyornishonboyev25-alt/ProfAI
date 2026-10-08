import { useAuthStore } from '@/store/authStore'

export const ACCOUNT_DATA_EVENT = 'profai:account-data-changed'
const prefix = (owner: string) => `profai:account-data:v1:${encodeURIComponent(owner)}:`
const knownPrefix = (owner: string) => `profai:account-known:v1:${encodeURIComponent(owner)}:`
const dirtyPrefix = (owner: string) => `profai:account-dirty:v1:${encodeURIComponent(owner)}:`
export type AccountMutation = { base: string | null; value: string | null }
const pending = new Map<string, Map<string, AccountMutation>>()
const deletedOwners = new Set<string>()

export function belongsToAccount(key: string, owner: string) {
  return key.startsWith(prefix(owner)) || key.startsWith(knownPrefix(owner)) ||
    key.startsWith(dirtyPrefix(owner)) || isOwnedLegacyKey(key, owner) ||
    key.split(':').includes(owner)
}

export function forgetAccountStorage(owner: string) {
  deletedOwners.add(owner)
  pending.delete(owner)
}

function isOwnedLegacyKey(key: string, owner: string) {
  const suffixKeys = [
    'smarttest-reading-analysis-history-', 'smarttest-writing-analysis-', 'smarttest-writing-xp-',
    'smarttest-onboarding-', 'smarttest-weekly-plan-', 'smarttest-activity-log-',
    'smarttest:ielts-exam-date:', 'smarttest:ielts-exam-time:', 'smarttest-site-time-',
    'smarttest:free-attempts:', 'profai-focus:', 'smarttest-speaking-completed-',
  ]
  return owner !== 'guest' && (
    suffixKeys.some((prefix) => key.startsWith(prefix) && key.endsWith(`:${owner}`)) ||
    ['reading', 'listening', 'sat-result', 'xp'].some((scope) => key.startsWith(`smarttest-${scope}-sync:${owner}:`)) ||
    key === `smarttest-speaking-completed-v1:${owner}:dates` ||
    key.startsWith(`profai:sat:question-bank:${owner}:`) || key.startsWith(`profai:writing:draft:${owner}:`)
  )
}

export function migrateOwnedAccountData(owner: string) {
  const storage = window.localStorage
  // Snapshot first: migration adds cache and dirty keys to the same storage.
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
  for (const key of keys) {
    if (key && isOwnedLegacyKey(key, owner)) accountStorageFor(owner).getItem(key)
  }
}

export function accountStorageFor(owner = useAuthStore.getState().user?.id ?? 'guest') {
  const storage = () => window.localStorage
  return {
    getItem(key: string): string | null {
      if (deletedOwners.has(owner)) return null
      const saved = storage().getItem(prefix(owner) + key)
      if (saved !== null || owner === 'guest' || storage().getItem(knownPrefix(owner) + key) === '1') return saved
      const ownedLegacy = isOwnedLegacyKey(key, owner)
      if (!ownedLegacy) return null
      const legacy = storage().getItem(key)
      if (legacy !== null) write(key, legacy)
      return legacy
    },
    setItem(key: string, value: string) { write(key, value) },
    removeItem(key: string) { write(key, null) },
  }
  function write(key: string, value: string | null) {
    if (deletedOwners.has(owner)) return
    // An async evaluation belonging to a signed-out account may not write into
    // the next account. Explicit owners retain their own offline cache only.
    const previous = storage().getItem(prefix(owner) + key)
    if (previous === value && (value !== null || storage().getItem(knownPrefix(owner) + key) === '1')) return
    const changes = getAccountMutations(owner)
    const mutation = { base: changes.has(key) ? changes.get(key)!.base : previous, value }
    changes.set(key, mutation)
    storage().setItem(knownPrefix(owner) + key, '1')
    storage().setItem(dirtyPrefix(owner) + key, JSON.stringify(mutation))
    if (value === null) storage().removeItem(prefix(owner) + key)
    else storage().setItem(prefix(owner) + key, value)
    window.dispatchEvent(new Event(ACCOUNT_DATA_EVENT))
  }
}

// Unowned legacy device data is deliberately never assigned to a login.
export const accountStorage = {
  getItem: (key: string) => accountStorageFor().getItem(key),
  setItem: (key: string, value: string) => accountStorageFor().setItem(key, value),
  removeItem: (key: string) => accountStorageFor().removeItem(key),
}

export function getAccountMutations(owner: string) {
  if (deletedOwners.has(owner)) return new Map<string, AccountMutation>()
  let changes = pending.get(owner)
  if (!changes) {
    changes = new Map()
    pending.set(owner, changes)
  }
  // Re-read dirty metadata: another tab can edit the shared cache while this
  // tab is downloading. Never replace those still-unsynced edits.
  const storage = window.localStorage
  const stored = new Set<string>()
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (!key?.startsWith(dirtyPrefix(owner))) continue
    const name = key.slice(dirtyPrefix(owner).length)
    try {
      const raw = storage.getItem(key)
      const mutation = JSON.parse(raw!) as AccountMutation
      if (!(mutation.value === null || typeof mutation.value === 'string') ||
          !(mutation.base === null || typeof mutation.base === 'string')) continue
      stored.add(name)
      if (JSON.stringify(changes.get(name)) !== raw) changes.set(name, mutation)
    } catch { /* Ignore damaged metadata. */ }
  }
  for (const name of changes.keys()) if (!stored.has(name)) changes.delete(name)
  return changes
}

export function applyAccountData(owner: string, key: string, value: string | null, acknowledged?: AccountMutation) {
  if (deletedOwners.has(owner)) return false
  const changes = getAccountMutations(owner)
  if (acknowledged && changes.get(key) === acknowledged) {
    changes.delete(key)
    window.localStorage.removeItem(dirtyPrefix(owner) + key)
  }
  if (changes.has(key)) return false
  const storage = window.localStorage
  storage.setItem(knownPrefix(owner) + key, '1')
  if (storage.getItem(prefix(owner) + key) === value) return false
  if (value === null) storage.removeItem(prefix(owner) + key)
  else storage.setItem(prefix(owner) + key, value)
  return true
}
