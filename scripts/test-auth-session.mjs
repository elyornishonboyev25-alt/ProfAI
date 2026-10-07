import assert from 'node:assert/strict'
import { build } from 'esbuild'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'

async function main() {
  const bundle = await build({
    stdin: { contents: "export { apiClient } from './src/lib/apiClient'; export { useAuthStore } from './src/store/authStore'", resolveDir: process.cwd() },
    bundle: true, write: false, platform: 'node', format: 'cjs', tsconfig: 'tsconfig.json',
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
  })
  const values = new Map()
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  let lock = Promise.resolve()
  const navigator = { locks: { request: (_name, fn) => {
    const pending = lock.then(fn)
    lock = pending.catch(() => {})
    return pending
  } } }
  let fetchHandler
  function tab() {
    const module = { exports: {} }
    vm.runInNewContext(bundle.outputFiles[0].text, {
      module, exports: module.exports, console, Headers, Response, navigator,
      window: { localStorage, addEventListener() {} },
      fetch: (...args) => fetchHandler(...args),
    })
    return module.exports
  }
  const a = tab(), b = tab()
  const session = (suffix) => ({ user: { id: 'learner', role: 'USER' }, accessToken: `access-${suffix}`, refreshToken: `refresh-${suffix}` })
  const json = (status, body = {}) => new Response(JSON.stringify(body), { status })
  const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r }); return { promise, resolve } }
  const seed = () => { a.useAuthStore.getState().setSession(session('old')); b.useAuthStore.getState().setSession(session('old')) }

  seed()
  let rotations = 0
  const delayed = deferred()
  fetchHandler = async (url, options) => {
    if (url.endsWith('/auth/refresh')) { rotations++; return json(200, session('new')) }
    if (options.headers.get('Authorization') === 'Bearer access-new') return json(200, { ok: true })
    if (url.endsWith('/slow')) return delayed.promise
    return json(401)
  }
  const slow = a.apiClient.get('/slow')
  await a.apiClient.get('/fast')
  delayed.resolve(json(401))
  await slow
  assert.equal(rotations, 1, 'Delayed 401 reuses the already refreshed session')

  seed(); rotations = 0
  fetchHandler = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      rotations++
      assert.equal(JSON.parse(options.body).refreshToken, 'refresh-old')
      return json(200, session('new'))
    }
    return options.headers.get('Authorization') === 'Bearer access-new' ? json(200) : json(401)
  }
  await Promise.all([a.apiClient.get('/one'), a.apiClient.get('/two'), b.apiClient.get('/three')])
  assert.equal(rotations, 1, 'Concurrent requests across two tabs rotate only once')
  assert.equal(b.useAuthStore.getState().refreshToken, 'refresh-new')

  for (const status of [429, 500, 503]) {
    seed()
    fetchHandler = async (url) => json(url.endsWith('/auth/refresh') ? status : 401)
    await assert.rejects(a.apiClient.get('/protected'))
    assert.equal(a.useAuthStore.getState().refreshToken, 'refresh-old', `${status} preserves session`)
  }
  seed()
  fetchHandler = async (url) => { if (url.endsWith('/auth/refresh')) throw new Error('offline'); return json(401) }
  await assert.rejects(a.apiClient.get('/protected'))
  assert.equal(a.useAuthStore.getState().refreshToken, 'refresh-old')

  seed()
  fetchHandler = async (url) => url.endsWith('/auth/refresh') ? json(200, session('new')) : json(401)
  await assert.rejects(a.apiClient.get('/protected'))
  assert.equal(a.useAuthStore.getState().refreshToken, 'refresh-new', 'Second endpoint 401 cannot erase valid refresh')

  seed()
  fetchHandler = async () => json(401)
  await assert.rejects(a.apiClient.get('/protected'))
  assert.equal(a.useAuthStore.getState().refreshToken, null, 'Explicit invalid refresh ends session')

  for (const status of [200, 401]) {
    seed()
    const started = deferred(), response = deferred()
    fetchHandler = async (url) => {
      if (url.endsWith('/auth/refresh')) { started.resolve(); return response.promise }
      return json(401)
    }
    const pending = a.apiClient.get('/protected')
    await started.promise
    b.useAuthStore.getState().clearSession()
    response.resolve(json(status, session('new')))
    await assert.rejects(pending)
    assert.equal(a.useAuthStore.getState().refreshToken, null, 'In-flight refresh cannot undo logout in another tab')
  }

  // An old account's pending refresh must neither replace nor clear a new login.
  for (const status of [200, 401]) {
    seed()
    const started = deferred(), response = deferred()
    fetchHandler = async (url) => {
      if (url.endsWith('/auth/refresh')) { started.resolve(); return response.promise }
      return json(401)
    }
    const pending = a.apiClient.get('/protected')
    await started.promise
    b.useAuthStore.getState().setSession({ ...session('other'), user: { id: 'other', role: 'USER' } })
    response.resolve(json(status, session('new')))
    await assert.rejects(pending)
    assert.equal(a.useAuthStore.getState().user.id, 'other')
    assert.equal(a.useAuthStore.getState().refreshToken, 'refresh-other')
  }

  seed()
  const lateResult = deferred()
  fetchHandler = () => lateResult.promise
  const oldResult = a.apiClient.get('/account-results')
  a.useAuthStore.getState().setSession({ ...session('other'), user: { id: 'other', role: 'USER' } })
  lateResult.resolve(json(200, { privateResult: 'learner-only' }))
  await assert.rejects(oldResult, /Account changed/, 'A successful old response must not reach the new account')
  seed()
  const crossTabResult = deferred()
  fetchHandler = () => crossTabResult.promise
  const previousTabRequest = a.apiClient.get('/old-tab-results')
  b.useAuthStore.getState().setSession({ ...session('other'), user: { id: 'other', role: 'USER' } })
  crossTabResult.resolve(json(200, { privateResult: 'learner-only' }))
  await assert.rejects(previousTabRequest, /Account changed/, 'Another tab login invalidates old successful responses before storage events arrive')
  let sent = false
  fetchHandler = async () => { sent = true; return json(200) }
  await assert.rejects(a.apiClient.post('/results', { result: 'old' }, { expectedUserId: 'learner' }), /Account changed/)
  assert.equal(sent, false, 'A delayed mutation may not be sent using the next account token')

  // Worker activation must clean stale assets without navigating any open page.
  let activate
  let navigated = false
  const removed = []
  const caches = { keys: async () => ['profai-app-assets-old', 'unrelated'], delete: async (key) => removed.push(key) }
  vm.runInNewContext(await readFile('public/sw-cleanup.js', 'utf8'), {
    caches, self: { addEventListener: (_event, fn) => { activate = fn }, clients: { matchAll: async () => [{ navigate: () => { navigated = true } }] } },
  })
  let activation
  activate({ waitUntil: (promise) => { activation = promise } })
  await activation
  assert.deepEqual(removed, ['profai-app-assets-old'])
  assert.equal(navigated, false)
  console.log('Auth session regressions and non-disruptive service worker activation passed.')
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
