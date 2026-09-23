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
  const filename = 'listening-test15-race-village.png'
  const legacy = `/images/ielts-${filename}`
  const source = `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import Diagram from './src/components/ListeningDiagram';
    import original from './src/assets/ielts/listening-test15-race-village.png?inline';
    const root=createRoot(document.getElementById('root')); let version=0;
    window.showEmbedded=()=>root.render(<Diagram key={++version} src={original} alt="Race Village" />);
    const draw=()=>root.render(<Diagram key={version} src="${legacy}" alt="Map of Race Village" />);
    window.redraw=draw;
    window.reopen=()=>{version++;draw()};
    draw();
  `
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', loader: { '.jpg': 'dataurl', '.png': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' } })
  const original = await readFile(`src/assets/ielts/${filename}`)
  const requests = []
  const server = createServer((req, res) => {
    requests.push(req.url)
    if (req.url === '/' || req.url === '/restricted') {
      if (req.url === '/restricted') res.setHeader('Content-Security-Policy', "img-src 'none'")
      res.setHeader('Content-Type', 'text/html')
      res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#root{max-width:768px;margin:auto}figure{margin:0}svg{display:block;width:100%;height:auto}</style><div id="root"></div><script src="/fixture.js"></script>')
    } else if (req.url === '/fixture.js') {
      res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text)
    } else if (req.url === '/reference.png') {
      res.setHeader('Content-Type', 'image/png'); res.end(original)
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
    const drawn = `document.querySelector('svg[data-race-village] path') && !document.querySelector('img, image')`
    const base = `http://127.0.0.1:${server.address().port}`
    await send('Page.navigate', {url:base})
    await until(drawn)
    assert.equal(requests.filter(url=>/\.(png|jpg)/.test(url)).length,0)
    const difference=await evaluate(`(async()=>{
      const svg=document.querySelector('svg[data-race-village]').cloneNode(true);
      svg.setAttribute('width','411');svg.setAttribute('height','315');svg.removeAttribute('class');
      const vector=new Image(),original=new Image();
      const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
      vector.src=url;original.src='/reference.png';await Promise.all([vector.decode(),original.decode()]);
      const canvas=document.createElement('canvas');canvas.width=411;canvas.height=315;
      const ctx=canvas.getContext('2d');ctx.drawImage(original,0,0);const expected=ctx.getImageData(0,0,411,315).data;
      ctx.clearRect(0,0,411,315);ctx.drawImage(vector,0,0);const actual=ctx.getImageData(0,0,411,315).data;
      let differences=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differences++;
      URL.revokeObjectURL(url);return differences;
    })()`)
    assert.equal(difference,0,'SVG must exactly preserve every original pixel, including labels')
    console.log('PASS: native SVG drawing matches the original map exactly')
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
    await send('Page.navigate',{url:base+'/restricted'})
    await until(drawn)
    await send('Network.enable')
    await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0})
    const before=requests.length
    for(let i=0;i<5;i++){await evaluate('window.reopen()');await until(drawn)}
    await evaluate('window.showEmbedded()');await until(drawn)
    assert.equal(requests.length,before)
    assert.ok(await evaluate('document.body.scrollWidth <= innerWidth'))
    console.log('PASS: public-URL and embedded saved snapshots render offline with all image loads blocked; mobile layout fits')
    await send('Browser.close').catch(() => {})
  } finally {
    socket?.close(); browser.kill(); await exited
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep))
    await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
