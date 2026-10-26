import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildWebRelease, selectReleaseBuild } from '../build-web-release.mjs'

const env = {
  RAILWAY_GIT_COMMIT_SHA: 'a'.repeat(40), RAILWAY_GIT_BRANCH: 'main',
  RAILWAY_GIT_REPO_OWNER: 'elyornishonboyev25-alt', RAILWAY_GIT_REPO_NAME: 'ProfAI', npm_execpath: '/npm-cli.js',
}
const passed = {
  id: 42, head_sha: env.RAILWAY_GIT_COMMIT_SHA, head_branch: 'main', event: 'push',
  path: '.github/workflows/ci.yml', status: 'completed', conclusion: 'success',
  repository: { full_name: 'elyornishonboyev25-alt/ProfAI' }, head_repository: { full_name: 'elyornishonboyev25-alt/ProfAI' },
}
const response = (...workflow_runs) => async () => new Response(JSON.stringify({ workflow_runs }))

test('only a successful push workflow for the exact commit can reuse checks', async () => {
  const plan = await selectReleaseBuild(env, async (url, options) => {
    assert.equal(url.origin, 'https://api.github.com')
    assert.equal(url.searchParams.get('head_sha'), env.RAILWAY_GIT_COMMIT_SHA)
    assert.equal(url.searchParams.get('branch'), 'main')
    assert.equal(url.searchParams.get('event'), 'push')
    assert.equal(options.headers.Authorization, undefined, 'No account token is sent')
    assert.ok(options.signal)
    return response(passed)()
  })
  assert.equal(plan.script, 'build:bundle')
})

test('missing, invalid and foreign deployment metadata use the full build without a network call', async () => {
  for (const input of [{}, { ...env, RAILWAY_GIT_COMMIT_SHA: 'abc' }, { ...env, RAILWAY_GIT_BRANCH: '' }, { ...env, RAILWAY_GIT_REPO_OWNER: 'another-owner' }]) {
    assert.equal((await selectReleaseBuild(input, () => assert.fail('Unexpected network request'))).script, 'build')
  }
})

test('pending, failed, cancelled, skipped and unrelated results never skip checks', async () => {
  for (const overrides of [
    { status: 'in_progress', conclusion: null }, { status: 'queued', conclusion: null },
    { conclusion: 'failure' }, { conclusion: 'cancelled' }, { conclusion: 'skipped' }, { conclusion: 'neutral' },
    { head_sha: 'b'.repeat(40) }, { head_branch: 'develop' }, { event: 'pull_request' }, { path: '.github/workflows/other.yml' },
    { repository: { full_name: 'someone/ProfAI' } }, { head_repository: { full_name: 'someone/ProfAI' } },
  ]) {
    assert.equal((await selectReleaseBuild(env, response({ ...passed, ...overrides }))).script, 'build', JSON.stringify(overrides))
  }
})

test('an older successful run cannot mask a newer failed or unfinished run', async () => {
  for (const newer of [{ conclusion: 'failure' }, { status: 'in_progress', conclusion: null }]) {
    assert.equal((await selectReleaseBuild(env, response(passed, { ...passed, id: 43, ...newer }))).script, 'build')
  }
})

test('network, rate-limit and malformed API failures fall back to the original build', async () => {
  for (const status of [403, 404, 429, 500]) {
    assert.equal((await selectReleaseBuild(env, async () => new Response('{}', { status }))).script, 'build')
  }
  for (const body of [{}, { workflow_runs: [] }, { workflow_runs: [null] }]) {
    assert.equal((await selectReleaseBuild(env, async () => new Response(JSON.stringify(body)))).script, 'build')
  }
  assert.equal((await selectReleaseBuild(env, async () => { throw new Error('Timed out') })).script, 'build')
  assert.equal((await selectReleaseBuild(env, async () => new Response('invalid json'))).script, 'build')
})

test('the runner executes only its selected npm command and propagates build failures', async () => {
  let command
  await buildWebRelease(env, response(passed), (executable, args, options) => {
    command = args
    assert.equal(executable, process.execPath)
    assert.equal(options.stdio, 'inherit')
    return { status: 0 }
  })
  assert.deepEqual(command, ['/npm-cli.js', 'run', 'build:bundle'])
  await assert.rejects(buildWebRelease(env, response(passed), () => ({ status: 1 })), /failed/)
  await assert.rejects(buildWebRelease(env, response(passed), () => ({ status: null, signal: 'SIGTERM' })), /SIGTERM/)
  await assert.rejects(buildWebRelease(env, response(passed), () => ({ error: new Error('Cannot start npm') })), /Cannot start npm/)
})
