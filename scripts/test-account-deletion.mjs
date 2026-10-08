import assert from 'node:assert/strict'
import { build } from 'esbuild'
import vm from 'node:vm'

const bundle = await build({
  stdin: { contents: `
    export * from './src/utils/purgeAccountClientData'
    export * from './src/utils/accountStorage'
    export * from './src/utils/resultsReviewState'
    export * from './src/store/authStore'
    export * from './src/store/speakingStore'
    export * from './src/store/badgeStore'
    export * from './src/store/aiAssistantStore'
    export * from './src/store/speakerSocialStore'
    export * from './src/lib/apiClient'
  `, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.json',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
})
function storage() {
  const values = new Map()
  return {
    get length() { return values.size }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
}
const localStorage = storage()
const channels = []
class Channel {
  constructor(name) { this.name = name; channels.push(this) }
  postMessage(data) {
    for (const channel of channels) if (channel !== this && channel.name === this.name) channel.onmessage?.({ data })
  }
}
let refreshCalls = 0
let expiredAccess = false
function tab() {
  const sessionStorage = storage()
  const module = { exports: {} }
  const window = { localStorage, sessionStorage, addEventListener() {}, dispatchEvent() {} }
  vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, window, console,
    Event, CustomEvent: Event, BroadcastChannel: Channel, Headers, Response,
    fetch: async (url) => {
      if (url.endsWith('/auth/refresh')) refreshCalls++
      else if (expiredAccess) return new Response('{}', { status: 401 })
      return new Response(JSON.stringify({ message: 'Account deleted', code: 'ACCOUNT_DELETED' }), { status: 401 })
    },
  })
  return { ...module.exports, sessionStorage, window }
}
const login = (client, id) => client.useAuthStore.getState().setSession({ user: { id, role: 'USER', xp: 0 }, accessToken: id + '-access', refreshToken: id + '-refresh' })
const a = tab(), b = tab()
for (const client of [a, b]) {
  login(client, 'alice')
  client.useSpeakingStore.setState({ sessions: [{ id: 'alice-speaking', userId: 'alice' }, { id: 'bob-speaking', userId: 'bob' }] })
  client.useBadgeStore.setState({ records: [{ id: 'alice-badge', userId: 'alice' }, { id: 'bob-badge', userId: 'bob' }] })
  client.useAiAssistantStore.setState({
    threadsByOwner: { 'user:alice': [{ id: 'private-thread', messages: [{ status: 'sent' }] }], 'user:bob': [{ id: 'bob-thread', messages: [{ status: 'sent' }] }] },
    memoriesByOwner: { 'user:alice': [{ id: 'private-memory' }] },
  })
  client.saveReviewState('test', { result: { answers: { q: 'private' } }, test: { id: 'test' } })
}
a.useSpeakerSocialStore.setState({ nicknames: { alice: 'Learner', bob: 'Bob' },
  ratings: { alice: [{ id: 'received' }], bob: [{ id: 'sent', fromUserId: 'alice' }, { id: 'other', fromUserId: 'charlie' }] } })
const staleStorage = a.accountStorageFor('alice')
staleStorage.setItem('history', 'private')
a.accountStorageFor('bob').setItem('history', 'bob-private')
a.accountStorageFor('alice2').setItem('history', 'similar-id-private')
const staleMutation = a.getAccountMutations('alice').get('history')
localStorage.setItem('smarttest-reading-analysis-history-v1:alice', 'private')
localStorage.setItem('profai-guest-diagnostic-handoff-v1', 'private')
localStorage.setItem('profai:sat:attempt-history:v1', 'legacy-private')
localStorage.setItem('theme', 'dark')
a.useAuthStore.getState().clearSession()
a.purgeAccountClientData('alice')
assert.equal(b.useAuthStore.getState().user, null, 'Deletion signs out another open tab')
for (const client of [a, b]) {
  assert.equal(client.loadReviewState('test'), null)
  assert.equal(client.sessionStorage.getItem('smarttest-review-state:alice:test'), null, 'Review answers are physically removed from sessionStorage')
  assert.equal(client.useSpeakingStore.getState().sessions.some(row => row.userId === 'alice'), false)
  assert.equal(client.useBadgeStore.getState().records.some(row => row.userId === 'alice'), false)
  assert.equal(client.useAiAssistantStore.getState().threadsByOwner['user:alice'], undefined)
  assert.equal(client.useAiAssistantStore.getState().memoriesByOwner['user:alice'], undefined)
  assert.equal(client.useSpeakingStore.getState().sessions[0].userId, 'bob')
}
assert.equal(a.useSpeakerSocialStore.getState().ratings.bob.length, 1, 'Ratings authored by the deleted user are removed')
assert.equal(localStorage.getItem('smarttest-reading-analysis-history-v1:alice'), null)
assert.equal(localStorage.getItem('profai-guest-diagnostic-handoff-v1'), null)
assert.equal(localStorage.getItem('profai:sat:attempt-history:v1'), null)
assert.equal(localStorage.getItem('theme'), 'dark')
assert.equal(a.accountStorageFor('bob').getItem('history'), 'bob-private')
assert.equal(a.accountStorageFor('alice2').getItem('history'), 'similar-id-private', 'Matching account IDs is exact, not substring-based')
staleStorage.setItem('late-evaluation', 'resurrected')
assert.equal(staleStorage.getItem('late-evaluation'), null)
assert.equal(a.applyAccountData('alice', 'history', 'resurrected', staleMutation), false)
assert.equal(a.getAccountMutations('alice').size, 0)
login(a, 'fresh-account')
assert.equal(a.accountStorage.getItem('history'), null, 'A new account starts with no old history')
assert.equal(a.useAuthStore.getState().user.xp, 0)
// An API response from a deletion on a different device has the same cleanup
// behavior, without attempting to refresh a permanently deleted account.
login(a, 'remote-deleted')
a.accountStorage.setItem('history', 'remote-private')
await assert.rejects(a.apiClient.get('/dashboard'), error => error.code === 'ACCOUNT_DELETED')
assert.equal(a.useAuthStore.getState().user, null)
assert.equal(a.accountStorageFor('remote-deleted').getItem('history'), null)
assert.equal(refreshCalls, 0)
expiredAccess = true
login(a, 'remote-expired')
a.accountStorage.setItem('history', 'expired-private')
await assert.rejects(a.apiClient.get('/dashboard'))
assert.equal(refreshCalls, 1)
assert.equal(a.useAuthStore.getState().user, null, 'Deletion discovered through refresh also signs out')
assert.equal(a.accountStorageFor('remote-expired').getItem('history'), null)
Object.defineProperty(a.window, 'localStorage', { get() { throw new Error('Storage denied') } })
assert.doesNotThrow(() => a.purgeAccountClientData('storage-denied', false), 'Storage failures cannot interrupt permanent-deletion cleanup')
console.log('Client deletion: local/session data, multiple tabs, store cleanup, exact ownership, late-response protection, fresh account and remote deletion passed.')
