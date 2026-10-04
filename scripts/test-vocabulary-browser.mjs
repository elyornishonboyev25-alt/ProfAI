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
  const directory = await mkdtemp(join(tmpdir(), 'profai-vocabulary-browser-'))
  const source = "import React from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route}from'react-router-dom';import VocabularyActivity from'./src/pages/VocabularyActivity';import IeltsVocabularyStudio from'./src/components/vocab/IeltsVocabularyStudio';import{vocabularyCollections}from'./src/data/vocabularyCollections';const root=createRoot(document.getElementById('root'));const book=vocabularyCollections.ielts[0],test=book.tests[0],section=test.sections[0];const base='/vocabulary/ielts/'+book.id+'/'+test.id+'/'+section.id;window.show=(mode='picker')=>{const path=mode==='studio'?'/vocabulary/ielts':base+(mode==='picker'?'':'/'+mode);root.render(<MemoryRouter key={path} initialEntries={[path]}><div className=\"workspace-main\" style={{height:'100dvh',display:'flex',flexDirection:'column'}}><div className=\"workspace-toolbar\" style={{height:58,flexShrink:0}}>English</div><div className=\"arena-route\"><Routes><Route path=\"/vocabulary/ielts\" element={<IeltsVocabularyStudio/>}/><Route path=\"/vocabulary/ielts/:bookId/:testId/:sectionId/:activity?\" element={<VocabularyActivity/>}/></Routes></div></div></MemoryRouter>);};window.show();"
  const bundle = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: 'tmp/vocabulary-fixture.js', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
  const styles = await Promise.all(['src/index.css'].map((file) => readFile(file, 'utf8')))
  const css = (await postcss([tailwindcss()]).process(styles[0], { from: 'src/index.css' })).css + '\n' + bundle.outputFiles.filter(f=>f.path.endsWith('.css')).map(f=>f.text).join('\n')
  const server = createServer((req, res) => {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html')
      res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/fixture.js"></script>`)
    } else if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text) }
    else { res.writeHead(404); res.end() }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const browser = spawn(process.env.VOCABULARY_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
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
        if (await evaluate(`Boolean(${expression})`)) return
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      throw new Error(`Timed out: ${expression}; ${await evaluate('document.body.innerText')}`)
    }
    const click = (text) => evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(text)})).click()`)

    const screenshots = resolve('tmp/vocabulary-browser')
    await mkdir(screenshots, { recursive: true })
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/' })
    await until("document.querySelector('.vocab-activity-card')")
    for (const [width, height] of [[1366, 900], [1024, 640], [768, 1024], [390, 844], [320, 568]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
      for (const mode of ['picker', 'flashcards', 'matching', 'quiz', 'typing', 'studio']) {
        await evaluate('window.show(' + JSON.stringify(mode) + ')')
        await until(mode === 'studio' ? `document.querySelector('nav[aria-label="IELTS vocabulary skills"]')` : `document.querySelector('.vocab-practice[data-mode="${mode}"]')`)
        await new Promise((resolve) => setTimeout(resolve, 650))
        const layout = await evaluate(`(() => {
          const page = document.querySelector('.vocab-practice') || document.querySelector('.workspace-page');
          const nodes = [...page.querySelectorAll('a,button,input,summary')].filter(n => n.checkVisibility() && !n.closest('[aria-hidden="true"]'));
          const overflowing = nodes.filter(n => { const r=n.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(n => n.textContent.slice(0,90));
          const last=nodes.at(-1); last?.scrollIntoView({block:'center',behavior:'instant'});
          const r=last?.getBoundingClientRect();
          return {horizontal:document.documentElement.scrollWidth<=innerWidth+1 && page.scrollWidth<=page.clientWidth+1, overflowing, reachable:!r || (r.top>=-1 && r.bottom<=innerHeight+1), last:last?.textContent, top:r?.top,bottom:r?.bottom,pageHeight:page.clientHeight,pageScroll:page.scrollHeight,scrollTop:page.scrollTop};
        })()`)
        assert.equal(layout.horizontal, true, `${width} ${mode}: no horizontal overflow ${JSON.stringify(layout)}`)
        assert.deepEqual(layout.overflowing, [], `${width} ${mode}: controls stay inside viewport`)
        assert.equal(layout.reachable, true, `${width} ${mode}: final control reachable ${JSON.stringify(layout)}`)
        if (width === 1366 || width === 390) {
          await evaluate("(document.querySelector('.vocab-practice')||document.querySelector('.workspace-page')).scrollTop=0;window.scrollTo(0,0)")
          const shot = await send('Page.captureScreenshot', { format: 'png' })
          await writeFile(join(screenshots, `${width}-${mode}.png`), Buffer.from(shot.data, 'base64'))
        }
        if (mode === 'flashcards') {
          await evaluate("document.querySelector('.vocab-flash-card').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('.vocab-flash-card').click()")
          await new Promise((resolve) => setTimeout(resolve, 650))
          assert.equal(await evaluate("document.querySelector('.vocab-flash-back').getAttribute('aria-hidden')"), 'false')
          const flip = await evaluate(`(() => {
            const face=document.querySelector('.vocab-flash-back'),r=face.getBoundingClientRect();
            const x=r.left+r.width/2,y=Math.max(0,r.top)+Math.min(r.height/2,100);
            return {hit:!!document.elementFromPoint(x,y)?.closest('.vocab-flash-back'),scroll:face.scrollHeight>face.clientHeight};
          })()`)
          assert.equal(flip.hit, true, `Back of flashcard is visible and interactive ${width} ${JSON.stringify(flip)}`)
          if (width === 1366 || width === 390) {
            const shot = await send('Page.captureScreenshot', { format: 'png' })
            await writeFile(join(screenshots, `${width}-flashcards-back.png`), Buffer.from(shot.data, 'base64'))
          }
        }
        if (mode === 'typing') assert.equal(await evaluate(`document.querySelectorAll('button[aria-label^="Save "]').length`), 0, 'Typing does not reveal answer')
        if (mode === 'picker') {
          await evaluate(`document.querySelector('.vocab-word-list').open=true`)
          await new Promise((resolve) => setTimeout(resolve, 350))
          const library = await evaluate(`(() => {
            const words=[...document.querySelectorAll('.vocab-word-list article')],last=words.at(-1);
            last.scrollIntoView({block:'end',behavior:'instant'});const r=last.getBoundingClientRect();
            return {count:words.length,bottom:r.bottom,width:document.querySelector('.vocab-practice').scrollWidth};
          })()`)
          assert.equal(library.count, 20, 'Expanded library retains all words')
          assert.ok(library.bottom <= height + 1, `${width}: final library word reachable`)
          assert.ok(library.width <= width, `${width}: expanded library does not overflow horizontally`)
        }
      }
      console.log(`PASS: ${width}x${height} — picker, four activities, catalog, card flip and reachable controls`)
    }
    await send('Browser.close').catch(() => {})

  } finally {
    socket?.close(); browser.kill(); await exited
    await new Promise((resolve) => server.close(resolve))
    const target = resolve(directory), parent = resolve(tmpdir()) + sep
    assert.ok(target.startsWith(parent) && target.includes('profai-vocabulary-browser-'))
    await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
