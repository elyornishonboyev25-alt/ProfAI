import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { build } from 'esbuild'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')

async function main() {
  const directory = await mkdtemp(join(tmpdir(), 'profai-listening-diagram-'))
  const raceVillage = process.argv.includes('--test15')
  const filename = raceVillage ? 'listening-test15-race-village.png' : 'listening-test14-education-house.jpg'
  const legacy = `/images/ielts-${filename}`
  const width = raceVillage ? 411 : 860
  const height = raceVillage ? 315 : 680
  const source = `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import Diagram from './src/components/ListeningDiagram';
    const root=createRoot(document.getElementById('root')); let version=0;
    const draw=()=>root.render(<Diagram key={version} src="${legacy}" alt="${raceVillage ? 'Map of Race Village' : 'Education House'}" />);
    window.redraw=draw;
    window.reopen=()=>{version++;draw()};
    draw();
  `
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', loader: { '.jpg': 'dataurl', '.png': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' } })
  const original = await readFile(`src/assets/ielts/${filename}`)
  const requests = []
  let allowImages = true
  const server = createServer((req, res) => {
    requests.push(req.url)
    if (req.url === '/' || req.url === '/restricted') {
      if (req.url === '/restricted') res.setHeader('Content-Security-Policy', "img-src 'self'")
      res.setHeader('Content-Type', 'text/html')
      res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#root{max-width:768px;margin:auto}figure{margin:0}img{display:block;width:100%;height:auto}</style><div id="root"></div><script src="/fixture.js"></script>')
    } else if (req.url === '/fixture.js') {
      res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text)
    } else if (req.url.startsWith(legacy) && allowImages) {
      res.setHeader('Content-Type', raceVillage ? 'image/png' : 'image/jpeg'); res.end(original)
    } else { res.writeHead(503); res.end('temporarily unavailable') }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const browser = spawn(process.env.LISTENING_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
  const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
  let socket
  try {
    let port
    for (let n = 0; n < 100; n++) {
      try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Browser startup. */ }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.ok(port, 'Chromium must start')
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
    await new Promise(resolve => socket.once('open', resolve))
    let id = 0
    const pending = new Map()
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const requestId = ++id
      const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
      pending.set(requestId, { resolve, reject, timeout })
      socket.send(JSON.stringify({ id: requestId, method, params }))
    })
    socket.on('message', data => {
      const message = JSON.parse(data), call = pending.get(message.id)
      if (!call) return
      clearTimeout(call.timeout); pending.delete(message.id)
      if (message.error) call.reject(message.error); else call.resolve(message.result)
    })
    const evaluate = async expression => {
      const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      assert.ok(!response.exceptionDetails, JSON.stringify(response.exceptionDetails))
      return response.result.value
    }
    const until = async expression => {
      for (let n = 0; n < 80; n++) {
        if (await evaluate(expression)) return
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      assert.fail(expression)
    }
    const decoded = `document.querySelector('img')?.complete && document.querySelector('img')?.naturalWidth===${width} && document.querySelector('img')?.naturalHeight===${height}`
    const base = `http://127.0.0.1:${server.address().port}`
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await send('Page.navigate', { url: base })
    await until(decoded)
    assert.equal(requests.filter(url => url.startsWith(legacy)).length, 0, 'Old snapshots should recover without fetching the old URL')
    await send('Network.enable')
    await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
    for (let n = 0; n < 8; n++) {
      await evaluate('window.reopen()')
      await until(decoded)
    }
    assert.ok(await evaluate('document.body.scrollWidth <= innerWidth'))
    console.log(`PASS: old snapshot, repeated section reopen, offline decoding, unchanged ${width}x${height} image and mobile layout`)
    await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
    await evaluate(`document.querySelector('img').src='data:image/jpeg;base64,broken'`)
    await until(`${decoded} && document.querySelector('img').src.includes('?v=')`)
    for (let n = 0; n < 3; n++) await evaluate('window.redraw()')
    await until(`${decoded} && document.querySelector('img').src.includes('?v=')`)
    console.log('PASS: decoder error automatically recovers; ordinary rerenders retain the working fallback')
    await send('Page.navigate', { url: base + '/restricted' })
    await until(`${decoded} && document.querySelector('img').src.includes('?v=')`)
    console.log('PASS: a policy blocking inline images falls back to the byte-identical same-origin image')
    allowImages = false
    await send('Network.setCacheDisabled', { cacheDisabled: true })
    await send('Page.navigate', { url: base + '/restricted' })
    await until(`document.querySelector('button')?.textContent==='Retry diagram'`)
    const count = requests.length
    await new Promise(resolve => setTimeout(resolve, 600))
    assert.equal(requests.length, count, 'Failure must not loop requests')
    allowImages = true
    await evaluate(`document.querySelector('button').click()`)
    await until(`${decoded} && document.querySelector('img').src.includes('&retry=')`)
    console.log('PASS: complete failure shows recovery control; retry bypasses a failed cached response without reloading the test')
    await send('Browser.close').catch(() => {})
  } finally {
    socket?.close(); browser.kill(); await exited
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep))
    await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
