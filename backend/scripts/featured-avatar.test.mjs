import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import { build } from '../../node_modules/esbuild/lib/main.js'

const require = createRequire(import.meta.url)
const express = require('express')
const helmet = require('helmet')
const photo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64')
const prisma = { user: { findUnique: async () => ({ avatarUrl: `data:image/png;base64,${photo.toString('base64')}`, googleAvatarUrl: null }) }, review: { findMany: async () => [] } }
const bundle = await build({
  entryPoints: ['backend/src/routes/reviews.routes.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  plugins: [{ name: 'test-dependencies', setup(builder) {
    builder.onResolve({ filter: /\/lib\/prisma\.js$/ }, () => ({ path: 'prisma', namespace: 'test' }))
    builder.onResolve({ filter: /\/middleware\/(auth|owner)\.js$/ }, () => ({ path: 'auth', namespace: 'test' }))
    builder.onLoad({ filter: /.*/, namespace: 'test' }, ({ path }) => ({ contents: path === 'prisma' ? 'export const prisma = globalThis.prisma' : 'export const requireAuth = (_req, _res, next) => next(); export const requireOwner = requireAuth' }))
  } }],
})
const module = { exports: {} }
vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require, prisma, Buffer, URL, AbortSignal, fetch })
const app = express()
app.use(helmet())
app.use('/reviews', module.exports.default)
const server = app.listen(0, '127.0.0.1')
await new Promise(resolve => server.once('listening', resolve))
const base = `http://127.0.0.1:${server.address().port}/reviews`
try {
  const response = await fetch(`${base}/featured-avatar/featured-azizbek`, { headers: { Origin: 'https://www.profai.uz' } })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin', 'Public avatar can load from the separately hosted frontend')
  assert.equal(response.headers.get('content-type'), 'image/png')
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), photo)
  assert.equal((await fetch(`${base}/featured-avatar/unknown-account`)).status, 404)
  const other = await fetch(base)
  assert.equal(other.status, 200)
  assert.equal(other.headers.get('cross-origin-resource-policy'), 'same-origin', 'Other endpoints retain Helmet policy')
  console.log('PASS: public testimonial avatar bytes, image type, cross-origin embedding, unknown ID and unchanged policy elsewhere')
} finally { await new Promise(resolve => server.close(resolve)) }
