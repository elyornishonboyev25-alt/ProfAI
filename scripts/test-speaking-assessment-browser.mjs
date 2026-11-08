import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
const directory = await mkdtemp(join(tmpdir(), 'profai-speaking-assessment-'))
const bundle = await build({ stdin: { contents: `import {run} from './scripts/tests/speaking-assessment-browser'; window.runAssessmentAudioTests = run`, resolveDir: process.cwd() },
  bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}' } })
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/test.js' ? 'application/javascript; charset=utf-8' : 'text/html; charset=utf-8')
  res.end(req.url === '/test.js' ? bundle.outputFiles[0].text : '<script src="/test.js"></script>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const executable = process.env.SPEAKING_TEST_BROWSER || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync)
assert.ok(executable, 'Set SPEAKING_TEST_BROWSER to an installed Chromium browser')
const browser = spawn(executable, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Browser did not start')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let id = 0
  const pending = new Map()
  const browserErrors = []
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`Timeout: ${method}`)) }, 120_000)
    pending.set(requestId, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data), call = pending.get(message.id)
    if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text)
    if (message.method === 'Runtime.consoleAPICalled') console.log(message.params.args.map(arg => arg.value ?? arg.description).join(' '))
    if (!call) return
    clearTimeout(call.timeout); pending.delete(message.id)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  await send('Runtime.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` })
  for (let i = 0; i < 100; i++) {
    assert.equal(browserErrors.length, 0, browserErrors.join('\n'))
    const ready = await send('Runtime.evaluate', { expression: 'typeof window.runAssessmentAudioTests === "function"', returnByValue: true })
    if (ready.result.value) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  const result = await send('Runtime.evaluate', { expression: 'window.runAssessmentAudioTests()', awaitPromise: true, returnByValue: true })
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
  await send('Browser.close').catch(() => {})
} finally {
  socket?.close(); browser.kill(); await exited
  await new Promise(resolve => server.close(resolve))
  await rm(directory, { recursive: true, force: true })
}
