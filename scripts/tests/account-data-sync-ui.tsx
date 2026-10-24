import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { apiClient, ApiError } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/types/platform'
import { accountStorageFor, getAccountMutations } from '@/utils/accountStorage'
import { syncAccountData, type AccountSyncFailures } from '@/utils/accountDataSync'
import { useAccountDataSync } from '@/hooks/useAccountDataSync'

export async function run() {
  const originalPut = apiClient.put, originalGet = apiClient.get
  const login = (id: string) => useAuthStore.setState({ user: { id, role: 'USER' } as AuthUser })
  const failures: AccountSyncFailures = new Map()
  const calls: string[] = []
  let rejectBad = true
  login('sync-owner')
  const store = accountStorageFor('sync-owner')
  store.setItem('invalid-first', 'retained-answer')
  store.setItem('following-result', 'answer-backup')
  apiClient.put = (async (_path, body) => {
    const entry = body as { key: string; value: string | null }
    calls.push(entry.key)
    if (rejectBad && entry.key === 'invalid-first') throw new ApiError('Invalid request body', 400)
    return entry
  }) as typeof apiClient.put
  apiClient.get = (async () => ({ entries: [{ key: 'remote-result', value: 'downloaded' }, { key: 'invalid-first', value: 'older-server-answer' }] })) as typeof apiClient.get
  try {
    await syncAccountData('sync-owner', { failures })
    assert.deepEqual(calls, ['invalid-first', 'following-result'], '400 does not block subsequent uploads')
    assert.equal(store.getItem('invalid-first'), 'retained-answer')
    assert.equal(store.getItem('remote-result'), 'downloaded', 'Download still runs after a rejected upload')
    assert.equal(getAccountMutations('sync-owner').has('following-result'), false)
    assert.equal(getAccountMutations('sync-owner').has('invalid-first'), true)
    calls.length = 0
    await syncAccountData('sync-owner', { failures })
    assert.equal(calls.length, 0, 'Unchanged rejected payloads are backed off, not sent on every autosave')
    rejectBad = false
    store.setItem('invalid-first', 'repaired-answer')
    await syncAccountData('sync-owner', { failures })
    assert.deepEqual(calls, ['invalid-first'], 'A changed payload retries without waiting for old validation backoff')
    assert.equal(getAccountMutations('sync-owner').has('invalid-first'), false)

    for (const status of [413, 500, 502]) {
      const owner = `server-${status}`
      login(owner)
      accountStorageFor(owner).setItem('bad-record', 'keep-this')
      accountStorageFor(owner).setItem('next-record', 'upload-this')
      apiClient.put = (async (_path, body) => {
        const entry = body as { key: string }
        if (entry.key === 'bad-record') {
          if (status === 502) return { key: 'wrong-response-key', value: null }
          throw new ApiError('Rejected record', status)
        }
        return body
      }) as typeof apiClient.put
      apiClient.get = (async () => ({ entries: [] })) as typeof apiClient.get
      await syncAccountData(owner)
      assert.ok(getAccountMutations(owner).has('bad-record'))
      assert.equal(getAccountMutations(owner).has('next-record'), false, `HTTP ${status} and malformed responses must not block independent records`)
    }

    login('large-owner')
    const large = accountStorageFor('large-owner')
    large.setItem('oversized-paper', 'x'.repeat(3_000_001))
    large.setItem('smarttest-completed-result:small', 'small-answers')
    calls.length = 0
    apiClient.put = (async (_path, body) => { calls.push((body as { key: string }).key); return body }) as typeof apiClient.put
    apiClient.get = (async () => ({ entries: [] })) as typeof apiClient.get
    await syncAccountData('large-owner', { failures: new Map() })
    assert.deepEqual(calls, ['smarttest-completed-result:small'], 'Oversized snapshots do not block compact results or trigger avoidable 400 responses')
    assert.ok(getAccountMutations('large-owner').has('oversized-paper'), 'Oversized data stays pending and locally recoverable')
    assert.equal(large.getItem('oversized-paper')?.length, 3_000_001)

    login('retry-owner')
    const retry = accountStorageFor('retry-owner')
    retry.setItem('retry-answer', 'saved')
    const retryFailures: AccountSyncFailures = new Map()
    let offline = true
    apiClient.put = (async (_path, body) => { if (offline) throw new Error('Offline'); return body }) as typeof apiClient.put
    await syncAccountData('retry-owner', { failures: retryFailures })
    assert.ok(getAccountMutations('retry-owner').has('retry-answer'))
    offline = false
    retryFailures.get('retry-answer')!.retryAt = 0
    await syncAccountData('retry-owner', { failures: retryFailures })
    assert.equal(getAccountMutations('retry-owner').size, 0, 'Offline upload retries acknowledge only successful submissions')

    login('inflight-owner')
    const inflight = accountStorageFor('inflight-owner')
    inflight.setItem('answer', 'before')
    apiClient.put = (async (_path, body) => {
      inflight.setItem('answer', 'latest-edit')
      return body
    }) as typeof apiClient.put
    await syncAccountData('inflight-owner')
    assert.equal(inflight.getItem('answer'), 'latest-edit')
    assert.equal(getAccountMutations('inflight-owner').get('answer')?.value, 'latest-edit', 'A stale response cannot acknowledge a newer answer')

    login('old-owner')
    const old = accountStorageFor('old-owner')
    old.setItem('answer', 'private')
    apiClient.put = (async (_path, body) => { login('new-owner'); return body }) as typeof apiClient.put
    await syncAccountData('old-owner')
    assert.ok(getAccountMutations('old-owner').has('answer'), 'An account change invalidates the response acknowledgement')
    assert.equal(accountStorageFor('new-owner').getItem('answer'), null)

    // Verify the actual React hook, including sustained autosaves and cleanup.
    localStorage.clear()
    window.sessionStorage.clear()
    login('hook-owner')
    const root = createRoot(document.getElementById('root')!)
    const timeout = window.setTimeout, clear = window.clearTimeout
    const scheduled = new Map<number, () => void>()
    let nextId = 100_000
    window.setTimeout = ((fn: () => void, ms: number) => {
      if (ms === 1500) { const id = ++nextId; scheduled.set(id, fn); return id }
      return timeout(fn, ms)
    }) as typeof window.setTimeout
    window.clearTimeout = id => { scheduled.delete(id); clear(id) }
    apiClient.put = (async (_path, body) => body) as typeof apiClient.put
    apiClient.get = (async () => ({ entries: [] })) as typeof apiClient.get
    function Probe() { useAccountDataSync('hook-owner'); return null }
    try {
      await act(async () => root.render(<Probe />))
      for (let i = 0; i < 5; i++) accountStorageFor('hook-owner').setItem('autosave', String(i))
      assert.equal(nextId, 100_001, 'Continuous autosaves keep the original upload deadline')
      await act(async () => { for (const fn of scheduled.values()) fn(); scheduled.clear() })
      assert.equal(getAccountMutations('hook-owner').size, 0)
      let requestSignal: AbortSignal | undefined
      let complete!: (value: unknown) => void
      apiClient.get = ((_path, options) => {
        requestSignal = options?.signal as AbortSignal
        return new Promise(resolve => { complete = resolve })
      }) as typeof apiClient.get
      await act(async () => { window.dispatchEvent(new Event('focus')); for (const fn of scheduled.values()) fn(); scheduled.clear() })
      assert.equal(requestSignal?.aborted, false)
      await act(async () => root.unmount())
      assert.equal(requestSignal?.aborted, true, 'Unmount cancels the in-flight request')
      await act(async () => complete({ entries: [{ key: 'after-unmount', value: 'must-not-apply' }] }))
      assert.equal(accountStorageFor('hook-owner').getItem('after-unmount'), null)
    } finally { window.setTimeout = timeout; window.clearTimeout = clear }
    console.log('PASS: rejected/oversized records, continued downloads, backoff, edited payload retry, offline recovery, in-flight edits, account changes, sustained autosaves and cancellation')
  } finally {
    apiClient.put = originalPut; apiClient.get = originalGet
    localStorage.clear(); window.sessionStorage.clear(); useAuthStore.setState({ user: null })
  }
}
