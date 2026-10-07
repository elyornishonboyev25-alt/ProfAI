import assert from 'node:assert/strict'
import { build } from 'esbuild'
import vm from 'node:vm'

const bundle = await build({
  stdin: { contents: `
    export * from './src/utils/accountStorage'
    export * from './src/utils/readingAnalysisStorage'
    export * from './src/utils/writingAnalysisStorage'
    export * from './src/utils/resultsReviewState'
    export * from './src/features/sat/attemptStorage'
    export * from './src/store/authStore'
    export * from './src/store/speakingStore'
    export * from './src/utils/localProfilePerformance'
    export * from './backend/src/services/accountDataMerge'
  `, resolveDir: process.cwd() },
  loader: { '.png': 'dataurl', '.jpg': 'dataurl' },
  bundle: true, write: false, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.json',
  define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
})
function device() {
  const values = new Map()
  const storage = {
    get length() { return values.size },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  const module = { exports: {} }
  const window = { localStorage: storage, sessionStorage: storage, addEventListener() {}, dispatchEvent() {} }
  vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, console, window, Event })
  return { ...module.exports, storage }
}
const login = (client, id) => client.useAuthStore.getState().setSession({ user: { id, role: 'USER' }, accessToken: `${id}-access`, refreshToken: `${id}-refresh` })
const a = device(), b = device()
login(a, 'alice')
a.storage.setItem('profai:sat:attempt-history:v1', JSON.stringify([{ id: 'unowned', attempt: { testId: 'test' }, savedAt: 1 }]))
assert.equal(a.loadSATAttemptHistory().length, 0, 'Legacy shared device history is quarantined')
a.accountStorage.setItem('history', JSON.stringify([{ id: 'alice-1', score: 8 }]))
a.saveReviewState('test', { result: { testId: 'test', answers: { q: 'private' } }, test: { id: 'test' } })
login(a, 'bob')
assert.equal(a.accountStorage.getItem('history'), null)
assert.equal(a.loadReviewState('test'), null)
a.accountStorage.setItem('history', JSON.stringify([{ id: 'bob-1', score: 6 }]))
login(a, 'alice')
assert.equal(JSON.parse(a.accountStorage.getItem('history'))[0].id, 'alice-1')
assert.equal(a.loadReviewState('test').result.answers.q, 'private')
// Only explicitly owned pre-existing histories may migrate.
a.storage.setItem('smarttest-reading-analysis-history-v1:alice', JSON.stringify([{ attemptKey: 'reading-owned' }]))
a.storage.setItem('smarttest-reading-analysis-history-v1:guest', JSON.stringify([{ attemptKey: 'guest-secret' }]))
assert.equal(a.getReadingAnalysisHistory('alice')[0].attemptKey, 'reading-owned')
assert.equal(a.getReadingAnalysisHistory('bob').length, 0)

a.accountStorageFor('alice').removeItem('smarttest-reading-analysis-history-v1:alice')
assert.equal(a.getReadingAnalysisHistory('alice').length, 0, 'Deleted histories must not be imported again from legacy keys')
const removal = a.getAccountMutations('alice').get('smarttest-reading-analysis-history-v1:alice')
a.applyAccountData('alice', 'smarttest-reading-analysis-history-v1:alice', null, removal)
assert.equal(a.getReadingAnalysisHistory('alice').length, 0, 'A cloud tombstone prevents legacy resurrection after acknowledgment')

a.accountStorageFor('guest').setItem('smarttest-writing-analysis-v1:guest', JSON.stringify([{ attemptKey: 'guest-writing', savedAt: '2026-10-07', overallBand: 7 }]))
a.accountStorageFor('guest').setItem('smarttest-activity-log-v2:device', JSON.stringify({ '2026-10-07': { reading: 99 } }))
a.useSpeakingStore.setState({ sessions: [{ id: 'guest-speaking', userId: null, overallBand: 8 }] })
assert.equal(a.getLocalDashboardAttempts('alice').length, 0, 'Guest reading, writing, speaking and device histories are excluded from account dashboards')
assert.equal(Object.keys(a.getCombinedActivityLog('alice')).length, 0, 'Guest study activity cannot inflate account statistics')

// Simulate the authenticated server transport, using its actual merge routine.
const server = new Map()
function upload(client, owner) {
  for (const [key, mutation] of client.getAccountMutations(owner)) {
    const slot = `${owner}:${key}`
    const value = a.mergeAccountData(server.get(slot) ?? null, mutation.base, mutation.value)
    server.set(slot, value)
    client.applyAccountData(owner, key, value, mutation)
  }
}
function download(client, owner) {
  for (const [slot, value] of server) {
    if (slot.startsWith(`${owner}:`)) client.applyAccountData(owner, slot.slice(owner.length + 1), value)
  }
}
upload(a, 'alice')
login(b, 'alice')
download(b, 'alice')
assert.equal(b.accountStorage.getItem('history'), a.accountStorage.getItem('history'), 'A second device restores the same account history')
login(b, 'bob')
download(b, 'bob')
assert.equal(b.accountStorage.getItem('history'), null, 'The server account namespace does not expose Alice to Bob')
login(b, 'alice')
// Both devices add different attempts before either sees the other change.
a.accountStorage.setItem('history', JSON.stringify([{ id: 'alice-1', score: 8 }, { id: 'alice-2', score: 7 }]))
b.accountStorage.setItem('history', JSON.stringify([{ id: 'alice-1', score: 8 }, { id: 'alice-3', score: 9 }]))
upload(a, 'alice'); upload(b, 'alice'); download(a, 'alice')
assert.deepEqual(JSON.parse(a.accountStorage.getItem('history')).map((entry) => entry.id).sort(), ['alice-1', 'alice-2', 'alice-3'])
// Explicit deletion removes one attempt without erasing another device's additions.
b.accountStorage.setItem('history', JSON.stringify(JSON.parse(b.accountStorage.getItem('history')).filter((entry) => entry.id !== 'alice-1')))
upload(b, 'alice'); download(a, 'alice')
assert.deepEqual(JSON.parse(a.accountStorage.getItem('history')).map((entry) => entry.id).sort(), ['alice-2', 'alice-3'])
const merged = JSON.parse(a.mergeAccountData('{"reading":1,"writing":2}', '{"reading":1}', '{"reading":3}'))
assert.deepEqual(merged, { reading: 3, writing: 2 })
// A pending write stays account-scoped even after logging out and restarting.
a.accountStorage.setItem('offline', 'saved')
const dirty = a.getAccountMutations('alice').get('offline')
a.useAuthStore.getState().clearSession()
assert.equal(a.accountStorage.getItem('offline'), null)
assert.equal(a.applyAccountData('alice', 'offline', 'older'), false)
assert.equal(a.accountStorageFor('alice').getItem('offline'), 'saved')
a.applyAccountData('alice', 'offline', 'saved', dirty)
assert.equal(a.getAccountMutations('alice').has('offline'), false)
console.log('Account isolation, safe migration, review privacy, cross-device restore, concurrent additions/deletions and offline ownership passed.')
