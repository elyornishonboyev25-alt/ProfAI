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
const directory = await mkdtemp(join(tmpdir(), 'ivygoo-sat-formulas-'))
const fixture = `
import React from 'react'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import Mock from './src/pages/SATMockRun'; import Bank from './src/pages/SATQuestionBankRun';
import {getSATSectionTest} from './src/features/sat/catalog';
import {createSATAttempt} from './src/features/sat/practiceTest4';
import {saveSATAttempt, loadSATAttempt} from './src/features/sat/attemptStorage';
import {allQuestions,saveBankSession,loadBankSession} from './src/features/sat/bankPractice';
import {useAuthStore} from './src/store/authStore'; import './src/i18n';
useAuthStore.setState({user:null});
let root=createRoot(document.getElementById('root'));
window.show=kind=>{
 flushSync(()=>root.unmount());localStorage.clear();
 root=createRoot(document.getElementById('root'));
 let path;
 if(kind==='bank'){
  const rows=allQuestions.filter(row=>row.question.section==='math'&&row.question.kind==='multiple-choice').slice(0,3);
  saveBankSession('guest',{id:'formulas',keys:rows.map(row=>row.key),index:0,answers:{},flagged:[],highlights:{},createdAt:new Date().toISOString()});
  path='/sat/question-bank/run/formulas';
  window.savedAnswer=()=>loadBankSession('guest')?.answers[rows[0].key];
 }else{
  const test=getSATSectionTest('1',kind==='section'?'math':null);
  const attempt=createSATAttempt(test.id,test.modules,kind==='exam'?'exam':'practice');
  attempt.currentModuleIndex=test.modules.findIndex(module=>module.section==='math');
  const module=test.modules[attempt.currentModuleIndex];
  attempt.moduleStartedAt[module.id]=Date.now();
  if(kind==='exam')attempt.moduleDeadlines[module.id]=Date.now()+module.durationSeconds*1000;
  const first=test.modules[attempt.currentModuleIndex].questions[0];
  saveSATAttempt(attempt);path='/sat/mock/1/run'+(kind==='section'?'?section=math':'');
  window.savedAnswer=()=>loadSATAttempt(test.id)?.answers[first.id];
 }
 flushSync(()=>root.render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path='/sat/mock/:mockId/run' element={<Mock/>}/>
  <Route path='/sat/question-bank/run/:setId' element={<Bank/>}/>
 </Routes></MemoryRouter>));
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
  const resize = (width, height = 900) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })

  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
  const key = async value => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: value })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: value })
  }
  const panel = '#sat-formula-sheet'
  const close = '[aria-label="Close formula sheet"]'
  const geometry = `(()=>{
    const panel=document.querySelector('#sat-formula-sheet'),p=panel.getBoundingClientRect();
    const viewport=document.querySelector('.sat-exam-viewport'),v=viewport.getBoundingClientRect();
    const header=document.querySelector('main > header').getBoundingClientRect();
    const footer=document.querySelector('main > footer').getBoundingClientRect();
    const issues=[];
    if(v.width<300||v.height<100)issues.push('Question area too small: '+JSON.stringify(v));
    if(p.top<header.bottom-1||p.bottom>footer.top+1)issues.push('Panel covers exam controls');
    if(innerWidth>=768){
      if(p.left<v.right-1||p.width>innerWidth*.46||p.width>433)issues.push('Reference is not a compact right panel');
    }else if(v.bottom>p.top+1||p.height>v.height+1)issues.push('Narrow screen lost the question area');
    if(document.documentElement.scrollWidth>innerWidth)issues.push('Horizontal page overflow');
    for(const el of panel.querySelectorAll('article,math')){
      if(el.scrollWidth>el.clientWidth+2&&el.tagName.toLowerCase()!=='math')issues.push('Overflow: '+el.textContent);
    }
    return issues;
  })()`
  await send('Page.enable')
  await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port })
  await waitFor('!!window.show')
  for (const kind of ['mock', 'section', 'exam', 'bank']) {
    for (const [width, height] of [[1440,900], [1024,768], [768,900], [390,844], [320,568], [844,390]]) {
      await resize(width, height)
      await evaluate(`window.show(${JSON.stringify(kind)})`)
      const opener = kind === 'bank' ? '[aria-label="Open Math reference sheet"]' : '[aria-label="Open SAT formula sheet"]'
      await waitFor(`!!document.querySelector(${JSON.stringify(opener)})`)
      await evaluate(`document.querySelector(${JSON.stringify(opener)}).focus()`)
      await click(opener)
      await waitFor(`!!document.querySelector('${panel}')`)
      assert.deepEqual(await evaluate(geometry), [], `${kind}, ${width}×${height}`)
      assert.equal(await evaluate(`document.querySelector('${panel}').hasAttribute('aria-modal')`), false)
      assert.equal(await evaluate(`document.querySelectorAll('${panel} article').length`), 11)
      assert.equal(await evaluate(`document.querySelectorAll('${panel} article math').length`), 12)
      assert.equal(await evaluate(`document.querySelectorAll('${panel} msqrt').length`), 2, 'Both special-triangle radicals render')
      assert.equal(await evaluate(`document.activeElement===document.querySelector('${close}')`), true)
      // Parent timer rerenders must not pull focus out of the question.
      await evaluate(`document.querySelector('[role="radio"]').focus()`)
      await new Promise(resolve => setTimeout(resolve, 320))
      assert.equal(await evaluate(`document.activeElement.getAttribute('role')`), 'radio')
      await click('[role="radio"]')
      await waitFor(`document.querySelector('[role="radio"][aria-checked="true"]')!==null`)
      await waitFor('!!window.savedAnswer()')
      const viewportScroll = await evaluate(`document.querySelector('.sat-exam-viewport').scrollTop`)
      await evaluate(`document.querySelector('.sat-formula-content').scrollTop=10000`)
      assert.equal(await evaluate(`document.querySelector('.sat-exam-viewport').scrollTop`), viewportScroll, 'Independent reference scrolling')
      assert.ok(await evaluate(`document.querySelector('.sat-formula-content').scrollTop>0`), 'All formulas remain reachable')
      await click('main > footer button:last-child')
      await waitFor(`document.querySelector('.sat-question-number').textContent.trim()==='2'`)
      assert.ok(await evaluate(`!!document.querySelector('${panel}')`), 'Navigation keeps the reference open')
      // Escape closes without stealing focus from the answer area.
      await evaluate(`document.querySelector('[role="radio"]').focus()`)
      await key('Escape')
      await waitFor(`!document.querySelector('${panel}')`)
      assert.equal(await evaluate(`document.activeElement.getAttribute('role')`), 'radio')
      await evaluate(`document.querySelector(${JSON.stringify(opener)}).focus()`)
      await click(opener)
      await click(close)
      await waitFor(`!document.querySelector('${panel}')`)
      assert.equal(await evaluate(`document.activeElement===document.querySelector(${JSON.stringify(opener)})`), true, 'Close returns focus to the opener')
      await click(opener)
      await click(opener)
      await waitFor(`!document.querySelector('${panel}')`)
      await click('[aria-label="Open Desmos calculator"]')
      await waitFor(`document.querySelector('[aria-label="Desmos Graphing Calculator"]').getAttribute('aria-hidden')==='false'`)
      await click(opener)
      await waitFor(`!!document.querySelector('${panel}')`)
      assert.equal(await evaluate(`document.querySelector('[aria-label="Desmos Graphing Calculator"]').getAttribute('aria-hidden')`), 'true', 'Calculator cannot cover the reference')
      await click('[aria-label="Open Desmos calculator"]')
      await waitFor(`!document.querySelector('${panel}')`)
      console.log(`PASS ${kind} ${width}×${height}: compact layout, formulas, answers, navigation, scroll, focus and tools`)
    }
  }
  await resize(1440)
  await evaluate("window.show('mock')")
  await click('[aria-label="Open SAT formula sheet"]')
  await waitFor(`!!document.querySelector('${panel}')`)
  for (const [name, width, height, scroll] of [['desktop',1440,900,0],['geometry',1440,900,420],['mobile',390,844,0]]) {
    await resize(width,height)
    await evaluate(`document.querySelector('.sat-formula-content').scrollTop=${scroll}`)
    const screenshot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(`/tmp/ivygoo-sat-formulas-${name}.png`, Buffer.from(screenshot.data, 'base64'))
  }
} finally {
  socket?.close()
  browser.kill()
  await exited
  await new Promise(resolve => server.close(resolve))
  await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
