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

const WebSocket = createRequire(new URL('../backend/package.json', import.meta.url))('ws')
const directory = await mkdtemp(join(tmpdir(), 'profai-ielts-workspace-'))
const source = `
  import React from 'react'; import { createRoot } from 'react-dom/client'; import { MemoryRouter, BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
  import i18n from './src/i18n'; i18n.changeLanguage('en'); import IELTSReadingInterface from './src/components/IELTSReadingInterface';
  import { workspaceReading } from './scripts/fixtures/ielts-workspace';
  import { listeningFullTest15 } from './src/data/listeningFullTest15';
  import IeltsTestExitGuard from './src/components/ielts/IeltsTestExitGuard';
  import { hasActiveTest } from './src/hooks/useActiveTest'; window.hasActiveTest=hasActiveTest;
  window.fixtureHistoryEvents=[];window.addEventListener('popstate',event=>window.fixtureHistoryEvents.push({state:event.state,path:location.pathname}),true);
  window.fixtureBootId = Math.random().toString(36);
  const root = createRoot(document.getElementById('root')); let run = 0;
  window.show = (skill = 'reading', review = false, setup = true) => {
    const test = skill === 'reading' ? workspaceReading : listeningFullTest15;
    root.render(<MemoryRouter key={++run}><IELTSReadingInterface test={test} launchPreset={setup ? {mode:'practice',partIndex:2,durationMinutes:20} : undefined}
      reviewPayload={review ? {result:{testId:test.id,date:'2026-10-23',answers:{'p1-q1':'A'},correctAnswers:1,totalQuestions:9,score:1,timeSpent:1200}} : undefined}
      onComplete={()=>{}} onExit={()=>{}} /></MemoryRouter>);
  };
  function GuardedTest() { const navigate = useNavigate(); return <IeltsTestExitGuard><IELTSReadingInterface test={workspaceReading}
    launchPreset={{mode:'simulation'}} onExit={()=>navigate('/catalog')} onComplete={()=>{}} /></IeltsTestExitGuard>; }
  function Catalog() { const navigate = useNavigate(); return <button onClick={()=>navigate('/guarded')}>Open guarded test</button>; }
  window.showGuard = () => { sessionStorage.setItem('guard-fixture','1'); root.render(<BrowserRouter key={++run}><Routes>
    <Route path='/guarded' element={<GuardedTest />} /><Route path='*' element={<Catalog />} />
  </Routes></BrowserRouter>); };
  if (sessionStorage.getItem('guard-fixture')) window.showGuard(); else window.show();
`
const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: 'tmp/workspace-fixture.js', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + bundle.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n')
const audioPath = '/audio/ielts-listening/listening-full-test-15.mp3'
const audio = await readFile(resolve('public' + audioPath))
const server = createServer((req, res) => {
  if (req.url === audioPath) { res.setHeader('Content-Type', 'audio/mpeg'); res.setHeader('Content-Length', audio.length); res.end(audio); return }
  res.setHeader('Content-Type', (req.url === '/fixture.js' ? 'application/javascript' : req.url === '/fixture.css' ? 'text/css' : 'text/html') + '; charset=utf-8')
  res.end(req.url === '/fixture.js' ? bundle.outputFiles.find(file => file.path.endsWith('.js')).text : req.url === '/fixture.css' ? css : '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = spawn(process.env.READING_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
const exited = new Promise(resolve => { browser.once('exit', resolve); browser.once('error', resolve) })
let socket
try {
  let port
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Browser startup. */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Set READING_TEST_BROWSER to an installed Chromium browser')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let id = 0
  const pending = new Map(), exceptions = [], dialogs = []
  let acceptNativeDialog = false
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
    pending.set(requestId, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data), call = pending.get(message.id)
    if (message.method === 'Page.javascriptDialogOpening') {
      dialogs.push(message.params.type)
      void send('Page.handleJavaScriptDialog', { accept: acceptNativeDialog })
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
    if (!call) return
    clearTimeout(call.timeout); pending.delete(message.id)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const until = async expression => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Timed out: ${expression}; ${JSON.stringify(exceptions)}; ${JSON.stringify(await evaluate('({path:location.pathname,state:history.state,active:window.hasActiveTest?.(),events:window.fixtureHistoryEvents,dialog:!!document.querySelector("[role=alertdialog]"),text:document.body.textContent.slice(0,200)})'))}`)
  }
  const click = text => evaluate(`[...document.querySelectorAll('button')].find(node=>node.textContent.trim()===${JSON.stringify(text)}).click()`)
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
  await until('window.show && document.querySelector("[data-ielts-dialog]")')
  const screenshots = resolve('tmp/ielts-workspace-browser')
  await mkdir(screenshots, { recursive: true })
  for (const [width, height] of process.argv.includes('--guard-only') ? [] : [[1366, 900], [390, 844], [320, 568]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
    for (const skill of ['reading', 'listening']) {
      await evaluate(`localStorage.clear();window.show('${skill}')`)
      await until('document.querySelector("[data-ielts-dialog]")')
      assert.equal(await evaluate('Boolean(document.querySelector(".reading-toolbar"))'), false, 'Part opens setup first')
      const setup = await evaluate(`(() => { const d=document.querySelector('[data-ielts-dialog]'),r=d.getBoundingClientRect();return {fits:r.left>=0&&r.right<=innerWidth&&r.height<=innerHeight,scroll:d.scrollHeight>=d.clientHeight};})()`)
      assert.equal(setup.fits, true, `${width}px ${skill}: setup fits viewport`)
      await click('Start Training Session')
      await until('document.querySelector(".reading-toolbar") && !document.querySelector("[data-ielts-dialog]")')
      if (skill === 'listening') {
        await evaluate('document.querySelector("audio").muted=true')
        await click('Play')
        await until('!document.body.textContent.includes("To continue, click Play.")')
        await until('document.querySelector("#question-card-lt15-q11")')
      }
      const layout = await evaluate(`(() => {
        const header=document.querySelector('.reading-toolbar').getBoundingClientRect(),pane=document.querySelector('.reading-pane');
        return {horizontal:document.documentElement.scrollWidth<=innerWidth+1,header:header.height,pane:pane.getBoundingClientRect().height,
          controls:[...document.querySelectorAll('.ielts-exam-header button')].filter(n=>n.getClientRects().length).every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1}),
          ping:!!document.querySelector('.animate-ping')};
      })()`)
      assert.equal(layout.horizontal, true, `${width}px ${skill}: no horizontal page overflow`)
      assert.equal(layout.controls, true, `${width}px ${skill}: header controls fit`)
      assert.equal(layout.ping, false)
      assert.ok(layout.pane > 100, `${width}px ${skill}: readable pane height`)
      if (skill === 'reading') {
        await evaluate(`document.querySelector('[aria-label="Hide remaining time"]').click()`)
        await until(`document.querySelector('[aria-label="Show remaining time"]')`)
        assert.equal(await evaluate(`document.querySelector('[aria-label="Show remaining time"] > span').getClientRects().length`), 0)
        await evaluate(`document.querySelector('[aria-label="Show remaining time"]').click()`)
        // Exercise real browser Selection/Range APIs and remove just the selected mark.
        await evaluate(`(() => {const p=document.querySelector('.ielts-reading-prose'),t=p.firstChild,r=document.createRange();r.setStart(t,0);r.setEnd(t,5);const s=getSelection();s.removeAllRanges();s.addRange(r);document.dispatchEvent(new Event('selectionchange'));})()`)
        await until('document.querySelector("[data-reading-selection-toolbar]")')
        const ai = await evaluate(`(() => {const n=document.querySelector('[title="Ask AI to explain this word"]'),r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`)
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: ai.x, y: ai.y })
        const aiHover = await evaluate(`(() => {const n=document.querySelector('[title="Ask AI to explain this word"]'),s=getComputedStyle(n),icon=n.querySelector('svg'),r=icon.getBoundingClientRect();return {background:s.backgroundColor,color:s.color,icon:getComputedStyle(icon).color,visible:r.width>0&&r.height>0&&getComputedStyle(icon).opacity!=='0',fits:document.querySelector('[data-reading-selection-toolbar]').getBoundingClientRect().right<=innerWidth};})()`)
        assert.equal(aiHover.visible, true, 'Ask AI keeps its icon on hover')
        assert.equal(aiHover.color, 'rgb(255, 255, 255)')
        assert.equal(aiHover.icon, aiHover.color)
        assert.notEqual(aiHover.background, aiHover.color, 'White icon retains contrast against the hover background')
        assert.equal(aiHover.fits, true, 'The three compact tools fit the viewport')
        await click('Highlight')
        await until('document.querySelector(".ielts-highlight")')
        await evaluate(`getSelection().removeAllRanges();document.querySelector('.ielts-highlight').click()`)
        await until('document.querySelector("[data-reading-mark-toolbar]")')
        await click('Remove highlight')
        await until('!document.querySelector(".ielts-highlight")')
        assert.ok(await evaluate('document.querySelector(".ielts-reading-prose").textContent.startsWith("Alpha learning")'), 'Removing marks preserves passage text')
        // A fast burst must retain the complete final answer and persist after blur.
        await evaluate(`(() => {const n=document.querySelector('input[type="text"]');n.focus();const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(let i=1;i<=7;i++){set.call(n,'reading'.slice(0,i));n.dispatchEvent(new Event('input',{bubbles:true}));}n.blur();window.dispatchEvent(new Event('pagehide'));})()`)
        await new Promise(resolve => setTimeout(resolve, 300))
        assert.equal(await evaluate('document.querySelector("input[type=text]").value'), 'reading')
      }
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      await writeFile(join(screenshots, `${width}-${skill}.png`), Buffer.from(shot.data, 'base64'))
      await evaluate(`window.show('${skill}',true,false)`)
      await until(`document.querySelector('[aria-label="Show Correct Answers"]')`)
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'), true, `${width}px ${skill}: saved review fits`)
      console.log(`PASS: ${width}px ${skill} setup, controls, panes, saved review${skill === 'reading' ? ', highlights, hidden timer and rapid typing' : ''}`)
    }
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 568, deviceScaleFactor: 1, mobile: true })
  await evaluate('localStorage.clear();window.showGuard()')
  await until('document.body.textContent.includes("Open guarded test")')
  await click('Open guarded test')
  await until('document.querySelector(".reading-toolbar")')
  assert.equal(await evaluate('window.hasActiveTest()'), true, 'Browser fixture starts an active attempt')
  assert.equal(await evaluate('history.state.idx'), 1, 'The test has a prior catalog history entry')
  await evaluate(`(() => {const n=document.querySelector('input[type="text"]');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(n,'Browser saved answer');n.dispatchEvent(new Event('input',{bubbles:true}));n.blur();})()`)
  await evaluate('window.history.back()')
  await until('document.querySelector("[role=alertdialog]") && location.pathname==="/guarded"')
  assert.equal(await evaluate('document.querySelector("input[type=text]").value'), 'Browser saved answer')
  const fits = await evaluate(`(() => {const r=document.querySelector('[role=alertdialog]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()`)
  assert.equal(fits, true, 'IELTS exit dialog fits the 320px mobile viewport')
  await click('Continue test')
  await until('!document.querySelector("[role=alertdialog]")')
  await send('Page.reload')
  await until('!document.querySelector("[role=alertdialog]") && document.querySelector(".reading-toolbar")')
  await new Promise(resolve => setTimeout(resolve, 300))
  assert.ok(dialogs.includes('beforeunload'), 'Refresh shows native confirmation')
  assert.equal(await evaluate('document.querySelector("input[type=text]").value'), 'Browser saved answer', 'Cancelled refresh retains the mounted answer')
  acceptNativeDialog = true
  const previousBoot = await evaluate('window.fixtureBootId')
  await send('Page.reload')
  await until(`window.fixtureBootId!==${JSON.stringify(previousBoot)} && window.showGuard && document.querySelector(".reading-toolbar")`)
  assert.equal(await evaluate('document.querySelector("input[type=text]").value'), 'Browser saved answer', 'Accepted refresh restores the answer')
  await evaluate('window.history.back()')
  await until('document.querySelector("[role=alertdialog]")')
  await click('Save & exit')
  await until('document.body.textContent.includes("Open guarded test")')
  await click('Open guarded test')
  await until('document.querySelector(".reading-toolbar")')
  assert.equal(await evaluate('document.querySelector("input[type=text]").value'), 'Browser saved answer', 'Confirmed browser Back preserves the session')
  console.log('PASS: real browser Back/cancel/confirm, native refresh cancellation, accepted reload, saved answers and mobile exit design')
  assert.deepEqual(exceptions, [], 'No browser runtime errors')
} finally {
  if (socket?.readyState === WebSocket.OPEN) await new Promise(resolve => {
    socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' }))
    setTimeout(resolve, 500)
  })
  socket?.close()
  browser.kill()
  await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 3000))])
  await new Promise(resolve => server.close(resolve))
  assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep))
  await rm(directory, { recursive: true, force: true, maxRetries: 15, retryDelay: 200 })
}
