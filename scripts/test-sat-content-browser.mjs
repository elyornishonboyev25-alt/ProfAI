import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

const WebSocket = createRequire(new URL('../backend/package.json', import.meta.url))('ws')
assert.ok(process.env.SAT_TEST_BROWSER, 'Set SAT_TEST_BROWSER to an installed Chromium browser')
const directory = await mkdtemp(join(tmpdir(), 'profai-sat-content-'))
const fixture = `
import React from 'react'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom';
import {MemoryRouter} from 'react-router-dom';
import Canvas from './src/components/sat/SATQuestionCanvas'; import SATReview from './src/components/sat/SATReview';
import {SAT_TEST_CATALOG} from './src/features/sat/catalog'; import {createSATAttempt} from './src/features/sat/practiceTest4';
import {useAuthStore} from './src/store/authStore'; import './src/components/sat/sat-exam-layout.css';
useAuthStore.setState({user:null});
const root=createRoot(document.getElementById('root'));
window.questions=Object.values(SAT_TEST_CATALOG).flatMap(t=>t.modules.flatMap(m=>m.questions.map(q=>({test:t.mockId,q}))));
window.show=indices=>flushSync(()=>root.render(<>{indices.map(i=><article data-index={i} key={i} style={{marginBottom:40}}>
  <Canvas question={window.questions[i].q} answer='' strokes={[]} onAnswer={()=>{}} onChange={()=>{}} flagged={false} onToggleFlag={()=>{}}/>
</article>)}</>));
window.review=(index)=>{
 const row=window.questions[index], source=SAT_TEST_CATALOG[row.test];
 const test={...source,questionCount:1,modules:[{...source.modules.find(m=>m.id===row.q.moduleId),questions:[row.q]}]};
 const attempt=createSATAttempt(test.id,test.modules,'practice');attempt.status='submitted';attempt.submittedAt=Date.now();
 flushSync(()=>root.render(<MemoryRouter key={index}><SATReview attempt={attempt} test={test} historyReview onStartAgain={()=>{}}/></MemoryRouter>));
};`
const bundle = await build({
  stdin: { contents: fixture, loader: 'tsx', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'iife', outfile: join(directory, 'fixture.js'),
  tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' },
})
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css
  + bundle.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n')
const server = createServer(async (req, res) => {
  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script src="/fixture.js"></script>')
  } else if (req.url === '/fixture.js') {
    res.setHeader('Content-Type', 'text/javascript')
    res.end(bundle.outputFiles.find(file => file.path.endsWith('.js')).text)
  } else if (req.url === '/fixture.css') {
    res.setHeader('Content-Type', 'text/css')
    res.end(css)
  } else {
    const path = resolve('public', '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname))
    if (!path.startsWith(resolve('public') + '/')) { res.writeHead(404); res.end(); return }
    try {
      res.setHeader('Content-Type', path.endsWith('.svg') ? 'image/svg+xml' : path.endsWith('.webp') ? 'image/webp' : 'image/png')
      res.end(await readFile(path))
    } catch { res.writeHead(404); res.end() }
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.SAT_TEST_BROWSER, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank',
], { stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Browser starting. */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Chromium did not start')
  const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let id = 0
  const pending = new Map()
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method + ' timed out')) }, 60_000)
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
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const waitFor = async expression => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    assert.fail('Timed out: ' + expression)
  }
  const resize = width => send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 })
  const decodeImages = () => evaluate('Promise.all([...document.images].map(image=>image.decode().catch(()=>{})))')
  const layoutIssues = `(()=>{
    const issues=[];
    for(const image of document.images){
      const r=image.getBoundingClientRect();
      if(!image.complete||!image.naturalWidth||r.width<4||r.height<4)issues.push('Invisible image: '+image.getAttribute('src'));
    }
    for(const choice of document.querySelectorAll('.sat-choice-content')){
      const math=choice.querySelector('math'), r=choice.getBoundingClientRect();
      if(choice.scrollWidth>choice.clientWidth+3)issues.push('Answer overflow: '+choice.textContent.slice(0,80));
      if(math&&!choice.querySelector('table')&&choice.textContent===math.textContent&&Math.abs(math.getBoundingClientRect().left-r.left)>5)
        issues.push('Centered answer: '+choice.textContent);
      if(math&&/begin|end|cases/.test(math.textContent))issues.push('Unrendered equation system: '+math.textContent);
    }
    if(document.documentElement.scrollWidth>innerWidth+1)issues.push('Page overflows viewport');
    return issues;
  })()`
  await send('Page.enable')
  await resize(1366)
  await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port })
  await waitFor('!!window.questions')
  const count = await evaluate('window.questions.length')
  assert.ok(count >= 3942, 'Audit the entire current catalog')
  for (const width of process.env.SAT_CONTENT_REVIEW_ONLY ? [] : [1366, 390]) {
    await resize(width)
    for (let start = 0; start < count; start += 20) {
      const indices = Array.from({ length: Math.min(20, count - start) }, (_, index) => start + index)
      await evaluate('window.show(' + JSON.stringify(indices) + ')')
      await decodeImages()
      assert.deepEqual(await evaluate(layoutIssues), [], `${width}px, questions ${start}–${start + indices.length}`)
    }
    console.log(`PASS ${width}px: ${count} SAT questions, decoded images, answer alignment, equation systems and overflow`)
  }
  const find = (test, id) => evaluate(`window.questions.findIndex(row=>row.test===${test}&&row.q.id===${JSON.stringify(id)})`)
  const regression = await Promise.all([[3, 'math2-17'], [3, 'math2-8'], [3, 'math1-12'], [1, 'math2-8'], [6, 'math1-14'], [7, 'rw1-10'], [7, 'rw1-12'], [7, 'math2-15']].map(([test, id]) => find(test, id)))
  for (const index of regression) {
    await evaluate(`window.show([${index}])`)
    const row = await evaluate(`window.questions[${index}].q`)
    if (row.prompt.includes('which table') || row.id === 'math2-8' && !row.visual) {
      assert.equal(await evaluate("document.querySelectorAll('.sat-choice-content table').length"), 4)
    }
    if (row.sourceContent?.context.includes('<table')) assert.equal(await evaluate("document.querySelectorAll('.sat-source-content table').length"), 1)
    if (row.prompt.includes('\\begin{cases}')) assert.equal(await evaluate("document.querySelectorAll('.sat-choice-content mtable').length"), 4)
    await evaluate(`window.review(${index})`)
    await waitFor("document.querySelectorAll('.sat-choice-content').length>0 || document.body.textContent.includes('Accepted answer')")
    await decodeImages()
    assert.deepEqual(await evaluate(layoutIssues), [], 'Saved review retains the same answer and visual layout')
  }
  // Store optional inspection artifacts outside the repository.
  await resize(1366)
  await evaluate('window.show(' + JSON.stringify(regression.slice(0, 3)) + ')')
  await decodeImages()
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  await writeFile(process.env.SAT_CONTENT_SCREENSHOT || '/tmp/profai-sat-content.png', Buffer.from(screenshot.data, 'base64'))
  console.log('PASS reported questions, restored tables and equation systems in test and saved review')
} finally {
  socket?.close()
  browser.kill()
  await exited
  await new Promise(resolve => server.close(resolve))
  await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
