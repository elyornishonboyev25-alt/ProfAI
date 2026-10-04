import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const requireBackend = createRequire(new URL('../backend/package.json', import.meta.url))
const WebSocket = requireBackend('ws')

async function main() {
  const directory = await mkdtemp(join(tmpdir(), 'profai-speaking-browser-'))
  const source = `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import ExaminerSession from './src/components/speaking/ExaminerSession';
    import {apiClient} from './src/lib/apiClient';
    window.webkitSpeechRecognition = undefined; window.SpeechRecognition = undefined;
    const wav = new Uint8Array(4844), view = new DataView(wav.buffer);
    const write = (offset, text) => [...text].forEach((char, index) => wav[offset + index] = char.charCodeAt(0));
    write(0, 'RIFF'); view.setUint32(4, 4836, true); write(8, 'WAVEfmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, 8000, true); view.setUint32(28, 16000, true);
    view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, 4800, true);
    const audioBase64 = btoa(String.fromCharCode(...wav));
    window.files = []; window.voices = []; window.failVoice = false;
    apiClient.post = async (path, body) => {
      if (path.endsWith('/voice')) {
        window.voices.push(body.voice);
        await new Promise(resolve => setTimeout(resolve, 150));
        if (window.failVoice) throw new Error('Offline');
        return {audioBase64, mimeType: 'audio/wav'};
      }
      if (path.endsWith('/transcribe')) {
        window.files.push(body);
        return {text: 'I enjoy learning English because it helps me communicate with people around the world.'};
      }
      return {text: JSON.stringify({reply: 'Why is that important to you?'})};
    };
    const root = createRoot(document.getElementById('root'));
    root.render(<div className="ielts-speaking-live-workspace"><ExaminerSession config={{mode:'full_mock', mockSeed:{
      part1:['What do you study?'], part2:{title:'Describe a useful skill.',bullets:['What it is','How you learned it','When you use it','Why it is useful'],followUp:'Do you use it every day?'}, part3:['How do people learn new skills?']
    }}} modeLabel="Speaking Full Mock 1" onExit={()=>{}} onSaved={()=>{}} /></div>);
  `
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
  const styles = await Promise.all(['src/index.css', 'src/styles/ielts-exam-workspace.css'].map((file) => readFile(file, 'utf8')))
  const css = (await postcss([tailwindcss()]).process(styles[0], { from: 'src/index.css' })).css + '\n' + styles[1]
  const server = createServer((req, res) => {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html')
      res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div style="height:76px"></div><div id="root"></div><script src="/fixture.js"></script>`)
    } else if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text) }
    else { res.writeHead(404); res.end() }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const browser = spawn(process.env.SPEAKING_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
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
    assert.ok(port, 'Set SPEAKING_TEST_BROWSER to an installed Chromium browser')
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve) => socket.once('open', resolve))
    let id = 0
    const pending = new Map()
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const requestId = ++id
      const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
      pending.set(requestId, { resolve, reject, timeout })
      socket.send(JSON.stringify({ id: requestId, method, params }))
    })
    socket.on('message', (data) => {
      const message = JSON.parse(data), call = pending.get(message.id)
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
    const click = (text) => evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(text)})).click()`)
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
    await until(`document.body.innerText.includes('Begin speaking test')`)
    await click('Begin speaking test')
    await until(`document.body.innerText.includes('Finish answer')`)
    assert.equal(await evaluate(`window.voices.every(v=>v==='cedar')`), true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await click('Finish answer')
    await until('window.files.length === 1')
    const file = await evaluate(`({bytes:atob(window.files[0].audioBase64).length,mime:window.files[0].mimeType})`)
    assert.ok(file.bytes > 1000, 'Native MediaRecorder retains actual audio and final chunks')
    assert.equal(file.mime, 'audio/webm')
    console.log('PASS: native browser Audio ends before recording; real MediaRecorder creates a valid WebM answer')

    // Reproduce unavailable examiner audio and check the recovery controls at
    // desktop, zoom-sized, short-window, tablet and narrow mobile viewports.
    await evaluate(`window.failVoice=true; window.speechSynthesis.getVoices=()=>[{name:'Google UK English Female',lang:'en-GB'}]; window.speechSynthesis.dispatchEvent(new Event('voiceschanged'))`)
    await until(`document.body.innerText.includes('Finish answer') || document.body.innerText.includes('Play examiner')`)
    if (await evaluate(`document.body.innerText.includes('Finish answer')`)) await click('Finish answer')
    await until(`document.body.innerText.includes('Play examiner')`)
    const screenshots = resolve('tmp/speaking-browser')
    await mkdir(screenshots, { recursive: true })
    for (const [width, height] of [[1366, 768], [1024, 640], [920, 500], [768, 1024], [390, 844], [320, 568]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 901 })
      const layout = await evaluate(`(() => {
        const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Play examiner'));
        button.scrollIntoView({block:'center',behavior:'instant'});
        const r=button.getBoundingClientRect(), panel=document.querySelector('.speaking-focus-content'), p=panel.getBoundingClientRect();
        const y=Math.max(0,p.top), bottom=Math.min(innerHeight,p.bottom);
        return {horizontal:document.documentElement.scrollWidth<=innerWidth+1, reachable:r.top>=y-1 && r.bottom<=bottom+1, height:r.height, top:r.top, bottom:r.bottom, panelTop:y, panelBottom:bottom, chip:document.querySelector('.speaking-phase-chip').textContent};
      })()`)
      const screenshot = await send('Page.captureScreenshot', { format: 'png' })
      await writeFile(join(screenshots, `${width}x${height}.png`), Buffer.from(screenshot.data, 'base64'))
      assert.equal(layout.horizontal, true, `${width}×${height}: no horizontal overflow`)
      assert.equal(layout.reachable, true, `${width}×${height}: audio recovery is reachable ${JSON.stringify(layout)}`)
      assert.ok(layout.height >= 44, 'Recovery controls have a usable touch target')
      assert.match(layout.chip, /Audio paused/)
      console.log(`PASS: ${width}×${height} layout, recovery controls and truthful audio status`)
    }
    await send('Browser.close').catch(() => {})
  } finally {
    socket?.close(); browser.kill(); await exited
    await new Promise((resolve) => server.close(resolve))
    const target = resolve(directory), parent = resolve(tmpdir()) + sep
    assert.ok(target.startsWith(parent) && target.includes('profai-speaking-browser-'))
    await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
