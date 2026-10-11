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
const directory = await mkdtemp(join(tmpdir(), 'profai-reading-evidence-'))
const source = `
  import React from 'react'; import { createRoot } from 'react-dom/client';
  import { MemoryRouter, Routes, Route } from 'react-router-dom';
  import './src/i18n'; import Results from './src/pages/Results'; import TestInterface from './src/pages/TestInterface';
  import { resolveIeltsTestById } from './src/utils/ieltsTestCatalog';
  const root = createRoot(document.getElementById('root')); let run = 0;
  window.show = (testId = 'ielts-reading-full-vol26') => {
    const test = resolveIeltsTestById(testId); window.sourcePassage = test.sections[0].content;
    const result = {testId:test.id,date:'2026-10-11',score:0,correctAnswers:0,totalQuestions:40,timeSpent:3600,answers:testId.endsWith('28') ? {'rd28-q12':'NOT GIVEN'} : {'rd26-q19':'physical harm'}};
    root.render(<MemoryRouter key={++run} initialEntries={[{pathname:'/results/'+test.id,state:{test,result}}]}>
      <Routes><Route path='/results/:testId' element={<Results/>}/><Route path='/test/:type/:id' element={<TestInterface/>}/></Routes>
    </MemoryRouter>);
  }; window.show();
`
const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: 'tmp/reading-evidence-fixture.js', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + bundle.outputFiles.filter(file => file.path.endsWith('.css')).map(file => file.text).join('\n')
const server = createServer((req, res) => {
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
    try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* browser startup */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(port, 'Set READING_TEST_BROWSER to an installed Chromium browser')
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise(resolve => socket.once('open', resolve))
  let id = 0
  const pending = new Map(), exceptions = []
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
    pending.set(requestId, { resolve, reject, timeout })
    socket.send(JSON.stringify({ id: requestId, method, params }))
  })
  socket.on('message', data => {
    const message = JSON.parse(data), call = pending.get(message.id)
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
    if (!call) return
    clearTimeout(call.timeout); pending.delete(message.id)
    if (message.error) call.reject(message.error); else call.resolve(message.result)
  })
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const until = async expression => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(`Boolean(${expression})`)) return
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Timed out: ${expression}; ${JSON.stringify(exceptions)}`)
  }
  await send('Runtime.enable')
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
  await until('window.show')
  const screenshots = resolve('tmp/reading-evidence-browser')
  await mkdir(screenshots, { recursive: true })
  for (const [width, height] of [[1366, 900], [390, 844], [320, 568]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
    await evaluate('localStorage.clear();sessionStorage.clear();window.show()')
    await until('document.querySelector(\'[aria-label="Review question 19 in passage"]\')')
    await evaluate('document.querySelector(\'[aria-label="Review question 19 in passage"]\').click()')
    await until('document.querySelector(\'[data-answer-evidence="rd26-q19"]\')')
    await new Promise(resolve => setTimeout(resolve, 500))
    const layout = await evaluate(`(() => {
      const left=document.querySelector('#answer-evidence-pane'), right=document.querySelector('#reading-questions-pane');
      const a=left.getBoundingClientRect(),b=right.getBoundingClientRect();
      const marker=left.querySelector('[data-question-number]'), mark=left.querySelector('mark');
      const m=marker.getBoundingClientRect(),h=left.querySelector('[data-evidence-header]').getBoundingClientRect();
      const toggle=document.querySelector('[aria-label="Hide Correct Answers"]').getBoundingClientRect();
      return {horizontal:document.documentElement.scrollWidth<=innerWidth+1,left:a.toJSON(),right:b.toJSON(),mark:mark.textContent,number:getComputedStyle(marker,'::before').content,disabled:right.querySelector('[aria-label="Answer for question 19"]').disabled,visible:m.top>=h.bottom-1 && m.bottom<=a.bottom+1,controls:toggle.left>=0 && toggle.right<=innerWidth};
    })()`)
    assert.equal(layout.horizontal, true, `${width}: no page overflow`)
    assert.equal(layout.disabled, true)
    assert.ok(layout.mark.includes('physical health'))
    assert.equal(layout.number, '"19"', 'question badge is visibly generated by CSS')
    assert.equal(layout.visible, true, `${width}: highlighted answer is visible below the sticky source heading`)
    assert.equal(layout.controls, true, `${width}: answer visibility control is reachable`)
    assert.ok(layout.left.height > 50 && layout.right.height > 50, `${width}: both source and questions remain readable`)
    if (width >= 1024) assert.ok(layout.left.right <= layout.right.left + 1, 'original passage is left of questions')
    else assert.ok(layout.left.bottom <= layout.right.top + 1, 'mobile panes stack')
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(join(screenshots, `${width}-reading-review.png`), Buffer.from(shot.data, 'base64'))
    await evaluate('document.querySelector(\'[aria-label="Show evidence for question 21"]\').click()')
    await until('document.querySelector(\'[data-answer-evidence="rd26-q21"]\')')
    assert.equal(await evaluate('document.querySelector(\'[data-question-number]\').dataset.questionNumber'), '21')
    console.log(`PASS: ${width}px Reading answer-sheet/source navigation, numbered highlights and responsive panes`)
    await evaluate("localStorage.clear();sessionStorage.clear();window.show('ielts-reading-full-vol28')")
    await until('document.querySelector(\'[aria-label="Review question 4 in passage"]\')')
    await evaluate('document.querySelector(\'[aria-label="Review question 4 in passage"]\').click()')
    for (const number of [4, 5, 6, 7, 8, 9, 12]) {
      await until(`document.querySelector('[aria-label="Show evidence for question ${number}"]')`)
      await evaluate(`document.querySelector('[aria-label="Show evidence for question ${number}"]').click()`)
      await until(`document.querySelector('[data-answer-evidence="rd28-q${number}"]')`)
      const restored = await evaluate(`(() => {
        const pane=document.querySelector('#answer-evidence-pane'), marker=pane.querySelector('[data-question-number]');
        const rect=marker.getBoundingClientRect(), header=pane.querySelector('[data-evidence-header]').getBoundingClientRect();
        return {number:getComputedStyle(marker,'::before').content, visible:rect.top>=header.bottom-1 && rect.bottom<=pane.getBoundingClientRect().bottom+1,
          exact:pane.querySelector('.ielts-reading-prose').textContent.trim()===window.sourcePassage,
          missing:pane.textContent.includes('An exact evidence location is not available')};
      })()`)
      assert.equal(restored.number, `"${number}"`)
      assert.equal(restored.visible, true, `${width}px Q${number}: restored source highlight is visible`)
      assert.equal(restored.exact, true, 'the entire supplied passage remains intact')
      assert.equal(restored.missing, false)
    }
    console.log(`PASS: ${width}px restored Q4-9/Q12, numbered source highlights and exact supplied passage`)
  }
  assert.deepEqual(exceptions, [])
} finally {
  socket?.close()
  browser.kill()
  await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 3000))])
  await new Promise(resolve => server.close(resolve))
  assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep))
  await rm(directory, { recursive: true, force: true })
}
