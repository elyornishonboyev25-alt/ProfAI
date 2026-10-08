import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import { build } from '../../node_modules/esbuild/lib/main.js'
const require = createRequire(import.meta.url)
const express = require('express')
const jwt = require('jsonwebtoken')
const secret = 'account-data-regression-test-secret'
const entries = new Map()
let lock = Promise.resolve()
const data = {
  findMany: async ({ where }) => [...entries.values()].filter((entry) => entry.userId === where.userId),
  findUnique: async ({ where }) => entries.get(`${where.userId_key.userId}:${where.userId_key.key}`) ?? null,
  upsert: async ({ where, create, update }) => {
    const key = `${where.userId_key.userId}:${where.userId_key.key}`
    const entry = entries.has(key) ? { ...entries.get(key), ...update } : create
    entries.set(key, entry)
    return entry
  },
}
const prisma = {
  user: { findUnique: async ({ where }) => ({ id: where.id, role: "USER" }) },
  accountLearningData: data,
  $transaction: (run) => {
    const next = lock.then(() => run({ accountLearningData: data, $queryRaw: async () => [] }))
    lock = next.catch(() => {})
    return next
  },
}
const bundled = await build({
  entryPoints: ['backend/src/routes/accountData.routes.ts'], bundle: true, write: false, platform: 'node', format: 'cjs',
  packages: 'external',
  plugins: [{ name: 'test-database', setup(builder) {
    builder.onResolve({ filter: /\/lib\/prisma\.js$/ }, () => ({ path: 'test-prisma', namespace: 'test' }))
    builder.onResolve({ filter: /\/config\/env\.js$/ }, () => ({ path: 'test-env', namespace: 'test' }))
    builder.onLoad({ filter: /.*/, namespace: 'test' }, ({ path }) => ({ contents: path === 'test-prisma'
      ? 'export const prisma = globalThis.prisma'
      : `export const env = { ACCESS_TOKEN_SECRET: ${JSON.stringify(secret)} }` }))
  } }],
})
const module = { exports: {} }
vm.runInNewContext(bundled.outputFiles[0].text, { module, exports: module.exports, require, prisma, console })
const app = express()
app.use(express.json())
app.use('/account-data', module.exports.default)
app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }))
const server = app.listen(0, '127.0.0.1')
await new Promise((resolve) => server.once('listening', resolve))
const url = `http://127.0.0.1:${server.address().port}/account-data`
const token = (owner) => jwt.sign({ sub: owner, role: 'USER' }, secret)
async function call(owner, method = 'GET', body) {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(owner ? { Authorization: `Bearer ${token(owner)}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: response.status, body: await response.json() }
}
try {
  assert.equal((await call(null)).status, 401)
  const value = JSON.stringify([{ id: 'alice-1', answer: 'private' }])
  assert.equal((await call('alice', 'PUT', { key: 'history', base: null, value })).status, 200)
  assert.equal((await call('bob')).body.entries.length, 0, 'Bob cannot read Alice records')
  const forged = await call('bob', 'PUT', { userId: 'alice', key: 'history', base: null, value: 'forged' })
  assert.equal(forged.status, 400, 'Owner is derived from the authenticated token, never the body')
  assert.equal((await call('alice')).body.entries[0].value, value)
  await Promise.all([
    call('alice', 'PUT', { key: 'history', base: value, value: JSON.stringify([{ id: 'alice-1', answer: 'private' }, { id: 'device-1' }]) }),
    call('alice', 'PUT', { key: 'history', base: value, value: JSON.stringify([{ id: 'alice-1', answer: 'private' }, { id: 'device-2' }]) }),
  ])
  const result = JSON.parse((await call('alice')).body.entries[0].value)
  assert.deepEqual(result.map((entry) => entry.id).sort(), ['alice-1', 'device-1', 'device-2'])
  await call('bob', 'PUT', { key: 'history', base: null, value: 'bob-only' })
  assert.equal((await call('bob')).body.entries[0].value, 'bob-only')
  assert.equal(JSON.parse((await call('alice')).body.entries[0].value).length, 3)
  await call('alice', 'PUT', { key: 'history', base: JSON.stringify(result), value: null })
  assert.equal((await call('alice')).body.entries[0].value, null, 'Deletion is retained as a tombstone for other devices')
  console.log('Authenticated account API: isolation, forged-owner rejection, two-device concurrent merge and deletion passed.')
} finally { await new Promise((resolve) => server.close(resolve)) }
