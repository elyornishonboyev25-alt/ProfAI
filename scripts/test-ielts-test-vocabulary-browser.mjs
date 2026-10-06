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
    import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
    import IELTSReadingInterface from './src/components/IELTSReadingInterface';
    import IELTSWritingFullTestInterface from './src/components/IELTSWritingFullTestInterface';
    import IELTSSpeakingTest from './src/pages/IELTSSpeakingTest';
    import TestVocabulary from './src/components/vocab/TestVocabulary';
    import IeltsVocabularyStudio from './src/components/vocab/IeltsVocabularyStudio';
    import VocabularyActivity from './src/pages/VocabularyActivity';
    import { resolveIeltsTestById } from './src/utils/ieltsTestCatalog';
    import { getWritingFullTestCatalog } from './src/data/writingTestData';
    const root = createRoot(document.getElementById('root'));
    window.show = (skill, review = false) => {
      const id = skill === 'listening' ? 'ielts-listening-1' : skill === 'reading' ? 'reading-roadmap-full-1' : skill + '-full-1';
      const path = skill === 'listening' || skill === 'reading' ? '/test/' + skill + '/' + id : '/ielts/' + skill + '/test/' + id;
      history.replaceState({}, '', path);
      const test = resolveIeltsTestById(skill === 'listening' ? 'ielts-listening-1' : 'reading-roadmap-full-1');
      const payload = review ? { result: { testId: test.id, answers: {}, score: 0, totalQuestions: 40, correctAnswers: 0, completedAt: new Date().toISOString() } } : undefined;
      root.render(<MemoryRouter key={skill + review} initialEntries={[path]}>
        {skill === 'speaking' ? <Routes><Route path='/ielts/speaking/test/:id' element={<IELTSSpeakingTest />} /></Routes>
          : skill === 'writing' ? <IELTSWritingFullTestInterface fullTest={getWritingFullTestCatalog()[0]} onExit={() => {}} />
          : <IELTSReadingInterface test={test} onComplete={() => {}} onExit={() => {}} reviewPayload={payload} />}
      </MemoryRouter>);
    };
    if (location.pathname.startsWith('/vocabulary/ielts')) {
      root.render(<BrowserRouter><Routes>
        <Route path='/vocabulary/ielts' element={<IeltsVocabularyStudio />} />
        <Route path='/vocabulary/ielts/:bookId/:testId/:sectionId' element={<VocabularyActivity />} />
        <Route path='/vocabulary/ielts/:bookId/:testId/:sectionId/:activity' element={<VocabularyActivity />} />
      </Routes></BrowserRouter>);
    } else window.show(location.pathname.includes('/speaking/') ? 'speaking' : location.pathname.includes('/writing/') ? 'writing' : location.pathname.includes('/reading/') ? 'reading' : 'listening');
    window.showVocabularyCard = (skill, ready = true) => {
      const ids = { listening: 'ielts-listening-1', reading: 'reading-roadmap-full-1', writing: 'writing-full-1', speaking: 'speaking-full-1' };
      root.render(<MemoryRouter><div style={{width: 300, margin: 10}}><TestVocabulary testId={ids[skill]} variant='review' ready={ready} /></div></MemoryRouter>);
    };
    window.showReturnFixture = (skill) => {
      const ids = { listening: 'ielts-listening-1', reading: 'reading-roadmap-full-1', writing: 'writing-full-1', speaking: 'speaking-full-1' };
      const path = (skill === 'listening' || skill === 'reading' ? '/test/' + skill + '/' : '/ielts/' + skill + '/test/') + ids[skill] + '?assignmentId=lesson-1#setup';
      history.replaceState({}, '', path);
      root.render(<MemoryRouter key={skill} initialEntries={[path]}><input id='draft-answer' defaultValue='Keep my answer' /><TestVocabulary testId={ids[skill]} variant='link' /></MemoryRouter>);
    };
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
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const requestId = ++id
      const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(method)) }, 15000)
      pending.set(requestId, { resolve, reject, timeout })
      socket.send(JSON.stringify({ id: requestId, method, params, sessionId }))
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
        await evaluate(`(() => {localStorage.clear();sessionStorage.clear();window.vocabularyEntry = null;
          const entryObserver = new MutationObserver(() => {
            const group = document.querySelector('[data-test-vocabulary="reminder"]');
            if (!group) return;
            window.vocabularyEntry = {
              opacity: Number(getComputedStyle(group).opacity),
              together: [...group.querySelectorAll('aside, .test-vocab-word, .test-vocab-cta')].every(element => getComputedStyle(element).opacity === '1'),
            };
            entryObserver.disconnect();
          });
          entryObserver.observe(document.getElementById('root'), {childList: true, subtree: true});
          window.show('${skill}');})()`)
        await until('document.querySelector(\'[data-test-vocabulary="link"] a\')')
        await until('document.querySelector(\'[data-test-vocabulary="reminder"] aside\')')
        await new Promise((resolve) => setTimeout(resolve, skill === 'speaking' ? 2700 : 750))
        if (skill === 'speaking') await until("!document.body.textContent.includes('Preparing your Speaking test')")
        const entry = await evaluate('window.vocabularyEntry')
        assert.ok(entry && entry.opacity < 1 && entry.together, `${width} ${skill}: the notification and its contents enter together ${JSON.stringify(entry)}`)
        const layout = await evaluate(`(() => {
          const anchors = [...document.querySelectorAll('[data-test-vocabulary] a')];
          const horizontal = document.documentElement.scrollWidth <= innerWidth + 1 && anchors.every(a => {const r=a.getBoundingClientRect();return r.left>=-1 && r.right<=innerWidth+1;});
          const last = document.querySelector('[data-test-vocabulary="link"] a');last.scrollIntoView({block:'center',behavior:'instant'});
          const r=last.getBoundingClientRect();
          const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
          const card=document.querySelector('[data-test-vocabulary="reminder"] aside');
          const banner = card.closest('[data-test-vocabulary]'), modes = banner.nextElementSibling;
          const b=card.getBoundingClientRect(),m=modes.getBoundingClientRect();
          const inPlace = getComputedStyle(banner).position === 'static' && b.bottom <= m.top + 1 && Math.abs(b.left - m.left) <= 5 && Math.abs(b.width - m.width) <= 9;
          return {horizontal,inPlace,reachable:r.top>=-1 && r.bottom<=innerHeight+1 && last.contains(hit),href:last.getAttribute('href'),reminder:!!card,cardHeight:b.height,opacity:getComputedStyle(banner).opacity,top:r.top,bottom:r.bottom,hit:hit?.outerHTML.slice(0,250),scroll:document.scrollingElement.scrollTop,height:document.scrollingElement.scrollHeight};
        })()`)
        assert.equal(layout.horizontal, true, `${width} ${skill}: no horizontal overflow`)
        if (!layout.reachable) { const shot = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(join(screenshots, `${width}-${skill}-failure.png`), Buffer.from(shot.data, 'base64')) }
        assert.equal(layout.reachable, true, `${width} ${skill}: vocabulary CTA is reachable ${JSON.stringify(layout)}`)
        const vocabularyUrl = new URL(layout.href, 'http://localhost')
        assert.equal(vocabularyUrl.pathname, '/vocabulary/ielts')
        assert.equal(vocabularyUrl.searchParams.get('skill'), skill)
        assert.equal(vocabularyUrl.searchParams.get('test'), '1')
        assert.ok(vocabularyUrl.searchParams.get('returnTo').endsWith(skill === 'listening' ? 'ielts-listening-1' : skill === 'reading' ? 'reading-roadmap-full-1' : `${skill}-full-1`))
        assert.equal(layout.reminder, true)
        assert.equal(layout.inPlace, true, `${width} ${skill}: full-width banner stays above the mode cards`)
        assert.ok(layout.cardHeight <= (width >= 768 ? 145 : 245), `${width} ${skill}: reminder stays slim (${layout.cardHeight}px)`)
        assert.equal(layout.opacity, '1', 'Entry animation finishes with a readable card')
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
        await new Promise((resolve) => setTimeout(resolve, 750))
        const layout = await evaluate(`(() => {const card=document.querySelector('[data-test-vocabulary="review"]'),a=card.querySelector('a'),r=a.getBoundingClientRect();return {horizontal:card.scrollWidth<=card.clientWidth+1,visible:r.top>=0 && r.bottom<=innerHeight,radius:parseFloat(getComputedStyle(card.querySelector('aside')).borderRadius),questions:document.querySelector('#test-main-container').getBoundingClientRect().height};})()`)
        assert.ok(layout.horizontal && layout.visible && layout.questions > 100, `${width} ${skill}: review vocabulary and test panels fit ${JSON.stringify(layout)}`)
        assert.ok(layout.radius >= 24, 'Review card uses rounded corners')
        const shot = await send('Page.captureScreenshot', { format: 'png' })
        await writeFile(join(screenshots, `${width}-${skill}-review.png`), Buffer.from(shot.data, 'base64'))
      }
      console.log(`PASS: ${width}x${height}, four slim inline banners, synchronized entry, dismissal and compact review`)
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false })
    await evaluate("window.showVocabularyCard('speaking', false)")
    await until('!document.querySelector(\'[data-test-vocabulary]\')')
    await evaluate("window.showVocabularyCard('speaking')")
    await until('document.querySelector(\'[data-test-vocabulary="review"] aside\')')
    assert.ok(await evaluate("Number(getComputedStyle(document.querySelector('.test-vocab-card')).opacity) < 1"), 'Card enters with an animation after the screen is ready')
    for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
      await evaluate(`window.showVocabularyCard('${skill}')`)
      await new Promise((resolve) => setTimeout(resolve, 750))
      const layout = await evaluate(`(() => {const card=document.querySelector('.test-vocab-card'),r=card.getBoundingClientRect(),a=card.querySelector('a').getBoundingClientRect();return {fits:card.scrollWidth<=card.clientWidth+1 && a.left>=r.left && a.right<=r.right,rounded:parseFloat(getComputedStyle(card).borderRadius)>=28,href:card.querySelector('a').getAttribute('href')};})()`)
      assert.ok(layout.fits && layout.rounded, `${skill}: rounded review adapts to a narrow sidebar ${JSON.stringify(layout)}`)
      const vocabularyUrl = new URL(layout.href, 'http://localhost')
      assert.equal(vocabularyUrl.searchParams.get('skill'), skill)
      assert.equal(vocabularyUrl.searchParams.get('test'), '1')
      assert.ok(vocabularyUrl.searchParams.get('returnTo'))
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      await writeFile(join(screenshots, `sidebar-${skill}-review.png`), Buffer.from(shot.data, 'base64'))
    }
    for (const skill of ['listening', 'reading', 'writing', 'speaking']) {
      await evaluate(`window.showReturnFixture('${skill}')`)
      await until('document.querySelector(\'[data-test-vocabulary="link"] a\')')
      const returnTo = await evaluate('location.pathname + location.search + location.hash')
      const existing = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).map((target) => target.id)
      await send('Runtime.evaluate', { expression: `document.querySelector('[data-test-vocabulary="link"] a').click()`, userGesture: true })
      let popup
      for (let n = 0; n < 100; n++) {
        popup = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((target) => target.type === 'page' && !existing.includes(target.id))
        if (popup) break
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      assert.ok(popup, `${skill}: vocabulary opens in a new tab`)
      const { sessionId } = await send('Target.attachToTarget', { targetId: popup.id, flatten: true })
      const popupEvaluate = async (expression) => {
        const result = await send('Runtime.evaluate', { expression, returnByValue: true, userGesture: true }, sessionId)
        assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails))
        return result.result.value
      }
      const popupUntil = async (expression) => {
        for (let n = 0; n < 100; n++) {
          if (await popupEvaluate(`Boolean(${expression})`)) return
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
        throw new Error(`${skill}: popup timed out: ${expression}`)
      }
      await popupUntil('document.querySelector("[data-vocabulary-test-return]")')
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }, sessionId)
      await new Promise((resolve) => setTimeout(resolve, 750))
      const returnLayout = await popupEvaluate(`(() => {const a=document.querySelector('[data-vocabulary-test-return]'),r=a.getBoundingClientRect();return {fits:document.documentElement.scrollWidth<=innerWidth+1 && r.left>=0 && r.right<=innerWidth,visible:r.top>=0 && r.bottom<=innerHeight};})()`)
      assert.ok(returnLayout.fits && returnLayout.visible, `${skill}: return button remains visible on mobile ${JSON.stringify(returnLayout)}`)
      const popupShot = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
      await writeFile(join(screenshots, `390-${skill}-vocabulary-return.png`), Buffer.from(popupShot.data, 'base64'))
      assert.equal(await popupEvaluate('document.querySelector("[data-vocabulary-test-return]").getAttribute("href")'), returnTo)
      assert.equal(await popupEvaluate('!!window.opener'), true, 'The same-origin test tab is available for return')
      await popupEvaluate(`[...document.querySelectorAll('a')].find(a => a.textContent === 'Practise this set').click()`)
      await popupUntil('document.querySelector(".vocab-activity-picker")')
      await popupEvaluate(`[...document.querySelectorAll('a')].find(a => a.pathname.endsWith('/flashcards')).click()`)
      await popupUntil('location.pathname.endsWith("/flashcards")')
      await send('Page.reload', {}, sessionId)
      await popupUntil('document.querySelector("[data-vocabulary-test-return]")')
      assert.equal(await popupEvaluate('document.querySelector("[data-vocabulary-test-return]").getAttribute("href")'), returnTo, 'Return survives drill navigation and reload')
      await popupEvaluate('document.querySelector("[data-vocabulary-test-return]").click()')
      for (let n = 0; n < 100; n++) {
        if (!(await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).some((target) => target.id === popup.id)) { popup = null; break }
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      assert.equal(popup, null, `${skill}: return closes vocabulary and reuses the test tab`)
      assert.equal(await evaluate('document.querySelector("#draft-answer").value'), 'Keep my answer', 'Return preserves the original test state')
    }
    console.log('PASS: all four skills return from vocabulary drills to their original tab with answers intact, including after reload')
    await evaluate("window.showVocabularyCard('speaking')")
    await until('document.querySelector(\'[data-test-vocabulary="review"] aside\')')
    await evaluate("document.documentElement.dataset.effects='reduced';window.dispatchEvent(new Event('profai:effects-changed'))")
    await until('!document.querySelector(\'.test-vocab-presence\')')
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.test-vocab-card')).opacity"), '1', 'Reduced effects show the card immediately')
    console.log('PASS: deferred animated entry, rounded review in narrow sidebars and reduced effects')
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
