import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

test('API startup registers live features without generating paid voice audio', async () => {
  const fixtures = {
    http: `export default { createServer() { return { listen(port, callback) { boot.listen++; callback(); return { close(callback) { callback() } } } } } }`,
    './app.js': 'export const app = {}',
    './config/env.js': 'export const env = { PORT: 5001 }',
    './lib/prisma.js': 'export const prisma = { $disconnect: async () => {} }',
    './lib/startupHealth.js': 'export async function runStartupHealthChecks() { boot.health++ }',
    './realtime/speakingSignaling.js': 'export function attachSpeakingSignaling() { boot.speaking++ }',
    './services/telegram.service.js': 'export async function startTelegramBot() { boot.telegram++ }',
    './utils/jwt.js': 'export function verifyAccessToken() { return {} }',
    './services/authActivity.service.js': 'export async function acquireSessionUsage() {}',
    // Keep the old paid probe available in the fixture: invoking it must fail
    // this behavioral test even when no real provider credentials are present.
    './services/geminiLive.service.js': `export function attachGeminiVoice() { boot.voice++ }
      export async function probeGeminiLive() { boot.paidAudioRequests++ }`,
    './services/writingSubmission.service.js': 'export function startWritingAssessmentWorker() { boot.writing++ } export async function stopWritingAssessmentWorker() {}',
  }
  const result = await build({
    entryPoints: [fileURLToPath(new URL('../src/index.ts', import.meta.url))],
    bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: [{ name: 'startup-fixtures', setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => args.kind === 'entry-point' ? undefined : { path: args.path, namespace: 'fixture' })
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => {
        assert.ok(Object.hasOwn(fixtures, args.path), `Unexpected startup dependency: ${args.path}`)
        return { contents: fixtures[args.path], loader: 'js' }
      })
    } }],
  })
  const boot = { health: 0, listen: 0, speaking: 0, voice: 0, writing: 0, telegram: 0, paidAudioRequests: 0 }
  const signals = [], exits = []
  await vm.runInNewContext(result.outputFiles[0].text, {
    boot, console: { log() {}, error() {} },
    process: { on(signal) { signals.push(signal) }, exit(code) { exits.push(code) } },
  })
  assert.deepEqual(boot, { health: 1, listen: 1, speaking: 1, voice: 1, writing: 1, telegram: 1, paidAudioRequests: 0 })
  assert.deepEqual(signals.sort(), ['SIGINT', 'SIGTERM'])
  assert.deepEqual(exits, [])
})
