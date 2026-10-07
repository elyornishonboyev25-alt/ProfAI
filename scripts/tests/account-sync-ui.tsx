import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { useAccountDataSync } from '../../src/hooks/useAccountDataSync'
import { useAuthStore } from '../../src/store/authStore'
import { apiClient } from '../../src/lib/apiClient'
import { accountStorage, accountStorageFor } from '../../src/utils/accountStorage'
import { mergeAccountData } from '../../backend/src/services/accountDataMerge'
import type { AuthUser } from '../../src/types/platform'

export async function run() {
  const server = new Map<string, string | null>([['alice:history', '[{"id":"alice-remote"}]'], ['bob:history', '[{"id":"bob-remote"}]']])
  apiClient.put = (async (_path, body, options) => {
    const { key, base, value } = body as { key: string; base: string | null; value: string | null }
    const slot = `${options?.expectedUserId}:${key}`
    const merged = mergeAccountData(server.get(slot) ?? null, base, value)
    server.set(slot, merged)
    return { key, value: merged }
  }) as typeof apiClient.put
  let release: ((value: { entries: { key: string; value: string | null }[] }) => void) | undefined
  let delayAlice = false
  apiClient.get = (async (_path, options) => {
    const owner = options?.expectedUserId
    if (owner === 'alice' && delayAlice) return new Promise((resolve) => { release = resolve })
    return { entries: [...server].filter(([slot]) => slot.startsWith(`${owner}:`)).map(([slot, value]) => ({ key: slot.slice(String(owner).length + 1), value })) }
  }) as typeof apiClient.get
  function Display({ owner }: { owner: string }) {
    const { ready, revision } = useAccountDataSync(owner)
    return <div>{ready ? `${owner}:${revision}:${accountStorageFor(owner).getItem('history')}` : 'loading'}</div>
  }
  const root = createRoot(document.getElementById('root')!)
  const login = (id: string) => useAuthStore.setState({ user: { id } as AuthUser })
  login('alice')
  await act(async () => { root.render(<Display owner="alice" />) })
  assert.match(document.body.textContent!, /alice-remote/)
  // Switching accounts while a previous download is pending must not apply it.
  await act(async () => { root.render(<Display owner="bob" />); login('bob') })
  assert.match(document.body.textContent!, /bob-remote/)
  assert.doesNotMatch(document.body.textContent!, /alice-remote/)
  delayAlice = true
  await act(async () => { login('alice'); root.render(<Display owner="alice" />) })
  assert.ok(release)
  await act(async () => { login('bob'); root.render(<Display owner="bob" />) })
  await act(async () => { release!({ entries: [{ key: 'history', value: '[{"id":"late-private"}]' }] }) })
  assert.doesNotMatch(accountStorageFor('alice').getItem('history')!, /late-private/)
  assert.match(document.body.textContent!, /bob-remote/)
  accountStorage.setItem('history', '[{"id":"bob-remote"},{"id":"bob-offline"}]')
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 1600)) })
  assert.match(server.get('bob:history')!, /bob-offline/, 'Changes are uploaded through the actual sync hook')
  await act(async () => { root.unmount() })
  console.log('Account sync UI: server hydration, account switching, stale downloads and debounced upload passed.')
}
