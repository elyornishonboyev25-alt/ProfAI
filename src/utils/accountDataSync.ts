import { apiClient, ApiError } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { applyAccountData, getAccountMutations, type AccountMutation } from './accountStorage'

type Entry = { key: string; value: string | null }
export type AccountSyncFailures = Map<string, { mutation: AccountMutation; retryAt: number }>

function canUpload(key: string, mutation: AccountMutation) {
  // Match the API's limits, including JSON escaping and UTF-8 bytes. Keep
  // oversized records locally; they must not block small answer backups.
  if (!key.length || key.length > 300 || (mutation.base?.length ?? 0) > 3_000_000 || (mutation.value?.length ?? 0) > 3_000_000) return false
  return new TextEncoder().encode(JSON.stringify({ key, ...mutation })).byteLength <= 6 * 1024 * 1024
}

export async function syncAccountData(owner: string, options: {
  signal?: AbortSignal
  isCurrent?: () => boolean
  failures?: AccountSyncFailures
} = {}) {
  const { signal, failures = new Map() } = options
  const isCurrent = () => !signal?.aborted && useAuthStore.getState().user?.id === owner && (options.isCurrent?.() ?? true)
  let changed = false
  if (!isCurrent()) return changed
  const mutations = [...getAccountMutations(owner)].sort(([a], [b]) => Number(b.startsWith('smarttest-completed-')) - Number(a.startsWith('smarttest-completed-')))
  const defer = (key: string, mutation: AccountMutation, delay: number) => failures.set(key, { mutation, retryAt: Date.now() + delay })
  for (const [key, mutation] of mutations) {
    if (!isCurrent()) return changed
    const failed = failures.get(key)
    if (failed && failed.retryAt > Date.now() && failed.mutation.base === mutation.base && failed.mutation.value === mutation.value) continue
    if (!canUpload(key, mutation)) { defer(key, mutation, 300_000); continue }
    try {
      const entry = await apiClient.put<Entry>('/account-data', { key, ...mutation }, { expectedUserId: owner, signal })
      if (!isCurrent()) return changed
      // A malformed response must not acknowledge or erase submitted answers.
      if (entry.key !== key || !(entry.value === null || typeof entry.value === 'string')) throw new ApiError('Invalid account data response', 502)
      changed = applyAccountData(owner, entry.key, entry.value, mutation) || changed
      failures.delete(key)
    } catch (error) {
      if (!isCurrent()) return changed
      const invalid = error instanceof ApiError && [400, 413, 422].includes(error.status)
      defer(key, mutation, invalid ? 300_000 : 30_000)
      // Validation/server errors are isolated to this record. A transport or
      // authentication failure ends uploads, retaining every pending mutation.
      if (!(error instanceof ApiError) || [401, 403, 429].includes(error.status)) break
    }
  }
  if (!isCurrent()) return changed
  try {
    const { entries } = await apiClient.get<{ entries: Entry[] }>('/account-data', { expectedUserId: owner, signal })
    if (!isCurrent()) return changed
    for (const entry of entries) {
      if (typeof entry.key !== 'string' || !(entry.value === null || typeof entry.value === 'string')) continue
      changed = applyAccountData(owner, entry.key, entry.value) || changed
    }
  } catch { /* Download failures leave local answers and upload acknowledgements intact. */ }
  return changed
}
