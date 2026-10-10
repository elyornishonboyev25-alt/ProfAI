import assert from 'node:assert/strict'
import vm from 'node:vm'
import { build } from 'esbuild'

let savedUser = null
let lookupError = null
let lookups = 0
let lastLookup = null
const prisma = {
  user: {
    async findUnique(query) {
      lookups++
      lastLookup = query
      assert.equal(query.where.id, 'signed-in-account')
      assert.equal(query.select.nickname, true)
      if (lookupError) throw lookupError
      return savedUser
    },
  },
}

const bundle = await build({
  stdin: {
    contents: `export { hasOwnerAccess } from './src/utils/ownerAccess'; export { requireOwner, canUseOwnerNickname } from './backend/src/middleware/owner';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  plugins: [{
    name: 'owner-test-database',
    setup(builder) {
      builder.onResolve({ filter: /lib\/prisma\.js$/ }, () => ({ path: 'prisma', namespace: 'owner-test' }))
      builder.onLoad({ filter: /.*/, namespace: 'owner-test' }, () => ({
        contents: 'export const prisma = globalThis.ownerTestPrisma',
        loader: 'js',
      }))
    },
  }],
})
const module = { exports: {} }
vm.runInNewContext(bundle.outputFiles[0].text, {
  module, exports: module.exports, ownerTestPrisma: prisma,
})
const { hasOwnerAccess, requireOwner, canUseOwnerNickname } = module.exports

async function authorize(user = { id: 'signed-in-account' }) {
  const result = { status: 200, body: null, headers: {}, nextCalled: false, error: null }
  const res = {
    status(value) { result.status = value; return this },
    json(value) { result.body = value; return this },
    setHeader(name, value) { result.headers[name] = value },
  }
  await requireOwner({ user }, res, error => {
    result.nextCalled = true
    result.error = error ?? null
  })
  return result
}

for (const [email, nickname, allowed] of [
  ['elyornishonboyev000@gmail.com', null, true],
  [' FIRDAVSALIMQULOV998@GMAIL.COM ', 'learner', true],
  ['learner@gmail.com', 'erkinov', true],
  ['learner@gmail.com', ' ERKINOV ', true],
  ['learner@gmail.com', 'erkinov7', false],
  ['learner@gmail.com', 'erkinov_other', false],
  ['learner@gmail.com', 'firdavs', false],
  ['erkinov@gmail.com', null, false],
  ['learner@gmail.com', '', false],
  ['learner@gmail.com', null, false],
]) {
  assert.equal(hasOwnerAccess(email, nickname), allowed, `Client access for ${email}/${nickname}`)
  savedUser = { email, nickname }
  const result = await authorize()
  assert.equal(lastLookup.select.email, true)
  assert.equal(result.nextCalled, allowed, `Server access for ${email}/${nickname}`)
  assert.equal(result.status, allowed ? 200 : 403)
  if (allowed) assert.equal(result.headers['Cache-Control'], 'no-store')
}

assert.equal(hasOwnerAccess(), false, 'A missing client identity has no owner access')
const beforeAnonymous = lookups
assert.equal((await authorize(null)).status, 401)
assert.equal(lookups, beforeAnonymous, 'Unauthenticated requests do not query the database')

savedUser = { email: 'learner@gmail.com', nickname: 'learner' }
assert.equal((await authorize({ id: 'signed-in-account', nickname: 'erkinov' })).status, 403,
  'A supplied nickname cannot override the saved account identity')
savedUser = null
assert.equal((await authorize()).status, 403, 'A missing saved account has no owner access')

for (const currentNickname of ['erkinov', ' ERKINOV ', 'learner', null]) {
  savedUser = { email: 'learner@gmail.com', nickname: currentNickname }
  assert.equal(await canUseOwnerNickname('signed-in-account', 'Erkinov'),
    currentNickname?.trim().toLowerCase() === 'erkinov',
    'Only the current holder can keep or change the case of the owner handle')
}
savedUser = null
assert.equal(await canUseOwnerNickname('signed-in-account', 'erkinov'), false,
  'An owner handle stays reserved after its account is deleted')
const beforeRegularNickname = lookups
assert.equal(await canUseOwnerNickname('signed-in-account', 'another_learner'), true)
assert.equal(lookups, beforeRegularNickname, 'Ordinary nickname changes keep their existing lookup flow')

lookupError = new Error('Database unavailable')
const failure = await authorize()
assert.equal(failure.error, lookupError, 'Database failures reach the error handler')
assert.equal(failure.headers['Cache-Control'], undefined)
console.log('Owner access: existing owners, @erkinov, denied lookalikes, authentication, saved identity and reserved owner handle checks passed.')
