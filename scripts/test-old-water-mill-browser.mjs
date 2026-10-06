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
  const filename = 'test3-old-water-mill.svg'
  const legacy = `/images/ielts-listening/${filename}`
  const source = `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import Diagram from './src/components/ListeningDiagram';

    const root=createRoot(document.getElementById('root')); let version=0;
    window.showAbsolute=()=>root.render(<Diagram key={++version} src={"https://www.profai.uz" + "${legacy}" + "?v=old"} alt="Old water-mill" />);
    const draw=()=>root.render(<Diagram key={version} src="${legacy}" alt="Old water-mill" />);
    window.redraw=draw;
    window.reopen=()=>{version++;draw()};
    draw();
  `
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', loader: { '.jpg': 'dataurl', '.png': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' } })
  const requests = []
  const server = createServer((req, res) => {
    requests.push(req.url)
    if (req.url === '/' || req.url === '/restricted') {
      if (req.url === '/restricted') res.setHeader('Content-Security-Policy', "img-src 'none'")
      res.setHeader('Content-Type', 'text/html')
      res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}#root{max-width:1194px;margin:auto}figure{margin:0}figure>div{overflow-x:auto}svg{display:block;width:100%;height:auto}</style><div id="root"></div><script src="/fixture.js"></script>')
    } else if (req.url === '/fixture.js') {
      res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text)
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
    const drawn = `document.querySelector('svg[data-old-water-mill] path') && !document.querySelector('img, image')`
    const base = `http://127.0.0.1:${server.address().port}`
    await send('Page.navigate', {url:base})
    await until(drawn)
    assert.equal(requests.filter(url=>/\.(png|jpg)/.test(url)).length,0)
    const pixelHash=await evaluate(`(async()=>{
      const svg=document.querySelector('svg[data-old-water-mill]').cloneNode(true);
      svg.setAttribute('width','1194');svg.setAttribute('height','610');svg.removeAttribute('class');svg.style.width='1194px';svg.style.height='610px';svg.style.transform='none';
      const vector=new Image();
      const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
      vector.src=url;await vector.decode();
      const canvas=document.createElement('canvas');canvas.width=1194;canvas.height=610;
      const ctx=canvas.getContext('2d');ctx.drawImage(vector,0,0);const actual=ctx.getImageData(0,0,1194,610).data;
      const rgb=new Uint8Array(1194*610*3);for(let p=0;p<1194*610;p++){rgb[p*3]=actual[p*4];rgb[p*3+1]=actual[p*4+1];rgb[p*3+2]=actual[p*4+2];}
      const hash=await crypto.subtle.digest('SHA-256',rgb);
      URL.revokeObjectURL(url);return [...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
    })()`)
    assert.equal(pixelHash,'cf05375f10bd8e068e79dcbf233cb0fb76b2573dc38f2a3e7316cc9b8905b150','SVG must exactly preserve every supplied map pixel, including labels')
    console.log('PASS: native SVG drawing matches the original map exactly')
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true})
    await send('Page.navigate',{url:base+'/restricted'})
    await until(drawn)
    await send('Network.enable')
    await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0})
    const before=requests.length
    for(let i=0;i<5;i++){await evaluate('window.reopen()');await until(drawn)}
    await evaluate('window.showAbsolute()');await until(drawn)
    assert.equal(requests.length,before)
    assert.ok(await evaluate('document.body.scrollWidth <= innerWidth'))
    console.log('PASS: public-URL and absolute-URL saved snapshots render offline with all image loads blocked; mobile layout fits')
    await send('Browser.close').catch(() => {})
  } finally {
    socket?.close(); browser.kill(); await exited
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
    assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep))
    await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
