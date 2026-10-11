import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir, homedir } from 'node:os'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')

async function main() {
  const directory = await mkdtemp(join(tmpdir(), 'profai-highlights-browser-'))
  const source = `import { run } from './scripts/tests/highlights-browser'; window.runHighlights = run;`
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outdir: directory, format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
  const styles = await Promise.all(['src/index.css', 'src/styles/ielts-exam-workspace.css'].map((file) => readFile(file, 'utf8')))
  const css = (await postcss([tailwindcss()]).process(styles[0], { from: 'src/index.css' })).css + '\n' + styles[1] + '\n' + (bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '')
  const server = createServer((req, res) => {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html')
      res.end(`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div style="height:76px"></div><div id="root"></div><script src="/fixture.js"></script>`)
    } else if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript; charset=utf-8'); res.end(bundle.outputFiles.find(file => file.path.endsWith('.js')).text) }
    else { res.writeHead(404); res.end() }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const cache = join(homedir(), 'Library/Caches/ms-playwright')
  const candidates = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ...(existsSync(cache) ? readdirSync(cache).filter(name => name.startsWith('chromium_headless_shell-')).map(name => join(cache, name, 'chrome-headless-shell-mac-arm64/chrome-headless-shell')) : [])]
  const browserPath = process.env.HIGHLIGHTS_TEST_BROWSER || candidates.find(path => existsSync(path))
  assert.ok(browserPath, 'Set HIGHLIGHTS_TEST_BROWSER to an installed Chromium browser')
  const browser = spawn(browserPath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
    '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' })
  const exited = new Promise((resolve) => { browser.once('exit', resolve); browser.once('error', resolve) })
  let socket
  try {
    let port
    for (let n = 0; n < 100; n++) {
      try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Starting browser. */ }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    assert.ok(port, 'Set HIGHLIGHTS_TEST_BROWSER to an installed Chromium browser')
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve) => socket.once('open', resolve))
    let id = 0
    const pending = new Map()
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const requestId = ++id
      const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 60000)
      pending.set(requestId, { resolve, reject, timeout })
      socket.send(JSON.stringify({ id: requestId, method, params }))
    })
    socket.on('message', (data) => {
      const message = JSON.parse(data), call = pending.get(message.id)
      if (message.method === 'Runtime.exceptionThrown') console.error(JSON.stringify(message.params.exceptionDetails))
      if (!call) return
      clearTimeout(call.timeout); pending.delete(message.id)
      if (message.error) call.reject(message.error); else call.resolve(message.result)
    })
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
      assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
      return result.result.value
    }
    const until = async (expression) => {
      for (let n = 0; n < 100; n++) {
        if (await evaluate(expression)) return
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      throw new Error(`Timed out: ${expression}; ${await evaluate('document.body.innerText')}`)
    }
    await send('Runtime.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
    await until('typeof window.runHighlights === "function"')
    const result = await evaluate('window.runHighlights()')
    assert.equal(result, 'PASS')
    console.log('PASS: real browser SAT multiline geometry, recoloring, selection through highlights, responsive layout, review; Articles offsets/overlaps/reopen; IELTS overlapping marks and notes')
    await send('Browser.close').catch(() => {})
  } finally {
    socket?.close(); browser.kill(); await exited
    await new Promise((resolve) => server.close(resolve))
    const target = resolve(directory), parent = resolve(tmpdir()) + sep
    assert.ok(target.startsWith(parent) && target.includes('profai-highlights-browser-'))
    await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
