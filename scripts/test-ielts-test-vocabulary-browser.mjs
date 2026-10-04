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
  const directory = await mkdtemp(join(tmpdir(), 'profai-test-vocabulary-browser-'))
  const source = `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { MemoryRouter, Routes, Route } from 'react-router-dom';
    import IELTSReadingInterface from './src/components/IELTSReadingInterface';
    import IELTSWritingFullTestInterface from './src/components/IELTSWritingFullTestInterface';
    import IELTSSpeakingTest from './src/pages/IELTSSpeakingTest';
    import { resolveIeltsTestById } from './src/utils/ieltsTestCatalog';
    import { getWritingFullTestCatalog } from './src/data/writingTestData';
    const root = createRoot(document.getElementById('root'));
    window.show = (skill, review = false) => {
      const test = resolveIeltsTestById(skill === 'listening' ? 'ielts-listening-1' : 'reading-roadmap-full-1');
      const payload = review ? { result: { testId: test.id, answers: {}, score: 0, totalQuestions: 40, correctAnswers: 0, completedAt: new Date().toISOString() } } : undefined;
      root.render(<MemoryRouter key={skill + review} initialEntries={['/speaking/speaking-full-1']}>
        {skill === 'speaking' ? <Routes><Route path='/speaking/:id' element={<IELTSSpeakingTest />} /></Routes>
          : skill === 'writing' ? <IELTSWritingFullTestInterface fullTest={getWritingFullTestCatalog()[0]} onExit={() => {}} />
          : <IELTSReadingInterface test={test} onComplete={() => {}} onExit={() => {}} reviewPayload={payload} />}
      </MemoryRouter>);
    };
    window.show('listening');
  `
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: 'tmp/ielts-vocabulary-fixture.js', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
  const css = (await postcss([tailwindcss()]).process(await readFile('src/index.css', 'utf8'), { from: 'src/index.css' })).css + bundle.outputFiles.filter((file) => file.path.endsWith('.css')).map((file) => file.text).join('\n')
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', (req.url === '/fixture.js' ? 'application/javascript' : req.url === '/fixture.css' ? 'text/css' : 'text/html') + '; charset=utf-8')
    res.end(req.url === '/fixture.js' ? bundle.outputFiles.find((file) => file.path.endsWith('.js')).text : req.url === '/fixture.css' ? css : '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const browser = spawn(process.env.VOCABULARY_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { windowsHide: true, stdio: 'ignore' })
  const exited = new Promise((resolve) => { browser.once('exit', resolve); browser.once('error', resolve) })
  let socket
  try {
    let port
    for (let n = 0; n < 100; n++) {
      try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break } catch { /* Browser startup. */ }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    assert.ok(port, 'Set VOCABULARY_TEST_BROWSER to an installed Chromium browser')
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
    const exceptions = []
    socket.on('message', (data) => {
      const message = JSON.parse(data), call = pending.get(message.id)
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
      if (!call) return
      clearTimeout(call.timeout); pending.delete(message.id)
      if (message.error) call.reject(message.error); else call.resolve(message.result)
    })
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
      return result.result.value
    }
    const until = async (expression) => {
      for (let n = 0; n < 100; n++) {
        if (await evaluate(`Boolean(${expression})`)) return
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      throw new Error(`Timed out: ${expression}; ${JSON.stringify(exceptions)}; ${await evaluate('document.body.innerText')}`)
    }
    const screenshots = resolve('tmp/ielts-test-vocabulary-browser')
    await mkdir(screenshots, { recursive: true })
    await send('Runtime.enable')
    await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` })
    await until('window.show')
    for (const [width, height] of [[1366, 900], [390, 844], [320, 568]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
      for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
        await evaluate(`localStorage.clear();sessionStorage.clear();window.show('${skill}')`)
        await until('document.querySelector(\'[data-test-vocabulary="link"] a\')')
        await new Promise((resolve) => setTimeout(resolve, skill === 'speaking' ? 2100 : 500))
        if (skill === 'speaking') await until("!document.body.textContent.includes('Preparing your Speaking test')")
        const layout = await evaluate(`(() => {
          const anchors = [...document.querySelectorAll('[data-test-vocabulary] a')];
          const horizontal = document.documentElement.scrollWidth <= innerWidth + 1 && anchors.every(a => {const r=a.getBoundingClientRect();return r.left>=-1 && r.right<=innerWidth+1;});
          const last = document.querySelector('[data-test-vocabulary="link"] a');last.scrollIntoView({block:'center',behavior:'instant'});
          const r=last.getBoundingClientRect();
          const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
          return {horizontal,reachable:r.top>=-1 && r.bottom<=innerHeight+1 && last.contains(hit),href:last.getAttribute('href'),reminder:!!document.querySelector('[data-test-vocabulary="reminder"]'),top:r.top,bottom:r.bottom,hit:hit?.outerHTML.slice(0,250),scroll:document.scrollingElement.scrollTop,height:document.scrollingElement.scrollHeight};
        })()`)
        assert.equal(layout.horizontal, true, `${width} ${skill}: no horizontal overflow`)
        if (!layout.reachable) { const shot = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(join(screenshots, `${width}-${skill}-failure.png`), Buffer.from(shot.data, 'base64')) }
        assert.equal(layout.reachable, true, `${width} ${skill}: vocabulary CTA is reachable ${JSON.stringify(layout)}`)
        assert.equal(layout.href, `/vocabulary/ielts?skill=${skill}&test=1`)
        assert.equal(layout.reminder, true)
        await evaluate(`document.querySelector('[data-test-vocabulary="reminder"]').scrollIntoView({block:'start',behavior:'instant'})`)
        const shot = await send('Page.captureScreenshot', { format: 'png' })
        await writeFile(join(screenshots, `${width}-${skill}.png`), Buffer.from(shot.data, 'base64'))
        await evaluate(`document.querySelector('button[aria-label="Dismiss for now"]').click()`)
        await until('!document.querySelector(\'[data-test-vocabulary="reminder"]\')')
        assert.equal(await evaluate('!!document.querySelector(\'[data-test-vocabulary="link"] a\')'), true)
      }
      for (const skill of ['listening', 'reading']) {
        await evaluate(`window.show('${skill}',true)`)
        await until('document.querySelector(\'[data-test-vocabulary="review"]\')')
        const layout = await evaluate(`(() => {const card=document.querySelector('[data-test-vocabulary="review"]'),a=card.querySelector('a'),r=a.getBoundingClientRect();return {horizontal:card.scrollWidth<=card.clientWidth+1,visible:r.top>=0 && r.bottom<=innerHeight,questions:document.querySelector('#test-main-container').getBoundingClientRect().height};})()`)
        assert.ok(layout.horizontal && layout.visible && layout.questions > 100, `${width} ${skill}: review vocabulary and test panels fit ${JSON.stringify(layout)}`)
      }
      console.log(`PASS: ${width}x${height}, four skill launch cards, dismissal and compact review`)
    }
    await send('Browser.close').catch(() => {})
  } finally {
    socket?.close(); browser.kill(); await exited
    await new Promise((resolve) => server.close(resolve))
    const target = resolve(directory), parent = resolve(tmpdir()) + sep
    assert.ok(target.startsWith(parent) && target.includes('profai-test-vocabulary-browser-'))
    await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
