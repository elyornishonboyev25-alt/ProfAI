import { useAuthStore } from '@/store/authStore'

export const ACCOUNT_DATA_EVENT = 'profai:account-data-changed'
const prefix = (owner: string) => `profai:account-data:v1:${encodeURIComponent(owner)}:`
const knownPrefix = (owner: string) => `profai:account-known:v1:${encodeURIComponent(owner)}:`
const dirtyPrefix = (owner: string) => `profai:account-dirty:v1:${encodeURIComponent(owner)}:`
const overflowPrefix = (owner: string) => `profai:account-overflow:v1:${encodeURIComponent(owner)}:`
export type AccountMutation = { base: string | null; value: string | null }
type OverflowEntry = AccountMutation & { dirty: boolean }
const pending = new Map<string, Map<string, AccountMutation>>()
const overflow = new Map<string, Map<string, OverflowEntry>>()
const deletedOwners = new Set<string>()

function readLocal(key: string) {
  try { return window.localStorage.getItem(key) } catch { return null }
}

function storageKeys(type: 'localStorage' | 'sessionStorage'): string[] | null {
  try {
    const storage = window[type]
    return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => key !== null)
  } catch { return null }
}

function overflowFor(owner: string) {
  let entries = overflow.get(owner)
  if (!entries) { entries = new Map(); overflow.set(owner, entries) }
  return entries
}

function validMutation(value: unknown): value is AccountMutation {
  if (!value || typeof value !== 'object') return false
  const entry = value as AccountMutation
  return (entry.base === null || typeof entry.base === 'string') && (entry.value === null || typeof entry.value === 'string')
}

function readOverflow(owner: string, key: string) {
  const entries = overflowFor(owner)
  if (!entries.has(key)) {
    try {
      const entry = JSON.parse(window.sessionStorage.getItem(overflowPrefix(owner) + key) ?? 'null')
      if (validMutation(entry) && typeof (entry as OverflowEntry).dirty === 'boolean') entries.set(key, entry as OverflowEntry)
    } catch { /* Use the in-memory copy when either browser store is blocked. */ }
  }
  return entries.get(key)
}

function retainOverflow(owner: string, key: string, entry: OverflowEntry) {
  overflowFor(owner).set(key, entry)
  try { window.sessionStorage.setItem(overflowPrefix(owner) + key, JSON.stringify(entry)) } catch { /* The live attempt and sync queue retain their in-memory copy. */ }
}

function clearOverflow(owner: string, key: string) {
  overflowFor(owner).delete(key)
  try { window.sessionStorage.removeItem(overflowPrefix(owner) + key) } catch { /* Storage may be disabled. */ }
}

export function belongsToAccount(key: string, owner: string) {
  return key.startsWith(prefix(owner)) || key.startsWith(knownPrefix(owner)) ||
    key.startsWith(dirtyPrefix(owner)) || key.startsWith(overflowPrefix(owner)) || isOwnedLegacyKey(key, owner) ||
    key.split(':').includes(owner)
}

export function forgetAccountStorage(owner: string) {
  deletedOwners.add(owner)
  pending.delete(owner)
  overflow.delete(owner)
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
  // Snapshot first: migration adds cache and dirty keys to the same storage.
  const keys = storageKeys('localStorage') ?? []
  for (const key of keys) {
    if (key && isOwnedLegacyKey(key, owner)) accountStorageFor(owner).getItem(key)
  }
}

export function accountStorageFor(owner = useAuthStore.getState().user?.id ?? 'guest') {
  return {
    getItem(key: string): string | null {
      if (deletedOwners.has(owner)) return null
      const retained = readOverflow(owner, key)
      if (retained) return retained.value
      const saved = readLocal(prefix(owner) + key)
      if (saved !== null || owner === 'guest' || readLocal(knownPrefix(owner) + key) === '1') return saved
      const ownedLegacy = isOwnedLegacyKey(key, owner)
      if (!ownedLegacy) return null
      const legacy = readLocal(key)
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
    const retained = readOverflow(owner, key)
    const previous = retained ? retained.value : readLocal(prefix(owner) + key)
    if (previous === value && (value !== null || retained || readLocal(knownPrefix(owner) + key) === '1')) return
    const changes = getAccountMutations(owner)
    const mutation = { base: changes.has(key) ? changes.get(key)!.base : previous, value }
    changes.set(key, mutation)
    try {
      const storage = window.localStorage
      storage.setItem(dirtyPrefix(owner) + key, JSON.stringify(mutation))
      if (value === null) storage.removeItem(prefix(owner) + key)
      else storage.setItem(prefix(owner) + key, value)
      storage.setItem(knownPrefix(owner) + key, '1')
      clearOverflow(owner, key)
    } catch { retainOverflow(owner, key, { ...mutation, dirty: true }) }
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
  for (const key of storageKeys('sessionStorage') ?? []) {
    if (key.startsWith(overflowPrefix(owner))) readOverflow(owner, key.slice(overflowPrefix(owner).length))
  }
  const keys = storageKeys('localStorage')
  const stored = new Set<string>()
  for (const key of keys ?? []) {
    if (!key?.startsWith(dirtyPrefix(owner))) continue
    const name = key.slice(dirtyPrefix(owner).length)
    try {
      const retained = readOverflow(owner, name)
      if (retained?.dirty) continue
      if (retained) clearOverflow(owner, name)
      const raw = readLocal(key)
      const mutation = JSON.parse(raw!) as AccountMutation
      if (!validMutation(mutation)) continue
      stored.add(name)
      if (JSON.stringify(changes.get(name)) !== raw) changes.set(name, mutation)
    } catch { /* Ignore damaged metadata. */ }
  }
  for (const [name, entry] of overflowFor(owner)) {
    if (!entry.dirty) continue
    stored.add(name)
    const mutation = { base: entry.base, value: entry.value }
    if (JSON.stringify(changes.get(name)) !== JSON.stringify(mutation)) changes.set(name, mutation)
  }
  if (keys !== null) for (const name of changes.keys()) if (!stored.has(name)) changes.delete(name)
  return changes
}

export function applyAccountData(owner: string, key: string, value: string | null, acknowledged?: AccountMutation) {
  if (deletedOwners.has(owner)) return false
  const changes = getAccountMutations(owner)
  if (acknowledged && changes.get(key) === acknowledged) {
    changes.delete(key)
    try { window.localStorage.removeItem(dirtyPrefix(owner) + key) } catch { /* Replaying an acknowledged mutation is idempotent. */ }
    clearOverflow(owner, key)
  }
  if (changes.has(key)) return false
  const retained = readOverflow(owner, key)
  const changed = (retained ? retained.value : readLocal(prefix(owner) + key)) !== value
  try {
    const storage = window.localStorage
    if (value === null) storage.removeItem(prefix(owner) + key)
    else storage.setItem(prefix(owner) + key, value)
    storage.setItem(knownPrefix(owner) + key, '1')
    clearOverflow(owner, key)
  } catch { retainOverflow(owner, key, { base: value, value, dirty: false }) }
  return changed
}
