import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { resolve, relative, join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd(), reference = process.argv.includes('--ref') ? process.argv[process.argv.indexOf('--ref') + 1] : null
const revision = reference ? execFileSync('git', ['rev-parse', '--verify', reference], { encoding: 'utf8' }).trim() : 'working-tree'
const require = createRequire(import.meta.url)
const { JSDOM } = createRequire(new URL('../backend/package.json', import.meta.url))('jsdom')
const directory = await mkdtemp(join(tmpdir(), 'nova-regression-'))
const dom = new JSDOM('<div/>', { url: 'http://localhost:5173' })
try {
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.localStorage = dom.window.localStorage
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator })
  const source = `import {GeminiRealtimeCoach} from './src/lib/geminiRealtimeCoach'; import {defaultNovaPerformance} from './src/lib/novaPersona'; import {buildCoachPrompt,assistantContextSchema} from './backend/src/services/assistantPolicy'; import {voiceInstructions} from './backend/src/services/voiceInstructions'; export {GeminiRealtimeCoach,defaultNovaPerformance,buildCoachPrompt,assistantContextSchema,voiceInstructions};`
  const outfile = join(directory, 'probe.cjs')
  await build({ stdin: { contents: source, resolveDir: root, loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', outfile,
    tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}' }, loader: { '.css': 'empty' },
    plugins: reference ? [{ name: 'committed-baseline', setup(builder) {
      builder.onLoad({ filter: /\.[cm]?tsx?$/ }, async args => {
        const path = relative(root, args.path).replaceAll('\\', '/')
        if (path.startsWith('../') || path.includes('node_modules/')) return
        try { return { contents: execFileSync('git', ['show', `${revision}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }), loader: path.endsWith('tsx') ? 'tsx' : 'ts' } }
        catch { return { contents: await readFile(args.path, 'utf8'), loader: path.endsWith('tsx') ? 'tsx' : 'ts' } }
      })
    } }] : [],
  })
  const { GeminiRealtimeCoach, defaultNovaPerformance, buildCoachPrompt, assistantContextSchema, voiceInstructions } = require(outfile)
  const timers = [], messages = [], expressions = []
  window.setTimeout = (callback, milliseconds) => { timers.push({ callback, milliseconds }); return timers.length }
  window.clearTimeout = () => {}
  const options = { context: {}, history: [], state() {}, level() {}, caption() {}, message: (...value) => messages.push(value), expression: (...value) => expressions.push(value), coachResult() {}, error(error) { throw error } }
  const interrupted = new GeminiRealtimeCoach(options)
  interrupted.handle({ type: 'content', responseId: 'cut-off', content: { interrupted: true, inputTranscription: { text: 'No, I meant another example.', finished: true } } })
  const retainsCorrectionInInterruptionEnvelope = messages.some(row => row[0] === 'user' && row[1] === 'No, I meant another example.')
  messages.length = 0; expressions.length = 0; timers.length = 0
  const paused = new GeminiRealtimeCoach(options)
  paused.audio = { currentTime: 0, createBuffer: (_channels, samples, rate) => ({ duration: samples / rate, getChannelData: () => new Float32Array(samples) }),
    createBufferSource: () => ({ playbackRate: { value: 1 }, connect() {}, disconnect() {}, start() {}, stop() {} }) }
  paused.outputMeter = {}
  paused.handle({ type: 'expression', responseId: 'paused', performance: defaultNovaPerformance('warm') })
  paused.handle({ type: 'content', responseId: 'paused', content: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: Buffer.alloc(48000).toString('base64') } }] } } })
  for (const timer of timers.filter(timer => timer.milliseconds <= 1000)) timer.callback()
  const keepsFaceQueuedWhileAudioClockPaused = !expressions.some(([value]) => value !== null)
  paused.audio.currentTime = .03
  paused.expressions.advance?.(.03)
  const showsFaceWhenPlaybackBegins = expressions.some(([value]) => value?.expression === 'warm')
  const providerSource = reference ? execFileSync('git', ['show', `${revision}:backend/src/services/geminiLive.service.ts`], { encoding: 'utf8' }) : await readFile(resolve('backend/src/services/geminiLive.service.ts'), 'utf8')
  const coachingSilenceMs = Number(/silenceDurationMs: context.mode === 'examiner' \? 1400 : (\d+)/.exec(providerSource)?.[1])
  const context = assistantContextSchema.parse({})
  const results = { revision, promptCharacters: { text: buildCoachPrompt(context).length, native: voiceInstructions(context, {}).length }, coachingSilenceMs, method: 'deterministic provider-envelope and virtual suspended-audio-clock probes; not model-quality or real latency measurements',
    checks: { retainsCorrectionInInterruptionEnvelope, keepsFaceQueuedWhileAudioClockPaused, showsFaceWhenPlaybackBegins },
    passed: Number(retainsCorrectionInInterruptionEnvelope) + Number(keepsFaceQueuedWhileAudioClockPaused) + Number(showsFaceWhenPlaybackBegins), total: 3 }
  await mkdir(resolve('outputs/nova-v2'), { recursive: true })
  await writeFile(resolve(`outputs/nova-v2/regressions-${revision === 'working-tree' ? 'after' : revision.slice(0, 9)}.json`), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
  if (process.argv.includes('--assert') && results.passed !== results.total) process.exitCode = 1
} finally { dom.window.close(); await rm(directory, { recursive: true, force: true }) }

process.exit(process.exitCode ?? 0)
