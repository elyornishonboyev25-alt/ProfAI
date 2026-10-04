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
  const source = `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { MemoryRouter, Routes, Route } from 'react-router-dom';
    import VocabularyActivity from './src/pages/VocabularyActivity';
    import IeltsVocabularyStudio from './src/components/vocab/IeltsVocabularyStudio';
    import { vocabularyCollections } from './src/data/vocabularyCollections';
    import { articles } from './src/data/articles';
    import { addSavedWord } from './src/utils/myVocabularyStore';
    const root = createRoot(document.getElementById('root'));
    const book = vocabularyCollections.ielts[0], test = book.tests[0], section = test.sections[0];
    const base = '/vocabulary/ielts/' + book.id + '/' + test.id + '/' + section.id;
    const sat = vocabularyCollections.sat[0];
    addSavedWord({ ...section.entries[0], context: 'reading', source: 'manual' });
    window.show = (mode = 'picker') => {
      const path = mode === 'studio' ? '/vocabulary/ielts'
        : mode === 'sat-picker' ? '/vocabulary/sat/' + sat.id + '/' + sat.sections[0].id
        : mode === 'article-picker' ? '/vocabulary/articles/' + articles[0].slug
        : mode === 'saved-picker' ? '/vocabulary/my-words/reading/practice'
        : base + (mode === 'picker' ? '' : '/' + mode);
      root.render(<MemoryRouter key={path} initialEntries={[path]}>
        <div className="workspace-main" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <div className="workspace-toolbar" style={{ height: 58, flexShrink: 0 }}>English</div>
          <div className="arena-route"><Routes>
            <Route path="/vocabulary/ielts" element={<IeltsVocabularyStudio />} />
            <Route path="/vocabulary/ielts/:bookId/:testId/:sectionId/:activity?" element={<VocabularyActivity />} />
            <Route path="/vocabulary/sat/:packId/:sectionId" element={<VocabularyActivity />} />
            <Route path="/vocabulary/articles/:articleSlug" element={<VocabularyActivity />} />
            <Route path="/vocabulary/my-words/:wordsContext/practice" element={<VocabularyActivity />} />
          </Routes></div>
        </div>
      </MemoryRouter>);
    };
    window.show();
  `
  const extraFixture = `
    import { TextDetailsButton } from './src/components/vocab/VocabularyDetails';
    window.stressText = 'A longer source extract with every word retained and readable on a small screen. '.repeat(80);
    window.showStress = () => root.render(<TextDetailsButton text={window.stressText} label="Read stress text" />);
  `
  const bundle = await build({ stdin: { contents: source + extraFixture, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, write: false, outfile: 'tmp/vocabulary-fixture.js', format: 'iife', tsconfig: 'tsconfig.json', define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"production"' }, loader: { '.jpg': 'dataurl', '.png': 'dataurl' } })
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
    const viewports = JSON.parse(process.env.VOCABULARY_TEST_VIEWPORTS || '[[1366,900],[1366,768],[1024,640],[920,500],[768,1024],[390,844],[320,568]]')
    for (const [width, height] of viewports) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
      for (const mode of ['picker', 'sat-picker', 'article-picker', 'saved-picker', 'flashcards', 'matching', 'quiz', 'typing', 'studio']) {
        await evaluate('window.show(' + JSON.stringify(mode) + ')')
        await until(mode === 'studio' ? `document.querySelector('nav[aria-label="IELTS vocabulary skills"]')` : `document.querySelector('.vocab-practice[data-mode="${mode.endsWith('picker') ? 'picker' : mode}"]')`)
        await new Promise((resolve) => setTimeout(resolve, 650))
        const layout = await evaluate(`(() => {
          const page = document.querySelector('.vocab-practice') || document.querySelector('.workspace-page');
          const nodes = [...page.querySelectorAll('a,button,input,summary')].filter(n => n.checkVisibility() && !n.closest('[aria-hidden="true"]'));
          const overflowing = nodes.filter(n => { const r=n.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1 || (page.matches('.vocab-practice') && (r.top < -1 || r.bottom > innerHeight + 1)); }).map(n => n.textContent.slice(0,90));
          const last=nodes.at(-1); if(!page.matches('.vocab-practice'))last?.scrollIntoView({block:'center',behavior:'instant'});
          const r=last?.getBoundingClientRect();
          return {horizontal:document.documentElement.scrollWidth<=innerWidth+1 && page.scrollWidth<=page.clientWidth+1, vertical:page.scrollHeight<=page.clientHeight+1, overflowing, reachable:!r || (r.top>=-1 && r.bottom<=innerHeight+1), last:last?.textContent, top:r?.top,bottom:r?.bottom,pageHeight:page.clientHeight,pageScroll:page.scrollHeight,scrollTop:page.scrollTop};
        })()`)
        assert.equal(layout.horizontal, true, `${width} ${mode}: no horizontal overflow ${JSON.stringify(layout)}`)
        if (mode !== 'studio') assert.equal(layout.vertical, true, `${width}x${height} ${mode}: no page scrolling ${JSON.stringify(layout)}`)
        assert.deepEqual(layout.overflowing, [], `${width} ${mode}: controls stay inside viewport`)
        assert.equal(layout.reachable, true, `${width} ${mode}: final control reachable ${JSON.stringify(layout)}`)
        if (width === 1366 || width === 390) {
          await evaluate("(document.querySelector('.vocab-practice')||document.querySelector('.workspace-page')).scrollTop=0;window.scrollTo(0,0)")
          const shot = await send('Page.captureScreenshot', { format: 'png' })
          await writeFile(join(screenshots, `${width}-${mode}.png`), Buffer.from(shot.data, 'base64'))
        }
        if (mode === 'flashcards') {
          await evaluate("document.querySelector('.vocab-flash-card').click()")
          await new Promise((resolve) => setTimeout(resolve, 650))
          assert.equal(await evaluate("document.querySelector('.vocab-flash-back').getAttribute('aria-hidden')"), 'false')
          const flip = await evaluate(`(() => {
            const face=document.querySelector('.vocab-flash-back'),r=face.getBoundingClientRect();
            const x=r.left+r.width/2,y=Math.max(0,r.top)+Math.min(r.height/2,100);
            return {hit:!!document.elementFromPoint(x,y)?.closest('.vocab-flash-back'),scroll:face.scrollHeight>face.clientHeight,height:face.clientHeight,content:face.scrollHeight};
          })()`)
          assert.equal(flip.hit, true, `Back of flashcard is visible and interactive ${width} ${JSON.stringify(flip)}`)
          assert.equal(flip.scroll, false, `${width}: flashcard back does not scroll ${JSON.stringify(flip)}`)
          if (width === 1366 || width === 390) {
            const shot = await send('Page.captureScreenshot', { format: 'png' })
            await writeFile(join(screenshots, `${width}-flashcards-back.png`), Buffer.from(shot.data, 'base64'))
          }
        }
        if (mode === 'typing') assert.equal(await evaluate(`document.querySelectorAll('button[aria-label^="Save "]').length`), 0, 'Typing does not reveal answer')
        if (mode === 'quiz') {
          for (let index = 0; index < 10; index++) {
            await evaluate(`document.querySelector('button[data-letter]').click()`)
            await new Promise((resolve) => setTimeout(resolve, 100))
            const feedback = await evaluate(`(() => {const page=document.querySelector('.vocab-practice'),next=document.querySelector('.vocab-question-footer > button').getBoundingClientRect();return {fit:page.scrollHeight<=page.clientHeight+1,bottom:next.bottom};})()`)
            assert.ok(feedback.fit && feedback.bottom <= height + 1, `${width}: quiz feedback and Next fit without scrolling`)
            await evaluate(`document.querySelector('.vocab-question-footer > button').click()`)
            await new Promise((resolve) => setTimeout(resolve, 50))
          }
          assert.equal(await evaluate(`document.querySelector('.vocab-practice').scrollHeight<=document.querySelector('.vocab-practice').clientHeight+1`), true, `${width}: result screen does not scroll`)
        }
        if (mode.endsWith('picker')) {
          const pickerHeight = await evaluate(`document.querySelector('.vocab-activity-picker').getBoundingClientRect().height`)
          await evaluate(`document.querySelector('.vocab-word-list').click()`)
          await new Promise((resolve) => setTimeout(resolve, 350))
          const library = await evaluate(`(() => {
            const page=document.querySelector('.vocab-practice'), library=document.querySelector('.vocab-inline-library');
            const words=[...library.querySelectorAll('article')],toggle=library.querySelector('.vocab-word-list');
            words.at(-1).scrollIntoView({block:'end',behavior:'instant'});
            const r=words.at(-1).getBoundingClientRect();
            return {count:words.length,expected:Number(toggle.querySelector('.vocab-word-count').textContent),
              expanded:toggle.getAttribute('aria-expanded'),modal:!!document.querySelector('dialog[open]'),
              heights:words.map(word=>word.getBoundingClientRect().height),
              accent:words[0].dataset.accent,pickerHeight:document.querySelector('.vocab-activity-picker').getBoundingClientRect().height,
              horizontal:page.scrollWidth<=page.clientWidth+1,scrollable:page.scrollHeight>page.clientHeight,
              reachable:r.bottom<=innerHeight+1 && r.top>=0,scrollTop:page.scrollTop};
          })()`)
          assert.equal(library.count, library.expected, 'Every word is present in the inline list')
          assert.equal(library.expanded, 'true')
          assert.equal(library.modal, false, 'Vocabulary expands inside the page')
          assert.ok(library.heights.every(cardHeight => cardHeight === 360), 'Cards use the same height as the IELTS/SAT catalog')
          assert.equal(library.accent, mode === 'sat-picker' ? 'blue' : 'red')
          assert.ok(Math.abs(library.pickerHeight - pickerHeight) <= 1, `${width} ${mode}: unfolding preserves activity card sizes ${JSON.stringify(library)}`)
          assert.ok(library.horizontal && library.scrollable && library.reachable && library.scrollTop > 0, `${width} ${mode}: words scroll down without horizontal overflow ${JSON.stringify(library)}`)
          await evaluate(`document.querySelector('.vocab-inline-library').scrollIntoView({block:'start',behavior:'instant'})`)
          await new Promise((resolve) => setTimeout(resolve, 100))
          const actions = await evaluate(`(() => {
            const card=document.querySelector('.vocab-inline-library article'), bounds=card.getBoundingClientRect();
            return [...card.querySelectorAll('button[aria-label]')].every(button=>{
              const r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
              return r.width>0 && r.height>0 && r.left>=bounds.left && r.right<=bounds.right && r.top>=bounds.top && r.bottom<=bounds.bottom && button.contains(hit);
            });
          })()`)
          assert.equal(actions, true, `${width} ${mode}: pronunciation and save controls remain visible and interactive after scrolling`)
          if (width === 1366 || width === 390) {
            const shot = await send('Page.captureScreenshot', { format: 'png' })
            await writeFile(join(screenshots, `${width}-${mode}-expanded.png`), Buffer.from(shot.data, 'base64'))
          }
          await evaluate(`document.querySelector('.vocab-word-list').click()`)
          await new Promise((resolve) => setTimeout(resolve, 350))
          const collapsed = await evaluate(`(() => {const page=document.querySelector('.vocab-practice');return {fit:page.scrollHeight<=page.clientHeight+1,expanded:document.querySelector('.vocab-word-list').getAttribute('aria-expanded'),count:document.querySelectorAll('.vocab-inline-library article').length};})()`)
          assert.deepEqual(collapsed, { fit: true, expanded: 'false', count: 0 }, 'Collapsing returns to a single fitted viewport')
        }
      }
      console.log(`PASS: ${width}x${height} — IELTS/SAT/article/saved-word inline libraries, four activities, catalog, card flip and reachable controls`)
    }
    await evaluate('window.showStress()')
    await until(`document.querySelector('button[aria-label="Read stress text"]')`)
    await evaluate(`document.querySelector('button[aria-label="Read stress text"]').click()`)
    await new Promise((resolve) => setTimeout(resolve, 350))
    let reconstructed = ''
    for (let page = 0; page < 100; page++) {
      const part = await evaluate(`(() => {const dialog=document.querySelector('dialog[open]'),body=dialog.querySelector('.vocab-paged-body'),copy=body.querySelector('.vocab-page-copy');return {text:copy.textContent,fit:copy.offsetHeight<=body.clientHeight+1&&dialog.scrollHeight<=dialog.clientHeight+1,last:dialog.querySelector('button[aria-label="Next meaning page"]').disabled};})()`)
      assert.equal(part.fit, true, 'Long source text page fits without scrolling')
      reconstructed += part.text
      if (part.last) break
      await evaluate(`document.querySelector('dialog[open] button[aria-label="Next meaning page"]').click()`)
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    assert.equal(reconstructed, await evaluate('window.stressText'), 'Pagination retains every character of the long text')
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
    await until(`!document.querySelector('dialog[open]')`)
    console.log('PASS: long source pagination retains all content, no dialog scrolling, Escape closes the dialog')
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
