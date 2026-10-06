import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')
const directory = await mkdtemp(join(tmpdir(), 'profai-writing-sources-'))
const bundle = await build({
  stdin: { contents: `
    import React from 'react'; import { createRoot } from 'react-dom/client';
    import Diagram from './src/components/writing/WritingTaskDiagram';
    import { getWritingFullTestCatalog } from './src/data/writingTestData';
    createRoot(document.getElementById('root')).render(<>
      {getWritingFullTestCatalog().filter(t => [6, 8, 11, 12, 13, 14].includes(t.index) || t.index >= 21).map(t => <section key={t.id}>
        <h2>Writing Full Test {t.index}</h2><Diagram diagram={t.tasks[0].diagram} />
      </section>)}
    </>);
  `, loader: 'tsx', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json',
  define: { 'process.env.NODE_ENV': '"production"' },
})
const server = createServer((req, res) => {
  if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text); return }
  res.setHeader('Content-Security-Policy', req.url === '/pixels' ? 'img-src blob:' : "img-src 'none'")
  res.setHeader('Content-Type', 'text/html')
  res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#eee;font-family:Arial}#root{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:16px}section{background:white;padding:12px}h2{font-size:16px}svg{display:block;width:100%;height:auto}@media(max-width:600px){#root{grid-template-columns:1fr}}</style><div id="root"></div><script src="/fixture.js"></script>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.WRITING_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Browser startup. */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Chromium must start')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
    pending.set(requestId, { resolve, reject, timeout }); socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data), call = pending.get(message.id)
    if (!call) return
    clearTimeout(call.timeout); pending.delete(message.id)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value
  }
  for (const width of [1200, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 })
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
    for (let i = 0; i < 100; i++) {
      if (await evaluate('document.querySelectorAll("svg[data-supplied-writing-diagram]").length === 16')) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.equal(await evaluate('document.querySelectorAll("svg[data-supplied-writing-diagram]").length'), 16)
    assert.equal(await evaluate('document.querySelectorAll("img, image").length'), 0)
    // The page above is verified with all image loading blocked. A separate
    // test-only page permits a blob to compare serialized SVG pixels.
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/pixels` })
    for (let i = 0; i < 100; i++) {
      if (await evaluate('document.querySelectorAll("svg[data-supplied-writing-diagram]").length === 16')) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    const sourceHash = await evaluate(`(async () => {
      const svg = document.querySelector('svg[data-supplied-writing-diagram="aluminium-recycling"]').cloneNode(true);
      svg.setAttribute('width', '422'); svg.setAttribute('height', '452'); svg.removeAttribute('class');
      const vector = new Image();
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
      vector.src = url; await vector.decode();
      const canvas = document.createElement('canvas'); canvas.width = 422; canvas.height = 452;
      const ctx = canvas.getContext('2d'); ctx.drawImage(vector, 0, 0);
      const rgba = ctx.getImageData(0, 0, 422, 452).data, rgb = new Uint8Array(422 * 452 * 3);
      for (let i = 0; i < 422 * 452; i++) { rgb[i * 3] = rgba[i * 4]; rgb[i * 3 + 1] = rgba[i * 4 + 1]; rgb[i * 3 + 2] = rgba[i * 4 + 2]; }
      const hash = await crypto.subtle.digest('SHA-256', rgb); URL.revokeObjectURL(url);
      return Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('');
    })()`)
    assert.equal(sourceHash, '5748a60ccb5d24e5479e1d083d6301b00985393003d6127cf3207680dfdc2f79', 'Aluminium artwork must match the supplied source exactly')
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'No page overflow')
    const clipped = await evaluate(`Array.from(document.querySelectorAll('svg')).flatMap(svg => {
      const b = svg.viewBox.baseVal;
      return Array.from(svg.querySelectorAll('text')).filter(t => {
        const r = t.getBBox(), m = t.getCTM(), parent = svg.getCTM().inverse();
        const transform = parent.multiply(m);
        return [[r.x,r.y],[r.x+r.width,r.y],[r.x,r.y+r.height],[r.x+r.width,r.y+r.height]].some(([x,y]) => {
          const p = new DOMPoint(x,y).matrixTransform(transform);
          return p.x < b.x - 1 || p.x > b.x+b.width+1 || p.y < b.y-1 || p.y > b.y+b.height+1;
        });
      }).map(t => svg.dataset.suppliedWritingDiagram + ': ' + t.textContent);
    })`)
    assert.deepEqual(clipped, [], 'Every source label stays inside its drawing')
    const height = await evaluate('document.documentElement.scrollHeight')
    const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height, scale: 1 } })
    const path = join(tmpdir(), `profai-writing-supplied-${width}.png`)
    await writeFile(path, Buffer.from(screenshot.data, 'base64'))
    console.log(`PASS: ${width}px: all sixteen native drawings, image loading blocked, no clipped labels or page overflow; preview ${path}`)
  }
} finally {
  socket?.close(); browser.kill(); await exited
  await new Promise(resolve => server.close(resolve))
  await rm(directory, { recursive: true, force: true })
}
