import assert from 'node:assert/strict'
import { build } from 'esbuild'
import vm from 'node:vm'

const bundle = await build({ stdin: { contents: `export * from './src/utils/accountStorage'; export * from './src/store/authStore'`, resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' } })
function storage() {
  const data = new Map()
  const state = { blocked: false, reject: () => false }
  return {
    state,
    get length() { if (state.blocked) throw Error('Storage blocked'); return data.size },
    key: index => [...data.keys()][index] ?? null,
    getItem: key => { if (state.blocked) throw Error('Storage blocked'); return data.get(key) ?? null },
    setItem: (key, value) => { if (state.blocked || state.reject(key)) throw Error('Storage quota exceeded'); data.set(key, value) },
    removeItem: key => { if (state.blocked) throw Error('Storage blocked'); data.delete(key) },
  }
}
function device(localStorage, sessionStorage) {
  const module = { exports: {} }
  vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, console, Event, window: { localStorage, sessionStorage, dispatchEvent() {}, addEventListener() {} } })
  return module.exports
}
const login = (client, id = 'alice') => client.useAuthStore.getState().setSession({ user: { id, role: 'USER' }, accessToken: `${id}-access`, refreshToken: `${id}-refresh` })
const local = storage(), session = storage()
let client = device(local, session)
login(client)
client.accountStorage.setItem('answer', 'old')
client.applyAccountData('alice', 'answer', 'old', client.getAccountMutations('alice').get('answer'))

// The metadata write can succeed while the cache write runs out of quota.
local.state.reject = key => key.startsWith('profai:account-data:')
client.accountStorage.setItem('answer', 'new')
assert.equal(client.accountStorage.getItem('answer'), 'new')
assert.equal(client.getAccountMutations('alice').get('answer').base, 'old')
assert.equal(client.getAccountMutations('alice').get('answer').value, 'new')
client = device(local, session)
login(client)
assert.equal(client.accountStorage.getItem('answer'), 'new', 'Quota fallback survives a reload')
assert.equal(client.applyAccountData('alice', 'answer', 'stale-server-copy'), false)
assert.equal(client.accountStorage.getItem('answer'), 'new', 'A cloud download cannot erase unacknowledged answers')
const mutation = client.getAccountMutations('alice').get('answer')
client.applyAccountData('alice', 'answer', 'new', mutation)
assert.equal(client.getAccountMutations('alice').has('answer'), false)
client = device(local, session)
login(client)
assert.equal(client.accountStorage.getItem('answer'), 'new')
assert.equal(client.getAccountMutations('alice').has('answer'), false, 'Acknowledged overflow is not requeued on reload')
local.state.reject = () => false
const otherTab = device(local, storage())
login(otherTab)
otherTab.accountStorage.setItem('answer', 'other-tab-latest')
assert.equal(client.getAccountMutations('alice').get('answer').value, 'other-tab-latest', 'A clean overflow cache cannot mask a newer edit from another tab')
assert.equal(client.accountStorage.getItem('answer'), 'other-tab-latest')

local.state.blocked = true
client.accountStorage.setItem('offline', 'still-retained')
client = device(local, session)
login(client)
assert.equal(client.accountStorage.getItem('offline'), 'still-retained', 'Blocked local storage still uses the independent session backup')
assert.equal(client.getAccountMutations('alice').get('offline').value, 'still-retained')
session.state.blocked = true
client.accountStorage.setItem('memory-only', 'submitted-answer')
assert.equal(client.accountStorage.getItem('memory-only'), 'submitted-answer')
assert.equal(client.getAccountMutations('alice').get('memory-only').value, 'submitted-answer', 'Both blocked stores retain the live upload queue')
login(client, 'bob')
assert.equal(client.accountStorage.getItem('memory-only'), null)
login(client)
client.accountStorage.removeItem('memory-only')
assert.equal(client.accountStorage.getItem('memory-only'), null, 'Memory fallback preserves deletion tombstones')
assert.equal(client.getAccountMutations('alice').get('memory-only').value, null)
client.forgetAccountStorage('alice')
assert.equal(client.accountStorage.getItem('offline'), null)
assert.equal(client.getAccountMutations('alice').size, 0, 'Deleted accounts cannot be restored from overflow')
console.log('PASS: partial quota writes, reload, blocked reads, both stores unavailable, pending upload protection, acknowledgements, account isolation and deletion')
